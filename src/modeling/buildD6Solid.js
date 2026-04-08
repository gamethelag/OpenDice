import * as jscad from '@jscad/modeling'

export function buildD6Solid(sizeInMM) {
  return jscad.primitives.cuboid({ size: [sizeInMM, sizeInMM, sizeInMM] })
}
