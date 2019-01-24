import {RouteSource} from './map/mixins.js';

/**
 * Base class element for building custom router elements (e.g. {@link HereTransitRouter}).
 *
 * @extends {RouteSource}
 *
 * @abstract
 */
class BaseRouter extends RouteSource(HTMLElement) {
    /**
     * Type of the router - `abstract` for this router.
     * @const
     * @type {string}
     */
    get type() { return 'abstract'; }

    /** @protected */
    constructor() {
        super();

        /**
         * Type of the router.
         * @deprecated Use .name or .type instead
         * @type {string}
         */
        this.id = this.getAttribute("id") || this.tagName;

        /**
         * The name of the router. It's the content of the `name="xyz"` attribute or the `.type` property.
         * @type {string}
         */
        this.name = this.getAttribute("name") || this.type;

        /**
         * The current multiboard request.
         * @type {MultiboardRequest|null}
         */
        this.multiboardRequest = null;

        /**
         * The current multiboard response.
         * @type {MultiboardResponse|null}
         */
        this.multiboardResponse = null;
    }

    // return myself
    getRouter() {
        return Promise.resolve(this);
    }

    /**
     * Creates a route request
     * @return {RouteRequest}
     */
    buildRouteRequest(start, dest, time, others={}) {
        return new RouteRequest(
                this,
                parseCoordString(start),
                parseCoordString(dest),
                parseTimeString(time || new Date()),
                others
            );
    }

    /**
     * Performs a route request
     * @abstract
     * @param {RouteRequest} request
     * @return {Promise<RouteResponse>}
     */
    async execRouteRequest(request) {
        throw "abstract / implement in subclass";
    }

    /**
     * @deprecated - Use `.setRoute(start, dest, time)` instead (from SetRouteMixin).
     * @fires GenericRouter#request
     * @fires GenericRouter#response
     */
    update({start, dest, time}={}) {
        console.warn("DEPRECATED - use .setRoute(start, dest, time) instead (from SetRouteMixin).");
        this.setRoute(start, dest, time);
//        return this.updateRoute({start:start, dest:dest, time:time});
    }
/*
    updateRoute({start, dest, time}={}) {
        if (start) this.start = start;
        if (dest) this.dest = dest;
        if (time) this.time = time;

        // perform request if possivle
        if (this.start || this.dest || this.time) {
            if (this.start && this.dest) {
                let request = this.buildRouteRequest(this.start, this.dest, this.time || new Date());
                this.currentRequest = this.routeRequest = request;
                this.currentResponse = this.routeResponse = undefined;
                this.dispatchEvent(new CustomEvent('request', { detail: request }));
                this.setItems([], request);
                let progress = (response) => this.dispatchEvent(new CustomEvent('route-response-intermediate', { detail: response }));
                return (request.error ? Promise.reject(request.error) : request.router.execRouteRequest(request, progress)).catch(error => {
                    return new RouteResponse(request).setError(error);
                }).then(response => {
                    this.currentResponse = this.routeResponse = response;
                    this.currentRoutes = this.routes = response.routes;
                    this.dispatchEvent(new CustomEvent('response', { detail: response }));
                    this.dispatchEvent(new CustomEvent('routes', { detail: { routes: response.routes }}));
                    this.setItems(response.routes, request, response);
                });
            } else {
                console.warn(this, "doesn't have all request data");
            }
        }
    }
*/
    async board(location, time=undefined) {
    }

    buildBoardRequest(location, time=undefined) {
    }

    async execBoardRequest(boardRequest) {
    }



    /**
     * Performs an multiboard request.
     * @param {Location|CoordinateString} center
     * @param {Date|TimeString|null} [time]
     * @return {Promise<MultiboardResponse>}
     */
    async multiboard(center, time=undefined) {
        let request = this.buildMultiboardRequest(location, time);
        return (request.error ? Promise.reject(request.error) : request.router.execMultiboardRequest(request)).catch(error => {
            return request.fail(error);
        });
    }

    /**
     * Builds an multiboard request.
     * @param {Location|CoordinateString} center - The center to find stops.
     * @param {Date|TimeString|null} [time]
     * @param {?Object} [others]
     * @return {MultiboardRequest}
     */
    buildMultiboardRequest(center, time=null, others={}) {
        return new MultiboardRequest(this, parseCoordString(center), parseTimeString(time) || new Date(), others);
    }

    /**
     * Executes an multiboard request.
     * @abstract
     * @param {MultiboardRequest} request
     * @return {Promise<MultiboardResponse|Error>}
     */
    async execMultiboardRequest(request) {
        throw "abstract / implement in subclass"
    }


/*
    static get observedAttributes() { return ["start", "dest", "time"]; }

    attributeChangedCallback(name, oldValue, newValue) {
        let args = {};
        args[name] = newValue;
        this.update(args);
    }
*/
}


