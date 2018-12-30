import {BaseRouter, Response} from './generics.js';


class UnionRequest {
    constructor(start, dest, time, routers) {
        this.start = start;
        this.dest = dest;
        this.time = time;
//        super(start, dest, time);
        this.routers = routers;
    }
}


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
 *     time="isotime">
 * </union-router>
 */
class UnionRouter extends BaseRouter {
    /**
     * create instance.
     */
    constructor() {
        super();
        this.routers = this.getAttribute("routers").split(",").map(selector => document.querySelector(selector))
    }

    buildRequest(start, dest, time=undefined) {
        return new UnionRequest(start, dest, time, this.routers);
    }

    async route(request) {
        return Promise.all(
            request.routers.map(router => router.route(router.buildRequest(request.start, request.dest, request.time)))
        ).then(responses => {
            let routes = [];
            for (let response of responses) {
                routes = routes.concat(response.routes);
            }
            return new Response(request, ...routes);
        });
    }
}

customElements.define("union-router", UnionRouter);


export {UnionRouter}
