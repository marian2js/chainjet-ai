import { AccountCredential } from '@/types/account-credential'
import { IntegrationAccount } from '@/types/integration-account'
import { useCallback, useContext, useEffect, useState } from 'react'
import { ChainJetContext } from '../providers/ChainJetProvider'
import { fetchAccountCredentials, fetchIntegrationAccount } from '../services/chainjet.service'

export function useUser() {
  return useContext(ChainJetContext)
}

export function useIntegrationAccounts({ integrationKeys }: { integrationKeys: string[] }) {
  const [integrationAccounts, setIntegrationAccounts] = useState<IntegrationAccount[] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const run = async () => {
      let accounts: IntegrationAccount[] = []
      for (const integrationKey of integrationKeys) {
        accounts.push(await fetchIntegrationAccount(integrationKey))
      }
      setIntegrationAccounts(accounts)
      setLoading(false)
    }
    run()
  }, [integrationKeys])

  return { integrationAccounts, loading }
}

export function useAccountCredentials({
  integrationAccounts,
  skip = false,
}: {
  integrationAccounts: IntegrationAccount[]
  skip?: boolean
}) {
  const [accountCredentials, setAccountCredentials] = useState<Record<string, AccountCredential[]> | null>(null)
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    let credentials: Record<string, AccountCredential[]> = {}
    for (const integrationAccount of integrationAccounts) {
      credentials[integrationAccount.key] = await fetchAccountCredentials(integrationAccount.id)
    }
    setAccountCredentials(credentials)
  }, [integrationAccounts])

  useEffect(() => {
    refetch()
    setLoading(false)
  }, [integrationAccounts, refetch, skip])

  return { accountCredentials, loading, refetch }
}
