import * as jscad from '@jscad/modeling'
import { getD2Vertices, getD2FaceIndices } from '../geometry/D2Geometry.js'

export function buildD2Solid(sizeInMM, d2Sides, d2Height) {
  const points = getD2Vertices(sizeInMM, d2Sides, d2Height)
  const faces  = getD2FaceIndices(d2Sides)
  return jscad.primitives.polyhedron({ points, faces, orientation: 'outward' })
}
