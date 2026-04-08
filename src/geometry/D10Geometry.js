import { sub3, normalize3, cross3, dot3 } from './vectorMath.js'

// Standard D10: upper faces clockwise from top = 1,7,5,9,3; opposite faces sum to 11
// (0 represents 10). Face order: upper[0-4], lower[5-9].
// U[i] is opposite L[(i+2)%5]: face0↔face7, face1↔face8, face2↔face9, face3↔face5, face4↔face6
// Sums: 1+10=11, 7+4=11, 5+6=11, 9+2=11, 3+8=11 ✓
export const D10_NUMBERS = [1, 7, 5, 9, 3, 2, 8, 0, 4, 6]

// Spindown: consecutive numbers on adjacent faces.
// Hamiltonian path: face0→1→2→3→4→8→7→6→5→9
export const D10_SPINDOWN = [1, 2, 3, 4, 5, 9, 8, 7, 6, 0]

// D% (percentile): same geometry, numbers 10,20,...,90,00 in same face positions as D10.
// 0 represents "00". Opposite faces sum to 110 (treating 00=100): same pairs as D10.
export const D_PERCENT_NUMBERS = [10, 70, 50, 90, 30, 20, 80, 0, 40, 60]
export const D_PERCENT_SPINDOWN = [10, 20, 30, 40, 50, 90, 80, 70, 60, 0]

// Ring height fraction that makes the kite faces exactly planar:
// a = (2*sin(PI/5) - sin(2*PI/5)) / (sin(2*PI/5) + 2*sin(PI/5))
const _s  = Math.sin(Math.PI / 5)   // sin 36°
const _S  = Math.sin(2 * Math.PI / 5) // sin 72°
export const A_FRAC = (2 * _s - _S) / (_S + 2 * _s)  // ≈ 0.1056  (fixed, ensures planar faces)
export const R_FRAC = 0.75  // default ring radius as fraction of half-height

// d10Radius: actual ring radius in mm; null → use R_FRAC * (sizeInMM/2)
export function getD10Vertices(sizeInMM, d10Radius = null) {
  const R = sizeInMM / 2
  const a = A_FRAC * R
  const r = d10Radius != null ? d10Radius : R_FRAC * R
  const verts = []
  verts.push([0, R, 0])  // 0: top apex
  for (let i = 0; i < 5; i++) {
    const θ = (2 * Math.PI * i) / 5
    verts.push([r * Math.cos(θ), a, r * Math.sin(θ)])  // 1-5: upper ring
  }
  for (let i = 0; i < 5; i++) {
    const θ = (2 * Math.PI * i) / 5 + Math.PI / 5
    verts.push([r * Math.cos(θ), -a, r * Math.sin(θ)]) // 6-10: lower ring (offset 36°)
  }
  verts.push([0, -R, 0]) // 11: bottom apex
  return verts
}

// Raw face index arrays — winding is verified/corrected in buildD10Solid
export const D10_FACE_INDICES_RAW = [
  // Upper kites: T, U[i], L[i], U[i+1]
  [0, 1, 6, 2],
  [0, 2, 7, 3],
  [0, 3, 8, 4],
  [0, 4, 9, 5],
  [0, 5, 10, 1],
  // Lower kites: B, L[i], U[i+1], L[i+1]
  [11, 6,  2,  7],
  [11, 7,  3,  8],
  [11, 8,  4,  9],
  [11, 9,  5, 10],
  [11, 10, 1,  6],
]

// Face meta for D10: vBasis points toward the nearest apex (T or B)
function computeD10FaceMeta(faceVerts, apexPos) {
  const n2 = faceVerts.length
  const center = [0, 0, 0]
  for (const v of faceVerts) { center[0] += v[0]; center[1] += v[1]; center[2] += v[2] }
  center[0] /= n2; center[1] /= n2; center[2] /= n2

  // Newell normal
  const n = [0, 0, 0]
  for (let i = 0; i < n2; i++) {
    const c = faceVerts[i], nx = faceVerts[(i + 1) % n2]
    n[0] += (c[1] - nx[1]) * (c[2] + nx[2])
    n[1] += (c[2] - nx[2]) * (c[0] + nx[0])
    n[2] += (c[0] - nx[0]) * (c[1] + nx[1])
  }
  if (dot3(n, center) < 0) { n[0] = -n[0]; n[1] = -n[1]; n[2] = -n[2] }
  const normal = normalize3(n)

  // vBasis: direction toward apex projected onto the face plane
  const toApex = sub3(apexPos, center)
  const d = dot3(toApex, normal)
  const projected = sub3(toApex, [d * normal[0], d * normal[1], d * normal[2]])
  const vBasis = normalize3(projected)
  const uBasis = normalize3(cross3(vBasis, normal))

  let maxDist = 0
  for (const v of faceVerts) {
    const dv = sub3(v, center)
    const u = dot3(dv, uBasis), vv = dot3(dv, vBasis)
    maxDist = Math.max(maxDist, Math.sqrt(u * u + vv * vv))
  }

  return { center, normal, uBasis, vBasis, faceRadius: maxDist }
}

export function computeD10FaceDescriptors(sizeInMM, d10Radius = null) {
  const verts = getD10Vertices(sizeInMM, d10Radius)
  const topApex = verts[0]
  const botApex = verts[11]

  return D10_FACE_INDICES_RAW.map((fi, i) => {
    const faceVerts = fi.map(idx => verts[idx])
    const apex = i < 5 ? topApex : botApex
    const meta = computeD10FaceMeta(faceVerts, apex)
    return { index: i, number: D10_NUMBERS[i], vertices: faceVerts, ...meta }
  })
}
