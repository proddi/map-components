

function whenElementReady(nodes) {
    if (!nodes) return Promise.reject("No element found");
    if (nodes.length != 1) return Promise.reject(`No unique element found (${nodes.length} nodes)`);
//    console.log("waiting for component", nodes[0].tagName.toLowerCase());
    return customElements
        .whenDefined(nodes[0].tagName.toLowerCase())
//        .then(_ => console.log("component", nodes[0].tagName.toLowerCase(), "found"))
        .then(_ => nodes[0])
        ;
}


/**
 * querySelectorAll(id)
 */
function qs(selector) {
    let nodes = document.querySelectorAll(selector);
    return nodes.length && nodes;
}


/**
 * query parent for tag-name.
 */
function qp(node, selector) {
    while ((node = node.parentNode) && node.tagName) {
        if (node.matches(selector)) return [node];
        let nodes = node.querySelectorAll(selector);
        if (nodes.length) return nodes;
    }
}


export {
    qs, qp, whenElementReady,
}
