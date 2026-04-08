import { computeFaceMeta } from './D20Geometry.js'

// Face-read D4: each face has one number, centered with text pointing toward apex.
export const D4_NUMBERS = [1, 2, 3, 4]

// All faces in a tetrahedron are adjacent to every other, so any ordering is spindown.
export const D4_SPINDOWN = [1, 2, 3, 4]

// Regular tetrahedron with edge length = sizeInMM, centred at origin.
// v0,v1,v2 = equilateral base (y = -H/4); v3 = apex (y = +3H/4).
export function getD4Vertices(sizeInMM) {
  const a  = sizeInMM
  const r  = a / Math.sqrt(3)     // base circumradius
  const H  = a * Math.sqrt(2 / 3) // total height
  return [
    [ r,      -H / 4, 0      ],  // v0: base +X
    [-r / 2,  -H / 4,  a / 2 ],  // v1: base +Z
    [-r / 2,  -H / 4, -a / 2 ],  // v2: base -Z
    [ 0,    3 * H / 4, 0      ],  // v3: apex
  ]
}

// Outward-wound face indices (verified with right-hand rule).
export const D4_FACE_INDICES = [
  [0, 1, 2],  // base   — normal −Y
  [0, 3, 1],  // front-right face
  [1, 3, 2],  // front-left face
  [2, 3, 0],  // back face
]

// Height as a fraction of edge length: H = a * sqrt(2/3)
export const D4_HEIGHT_FACTOR = Math.sqrt(2 / 3)

export function computeD4FaceDescriptors(sizeInMM) {
  const verts = getD4Vertices(sizeInMM)
  return D4_FACE_INDICES.map((fi, i) => {
    const vertices = fi.map(idx => verts[idx])
    const meta = computeFaceMeta(vertices)
    return { index: i, number: D4_NUMBERS[i], vertices, ...meta }
  })
}
