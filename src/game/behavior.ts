export type BehaviorState = 'IDLE' | 'WANDER' | 'READING' | 'SITTING' | 'RESTING' | 'FOLLOWING' | 'HOLDING_HANDS' | 'HUGGING' | 'SLEEPING' | 'TALKING' | 'TRANSITIONING'
export type Intent = 'free' | 'follow' | 'hand'
export type InteractionAction = 'talk' | 'follow' | 'hand' | 'hug' | 'sit' | 'sleep' | 'free'

/** All NPC state changes pass through this gate; stale async routes cannot commit. */
export class BehaviorMachine {
  state: BehaviorState = 'IDLE'
  intent: Intent = 'free'
  lastInteraction: InteractionAction | null = null
  private revision = 0

  begin(action: InteractionAction): number {
    this.revision++
    this.intent = 'free'
    this.state = 'TRANSITIONING'
    this.lastInteraction = action
    return this.revision
  }

  valid(revision: number) { return this.revision === revision }

  finish(revision: number, state: BehaviorState, intent: Intent = 'free') {
    if (!this.valid(revision)) return false
    this.state = state
    this.intent = intent
    return true
  }

  autonomous(state: BehaviorState) {
    if (this.intent === 'free' && this.state !== 'TRANSITIONING') this.state = state
  }

  fail(revision: number) {
    if (!this.valid(revision)) return false
    this.revision++
    this.state = 'IDLE'
    this.intent = 'free'
    return true
  }

  cancel(): number {
    this.revision++
    this.state = 'IDLE'
    this.intent = 'free'
    return this.revision
  }

  beginSceneChange() {
    this.revision++
    this.state = 'TRANSITIONING'
    return this.revision
  }

  sceneChanged() {
    this.revision++
    this.state = this.intent === 'follow' ? 'FOLLOWING' : this.intent === 'hand' ? 'HOLDING_HANDS' : 'IDLE'
    return this.revision
  }
}
