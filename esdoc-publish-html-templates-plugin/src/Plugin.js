'use strict';

const _path = require('path');

const _fs = require('fs');

const _jsdom = require("jsdom");

const _escapeHTML = require('escape-html');

const _util = require('./utils.js');


function templateFromMarkup(markup, argNames=[], globals={}, name="unnamed") {
    const code = [
//            `console.log(">>> ${name}>")`,
            'try {',
        ]
        .concat(Object.keys(globals).map(key => `let ${key}=globals.${key}`))
        .concat([
            'const result = `'+markup+'`',
//            `console.log("<<< ${name}")`,
            'return result',
            `} catch (e) { if (!(e instanceof Error)) e = new Error(e); e.message += ' (...in template ${name})'; throw e; }`,
        ]);
    const fn = Function.apply(null, ["globals"].concat(argNames).concat(code.join("; "))).bind(null, globals);
    fn.toSource = _ => `template<${name}>(${argNames.join(", ")}):\n` + markup.split('\n').map((line, index) => `   ${index}: ${line}`).join("\n");
    fn.toString = _ => `template<${name}>(${argNames.join(", ")})`;
    return fn;
}


function templateFromFile(file, argNames=[], globals={}) {
    return templateFromMarkup(_fs.readFileSync(file, { encoding: 'utf-8' }), argNames, globals, file);
}


function templateFromElement(node, globals={}, name="unnamed node") {
    let argNames = (node.getAttribute("args-as") || "data").split(",");
    let markup = node.innerHTML.trim();
    markup = markup.replace(/=&gt;/g, "=>")
                   .replace(/&amp;&amp;/g, "&&");
    return templateFromMarkup(markup, argNames, globals, name);
}


// filters
function nameIs(name) { (tag) => tag.name === name; }


class Plugin {
//    onHandlePlugins(ev) {
//        ev.data = ev.data.filter(plugin => plugin.name !== 'esdoc-publish-html-plugin');
//    }

    onHandleDocs(ev) {
        this._docs = ev.data.docs;
    }

    onPublish(ev) {
        this._option = ev.data.option || {};

        this._templates = {}
        this._themeDir = _path.resolve(__dirname, './themes/default');

        this._renderGlobals = this._buildRenderGlobals(this._docs);
        this._loadTemplates(this._themeDir, this._renderGlobals);

        this._exec(this._docs, ev.data.writeFile, ev.data.copyDir, ev.data.readFile);
    }

    _exec(tags, writeFile, copyDir, readFile) {
        this._createClasses(tags, writeFile, copyDir);
        this._createFiles(tags, writeFile, copyDir);
        this._createStatic(this._themeDir, writeFile, copyDir);
    }

    _createClasses(tags, writeFile, copyDir) {
        const docs = tags.filter(tag => tag.kind === 'class');
        for (const doc of docs) {
            const fileName = this.docUrl(doc);
            const content = templateFromFile(_path.resolve(this._themeDir, "class.html"), ["doc", "docs"], this._renderGlobals, "class.html")(doc, tags)
            writeFile(fileName, content);
        }
    }

    _createFiles(tags, writeFile, copyDir) {
        const docs = tags.filter(tag => tag.kind === 'file');
        for (const doc of docs) {
            const fileName = this.docSourceUrl(doc);
            const content = templateFromFile(_path.resolve(this._themeDir, "file.html"), ["doc", "docs"], this._renderGlobals, "file.html")(doc, tags)
            writeFile(fileName, content);
        }
    }

    _createStatic(templateDir, writeFile, copyDir) {
        copyDir(_path.resolve(templateDir, 'assets'), './assets');
        copyDir(_path.resolve(templateDir, 'assets/script'), './assets/script');
        copyDir(_path.resolve(templateDir, 'assets/image'), './assets/image');
    }

    _loadTemplates(path, globals={}) {
        _fs.readdirSync(path).filter(name => name.endsWith(".xml")).forEach(name => {
            let fileName = _path.resolve(path, name);
            const xml = _fs.readFileSync(fileName, { encoding: 'utf-8' });
            const dom = _jsdom.jsdom(xml);
            Object.values(dom.querySelectorAll("template")).map(node => {
                let id = node.getAttribute("id");
                this._templates[id] = templateFromElement(node, globals, `${name}#${id}`);
            });
        });
    }

    render(id, ...args) {
        let template = this._templates[id];
        try {
            if (!template) {
//                console.trace();
//                console.log(">>>", id, "<<<");
                throw `render(): No template "${id}"`;
            }
            return template(...args);//.call(this, this._templateRenderer, ...args);
        } catch (e) {
            console.dir(String(template));
            if (e instanceof Error) e.message = `${e.message} (...in template ${template.displayName})`;
            else console.error(`${e.message} in template`, template);
            throw e;
        }
    }

    escapeHTML(content) {
            return _escapeHTML(content);
    }

    formatExample(example) {
        let { body, caption } = _util.parseExample(example);
        return body;
    }

    formatMarkdown(markdown) {
        return _util.markdown(markdown);
    }

