import type { Direction } from './input'
import type { Point } from './pathfinding'
export const directions:Direction[]=['down','left','right','up']
export function facingToward(a:Point,b:Point):Direction{return Math.abs(b.x-a.x)>Math.abs(b.y-a.y)?b.x>a.x?'right':'left':b.y>a.y?'down':'up'}
// Mouth center in every standing/walking/run frame. Facing up keeps the ball
// behind Lucky's head, so it cannot pop in front of the back of his neck.
const walkMouth = {
  down: [[0,-14],[0,-15],[0,-15],[0,-14]],
  left: [[-12,-12],[-15,-12],[-15,-14],[-13,-12]],
  right: [[13,-12],[15,-12],[15,-14],[13,-12]],
  up: [[0,-23],[0,-23],[0,-24],[0,-23]],
}
const runMouth = {
  down: [[0,-14],[0,-15],[0,-16],[0,-14]],
  left: [[-13,-12],[-17,-11],[-16,-14],[-14,-12]],
  right: [[14,-12],[17,-10],[16,-14],[14,-12]],
  up: [[0,-25],[0,-25],[0,-25],[0,-24]],
}
const biteMouth = { down: [0,-3], left: [-14,-5], right: [14,-5], up: [0,-17] }

export function mouthAnchor(direction: Direction, frame: number, bite = false): Point & { behind: boolean } {
  const table = frame >= 16 && frame < 32 ? runMouth : walkMouth
  const [x, y] = bite ? biteMouth[direction] : table[direction][(frame % 4 + 4) % 4]
  return { x, y, behind: direction === 'up' }
}
export const cradleAnchors:Record<Direction,Point>={down:{x:6,y:-10},left:{x:-12,y:-10},right:{x:12,y:-10},up:{x:0,y:-10}}
export function attach(origin:Point,anchor:Point):Point{return {x:origin.x+anchor.x,y:origin.y+anchor.y}}
