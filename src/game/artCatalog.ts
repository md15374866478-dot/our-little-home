import type { Season } from './environment'
import homeLegacy from '../assets/maps/home.png'
import homeLegacyFront from '../assets/maps/home-front.png'
import homeBaseSample from '../assets/maps/home-base-sample.png'
import homeBedSample from '../assets/maps/home-bed-sample.png'
import homeBedFrontSample from '../assets/maps/home-bed-front-sample.png'
import homeOtherFrontSample from '../assets/maps/home-other-front-sample.png'
import springArt from '../assets/maps/yard-spring.png'
import springTree from '../assets/maps/yard-spring-tree-front.png'
import springBench from '../assets/maps/yard-spring-bench-front.png'
import summerArt from '../assets/maps/yard-summer.png'
import summerTree from '../assets/maps/yard-summer-tree-front.png'
import summerBench from '../assets/maps/yard-summer-bench-front.png'
import autumnArt from '../assets/maps/yard-autumn.png'
import autumnTree from '../assets/maps/yard-autumn-tree-front.png'
import autumnBench from '../assets/maps/yard-autumn-bench-front.png'
import winterArt from '../assets/maps/yard-winter.png'
import winterTree from '../assets/maps/yard-winter-tree-front.png'
import winterBench from '../assets/maps/yard-winter-bench-front.png'

export interface TileFootprint { x: number; y: number; width: number; height: number }
export interface ArtLayer {
  id: string
  key: string
  url: string
  x: number
  y: number
  pixelWidth: number
  pixelHeight: number
  depth: number
  status: 'review-sample' | 'provisional'
}

/** A sample furniture layer can be replaced without moving the interaction anchors. */
export const homeFurniture: ReadonlyArray<{ id: string; footprint: TileFootprint; artStatus: ArtLayer['status'] }> = [
  { id: 'bed', footprint: { x: 2, y: 2, width: 8, height: 7 }, artStatus: 'review-sample' },
  { id: 'bookshelf', footprint: { x: 11, y: 2, width: 4, height: 3 }, artStatus: 'provisional' },
  { id: 'wardrobe', footprint: { x: 21, y: 2, width: 7, height: 4 }, artStatus: 'provisional' },
  { id: 'sofa', footprint: { x: 3, y: 14, width: 8, height: 4 }, artStatus: 'provisional' },
  { id: 'coffee-table', footprint: { x: 14, y: 13, width: 3, height: 2 }, artStatus: 'provisional' },
  { id: 'desk', footprint: { x: 22, y: 13, width: 6, height: 5 }, artStatus: 'provisional' },
  { id: 'plant', footprint: { x: 22, y: 19, width: 2, height: 2 }, artStatus: 'provisional' },
]

export const homeSampleLayers: ReadonlyArray<ArtLayer> = [
  { id: 'room-base', key: 'home-sample-base', url: homeBaseSample, x: 0, y: 0, pixelWidth: 480, pixelHeight: 384, depth: 0, status: 'review-sample' },
  { id: 'bed', key: 'home-sample-bed', url: homeBedSample, x: 30, y: 33, pixelWidth: 131, pixelHeight: 113, depth: 0.1, status: 'review-sample' },
  { id: 'bed-front', key: 'home-sample-bed-front', url: homeBedFrontSample, x: 33, y: 129, pixelWidth: 126, pixelHeight: 16, depth: 10.145, status: 'review-sample' },
  { id: 'other-front', key: 'home-sample-other-front', url: homeOtherFrontSample, x: 0, y: 0, pixelWidth: 480, pixelHeight: 384, depth: 10.29, status: 'provisional' },
]

export const homeFallbackLayers: ReadonlyArray<ArtLayer> = [
  { id: 'room-flat', key: 'home-legacy-art', url: homeLegacy, x: 0, y: 0, pixelWidth: 480, pixelHeight: 384, depth: 0, status: 'provisional' },
  { id: 'front-flat', key: 'home-legacy-front', url: homeLegacyFront, x: 0, y: 0, pixelWidth: 480, pixelHeight: 384, depth: 10.29, status: 'provisional' },
]

const yardFiles: Record<Season, [string, string, string]> = {
  spring: [springArt, springTree, springBench],
  summer: [summerArt, summerTree, summerBench],
  autumn: [autumnArt, autumnTree, autumnBench],
  winter: [winterArt, winterTree, winterBench],
}

const yardLayerSet = (season: Season): ReadonlyArray<ArtLayer> => {
  const files = yardFiles[season]
  return [
    { id: 'yard-base', key: `yard-${season}-art`, url: files[0], x: 0, y: 0, pixelWidth: 704, pixelHeight: 544, depth: 0, status: 'provisional' },
    { id: 'memorial-tree-crown', key: `yard-${season}-tree`, url: files[1], x: 0, y: 0, pixelWidth: 704, pixelHeight: 544, depth: 10.35, status: 'provisional' },
    { id: 'bench-front', key: `yard-${season}-bench`, url: files[2], x: 0, y: 0, pixelWidth: 704, pixelHeight: 544, depth: 10.4, status: 'provisional' },
  ]
}

export const yardLayers: Record<Season, ReadonlyArray<ArtLayer>> = {
  spring: yardLayerSet('spring'), summer: yardLayerSet('summer'),
  autumn: yardLayerSet('autumn'), winter: yardLayerSet('winter'),
}

export const allMapLayers = [...homeSampleLayers, ...homeFallbackLayers, ...Object.values(yardLayers).flat()]