    getBaseUrl(doc) {
        return '../'.repeat(this.docUrl(doc).split('/').length-1);
    }

    getTitle(doc) {
        return doc.name || doc.toString();
    }

    urlForDoc(doc) {
        console.warn("Don't use .linkForDoc() - use .docLink() instead.");
        return this.docUrl(doc);
    }

    linkForDoc(doc) {
        console.warn("Don't use .linkForDoc() - use .docLink() instead.");
        return this.docLink(doc);
    }

    docUrl(doc) {
        switch (doc.kind) {
            case "external":
                return doc.externalLink;
            case 'class':
                return `class/${doc.longname}-new.html`;
            case 'member':
            case 'method':
            case 'constructor':
                return `class/${doc.longname}`.replace("#", "-new.html#");
            case 'file':
                return `file/${doc.name}-new.html`;
            case 'typedef':
                return `(${doc.kind})`;
            case 'function':
                return `(${doc.kind})`;
            default:
                console.warn(`Could not construct url for "${doc.longname || doc.name}" (${doc.kind}).`);
                return `(${doc.kind})`;
        }
    }

    docSourceUrl(doc) {
        switch (doc.kind) {
            case 'class':
                return `file/${doc.longname}-new.html` + (doc.lineNumber ? `#lineNumber${doc.lineNumber}` : "");
            case 'member':
            case 'method':
            case 'constructor':
            case 'set':
            case 'get':
                return this.docSourceUrl(this.getParentDoc(doc)) + (doc.lineNumber ? `#lineNumber${doc.lineNumber}` : "");
            case 'external':
                return 'external/index-new.html';
            case 'typedef':
                return 'typedef/index-new.html';
            case 'file':
                return `file/${doc.name}-new.html`;
            default:
                console.log(doc);
                throw new Error(`Couldn't build file-path for type "${doc.kind}".`);
        }
    }

    docLink(doc) {
        return `<span><a href="${this.docUrl(doc)}">${doc.name}</a></span>`;

//        if (doc.kind === 'file' || doc.kind === 'testFile') {
//            return `<span><a href="${this._getURL(doc)}">${text}</a></span>`;
//        } else {
//            return `<span><a href="${this._getURL(doc)}#lineNumber${doc.lineNumber}">${text}</a></span>`;
//        }
    }

    docSourceLink(doc, text=null) {
        return `<span><a href="${this.docSourceUrl(doc)}">${text || doc.name}</a></span>`;
    }

    buildFunctionSignature(doc) {
        let callSignatures = (doc.params || []).map(param => {
            return param.name + ": " + param.types.map(type => {
                let typeDoc = this.getDocByName(type, null, null);
                return typeDoc ? this.docLink(typeDoc) : type;
            }).join(' | ');
        });

        let returnSignature = ((doc.return || {}).types || []).map(type => {
            return type;
        }).join(' | ');

        return `(${callSignatures.join(', ')}): ${returnSignature || "void"}`;
    }

    buildPropertySignature(doc) {
        let returnSignature = (doc.type.types || []).map(type => {
            let typeDoc = this.getDocByName(type, null, null);
            return typeDoc ? this.docLink(typeDoc) : type;
        }).join(' | ');

        return `: ${returnSignature || "void"}`;
    }

    getNavDocs(docs) {
        const kinds = ['class', 'function', 'variable', 'typedef', 'external'];
        return docs
            .filter(doc => (doc.kind === 'class' && doc.export) ||
                           (doc.kind === 'function' && doc.export) ||
                           (doc.kind === 'variable' && doc.export) ||
                           (doc.kind === "typedef") ||
                           (doc.kind === "external" && !doc.builtinExternal)
                    );
    }

    getParentDoc(doc) {
        return this.getDocByName(doc.memberof, doc);
    }

    getDocByName(name, ownDoc, whenNotFound=undefined) {
        let candidates = this._docs.filter(tag => tag.name === name || tag.longname === name);
        if (candidates.length === 0) {
            if (whenNotFound !== undefined) return whenNotFound;
            throw new Error(`No document with name "${name}".`);
        }
        if (candidates.length >= 2) console.warn(`${candidates.length} documents found with name "${name}".`);
        return candidates[0];
    }

    getClassProperties(doc) {
        return this._docs.filter(tag => (tag.kind === "member" || tag.kind === "get") && tag.memberof ===  doc.longname);
    }

    listClassProperties(doc) {
        let properties = this.getClassProperties(doc);
        let others = ((doc.extends || []).concat(doc.implements || []))
                .map(name => this.getDocByName(name))
                .map(tag => this.getClassProperties(tag))
                .reduce((prev, list) => prev.concat(list), [])
                ;
        let propertyNames = properties.map(tag => tag.name);

        return properties.map(property => [
                property,
                others.filter(doc => doc.name === property.name),  // overrides
                false
            ]).concat(others.filter(doc => !propertyNames.includes(doc.name)).map(property => [
                property,
                [],
                true                                               // inherits
            ]));
    }

