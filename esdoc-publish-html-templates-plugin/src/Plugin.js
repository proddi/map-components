'use strict';

const _path = require('path');

const _fs = require('fs');

const _jsdom = require("jsdom");

const _escapeHTML = require('escape-html');

const _util = require('./utils.js');

const templatizer = require('./templatizer.js');


class Plugin {
    onHandleDocClass(ev) {
        let {type, Clazz, ParamParser} = ev.data
        switch (type) {
            case 'Class':
                ev.data.Clazz = class extends ev.data.Clazz {
                    _$emits() {
                        const values = this._findAllTagValues(['@emits']);
                        if (!values) return;

                        this._value.emits = [];
                        for (const value of values) {
                          const {typeText, paramName, paramDesc} = ParamParser.parseParamValue(value);
                          const result = ParamParser.parseParam(typeText, paramName, paramDesc);
                          this._value.emits.push(result);
                        }
                    }
                }
            break;
        }
    }

    onHandleDocs(ev) {
        this._docs = this._enrichModules(ev.data.docs);
    }

    onPublish(ev) {
        this._option = ev.data.option || {};

        this._themeDir = _path.resolve(__dirname, './themes/default');

        this._renderGlobals = this._buildRenderGlobals(this._docs);
        this._templates = {}; //this._loadTemplates(this._themeDir, this._renderGlobals);

        this._exec(this._docs, ev.data.writeFile, ev.data.copyDir, ev.data.readFile);
    }

    _loadTemplateFile(name, index, globals) {
        const path = _path.resolve(this._themeDir, name);
        const xml = _fs.readFileSync(path, { encoding: 'utf-8' });
        const dom = _jsdom.jsdom(xml);
        Object.values(dom.querySelectorAll("template")).forEach(node => {
            let href = node.getAttribute("href");
            if (href) this._loadTemplateFile(href, index, globals);
            else {
                let id = node.getAttribute("id");
                try {
                    // TODO: rename existing
                    if (index.hasOwnProperty(id)) this._superizeTemplateId(index, id);
                    index[id] = templatizer.fromElement(node, globals, `${name}#${id}`);
                } catch (e) {
                    if (e instanceof Error) e.message = `${e.message} (...in template ${name}#${id})`;
                    else console.error(`${e.message} in template`, `${name}#${id}`);
                    throw e;
                }
            }
        });
    }

    _superizeTemplateId(index, id, prefix="super.") {
        const newId = `${prefix}${id}`;
        if (index.hasOwnProperty(newId)) this._superizeTemplateId(index, newId, prefix);
        index[newId] = index[id];
        delete index[id];
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
//            copyFile: copyFile,
            readFile: readFile,
            docs: tags,
            theme: this._themeDir,
            globals: this._renderGlobals,
            fileTemplate: (type, fields=[]) => {
                return templatizer.fromFile(_path.resolve(this._themeDir, "layout.html"), ["type"].concat(fields), this._renderGlobals, type).bind(null, type);
            },
            loadTemplate: name => this._loadTemplateFile(name, this._templates, this._renderGlobals),
        }

        builders.forEach(builder => {
            this._templates = {};  // reset template index
            builder(options);
        });

//        this._createCodeFiles(tags, writeFile, copyDir);
//        this._createModules(tags, writeFile, copyDir);
        this._createStatic(this._themeDir, writeFile, copyDir);
    }
