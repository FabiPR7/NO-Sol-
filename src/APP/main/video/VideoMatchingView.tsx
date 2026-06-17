import type { Usuario } from '../../../models'
import { MatchingView } from '../chat/ChatMatchingView'

type VideoMatchingViewProps = {
  userId: string
  profile: Partial<Usuario>
  onMatched: (sessionId: string) => void
  onCancel: () => void
}

function VideoMatchingView(props: VideoMatchingViewProps) {
  return <MatchingView {...props} modo="video" />
}

export default VideoMatchingView
