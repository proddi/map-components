import {BaseRouter, Request, Response, Route, Leg, Transport, Address, Stop, parseCoordString, parseTimeString, findRootElement} from '../generics.js';


const LOCATIONS = {
    A:          new Address({lng:13.31709, lat:52.54441, name:"A"}),
    B:          new Address({lng:13.56, lat:52.41, name:"B"}),
    BERLIN:     new Address({lng:13.447128295898438, lat:52.512864781394114, name:"Berlin"}),
    HALLE:      new Address({lng:11.973157884785905, lat:51.48050248106511, name:"Halle"}),
    UTRECHT:    new Address({lng:5.134984018513933, lat:52.07354489152308, name:"Utrecht"}),
    DORDRECHT:  new Address({lng:4.658216001698747, lat:51.80320799021636, name:"Dordrecht"}),
    LONDON_A:   new Address({lng:-0.38328552246099434, lat:51.53735345562071, name:"LONDON_A"}),
    LONDON_B:   new Address({lng:0.21958923339838066, lat:51.44329522308777, name:"LONDON_B"}),
}



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
         * @type {string}
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
        let startLoc = LOCATIONS[start];
        let destLoc = LOCATIONS[dest];
        if (!(startLoc && destLoc)) {
            if (this.fallbackRouter) return this.fallbackRouter.buildRequest(start, dest, time);
            return super.buildRequest(startLoc || "1,1", destLoc || "2,2", time).setError(
                    `MockupRouter doesn't know eighter start: "${start}" or dest: "${dest}"`);
        }
        return super.buildRequest(startLoc, destLoc, time, {
                src: this.src.replace("{start}", start).replace("{dest}", dest),
            });
    }

    /**
     * Perform a route request.
     * @async
     * @param {Request} request - route request.
     * @returns {Promise<Response, Error>} - route response
     */
    async route(request) {
//        if (request.router !== this) return request.router.route(request);
        let response = new Response(request);
//        if (request.error) return Promise.resolve(response.setError(request.error));
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
        }, error => response.setError(error));
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
