/**
 * Base class element for building custom router elements (e.g. {@link HereTransitRouter}).
 *
 * @abstract
 */
class BaseRouter extends HTMLElement {
    constructor() {
        super();
        /**
         * Returns "abstract" for this router.
         * @type {string}
         */
        this.type = "abstract";
        /**
         * Type of the router.
         * @type {string}
         */
        this.id     = this.getAttribute("id") || this.tagName;
        /** @type {Address} */
        this.start  = parseCoordString(this.getAttribute("start"));
        /** @type {Address} */
        this.dest   = parseCoordString(this.getAttribute("dest"));
        /** @type {Date} */
        this.time   = this.getAttribute("time");

        /** @type {Request|undefined} */
        this.currentRequest = undefined;
        /** @type {Route[]|undefined} */
        this.currentRoutes  = undefined;
        /** @type {Error|undefined} */
        this.currentError   = undefined;
    }

    connectedCallback() {
        setTimeout(() => {
            this.update(parseCoordString(this.getAttribute("start")), parseCoordString(this.getAttribute("dest")), this.getAttribute("time"));
        }, 50);
    }

    buildRequest() {
        console.warn("Need to implement router.buildRequest() method");
    }

    /**
     * @fires GenericRouter#request
     */
    update(start, dest, time=undefined) {
        // update
        if (start) this.start = Address.enforce(start);
        if (dest) this.dest = Address.enforce(dest);
        if (time) this.time = time;

        // perform request if possivle
        if (this.start && this.dest && this.time) {
            let request = this.buildRequest(this.start, this.dest, this.time);
            this.currentRequest = request;
            this.dispatchEvent(new CustomEvent('request', { detail: request }));
            this.route(request).then(response => {
                this.currentRoutes = response.routes;
                this.currentError = undefined;
                this.dispatchEvent(new CustomEvent('response', { detail: response }));
                this.dispatchEvent(new CustomEvent('routes', { detail: { routes: response.routes }}));
            }, error => {
                this.currentRoutes = undefined;
                this.currentError = error;
                this.dispatchEvent(new CustomEvent('error', { detail: error }));
                throw error;
            });
        } else {
            console.warn(this.id, "doesn't have all request data");
        }
    }
}


/**
 * Router Request class.
 */
class Request {
    /**
     * create instance.
     * @param {{start:Location, dest:Location, time:Date, others:Object}} options - xxx
     **/
    constructor(router, start, dest, time, others={}) {
        /** @type {BaseRouter} */
        this.router = router;
        /** @type {Location} */
        this.start = start;
        /** @type {Location} */
        this.dest = dest;
        /** @type {Date} */
        this.time = time;

        Object.assign(this, others);
    }
}


/**
 * Router Response class.
 * @param {Request} request - related request.
 * @param {string} inDirPath - root directory path.
 * @private
 */
class Response {
    /**
     * create instance.
     * @param {Request} request - related request.
     * @param {string} routes - root directory path.
     * @param {Array<Route>} routes - response routes
     */
    constructor(request, ...routes) {
        /** @type {Request} */
        this.request = request;
        /** @type {Array<Route>} */
        this.routes = routes;
    }
}


/**
 * generic Location object
 */
class Location {
    /**
     * this is object destructuring.
     * @param {Object} param - this is object param.
     * @param {number} param.foo - this is property param.
     * @param {string} param.bar - this is property param.
     */
    /**
     * create instance.
     * @param {{lat:float, lng:float, ?lon:float}} param
     * @param {float} param.lng - latitude
     * @param {float} param.lng - longitude
     * @param {float} [param.lon] - alias for longitude (will be used when not given .lng)
     **/
     constructor({lat, lng, lon}) {
        /** @type {float} */
        this.lat  = lat;
        /** @type {float} */
        this.lng  = lng || lon;
        /** @type {string} */
        this.type = "location";
    }

    /**
     * Alias for {@link Location.lng}
     * @type {float}
     */
    get lon() { return this.lng; }
}


/**
 * generic Address object
 */
