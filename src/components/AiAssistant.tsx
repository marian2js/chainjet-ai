import { Button, Textarea } from '@nextui-org/react'
import axios from 'axios'
import { useState } from 'react'
import {
  createOneWorkflow,
  createOneWorkflowTrigger,
  fetchIntegration,
  fetchIntegrationAction,
  fetchIntegrationTrigger,
} from './services/chainjet.service'

export default function AiAssistant() {
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    // setLoading(true)
    // try {
    //   const res = await axios.post('/api/chat', { text: value })
    //   console.log(`data =>`, res.data)
    // } catch (e) {
    //   console.error('Error:', (e as Error).message)
    //   setError((e as Error).message)
    // }
    // setLoading(false)
    await createWorkflow('')
  }

  const createWorkflow = async (data: string) => {
    // data =
    //   `mirror.newPost({{input.address}})\n` +
    //   `openai.getChatResponse("Please summarize this article: {{0.content}}"): {{1.response}}\n` +
    //   `lens.createPost({{1.response}})\n` +
    //   `twitter.sendTweet({{1.response}})`
    // const instructions = data.split('\n')
    // const integrationKeys = [...new Set(instructions.map((instruction) => instruction.split('.')[0]))]
    // const integrations = []
    // for (const integrationKey of integrationKeys) {
    //   const integration = await fetchIntegration(integrationKey)
    //   integrations.push(integration)
    // }
    // const integrationTriggerKey = instructions[0].split('.')[1].split('(')[0]
    // const integrationTrigger = await fetchIntegrationTrigger(integrations[0].id, integrationTriggerKey)
    // console.log('integrationTrigger:', integrationTrigger)
    // const integrationActions = []
    // for (const instruction of instructions.slice(1)) {
    //   const integrationKey = instruction.split('.')[0]
    //   console.log('integrationKey:', integrationKey, integrations)
    //   const integration = integrations.find((integration) => integration.key === integrationKey)
    //   const integrationActionKey = instruction.split('.')[1].split('(')[0]
    //   const integrationAction = await fetchIntegrationAction(integration!.id, integrationActionKey)
    //   integrationActions.push(integrationAction)
    // }
    // console.log('integrationActions:', integrationActions)
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
        <Button onClick={handleSubmit}>Submit</Button>
      </div>
    </div>
  )
}
