import type { Role } from './characterAssets'
import type { Direction } from './input'
import type { Point } from './pathfinding'

type Contacts = Record<Role, Record<Direction, Point>>

// World-space offsets from a person's floor anchor to Lucky's planted paws.
// These were measured against the contact artwork, separately from the carry anchor.
export const carryContact: Contacts = {
  mashuo: { down: { x: 1, y: 22 }, left: { x: -11, y: 20 }, right: { x: 12, y: 20 }, up: { x: 10, y: 23 } },
  mendu: { down: { x: 0, y: 21 }, left: { x: -12, y: 22 }, right: { x: 10, y: 22 }, up: { x: 10, y: 22 } },
}

export const petContact: Contacts = {
  mashuo: { down: { x: -15, y: 24 }, left: { x: -12, y: 23 }, right: { x: 13, y: 22 }, up: { x: 14, y: 22 } },
  mendu: { down: { x: -12, y: 22 }, left: { x: -14, y: 22 }, right: { x: 11, y: 22 }, up: { x: 12, y: 21 } },
}
