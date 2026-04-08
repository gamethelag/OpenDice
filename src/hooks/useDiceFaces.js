import { useMemo } from 'react'
import { computeFaceDescriptors } from '../geometry/D20Geometry.js'
import { computeD2FaceDescriptors, computeD2ClassificationDescriptors } from '../geometry/D2Geometry.js'
import { computeD4FaceDescriptors } from '../geometry/D4Geometry.js'
import { computeD6FaceDescriptors } from '../geometry/D6Geometry.js'
import { computeD8FaceDescriptors } from '../geometry/D8Geometry.js'
import { computeD10FaceDescriptors } from '../geometry/D10Geometry.js'
import { computeD12FaceDescriptors } from '../geometry/D12Geometry.js'

export function useDiceFaces(sizeInMM, diceType, d2Sides, d2Height, d8Height, d10Radius) {
  return useMemo(() => {
    let faceDescriptors
    if (diceType === 'd2')  faceDescriptors = computeD2FaceDescriptors(sizeInMM, d2Sides, d2Height)
    else if (diceType === 'd4')  faceDescriptors = computeD4FaceDescriptors(sizeInMM)
    else if (diceType === 'd6')  faceDescriptors = computeD6FaceDescriptors(sizeInMM)
    else if (diceType === 'd8')  faceDescriptors = computeD8FaceDescriptors(sizeInMM, d8Height)
    else if (diceType === 'd10' || diceType === 'd%') faceDescriptors = computeD10FaceDescriptors(sizeInMM, d10Radius)
    else if (diceType === 'd12') faceDescriptors = computeD12FaceDescriptors(sizeInMM)
    else faceDescriptors = computeFaceDescriptors(sizeInMM)

    // D2 has side faces that aren't in faceDescriptors; supply full set for mesh classification.
    const classificationDescriptors = diceType === 'd2'
      ? computeD2ClassificationDescriptors(sizeInMM, d2Sides, d2Height)
      : faceDescriptors

    return { faceDescriptors, classificationDescriptors }
  }, [sizeInMM, diceType, d2Sides, d2Height, d8Height, d10Radius])
}
