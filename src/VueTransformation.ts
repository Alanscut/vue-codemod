

interface FileInfo {
  /** The absolute path to the current file. */
  path: string;
  /** The source code of the current file. */
  source: string;
}

interface API {
  j: JSCodeshift;
  jscodeshift: JSCodeshift;
  // stats: Stats;
  report: (msg: string) => void;
}

interface Options {
  [option: string]: any;
}
export interface VueTransform {

  (file: FileInfo, api: API, options: Options): string | null | undefined | void;

  // findNode(rootAst);
  // fix(node)
  // apply(fixers, sourceCode)
}

export default abstract class VueTransformation {
  // TODO:
  
}


