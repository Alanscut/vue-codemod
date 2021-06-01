#!/usr/bin/env node

import * as fs from 'fs'
import * as path from 'path'
import Module from 'module'

import * as yargs from 'yargs'
import * as globby from 'globby'

import createDebug from 'debug'

import builtInTransformations from '../transformations'
import runTransformation from '../src/runTransformation'

const debug = createDebug('vue-codemod')
const log = console.log.bind(console)

const { _: files, transformation: transformationName, params } = yargs
  .usage('Usage: $0 [file pattern]')
  .option('transformation', {
    alias: 't',
    type: 'string',
    describe: 'Name or path of the transformation module',
  })
  .option('params', {
    alias: 'p',
    describe: 'Custom params to the transformation',
  })
  .demandOption('transformation')
  .help().argv

// TODO: port the `Runner` interface of jscodeshift
async function main() {
  const resolvedPaths = globby.sync(files as string[])
  const transformationModule = loadTransformationModule(transformationName)

  log(`Processing ${resolvedPaths.length} files…`)
  // 批量文件依次转换
  for (const p of resolvedPaths) {
    debug(`Processing ${p}…`)
    // TODO:在此处判断哪些类型的文件才需要转换
    const fileInfo = {
      path: p,
      source: fs.readFileSync(p).toString(),  // 读取待转换文件文本内容
    }
    try {
      const result = runTransformation(
        fileInfo,
        transformationModule,
        params as object
      )
      fs.writeFileSync(p, result) // 处理后的文件内容回写
    } catch (e) {
      console.error(e)
    }
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

function loadTransformationModule(nameOrPath: string) {
  let transformation = builtInTransformations[nameOrPath]
  // 基于规则名称找到对应的映射JS文件
  if (transformation) {
    return transformation
  }

  // 没有找到默认的规则时，寻找自定义规则文件
  const customModulePath = path.resolve(process.cwd(), nameOrPath)
  if (fs.existsSync(customModulePath)) {
    const requireFunc = Module.createRequire(
      path.resolve(process.cwd(), './package.json')
    )
    // TODO: interop with ES module
    // TODO: fix absolute path
    return requireFunc(`./${nameOrPath}`)
  }

  throw new Error(`Cannot find transformation module ${nameOrPath}`)
}
