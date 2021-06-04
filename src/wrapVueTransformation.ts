import type { JSCodeshift, Transform, Core } from 'jscodeshift'
import * as parser from 'vue-eslint-parser'
import type VueTransform from './VueTransformation'
const _ = require("lodash");
const assert = require("assert");
export type Context = {
  root: parser.AST.ESLintProgram
  parser: parser
  filename: string
}

export type VueTransformation<Params = void> = {
  (context: Context, params: Params): void
}

export default function astTransformationToVueModule<Params = any>(
  transformAST: VueTransformation<Params>
): VueTransform {
  const transform: VueTransform = (file, api, options: Params) => {
    const parser = api.parser
    const root = file.source
    // 通过 jscodeshift的j、root、file等构造 context , options 作为可选参数
    transformAST({ root, j, filename: file.path }, options)

    return root.toSource({ lineTerminator: '\n' })
  }

  return transform
}




function applyFix(sourceCode, tempFixes) {
  // 调用 Lodash 分组函数，根据 nodeRange 将数组中的对象进行分组
  _.forEach(_.groupBy(tempFixes, 'nodeRange'), function (value, key) {
    fixes.push(mergeFixes(value, text))
  })

  for (const problem of fixes.sort(compareFixesByRange)) {
    attemptFix(problem)
  }

  // all fix were recovered.
  output += text.slice(Math.max(0, lastPos))
}

/**
 * Try to use the 'fix' from a problem.
 * @param   {Message} problem The message object to apply fixes from
 * @returns {boolean}         Whether fix was successfully applied
 */
function attemptFix(fix) {
  const start = fix.range[0]
  const end = fix.range[1]
  console.log('=====>>>>>', 'attemptFix', start, end)
  // Remain it as a problem if it's overlapped or it's a negative range
  if (lastPos >= start || start > end) {
    return false
  }

  // Remove BOM.
  if ((start < 0 && end >= 0) || (start === 0 && fix.text.startsWith(BOM))) {
    output = ''
  }

  // Make output to this fix.
  console.log('=====>>>>> before: ', output)
  output += text.slice(Math.max(0, lastPos), Math.max(0, start))
  output += fix.text
  console.log('=====>>>>> after: ', output)
  lastPos = end
  return true
}

/**
 * Compares items in a fixes array by range.
 * @param {Fix} a The first message.
 * @param {Fix} b The second message.
 * @returns {int} -1 if a comes before b, 1 if a comes after b, 0 if equal.
 * @private
 */
function compareFixesByRange(a, b) {
  return a.range[0] - b.range[0] || a.range[1] - b.range[1]
}

/**
 * Check that a fix has a valid range.
 * @param {Fix|null} fix The fix to validate.
 * @returns {void}
 */
function assertValidFix(fix) {
  console.log('=====>>>>>', 'assertValidFix', JSON.stringify(fix))
  if (fix) {
    assert(
      fix.range &&
        typeof fix.range[0] === 'number' &&
        typeof fix.range[1] === 'number',
      `Fix has invalid range: ${JSON.stringify(fix, null, 2)}`
    )
  }
}

/**
 * Merges the given fixes array into one.
 * @param {Fix[]} fixes The fixes to merge.
 * @param {SourceCode} sourceCode The source code object to get the text between fixes.
 * @returns {{text: string, range: number[]}} The merged fixes
 */
function mergeFixes(fixes, sourceCode) {
  for (const fix of fixes) {
    assertValidFix(fix)
  }

  if (fixes.length === 0) {
    return null
  }
  if (fixes.length === 1) {
    return fixes[0]
  }

  fixes.sort(compareFixesByRange)

  const originalText = sourceCode
  const start = fixes[0].range[0]
  const end = fixes[fixes.length - 1].range[1]
  let text = ''
  let lastPos = Number.MIN_SAFE_INTEGER

  for (const fix of fixes) {
    assert(
      fix.range[0] >= lastPos,
      'Fix objects must not be overlapped in a report.'
    )

    if (fix.range[0] >= 0) {
      text += originalText.slice(Math.max(0, start, lastPos), fix.range[0])
    }
    text += fix.text
    lastPos = fix.range[1]
  }
  text += originalText.slice(Math.max(0, start, lastPos), end)
  console.log('=====>>>>>', 'report-translator.js#mergeFixes', {
    range: [start, end],
    text,
  })
  return { range: [start, end], text }
}
