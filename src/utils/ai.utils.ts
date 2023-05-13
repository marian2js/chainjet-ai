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
export function getInputDependencies(operation: Operation, inputs: string[]) {
  const interpolatedInputs = inputs.map((input) => /\{\{\s*input\.\w+\s*\}\}/.test(input))
  return operation.inputs.filter((input, index) => interpolatedInputs[index]).map((input) => input.name)
}

export function resolveInputs(
  operation: Operation,
  inputs: string[],
  replacedInputs: Record<string, string>,
  previousOperationId: string | null = null,
) {
  return operation.inputs.reduce((acc, input, index) => {
    return {
      ...acc,
      [input.name]:
        replacedInputs[input.name] ??
        inputs[index]
          ?.trim()
          .replace(/^"|"$/g, '')
          .replace(/\{\{\s*\d+\.\s*(\w+)\s*\}\}/g, `{{${previousOperationId ?? ''}.$1}}`) ??
        input.value,
    }
  }, {})
}
