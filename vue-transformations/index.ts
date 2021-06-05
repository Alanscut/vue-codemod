import type VueTransform from '../src/VueTransformation'

type VueTransformationModule = {
  default: VueTransform
  parser?: string
}

const transformationMap: {
  [name: string]: VueTransformationModule
} = {
  'slot-attribute': require('./slot-attribute'),
}

export default transformationMap
