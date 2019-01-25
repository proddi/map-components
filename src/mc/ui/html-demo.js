import {Element, html} from '../core/Element.js';


class HTMLDemo extends Element {

    firstUpdated() {
//        console.log("firstUpdate");
//    }
//    updated() {
//        console.log("update");
        let content = this.renderRoot.querySelector('slot')
            .assignedNodes()
            .map(node => node.outerHTML)
            .filter(text => text)
            .map(text => fixIndent(text))
            .map(text => highlight(text))
            .join("\n")
            ;
        this.renderRoot.querySelector(':host > pre').innerHTML = content;
    }

    render() {
        return html`
            <style>
                :host {
                    display:block;
                    margin: 0 10%;
                    border: 1px solid #888;
                    box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.14), 0 1px 5px 0 rgba(0, 0, 0, 0.12), 0 3px 1px -2px rgba(0, 0, 0, 0.2);
                    margin-bottom: 40px;
                }
                :host > div {
                    padding: 5px;
                }
                :host > pre {
                    margin: 0;
                    padding: 1em .8em;
                    border-top: 1px solid #888;
                    background: #eee;
                    font-size: 0.9em;
                    overflow-x: scroll;
                }
                :host > pre .tag {
                    color: #bb4444;
                    font-weight: bold;
                }
                :host > pre .attr-name {
                    color: #d19a66;
                }
                :host > pre .attr-value {
                    color: #83a66b;
                }
            </style>
            <div>
                <slot></slot>
            </div>
            <pre></pre>
        `;
    }
}


function fixIndent(text) {
    let lines = text.split("\n");
    let indents = lines
            .map((line, index) => index === 0 ? null : line.search(/\S/))
            .filter(indent => indent)
            ;
    let indent = Math.min(...indents);
    if (indent) lines = lines.map((line, index) => index === 0 ? line : line.slice(indent));
    return lines.join("\n");
}


function highlight(text) {
    return text.replace(/<(\S+)(.*?)>(.*?)<\/\1>/gms, (_, tag, attribs, content) => highlightTag(tag, attribs, content));
}

function highlightTag(tag, attribs, content) {
    return `&lt;<span class="tag">${tag}${highlightAttribs(attribs)}&gt;</span><span class="content">${highlight(content).replace(/<_/g, "&lt;").replace(/>_/g, "&gt;")}</span>&lt;/<span class="tag">${tag}</span>&gt;`;
}

function highlightAttribs(text) {
    return text.replace(/(\S*)="(\S*)"/gms, (_, name, value) => highlightAttr(name, value));
}

function highlightAttr(name, value) {
    return `<span class="attr-name">${name}</span>="<span class="attr-value">${value}</span>"`;
}

customElements.define("html-demo", HTMLDemo);


export { HTMLDemo }
