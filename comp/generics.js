/**
 * Base class element for building custom router elements (e.g. {@link HereTransitRouter}).
 *
 * @abstract
 */
class BaseRouter extends HTMLElement {
//    static getType() { return "abstract"; };

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
        /** @type {string} */
        this.name   = this.getAttribute("name") || this.type;
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
            this.update(this.start, this.dest, this.time);
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

        this._constructTime = new Date();
    }

    /**
     * Calculates current elapsed time in seconds
     * @return {float} - seconds elapsed
     */
    _elapsedTime() {
        return (new Date() - this._constructTime) / 1000;
    }
}


/**
 * Router Response class.
 */
class Response {
    /**
     * create instance.
     * @param {Request} request - related request.
     * @param {Array<Route>} routes - response routes
     */
    constructor(request, ...routes) {
        /** @type {Request} */
        this.request = request;
        /** @type {Array<Route>} */
        this.routes = routes;
        /** @type {Object} */
        this.error = undefined;
        /** @type {float} */
        this.elapsed = request._elapsedTime();
//        console.log("Request took", this.elapsed, "secs:", this.request);
    }

    setError(error) {
        this.error = error;
        return this;
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
     * @param {{type:string,name:string,color:Color,headsign:string}} params - foo
     */
    constructor({type, name, color, headsign}) {
        /** @type {string} */
        this.type = type;
        /** @type {string} */
        this.name = name;
        /** @type {Color} */
        this.color = color;
        /** @type {string} */
        this.headsign = headsign;
    }

    isSame(other) { return this.type === other.type && this.name === other.name; }
}


class Route {
    constructor(id, router, departure, arrival, legs=[]) {
        /** @type {string} */
        this.id = id;
        /** @type {BaseRouter} */
        this.router = router;
        /** @type {Location} */
        this.departure = departure;
        /** @type {Location} */
        this.arrival = arrival;
        /** @type {Leg[]} */
        this.legs = legs;
    }

    /**
     * @deprecated use {Route#id} instead of this.
     * @type {string} */
    get uid() { return this.id; }

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
    /**
     * create instance.
     * @param {Location} departure - start location
     * @param {Location} arrival - dest location
     * @param {Transport} transport - transport definition
     * @param {CoordinatePair[]} [geometry] - the geometry points excluding start, dest
     * @param {{id:string,distance:number,summary:string}} params - Optional parameters.
     */
    constructor(departure, arrival, transport, geometry=[], {id,distance,summary}) {
        /** @type {string} */
        this.id = id;
        /** @type {Location} */
        this.departure = departure;
        /** @type {Location} */
        this.arrival = arrival;
        /** @type {Transport} */
        this.transport = transport;
        /** @type {CoordinatePair[]} */
        this.geometry = geometry;
        /** @type {number} */
        this.distance = distance;
        /** @type {string} */
        this.summary = summary;
    }

