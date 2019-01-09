import {BaseRouter, Request, Response, Route, Leg, Transport, Address, findRootElement, parseString, buildURI, createUID} from '../generics.js';
import {GooglePlatform} from './platform.js';


/**
 * Provides an router element for google directions. It can be referenced in map components.
 *
 * @example
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
    constructor() {
        super();
        this.type = "google";

        /** @type {GooglePlatform} */
        this.platform = undefined;
    }

    connectedCallback() {
        this.platform = findRootElement(this, this.getAttribute("platform"), GooglePlatform);
        super.connectedCallback();
    }

    /**
     * returns a Request object
     * @return {Request}
     */
    buildRequest(start, dest, time=undefined) {
        return new Request(this, start, dest, time, {
                mode: this.getAttribute("mode") || "DRIVING",
                alternatives: Boolean(this.getAttribute("max")),
            });
    }

    /**
     * Perform a route request.
     * @async
     * @param {Request} request - route request.
     * @return {Promise<Response|Error>} - route response
     */
    async route(request) {
        return this.platform.whenReady.then(({ service }) => {
            return new Promise((resolve, reject) => {
                service.route({
                    origin: `${request.start.lat},${request.start.lng}`,
                    destination: `${request.dest.lat},${request.dest.lng}`,
                    travelMode: request.mode,
                    transitOptions: {
                        departureTime: new Date(),
                    },
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
                    let departure = new Address({lat: leg.start_location.lat(), lng: leg.start_location.lng(), name: leg.start_address, type: "addr", time: (leg.departure_time || {}).value || new Date()});
                    let arrival = new Address({lat: leg.end_location.lat(), lng: leg.end_location.lng(), name: leg.end_address, type: "addr", time: (leg.arrival_time || {}).value || new Date(departure.time.getTime() + leg.duration.value*1000)});
                    let accumulativeTime = departure.time;
                    let legs = leg.steps.map((step, index) => {
                        console.log(step);
                        let transit = step.transit || {};
                        let departure = new Address({lat:step.start_location.lat(), lon:step.start_location.lng(), name: step.instructions, time: (transit.departure_time || {}).value || accumulativeTime});
                        accumulativeTime = new Date(accumulativeTime.getTime() + leg.duration.value*1000);
                        let arrival = new Address({lat:step.end_location.lat(), lon:step.end_location.lng(), time: (transit.arrival_time || {}).value || accumulativeTime});
                        let transport = buildTransport(step);
                        let geometry = step.path.map(point => [point.lat(), point.lng()]);
                        return new Leg(departure, arrival, transport, geometry, {
                                id:       createUID("g-leg-{uid}"),
                                distance: step.distance.value,
                                summary:  step.instructions,
                            });
                    });
                    return new Route(createUID("g-route-{uid}"), this, departure, arrival, removeConsecModes(legs));
                });
//                console.log("G-RES", routes);
                return new Response(request, ...routes);
            }).catch(error => new Response(request).setError(error));
        });
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
