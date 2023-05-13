import { Operation } from '@/constants/operations'
import { Instruction } from '@/types/instruction'

export function getOperationPrompt(operation: Operation): string {
  const inputs = operation.inputs
    .filter((input) => !input.value)
    .map((input) => `${input.name}: ${input.type}`)
    .join(', ')
  const outputs = operation.outputs.map((output) => `${output.name}: ${output.type}`).join(', ')
  return `${operation.integration}.${operation.operationKey}(${inputs})${outputs.length ? `: ${outputs}` : ''}`
}

export function resolveInstruction(instruction: string): Instruction {
  const integration = instruction.split('.')[0]
  const operationKey = instruction.split('.')[1].split('(')[0]
  const inputs = instruction.split('(')[1].split(')')[0].split(',')
  return { integration, operationKey, inputs }
}

/**
 * Finds all inputs with input interpolation (e.g. {{ input.address }})
 */
export function getInputDependencies(inputs: string[]) {
  return inputs.filter((input) => /\{\{\s*input\.\w+\s*\}\}/.test(input))
}

export function resolveInputs(operation: Operation, inputs: string[]) {
  return operation.inputs.reduce((acc, input, index) => {
    return {
      ...acc,
      [input.name]: inputs[index]?.replace(/^"|"$/g, '') ?? input.value,
    }
  }, {})
}
