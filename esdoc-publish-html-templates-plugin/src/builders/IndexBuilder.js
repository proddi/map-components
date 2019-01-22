'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

const notFoundTag = {
    kind:    "index",
    content: "Please add a Readme.md",
    name:    "./README.md",
}

exports.builder = ({docs, writeFile, globals, fileTemplate, loadTemplate}) => {
    loadTemplate("index.xml");
    const indexTag = docs.find(tag => tag.kind === 'index') || notFoundTag;
    const fileName = globals.urlFor(indexTag);
    const content = fileTemplate("index", ["docs", "doc"])(docs, indexTag);
    writeFile(fileName, content);
}
