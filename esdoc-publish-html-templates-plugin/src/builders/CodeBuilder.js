'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});


exports.builder = ({docs, writeFile, globals, fileTemplate, loadTemplate}) => {
    loadTemplate("code.xml");
    docs = docs.filter(tag => tag.kind === 'file');
    for (const doc of docs) {
        const fileName = globals.sourceUrl(doc);
        const content = fileTemplate("code", ["docs", "doc"])(docs, doc);
        writeFile(fileName, content);
    }
}
