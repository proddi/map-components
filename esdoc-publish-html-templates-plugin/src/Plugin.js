'use strict';

const _path = require('path');

const _fs = require('fs');

const _jsdom = require("jsdom");

const _escapeHTML = require('escape-html');

const _util = require('./utils.js');

const templatizer = require('./templatizer.js');

// filters
function nameIs(name) { (tag) => tag.name === name; }


class Plugin {
//    onHandlePlugins(ev) {
//        ev.data = ev.data.filter(plugin => plugin.name !== 'esdoc-publish-html-plugin');
//    }

    onHandleDocs(ev) {
        this._docs = this._enrichModules(ev.data.docs);
    }

    onPublish(ev) {
        this._option = ev.data.option || {};

        this._themeDir = _path.resolve(__dirname, './themes/default');

        this._renderGlobals = this._buildRenderGlobals(this._docs);
        this._templates = this._loadTemplates(this._themeDir, this._renderGlobals);

        this._exec(this._docs, ev.data.writeFile, ev.data.copyDir, ev.data.readFile);
    }

    _exec(tags, writeFile, copyDir, readFile) {
        const buildersDir = _path.resolve(__dirname, './builders');
        const builders = _fs.readdirSync(buildersDir)
            .filter(fileName => fileName.endsWith("Builder.js"))
            .map(fileName => {
                return require(_path.resolve(buildersDir, fileName)).builder;
            });

        const options = {
            writeFile: writeFile,
            copyDir: copyDir,
            readFile: readFile,
            docs: tags,
            theme: this._themeDir,
            globals: this._renderGlobals,
            fileTemplate: (type, fields=[]) => {
                return templatizer.fromFile(_path.resolve(this._themeDir, "layout.html"), ["type"].concat(fields), this._renderGlobals, type).bind(null, type);
            },
        }

        builders.forEach(builder => {
            builder(options);
        });


        this._createCodeFiles(tags, writeFile, copyDir);
        this._createModules(tags, writeFile, copyDir);
        this._createStatic(this._themeDir, writeFile, copyDir);
    }

    _createCodeFiles(tags, writeFile, copyDir) {
        const docs = tags.filter(tag => tag.kind === 'file');
        for (const doc of docs) {
            const fileName = this.docSourceUrl(doc);
            const content = templatizer.fromFile(_path.resolve(this._themeDir, "code.html"), ["doc", "docs"], this._renderGlobals, "code.html")(doc, tags)
            writeFile(fileName, content);
        }
    }

    _createModules(tags, writeFile, copyDir) {
        const docs = tags.filter(tag => tag.kind === 'module');
        for (const doc of docs) {
            const fileName = this.docUrl(doc);
            const content = templatizer.fromFile(_path.resolve(this._themeDir, "layout.html"), ["type", "doc", "docs"], this._renderGlobals, "layout.html")("module", doc, tags)
            writeFile(fileName, content);
        }
    }

    _createStatic(templateDir, writeFile, copyDir) {
        copyDir(_path.resolve(templateDir, 'assets'), './assets');
        copyDir(_path.resolve(templateDir, 'assets/script'), './assets/script');
        copyDir(_path.resolve(templateDir, 'assets/image'), './assets/image');
    }

    _loadTemplates(path, globals={}) {
        let templates = {};
        _fs.readdirSync(path).filter(name => name.endsWith(".xml")).forEach(name => {
            let fileName = _path.resolve(path, name);
            const xml = _fs.readFileSync(fileName, { encoding: 'utf-8' });
            const dom = _jsdom.jsdom(xml);
            Object.values(dom.querySelectorAll("template")).map(node => {
                let id = node.getAttribute("id");
                templates[id] = templatizer.fromElement(node, globals, `${name}#${id}`);
            });
        });
        return templates;
    }

    render(id, ...args) {
        let template = this._templates[id];
        try {
            if (!template) throw new Error(`No template "${id}" available.`);
            return template(...args);
        } catch (e) {
            if (e instanceof Error) e.message = `${e.message} (...in template ${template})`;
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
            case 'function':
                return `file/${doc.memberof}-new.html#${doc.name}`;
            case 'module':
                return `module/${doc.name}-new.html`;
            case 'index':
                return `index-new.html`;
            default:
                console.warn(`Could not construct url for "${doc.longname || doc.name}" (${doc.kind}).`);
                return `(${doc.kind})`;
        }
    }

