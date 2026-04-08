import * as jscad from '@jscad/modeling'
import { getD12Vertices, getD12FaceIndices } from '../geometry/D12Geometry.js'

export function buildD12Solid(sizeInMM) {
  const points = getD12Vertices(sizeInMM)
  const faces = getD12FaceIndices(points)
  return jscad.primitives.polyhedron({ points, faces, orientation: 'outward' })
}
