import { Button, Input, Modal, Text } from '@nextui-org/react'
import { useState } from 'react'
import { InstructionData } from '@/types/instruction-data'
import _ from 'lodash'

interface Props {
  open: boolean
  instructionsData: InstructionData[]
  onComplete: (selectedInputs: Record<string, Record<string, string>>) => void
  onCancel: () => void
}

export default function InputsModal({ open, instructionsData, onComplete, onCancel }: Props) {
  const [selectedInputs, setSelectedInputs] = useState<Record<string, Record<string, string>>>({})

  const handleInputChange = (integrationKey: string, inputKey: string, value: string) => {
    setSelectedInputs({
      ...selectedInputs,
      [integrationKey]: {
        ...selectedInputs[integrationKey],
        [inputKey]: value,
      },
    })
  }

  return (
    <Modal closeButton aria-labelledby="modal-title" open={open} onClose={onCancel}>
      <Modal.Header className="border-b border-white">
        <Text id="modal-title" size={18}></Text>
      </Modal.Header>
      <Modal.Body>
        <div>
          {instructionsData.map((instructionItem) => (
            <div key={instructionItem.integration.key}>
              <div className="mb-4 text-lg">{instructionItem.integration.name}</div>
              {instructionItem.dependencies.inputs!.map((input) => (
                <div key={input} className="w-full">
                  <Input
                    placeholder={`Enter ${_.capitalize(input)}`}
                    bordered
                    fullWidth
                    onChange={(e) => handleInputChange(instructionItem.integration.key, input, e.target.value)}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button auto flat color="error" onPress={onCancel}>
          Cancel
        </Button>
        <Button auto flat onPress={() => onComplete(selectedInputs)}>
          Confirm
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
