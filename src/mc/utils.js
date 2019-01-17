



function findElement({select, lookup, lookdown, tag, is}) {
    let found = [];
    let tests = (tag ? [n=>n.tagName === tag] : []).concat(is ? [n=>n.getAttribute("is")===is] : []);
    console.assert(tests.length, "No node spec given");
    let validateNode = n => !tests.find(test=>!test(n));

    // 1. selector
    if (select) {
        found = found.concat(Array.prototype.slice.call(document.querySelectorAll(select))).filter(validateNode);
        if (found.length) return found[0];
    }

    // 2. lookup
    if (lookup) {
        let node = lookup;
        while (node = node.parentNode) {
            try {
                if (validateNode(node)) {
                    found.push(node);
                    break
                }
            } catch { break; }
        }
        if (found.length) return found[0];
    }

    // 3. lookdown
    let query = (tag ? [tag] : []).concat(is ? [`[is="${is}"]`] : []).join("");
    if (lookdown) {
        found = found.concat(Array.prototype.slice.call(lookdown.querySelectorAll(query))).filter(validateNode);
        if (found.length) return found[0];
    }

    // 3. global-selector
    if (query) {
        found = found.concat(Array.prototype.slice.call(document.querySelectorAll(query))).filter(validateNode);
        if (found.length) return found[0];
    }
}



export {
    findElement,
}
