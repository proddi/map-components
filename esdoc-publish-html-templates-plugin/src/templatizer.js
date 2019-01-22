'use strict';

const _fs = require('fs');

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.fromMarkup = fromMarkup;
exports.fromFile = fromFile;
exports.fromElement = fromElement;


function fromMarkup(markup, argNames=[], globals={}, name="unnamed") {
    const code = [
            'try {',
        ]
        .concat(Object.keys(globals).map(key => `let ${key}=globals.${key}`))
        .concat([
            'return `' + markup + '`',
            `} catch (e) { if (!(e instanceof Error)) e = new Error(e); e.message += ' (...in template ${name})'; throw e; }`,
        ]).join(";\n");
    try {
        const fn = Function.apply(null, ["globals"].concat(argNames).concat(code)).bind(null, globals);
        fn.toSource = _ => `template<${name}>(${argNames.join(", ")}):\n` + markup.split('\n').map((line, index) => `   ${index}: ${line}`).join("\n");
        fn.toString = _ => `template<${name}>(${argNames.join(", ")})`;
        return fn;
    } catch (e) {
        if (!(e instanceof Error)) e = new Error(e);
        e.message += ` (...in template ${name})`;
        console.info(code);
        throw e;
    }
}


function fromFile(file, argNames=[], globals={}) {
    return fromMarkup(_fs.readFileSync(file, { encoding: 'utf-8' }), argNames, globals, file);
}


function fromElement(node, globals={}, name="unnamed node") {
    let argNames = (node.getAttribute("args-as") || "data").split(",").map(arg => arg.trim());
    let markup = node.innerHTML.trim();
    markup = markup.replace(/=&gt;/g, "=>")
                   .replace(/&amp;&amp;/g, "&&")
                   .replace(/=""/g, "")
                   ;
    return fromMarkup(markup, argNames, globals, name);
}