class Address extends Location {
    /**
     * create instance.
     * @param {{lat:float,lng:float,name:string}} object
     **/
    constructor({lat, lng, lon, name, time}) {
        super({lat:lat,lng:lng,lon:lon});

        this.type = "address";

        this._name = name;
        /** @type {Date} */
        this.time = time;
    }

    /**
     * Returns {name} or Address.
     * @type {string}
     */
    get name() { return this._name || [this.lat, this.lon].map(val => Math.round(val, 2)).join(","); }

    /**
     * Returns the date as HH:MM
     * @type {string}
     */
    get timeString() { return this.time.getHours() + ":" + ("0"+this.time.getMinutes()).slice(-2); }
}

/**
 * Returns Address object if not already Address.
 * @param {object|Address} addr
 * @return {Address} addr as Address
 */
Address.enforce = (addr) => (addr instanceof Address) ? addr : new Address(addr);


/**
 * generic Stop object
 */
class Stop extends Address {
    constructor(data) {
        super(data);
        /** @type {string} */
        this.type = "location";
        /** @type {string} */
        self.id     = data.id;
        /**
         * data source of this stop
         * @type {object}
         */
        self.source = data.source;
    }
}


/**
 * Transport object for {@link Leg}
 */
class Transport {
    /**
     * create instance.
     * @param {{type:string,name:string,color:string}} params - foo
     */
    constructor({type, name, color}) {
        this.type = type;
        this.name = name;
        this.color = color;
    }
}


class Route {
    constructor(uid, router, departure, arrival, legs=[]) {
        this.uid = uid;
        this.router = router;
        this.departure = departure;
        this.arrival = arrival;
        this.legs = legs;
    }

    get duration() {
        const FOO = [[60*60*1000, "hr", "hrs"], [60*1000, "min", "mins"], [1000, "sec", "secs"]];
        let ms = this.arrival.time - this.departure.time;
        let parts = [];
        for (let [factor, sn, pl] of FOO) {
            let val = Math.floor(ms/factor);
            if (val) {
                let unit = val==1 ? sn : pl;
                parts.push(`${val} ${unit}`);
                ms -= val * factor;
            }
        }
        return parts.join(" ");
    }
}


class Leg {
    /*
        - start     -> RouterLocation object
        - end       -> RouterLocation object
        - duration  ->
        - distance  ->
        - geometry  -> [[y,x], ...]
        - transport -> Transport object
    */
    constructor(departure, arrival, transport, geometry=[]) {
        this.departure = departure;
        this.arrival = arrival;
        this.transport = transport;
        this.geometry = geometry;
    }
}


function parseCoordString(s) {
    if (!s) return null;
    var coords = s.split(",").map(parseFloat);
    return { lat: coords[1], lng: coords[0], }
}


function findRootElement(node, elId, Element) {
    // return specified node
    if (elId) return document.querySelector(elId);
    // return when it's a parent (nesting)
    while (node = node.parentNode) {
        if (node instanceof Element) return node;
    }
    // last option .. global search
    console.log(Element.tagName, document.querySelectorAll(Element.tagName));
    let nodes = document.querySelectorAll(Element.tagName);
    if (nodes.length == 1) return nodes[0];
    // nope
    throw `could not find node type "${Element.tagName}" (${node})`;
}


function parseString(markup, scope) {
    return new Function("return `" + markup + "`").call(scope);
}


function loadScript(...srcs) {
    return Promise.all(srcs.map(src => new Promise((resolve, reject) => {
//        console.warn("sync loading:", src);
        let script = document.createElement('script');
//        script.onreadystatechange = function() {
//            console.log(src, script.readyState);
//        };
        script.onload = function() {
//            console.info("loaded:", src);
            resolve();
        }
        script.type = "text/javascript";
        script.src = src;
//        script.async = false;
        document.head.append(script);
    })));
}


function loadStyle(...hrefs) {
    return Promise.all(hrefs.map(href => new Promise((resolve, reject) => {
        let link = document.createElement('link');
        link.rel  = 'stylesheet';
        link.type = 'text/css';
        link.href = href;
        link.media = 'all';
        document.head.append(link);
        resolve();
    })));
}


export {BaseRouter, Request, Response, Route, Leg, Transport, Address, Stop, parseCoordString, findRootElement, parseString, loadScript, loadStyle}
