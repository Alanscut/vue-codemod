import type { JSCodeshift, Transform, Core } from 'jscodeshift'

export type Context = {
  root: ReturnType<Core>
  j: JSCodeshift
  filename: string
}

export type ASTTransformation<Params = void> = {
  (context: Context, params: Params): void
}
// 每一个规则最后都是利用该函数返回一个 Transform 类型的 transform，而 transform 其实就是一个匿名函数，
// 传入 file, api 等参数即可处理并返回转换后的字符串文本
export default function astTransformationToJSCodeshiftModule<Params = any>(
  transformAST: ASTTransformation<Params>
): Transform {
  const transform: Transform = (file, api, options: Params) => {
    const j = api.jscodeshift
    const root = j(file.source)

    transformAST({ root, j, filename: file.path }, options)

    return root.toSource({ lineTerminator: '\n' })
  }

  return transform
}
