import {
    BaseRouter,
    RouteResponse, MultiboardResponse, StopsByNameRequest, StopResponse,
    Route, Leg, Transport, Address, Stop, Maneuver, Departure, DepartureStop,
    parseString, buildURI, createUID,
} from '../generics.js';
import {qs, qp, whenElementReady} from '../mc/utils.js';
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
    /**
     * Type of the router - _"transit"_ for this router.
     * @const
     * @type {string}
     */
    get type() { return "transit"; }

    /**
     * Type of the router - _"here/transit"_ for this router.
     * @const
     * @type {string}
     */
    get vendor() { return "here/" + this.type; }

    constructor() {
        super();

        /** @type {string} */
        this.server = this.getAttribute("server") || "https://transit.api.here.com";

        this.platform = null;
        whenElementReady(qs(this.getAttribute("platform")) || qp(this, "here-platform"))
            .then(platform => this.platform = platform)
            .catch(err => console.error("Unable to attach <here-platform>:", err))
            ;

    }


    /**
     * Requests Stops by name
     * @experimental - Not official
     * @private
     * @todo Structure this according to API
     * @async
     */
    async requestStopsByName(query, center) {
        // TODO: make this function safe
        let request = this.buildStopsByNameRequest(query, center);
        return this.execStopsByNameRequest(request);
    }

    buildStopsByNameRequest(query, center, options) {
        return new StopsByNameRequest(this, query, center, options);
    }

    async execStopsByNameRequest(request) {
        let platform = this.platform;

        let url = buildURI(`${this.server}/v3/stations/by_name.json`, {
                name:       request.query,
                center:     `${request.center.lat},${request.center.lng}`,
                client:     "map-components",
//                max:        request.max,
                app_id:     platform ? platform.app_id : parseString(this.getAttribute("app-id"), window),
                app_code:   platform ? platform.app_code : parseString(this.getAttribute("app-code"), window),
            });

        let response = new StopResponse(request);
        return fetch(url).then(res => res.json()).then(res => {
                if (res.Res.Message) {
                    throw new Error(res.Res.Message.text);
                }
                // parse stations
                let stops = res.Res.Stations.Stn.map(stn => new Stop({
                        lat:  stn.y,
                        lng:  stn.x,
                        name: stn.name,
                        type: "stop",
                        time: 0,
                        id:   stn.id,
                    }));
                return response.resolve(stops);
            });
    }










    buildRouteRequest(start, dest, time) {
        return super.buildRouteRequest(start, dest, time, {
                server: this.server,
                modes: this.getAttribute("modes"),
                max: this.getAttribute("max"),
            });
    }

    /**
     * Perform a route request.
     * @async
     * @param {RouteRequest} request - route request.
     * @returns {Promise<RouteResponse, Error>} - route response
     */
    async execRouteRequest(request) {
//        let platform = findRootElement(this, this.getAttribute("platform"), HerePlatform, null);
        let platform = this.platform;

        let url = buildURI(`${request.server}/v3/route.json`, {
                dep:        `${request.start.lat},${request.start.lng}`,
                arr:        `${request.dest.lat},${request.dest.lng}`,
                time:       request.time.toISOString(),
                client:     "map-components",
                graph:      1,
                maneuvers:  1,
                modes:      request.modes,
                max:        request.max,
                app_id:     platform ? platform.app_id : parseString(this.getAttribute("app-id"), window),
                app_code:   platform ? platform.app_code : parseString(this.getAttribute("app-code"), window),
            });


        let response = new RouteResponse(request);
        return fetch(url).then(res => res.json()).then(res => {
                if (res.Res.Message) {
                    throw new Error(res.Res.Message.text);
                }
                // parse guidance + maneuver as lookup if exists
                let maneuvers = {};
                let geometries = {};
                ((res.Res.Guidance || {}).Maneuvers || []).forEach(data => {
                    let steps = data.Maneuver.map(m => new Maneuver({
                            lat:      52.534318,    // TODO: use first coord from graph
                            lng:      13.328702,    // ...
                            name:     m.instruction,
                            maneuver: MANEUVER_ACTIONS[m.action] || m.action,
                            distance: m.distance,
                            duration: m.duration,   // TODO: parse duration
                            time:     new Date(),
                        }));
                    let geometry = data.Maneuver
                            .map(m => m.graph ? m.graph.split(" ").map(coord => coord.split(",").map(parseFloat)) : [null])  // parse "52.5131292,13.4469195 52.5131464,13.4469759"
                            .map(coords => coords.slice(0,-1))   // end coords covered by next maneuver
                            .reduce((prev, curr) => prev.concat(curr), [])
                            ;
                    data.sec_ids.split(" ").forEach(sec_id => {
                            maneuvers[sec_id] = steps;
                            geometries[sec_id] = geometry;
                        });
                });
                // parse connections
                let routes = res.Res.Connections.Connection.map((conn) => {
                    let departure = buildLocation(conn.Dep);
                    let arrival = buildLocation(conn.Arr);
                    let legs = conn.Sections.Sec.map(sec => {
                        let departure = buildLocation(sec.Dep);
                        let arrival = buildLocation(sec.Arr);
                        let transport = buildTransport(sec.Dep.Transport);
                        let geometry = sec.graph ? sec.graph.split(" ").map(coord => coord.split(",").map(parseFloat)) : [];
                        if (geometry.length === 0) geometry = geometries[sec.id] || [];  // when no geometry try from maneuvers
                        let steps = (sec.Journey.Stop || []).map(e => buildLocation(e, {time:"dep"}));
                        if (steps.length === 0) steps = maneuvers[sec.id] || [];  // when no steps try maneuvers
                        return new Leg(departure, arrival, transport, geometry, {
                                id:       createUID("h-leg-{uid}"),
                                distance: sec.Journey.distance,
                                summary:  `Go to ${arrival.name}`,
                                steps:    steps,
                            });
                    });
                    return new Route(createUID("h-t-route-{uid}-{salt}", conn.id), this, departure, arrival, legs);
                });
                return response.resolve(routes);
            });
    }


    buildMultiboardRequest(center, time) {
        return super.buildMultiboardRequest(center, time, {
                server: this.server,
            });
    }

    /**
     * Perform a multi board request.
     * @async
     * @param {MultiboardRequest} request - multi board request.
     * @returns {Promise<MultiboardRequest, Error>} - multi board response
     */
    async execMultiboardRequest(request) {
        let platform = findRootElement(this, this.getAttribute("platform"), HerePlatform, null);

        let url = buildURI(`${request.server}/v3/multiboard/by_geocoord.json`, {
                center:     `${request.center.lat},${request.center.lng}`,
                time:       request.time.toISOString(),
                details:    1,
                app_id:     platform ? platform.app_id : parseString(this.getAttribute("app-id"), window),
                app_code:   platform ? platform.app_code : parseString(this.getAttribute("app-code"), window),
            });

        let response = new MultiboardResponse(request);
        return fetch(url).then(res => res.json()).then(res => {
            let stops = res.Res.MultiNextDepartures.MultiNextDeparture.map(multinext => {
                let stop = buildLocation(multinext);
                stop.router = this;
                let departures = multinext.NextDepartures.Dep.map(dep => {
                    return new Departure({
                        platform:  dep.platform,
                        time:      new Date(dep.time),
                        transport: buildTransport(dep.Transport),
                    });
                });
                stop.departures = departures;
                return stop;
            });
            return response.resolve(stops);
        });
    }
}


