import {BaseRouter, Request, Response, Route, Leg, Transport, Address, Stop, parseString} from '../generics.js';


class HereTransitRequest {
    constructor(start, dest, time, url) {
        this.start = start;
        this.dest = dest;
        this.time = time;
//        super(start, dest, time);
        this.url = url;
    }
}

/**
 * Router element to perform transit routing. Results can be displayed at a Map (e.g. {@link HereMap})
 *
 * @example
 * <here-transit-router
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
        this.type   = "here";
        this.server = this.getAttribute("server") || "https://transit.api.here.com";
    }

    buildRequest(start, dest, time=undefined) {
        start = new Address(start);
        dest = new Address(dest);
        let app_id = parseString(this.getAttribute("app-id"), window);
        let app_code = parseString(this.getAttribute("app-code"), window);
        let url = `${this.server}/v3/route.json?dep=${start.lat},${start.lng}&arr=${dest.lat},${dest.lng}&app_id=${app_id}&app_code=${app_code}&client=webcomponents&graph=1`;
        if (time) {
            url = `${url}&time=${encodeURIComponent(time)}`;
        }
        return new HereTransitRequest(start, dest, time, url);
    }
/*
    buildRequest(start, dest, time=undefined) {
        let url = `${this.server}/api/v2/route.json?startY=${start.lat}&startX=${start.lng}&destY=${dest.lat}&destX=${dest.lng}&accessId=${this.accessId}&client=um_refclient&graph=1`;
        if (time) {
            url = `${url}&time=${encodeURIComponent(time)}`;
        }
        return new HereTransitRequest(start, dest, time, url);
    }
*/
    async route(request) {
        return fetch(request.url).then(res => res.json()).then(res => {
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
                        return new Leg(departure, arrival, transport, geometry);
                    });
                    return new Route(`route-${conn.id}`, this, departure, arrival, legs);
                });
                return new Response(request, ...routes);
            });
    }

}


function buildTransport(transport) {
    let t = Object.assign({}, transport.At || {}, transport);
    return new Transport({
            type: ROUTER_MODES[t.mode] || t.mode,
            name: t.name || "walk",
            color: t.color});
}


const ROUTER_MODES = {
    4:  "metro",
    5:  "bus",
    7:  "subway",
    20: "walk",
}


function buildLocation(loc) {
    let stn = loc.Stn,
        addr = loc.Addr;

    if (stn) return new Stop({
            lat:  stn.y,
            lng:  stn.x,
            name: stn.name,
            type: "stop",
            time: new Date(loc.time),
            id:   stn.id,
        });

    return new Address({
            lat:  addr.y,
            lng:  addr.x,
            type: "address",
            time: new Date(loc.time),
        });
}


customElements.define("here-transit-router", HereTransitRouter);


export { HereTransitRouter }
