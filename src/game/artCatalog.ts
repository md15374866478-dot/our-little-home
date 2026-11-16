import yardAutumnNativeTree from '../assets/maps/yard-autumn-native-tree.png'
import yardAutumnNative from '../assets/maps/yard-autumn-native.png'
import yardAutumnNativeBench from '../assets/maps/yard-autumn-native-bench.png'
import homeNative from '../assets/maps/home-native.png'
import homeNativeSofa from '../assets/maps/home-native-sofa.png'
import type { Season } from './environment'
import homeLegacy from '../assets/maps/home.png'
import homeLegacyFront from '../assets/maps/home-front.png'
import homeBaseSample from '../assets/maps/home-base-sample.png'
import homeBedSample from '../assets/maps/home-bed-sample.png'
import homeBedFrontSample from '../assets/maps/home-bed-front-sample.png'
import homeOtherFrontSample from '../assets/maps/home-other-front-sample.png'
import homeDetailed from '../assets/maps/home-detailed.png'
import homeDetailedBlanket from '../assets/maps/home-detailed-blanket-front.png'
import homeDetailedBedFront from '../assets/maps/home-detailed-bed-front.png'
import homeDetailedSofaFront from '../assets/maps/home-detailed-sofa-front.png'
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
  { id: 'bed', footprint: { x: 2, y: 2, width: 8, height: 8 }, artStatus: 'review-sample' },
  { id: 'bookshelf', footprint: { x: 10, y: 2, width: 6, height: 4 }, artStatus: 'review-sample' },
  { id: 'wardrobe', footprint: { x: 20, y: 2, width: 9, height: 5 }, artStatus: 'review-sample' },
  { id: 'sofa', footprint: { x: 2, y: 14, width: 10, height: 5 }, artStatus: 'review-sample' },
  { id: 'coffee-table', footprint: { x: 13, y: 13, width: 5, height: 3 }, artStatus: 'review-sample' },
  { id: 'desk', footprint: { x: 21, y: 13, width: 8, height: 6 }, artStatus: 'review-sample' },
  { id: 'plant', footprint: { x: 21, y: 19, width: 3, height: 3 }, artStatus: 'review-sample' },
  { id: 'left-plant', footprint: { x: 1, y: 17, width: 3, height: 4 }, artStatus: 'review-sample' },
  { id: 'left-lamp', footprint: { x: 2, y: 20, width: 2, height: 3 }, artStatus: 'review-sample' },
  { id: 'right-lamp', footprint: { x: 25, y: 20, width: 3, height: 3 }, artStatus: 'review-sample' },
]

/** Original AI-assisted art draft, reduced offline to exactly one game pixel per pixel. */
export const homeDetailedLayers: ReadonlyArray<ArtLayer> = [
  { id: 'room-detailed', key: 'home-detailed', url: homeDetailed, x: 0, y: 0, pixelWidth: 480, pixelHeight: 384, depth: 0, status: 'review-sample' },
  { id: 'blanket-front', key: 'home-detailed-blanket', url: homeDetailedBlanket, x: 43, y: 101, pixelWidth: 107, pixelHeight: 31, depth: 10.132, status: 'review-sample' },
  { id: 'bed-front', key: 'home-detailed-bed-front', url: homeDetailedBedFront, x: 31, y: 127, pixelWidth: 133, pixelHeight: 25, depth: 10.152, status: 'review-sample' },
  { id: 'sofa-front', key: 'home-detailed-sofa-front', url: homeDetailedSofaFront, x: 41, y: 257, pixelWidth: 137, pixelHeight: 42, depth: 10.299, status: 'review-sample' },
]

/** Native source pixels map onto the same 480×384 world, independently of physics. */
export const homeNativeLayers: ReadonlyArray<ArtLayer> = [
  { id: 'room-native', key: 'home-detailed-native', url: homeNative, x: 0, y: 0, pixelWidth: 480, pixelHeight: 384, depth: 0, status: 'review-sample' },
  { id: 'sofa-front', key: 'home-detailed-native-sofa', url: homeNativeSofa, x: 41, y: 257, pixelWidth: 137, pixelHeight: 42, depth: 10.299, status: 'review-sample' },
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

export const yardAutumnNativeLayers: ReadonlyArray<ArtLayer> = [
  { id: 'yard-native-base', key: 'yard-autumn-native', url: yardAutumnNative, x: 0, y: 0, pixelWidth: 704, pixelHeight: 544, depth: 0, status: 'review-sample' },
  { id: 'yard-native-tree', key: 'yard-autumn-native-tree', url: yardAutumnNativeTree, x: 118, y: 272, pixelWidth: 103, pixelHeight: 90, depth: 10.35, status: 'review-sample' },
  { id: 'yard-native-bench', key: 'yard-autumn-native-bench', url: yardAutumnNativeBench, x: 498, y: 386, pixelWidth: 92, pixelHeight: 7, depth: 10.4, status: 'review-sample' },
]

export const allMapLayers = [...yardAutumnNativeLayers, ...homeNativeLayers, ...homeDetailedLayers, ...homeSampleLayers, ...homeFallbackLayers, ...Object.values(yardLayers).flat()]
