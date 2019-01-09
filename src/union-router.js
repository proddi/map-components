import {BaseRouter, Request, Response} from './generics.js';


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
    /**
     * create instance.
     */
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
            .map(selector => document.querySelector(selector))
            .filter(router => {
                    if (router instanceof BaseRouter) return true;
                    console.warn(router, "is not a valid Router object. Did you include html-tag support?");
                });
    }

    buildRequest(start, dest, time=undefined) {
        return new Request(this, start, dest, time, { routers: this.routers, });
    }

    /**
     * Perform a route request.
     * @async
     * @param {Request} request - route request.
     * @returns {Promise<Response, Error>} - route response
     */
    async route(request) {
        return Promise.all(
            request.routers.map(router => router.route(router.buildRequest(request.start, request.dest, request.time)))//.catch(error => undefined))
        ).then(responses => {
            let errors = responses.filter(response => response.error).map(response => response.error).join("; ");
            let routes = responses.map(response => response.routes).reduce((prev, curr) => prev.concat(curr), []);
            return new Response(request, ...routes).setError(errors);
        }); // error will be te first error occurred
    }
}


customElements.define("union-router", UnionRouter);


export {UnionRouter}
