import {BaseRouter, Request, Response, Route, Leg, Transport, Address, Stop, parseCoordString, parseTimeString, findRootElement} from '../generics.js';


class MockupRouter extends BaseRouter {
    constructor() {
        super();

        /**
         * Returns `"mockup"` for this router.
         * @const
         * @type {string}
         */
        this.type   = "mockup";

        /**
         * A reference to the mocked response. It can contain placeholders
         * (e.g. `src="../responses/here-transit-{start}-{dest}.json"`).
         * @type {string|undefined}
         */
        this.src = this.getAttribute("src");

        /**
         * If a fallback router is specified (`fallback-router="#other-router"`), all non matching routes
         * will be forwarded to this router
         * @type {BaseRouter|undefined}
         */
        this.fallbackRouter = undefined;

        this.locations = {}
    }

    connectedCallback() {
        super.connectedCallback();
        this.fallbackRouter = document.querySelector(this.getAttribute("fallback-router"));
    }

    buildRequest(start, dest, time) {
        let startLoc = this.locations[start];
        let destLoc = this.locations[dest];
        if (!(startLoc && destLoc && this.src)) {
            if (this.fallbackRouter) return this.fallbackRouter.buildRequest(startLoc || start, destLoc || dest, time);
            return super.buildRequest(startLoc || "1,1", destLoc || "2,2", time).setError(
                    `MockupRouter doesn't know eighter start: "${start}" or dest: "${dest}" (or src: "${this.src}")`);
        }
        return super.buildRequest(startLoc, destLoc, time, {
                src: this.src.replace("{start}", start).replace("{dest}", dest),
                fallbackRouter: this.fallbackRouter,
            });
    }

    /**
     * Perform a route request.
     * @async
     * @param {Request} request - route request.
     * @returns {Promise<Response, Error>} - route response
     */
    async route(request) {
        let response = new Response(request);
        return fetch(request.src).then(res => res.json()).then(data => {
            let routes = data.routes.map(data => new Route(
                data.id,
                this,
                buildLocation(data.departure),
                buildLocation(data.arrival),
                data.legs.map(leg => new Leg(
                        buildLocation(leg.departure),
                        buildLocation(leg.arrival),
                        new Transport(leg.transport),
                        leg.geometry,
                        {
                            id: leg.id,
                            distance: leg.distance,
                            summary:leg.summary,
                            steps: leg.steps.map(step => buildLocation(step))
                        }
                ))
            ));
            return response.setRoutes(routes).setError(data.error);
        }, error => {
            console.trace("demo req failed:", error);
            if (request.fallbackRouter) {
                return request.fallbackRouter.route(
                        request.fallbackRouter.buildRequest(request.start, request.dest, request.time)
                    ).then(response => {
                        console.log("fallback-response:", response);
                        return response;
                    });
            }
            return response.setError(error)
        });
    }

}


function buildLocation(data) {
    const TYPES = {address:Address,stop:Stop}
    let Type = TYPES[data.type] || Location;
    data = Object.assign({}, data);
    delete data.type;
    if (data._name) data.name = data._name;
    delete data._name;
    if (data.time) data.time = new Date(data.time);
    return new Type(data)
}


window.Response_serialize = function Response_serialize(response) {
    let data = {
        request: {
            start: response.request.start,
            dest: response.request.dest,
            time: response.request.time,
        },
        error: response.error,
        routes: response.routes.map(route => {
            return {
                id: route.id,
                departure: route.departure,
                arrival: route.arrival,
                router: { name: route.router.name },
                legs: route.legs.map(leg => {
                    return {
                        id: leg.id,
                        departure: leg.departure,
                        arrival: leg.arrival,
                        distance: leg.distance,
                        summary: leg.summary,
                        transport: leg.transport,
                        steps: leg.steps,
                        geometry: leg.geometry,
                    }
                }),
            }
        })
    }

    return JSON.stringify(data);
}


customElements.define("mockup-router", MockupRouter);


export { MockupRouter }
