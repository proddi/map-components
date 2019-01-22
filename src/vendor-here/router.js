import {BaseRouter, RouteResponse, Route, Leg, Transport, Address, Stop, parseString, findRootElement, createUID, buildURI} from '../generics.js';
import {HerePlatform} from './platform.js';
import {qs, qp, whenElementReady} from '../mc/utils.js';


/**
 * Provides an router element for generic HERE routing. It can be referenced in map components.
 *
 * @example
 * <here-router id="here-router"
 *     platform="#platform"
 *     start="13.30,52.43"
 *     dest="13.76,52.51"
 *     time="2018-12-22T19:17:07">
 * </here-router>
 *
 * @see https://developer.here.com/documentation/routing/topics/resource-calculate-route.html
 **/
class HereRouter extends BaseRouter {
    /**
     * Type of the router - _"here"_ for this router.
     * @const
     * @type {string}
     */
    get type() { return "here"; }

    /**
     * create instance
     */
    constructor() {
        super();

        this.platform = null;
        this._whenReady = whenElementReady(qs(this.getAttribute("platform")) || qp(this, "here-platform"))
            .then(
                platform => [platform.app_id, platform.app_code],
                error => [parseString(this.getAttribute("app-id"), window), parseString(this.getAttribute("app-code"), window)]
            )
            .then(([app_id, app_code]) => {
                if (!app_id || !app_code) throw new Error("No credentials!");
                this._app_id = app_id;
                this._app_code = app_code;
            })
            ;
    }
/*
    connectedCallback() {
        this.platform = findRootElement(this, this.getAttribute("platform"), HerePlatform, null);
        this.app_id   = this.platform ? this.platform.app_id   : parseString(this.getAttribute("app-id"), window);
        this.app_code = this.platform ? this.platform.app_code : parseString(this.getAttribute("app-code"), window);
        super.connectedCallback();
    }
*/


    getRouter() {
        return this._whenReady.then(_ => this);
    }

    /**
     * Creates an request object.
     * @returns {RouteRequest}
     */
    buildRouteRequest(start, dest, time) {
        return super.buildRouteRequest(start, dest, time, {
                modes: (this.getAttribute("modes") || "transit").split(",").map(mode => REQ_MODES[mode] || mode),
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
        let url = buildURI("https://route.api.here.com/routing/7.2/calculateroute.json", {
                waypoint0:          `geo!${request.start.lat},${request.start.lng}`,
                waypoint1:          `geo!${request.dest.lat},${request.dest.lng}`,
                departure:          request.time.toISOString(),
                mode:               `fastest;${request.modes.join(",")}`,
                alternatives:       request.max || 3,
                representation:     `display`,
                legAttributdes:     `travelTime,shape`,
                maneuverAttributes: `position,publicTransportLine`,
                routeAttributes:    `legs,shape,lines,groups`,
                app_id:             this._app_id,
                app_code:           this._app_code,
            });
        let response = new RouteResponse(request);

        return fetch(url).then(res => res.json()).then(res => {
            if (res.details) return Promise.reject(res.details);

            let routes = res.response.route.map((route, index) => {
                // extract lines index
                let lines = {};
                for (let e of route.publicTransportLine || []) lines[e.id] = e;
                // build route
                let departure = new Address({
                    lat: route.waypoint[0].mappedPosition.latitude,
                    lng: route.waypoint[0].mappedPosition.longitude,
                    name: route.waypoint[0].label,
                    type: "addr",
                    time: new Date(),
                });
                let arrival = new Address({
                    lat: route.waypoint[1].mappedPosition.latitude,
                    lng: route.waypoint[1].mappedPosition.longitude,
                    name: route.waypoint[1].label,
                    type: "addr",
                    time: new Date(),
                });
                let arr = arrival;
                let legs = route.leg[0].maneuver.filter(leg => leg.shape.length > 1).reverse().map((leg, index) => {
                    let geometry = route.shape.slice(1).map(s => s.split(",").map(v => parseFloat(v)));
                    let departure = buildLocation(leg);
                    leg = new Leg(departure, arr, buildTransport(leg, lines[leg.line]), geometry, {duration: leg.travelTime, distance:leg.length, summary:leg.instruction});
                    leg.id = index;
                    arr = departure;
                    return leg;
                }).reverse();
                return new Route(createUID("h-route-{uid}"), this, departure, arrival, legs);
            });
            return response.setRoutes(routes);
        }).catch(error => response.setError(error));
    }
}


const REQ_MODES = {
    "walk":     "pedestrian",
    "car":      "car",
    "transit":  "publicTransportTimeTable",
    "bike":     "bicycle",
}


function buildTransport(leg, line) {
    line = line || {};
    let type = ROUTER_MODES[line.lineName || leg._type];
    return new Transport({
            type: type || leg._type,
            name: line.lineName || type || leg._type,
//            color: leg.color
        });
}


const ROUTER_MODES = {
    "railMetro":                     "subway",
    "railMetroRegional":             "metro",
    "PrivateTransportManeuverType":  "car",
    "PublicTransportManeuverType":   "bus",
}


function buildLocation(leg) {
    if (leg.stopName) {
        return new Stop({lat: leg.position.latitude, lng: leg.position.longitude, name: leg.stopName, time: leg.time});
    }
    return new Address({lat: leg.position.latitude, lng: leg.position.longitude, name: leg.instruction, time: leg.time});
}


customElements.define("here-router", HereRouter);


export { HereRouter }
