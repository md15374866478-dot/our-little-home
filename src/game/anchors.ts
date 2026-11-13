import { TILE } from './constants'
import type { MapKind } from './maps'
import type { Point } from './pathfinding'

const at = (x: number, y: number): Point => ({ x: x * TILE, y: y * TILE })
export type Activity = 'READING' | 'SITTING' | 'RESTING' | 'IDLE'
export interface ActivityAnchor { id: string; position: Point; activity: Activity; dwellMs: number }

export const activityAnchors: Record<MapKind, ActivityAnchor[]> = {
  home: [
    { id: 'bedside', position: at(10.5, 8.5), activity: 'RESTING', dwellMs: 16000 },
    { id: 'sofa', position: at(7.5, 18.5), activity: 'SITTING', dwellMs: 14000 },
    { id: 'bookshelf', position: at(15.5, 6.5), activity: 'READING', dwellMs: 18000 },
    { id: 'window', position: at(18.5, 6.5), activity: 'IDLE', dwellMs: 13000 },
    { id: 'desk', position: at(20.5, 16.5), activity: 'READING', dwellMs: 17000 },
    { id: 'door', position: at(18.5, 20.5), activity: 'IDLE', dwellMs: 11000 },
  ],
  yard: [
    { id: 'memorial-tree', position: at(12.5, 21.5), activity: 'RESTING', dwellMs: 16000 },
    { id: 'bench', position: at(38.5, 25.5), activity: 'SITTING', dwellMs: 15000 },
    { id: 'path', position: at(22.5, 26.5), activity: 'IDLE', dwellMs: 11000 },
    { id: 'flowers', position: at(11.5, 26.5), activity: 'RESTING', dwellMs: 14000 },
    { id: 'house-door', position: at(25.5, 17.5), activity: 'IDLE', dwellMs: 12000 },
  ],
}

export interface DuoSeat { approach: [Point, Point]; pose: [Point, Point]; kind: 'sit' | 'sleep' }
export const sofaSeat: DuoSeat = {
  kind: 'sit', approach: [at(5.5, 18.5), at(8.5, 18.5)], pose: [at(5.5, 16.5), at(8.5, 16.5)],
}
export const benchSeat: DuoSeat = {
  kind: 'sit', approach: [at(32.5, 25.5), at(35.5, 25.5)], pose: [at(32.5, 23.5), at(35.5, 23.5)],
}
export const bedSeat: DuoSeat = {
  kind: 'sleep', approach: [at(1.5, 7.5), at(10.5, 7.5)], pose: [at(4.5, 5.5), at(7.5, 5.5)],
}
