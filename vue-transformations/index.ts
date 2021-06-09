import type VueTransformation from '../src/VueTransformation'

type VueTransformationModule = {
  default: VueTransformation
  parser?: string
}

const transformationMap: {
  [name: string]: VueTransformationModule
} = {
  'slot-attribute': require('./slot-attribute'),
  'slot-default': require('./slot-default'),
}

export default transformationMap
