import {BaseRouter, RouteResponse} from './generics.js';


/**
 * Element for combining multiple routers {BaseRouter}s into one.
 *
 * @example
 * <router1 id="router1"></router1>
 * <router2 id="router2"></router2>
 *
 * <union-router routers="#router1,#router2"
 *     start="lat,lon"
 *     dest="lat,lon"
 *     time="now">
 * </union-router>
 */
class UnionRouter extends BaseRouter {
    /** @private */
    constructor() {
        super();

        /** @type {string} */
        this.type   = "union";
        /** @type {BaseRouter[]} */
        this.routers = undefined;
    }

    connectedCallback() {
        if (!this.routers) this.setRouters(this.getAttribute("routers"));
        super.connectedCallback();
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
        return super.buildRouteRequest(start, dest, time, { routers: this.routers, });
    }

    /**
     * Perform a route request.
     * @async
     * @param {RouteRequest} request - route request.
     * @returns {Promise<RouteResponse, Error>} - route response
     */
    async execRouteRequest(request) {
        let response = new RouteResponse(request);
        return Promise.all(
            request.routers.map(router => router.execRouteRequest(router.buildRouteRequest(request.start, request.dest, request.time)))//.catch(error => undefined))
        ).then(responses => {
            let errors = responses.filter(response => response.error).map(response => response.error);
            let routes = responses.map(response => response.routes).reduce((prev, curr) => prev.concat(curr), []);
            return response.setRoutes(routes).setError(errors.join("; ") || undefined);
        });
    }
}


customElements.define("union-router", UnionRouter);


export {UnionRouter}
