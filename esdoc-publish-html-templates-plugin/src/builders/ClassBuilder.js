'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

const templatizer = require('../templatizer.js');

const _path = require('path');

exports.builder = ({docs, writeFile, globals, theme}) => {
    const classTags = docs.filter(tag => tag.kind === 'class');
    for (const doc of classTags) {
        const fileName = globals.docUrl(doc);
        const content = templatizer.fromFile(_path.resolve(theme, "layout.html"), ["type", "docs", "doc"], globals, "layout.html")("class", classTags, doc)
        writeFile(fileName, content);
    }
}
