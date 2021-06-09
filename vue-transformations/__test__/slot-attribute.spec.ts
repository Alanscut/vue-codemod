jest.autoMockOff()

import * as fs from 'fs'
import * as path from 'path'
import runTransformation from '../../src/runTransformation'

const runTest = (
  description: string,
  transformationName: string,
  fixtureName: string,
  extension: string = 'vue'
) => {
  test(description, () => {
    const fixtureDir = path.resolve(
      __dirname,
      '../__testfixtures__',
      transformationName
    )
    const inputPath = path.resolve(
      fixtureDir,
      `${fixtureName}.input.${extension}`
    )
    const outputPath = path.resolve(
      fixtureDir,
      `${fixtureName}.output.${extension}`
    )

    const fileInfo = {
      path: inputPath,
      source: fs.readFileSync(inputPath).toString(),
    }
    const transformation = require(`../${transformationName}`)

    expect(runTransformation(fileInfo, transformation)).toEqual(
      fs.readFileSync(outputPath).toString()
    )
  })
}

runTest('DESC', 'slot-attribute', 'slot-attribute')
