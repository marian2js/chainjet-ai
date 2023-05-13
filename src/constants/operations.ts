export interface Operation {
  type: 'trigger' | 'action'
  integration: string
  operationKey: string
  defaultSchedule?: boolean
  mapOperationKey?: string
  requiresCredentials?: boolean
  inputs: { name: string; type: string; value?: any }[]
  outputs: { name: string; type: string }[]
  mapInputs?: (inputs: Record<string, any>) => Record<string, any>
}

export const OPERATIONS: Operation[] = [
  // TRIGGERS //
  {
    type: 'trigger',
    integration: 'blockchain',
    operationKey: 'newTransaction',
    defaultSchedule: true,
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
    defaultSchedule: true,
    inputs: [{ name: 'profileId', type: 'string' }],
    outputs: [{ name: 'id', type: 'string' }],
  },
  {
    type: 'trigger',
    integration: 'lens',
    operationKey: 'newFollower',
    defaultSchedule: true,
    inputs: [{ name: 'profileId', type: 'string' }],
    outputs: [{ name: 'handle', type: 'string' }],
  },
  {
    type: 'trigger',
    integration: 'mirror',
    operationKey: 'newPost',
    defaultSchedule: true,
    inputs: [{ name: 'address', type: 'string' }],
    outputs: [
      { name: 'title', type: 'string' },
      { name: 'url', type: 'string' },
      { name: 'body', type: 'string' },
    ],
  },
  {
    type: 'trigger',
    integration: 'xmtp',
    operationKey: 'newMessage',
    requiresCredentials: true,
    defaultSchedule: true,
    inputs: [
      // { name: 'conversationPrefix', type: 'string' }
    ],
    outputs: [
      { name: 'id', type: 'string' },
      { name: 'senderAddress', type: 'string' },
      { name: 'content', type: 'string' },
    ],
  },
  {
    type: 'trigger',
    integration: 'snapshot',
    operationKey: 'proposalCreated',
    inputs: [{ name: 'space', type: 'string' }],
    outputs: [
      { name: 'id', type: 'string' },
      { name: 'title', type: 'string' },
      { name: 'body', type: 'string' },
      { name: 'link', type: 'string' },
    ],
  },
  {
    type: 'trigger',
    integration: 'snapshot',
    operationKey: 'proposalEnded',
    inputs: [{ name: 'space', type: 'string' }],
    outputs: [
      { name: 'id', type: 'string' },
      { name: 'title', type: 'string' },
      { name: 'body', type: 'string' },
      { name: 'link', type: 'string' },
    ],
  },
  {
    type: 'trigger',
    integration: 'schedule',
    operationKey: 'schedule',
    inputs: [{ name: 'cron', type: 'string' }],
    outputs: [],
  },
  {
    type: 'trigger',
    integration: 'prices',
    operationKey: 'tokenPriceThreshold',
    inputs: [
      { name: 'network', type: 'number' },
      { name: 'address', type: 'string' },
      { name: 'threshold', type: 'number' },
      { name: 'direction', type: 'above|below' },
    ],
    outputs: [
      { name: 'price', type: 'number' },
      { name: 'priceChange24h', type: 'number' },
    ],
  },
  {
    type: 'trigger',
    integration: 'poap',
    operationKey: 'newPoapCollected',
    inputs: [{ name: 'address', type: 'string' }],
    outputs: [{ name: 'id', type: 'number' }],
  },
  {
    type: 'trigger',
    integration: 'ens',
    operationKey: 'domainExpires',
    inputs: [{ name: 'name', type: 'string' }],
    outputs: [{ name: 'expiryDate', type: 'string' }],
  },

  // ACTIONS //
  {
    type: 'action',
    integration: 'logic',
    operationKey: 'filter',
    inputs: [
      { name: 'leftValue', type: 'string' },
      { name: 'comparator', type: 'string' },
      { name: 'rightValue', type: 'string' },
    ],
    outputs: [],
    mapInputs: (inputs) => {
      const { leftValue, comparator, rightValue } = inputs
      return {
        filters: [
          {
            leftValue,
            comparator,
            rightValue,
          },
        ],
      }
    },
  },
  {
    type: 'action',
    integration: 'lens',
    operationKey: 'createPost',
    requiresCredentials: true,
    inputs: [{ name: 'content', type: 'string' }],
    outputs: [],
  },
  {
    type: 'action',
    integration: 'lens',
    operationKey: 'followProfile',
    requiresCredentials: true,
    inputs: [{ name: 'profileId', type: 'string' }],
    outputs: [],
  },
  {
    type: 'action',
    integration: 'openai',
    operationKey: 'sendPrompt',
    mapOperationKey: 'getChatResponse',
    requiresCredentials: true,
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
    requiresCredentials: true,
    inputs: [{ name: 'status', type: 'string' }],
    outputs: [],
  },
  {
    type: 'action',
    integration: 'xmtp',
    operationKey: 'sendMessageWallet',
    requiresCredentials: true,
    inputs: [
      { name: 'address', type: 'string' },
      { name: 'message', type: 'string' },
    ],
    outputs: [],
  },
  {
    type: 'action',
    integration: 'notion',
    operationKey: 'createDatabaseItem',
    requiresCredentials: true,
    inputs: [
      { name: 'databaseId', type: 'string' },
      { name: 'props', type: 'object' },
    ],
    outputs: [],
  },
  {
    type: 'action',
    integration: 'discord',
    operationKey: 'sendMessage',
    requiresCredentials: true,
    inputs: [
      { name: 'channelId', type: 'string' },
      { name: 'content', type: 'string' },
    ],
    outputs: [],
  },
  {
    type: 'action',
    integration: 'email',
    operationKey: 'sendEmailToYourself',
    inputs: [
      { name: 'email', type: 'string' },
      { name: 'subject', type: 'string' },
      { name: 'body', type: 'string' },
    ],
    outputs: [],
  },
]