    getClassMethods(doc) {
        return this._docs.filter((tag) => (tag.kind === "method" || tag.kind === "constructor") && tag.memberof ===  doc.longname);
    }

    listClassMethods(doc) {
        let methods = this.getClassMethods(doc);
        let others = ((doc.extends || []).concat(doc.implements || []))
                .map(name => this.getDocByName(name))
                .map(tag => this.getClassMethods(tag))
                .reduce((prev, list) => prev.concat(list), [])
                ;
        let methodNames = methods.map(tag => tag.name);

        return methods.map(method => [
                method,
                others.filter(doc => doc.name === method.name),  // overrides
                false
            ]).concat(others.filter(doc => !methodNames.includes(doc.name)).map(method => [
                method,
                [],
                true                                             // inherits
            ]));
    }


    /**
     * gat url of output html page.
     * @param {DocObject} doc - target doc object.
     * @returns {string} url of output html. it is relative path from output root dir.
     * @private
     * /
    ____getURL(doc) {
        let inner = false;
        if (['variable', 'function', 'member', 'typedef', 'method', 'constructor', 'get', 'set'].includes(doc.kind)) {
          inner = true;
        }

        if (inner) {
          const scope = doc.static ? 'static' : 'instance';
          const fileName = this._getOutputFileName(doc);
          return `${fileName}#${scope}-${doc.kind}-${doc.name}`;
        } else {
          const fileName = this._getOutputFileName(doc);
          return fileName;
        }
    }

    /**
     * get file name of output html page.
     * @param {DocObject} doc - target doc object.
     * @returns {string} file name.
     * @private
     * /
    _getOutputFileName(doc) {
        switch (doc.kind) {
          case 'variable':
            return 'variable/index-new.html';
          case 'function':
            return 'function/index-new.html';
          case 'member': // fall
          case 'method': // fall
          case 'constructor': // fall
          case 'set': // fall
          case 'get':
            {
              // fal
              const parentDoc = this._docs.filter(doc => doc.longname === doc.memberof)[0];
              return parentDoc && this._getOutputFileName(parentDoc);
            }
          case 'external':
            return 'external/index-new.html';
          case 'typedef':
            return 'typedef/index-new.html';
          case 'class':
            return `class/${doc.longname}-new.html`;
          case 'file':
            return `file/${doc.name}-new.html`;
          case 'testFile':
            return `test-file/${doc.name}-new.html`;
          case 'test':
            return 'test.html';
          default:
            throw new Error(`DocBuilder: can not resolve file name for "${doc.kind}".`);
        }
    }
    */

    _buildRenderGlobals(docs) {

        const globals = {
            self: this,
            render: this.render.bind(this),
            escape: content => _escapeHTML(content),
            markdown: content => _util.markdown(content),
//            listModules: _ => docs.filter(tag => !['method', 'member', 'constructor', 'file', 'index'].includes(tag.kind)).map(tag => tag.memberof).filter((tag, idx, list) => list.indexOf(tag) === idx),
            listModules: _ => docs
                    .filter(tag => tag.kind === 'file')
                    .map(tag => tag.name)
                    .filter((tag, idx, list) => list.indexOf(tag) === idx),
//                    .map(name => [name, name.split("/").slice(1, -1).join("/")]),
            listModuleObjects: module => docs.filter(tag => tag.memberof === module),
            listExtends: doc => this._buildParentList(doc, "extends"),
            listImplements: doc => (doc.implements || []).map(doc => this.getDocByName(doc)),
            extendedBy: doc => docs.filter(tag => tag.kind === 'class' && (tag.extends || []).includes(doc.longname)),
            implementedIn: doc => docs.filter(tag => tag.kind === 'class' && (tag.implements || []).includes(doc.name)),
            parentOf: doc => this.getDocByName(doc.memberof),
            sourceOf: doc => {
                    switch (doc.kind) {
                        case 'class':
                            return docs.filter(tag => tag.kind === 'file' && tag.name === doc.memberof)[0];
                        case 'file':
                            return doc;
                        case 'get':
                        case 'set':
                        case 'constructor':
                        case 'method':
                        case 'member':
                            return globals.sourceOf(globals.parentOf(doc));
                        default:
                            return doc;
                    }
                },
            sourceUrl: doc => `${this.docSourceUrl(globals.sourceOf(doc))}#lineNumber${doc.lineNumber}`,
            sourceLink: (doc, text=null) => `<span><a href="${globals.sourceUrl(doc)}">${text || doc.name}</a></span>`,
        };
        return globals;
    }

    _buildParentList(doc, prop) {
        return (doc[prop] || [])
                .map(tag => { tag = this.getDocByName(tag); return [tag].concat(this._buildParentList(tag, prop))})
                .reduce((prev, curr) => prev.concat(curr), []);

        let _extends = doc.extends || [];
        if (_extends.length === 0) return [];
        if (_extends.length !== 1) throw new Error(`Mutiple extends not supported! (${doc.longname})`);
        let tag = this.getDocByName(_extends[0]);
        return [tag].concat(globals.listExtends(tag));
    }
}


module.exports = new Plugin();
