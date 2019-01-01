import {BaseRouter, Request, Response, Route, Leg, Transport, Address, Stop} from '../generics.js';


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
 **/
class HereRouter extends BaseRouter {
    /**
     * create instance
     */
    constructor() {
        super();
        /**
         * Returns "here" for this router.
         * @type {string}
         */
        this.type = "here";
    }

    /**
     * returns a Request object
     * @returns {Request}
     */
    buildRequest(start, dest, time=undefined) {
        return new Request(this, start, dest, time);
    }

    /**
     * Perform a route request.
     * @async
     * @param {Request} request - route request.
     * @returns {Promise<Response, Error>} - route response
     */
    async route(request) {
        let platform = document.querySelector(this.getAttribute("platform"));

        let app_id   = platform && platform.app_id || parseString(this.getAttribute("app-id"), window);
        let app_code = platform && platform.app_code || parseString(this.getAttribute("app-code"), window);

        let url = `https://route.api.here.com/routing/7.2/calculateroute.json?waypoint0=geo!${request.start.lat},${request.start.lng}&waypoint1=geo!${request.dest.lat},${request.dest.lng}&mode=fastest;publicTransportTimeTable&alternatives=3&representation=display&legAttributdes=travelTime,shape&maneuverAttributes=position,publicTransportLine&routeAttributes=legs,shape,lines,groups&app_id=${app_id}&app_code=${app_code}`;
        if (request.time) {
            url = `${url}&departure=${encodeURIComponent(request.time)}`;
        }

        return fetch(url).then(res => res.json()).then(res => {
            if (res.details) return Promise.reject(res.details);

            let routes = res.response.route.map((route, index) => {
//                console.log("ROUTE", index, route);
                // extract lines index
                let lines = {};
                for (let e of route.publicTransportLine) lines[e.id] = e;
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
                let legs = route.leg[0].maneuver.filter(leg => leg.shape.length > 1).map((leg, index) => {
//                    console.log("LEG", index, leg);
                    let geometry = route.shape.slice(1).map(s => s.split(",").map(v => parseFloat(v)));
                    let departure = buildLocation(leg);
                    leg = new Leg(departure, arrival, buildTransport(leg, lines[leg.line]), geometry);
                    leg.id = index;
                    return leg;
                });
                // fix arrivals
                legs.reduce((prev, curr) => {
                    prev.arrival = curr.departure;
                    return curr;
                });
//                legs.forEach(leg => console.log(index, leg.id, leg.departure, "->", leg.arrival));
                return new Route(`route-${index}`, this, departure, arrival, legs);
            });
            return new Response(request, ...routes);
        });
    }
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
