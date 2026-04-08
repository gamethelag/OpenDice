const PHI = (1 + Math.sqrt(5)) / 2

// Opposite faces sum to 13. Pairs: [0↔6, 1↔9, 2↔8, 3↔11, 4↔10, 5↔7]
// Face 0's CW neighbors from 12-o'clock: face3=2, face1=4, face2=6, face10=5, face7=3
export const D12_NUMBERS = [1, 4, 6, 2, 8, 10, 12, 3, 7, 9, 5, 11]

// Spindown: consecutive numbers on adjacent faces.
// Hamiltonian path: face0→1→2→5→4→3→7→8→6→9→10→11
export const D12_SPINDOWN = [1, 2, 3, 6, 5, 4, 9, 7, 8, 10, 11, 12]

// Regular dodecahedron: sizeInMM = circumdiameter (point-to-point).
// 20 vertices in 4 groups:
//   (±1, ±1, ±1)            × 8
//   (0, ±φ, ±1/φ) perms     × 12
// Circumradius of raw verts = sqrt(3), so we scale by R / sqrt(3).
function getD12Vertices(sizeInMM) {
  const R = sizeInMM / 2
  const s = R / Math.sqrt(3)
  const p = PHI * s
  const q = s / PHI
  return [
    // Group A: (±1, ±1, ±1) scaled
    [ s,  s,  s],  // 0
    [ s,  s, -s],  // 1
    [ s, -s,  s],  // 2
    [ s, -s, -s],  // 3
    [-s,  s,  s],  // 4
    [-s,  s, -s],  // 5
    [-s, -s,  s],  // 6
    [-s, -s, -s],  // 7
    // Group B: (0, ±φ, ±1/φ) and permutations
    [ 0,  q,  p],  // 8
    [ 0,  q, -p],  // 9
    [ 0, -q,  p],  // 10
    [ 0, -q, -p],  // 11
    [ p,  0,  q],  // 12
    [ p,  0, -q],  // 13
    [-p,  0,  q],  // 14
    [-p,  0, -q],  // 15
    [ q,  p,  0],  // 16
    [ q, -p,  0],  // 17
    [-q,  p,  0],  // 18
    [-q, -p,  0],  // 19
  ]
}

// 12 pentagonal faces — winding corrected by ensureOutwardWinding
// Derived from the dodecahedron adjacency graph (each vertex has degree 3)
const D12_FACE_INDICES_RAW = [
  [0, 8,  4, 18, 16],
  [0, 16, 1, 13, 12],
  [0, 12, 2, 10,  8],
  [1,  9, 5, 18, 16],
  [1, 13, 3, 11,  9],
  [2, 17, 3, 13, 12],
  [3, 11, 7, 19, 17],
  [4, 14, 15, 5, 18],
  [5,  9, 11, 7, 15],
  [15, 14, 6, 19, 7],
  [6, 14,  4,  8, 10],
  [10,  6, 19, 17, 2],
]

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

// Corrected face index arrays (exported for JSCAD solid builder)
export function getD12FaceIndices(vertices) {
  return ensureOutwardWinding(D12_FACE_INDICES_RAW, vertices)
}

// Edge-based face meta for D12 pentagons:
// "up" on the face = direction from bottom-edge midpoint toward the apex vertex.
// This ensures text renders with a flat edge at the bottom, not a point.
function computeD12FaceMeta(faceVerts) {
  const n = faceVerts.length  // 5
  // Newell normal
  const nm = [0, 0, 0]
  for (let i = 0; i < n; i++) {
    const a = faceVerts[i], b = faceVerts[(i + 1) % n]
    nm[0] += (a[1] - b[1]) * (a[2] + b[2])
    nm[1] += (a[2] - b[2]) * (a[0] + b[0])
    nm[2] += (a[0] - b[0]) * (a[1] + b[1])
  }
  // Centroid
  const center = [0, 0, 0]
  for (const v of faceVerts) { center[0] += v[0]; center[1] += v[1]; center[2] += v[2] }
  center[0] /= n; center[1] /= n; center[2] /= n
  // Ensure outward normal
  if (nm[0]*center[0] + nm[1]*center[1] + nm[2]*center[2] < 0) {
    nm[0] = -nm[0]; nm[1] = -nm[1]; nm[2] = -nm[2]
  }
  const nLen = Math.sqrt(nm[0]*nm[0] + nm[1]*nm[1] + nm[2]*nm[2])
  const normal = [nm[0]/nLen, nm[1]/nLen, nm[2]/nLen]

  // Find bottom edge: edge whose midpoint has lowest y-value
  let bottomEdgeIdx = 0
  let minY = Infinity
  for (let i = 0; i < n; i++) {
    const my = (faceVerts[i][1] + faceVerts[(i + 1) % n][1]) / 2
    if (my < minY) { minY = my; bottomEdgeIdx = i }
  }
  // Apex = vertex most opposite the bottom edge (3 steps along pentagon from bottom edge start)
  const apexIdx = (bottomEdgeIdx + 3) % n
  const apex = faceVerts[apexIdx]
  const edgeMid = [
    (faceVerts[bottomEdgeIdx][0] + faceVerts[(bottomEdgeIdx + 1) % n][0]) / 2,
    (faceVerts[bottomEdgeIdx][1] + faceVerts[(bottomEdgeIdx + 1) % n][1]) / 2,
    (faceVerts[bottomEdgeIdx][2] + faceVerts[(bottomEdgeIdx + 1) % n][2]) / 2,
  ]

  // vBasis: edge-midpoint → apex, projected onto face plane
  const toApex = [apex[0]-edgeMid[0], apex[1]-edgeMid[1], apex[2]-edgeMid[2]]
  const dv = toApex[0]*normal[0] + toApex[1]*normal[1] + toApex[2]*normal[2]
  const vRaw = [toApex[0]-dv*normal[0], toApex[1]-dv*normal[1], toApex[2]-dv*normal[2]]
  const vLen = Math.sqrt(vRaw[0]*vRaw[0] + vRaw[1]*vRaw[1] + vRaw[2]*vRaw[2])
  const vBasis = [vRaw[0]/vLen, vRaw[1]/vLen, vRaw[2]/vLen]
  // uBasis: cross(vBasis, normal) — points right when looking at face
  const uBasis = [
    vBasis[1]*normal[2] - vBasis[2]*normal[1],
    vBasis[2]*normal[0] - vBasis[0]*normal[2],
    vBasis[0]*normal[1] - vBasis[1]*normal[0],
  ]

  let maxDist = 0
  for (const v of faceVerts) {
    const dx = v[0]-center[0], dy = v[1]-center[1], dz = v[2]-center[2]
    const u = dx*uBasis[0] + dy*uBasis[1] + dz*uBasis[2]
    const vv = dx*vBasis[0] + dy*vBasis[1] + dz*vBasis[2]
    maxDist = Math.max(maxDist, Math.sqrt(u*u + vv*vv))
  }
  return { center, normal, uBasis, vBasis, faceRadius: maxDist }
}

export function computeD12FaceDescriptors(sizeInMM) {
  const verts = getD12Vertices(sizeInMM)
  const correctedFaces = ensureOutwardWinding(D12_FACE_INDICES_RAW, verts)

  return correctedFaces.map((fi, i) => {
    const faceVerts = fi.map(idx => verts[idx])
    const meta = computeD12FaceMeta(faceVerts)
    return { index: i, number: D12_NUMBERS[i], vertices: faceVerts, ...meta }
  })
}

export { getD12Vertices }
