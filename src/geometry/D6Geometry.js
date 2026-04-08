import { sub3, normalize3, cross3, dot3, scale3 } from './vectorMath.js'

// Standard D6: opposite faces sum to 7 (1↔6, 2↔5, 3↔4)
export const D6_NUMBERS = [1, 6, 2, 5, 3, 4]

// Spindown: consecutive numbers on adjacent faces.
// Hamiltonian path through face adjacency graph: face0→face2→face1→face4→face3→face5
export const D6_SPINDOWN = [1, 3, 2, 5, 4, 6]

// 8 cube vertices: (±h, ±h, ±h) where h = sizeInMM / 2
// v0=(-,-,-) v1=(+,-,-) v2=(+,+,-) v3=(-,+,-)
// v4=(-,-,+) v5=(+,-,+) v6=(+,+,+) v7=(-,+,+)
export const D6_FACE_INDICES = [
  [3, 7, 6, 2],  // +Y top    → 1
  [4, 0, 1, 5],  // -Y bottom → 6
  [4, 5, 6, 7],  // +Z front  → 2
  [1, 0, 3, 2],  // -Z back   → 5
  [5, 1, 2, 6],  // +X right  → 3
  [0, 4, 7, 3],  // -X left   → 4
]

export function getD6Vertices(sizeInMM) {
  const h = sizeInMM / 2
  return [
    [-h, -h, -h], // 0
    [+h, -h, -h], // 1
    [+h, +h, -h], // 2
    [-h, +h, -h], // 3
    [-h, -h, +h], // 4
    [+h, -h, +h], // 5
    [+h, +h, +h], // 6
    [-h, +h, +h], // 7
  ]
}

// Custom face meta for quads: snap vBasis to the nearest edge direction
// instead of the apex-vertex approach (which gives diagonals for squares).
function computeQuadFaceMeta(vertices) {
  const center = [0, 0, 0]
  for (const v of vertices) { center[0] += v[0]; center[1] += v[1]; center[2] += v[2] }
  center[0] /= 4; center[1] /= 4; center[2] /= 4

  // Newell's method for normal
  const n = [0, 0, 0]
  for (let i = 0; i < 4; i++) {
    const c = vertices[i], nx = vertices[(i + 1) % 4]
    n[0] += (c[1] - nx[1]) * (c[2] + nx[2])
    n[1] += (c[2] - nx[2]) * (c[0] + nx[0])
    n[2] += (c[0] - nx[0]) * (c[1] + nx[1])
  }
  if (dot3(n, center) < 0) { n[0] = -n[0]; n[1] = -n[1]; n[2] = -n[2] }
  const normal = normalize3(n)

  // Project world-up onto face plane
  const worldUp = [0, 1, 0]
  const dotUp = dot3(worldUp, normal)
  let projUp = sub3(worldUp, scale3(normal, dotUp))
  if (Math.sqrt(projUp[0]**2 + projUp[1]**2 + projUp[2]**2) < 0.1) {
    const worldFwd = [0, 0, -1]
    const dotFwd = dot3(worldFwd, normal)
    projUp = sub3(worldFwd, scale3(normal, dotFwd))
  }
  projUp = normalize3(projUp)

  // Two edge directions of the quad
  const e0 = normalize3(sub3(vertices[1], vertices[0]))
  const e1 = normalize3(sub3(vertices[2], vertices[1]))

  // Pick the edge direction (or its reverse) most aligned with projUp
  let bestDot = -Infinity, vBasis = e0
  for (const d of [e0, scale3(e0, -1), e1, scale3(e1, -1)]) {
    const dv = dot3(d, projUp)
    if (dv > bestDot) { bestDot = dv; vBasis = d }
  }

  const uBasis = normalize3(cross3(vBasis, normal))

  let maxDist = 0
  for (const v of vertices) {
    const d = sub3(v, center)
    const u = dot3(d, uBasis), vv = dot3(d, vBasis)
    maxDist = Math.max(maxDist, Math.sqrt(u*u + vv*vv))
  }

  return { center, normal, uBasis, vBasis, faceRadius: maxDist }
}

export function computeD6FaceDescriptors(sizeInMM) {
  const verts = getD6Vertices(sizeInMM)
  return D6_FACE_INDICES.map((fi, i) => {
    const vertices = fi.map(idx => verts[idx])
    const meta = computeQuadFaceMeta(vertices)
    return { index: i, number: D6_NUMBERS[i], vertices, ...meta }
  })
}
