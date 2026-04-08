import * as jscad from '@jscad/modeling'
import { getD10Vertices, D10_FACE_INDICES_RAW } from '../geometry/D10Geometry.js'

function ensureOutwardWinding(faces, vertices) {
  return faces.map(face => {
    const pts = face.map(i => vertices[i])
    const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length
    const cy = pts.reduce((s, p) => s + p[1], 0) / pts.length
    const cz = pts.reduce((s, p) => s + p[2], 0) / pts.length
    let nx = 0, ny = 0, nz = 0
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length]
      nx += (a[1] - b[1]) * (a[2] + b[2])
      ny += (a[2] - b[2]) * (a[0] + b[0])
      nz += (a[0] - b[0]) * (a[1] + b[1])
    }
    return (nx * cx + ny * cy + nz * cz) < 0 ? [...face].reverse() : face
  })
}

export function buildD10Solid(sizeInMM, d10Radius = null) {
  const points = getD10Vertices(sizeInMM, d10Radius)
  const faces = ensureOutwardWinding(D10_FACE_INDICES_RAW, points)
  return jscad.primitives.polyhedron({ points, faces, orientation: 'outward' })
}
