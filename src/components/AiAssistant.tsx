import { Button, Textarea } from '@nextui-org/react'
import { useMemo, useState } from 'react'
import { fetchIntegration, fetchIntegrationAction, fetchIntegrationTrigger } from './services/chainjet.service'
import { getInputDependencies, resolveInstruction } from '@/utils/ai.utils'
import { OPERATIONS, Operation } from '@/constants/operations'
import { useAccount } from 'wagmi'
import { Instruction } from '@/types/instruction'
import { Integration } from '@/types/integration'
import { IntegrationOperation } from '@/types/integration-operation'
import AuthenticationModal from './auth/AuthenticationModal'

interface InstructionData {
  instruction: Instruction
  operation: Operation
  integration: Integration
  integrationOperation: IntegrationOperation
  dependencies: {
    auth?: boolean
    inputs?: string[]
  }
}

export default function AiAssistant() {
  const { address } = useAccount()
  const [value, setValue] = useState('')
  const [promptLoading, setPromptLoading] = useState(false)
  const [workflowLoading, setWorkflowLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [unparsedInstructions, setUnparsedInstructions] = useState<string[] | null>(null)
  const [dependenciesFullfilled, setDependenciesFullfilled] = useState(false)
  const [instructionData, setInstructionData] = useState<InstructionData[] | null>(null)
  const [authModalOpen, setAuthModalOpen] = useState(false)

  const withAuthNeeded = useMemo(
    () => instructionData?.filter((item) => item.dependencies.auth) ?? [],
    [instructionData],
  )

  console.log(`withAuthNeeded:`, withAuthNeeded)

  const handleSubmit = async () => {
    setPromptLoading(true)
    try {
      // const res = await axios.post('/api/chat', { text: value, address })
      // const unparsedInstructions: string[] = res.data?.data
      //   ?.split('\n')
      //   .map((ins: string) => ins.trim())
      //   .filter((ins: string) => !!ins)

      // instructions returned by GPT-4
      const unparsedInstructions = [
        'mirror.newPost({{input.address}})',
        'openai.sendPrompt("summarize {{0.title}}: {{0.url}} {{0.body}}")',
        'lens.createPost({{1.response}})',
        'twitter.sendTweet({{1.response}})',
      ]
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
      let allDependenciesFullfilled = true
      for (const instructionItem of instructionsData) {
        if (instructionItem.operation.requiresCredentials) {
          instructionItem.dependencies.auth = true
          allDependenciesFullfilled = false
        }
        const inputDependencies = getInputDependencies(instructionItem.instruction.inputs)
        if (inputDependencies.length) {
          instructionItem.dependencies.inputs = inputDependencies
          allDependenciesFullfilled = false
        }
      }
      console.log('allDependenciesFullfilled:', allDependenciesFullfilled)

      setInstructionData(instructionsData)
      setDependenciesFullfilled(allDependenciesFullfilled)
    } catch (e) {
      console.error('Error:', (e as Error).message)
      setError((e as Error).message)
    }
    setPromptLoading(false)
    // await createWorkflow('')
  }

  const createWorkflow = async () => {
    if (!unparsedInstructions) {
      return
    }
    setWorkflowLoading(true)
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
      (operation) => operation.integration === integrations[0].key && operation.operationKey === integrationTriggerKey,
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
    let allDependenciesFullfilled = true
    for (const instructionItem of instructionsData) {
      if (instructionItem.operation.requiresCredentials) {
        instructionItem.dependencies.auth = true
        allDependenciesFullfilled = false
      }
      const inputDependencies = getInputDependencies(instructionItem.instruction.inputs)
      if (inputDependencies.length) {
        instructionItem.dependencies.inputs = inputDependencies
        allDependenciesFullfilled = false
      }
    }
    console.log('allDependenciesFullfilled:', allDependenciesFullfilled)

    setInstructionData(instructionsData)
    setDependenciesFullfilled(allDependenciesFullfilled)

    // TODO
    // console.log(`Creating workflow...`)
    // const workflow = await createOneWorkflow('AI Workflow')
    // console.log(`Created workflow ${workflow.id}`)
    // const triggerInputs = resolveInputs(triggerOperation!, instructions[0].inputs)
    // console.log(`Creating workflow trigger for integration ${integrationTrigger.id} with inputs:`, triggerInputs)
    // const res = await createOneWorkflowTrigger(workflow.id, integrationTrigger.id, triggerInputs)
    // console.log(`Created workflow trigger ${res.id}`)
    // let previousActionId: null | string = null
    // for (let i = 0; i < integrationActions.length; i++) {
    //   const actionInputs = resolveInputs(actionOperations[i]!, instructions[i + 1].inputs)
    //   console.log(
    //     `Creating workflow action for integration ${integrationActions[i].id} with inputs:`,
    //     actionInputs,
    //     previousActionId,
    //   )
    //   const res = await createOneWorkflowAction(workflow.id, integrationActions[i].id, actionInputs, previousActionId)
    //   console.log(`Created workflow action ${res.id}`)
    //   previousActionId = res.id
    // }
    // setWorkflowLoading(false)
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
        <Button onClick={handleSubmit}>{promptLoading ? 'Loading...' : 'Do Magic 🤖'}</Button>
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
          {withAuthNeeded?.length && (
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
                  onComplete={() => {}}
                  onCancel={() => setAuthModalOpen(false)}
                />
              )}
            </div>
          )}
          {dependenciesFullfilled && (
            <Button className="mt-4" onClick={createWorkflow}>
              {workflowLoading ? 'Loading...' : 'Create Workflow'}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
