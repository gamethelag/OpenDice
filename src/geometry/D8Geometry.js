import { sub3, normalize3, cross3, dot3, scale3 } from './vectorMath.js'

// Standard D8: opposite faces sum to 9.
// Upper faces clockwise from above: 1→3→5→7 (faces 0,1,2,3).
// Lower antipodals: 8,6,4,2 (faces 6,7,4,5).
export const D8_NUMBERS = [1, 3, 5, 7, 4, 2, 8, 6]

// Spindown: consecutive numbers on adjacent faces.
// Hamiltonian path: face0→1→2→3→7→4→5→6
export const D8_SPINDOWN = [1, 2, 3, 4, 6, 7, 8, 5]

// Regular octahedron vertices: (±R, 0, 0), (0, ±R, 0), (0, 0, ±R)
// where R = sizeInMM / √2  (circumradius from edge length)
// v0=(+R,0,0) v1=(-R,0,0) v2=(0,+R,0) v3=(0,-R,0) v4=(0,0,+R) v5=(0,0,-R)

// Face winding chosen so right-hand rule gives outward normals directly,
// avoiding the need for JSCAD to flip them (which it may not do reliably).
export const D8_FACE_INDICES = [
  [2, 4, 0],  // upper +X+Z → 1   (normal ≈ +,+,+)
  [2, 1, 4],  // upper -X+Z → 2   (normal ≈ -,+,+)
  [2, 5, 1],  // upper -X-Z → 3   (normal ≈ -,+,-)
  [2, 0, 5],  // upper +X-Z → 4   (normal ≈ +,+,-)
  [3, 0, 4],  // lower +X+Z → 6   (antipodal to face 2)
  [3, 4, 1],  // lower -X+Z → 5   (antipodal to face 3)
  [3, 1, 5],  // lower -X-Z → 8   (antipodal to face 0)
  [3, 5, 0],  // lower +X-Z → 7   (antipodal to face 1)
]

// d8Height = total height (top apex to bottom apex); null = regular octahedron (height = base * √2)
export function getD8Vertices(sizeInMM, d8Height = null) {
  const Rbase = sizeInMM / Math.SQRT2              // equatorial circumradius
  const Ry    = d8Height != null ? d8Height / 2 : Rbase  // apex height
  return [
    [Rbase,  0,     0],   // 0: +X
    [-Rbase, 0,     0],   // 1: -X
    [0,      Ry,    0],   // 2: +Y (top apex)
    [0,     -Ry,    0],   // 3: -Y (bottom apex)
    [0,      0,  Rbase],  // 4: +Z (front)
    [0,      0, -Rbase],  // 5: -Z (back)
  ]
}

// Custom meta for D8: point vBasis toward the apex vertex (top or bottom).
// This makes numbers upright — upper faces point toward the top apex,
// lower faces point toward the bottom apex.
function computeD8FaceMeta(vertices) {
  const center = [0, 0, 0]
  for (const v of vertices) { center[0] += v[0]; center[1] += v[1]; center[2] += v[2] }
  center[0] /= 3; center[1] /= 3; center[2] /= 3

  // Newell's method for normal
  const n = [0, 0, 0]
  for (let i = 0; i < 3; i++) {
    const c = vertices[i], nx = vertices[(i + 1) % 3]
    n[0] += (c[1] - nx[1]) * (c[2] + nx[2])
    n[1] += (c[2] - nx[2]) * (c[0] + nx[0])
    n[2] += (c[0] - nx[0]) * (c[1] + nx[1])
  }
  if (dot3(n, center) < 0) { n[0] = -n[0]; n[1] = -n[1]; n[2] = -n[2] }
  const normal = normalize3(n)

  // Apex = the vertex with the greatest |Y| value (either top or bottom apex)
  let apexIdx = 0, maxAbsY = -1
  for (let i = 0; i < 3; i++) {
    const absY = Math.abs(vertices[i][1])
    if (absY > maxAbsY) { maxAbsY = absY; apexIdx = i }
  }

  const base = vertices.filter((_, i) => i !== apexIdx)
  const baseMid = [
    (base[0][0] + base[1][0]) / 2,
    (base[0][1] + base[1][1]) / 2,
    (base[0][2] + base[1][2]) / 2,
  ]
  const vBasis = normalize3(sub3(vertices[apexIdx], baseMid))
  const uBasis = normalize3(cross3(vBasis, normal))

  let maxDist = 0
  for (const v of vertices) {
    const d = sub3(v, center)
    const u = dot3(d, uBasis), vv = dot3(d, vBasis)
    maxDist = Math.max(maxDist, Math.sqrt(u*u + vv*vv))
  }

  return { center, normal, uBasis, vBasis, faceRadius: maxDist }
}

export function computeD8FaceDescriptors(sizeInMM, d8Height = null) {
  const verts = getD8Vertices(sizeInMM, d8Height)
  return D8_FACE_INDICES.map((fi, i) => {
    const vertices = fi.map(idx => verts[idx])
    const meta = computeD8FaceMeta(vertices)
    return { index: i, number: D8_NUMBERS[i], vertices, ...meta }
  })
}
