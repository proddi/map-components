import {BaseRouter, RouteResponse, Route, Leg, Transport, Address, Stop, Maneuver, parseCoordString, parseTimeString} from '../generics.js';
import {qs, qp, whenElementReady} from '../mc/utils.js';


class MockupRouter extends BaseRouter {
    /**
     * Type of the router - _"mockup"_ for this router.
     * @const
     * @type {string}
     */
    get type() { return 'mockup'; }

    constructor() {
        super();

        /**
         * A reference to the mocked response. It can contain placeholders
         * (e.g. `src="../responses/here-transit-{start}-{dest}.json"`).
         * @type {string|null}
         */
        this.src = this.getAttribute("src");

        /**
         * A simulated delay until the response is done.
         * @type {number}
         */
        this.delay = parseFloat(this.getAttribute("delay") || "0");

        /**
         * If a fallback router is specified (`fallback-router="#other-router"`), all non matching routes
         * will be forwarded to this router
         * @type {BaseRouter|null}
         */
        this.fallbackRouter = null;
        whenElementReady(qs(this.getAttribute("fallback-router")))
            .then(fallbackRouter => this.fallbackRouter = fallbackRouter)
            .catch(_ => {})  // No error...
            ;

        /**
         * The available locations to lookup.
         * @type {Object}
         */
        this.locations = {}
    }

    buildRouteRequest(start, dest, time) {
        let startLoc = this.locations[start];
        let destLoc = this.locations[dest];
        if (!(startLoc && destLoc && this.src)) {
            if (this.fallbackRouter) {
                return this.fallbackRouter.buildRouteRequest(startLoc || start, destLoc || dest, time);
            }
            throw new Error(`MockupRouter doesn't know eighter start: "${start}" or dest: "${dest}" (for src: "${this.src}")`);
//            return super.buildRouteRequest(startLoc || start || "1,1", destLoc || dest || "2,2", time).fail(
//                    `MockupRouter doesn't know eighter start: "${start}" or dest: "${dest}" (for src: "${this.src}")`);
        }
        return super.buildRouteRequest(startLoc, destLoc, time, {
                src: this.src.replace("{start}", start).replace("{dest}", dest),
                fallbackRouter: this.fallbackRouter,
            });
    }

    /**
     * Perform a route request.
     * @async
     * @param {RouteRequest} request - route request.
     * @returns {Promise<RouteResponse, Error>} - route response
     */
    async execRouteRequest(request) {
        let response = new RouteResponse(request);
        return fetch(request.src).then(res => res.json())
            .then(data => {
                let routes = data.routes.map(data => new Route(
                    data.id,
                    data.router || this,
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
                return response.resolve(routes).fail(data.error);
            }, error => {
                console.trace("demo req failed:", error);
                if (request.fallbackRouter) {
                    return request.fallbackRouter.execRouteRequest(
                            request.fallbackRouter.buildRouteRequest(request.start, request.dest, request.time)
                        ).then(response => {
                            console.log("fallback-response:", response);
                            return response;
                        });
                }
                return response.fail(error);
            })
            .then(res => new Promise((resolve, reject) => setTimeout(_ => resolve(res), this.delay*1000)))
            ;
    }

}


function builStep(data) {
    return buildLocation(data);
}

function buildLocation(data) {
    const TYPES = {address:Address,stop:Stop,maneuver:Maneuver}
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
