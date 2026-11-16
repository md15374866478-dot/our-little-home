import type { Role } from './characterAssets'
import mashuoV31 from '../assets/characters/review/mashuo-v31-walk.png'
import menduV31 from '../assets/characters/review/mendu-v31-walk.png'

/** Visual approval assets. The playable character registry remains unchanged. */
export const v31CharacterCandidates: Record<Role, {
  id: Role
  displayName: string
  textureKey: string
  url: string
  frameWidth: 40
  frameHeight: 60
  frameColumns: 8
  frameRows: 2
  walkFrames: 16
  actionFrames: 'awaiting-art'
  approval: 'pending'
}> = {
  mashuo: {
    id: 'mashuo', displayName: '马硕', textureKey: 'mashuo-v31',
    url: mashuoV31, frameWidth: 40, frameHeight: 60, frameColumns: 8,
    frameRows: 2, walkFrames: 16, actionFrames: 'awaiting-art', approval: 'pending',
  },
  mendu: {
    id: 'mendu', displayName: '门都', textureKey: 'mendu-v31',
    url: menduV31, frameWidth: 40, frameHeight: 60, frameColumns: 8,
    frameRows: 2, walkFrames: 16, actionFrames: 'awaiting-art', approval: 'pending',
  },
}
