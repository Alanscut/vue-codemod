import applyOperation from './src/wrapVueTransformation'
console.log("----->", "test index.js begin")
const sourceCode = `<template>
<div id="app">
  <p>vue-slot'p</p>
  <child>
    <div slot="abc">def</div>
  </child>
  <h1>I'm a very, very, very field statement. Thank you</h1>
</div>
</template>`

const deleteFixParent = {
  nodeRange: [54, 106],
  range: [54, 106],
  text: "",
};
const addFix1 = {
  nodeRange: [54, 106],
  range: [54, 54],
  text: "<h2>I'm a very, very, very insert field statement. Thank you</h2>",
};
const addFix2 = {
  nodeRange: [111, 169],
  range: [111, 111],
  text: "<h3>Insert Before h1</h3>",
};

let operations = [];

operations.push(deleteFixParent);
operations.push(addFix1);
operations.push(addFix2);

console.log("----->", "before applyOperation")
let output = applyOperation(sourceCode, operations)
console.log("----->", output)