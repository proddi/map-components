'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});


exports.builder = ({docs, writeFile, globals, fileTemplate, loadTemplate}) => {
    loadTemplate("module.xml");
    docs = docs.filter(tag => tag.kind === 'module');
    for (const doc of docs) {
        const fileName = globals.urlFor(doc);
        const content = fileTemplate("module", ["docs", "doc"])(docs, doc);
        writeFile(fileName, content);
    }
}