/**
 * Router Request class.
 */
class Request {
    /**
     * create instance.
     * @param {BaseRouter} router - The router used for this request.
     * @param {Object} [options={}) - Additional options to be used.
     **/
    constructor(router, options={}) {
        Object.assign(this, options);

        /** @type {BaseRouter} */
        this.router = router;

        /**
         * Holds the request status
         * @type {*|null}
         */
        this.error = null;
    }

    /**
     * Marks this request failed
     * @deprecated use .fail(error) instead
     * @param {*} error - The failure.
     * @returns {Request} - this instance
     */
    setError(error) {
        return this.fail(error);
    }

    /**
     * Marks this request failed
     * @param {*} error - The failure.
     * @returns {Request} - this instance
     */
    fail(error) {
        this.error = error;
        return this;
    }

    /**
     * Resolves the request with optional payload. The .elapsed property is available afterwards.
     * @abstract
     * @param {object} [payload] - The payload of the success.
     * @returns {Request} - This instance.
     */
    resolve(payload={}) {
        this.elapsed = (new Date() - this._constructTime) / 1000;
        Object.assign(this, payload);
        return this;
    }
}


/**
 * route request class
 */
class RouteRequest extends Request {
    get type() { return "route"; }

    /**
     * create instance.
     * @param {{router:BaseRouter, start:Location, dest:Location, time:Date, others:Object}} options - xxx
     **/
    constructor(router, start, dest, time, others={}) {
        super(router, others);
        /** @type {Location} */
        this.start = start;
        /** @type {Location} */
        this.dest = dest;
        /** @type {Date} */
        this.time = time;
    }
}


/**
 * Data class for requesting transit board
 * @see fooo
 */
class BoardRequest extends Request {
    get type() { return "board"; }
}


/**
 * Data class for requesting transit board
 * @see fooo
 */
class MultiboardRequest extends Request {
    get type() { return "multiboard"; }

    /**
     * create instance.
     * @param {{center:Location, time:Date, others:Object}} options - xxx
     **/
    constructor(router, center, time, others={}) {
        super(router, others);
        /** @type {Location} */
        this.center = center;
        /** @type {Date} */
        this.time = time;
    }
}


/**
 * Router Response class.
 */
class Response {
    /**
     * create instance.
     * @param {Request} request - related request.
     */
    constructor(request) {
        /** @type {Request} */
        this.request = request;
        /** @type {Object} */
        this.error = undefined;
        /**
         * Contains elapsed time in seconds for this request.
         * @type {float|null}
         */
        this.elapsed = null;

        this._constructTime = new Date();
    }

    /**
     * @deprecated
     */
    setError(error) {
        console.warn("DEPRECATED: Response.setError() - use .fail() instead");
        return this.fail(error);
    }

    fail(error) {
        this.elapsed = (new Date() - this._constructTime) / 1000;
        this.error = error;
        return this;
    }

    resolve(payload={}) {
        this.elapsed = (new Date() - this._constructTime) / 1000;
        Object.assign(this, payload);
        return this;
    }
}


class RouteResponse extends Response {
    get type() { return "route"; }

    /**
     * create instance.
     * @param {Request} request - related request.
     */
    constructor(request) {
        super(request);
        /** @type {Array<Route>} */
        this.routes = [];
    }

    /**
     * Marks the response as finish and assigns routes.
     * @deprecated
     * @param {Array<Route>} routes
     * @returns {RouteResponse}
     */
    setRoutes(routes) {
        console.warn("DEPRECATED: RouteResponse.setRoutes() - use .resolve() instead");
        return this.resolve(routes);
    }

    /**
     * Marks the response as finish and assigns routes.
     * @param {Array<Route>} routes
     * @returns {RouteResponse}
     */
    resolve(routes) {
        return super.resolve({routes: routes});
    }
}


class BoardResponse extends Response {
    get type() { return "board"; }
}


class MultiboardResponse extends Response {
    get type() { return "multiboard"; }

    /** @private */
    constructor(request) {
        super(request)
        /** @type {Array<DepartureStop>} */
        this.stops = [];
    }

    /**
     * Resolve the request.
     * @param {DepartureStop[]} stops - The stops with departures.
     * @returns {MultiboardRequest} - This instance.
     */
    resolve(stops) {
        return super.resolve({stops:stops});
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

        this.name = name;
        /** @type {Date} */
        this.time = time;
    }