    /**
     * Extends this Leg with the `other` Leg
     * @param {Leg} other - The other Leg to be added.
     */
    extendLeg(other) {
        // TODO: check this.arrival == other.departure
        this.geometry.push([this.arrival.lat, this.arrival.lng]);
        this.geometry = this.geometry.concat(other.geometry);
        this.arrival = other.arrival;
        this.distance += other.distance;
    }
}

/**
 * @typedef {[lat:float, lng:float]} CoordinatePair
 * @example
 * let pair = [52.5, 13.2];
 */

/**
 * @typedef {string<#rrggbb>} Color
 * @example
 * let color = "#ccbbaa";
 */

/**
 * @external {HTMLElement} https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
 */

/**
 * @external {DOMNode} https://developer.mozilla.org/en-US/docs/Web/API/Element
 */

/**
 * @external {DOMSelector} https://developer.mozilla.org/en-US/docs/Learn/CSS/Introduction_to_CSS/Selectors
 */


/**
 * Return coordinate-object for coordinte-string
 * @param {string} s - A string like `"52.432,13.254"`
 * @returns {CoordinatePair} - The object representation.
 */
function parseCoordString(s) {
    if (!s) return null;
    var coords = s.split(",").map(parseFloat);
    return { lat: coords[1], lng: coords[0], }
}


/**
 * Find a DOMElement. It has various ways:
 * - try finding {@link DOMNode} by {@link DOMSelector} including a class check
 * - iterate over parent-nodes to find a {@link DOMNode} of the specified class
 * - find a {@link DOMNode} by querying by tag-name. Fails if not exactly one node found.
 * - return default if specified or throw error.
 *
 * @param {DOMNode} node - The node to start lookup.
 * @param {DOMSelector|undefined} selector - The dom selector to find the element.
 * @param {HTMLElement} Element - The required type.
 * @param {Object|string|number} [defaultValue] - Returned value if not found. NEED TO BE DIFFERENT THAN `undefined`!!
 * @return {DOMNode|undefined} - The node or undefined if not found.
 * @throws Exception when no {DOMNode} was found and no defaultValue was provided.
 */
function findRootElement(node, selector, Element, defaultValue=undefined) {
    let found;
    // return node by selector
    if (selector) {
        found = document.querySelectorAll(selector);
        if (found.length == 1) return verifyClass(found[0], Element, defaultValue);
        if (defaultValue !== undefined) return defaultValue;
        console.error("Reference in node", node, `(${selector}) points to ${found} and no default provided.`);
        throw `One reference target for ${node}(${selector}) is required but returned: ${found}`
    }

    // return when it's a parent (nesting)
    found = node;
    while (found = found.parentNode) {
        if (found instanceof Element) return found;
    }

    // last option .. global search
    found = document.querySelectorAll(Element.tagName);
    if (found.length == 1) return verifyClass(found[0], Element, defaultValue);

    // nope
    if (defaultValue !== undefined) return defaultValue;
    console.error("Fallback reference in node", node, `(${Element.tagName}) points to ${found} and no default provided.`);
    throw `Could not find node type "${Element.tagName}" (${node})`;
}


function verifyClass(instance, Klass, defaultValue, message="Check console!") {
    if (instance instanceof Klass) return instance;
    if (defaultValue !== undefined) return defaultValue;
    console.error(instance, "isn't of type", Klass, "Did you forget to include html-tag support?");
    throw message;
}

/**
 * Builds a URI from a base-url and params. Empty values gets filteres.
 * @param {string} url - Base url
 * @param {Object} params - Parameters to be encoded in the url.
 * @returns {string}
 */
function buildURI(url, params) {
    let p = Object.keys(params)
        .map(key => [key, params[key]])
        .filter(([ley, value]) => (value !== undefined) && (value !== null))
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`);
    return url + (p.length > 0 ? "?" + p.join("&") : "");
}


function parseString(markup, scope) {
    if (!markup) return markup;
    return new Function("return `" + markup + "`").call(scope);
}

/**
 * Creates a unique string-identifier
 * @param {string} [template] - The template for the identifier.
 * @param {string} [salt] - The salt.
 * @return {string} - The unique string identifier
 */
function createUID(template="uid-{uid}", salt="") {
    return (template
        .replace("{uid}", _uidCounter[template] = (_uidCounter[template] || 0) + 1)
        .replace("{salt}", salt));
}
const _uidCounter = {};


/**
 * Loads scripts asyncronously
 * @async
 * @param {...SRC} srcs - Sourcs to load.
 * @return {Promise<undefined[]|Error>}
 */
function loadScript(...srcs) {
    return Promise.all(srcs.map(src => new Promise((resolve, reject) => {
        let script = document.createElement('script');
        script.onload = function() {
            resolve();
        }
        script.type = "text/javascript";
        script.src = src;
        script.async = true;
        document.head.append(script);
    })));
}


/**
 * Loads styles asyncronously
 * @async
 * @param {...HREF} hrefs - Styles to load.
 * @return {Promise<undefined[]|Error>}
 */
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


export {
    BaseRouter,
    Request, Response, Route, Leg, Transport, Address, Stop,
    parseCoordString, findRootElement, buildURI, parseString, createUID,
    loadScript, loadStyle
}
