import { Button, Textarea } from '@nextui-org/react'
import { useMemo, useState } from 'react'
import {
  createOneWorkflow,
  createOneWorkflowAction,
  createOneWorkflowTrigger,
  fetchIntegration,
  fetchIntegrationAction,
  fetchIntegrationTrigger,
} from './services/chainjet.service'
import { getInputDependencies, resolveInputs, resolveInstruction } from '@/utils/ai.utils'
import { OPERATIONS } from '@/constants/operations'
import { useAccount } from 'wagmi'
import { Integration } from '@/types/integration'
import AuthenticationModal from './auth/AuthenticationModal'
import InputsModal from './InputsModal'
import { InstructionData } from '@/types/instruction-data'
import axios from 'axios'
import _ from 'lodash'
import { Workflow } from '@/types/workflow'

export default function AiAssistant() {
  const { address } = useAccount()
  const [value, setValue] = useState('')
  const [promptLoading, setPromptLoading] = useState(false)
  const [workflowLoading, setWorkflowLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [unparsedInstructions, setUnparsedInstructions] = useState<string[] | null>(null)
  const [instructionsData, setInstructionData] = useState<InstructionData[] | null>(null)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [inputsModalOpen, setInputsModalOpen] = useState(false)
  const [selectedAccounts, setSelectedAccounts] = useState<Record<string, string>>({})
  const [selectedInputs, setSelectedInputs] = useState<Record<string, Record<string, string>>>({})
  const [createdWorkflow, setCreatedWorkflow] = useState<Workflow | null>(null)

  const withAuthNeeded = useMemo(
    () =>
      _.uniqBy(
        instructionsData?.filter((item) => item.dependencies.auth && !selectedAccounts[item.integration.key]) ?? [],
        (item) => item.integration.key,
      ),
    [instructionsData, selectedAccounts],
  )
  const withInputsNeeded = useMemo(
    () =>
      instructionsData?.filter(
        (item) => item.dependencies.inputs?.filter((input) => !selectedInputs[item.integration.key]?.[input])?.length,
      ) ?? [],
    [instructionsData, selectedInputs],
  )
  const dependenciesFullfilled = useMemo(
    () => !withAuthNeeded.length && !withInputsNeeded.length,
    [withAuthNeeded.length, withInputsNeeded.length],
  )

  const handleDoMagic = async () => {
    setPromptLoading(true)
    setCreatedWorkflow(null)
    try {
      const res = await axios.post('/api/chat', { text: value, address })
      const unparsedInstructions: string[] = res.data?.data
        ?.split('\n')
        .map((ins: string) => ins.trim())
        .filter((ins: string) => !!ins)

      // instructions returned by GPT-4
      // const unparsedInstructions = [
      //   'mirror.newPost({{input.address}})',
      //   'openai.sendPrompt("summarize {{0.title}}: {{0.url}} {{0.body}}")',
      //   'lens.createPost({{1.response}})',
      //   'twitter.sendTweet({{1.response}})',
      // ]
      setUnparsedInstructions(unparsedInstructions)

      const instructions = unparsedInstructions.map((instruction) => resolveInstruction(instruction))
      const integrationKeys = [...new Set(instructions.map((instruction) => instruction.integration))]
      const integrations: Integration[] = []
      const instructionsData: InstructionData[] = []

      // get instruction data for the trigger
      for (const integrationKey of integrationKeys) {
        const integration = await fetchIntegration(integrationKey)
        integrations.push(integration)
      }
      const integrationTriggerKey = instructions[0].operationKey
      const triggerOperation = OPERATIONS.find(
        (operation) =>
          operation.integration === integrations[0].key && operation.operationKey === integrationTriggerKey,
      )
      if (!triggerOperation) {
        setError(`Operation not found for ${integrations[0].key} ${integrationTriggerKey}`)
        return
      }
      const integrationTrigger = await fetchIntegrationTrigger(
        integrations[0].id,
        triggerOperation!.mapOperationKey ?? triggerOperation.operationKey,
      )
      instructionsData.push({
        instruction: instructions[0],
        operation: triggerOperation,
        integration: integrations[0],
        integrationOperation: integrationTrigger,
        dependencies: {},
      })

      // get instruction data for the actions
      const integrationActions = []
      const actionOperations = []
      for (const instruction of instructions.slice(1)) {
        const integration = integrations.find((integration) => integration.key === instruction.integration)
        if (!integration) {
          setError(`Integration not found for ${instruction.integration}`)
          return
        }
        const integrationActionKey = instruction.operationKey
        const actionOperation = OPERATIONS.find(
          (operation) => operation.integration === integration!.key && operation.operationKey === integrationActionKey,
        )
        if (!actionOperation) {
          setError(`Operation not found for ${instruction.integration} ${instruction.operationKey}`)
          return
        }
        actionOperations.push(actionOperation)
        const integrationAction = await fetchIntegrationAction(
          integration!.id,
          actionOperation!.mapOperationKey ?? actionOperation.operationKey,
        )
        integrationActions.push(integrationAction)
        instructionsData.push({
          instruction,
          operation: actionOperation,
          integration,
          integrationOperation: integrationAction,
          dependencies: {},
        })
      }
      console.log('integrationActions:', integrationActions)

      // record unfufilled dependencies
      for (const instructionItem of instructionsData) {
        if (instructionItem.operation.requiresCredentials) {
          instructionItem.dependencies.auth = true
        }
        const inputDependencies = getInputDependencies(instructionItem.operation, instructionItem.instruction.inputs)
        if (inputDependencies.length) {
          instructionItem.dependencies.inputs = inputDependencies
        }
      }
      setInstructionData(instructionsData)
    } catch (e) {
      console.error('Error:', (e as Error).message)
      setError((e as Error).message)
    }
    setPromptLoading(false)
  }

  const createWorkflow = async () => {
    setWorkflowLoading(true)
    setCreatedWorkflow(null)

    // create workflow
    const workflow = await createOneWorkflow('AI Workflow')
    console.log(`Created workflow ${workflow.id}`)

    // create trigger
    const triggerInstructionData = instructionsData![0]
    const triggerInputs = resolveInputs(
      triggerInstructionData.operation,
      triggerInstructionData.instruction.inputs,
      selectedInputs[triggerInstructionData.integration.key] ?? {},
    )
    console.log(`Creating trigger with inputs:`, triggerInputs)
    const res = await createOneWorkflowTrigger(
      workflow.id,
      triggerInstructionData.integrationOperation.id,
      triggerInputs,
      selectedAccounts[triggerInstructionData.integration.key] ?? null,
    )
    console.log(`Created workflow trigger ${res.id}`)

    // create actions
    let previousActionId: null | string = null
    for (const instructionItem of instructionsData!.slice(1)) {
      const actionInputs = resolveInputs(
        instructionItem.operation,
        instructionItem.instruction.inputs,
        selectedInputs[instructionItem.integration.key] ?? {},
        previousActionId ?? 'trigger',
      )
      console.log(`Creating action with inputs:`, actionInputs)
      const res = await createOneWorkflowAction(
        workflow.id,
        instructionItem.integrationOperation.id,
        actionInputs,
        previousActionId,
        selectedAccounts[instructionItem.integration.key] ?? null,
      )
      console.log(`Created workflow action ${res.id}`)
      previousActionId = res.id
    }

    setCreatedWorkflow(workflow)
    setWorkflowLoading(false)
  }

  return (
    <div className="max-w-2xl m-auto">
      <div className="mb-2">
        <p>What do you want to build?</p>
      </div>
      <div className="mb-4">
        <Textarea
          fullWidth
          placeholder="Enter your amazing idea."
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </div>
      <div className="">
        <Button onClick={handleDoMagic}>{promptLoading ? 'Loading...' : 'Do Magic 🤖'}</Button>
      </div>
      {unparsedInstructions?.length && !promptLoading && (
        <div className="mt-8">
          <div>
            <code>
              {unparsedInstructions.map((instruction, index) => (
                <div key={index}>{instruction}</div>
              ))}
            </code>
          </div>
          {!!withAuthNeeded?.length && (
            <div className="mt-4">
              <code>
                {withAuthNeeded.map((instruction, index) => (
                  <div key={index}>
                    <strong>{instruction.integration.name}</strong> needs authentication.
                  </div>
                ))}
              </code>
              <Button className="mt-4" onClick={() => setAuthModalOpen(true)}>
                {workflowLoading ? 'Loading...' : 'Start Authentication'}
              </Button>
              {authModalOpen && (
                <AuthenticationModal
                  integrations={withAuthNeeded.map((item) => item.integration)}
                  open
                  onComplete={(selectedAccounts) => {
                    setSelectedAccounts(selectedAccounts)
                    setAuthModalOpen(false)
                  }}
                  onCancel={() => setAuthModalOpen(false)}
                />
              )}
            </div>
          )}
          {!!withInputsNeeded?.length && (
            <div className="mt-4">
              <code>
                {withInputsNeeded.map((instruction, index) => (
                  <div key={index}>
                    <strong>{instruction.integration.name}</strong> needs {instruction.dependencies.inputs!.length}{' '}
                    extra inputs: {instruction.dependencies.inputs!.join(', ')}.
                  </div>
                ))}
              </code>
              <Button className="mt-4" onClick={() => setInputsModalOpen(true)}>
                {workflowLoading ? 'Loading...' : 'Add Inputs'}
              </Button>
              {inputsModalOpen && (
                <InputsModal
                  instructionsData={withInputsNeeded}
                  open
                  onComplete={(selectedInputs) => {
                    setSelectedInputs(selectedInputs)
                    setInputsModalOpen(false)
                  }}
                  onCancel={() => setInputsModalOpen(false)}
                />
              )}
            </div>
          )}
          {dependenciesFullfilled && (
            <Button className="mt-4" onClick={createWorkflow}>
              {workflowLoading ? 'Loading...' : 'Create Workflow'}
            </Button>
          )}
          {createdWorkflow && (
            <div className="mt-8">
              <code>
                🎉 Workflow created successfully:{' '}
                <a href={`https://chainjet.io/workflows/${createdWorkflow.id}`} target="_blank" rel="noreferrer">
                  https://chainjet.io/workflows/{createdWorkflow.id}
                </a>
              </code>
            </div>
          )}
        </div>
      )}
      {error && <div className="mt-4 text-red-500">{error}</div>}
    </div>
  )
}