    docSourceUrl(doc) {
        switch (doc.kind) {
            case 'class':
                return `source/${doc.longname}-new.html` + (doc.lineNumber ? `#lineNumber${doc.lineNumber}` : "");
            case 'member':
            case 'method':
            case 'constructor':
            case 'set':
            case 'get':
                return this.docSourceUrl(this.getParentDoc(doc)) + (doc.lineNumber ? `#lineNumber${doc.lineNumber}` : "");
            case 'external':
            case 'typedef':
                return `source/${doc.memberof}-new.html`;
            case 'file':
                return `source/${doc.name}-new.html`;
            case 'variable':
            case 'function':
                return `source/${doc.name}-new.html#lineNumber${doc.lineNumber}`;
            default:
                console.log("FAILED --->", doc);
                throw new Error(`No source-url available for type "${doc.kind}".`);
        }
    }

    docLink(doc) {
        return `<span><a href="${this.docUrl(doc)}">${doc.name}</a></span>`;
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
            let typeDoc = this.getDocByName(type, null, null);
            return typeDoc ? this.docLink(typeDoc) : type;
        }).join(' | ');

        return `(${callSignatures.join(', ')}): ${returnSignature || "void"}`;
    }

    buildPropertySignature(doc) {
        let returnSignature = ((doc.type || {}).types || []).map(type => {
            let typeDoc = this.getDocByName(type, null, null);
            return typeDoc ? this.docLink(typeDoc) : type;
        }).join(' | ');

        return `: ${returnSignature || "void"}`;
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
        function sortByKey(keyFn) {
            return (a, b) => {
                a = keyFn(a).toUpperCase();
                b = keyFn(b).toUpperCase();
                if (a < b) return -1;
                if (a > b) return 1;
                return 0;
            }
        }


        const globals = {
            self: this,
            render: this.render.bind(this),
            escape: content => _escapeHTML(content),
            markdown: content => _util.markdown(content),
            docUrl: this.docUrl.bind(this),
            docLink: this.docLink.bind(this),
            signature: doc => doc.kind === 'function' ? this.buildFunctionSignature(doc) : this.buildPropertySignature(doc),
            listModules: _ => docs.filter(tag => tag.kind === 'module'),
            listModuleObjects: module => docs.filter(tag => !tag.builtinExternal && module.files.includes(tag.memberof)).filter(tag => !tag.ignore).sort(sortByKey(tag => tag.name)),
            listExtends: doc => this._buildParentList(doc, "extends"),
            listImplements: doc => (doc.implements || []).map(doc => this.getDocByName(doc)),
            extendedBy: doc => docs.filter(tag => tag.kind === 'class' && (tag.extends || []).includes(doc.longname)),
            implementedIn: doc => docs.filter(tag => tag.kind === 'class' && (tag.implements || []).includes(doc.name)),
            parentOf: doc => this.getDocByName(doc.memberof),
            sourceOf: doc => {
                    switch (doc.kind) {
                        case 'class':
                        case 'function':
                        case 'variable':
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
    }

    _enrichModules(docs) {
        // deduplicate
        let names = docs.map(tag => tag.longname);
        docs = docs.filter((tag, index) => names.indexOf(tag.longname) === index);

        // generate modules
        let moduleId = name => name.split("/").slice(0, -1).join("/")
        let modules = {};
        docs.filter(tag => tag.kind === 'file' && !tag.builtinExternal)
            .forEach((tag, index) => {
                let id = moduleId(tag.name);
                modules[id] = modules[id] || {
                    __docId__: `module-${index}`,
                    kind: 'module',
                    name: id,
                    longname: tag.name,
                    files: [],
                }
                modules[id].files.push(tag.name);
            })

        // merge everything together
        return docs.concat(Object.values(modules))
                .filter(tag => !(tag.kind === 'external' && tag.lineNumber))
                .filter(tag => !tag.ignore)
                ;
    }
}


module.exports = new Plugin();
