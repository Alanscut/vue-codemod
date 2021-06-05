import { Node } from 'vue-eslint-parser/ast/nodes'
import * as OperationUtils from '../src/operationUtils'
import type { Operation } from '../src/operationUtils'
import type { VueASTTransformation } from '../src/wrapVueTransformation'
import * as parser from 'vue-eslint-parser'
import wrap from '../src/wrapVueTransformation'
import { Node } from 'jscodeshift'
 

/**
 * 每一个实际的规则，需要做以下几件事：
 * 1、findNodes(fileInfo, ast): 寻找匹配规则的节点
 * 2、fix(nodes): 完善匹配节点的增删改逻辑
 * 3、applyFix(fileInfo, tempFixes): 执行fixer，对源码进行增删改，并返回转换后的代码
 * @param context
 */

export const transformAST: VueASTTransformation = (context) => {
  var fixOperations: Operation[] = []
  const toFixNodes: Node[] = findNodes(context)
  toFixNodes.forEach((node) => {
    // fix(node) 返回的为 Operation 数组，因此用 concat 合并多个数组
    fixOperations = fixOperations.concat(fix(node))
  })
  return fixOperations
}

export default wrap(transformAST)
/**
 * 定位 slot attribute 节点
 *
 * @param context { file: FileInfo, api: API }
 * @param templateBody
 * @returns 所有的 slot attribute 节点
 */
function findNodes(context: any): Node[] {
  const { file } = context
  const source = file.source
  const options = { sourceType: 'module' }
  const ast = parser.parse(source, options)
  var toFixNodes: Node[] = []
  var root: Node = ast.templateBody
  parser.AST.traverseNodes(root, {
    enterNode(node: Node) {
      if (node.type === 'VAttribute' && node.key.name === 'slot') {
        toFixNodes.push(node)
      }
    },
    leaveNode(node: Node) {
      
    }
  })
  return toFixNodes
}
/**
 * 对 slotAttr 的修复逻辑
 * @param fixer 包含remove/insert/replace等接口的对象
 * @param slotAttr 上面查找到的 slot attribute 节点
 */
function fix(node: Node): Operation[] {
  const target: any = node!.parent!.parent // any 需要优化
  const slotValue: string = node!.value!.value

  var fixOperations: Operation[] = []
  fixOperations.push(OperationUtils.remove(node))
  fixOperations.push(
    OperationUtils.insertTextBefore(target, `<template v-slot:${slotValue}>`)
  )
  fixOperations.push(OperationUtils.insertTextAfter(target, `</template>`))

  return fixOperations
}
