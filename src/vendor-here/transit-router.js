import {BaseRouter, RouteResponse, MultiboardResponse, Route, Leg, Transport, Address, Stop, parseString, findRootElement, buildURI, createUID} from '../generics.js';
import {HerePlatform} from './platform.js';


/**
 * Router element to perform transit routing. Results can be displayed at a Map (e.g. {@link HereMap})
 *
 * Requires `platform` or `_app_id_`+`app_code` attributes.
 *
 * @example
 * <here-transit-router
 *     platform="..."                 # requires platform
 *     app-id="..." app_code="..."    #     -or- app-id + appcode
 *     start="lat,lng"
 *     dest="lat,lng"
 *     time="2019-01-12T14:30:00">
 * </here-transit-router>
 *
 * @see https://developer.here.com/documentation/transit/
 */
class HereTransitRouter extends BaseRouter {
    constructor() {
        super();
        /**
         * Returns "here" for this router.
         * @const
         * @type {string}
         */
        this.type   = "here-transit";
        /** @type {string} */
        this.server = this.getAttribute("server") || "https://transit.api.here.com";
    }

    buildRequest(start, dest, time) {
        return super.buildRequest(start, dest, time, {
                server: this.server,
                modes: this.getAttribute("modes"),
                max: this.getAttribute("max"),
            });
    }

    /**
     * Perform a route request.
     * @async
     * @param {Request} request - route request.
     * @returns {Promise<Response, Error>} - route response
     */
    async route(request) {
        let platform = findRootElement(this, this.getAttribute("platform"), HerePlatform, null);

        let url = buildURI(`${request.server}/v3/route.json`, {
                dep:        `${request.start.lat},${request.start.lng}`,
                arr:        `${request.dest.lat},${request.dest.lng}`,
                time:       request.time.toISOString(),
                client:     "webcomponents",
                graph:      1,
                modes:      request.modes,
                max:        request.max,
                app_id:     platform ? platform.app_id : parseString(this.getAttribute("app-id"), window),
                app_code:   platform ? platform.app_code : parseString(this.getAttribute("app-code"), window),
            });


        let response = new RouteResponse(request);
        return fetch(url).then(res => res.json()).then(res => {
                if (res.Res.Message) {
                    throw res.Res.Message.text;
                }
                let routes = res.Res.Connections.Connection.map((conn) => {
                    let departure = buildLocation(conn.Dep);
                    let arrival = buildLocation(conn.Arr);
                    let legs = conn.Sections.Sec.map(sec => {
                        let departure = buildLocation(sec.Dep);
                        let arrival = buildLocation(sec.Arr);
                        let transport = buildTransport(sec.Dep.Transport);
                        let geometry = sec.graph ? sec.graph.split(" ").map(coord => coord.split(",").map(parseFloat)) : [];
                        let steps = (sec.Journey.Stop || []).map(e => buildLocation(e, {time:"dep"}));
                        return new Leg(departure, arrival, transport, geometry, {
                                id:       createUID("g-leg-{uid}"),
                                distance: sec.Journey.distance,
                                summary:  `Go to ${arrival.name}`,
                                steps:    steps,
                            });
                    });
                    return new Route(createUID("h-t-route-{uid}-{salt}", conn.id), this, departure, arrival, legs);
                });
                return response.setRoutes(routes);
            });
    }



    buildMultiboardRequest(center, time) {
        return super.buildMultiboardRequest(center, time, {
                server: this.server,
            });
    }

    async execMultiboardRequest(request) {
        let platform = findRootElement(this, this.getAttribute("platform"), HerePlatform, null);

        let url = buildURI(`${request.server}/v3/multiboard/by_geocoord.json`, {
                center:     `${request.center.lat},${request.center.lng}`,
                time:       request.time.toISOString(),
                app_id:     platform ? platform.app_id : parseString(this.getAttribute("app-id"), window),
                app_code:   platform ? platform.app_code : parseString(this.getAttribute("app-code"), window),
            });


        let response = new MultiboardResponse(request);
        return fetch(url).then(res => res.json()).then(res => {
            let stops = res.Res.MultiNextDepartures.MultiNextDeparture.map(multinext => {
                let stop = buildLocation(multinext);
                console.log(multinext);
                console.info(stop);
                return stop;
            });

            return response.setStops(stops);
        });
    }
}


function buildTransport(transport) {
    let t = Object.assign({}, transport.At || {}, transport);
    return new Transport({
            type:       ROUTER_MODES[t.mode] || t.mode,
            name:       t.name || "walk",
            color:      t.color,
            headsign:   t.dir,
        });
}


const ROUTER_MODES = {
    0:  "highspeed_train",
    3:  "train",
    4:  "metro",
    5:  "bus",
    7:  "subway",
    8:  "tram",
    12: "bus_rapid",
    20: "walk",
}


function buildLocation(loc, {time="time"}={}) {
    let stn = loc.Stn,
        addr = loc.Addr;

    if (stn) return new Stop({
            lat:  stn.y,
            lng:  stn.x,
            name: stn.name,
            type: "stop",
            time: new Date(loc.time || loc.arr || loc.dep),
            id:   stn.id,
        });

    return new Address({
            lat:  addr.y,
            lng:  addr.x,
            type: "address",
            time: new Date(loc.time || loc.arr || loc.dep),
        });
}


customElements.define("here-transit-router", HereTransitRouter);


export { HereTransitRouter }
