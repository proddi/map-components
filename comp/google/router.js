import {BaseRouter, Request, Response, Route, Leg, Transport, Address} from '../generics.js';


class GoogleRequest {
    constructor(start, dest, time, url, router) {
        this.start = start;
        this.dest = dest;
        this.time = time;
//        super(start, dest, time);
        this.url = url;
        this.router = router;
    }
}


/**
 * Provides an router element for google directions. It can be referenced in map components.
 *
 * @example
 * <google-router id="google-router"
 *     access-id="${GOOGLE_KEY}"
 *     start="13.30,52.43"
 *     dest="13.76,52.51"
 *     time="2018-12-22T19:17:07">
 * </google-router>
 **/
class GoogleDirectionsRouter extends BaseRouter {
    constructor() {
        super();
        this.type = "google";
    }
    /**
     * returns a Request object
     * @returns {Request}
     */
    buildRequest(start, dest, time=undefined) {
        start = new Address(start);
        dest = new Address(dest);
        let url = `https://maps.googleapis.com/maps/api/directions/json?origin=${start.lat},${start.lng}&destination=${dest.lat},${dest.lng}&key=${this.apiKey}`;
        if (time) {
            url = `${url}&departure_time=now`; // ${encodeURIComponent(time)}`;
        }
        return new GoogleRequest(start, dest, time, url, this);
    }

    /**
     * Perform a route request.
     * @async
     * @param {Request} request - route request.
     * @returns {Promise<Response>} - route response
     */
    async route(request) {
        let platform = document.querySelector(this.getAttribute("platform"));
        return platform.whenReady.then(({ service }) => {
            return new Promise((resolve, reject) => {
                service.route({
                    origin: `${request.start.lat},${request.start.lng}`,
                    destination: `${request.dest.lat},${request.dest.lng}`,
                    travelMode: 'TRANSIT'
                }, function(res, status) {
                    if (status === 'OK') {
                        resolve(res);
                    } else {
                        reject(status);
                    }
                });
            }).then(res => {
                let routes = res.routes.map((route, index) => {
                    let leg = route.legs[0];
                    let departure = new Address({lat: leg.start_location.lat(), lng: leg.start_location.lng(), name: leg.start_address, type: "addr", time: leg.departure_time.value});
                    let arrival = new Address({lat: leg.end_location.lat(), lng: leg.end_location.lng(), name: leg.end_address, type: "addr", time: leg.arrival_time.value});
                    let date = leg.departure_time.value;
                    let steps = leg.steps.map((step, index) => {
                        let departure = new Address({lat:step.start_location.lat(), lon:step.start_location.lng(), name: "name", time: "time"});
                        let arrival = new Address({lat:step.end_location.lat(), lon:step.end_location.lng()});
                        let transport = new Transport({
                                mode: this._getStepMode(step),
                                name: step.transit && step.transit.line.short_name || "walk"
                            });
                        let geometry = step.path.map(point => [point.lat(), point.lng()]);
                        return new Leg(departure, arrival, transport, geometry);
                    });
                    return new Route(`route-${index}`, this, departure, arrival, steps);
                });
                return new Response(request, ...routes);
            });
        });
    }

    _getStepMode(step) {
        let mode = step.transit && step.transit.line.vehicle.type || step.travel_mode;
        return _ROUTER_MODE_MAP[mode] || mode;
    }
}

const _ROUTER_MODE_MAP = {
    "WALKING":          "walk",
    "COMMUTER_TRAIN":   "metro",
    "SUBWAY":           "subway",
    "HEAVY_RAIL":       "train",
    "HIGH_SPEED_TRAIN": "train",
    "LONG_DISTANCE_TRAIN": "train",
    "BUS":              "bus",
}


customElements.define("google-router", GoogleDirectionsRouter);


export { GoogleDirectionsRouter }
