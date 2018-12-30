import {BaseRouter, Request, Response, Route, Leg, Transport, Address} from '../generics.js';


class HereRequest {
    constructor(start, dest, time, router) {
        this.start = start;
        this.dest = dest;
        this.time = time;
//        super(start, dest, time);
        this.router = router;
    }
}


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
    constructor() {
        super();
        this.type = "here";

        let platform = document.querySelector(this.getAttribute("platform"));

        /** @type {Promise<{map:H.Map, behavior: H.mapevents.Behavior, platform:H.service.Platform, maptypes:object}>} */
//        this.whenReady = platform.whenReady.then(({platform, maptypes}) => {
//            let router = platform.getRoutingService();
//            return {platform:platform, maptypes:maptypes, router:router};
//        });
    }


    /**
     * returns a Request object
     * @returns {Request}
     */
    buildRequest(start, dest, time=undefined) {
        return new HereRequest(start, dest, time, this);
    }

    /**
     * Perform a route request.
     * @async
     * @param {Request} request - route request.
     * @returns {Promise<Response>} - route response
     */
    async route(request) {
        let platform = document.querySelector(this.getAttribute("platform"));
        return platform.whenReady.then(({ platform }) => {
            return new Promise((resolve, reject) => {
                let router = platform.getRoutingService();
                router.calculateRoute({
                    mode: 'fastest;publicTransport',
                    waypoint0: `geo!${request.start.lat},${request.start.lng}`,
                    waypoint1: `geo!${request.dest.lat},${request.dest.lng}`,
                    routeattributes: 'waypoints,summary,shape,legs',
                    representation: 'display',
                }, (res) => {
                    res.response ? resolve(res.response) : reject(res.details);
                }, (error) => reject(error));
            }).then(res => {
                let routes = res.route.map((route, index) => {
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
                    let leg = new Leg(departure, arrival, new Transport({mode: "car", name: "car"}), route.shape.map(s => s.split(",").map(v => parseFloat(v))));
                    return new Route(`route-${index}`, this, departure, arrival, [leg]);
                });
                return new Response(request, ...routes);
            });
        });
    }
}


customElements.define("here-router", HereRouter);


export { HereRouter }
