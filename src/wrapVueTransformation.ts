import * as _ from 'lodash'
import assert from 'assert'
import type { Operation } from './operationUtils'
import type VueTransformation from './VueTransformation'
import { API, FileInfo } from 'jscodeshift'

const BOM = '\uFEFF'

export type Context = {
  file: FileInfo,
  api: API
}

export type VueASTTransformation<Params = void> = {
  (context: Context, params: Params): Operation[]
}

export default function astTransformationToVueTransformationModule<
  Params = any
>(transformAST: VueASTTransformation<Params>): VueTransformation {
  const transform: VueTransformation = (file, api, options: Params) => {
    const source = file.source
    // 通过 jscodeshift的j、root、file等构造 context , options 作为可选参数
    const fixOperations: Operation[] = transformAST({ file, api }, options)

    return applyOperation(source, fixOperations)
  }

  return transform
}

/**
 * Modify source files
 * @param sourceCode File's source code
 * @param tempOperations Modify the object
 */
export function applyOperation(sourceCode: string, tempOperations: Operation[]) {
  // clone the array
  const bom = sourceCode.startsWith(BOM) ? BOM : "",
    text: string = bom ? sourceCode.slice(1) : sourceCode;
  let lastPos: number = Number.MAX_VALUE,
    output: string = bom;

  let applyOperations: Operation[] = [];

  // The Lodash grouping function is called to group the objects in the array according to nodeRange
  _.forEach(_.groupBy(tempOperations, "nodeRange"), (value: any, key: string) => {
    let tempOperation: Operation | null = mergeOperations(value, text)
    if (tempOperation) {
      applyOperations.push(tempOperation);
    }
  });

  for (const operation of applyOperations.sort(compareOperationsByRange)) {
    attemptOperation(operation);
  }

  return output;

  /**
   * Try to use the 'operation' from a problem.
   * @param   {Message} problem The message object to apply operations from
   * @returns {boolean}         Whether operation was successfully applied
   */
  function attemptOperation(operation: Operation) {
    const start = operation.range[0];
    const end = operation.range[1];
    // Remain it as a problem if it's overlapped or it's a negative range
    if (lastPos >= start || start > end) {
      return false;
    }

    // Remove BOM.
    if (
      (start < 0 && end >= 0) ||
      (start === 0 && operation.text.startsWith(BOM))
    ) {
      output = "";
    }

    // Make output to this operation.
    output += text.slice(Math.max(0, lastPos), Math.max(0, start));
    output += operation.text;
    lastPos = end;
    return true;
  }
}

/**
   * Merges the given operations array into one.
   * @param {Operation[]} operations The operations to merge.
   * @param {SourceCode} sourceCode The source code object to get the text between operations.
   * @returns {{text: string, range: number[]}} The merged operations
   */
function mergeOperations(operations: Operation[], sourceCode: String): Operation | null {
  for (const operation of operations) {
    assertValidOperation(operation);
  }

  if (operations.length === 0) {
    return null;
  }
  if (operations.length === 1) {
    return operations[0];
  }

  operations.sort(compareOperationsByRange);

  const originalText = sourceCode;
  const start = operations[0].range[0];
  const end = operations[operations.length - 1].range[1];
  let text: string = "";
  let lastPos: number = Number.MIN_SAFE_INTEGER;

  for (const operation of operations) {
    assert(
      operation.range[0] >= lastPos,
      "Invalid Operation."
    );

    if (operation.range[0] >= 0) {
      text += originalText.slice(Math.max(0, start, lastPos), operation.range[0]);
    }
    text += operation.text;
    lastPos = operation.range[1];
  }
  text += originalText.slice(Math.max(0, start, lastPos), end);
  return { range: [start, end], text } as Operation;
}

/**
 * Compares items in a operations array by range.
 * @param {Operation} a The first message.
 * @param {Operation} b The second message.
 * @returns {int} -1 if a comes before b, 1 if a comes after b, 0 if equal.
 * @private
 */
function compareOperationsByRange(a: Operation, b: Operation): number {
  return a.range[0] - b.range[0] || a.range[1] - b.range[1];
}

/**
 * Check that a operation has a valid range.
 * @param {Operation|null} operation The operation to validate.
 * @returns {void}
 */
function assertValidOperation(operation: Operation): void {
  if (operation) {
    assert(
      operation.range &&
      typeof operation.range[0] === "number" &&
      typeof operation.range[1] === "number",
      `Operation has invalid range: ${JSON.stringify(operation, null, 2)}`
    );
  }
}