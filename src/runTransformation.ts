import jscodeshift, { Transform, Parser } from 'jscodeshift'
// @ts-ignore
import getParser from 'jscodeshift/src/getParser'
import createDebug from 'debug'

import { parse as parseSFC, stringify as stringifySFC } from './sfcUtils'
import type { SFCDescriptor } from './sfcUtils'

import VueTransformation from './VueTransformation'

const debug = createDebug('vue-codemod')

type FileInfo = {
  path: string
  source: string
}

type JSTransformation = Transform & {
  parser?: string | Parser
}

type JSTransformationModule =
  | JSTransformation
  | {
      default: Transform
      parser?: string | Parser
    }

type VueTransformationModule =
  | VueTransformation
  | {
      default: VueTransformation
    }

type TransformationModule = JSTransformationModule | VueTransformationModule

export default function runTransformation(
  fileInfo: FileInfo,
  transformationModule: TransformationModule,
  params: object = {}
) {
  let transformation: VueTransformation | JSTransformation
  // @ts-ignore
  if (typeof transformationModule.default !== 'undefined') {
    // @ts-ignore
    transformation = transformationModule.default
  } else {
    transformation = transformationModule
  }

  if (transformation instanceof VueTransformation) {
    debug('TODO: Running VueTransformation')
    // 通过 vue-eslint-parser 将 vue 文件的template部分转化成 AST
    return fileInfo.source
  }

  debug('Running jscodeshift transform')

  const { path, source } = fileInfo // source为任何文件的全部文本内容
  const extension = (/\.([^.]*)$/.exec(path) || [])[0]
  let lang = extension.slice(1)

  let descriptor: SFCDescriptor
  if (extension === '.vue') {
    descriptor = parseSFC(source, { filename: path }).descriptor  // 包装了@vue/compiler-dom中的解析接口

    // skip .vue files without script block
    // .vue文件如果不包含script部分，不做任何处理，直接返回源码
    if (!descriptor.script) {
      return source
    }

    lang = descriptor.script.lang || 'js'
    fileInfo.source = descriptor.script.content // 只获取了script的内容，导致后续都只处理script部分的内容
  }

  let parser = getParser()
  let parserOption = (transformationModule as JSTransformationModule).parser
  // force inject `parser` option for .tsx? files, unless the module specifies a custom implementation
  if (typeof parserOption !== 'object') {
    if (lang.startsWith('ts')) {
      parserOption = lang
    }
  }

  if (parserOption) {
    parser =
      typeof parserOption === 'string' ? getParser(parserOption) : parserOption
  }

  const j = jscodeshift.withParser(parser)  // 使用指定的parser，每个规则文件最后一行指定的 babylon
  const api = {
    j,
    jscodeshift: j,
    stats: () => {},
    report: () => {},
  }
  // 此处的 transformation 也就是 前面loadModule 里返回的 transform，一个匿名函数 (file: FileInfo, api: API, options: Options): string 
  const out = transformation(fileInfo, api, params) // 这一部分处理的是script的内容，将 jscodeshift 的 API 通过 api 参数传递
  if (!out) {
    return source // skipped，如果 out 为空，说明没有文本被转换了，所以直接返回原始文本 source
  }

  // need to reconstruct the .vue file from descriptor blocks
  // 如果是 .vue 文件，只转换了 script 部分的代码，需要重新恢复
  if (extension === '.vue') {
    if (out === descriptor!.script!.content) {
      return source // skipped, don't bother re-stringifying  如果script部分代码没变，那么仍然直接返回原始文本
    }

    descriptor!.script!.content = out // 现在把转换后的 out 赋值给 .vue 文件的 script 部分
    return stringifySFC(descriptor!)  // 将修改后script部分的源码回写到.vue文件中，其中的 template 部分保持不变
  }

  return out
}
