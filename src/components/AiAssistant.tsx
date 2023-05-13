import { Button, Loading, Textarea } from '@nextui-org/react'
import axios from 'axios'
import { useState } from 'react'
import {
  createOneWorkflow,
  createOneWorkflowAction,
  createOneWorkflowTrigger,
  fetchIntegration,
  fetchIntegrationAction,
  fetchIntegrationTrigger,
} from './services/chainjet.service'
import { resolveInputs, resolveInstruction } from '@/utils/ai.utils'
import { OPERATIONS } from '@/constants/operations'

export default function AiAssistant() {
  const [value, setValue] = useState('')
  const [promptLoading, setPromptLoading] = useState(false)
  const [workflowLoading, setWorkflowLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [instructions, setInstructions] = useState<string[] | null>(null)

  const handleSubmit = async () => {
    setPromptLoading(true)
    try {
      // const res = await axios.post('/api/chat', { text: value })
      // const instructions = res.data?.data
      //   ?.split('\n')
      //   .map((ins: string) => ins.trim())
      //   .filter((ins: string) => !!ins)

      // instructions returned by GPT-4
      const instructions = [
        'mirror.newPost(lensprotocol.eth)', // TODO
        // 'mirror.newPost({{input.address}})', // TODO
        'openai.sendPrompt("summarize {{0.title}}: {{0.url}} {{0.body}}")',
        'lens.createPost({{1.response}})',
        'twitter.sendTweet({{1.response}})',
      ]
      setInstructions(instructions)
    } catch (e) {
      console.error('Error:', (e as Error).message)
      setError((e as Error).message)
    }
    setPromptLoading(false)
    // await createWorkflow('')
  }

  const createWorkflow = async () => {
    if (!instructions) {
      return
    }
    setWorkflowLoading(true)
    const resolvedInstructions = instructions.map((instruction) => resolveInstruction(instruction))
    const integrationKeys = [...new Set(resolvedInstructions.map((instruction) => instruction.integration))]
    const integrations: any[] = []
    for (const integrationKey of integrationKeys) {
      const integration = await fetchIntegration(integrationKey)
      integrations.push(integration)
    }
    const integrationTriggerKey = resolvedInstructions[0].operationKey
    const triggerOperation = OPERATIONS.find(
      (operation) => operation.integration === integrations[0].key && operation.operationKey === integrationTriggerKey,
    )
    if (!triggerOperation) {
      console.log(`Operation not found for ${integrations[0].key} ${integrationTriggerKey}`)
    }
    const integrationTrigger = await fetchIntegrationTrigger(
      integrations[0].id,
      triggerOperation!.mapOperationKey ?? triggerOperation!.operationKey,
    )
    const integrationActions = []
    const integrationActionOperations = []
    for (const instruction of resolvedInstructions.slice(1)) {
      const integration = integrations.find((integration) => integration.key === instruction.integration)
      const integrationActionKey = instruction.operationKey
      const actionOperation = OPERATIONS.find(
        (operation) => operation.integration === integration.key && operation.operationKey === integrationActionKey,
      )
      if (!actionOperation) {
        console.log(`Operation not found for ${instruction.integration} ${instruction.operationKey}`)
      }
      integrationActionOperations.push(actionOperation)
      const integrationAction = await fetchIntegrationAction(
        integration!.id,
        actionOperation!.mapOperationKey ?? actionOperation!.operationKey,
      )
      integrationActions.push(integrationAction)
    }
    console.log('integrationActions:', integrationActions)

    console.log(`Creating workflow...`)
    const workflow = await createOneWorkflow('AI Workflow')
    console.log(`Created workflow ${workflow.id}`)
    const triggerInputs = resolveInputs(triggerOperation!, resolvedInstructions[0].inputs)
    console.log(`Creating workflow trigger for integration ${integrationTrigger.id} with inputs:`, triggerInputs)
    const res = await createOneWorkflowTrigger(workflow.id, integrationTrigger.id, triggerInputs)
    console.log(`Created workflow trigger ${res.id}`)
    let previousActionId: null | string = null
    for (let i = 0; i < integrationActions.length; i++) {
      const actionInputs = resolveInputs(integrationActionOperations[i]!, resolvedInstructions[i + 1].inputs)
      console.log(
        `Creating workflow action for integration ${integrationActions[i].id} with inputs:`,
        actionInputs,
        previousActionId,
      )
      const res = await createOneWorkflowAction(workflow.id, integrationActions[i].id, actionInputs, previousActionId)
      console.log(`Created workflow action ${res.id}`)
      previousActionId = res.id
    }
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
        <Button onClick={handleSubmit}>{promptLoading ? <Loading /> : 'Do Magic 🤖'}</Button>
      </div>
      {instructions?.length && (
        <div className="mt-8">
          <code>
            {instructions.map((instruction, index) => (
              <div key={index}>{instruction}</div>
            ))}
          </code>
          <Button className="mt-4" onClick={createWorkflow}>
            Create Workflow
          </Button>
        </div>
      )}
    </div>
  )
}
