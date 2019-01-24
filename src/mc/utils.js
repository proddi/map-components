/**
 * @external {TemplateResult} https://lit-html.polymer-project.org/api/classes/lit_html.templateresult.html
 */


/**
 * Returns a {@link Promise} that gets resolved when the {@link HTMLElement} is defined. This prevents working on
 * uninitialized custom tags.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/CustomElementRegistry/whenDefined
 * @since 0.0.2
 * @param {DOMNode[]} nodes - List of {@link DOMNode}s, typically a result of {@link qs} or {@link qp}.
 *                            If not one element is passed (0, 2..) the returned Promise rejects with an error.
 * @return {Promise<HTMLElement|error>} The Promise resolving to the {@link HTMLElement} instance or rejecting with the
 *                                      error message.
 */
function whenElementIsReady(nodes) {
    if (!nodes) return Promise.reject("No element found");
    if (nodes.length != 1) return Promise.reject(`No unique element found (${nodes.length} nodes)`);
    return customElements
        .whenDefined(nodes[0].tagName.toLowerCase())
        .then(_ => nodes[0])
        ;
}


/**
 * This is an alias of {@link whenElementIsReady}.
 * @deprecated Use {@link whenElementIsReady} instead.
 * @version 0.0.1
 */
function whenElementReady(...args) {
    return whenElementIsReady(...args);
}


/**
 * Short-Hand for __q__uery __s__elector (`document.querySelectorAll(selector)`) with the difference of returning
 * {@link null} when the result is empty. This allows easy chaining of selectors.
 *
 * @param {DOMSelector} selector
 * @return {DOMNode[]|null}
 *
 * @example
 * let node = qs('[role=person]') || qp('x-person');
 */
function qs(selector) {
    let nodes = document.querySelectorAll(selector);
    return nodes.length && nodes;
}


/**
 * Short-Hand for __q__uerying __p__arents. This function walks the parents and queries for elements on every node
 * until there is a match. This function is mainly used to get components in the neighborhood.
 *
 * Having dom nodes like this
 * ```html
 * <body>
 *   <article>
 *     <header></header>
 *     <content></content>
 *   <article>
 *   <article>
 *     <header></header>
 *     <content></content>
 *   <article>
 * </body>
 * ```
 *
 * ```javascript
 * // we query for the nearby header element within the article
 * qs('content').forEach(node => {
 *   let header = qp(node, 'header');
 * });
 * ```
 *
 * @param {DOMNode} node
 * @param {DOMSelector} selector
 * return {DOMNode[]|null}
 */
function qp(node, selector) {
    while ((node = node.parentNode) && node.tagName) {
        if (node.matches(selector)) return [node];
        let nodes = node.querySelectorAll(selector);
        if (nodes.length) return nodes;
    }
}


/**
 * Short-Hand for __q__uerying for __i__nstance in __c__hildren.
 * It looks for {@link HTMLElement}s instance of a {@link Class}.
 * @experimental
 * @todo This is a placeholder function - implement me.
 * @param {this} node
 * @param {class} Klass - An class definition to look for.
 * @return {Promise<HTMLElement[]|error>} - A Promise resolving to list of elements instanceof `Klass` or rejecting
 *                                          with error message.
 */
function qic(node, Klass) {
    return Promise.reject("Not implemented");
}


export {
    qs, qp, qic, whenElementIsReady, whenElementReady,
}
