import type VueTransform from '../src/VueTransformation'
import * as Parser from "vue-eslint-parser";

type VueTransformationModule = {
  default: VueTransform
  parser?: string | Parser
}

const transformationMap: {
  [name: string]: VueTransformationModule
} = {
  'slot-attribute': require('./slot-attribute'),
}

export default transformationMap
