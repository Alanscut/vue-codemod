import { API } from 'jscodeshift';

interface FileInfo {
  /** The absolute path to the current file. */
  path: string;
  /** The source code of the current file. */
  source: string;
}

// interface API {
//   parser: vueParser;
//   // stats: Stats;
//   report: (msg: string) => void;
// }

interface Options {
  [option: string]: any;
}
export default interface VueTransformation {

  (file: FileInfo, api:API, options: Options): string | null | undefined | void;
  type?: 'vueTransformation'

  // findNode(rootAst);
  // fix(node)
  // apply(fixers, sourceCode)
}

// export default abstract class VueTransformation {
//   // TODO:
  
// }


