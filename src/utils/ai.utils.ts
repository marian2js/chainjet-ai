import { Operation } from '@/constants/operations'

export function getOperationPrompt(operation: Operation): string {
  const inputs = operation.inputs
    .filter((input) => !input.value)
    .map((input) => `${input.name}: ${input.type}`)
    .join(', ')
  const outputs = operation.outputs.map((output) => `${output.name}: ${output.type}`).join(', ')
  return `${operation.integration}.${operation.operationKey}(${inputs})${outputs.length ? `: ${outputs}` : ''}`
}

export function resolveInstruction(instruction: string) {
  const integration = instruction.split('.')[0]
  const operationKey = instruction.split('.')[1].split('(')[0]
  const inputs = instruction.split('(')[1].split(')')[0].split(',')
  return { integration, operationKey, inputs }
}

export function getInputDependencies(inputs: string[]) {
  // TODO
}

export function resolveInputs(operation: Operation, inputs: string[]) {
  return operation.inputs.reduce((acc, input, index) => {
    return {
      ...acc,
      [input.name]: inputs[index] ?? input.value,
    }
  }, {})
}
