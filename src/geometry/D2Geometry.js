import { sub3, scale3, normalize3, cross3, dot3 } from './vectorMath.js'

export const D2_NUMBERS  = [1, 2]
export const D2_SPINDOWN = [1, 2]  // flip the coin — trivially adjacent

export const D2_DEFAULT_SIDES  = 8   // octagonal cross-section
export const D2_DEFAULT_HEIGHT = 4   // mm thick

// Regular N-sided prism (coin/cylinder), centred at origin.
// sizeInMM = point-to-point diameter (circumdiameter of the polygon).
// Vertices 0..N-1 = top ring (y = +H/2), N..2N-1 = bottom ring (y = -H/2).
export function getD2Vertices(sizeInMM, sides, d2Height) {
  const R = sizeInMM / 2
  const N = sides  ?? D2_DEFAULT_SIDES
  const H = d2Height ?? D2_DEFAULT_HEIGHT
  const verts = []
  for (let i = 0; i < N; i++) {
    const θ = (2 * Math.PI * i) / N
    verts.push([R * Math.cos(θ), H / 2,  R * Math.sin(θ)])  // top ring
  }
  for (let i = 0; i < N; i++) {
    const θ = (2 * Math.PI * i) / N
    verts.push([R * Math.cos(θ), -H / 2, R * Math.sin(θ)])  // bottom ring
  }
  return verts
}

// All N+2 faces for the solid.
// Winding verified so Newell normals point outward.
export function getD2FaceIndices(sides) {
  const N = sides ?? D2_DEFAULT_SIDES
  const faces = []
  // Top face (normal +Y): reverse angular order → Newell gives +Y
  faces.push(Array.from({ length: N }, (_, i) => N - 1 - i))
  // Bottom face (normal -Y): forward angular order → Newell gives -Y
  faces.push(Array.from({ length: N }, (_, i) => N + i))
  // Side quads
  for (let i = 0; i < N; i++) {
    faces.push([i, (i + 1) % N, N + (i + 1) % N, N + i])
  }
  return faces
}

// Face meta for a flat N-gon: vBasis points toward vertex 0 (a polygon corner),
// so text at rot=0 is oriented with its top toward that corner — vertex-up convention.
function computeD2FaceMeta(vertices, normal) {
  const n = vertices.length
  const center = [0, 0, 0]
  for (const v of vertices) { center[0] += v[0]; center[1] += v[1]; center[2] += v[2] }
  center[0] /= n; center[1] /= n; center[2] /= n

  // vBasis = direction from face center toward vertex 0, projected onto face plane
  const toV0 = sub3(vertices[0], center)
  const vBasis = normalize3(sub3(toV0, scale3(normal, dot3(toV0, normal))))
  const uBasis = normalize3(cross3(vBasis, normal))

  let faceRadius = 0
  for (const v of vertices) {
    const d = sub3(v, center)
    const u = dot3(d, uBasis), vv = dot3(d, vBasis)
    faceRadius = Math.max(faceRadius, Math.sqrt(u * u + vv * vv))
  }
  return { center, normal, uBasis, vBasis, faceRadius }
}

// Only the two flat faces are user-editable (numbered 1 and 2).
export function computeD2FaceDescriptors(sizeInMM, sides, d2Height) {
  const N  = sides    ?? D2_DEFAULT_SIDES
  const verts = getD2Vertices(sizeInMM, N, d2Height)
  const topVerts = Array.from({ length: N }, (_, i) => verts[i])
  const botVerts = Array.from({ length: N }, (_, i) => verts[N + i])
  return [
    { index: 0, number: 1, vertices: topVerts, ...computeD2FaceMeta(topVerts, [0, 1, 0]) },
    { index: 1, number: 2, vertices: botVerts, ...computeD2FaceMeta(botVerts, [0, -1, 0]) },
  ]
}

// All face planes including the N side quads — used for JSCAD mesh classification only.
export function computeD2ClassificationDescriptors(sizeInMM, sides, d2Height) {
  const editable = computeD2FaceDescriptors(sizeInMM, sides, d2Height)
  const N = sides ?? D2_DEFAULT_SIDES
  const R = sizeInMM / 2
  // The centroid of a side quad projects onto its own normal at R·cos(π/N), not R,
  // because the chord midpoint is inset from the circumradius by that factor.
  // Setting center at the inset radius makes bestPlane.d match the actual centroid
  // distance so the 0.02 mm tolerance check in jscadToThreeGeometry passes.
  const inset = R * Math.cos(Math.PI / N)
  const sideFaces = Array.from({ length: N }, (_, i) => {
    const θ = (2 * Math.PI * (i + 0.5)) / N  // midpoint angle for this side quad
    const nx = Math.cos(θ), nz = Math.sin(θ)
    return { normal: [nx, 0, nz], center: [inset * nx, 0, inset * nz] }
  })
  return [...editable, ...sideFaces]
}
