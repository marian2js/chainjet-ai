export interface IntegrationTrigger {
  id: string
  name: string
  key: string
}

export interface IntegrationAction {
  id: string
  name: string
  key: string
}

export type IntegrationOperation = IntegrationTrigger | IntegrationAction
