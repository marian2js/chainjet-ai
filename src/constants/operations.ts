export interface Operation {
  type: 'trigger' | 'action'
  integration: string
  operationKey: string
  mapOperationKey?: string
  inputs: { name: string; type: string; value?: any }[]
  outputs: { name: string; type: string }[]
}

export const OPERATIONS: Operation[] = [
  {
    type: 'trigger',
    integration: 'blockchain',
    operationKey: 'newTransaction',
    inputs: [
      { name: 'network', type: 'number' },
      { name: 'address', type: 'string' },
    ],
    outputs: [{ name: 'hash', type: 'string' }],
  },
  {
    type: 'trigger',
    integration: 'lens',
    operationKey: 'newPost',
    inputs: [{ name: 'profileId', type: 'string' }],
    outputs: [{ name: 'id', type: 'string' }],
  },
  {
    type: 'trigger',
    integration: 'lens',
    operationKey: 'newFollower',
    inputs: [{ name: 'profileId', type: 'string' }],
    outputs: [{ name: 'handle', type: 'string' }],
  },
  {
    type: 'trigger',
    integration: 'mirror',
    operationKey: 'newPost',
    inputs: [{ name: 'address', type: 'string' }],
    outputs: [
      { name: 'title', type: 'string' },
      { name: 'url', type: 'string' },
      { name: 'body', type: 'string' },
    ],
  },
  {
    type: 'action',
    integration: 'lens',
    operationKey: 'createPost',
    inputs: [{ name: 'content', type: 'string' }],
    outputs: [],
  },
  {
    type: 'action',
    integration: 'lens',
    operationKey: 'followProfile',
    inputs: [{ name: 'profileId', type: 'string' }],
    outputs: [],
  },
  {
    type: 'action',
    integration: 'openai',
    operationKey: 'sendPrompt',
    mapOperationKey: 'getChatResponse',
    inputs: [
      { name: 'message', type: 'string' },
      { name: 'system', type: 'string', value: 'You are a helpful assistant.' },
      { name: 'temperature', type: 'number', value: 1 },
    ],
    outputs: [{ name: 'response', type: 'string' }],
  },
  {
    type: 'action',
    integration: 'twitter',
    operationKey: 'sendTweet',
    mapOperationKey: 'twitter-create-tweet',
    inputs: [{ name: 'status', type: 'string' }],
    outputs: [],
  },
]
