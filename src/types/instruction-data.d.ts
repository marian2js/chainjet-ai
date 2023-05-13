import { Operation } from '@/constants/operations'
import { Instruction } from '@/types/instruction'
import { Integration } from '@/types/integration'
import { IntegrationOperation } from '@/types/integration-operation'

export interface InstructionData {
  instruction: Instruction
  operation: Operation
  integration: Integration
  integrationOperation: IntegrationOperation
  dependencies: {
    auth?: boolean
    inputs?: string[]
  }
}
