import * as parser from 'vue-eslint-parser'
import fs from 'fs'
import type { VueTransformation } from '../src/wrapVueTransformation'

/**
 * 每一个实际的规则，需要做以下几件事：
 * 1、findNodes(fileInfo, ast): 寻找匹配规则的节点
 * 2、fix(nodes): 完善匹配节点的增删改逻辑
 * 3、applyFix(fileInfo, tempFixes): 执行fixer，对源码进行增删改，并返回转换后的代码
 * @param context 
 */

/**
 * 定位 slot attribute 节点
 * 
 * @param context 
 * @param templateBody 
 * @returns 所有的 slot attribute 节点
 */
function findSlot(context, templateBody): parser.AST.Node[] {
  const {parser, fileInfo} = context;
  const ast = parser.parse(fileInfo.source, options)
  var toFixNodes : parser.AST.Node[] = []
  parser.AST.traverseNodes(ast.templateBody, {
    enterNode(node: parser.AST.Node) {
      if (node.type === 'VAttribute' && node.key.name === 'slot') {
        toFixNodes.push(node)
      }
    }
  })
  return toFixNodes;
}

/**
 * 对 slotAttr 的修复逻辑
 * @param fixer 包含remove/insert/replace等接口的对象
 * @param slotAttr 上面查找到的 slot attribute 节点
 */
function fix(slotAttr): object {
  const target = slotAttr.parent.parent
  const slotValue = slotAttr.value.value

  fixer.remove(slotAttr)
  fixer.insertBefore(target, `<template v-slot:${slotValue}>`)
  fixer.insertAfter(target, `</template>`)



  

  return {
    range:slotAttr.range
    text: ""
  };
}

export interface VueTransform {
  findNodes(context: object): parser.AST.Node[]
  fix(fixer: object, node: parser.AST.Node): object
}

export default function astTransformationToVueModule<Params = any>(
  transformAST: VueTransformation<Params>
): string {
  // const transform: VueTransform = (file, api, options: Params) => {
  //   const parser = api.parser
  //   const root = file.source
  //   // 通过 jscodeshift的j、root、file等构造 context , options 作为可选参数
  //   transformAST({ root, j, filename: file.path }, options)

  //   return {
  //     findNodes(context: object): parser.AST.Node[]
  //     fix(fixer: {}, node: parser.AST.Node): Object
  //   }
  // }
  // 获取源码文本
  const source = fileInfo.source
  // 获取需要 fix 的 node 节点
  const toFixNodes = findSlot(context, templateBody)
  // 计算 fixers 数组
  const fixers = []
  toFixNodes.forEach(node => {
    fixers.push(fix(fixer, node))
  });
  cosnt out = applyFix(source, fixers)

  return out
}
