import { Integration } from '@/types/integration'
import { Button, Modal, Text } from '@nextui-org/react'
import { useAccountCredentials, useIntegrationAccounts } from '../hooks/chainjet.hooks'
import { useEffect, useMemo, useState } from 'react'

interface Props {
  open: boolean
  integrations: Integration[]
  onComplete: (selectedAccounts: Record<string, string>) => void
  onCancel: () => void
}

export default function AuthenticationModal({ open, integrations, onComplete, onCancel }: Props) {
  const { integrationAccounts, loading: integrationAccountsLoading } = useIntegrationAccounts(
    useMemo(() => ({ integrationKeys: integrations.map((integration) => integration.key) }), [integrations]),
  )
  const { accountCredentials, loading: accountCredentialsLoading } = useAccountCredentials({
    integrationAccounts: integrationAccounts!,
    skip: !integrationAccounts?.length,
  })
  const [selectedAccounts, setSelectedAccounts] = useState<Record<string, string>>({})

  // set default selected accounts
  useEffect(() => {
    if (accountCredentials) {
      setSelectedAccounts(
        Object.fromEntries(
          integrations.map((integration) => [integration.key, accountCredentials[integration.key]?.[0]?.id ?? '']),
        ),
      )
    }
  }, [accountCredentials, integrations])

  const loading = integrationAccountsLoading || accountCredentialsLoading

  return (
    <Modal closeButton aria-labelledby="modal-title" open={open} onClose={onCancel}>
      <Modal.Header className="border-b border-white">
        <Text id="modal-title" size={18}></Text>
      </Modal.Header>
      <Modal.Body>
        <div>
          {loading && <div>Loading...</div>}
          {accountCredentials && (
            <div className="my-4">
              {integrations.map((integration) => (
                <div key={integration.id} className="flex items-center justify-between">
                  <div className="mt-8">
                    {accountCredentials[integration.key]?.length && (
                      <div className="">
                        <select
                          className="w-full h-8"
                          onChange={(e) =>
                            setSelectedAccounts({ ...selectedAccounts, [integration.key]: e.target.value })
                          }
                        >
                          {accountCredentials[integration.key]?.map((accountCredential) => (
                            <option
                              key={accountCredential.id}
                              value={accountCredential.id}
                              selected={selectedAccounts[integration.key] === accountCredential.id}
                            >
                              {accountCredential.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div className="mt-2">
                      <a
                        href={`https://chainjet.io/create/credential/${integration.key}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Button>
                          <img
                            src={integration.logo}
                            className="w-8 h-8 mr-4"
                            alt={integration.name}
                            width={24}
                            height={24}
                          />{' '}
                          Authenticate with {integration.name}
                        </Button>
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button auto flat color="error" onPress={onCancel}>
          Cancel
        </Button>
        <Button auto flat onPress={() => onComplete(selectedAccounts)}>
          Confirm
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
