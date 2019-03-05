import {HereMap} from './map.js';
import {qs, qp, whenElementReady} from '../mc/utils.js';
import {RouteObserver} from '../mc/mixins.js'

/**
 * @extends {RouteObserver}
 * @extends {HTMLElement}
 */
class HereMapRoutes extends RouteObserver(HTMLElement) {
    /** @private */
    constructor() {
        super();
        this._routes = [];
        this._uiElements = [];

        this._map = null;
        whenElementReady(qs(this.getAttribute("map")) || qp(this, "here-map"))
            .then(hereMap => this.setHereMap(hereMap))
            .catch(err => console.error("Unable to attach <here-map>:", err))
            ;
    }

    setHereMap(hereMap) {
        console.assert(!this._map, "Changing map isn't supported yet.");
        console.assert(hereMap instanceof HereMap);

        hereMap.whenReady.then(({map}) => {
            this._map = map;
            this._routes && this.onItems(this._routes);
        });
    }

    _getUiForRoute(route) {
        return this._uiElements[this._routes.indexOf(route)];
    }

    onRouteRequest(request) {
        this.onRouteClear();
    }

    onRouteResponse(response) {
        this.onItems(response.routes);
    }

    onRouteClear() {
        this.onItems([]);
    }

    onItems(routes) {
        if (!this._map) {
            this._routes = routes;
            return;
        }
        // remove old elements
        this._uiElements.forEach(obj => this._map.removeObject(obj));
        // set new scenario
        this._routes = routes;
        this._uiElements = routes.map(route => this.addRoute(route));
    }

    onRouteSelected(route) {
        if (!this._map) {
            this._selectedRoute = route;
            return;
        }
        this._applyRouteStyleUi(this._getUiForRoute(route), "selected");
    }

    onRouteDeselected(route) {
        if (!this._map) {
            this._selectedRoute = null;
            return;
        }
        this._applyRouteStyleUi(this._getUiForRoute(route));
    }

    onRouteEmphasized(route, accent, isSelected) {
        if (!this._map) return;
        if (isSelected) return;
        this._applyRouteStyleUi(this._getUiForRoute(route), accent);
    }

    addRoute(route) {
        let ui = new H.map.Group();
        for (let leg of route.legs) {
            this._addLegUI(ui, leg);
        }
        this._applyRouteStyleUi(ui);
        this._map.addObject(ui);
        return ui;
    }

    _addLegUI(uiRoot, leg) {
        let path = new H.geo.LineString();
        path.pushLatLngAlt(leg.departure.lat, leg.departure.lng);
        for (let point of leg.geometry) {
            path.pushLatLngAlt(point[0], point[1]);
        }
        path.pushLatLngAlt(leg.arrival.lat, leg.arrival.lng);

        uiRoot.addObject(new H.map.Polyline(path, { data: leg, }));
        uiRoot.addObject(new H.map.Polyline(path, { data: leg, }));
    }

    _applyRouteStyleUi(uiRoot, accent) {
        accent = accent || "passive";
        uiRoot.setZIndex(ROUTE_ZINDICES[accent] || 0);
        uiRoot.getObjects().forEach((ui, index) => {
            let cycle = ["outline", "inline"][index%2];
            let leg = ui.getData();
            let transport = leg.transport;
            let style = combineStyles(
                { color: transport.color || "#888888", outline: transport.color || "#888888", lineJoin: "round", },   // color layer
                TRANSPORT_STYLES[transport.type] || TRANSPORT_STYLES.default,
                STATE_STYLES[accent] || STATE_STYLES.default,
            );
            ui.setStyle(CYCLE_FINISHER[index%2](style));
        });
    }
}


const ROUTE_ZINDICES = {
    passive:     0,
    selected:    5,
    highlighted: 10,
}


function combineStyles(...styles) {
    return styles.reduce((style, add) => {
        let computed = {};
        for (let key in add) {
            let val = add[key];
            computed[key] = val.call ? val(style[key]) : val;
        }
        return Object.assign({}, style, computed);
    }, {});
}

const TRANSPORT_STYLES = {
    default:    {},
    walk:       { dash: [3, 10], },
}

const STATE_STYLES = {
    default:    { width: 5, border: 2, },
    passive:    { color: mergeWithColor("#cccccc", .9), outline: mergeWithColor("#888888", .4), width: 5, border: 2, },
    selected:   { color: mergeWithColor("#cccccc", .2), outline: mergeWithColor("#444444", .4), width: 5, border: 3, },
    highlighted:{ color: mergeWithColor("#cccccc", .6), outline: mergeWithColor("#666666", .4), width: 5, border: 3, },
}

const CYCLE_FINISHER = [
    function(style) {  // outline
        style.lineWidth = (style.width || 0) + (style.border || 0);
        style.strokeColor = style.outline;
        return style;
    },
    function(style) {  // inline
        style.lineWidth = style.width;
        style.strokeColor = style.color;
        return style;
    },
];



function mergeWithColor(color, weight) {
    return function(prev) {
        if (!prev) return color;
        return mergeColor(prev, color, weight);
    }
}


function mergeColor(color, merging, weight) {
    if (!color.startsWith("#") || !merging.startsWith("#")) return color;

    let _merge = [1,3,5].map(ofs => merging.slice(ofs, ofs+2))                        // hex pieces
                        .map(hex => parseInt(hex, 16));                               // to dec

    return "#" +  [1,3,5].map(ofs => color.slice(ofs, ofs+2))                         // hex pieces
                         .map(hex => parseInt(hex, 16))                               // to dec and add delta
                         .map((val, idx) => val+(_merge[idx]-val)*weight)             // apply limits
                         .map(val => ("0" + Math.round(val).toString(16)).slice(-2))  // to hex
                         .join("");
}


customElements.define("here-map-routes", HereMapRoutes);


export { HereMapRoutes }
