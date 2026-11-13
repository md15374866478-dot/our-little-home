import Phaser from 'phaser'
import { canStand } from './collision'
import { findPath, type Point } from './pathfinding'
import type { WorldMap } from './maps'
import type { Direction } from './input'
import type { Role } from './characterAnimations'

interface Route {
  sprite: Phaser.GameObjects.Sprite
  role: Role
  points: Point[]
  index: number
  remainingMs: number
  stuckMs: number
  resolve: (success: boolean) => void
}

export class RouteFollower {
  private routes = new Map<Role, Route>()
  constructor(private map: () => WorldMap, private onMotion: (role: Role, direction: Direction, moving: boolean) => void) {}

  busy(role: Role) { return this.routes.has(role) }

  navigate(sprite: Phaser.GameObjects.Sprite, role: Role, goal: Point): Promise<boolean> {
    this.cancel(role)
    const route = findPath(this.map(), sprite, goal)
    if (!route) return Promise.resolve(false)
    if (route.length === 1 && Phaser.Math.Distance.Between(sprite.x, sprite.y, goal.x, goal.y) < 2) return Promise.resolve(true)
    return new Promise(resolve => this.routes.set(role, {
      sprite, role, points: route, index: 0,
      remainingMs: Math.min(30000, Math.max(4500, route.length * 210 + 2500)),
      stuckMs: 0, resolve,
    }))
  }

  update(delta: number) {
    for (const route of [...this.routes.values()]) {
      route.remainingMs -= delta
      if (route.remainingMs <= 0) { this.finish(route, false); continue }
      const speed = route.role === 'mashuo' ? 100 : 88
      let budget = speed * Math.min(delta, 250) / 1000
      while (budget > 0 && route.index < route.points.length) {
        const goal = route.points[route.index]
        const dx = goal.x - route.sprite.x, dy = goal.y - route.sprite.y
        const length = Math.hypot(dx, dy)
        if (length < 2.5) { route.index++; continue }
        const step = Math.min(length, budget, 8)
        const x = route.sprite.x + dx / length * step
        const y = route.sprite.y + dy / length * step
        let moved = false
        if (canStand(this.map(), x, route.sprite.y)) { route.sprite.x = x; moved = true }
        if (canStand(this.map(), route.sprite.x, y)) { route.sprite.y = y; moved = true }
        if (!moved) { route.stuckMs += delta; break }
        route.stuckMs = 0
        budget -= step
        const direction: Direction = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up')
        this.onMotion(route.role, direction, true)
      }
      if (route.stuckMs > 350) this.finish(route, false)
      else if (route.index >= route.points.length) this.finish(route, true)
    }
  }

  cancel(role?: Role) {
    for (const route of [...this.routes.values()]) if (!role || route.role === role) this.finish(route, false)
  }

  private finish(route: Route, success: boolean) {
    if (this.routes.get(route.role) !== route) return
    this.routes.delete(route.role)
    if (success) {
      const point = route.points[route.points.length - 1]
      route.sprite.setPosition(point.x, point.y)
    }
    this.onMotion(route.role, 'down', false)
    route.resolve(success)
  }
}
