import { Modal, Text } from '@nextui-org/react'
import _ from 'lodash'

interface Props {
  open?: boolean
  onClose: () => void
}

export default function SampleModal({ open = true, onClose }: Props) {
  return (
    <Modal closeButton aria-labelledby="modal-title" open={open} onClose={onClose} width="800px">
      <Modal.Header className="border-b border-white">
        <Text id="modal-title" size={18}>
          Prompt Samples
        </Text>
      </Modal.Header>
      <Modal.Body>
        <div>
          <li>Share a summary of my Mirror articles on Lens.</li>
          <li>Send me new Snapshot proposals for aave.eth on an XMTP message.</li>
          <li>When I receive an XMTP message saying &quot;gm&quot;, reply back with &quot;gm&quot;.</li>
          <li>When I receive a new POAP, share it on Lens Protocol.</li>
          <li>Create a Lens Post when Ethereum is above $2,000.</li>
          <li>Send me an email marpar.eth is about to expire.</li>
          <li>Add new transactions by me on a Notion DB.</li>
        </div>
      </Modal.Body>
    </Modal>
  )
}
