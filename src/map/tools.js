import {html, render} from './lit-html.js';


/**
 * Create a Promise that can be resolved later.
 * @example
 * let p = new OpenPromose((resolve, reject) => {
 *   // usually you can only solve that Promise inside.
 * });
 * p.resolve("Yay!");  // but this can be resolved/reject from outside as well.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
 */
class OpenPromise extends Promise {

    /**
     * create instance
     * @param {function(resolve:function, reject:function)} executor
     */
    constructor(executor) {
        let _resolve, _reject;
        super((resolve, reject) => {
            [_resolve, _reject] = [resolve, reject];
            executor(resolve, reject);
        });

        /**
         * @type {function}
         * @param {any} value
         */
        this.resolve = _resolve;

        /**
         * @type {function}
         * @param {any} reason
         */
        this.reject = _reject;
    }

}


function formatTime(time) {
    return time.getHours() + ":" + ("0"+time.getMinutes()).slice(-2);
}


function formatDuration(time1, time2) {
    const FOO = [[60*60*1000, "hr", "hrs"], [60*1000, "min", "mins"], [1000, "sec", "secs"]];
    let ms = time2 - time1;
    let parts = [];
    for (let [factor, sn, pl] of FOO) {
        let val = Math.floor(ms/factor);
        if (val) {
            let unit = val==1 ? sn : pl;
            parts.push(`${val} ${unit}`);
            ms -= val * factor;
        }
    }
    return parts.join(" ") || "0 secs";
}


function formatDistance(distance) {
    return `${distance} m`;
}


function ensureStyles(id, styles) {
    if (document.head.querySelector(`style[for="${id}"]`)) return;
    let style = document.createElement('style');
    style.setAttribute("for", id);
    style.textContent=styles;
    document.head.appendChild(style);
}


/**
 * Extracts a template content from {DOMNode} specified via {DOMSelector}
 */
function elementTemplate(node) {
    if (!node) return node;
    let argNames = (node.getAttribute("args-as") || "data").split(",");
    let markup = node.innerHTML.trim();
//    console.log(markup);
//    markup = markup.replace(/=&gt;/g, "=>");
//    markup = markup.replace(/&quot;/g, '"');
//    console.log(markup);
    node.parentNode.removeChild(node);
    let fn = Function.apply(null, ["html"].concat(argNames).concat([`return html\`${markup}\`;`]));
//    console.log(fn);
    return (...args) => fn(html, ...args);
}


export {
    OpenPromise,
    formatDuration, formatTime, formatDistance,
    ensureStyles, elementTemplate
}