/*
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
*/
    _createStatic(templateDir, writeFile, copyDir) {
        copyDir(_path.resolve(templateDir, 'assets'), './assets');
        copyDir(_path.resolve(templateDir, 'assets/script'), './assets/script');
        copyDir(_path.resolve(templateDir, 'assets/image'), './assets/image');
    }

    _loadTemplates(path, globals={}) {
        let index = {};
        _fs.readdirSync(path).filter(name => name.endsWith(".xml")).forEach(fileName => {
            this._loadTemplateFile(fileName, index, globals);
/*
            let fileName = _path.resolve(path, name);
            const xml = _fs.readFileSync(fileName, { encoding: 'utf-8' });
            const dom = _jsdom.jsdom(xml);
            Object.values(dom.querySelectorAll("template")).map(node => {
                let id = node.getAttribute("id");
                try {
                    templates[id] = templatizer.fromElement(node, globals, `${name}#${id}`);
                } catch (e) {
                    if (e instanceof Error) e.message = `${e.message} (...in template ${name}#${id})`;
                    else console.error(`${e.message} in template`, `${name}#${id}`);
                    throw e;
                }
            });
*/
        });
        return index;
    }

    render(id, ...args) {
        let template = this._templates[id];
        try {
            if (!template) throw new Error(`No template "${id}" available.`);
            return template(...args);
        } catch (e) {
            if (e instanceof Error) e.message = `${e.message} (...in template ${template})`;
            else console.error(`${e.message} in template`, template);
            console.info("related markup:", template.toSource());
            throw e;
        }
    }

    docUrl(doc) {
        let path = this._option.path || "";
        switch (doc.kind) {
            case "external":
                return doc.externalLink;
            case 'class':
                return _path.join(path, `class/${doc.longname}.html`);
            case 'get':
            case 'set':
            case 'member':
            case 'method':
            case 'constructor':
                return _path.join(path, `class/${doc.longname}`.replace("#", ".html#"));
            case 'file':
                return _path.join(path, `file/${doc.name}.html`);
            case 'typedef':
            case 'variable':
            case 'function':
                return _path.join(path, `file/${doc.memberof}.html#${doc.name}`);
            case 'module':
                return _path.join(path, `module/${doc.name}.html`);
            case 'index':
                return _path.join(path, `index.html`);
            default:
                console.warn(`Could not construct url for "${doc.longname || doc.name}" (${doc.kind}).`);
                return `(${doc.kind})`;
        }
    }

    docSourceUrl(doc) {
        let path = this._option.path || "";
        switch (doc.kind) {
            case 'class':
                return _path.join(path, `source/${doc.longname}.html` + (doc.lineNumber ? `#lineNumber${doc.lineNumber}` : ""));
            case 'member':
            case 'method':
            case 'constructor':
            case 'set':
            case 'get':
                return this.docSourceUrl(this.getParentDoc(doc)) + (doc.lineNumber ? `#lineNumber${doc.lineNumber}` : "");
            case 'external':
            case 'typedef':
                return _path.join(path, `source/${doc.memberof}.html`);
            case 'file':
                return _path.join(path, `source/${doc.name}.html`);
            case 'variable':
            case 'function':
                return _path.join(path, `source/${doc.name}.html#lineNumber${doc.lineNumber}`);
            case 'module':
                return _path.join(path, `module/${doc.name}.html`);
            default:
                console.log("FAILED --->", doc);
                throw new Error(`No source-url available for type "${doc.kind}".`);
        }
    }

    docLink(doc, text=null) {
        return `<span><a href="${this.docUrl(doc)}">${text || doc.name}</a></span>`;
    }

    docSourceLink(doc, text=null) {
        return `<span><a href="${this.docSourceUrl(doc)}">${text || doc.name}</a></span>`;
    }

    buildTypeSignature(type) {
        // e.g. number[]
        if (type.endsWith('[]')) {
            return `${this.buildTypeSignature(type.slice(0, -2))}[]`;
        }

        // e.g. function(a: number, b: string): boolean
        let matched = type.match(/function *\((.*?)\)(.*)/);
        if (matched) {
            const functionLink = this.buildTypeSignature('function');
            if (!matched[1] && !matched[2]) return `${functionLink}()`;

            let innerTypes = [];
            if (matched[1]) {
                // bad hack: Map.<string, boolean> => Map.<string\Z boolean>
                // bad hack: {a: string, b: boolean} => {a\Y string\Z b\Y boolean}
                const inner = matched[1].replace(/<.*?>/g, a => a.replace(/,/g, '\\Z')).replace(/{.*?}/g, a => a.replace(/,/g, '\\Z').replace(/:/g, '\\Y'));
                innerTypes = inner.split(',').map(v => {
                    const tmp = v.split(':').map(v => v.trim());
                    if (tmp.length !== 2) throw new SyntaxError(`Invalid function type annotation: \`${matched[0]}\``);

                    const paramName = tmp[0];
                    const typeName = tmp[1].replace(/\\Z/g, ',').replace(/\\Y/g, ':');
                    return `${paramName}: ${this.buildTypeSignature(typeName)}`;
                });
            }

            let returnType = '';
            if (matched[2]) {
                const type = matched[2].split(':')[1];
                if (type) returnType = `: ${this.buildTypeSignature(type.trim())}`;
            }

            return `${functionLink}(${innerTypes.join(', ')})${returnType}`;
        }

        // e.g. {a: number, b: string}
        matched = type.match(/^\{(.*?)\}$/);
        if (matched) {
            if (!matched[1]) return '{}';
            // bad hack: Map.<string, boolean> => Map.<string\Z boolean>
            // bad hack: {a: string, b: boolean} => {a\Y string\Z b\Y boolean}
            const inner = matched[1].replace(/<.*?>/g, a => a.replace(/,/g, '\\Z')).replace(/{.*?}/g, a => a.replace(/,/g, '\\Z').replace(/:/g, '\\Y'));

            let broken = false;
            const innerTypes = inner.split(',').map(v => {
                const tmp = v.split(':').map(v => v.trim());

                // edge case: if object key includes comma, this parsing is broken.
                // e.g. {"a,b": 10}
                // https://github.com/esdoc/esdoc-plugins/pull/49
                if (!tmp[0] || !tmp[1]) {
                    broken = true;
                    return;
                }

                const paramName = tmp[0];
                let typeName = tmp[1].replace(/\\Z/g, ',').replace(/\\Y/g, ':');

                return `${paramName}: ${this.buildTypeSignature(typeName)}`;
            });

            if (broken) return `*`;

            return `{${innerTypes.join(', ')}}`;
        }

        // e.g. Map<number, string>
        matched = type.match(/^(.*?)\.?<(.*?)>$/);
        if (matched) {
            const mainType = matched[1];

            // bad hack: Map.<string, boolean> => Map.<string\Z boolean>
            // bad hack: {a: string, b: boolean} => {a\Y string\Z b\Y boolean}
            const inner = matched[2].replace(/<.*?>/g, a => a.replace(/,/g, '\\Z')).replace(/{.*?}/g, a => a.replace(/,/g, '\\Z').replace(/:/g, '\\Y'));

            const innerTypes = inner.split(',')
                    .map(v => v.trim().replace(/\\Z/g, ',').replace(/\\Y/g, ':'))
                    .map(v => this.buildTypeSignature(v))
                    .join(', ')
                    ;

            return `${this.buildTypeSignature(mainType)}&lt;${innerTypes}&gt;`;
        }

        // e.g. ...number
        if (type.startsWith('...')) {
            return `...${this.buildTypeSignature(type.slice(3))}`;
        }

        // e.g. ?number
        if (type.startsWith('?')) {
            return `?${this.buildTypeSignature(type.slice(1))}`;
        }

        // e.g. number|string
        if (type.includes('|')) {
            return type.split('|').map(_type => this.buildTypeSignature(_type)).join('|');
        }

        let typeDoc = this.getDocByName(type, null, null);
        return typeDoc ? this.docLink(typeDoc) : type;
    }

    buildFunctionSignature(doc) {
        let callSignatures = (doc.params || []).map(param => {
            return param.name + ": " + param.types.map(type => this.buildTypeSignature(type)).join(' | ');
        });
        return `(${callSignatures.join(', ')})` + this.buildPropertySignature(doc.return, null);
    }

    buildPropertySignature(prop, voidStr=null) {
        const sig = ((prop || {}).types || []).map(type => this.buildTypeSignature(type)).join(' | ');

        return sig ? `: ${sig}` : '';
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

        const listExtends = (item, prop) => (item[prop] || [])
                                                .map(name => this.getDocByName(name))
                                                .map(tag => [tag].concat(listExtends(tag, prop)))
                                                    .reduce((prev, curr) => prev.concat(curr), []);

        const _combineDoc = (item, chain, kinds) => {
            let chainMethods = chain.map(item => [item, docs.filter(tag => kinds.includes(tag.kind) && tag.memberof === item.longname && (!tag.ignore || tag.access === 'protected'))]);
            let myMethods = docs.filter(tag => kinds.includes(tag.kind) && tag.memberof === item.longname && (!tag.ignore || tag.access === 'protected'));
            let elements = {};
            // default items from item
            myMethods.forEach(method => {
                    elements[method.name] = {
                        item: method,
                        overrides: [],
                    }
                });
            // enrich from chain items
            chainMethods.forEach(([item, methods]) => {
                    methods.forEach(method => {
                            let element = elements.hasOwnProperty(method.name) && elements[method.name];
                            if (element) {
                                if (!element.inherited) element.overrides.push(method);
                            } else elements[method.name] = {
                                item: method,
                                overrides: [],
                                inherited: method,
                            }
                        });
                });
            // return just values of elements
            return Object.values(elements);
        }

        function debug(item, data) {
            console.log(item.longname, data);
            return data;
        }

        const globals = {
            self: this,
            // render helpers
            render: this.render.bind(this),
            titleOf: doc => doc.name || doc.toString(),
            escape: content => _escapeHTML(content),
            markdown: content => _util.markdown(content),
            parseExample: example => _util.parseExample(example),  // return { body, caption }
            resolveLink: str => str.replace(/\{@link ([\w#_\-.:~\/$]+)}/g, (str, longname) => {
                    let doc = this.getDocByName(longname, null, null);
                    return doc && this.docLink(doc) || str;
                }),
            htmlTag: (tag, attributes, content) => `<${tag}${Object.entries(attributes).filter(([key, val]) => val!==undefined).map(([key, val]) => ` ${key}="${val}"`).join("")}>${content}</${tag}>`,

            // link helpers
            baseUrlOf: doc => '../'.repeat(this.docUrl(doc).split('/').length-1),
//            docUrl: doc => { console.warn("`docUrl()` is deprecated - use `urlFor()` instead."); return this.docUrl(doc); },
            urlFor: this.docUrl.bind(this),
//            docLink: doc => {  console.warn("`docLink()` is deprecated - use `linkFor()` instead."); return this.docLink(doc); },
            linkFor: this.docLink.bind(this),
            sourceUrl: doc => this.docSourceUrl(globals.sourceOf(doc)) + (doc.lineNumber && doc.kind !== "file" ? `#lineNumber${doc.lineNumber}` : ""),
            sourceLink: (doc, text=null) => `<span><a href="${globals.sourceUrl(doc)}">${text || doc.name}</a></span>`,
            signature: (doc, ...args) => (doc || {}).kind === 'function' ? this.buildFunctionSignature(doc, ...args) : this.buildPropertySignature(doc, ...args),
            // traversal helpers
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
            // 1:n relation helpers
            listModules: _ => docs.filter(tag => tag.kind === 'module'),
            listModuleObjects: module => docs
                                            .filter(tag => module.files.includes(tag.memberof))
                                            .filter(tag => !tag.builtinExternal)
                                            .filter(tag => !tag.ignore)
                                            .sort(sortByKey(tag => tag.name)),
            listExtends: doc => listExtends(doc, "extends"),
            listImplements: doc => (doc.implements || []).map(doc => this.getDocByName(doc)),

            extendedBy: doc => docs.filter(tag => tag.kind === 'class' && (tag.extends || []).includes(doc.longname)),
            implementedIn: doc => docs.filter(tag => tag.kind === 'class' && (tag.implements || []).includes(doc.name)),
            methodsOf: item => _combineDoc(item, listExtends(item, "extends"), ["method", "constructor"]),
            propertiesOf: item => _combineDoc(item, listExtends(item, "extends"), ["get", "set", "member"]),
            eventsOf: item => ([item].concat(listExtends(item, "extends")))
                                            .filter(item => item.emits)
//                                            .map(item => { console.log(item); return item; })
                                            .map(item => item.emits.map((event, idx) => Object.assign({kind: "emits", __docId__: `${item.__docId__}-emits-${idx}`, memberof: item.longname}, event)))
                                            .reduce((prev, curr) => prev.concat(curr), []),

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
