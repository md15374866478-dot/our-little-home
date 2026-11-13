export type Direction = 'up' | 'down' | 'left' | 'right'
const held = new Set<Direction>()

export const touchInput = {
  press(direction: Direction) { held.add(direction) },
  release(direction: Direction) { held.delete(direction) },
  clear() { held.clear() },
  isDown(direction: Direction) { return held.has(direction) },
}
