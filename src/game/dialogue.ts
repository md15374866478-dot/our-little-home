import type { BehaviorState, InteractionAction } from './behavior'
import type { MapKind } from './maps'
import type { Environment } from './environment'

export interface DialogueContext { location: MapKind; environment: Environment; state: BehaviorState; lastInteraction: InteractionAction | null }

const base = {
  yard: ['今天的风刚好，走慢一点吧。', '纪念树的叶子又长了一点。', '从院门走到小屋，也算一段小旅行。'],
  home: ['这张沙发好像在等我们。', '书架上那本书，今天读到哪儿了？', '小屋亮着灯，就像有人在说欢迎回来。'],
}
const night = ['夜深啦，灯还暖暖的。', '今晚要不要早点休息？']
const day = ['阳光落在地板上，像一块小毯子。', '今天想先去哪里看看？']
const recent: Partial<Record<InteractionAction, string[]>> = {
  hand: ['慢慢走，我在你旁边。'], hug: ['这一下，就把今天的疲惫抱走。'],
  sit: ['坐一会儿吧，时间可以慢一点。'], sleep: ['醒来还有好多温柔的事。'],
  follow: ['好呀，我跟着你。'], free: ['我先去转转，等会儿见。'],
}

export class DialogueBook {
  private history: string[] = []
  private index = 0

  next(context: DialogueContext): string {
    const pool = [
      ...(recent[context.lastInteraction ?? 'talk'] ?? []),
      ...(context.state === 'READING' ? ['等我读完这一页，就陪你散步。'] : []),
      ...(context.environment.phase === 'night' ? night : day),
      ...base[context.location],
    ]
    const fresh = pool.filter(line => !this.history.includes(line))
    const choices = fresh.length ? fresh : pool
    const line = choices[this.index++ % choices.length]
    this.history.push(line)
    if (this.history.length > 4) this.history.shift()
    return line
  }
}
