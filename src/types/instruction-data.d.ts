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
