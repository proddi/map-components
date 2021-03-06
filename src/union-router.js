import { html, render } from './mc/lit-html.js';
import {BaseRouter, RouteResponse} from './generics.js';
import {qs, qp, whenElementReady} from './mc/utils.js';


/**
 * Element for combining multiple routers {BaseRouter}s into one.
 *
 * @todo Find the right place.
 *
 * @example
 * <router1 id="router1"></router1>
 * <router2 id="router2"></router2>
 *
 * <union-router routers="#router1,#router2" start="lat,lon" dest="lat,lon">
 * </union-router>
 *
 * @example
 * <union-router start="lat,lon" dest="lat,lon">
 *   <router1></router1>
 *   <router2></router2>
 * </union-router>
 *
 */
class UnionRouter extends BaseRouter {
    /**
     * Type of the router - _"union"_ for this router.
     * @const
     * @type {string}
     */
    get type() { return "union"; }

    /** @protected */
    constructor() {
        super();

        /**
         * @attribute {routers} - List of HTMLElement's with {@link BaseRouter} interface.
         * @type {BaseRouter[]}
         */

        this.routers = [];

        // render
        this.attachShadow({mode: 'open'});
        render(this.render(), this.shadowRoot);

        let routers = this.getAttribute("routers");
        const attrRouters = (routers ? routers.split(",") : [])
                .filter(id => id)
                .map(id => whenElementReady(qs(id)))
                ;
        const slotRouters = this.shadowRoot.querySelector('slot')
                .assignedElements()
                .map(el => customElements.whenDefined(el.tagName.toLowerCase()).then(_ => el))
                ;

        this._whenReady = Promise.all(attrRouters.concat(slotRouters))
            .then(routers => this.routers = routers)
            ;
    }

    render() {
        return html`
            <slot></slot>
        `
    }

    getRouter() {
        return this._whenReady
            .then(routers => Promise.all(routers.map(router => router.getRouter())))
            .then(_ => this);
    }

    /**
     * Sets a list of routers
     * @param {BaseRouter[]|string} routers - A list of routers or a comma-separated {@link DOMSelector} string.
     */
    setRouters(routers) {
        // currently just domselectors supported
        this.routers = (routers && routers.split(",") || [])
            .map(selector => [selector, document.querySelector(selector)])
            .filter(([selector, router]) => {
                    if (router instanceof BaseRouter) return true;
                    console.warn(`${this.tagName}(${this.id}): The selector "${selector}" doesn't refer to valid router element. Did you include html-tag support?`);
                }).map(([selector, router]) => router);
    }

    buildRouteRequest(start, dest, time=undefined) {
        return super.buildRouteRequest(start, dest, time, {
                requests: this.routers.map(router => router.buildRouteRequest(...arguments)),
            });
    }

    /**
     * Perform a route request.
     * @async
     * @param {RouteRequest} request - route request.
     * @param {function} progress - Callback to notify about intermediate states.
     * @returns {Promise<RouteResponse, Error>}
     */
    async execRouteRequest(request, progress) {
        let response = new RouteResponse(request);
        return Promise.all(
            request.requests.map(request => request.router.execRouteRequest(request).then(res => {
                    response.resolve(response.routes.concat(res.routes));
                    progress(response);
                    return res;
                }))//.catch(error => undefined))
        ).then(responses => {
            let errors = responses.filter(response => response.error).map(response => response.error);
            let routes = responses.map(response => response.routes).reduce((prev, curr) => prev.concat(curr), []);
            return response.resolve(routes).fail(errors.join("; ") || undefined);
        })
        .catch(errors => { console.error(errors); throw errors;});
    }
}


customElements.define("union-router", UnionRouter);


export {UnionRouter}
