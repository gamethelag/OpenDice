import * as jscad from '@jscad/modeling'
import { getD4Vertices, D4_FACE_INDICES } from '../geometry/D4Geometry.js'

export function buildD4Solid(sizeInMM) {
  const points = getD4Vertices(sizeInMM)
  return jscad.primitives.polyhedron({ points, faces: D4_FACE_INDICES, orientation: 'outward' })
}
