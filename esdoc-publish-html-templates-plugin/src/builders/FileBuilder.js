'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});


exports.builder = ({docs, writeFile, globals, fileTemplate}) => {
    const fileTags = docs.filter(tag => tag.kind === 'file');
    for (const file of fileTags) {
        const fileName = globals.docUrl(file);
        const content = fileTemplate("file", ["docs", "doc"])(docs, file);
        writeFile(fileName, content);
    }
}
