import type { Usuario } from '../../../models'
import { MatchingView } from '../chat/ChatMatchingView'

type AudioMatchingViewProps = {
  userId: string
  profile: Partial<Usuario>
  onMatched: (sessionId: string) => void
  onCancel: () => void
}

function AudioMatchingView(props: AudioMatchingViewProps) {
  return <MatchingView {...props} modo="audio" />
}

export default AudioMatchingView
