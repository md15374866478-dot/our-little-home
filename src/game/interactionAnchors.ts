import type { Direction } from './input'
import type { Point } from './pathfinding'
export const directions:Direction[]=['down','left','right','up']
export function facingToward(a:Point,b:Point):Direction{return Math.abs(b.x-a.x)>Math.abs(b.y-a.y)?b.x>a.x?'right':'left':b.y>a.y?'down':'up'}
/** Anchors are frame-local pixels, measured from the common feet origin. */
export function mouthAnchor(direction:Direction,frame:number):Point&{behind:boolean}{
  const phase=((frame%4)+4)%4,bob=[0,-1,0,1][phase]
  const base={down:{x:0,y:-14},left:{x:-14,y:-14},right:{x:14,y:-14},up:{x:0,y:-24}}[direction]
  return {...base,y:base.y+bob,behind:direction==='up'}
}
export const cradleAnchors:Record<Direction,Point>={down:{x:6,y:-10},left:{x:-12,y:-10},right:{x:12,y:-10},up:{x:0,y:-10}}
export const handAnchors:Record<Direction,Point>={down:{x:-12,y:-4},left:{x:-13,y:-3},right:{x:13,y:-3},up:{x:13,y:-3}}
export function attach(origin:Point,anchor:Point):Point{return {x:origin.x+anchor.x,y:origin.y+anchor.y}}
