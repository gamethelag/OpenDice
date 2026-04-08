import * as jscad from '@jscad/modeling'
import { getD8Vertices, D8_FACE_INDICES } from '../geometry/D8Geometry.js'

export function buildD8Solid(sizeInMM, d8Height = null) {
  const points = getD8Vertices(sizeInMM, d8Height)
  return jscad.primitives.polyhedron({ points, faces: D8_FACE_INDICES, orientation: 'outward' })
}
