import { AccountCredential } from '@/types/account-credential'
import { Integration } from '@/types/integration'
import { IntegrationAccount } from '@/types/integration-account'
import { IntegrationAction, IntegrationTrigger } from '@/types/integration-operation'

export async function fetchViewer() {
  const query = `{
    viewer {
      id
    }
  }`
  const data = await sendQuery(query)
  return data?.viewer
}

export async function fetchIntegration(key: string): Promise<Integration> {
  const query = `{
    integrations (filter: { key: { eq: "${key}" } }) {
      edges {
        node {
          id
          key
          name
          logo
        }
      }
    }
  }`
  const data = await sendQuery(query)
  return data?.integrations?.edges?.[0]?.node
}

export async function fetchIntegrationTrigger(integrationId: string, key: string): Promise<IntegrationTrigger> {
  const query = `{
    integrationTriggers (filter: { integration: { eq: "${integrationId}" }, key: { eq: "${key}" } }) {
      edges {
        node {
          id
          key
          name
        }
      }
    }
  }`
  const data = await sendQuery(query)
  return data?.integrationTriggers?.edges?.[0]?.node
}

export async function fetchIntegrationAction(integrationId: string, key: string): Promise<IntegrationAction> {
  const query = `{
    integrationActions (filter: { integration: { eq: "${integrationId}" }, key: { eq: "${key}" } }) {
      edges {
        node {
          id
          key
          name
        }
      }
    }
  }`
  const data = await sendQuery(query)
  return data?.integrationActions?.edges?.[0]?.node
}

export async function fetchIntegrationAccount(integrationKey: string): Promise<IntegrationAccount> {
  const query = `{
    integrationAccounts (filter: { key: { eq: "${integrationKey}" } }) {
      edges {
        node {
          id
          key
        }
      }
    }
  }`
  const data = await sendQuery(query)
  return data?.integrationAccounts?.edges?.[0]?.node
}

export async function fetchAccountCredentials(integrationAccountId: string): Promise<AccountCredential[]> {
  const query = `{
    accountCredentials (filter: { integrationAccount: { eq: "${integrationAccountId}" } }) {
      edges {
        node {
          id
          name
        }
      }
    }
  }`
  const data = await sendQuery(query)
  return data?.accountCredentials?.edges?.map((edge: any) => edge.node)
}

export async function createOneWorkflow(name: string): Promise<{ id: string; name: string }> {
  const query = `mutation ($name: String!) {
    createOneWorkflow(input: { workflow: { name: $name } }) {
      id
      name
    }
  }`
  const data = await sendQuery(query, { name })
  return data?.createOneWorkflow
}

export async function createOneWorkflowTrigger(
  workflow: string,
  integrationTrigger: string,
  inputs: any,
): Promise<{ id: string }> {
  const query = `mutation ($workflow: ID!, $integrationTrigger: ID!, $inputs: JSONObject!) {
    createOneWorkflowTrigger(input: {
      workflowTrigger: {
        workflow: $workflow,
        integrationTrigger: $integrationTrigger,
        inputs: $inputs
      }
    }) {
      id
    }
  }`
  const data = await sendQuery(query, { workflow, integrationTrigger, inputs })
  return data?.createOneWorkflowTrigger
}

export async function createOneWorkflowAction(
  workflow: string,
  integrationAction: string,
  inputs: Record<string, any>,
  previousAction: string | null = null,
): Promise<{ id: string }> {
  const query = `mutation ($workflow: ID!, $integrationAction: ID!, $inputs: JSONObject!, $previousAction: ID) {
    createOneWorkflowAction(input: {
      workflowAction: {
        workflow: $workflow,
        integrationAction: $integrationAction,
        inputs: $inputs,
        previousAction: $previousAction
      }
    }) {
      id
    }
  }`
  const data = await sendQuery(query, { workflow, integrationAction, inputs, previousAction })
  return data?.createOneWorkflowAction
}

async function sendQuery(query: string, variables: Record<string, any> = {}) {
  const res = await fetch('https://api.chainjet.io/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage['chainjet.token']}`,
    },
    body: JSON.stringify({ query, variables }),
  })
  const json = await res.json()
  if (json.errors) {
    throw new Error(json.errors[0].message)
  }
  return json?.data
}
