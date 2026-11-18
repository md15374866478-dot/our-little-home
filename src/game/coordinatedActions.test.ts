import {describe,it,expect} from 'vitest'
import {readFileSync} from 'node:fs'
import {TrioState} from './trioState'
import {mouthAnchor,attach,cradleAnchors,directions} from './interactionAnchors'
describe('coordinated animation contracts',()=>{
 it('rejects guests and conflicting trio starts',()=>{const state=new TrioState();expect(state.begin(false)).toBeNull();expect(state.active).toBe(false);const token=state.begin(true)!;expect(state.begin(true)).toBeNull();expect(state.advance(token,'JUMP')).toBe(false)})
 it('cannot commit old phases after cancellation and recovery',()=>{const state=new TrioState(),old=state.begin(true)!;state.advance(old,'PEOPLE_ENTER');const recovery=state.cancel();expect(state.advance(old,'LUCKY_APPROACH')).toBe(false);expect(state.recovered(recovery)).toBe(true);expect(state.active).toBe(false);expect(state.begin(true)).not.toBeNull()})
 it('keeps human and Lucky performance sheets transparent and aligned',()=>{for(const [name,width,height]of [['mashuo-pet',320,240],['mendu-pet',320,240],['mashuo-arms',320,240],['mendu-arms',320,240],['lucky-performance',320,280]]as const){const bytes=readFileSync('src/assets/coordinated/'+name+'.png');expect([bytes.readUInt32BE(16),bytes.readUInt32BE(20),bytes[25]]).toEqual([width,height,6])}})
 it('supports a complete trio cycle and permits another start only after everyone recovers',()=>{const state=new TrioState(),token=state.begin(true)!;for(const next of ['PEOPLE_ENTER','LUCKY_APPROACH','JUMP','LAND','WALK_BED','BURROW','SLEEP','LUCKY_WAKE','PEOPLE_WAKE','IDLE']as const)expect(state.advance(token,next)).toBe(true);expect(state.active).toBe(false);expect(state.begin(true)).not.toBeNull()})
 it('tracks mouth anchors in all run frames and occludes the rear mouth',()=>{for(const direction of directions)for(let phase=0;phase<4;phase++){const anchor=mouthAnchor(direction,16+phase);expect(Number.isFinite(anchor.x+anchor.y)).toBe(true);expect(anchor.behind).toBe(direction==='up');expect(attach({x:100,y:100},cradleAnchors[direction])).toEqual({x:100+cradleAnchors[direction].x,y:100+cradleAnchors[direction].y})}})
})
