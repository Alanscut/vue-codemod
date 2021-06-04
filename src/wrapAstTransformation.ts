import type { JSCodeshift, Transform, Core } from 'jscodeshift'

export type Context = {
  root: ReturnType<Core>
  j: JSCodeshift
  filename: string
}

export type ASTTransformation<Params = void> = {
  (context: Context, params: Params): void
}

export default function astTransformationToJSCodeshiftModule<Params = any>(
  transformAST: ASTTransformation<Params>
): Transform {
  const transform: Transform = (file, api, options: Params) => {
    const j = api.jscodeshift
    const root = j(file.source)
    // 通过 jscodeshift的j、root、file等构造 context , options 作为可选参数
    transformAST({ root, j, filename: file.path }, options)

    return root.toSource({ lineTerminator: '\n' })
  }

  return transform
}
