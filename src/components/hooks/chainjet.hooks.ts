import { useContext } from 'react'
import { ChainJetContext } from '../providers/ChainJetProvider'

export function useUser() {
  return useContext(ChainJetContext)
}
