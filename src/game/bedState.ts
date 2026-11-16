/** Per-person bed occupancy. Animation runners own timing and use revisions to
 * discard completions from cancelled routes or interrupted animations. */
export type BedPerson = 'mashuo' | 'mendu'
export type BedPhase = 'awake' | 'approaching' | 'uncovering' | 'entering' | 'covering' | 'asleep' | 'waking' | 'leaving'
const next: Record<BedPhase, readonly BedPhase[]> = {
  awake: ['approaching'], approaching: ['uncovering', 'awake'],
  uncovering: ['entering', 'leaving'], entering: ['covering', 'leaving'],
  covering: ['asleep', 'waking'], asleep: ['waking'],
  waking: ['leaving'], leaving: ['awake'],
}

export class BedState {
  private phases: Record<BedPerson, BedPhase> = { mashuo: 'awake', mendu: 'awake' }
  private revisions: Record<BedPerson, number> = { mashuo: 0, mendu: 0 }
  phase(person: BedPerson) { return this.phases[person] }
  begin(person: BedPerson) {
    if (this.phase(person) !== 'awake') return null
    this.phases[person] = 'approaching'
    return ++this.revisions[person]
  }
  valid(person: BedPerson, revision: number) { return this.revisions[person] === revision }
  advance(person: BedPerson, revision: number, phase: BedPhase) {
    if (!this.valid(person, revision) || !next[this.phase(person)].includes(phase)) return false
    this.phases[person] = phase
    return true
  }
  /** Invalidates pending callbacks; caller must animate the returned exit phase. */
  cancel(person: BedPerson) {
    const phase = this.phase(person)
    const revision = ++this.revisions[person]
    this.phases[person] = phase === 'awake' || phase === 'approaching' ? 'awake'
      : phase === 'covering' || phase === 'asleep' || phase === 'waking' ? 'waking' : 'leaving'
    return { revision, phase: this.phase(person) }
  }
}
