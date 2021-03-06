import {BaseRouter, RouteResponse, Route, Leg, Transport, Address, findRootElement, parseString, buildURI, createUID} from '../generics.js';
import {qs, qp, whenElementReady} from '../mc/utils.js';
import {GooglePlatform} from './platform.js';


const MODES_TO_TYPE = {
    DRIVING: 'car',
    WALKING: 'walk',
    BICYCLING: 'bike',
    TRANSIT: 'transit',
    default: 'car',
}

/**
 * Provides an router element for google directions. It can be referenced in map components.
 *
 * @example <caption>foo</caption>
 * <google-router id="google-router"
 *     platform="google-platform"
 *     start="13.30,52.43"
 *     dest="13.76,52.51"
 *     time="2018-12-22T19:17:07">
 * </google-router>
 *
 * @see https://developers.google.com/maps/documentation/directions/start
 **/
class GoogleDirectionsRouter extends BaseRouter {
    /**
     * Type of the router - _"car"_, _"transit"_, _"bike"_ or _"walk"_ for this router.
     * @type {string}
     */
    get type() { return MODES_TO_TYPE[this.mode] || MODES_TO_TYPE.default }

    /**
     * Type of the router - _"here/transit"_ for this router.
     * @type {string}
     */
    get vendor() { return "google/" + this.type; }

    constructor() {
        super();

        /**
         * Travel mode to use. One of 'DRIVING', 'WALKING', 'BICYCLING', 'TRANSIT'.
         * @type {string|null}
         */
        this.mode = this.getAttribute("mode");

        /** @type {GooglePlatform} */
        this.platform = null;
        this._whenReady = whenElementReady(qs(this.getAttribute("platform")) || qp(this, "google-platform"))
            .then(platform => this.platform = platform)
            .catch(err => console.error("Unable to attach <here-platform>:", err))
            ;
    }

    getRouter() {
        return this._whenReady.then(_ => this);
    }

    /**
     * returns a Request object
     * @return {RouteRequest}
     */
    buildRouteRequest(start, dest, time) {
        return super.buildRouteRequest(start, dest, time, {
                mode: this.getAttribute("mode") || "DRIVING",
                alternatives: Boolean(this.getAttribute("max")),
            });
    }

    /**
     * Perform a route request.
     * @async
     * @param {RouteRequest} request - route request.
     * @return {Promise<RouteResponse|Error>} - route response
     */
    async execRouteRequest(request) {
        let response = new RouteResponse(request);
        return this.platform.whenReady.then(({ service }) => {
            return new Promise((resolve, reject) => {
                service.route({
                    origin: `${request.start.lat},${request.start.lng}`,
                    destination: `${request.dest.lat},${request.dest.lng}`,
                    travelMode: request.mode,
                    transitOptions: {
                        departureTime: request.time,
                    },
//                    drivingOptions: {
//                        departureTime: request.time,
//                    },
                    provideRouteAlternatives: request.alternatives,
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
                    let departure = new Address({lat: leg.start_location.lat(), lng: leg.start_location.lng(), name: leg.start_address, type: "addr", time: (leg.departure_time || {}).value || request.time});
                    let routeArr = new Address({lat: leg.end_location.lat(), lng: leg.end_location.lng(), name: leg.end_address, type: "addr", time: (leg.arrival_time || {}).value || new Date(departure.time.getTime() + leg.duration.value*1000)});
                    let lastTime = new Date(departure.time.getTime());
                    let legs = leg.steps.map((step, index) => {
                        let transit = step.transit || {};
                        let departure = new Address({lat:step.start_location.lat(), lon:step.start_location.lng(), name: step.instructions, time: (transit.departure_time || {}).value || lastTime});
                        lastTime = new Date(lastTime.getTime() + step.duration.value*1000);
                        let arrival = new Address({lat:step.end_location.lat(), lon:step.end_location.lng(), time: (transit.arrival_time || {}).value || lastTime});
                        let transport = buildTransport(step);
                        let geometry = step.path.map(point => [point.lat(), point.lng()]);
                        return new Leg(departure, arrival, transport, geometry, {
                                id:       createUID("g-leg-{uid}"),
                                distance: step.distance.value,
                                summary:  step.instructions,
                            });
                    });
                    return new Route(createUID("g-route-{uid}"), this, departure, routeArr, removeConsecModes(legs));
                });
                return response.resolve(routes);
            }).catch(error => response.fail(error));
        });
    }

    async execLocationRequest(request) {
//        let response = new RouteResponse(request);
        return this.platform.whenReady.then(({ service }) => {
            throw new Error("not implemented");
            service.place({

            });
        }).catch(error => response.fail(error));
    }

}


const LINE_MODE_MAP = {
    WALKING:                "walk",
    COMMUTER_TRAIN:         "metro",
    SUBWAY:                 "subway",
    HEAVY_RAIL:             "train",
    HIGH_SPEED_TRAIN:       "train",
    LONG_DISTANCE_TRAIN:    "train",
    BUS:                    "bus",
}

const TRAVEL_MODE_MAP = {
    BICYCLING:  "bike",
    DRIVING:    "car",
    WALKING:    "walk",
    TRANSIT:    "transit"
}

function buildTransport(step) {
    let tm = TRAVEL_MODE_MAP[step.travel_mode] || step.travel_mode;
    if (tm === "transit") {
        let transit = step.transit || {};
        let line = transit.line || {};
        return new Transport({
                type: LINE_MODE_MAP[step.transit.line.vehicle.type] || step.transit.line.vehicle.type,
                name: line.short_name,
                color: line.color,
                headsign: transit.headsign,
            });
    } else {
        return new Transport({
                type: tm,
                name: tm,
            });
    }
}

function removeConsecModes(legs) {
    let dedup = [legs[0]];
    for (let prev=legs[0], index=1, curr; (curr=legs[index]); index++ ) {
        if (curr.transport.isSame(prev.transport)) {
            prev.extendLeg(curr);
        } else {
            dedup.push(curr);
            prev = curr;
        }
    }
    return dedup;
}


customElements.define("google-router", GoogleDirectionsRouter);


export { GoogleDirectionsRouter }