const MANEUVER_ACTIONS = {
    "leftTurn":             "turn-left",
    "slightLeftTurn":       "slightly-left-turn",
    "leftFork":             "left-fork",
    "leftRoundaboutEnter":  "left-roundabout-enter",
    "leftRoundaboutExit1":  "left-roundabout-exit1",
    "leftRoundaboutExit2":  "left-roundabout-exit2",
    "leftRoundaboutExit3":  "left-roundabout-exit3",
    "leftRoundaboutExit4":  "left-roundabout-exit4",

    "rightTurn":            "turn-right",
    "slightRightTurn":      "slightly-right-turn",
    "rightFork":            "right-fork",
    "rightRoundaboutEnter": "right-roundabout-enter",
    "rightRoundaboutExit1": "right-roundabout-exit1",
    "rightRoundaboutExit2": "right-roundabout-exit2",
    "rightRoundaboutExit3": "right-roundabout-exit3",
    "rightRoundaboutExit4": "right-roundabout-exit4",
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
    0:  "train/highspeed",
    1:  "train/intercity",
    2:  "train/interregional",
    3:  "train/regional",
    4:  "metro",
    5:  "bus",
    7:  "subway",
    8:  "tram",
    9:  "bus/private",
    10: "inclined",
    11: "aerial",
    12: "bus/rapid",
    13: "monorail",
    14: "flight",
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
            time: new Date(loc.time || loc.arr || loc.dep || 0),
            id:   stn.id,
        });

    return new Address({
            lat:  addr.y,
            lng:  addr.x,
            type: "address",
            time: new Date(loc.time || loc.arr || loc.dep || 0),
        });
}


customElements.define("here-transit-router", HereTransitRouter);


export { HereTransitRouter }
