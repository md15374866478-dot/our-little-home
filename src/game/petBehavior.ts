export type PetAction = 'free' | 'follow' | 'follow-mendu' | 'pet' | 'carry' | 'release' | 'ball' | 'feed' | 'sleep' | 'wake' | 'fetch' | 'carry-mendu' | 'pet-mendu'
export type PetState = 'IDLE' | 'WANDER' | 'FOLLOWING' | 'APPROACHING' | 'PETTED' | 'CARRIED' | 'FETCHING' | 'RETURNING' | 'EATING' | 'GOING_HOME' | 'SLEEPING'
/** Player commands supersede autonomous work; stale completions cannot win. */
export class PetBehavior {
  state: PetState = 'IDLE'
  intent: 'free' | 'follow' | 'follow-mendu' = 'free'
  revision = 0
  command(action: PetAction) {
    this.revision++
    this.intent = action === 'follow' || action === 'follow-mendu' ? action : 'free'
    this.state = this.intent !== 'free' ? 'FOLLOWING' : action === 'sleep' ? 'GOING_HOME' : action === 'free' || action === 'release' ? 'IDLE' : 'APPROACHING'
    return this.revision
  }
  finish(token: number, state: PetState) { if (token !== this.revision) return false; this.state = state; return true }
  fail(token: number) { if (!this.finish(token, 'IDLE')) return false; this.intent = 'free'; return true }
}