    /**
     * Returns {name} or Address.
     * @type {string}
     */
    get title() { return this.name || [this.lat, this.lon].map(val => Math.round(val, 2)).join(","); }

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
        this.type = "stop";

        /** @type {string} */
        this.id     = data.id;

        /** @type {string} */
        this.platform = data.platform;
        /**
         * data source of this stop
         * @type {object}
         */
        this.source = data.source;
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
     * @param {{id:string,distance:number,summary:string,steps:Location[]}} params - Optional parameters.
     */
    constructor(departure, arrival, transport, geometry=[], {id,distance,summary,steps}={}) {
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
        /** @type {location[]} */
        this.steps = steps || [];
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
        this.steps = this.steps.concat([other.departure]).concat(other.steps);
//        this.steps = this.steps.conat([other.departure]).concat(other.steps);
    }
}


class Departure {
    constructor({time, platform, transport}={}) {
        this.time = time;
        this.platform = platform;
        this.transport = transport;
    }
}


class DepartureStop extends Stop {
    constructor(data) {
        super(data);
        this.departures;
        this.router;
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
 * @typedef {string<lat,lng>} CoordinateString
 * @example
 * <router start="13.5,52.5" ...>
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
 * @param {CoordinateString} s - A string like `"52.432,13.254"`
 * @returns {Object} - The object representation.
 */
function parseCoordString(s) {
    if (typeof s === 'string' || s instanceof String) {
        let [lng, lat, name] = s.split(",").map((val, i) => i<2 ? parseFloat(val) : val.trim());
        if (isNaN(lng) || isNaN(lat)) throw new Error(`Could not parse coord-str: ${s}`);
        return { lat, lng, name }
    }
    return Address.enforce(s);
}


function parseTimeString(s) {
    if (!s) return null;
    let time = new Date(s);
    return isNaN(time) ? s : time;
}


/**
 * Find a DOMElement. It has various ways:
 * - try finding {@link DOMNode} by {@link DOMSelector} including a class check
 * - iterate over parent-nodes to find a {@link DOMNode} of the specified class
 * - find a {@link DOMNode} by querying by tag-name. Fails if not exactly one node found.
 * - return default if specified or throw error.
 *
 * @deprecated Use qs(), qp() and whenElementReady() from '../mc/utils.js' instead.
 * @param {DOMNode} node - The node to start lookup.
 * @param {DOMSelector|undefined} selector - The dom selector to find the element.
 * @param {HTMLElement} Element - The required type.
 * @param {Object|string|number} [defaultValue] - Returned value if not found. NEED TO BE DIFFERENT THAN `undefined`!!
 * @return {DOMNode|undefined} - The node or undefined if not found.
 * @throws Exception when no {DOMNode} was found and no defaultValue was provided.
 */
function findRootElement(node, selector, Element, defaultValue=undefined) {
    console.warn('.findRootElement() is deprecated - use qs() and whenElementReady() from `mc/utils.js`');
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

function buildURIParams(params) {
    let s = Object.entries(params || {})
        .filter(([ley, value]) => (value !== undefined) && (value !== null))
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join("&").replace(/%(?:2C|3A|7C|60|5E)/g, unescape);
    return s ? "?" + s : "";
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
 * Create a Promise that can be resolved later.
 * @return {Promise}
 */
function deferredPromise() {
    let _resolve, _reject;
    let promise = new Promise((resolve, reject) => [_resolve, _reject] = [resolve, reject]);
    promise.resolve = _resolve;
    promise.reject = _reject;
    return promise;
}


/**
 * Loads scripts asyncronously
 * @async
 * @param {...SRC} srcs - Sourcs to load.
 * @return {Promise<DOMNode[]|Error>}
 */
function loadScript(...srcs) {
    return Promise.all(srcs.map(src => new Promise((resolve, reject) => {
        let script = document.createElement('script');
        script.onload = function() {
            resolve(script);
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
 * @return {Promise<DOMNode[]|Error>}
 */
function loadStyle(...hrefs) {
    return Promise.all(hrefs.map(href => new Promise((resolve, reject) => {
        let link = document.createElement('link');
        link.rel  = 'stylesheet';
        link.type = 'text/css';
        link.href = href;
        link.media = 'all';
        document.head.append(link);
        resolve(link);
    })));
}


export {
    BaseRouter,
    Request, Response,
    RouteRequest, RouteResponse,
    BoardRequest, BoardResponse,
    MultiboardRequest, MultiboardResponse,
    Route, Leg, Transport, Address, Stop, Departure, DepartureStop,
    parseCoordString, parseTimeString, findRootElement, buildURI, buildURIParams, deferredPromise, parseString, createUID,
    loadScript, loadStyle
}
