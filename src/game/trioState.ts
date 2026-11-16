export type TrioPhase='IDLE'|'RETURN_HOME'|'PEOPLE_ENTER'|'LUCKY_APPROACH'|'JUMP'|'LAND'|'BURROW'|'SLEEP'|'LUCKY_WAKE'|'PEOPLE_WAKE'|'RECOVER'
const phases:TrioPhase[]=['RETURN_HOME','PEOPLE_ENTER','LUCKY_APPROACH','JUMP','LAND','BURROW','SLEEP','LUCKY_WAKE','PEOPLE_WAKE','IDLE']
export class TrioState {
  phase:TrioPhase='IDLE';private revision=0
  get active(){return this.phase!=='IDLE'}
  begin(authorized:boolean){if(!authorized||this.active)return null;this.phase='RETURN_HOME';return ++this.revision}
  valid(token:number){return token===this.revision}
  advance(token:number,phase:TrioPhase){if(!this.valid(token))return false;const index=phases.indexOf(this.phase);if(phases[index+1]!==phase)return false;this.phase=phase;return true}
  cancel(){this.revision++;this.phase='RECOVER';return this.revision}
  recovered(token:number){if(!this.valid(token))return false;this.phase='IDLE';return true}
}
