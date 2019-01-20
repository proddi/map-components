



function findElement({select, lookup, lookdown, tag, is}) {
    let found = [];
    let tests = (tag ? [n=>n.tagName.toLowerCase() === tag] : []).concat(is ? [n=>n.getAttribute("is")===is] : []);
//    console.assert(tests.length, "No node spec given");
    let validateNode = n => !tests.find(test=>!test(n));

    // 1. selector
    if (select) {
        found = found.concat(Array.prototype.slice.call(document.querySelectorAll(select))).filter(validateNode);
        console.assert(found.length < 2, found);
        if (found.length) return found[0];
    }

    // 2. lookup
    if (lookup) {
        let node = lookup;
        while (node = node.parentNode) {
            try {
                if (validateNode(node)) {
                    found.push(node);
                    break;
                }
            } catch { break; }
        }
        console.assert(found.length < 2, found);
        if (found.length) return found[0];
    }

    // 3. lookdown
    let query = (tag ? [tag] : []).concat(is ? [`[is="${is}"]`] : []).join("");
    if (lookdown) {
        found = found.concat(Array.prototype.slice.call(lookdown.querySelectorAll(query))).filter(validateNode);
        console.assert(found.length < 2, found);
        if (found.length) return found[0];
    }

    // 3. global-selector
    if (query) {
        found = found.concat(Array.prototype.slice.call(document.querySelectorAll(query))).filter(validateNode);
        console.assert(found.length < 2, found);
        if (found.length) return found[0];
    }
}


function whenElementReady(nodes) {
    if (!nodes) return Promise.reject("No element found");
    if (nodes.length != 1) return Promise.reject(`No unique element found (${nodes.length} nodes)`);
    console.log("waiting for component", nodes[0].tagName.toLowerCase());
    return customElements
        .whenDefined(nodes[0].tagName.toLowerCase())
        .then(_ => console.log("component", nodes[0].tagName.toLowerCase(), "found"))
        .then(_ => nodes[0])
        ;
}


/**
 * querySelectorAll(id)
 */
function qs(id) {
    let nodes = document.querySelectorAll(id);
    return nodes.length && nodes;
}


/**
 * query parent for tag-name.
 */
function qp(node, tag) {
    while ((node = node.parentNode) && node.tagName) {
        if (node.tagName.toLowerCase() === tag) return [node];
    }
}


export {
    qs, qp, whenElementReady,
}
