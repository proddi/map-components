import {HereMap} from './map.js';
import {findRootElement} from '../generics.js';
import {SelectedMixin} from '../map/mixins.js'


/*
function adoptColor(color, delta) {
    if (!color.startsWith("#")) return color;
    return "#" +  [1,3,5].map(ofs => color.slice(ofs, ofs+2))               // hex pieces
                         .map(hex => parseInt(hex, 16) + delta)             // to dec and add delta
                         .map(val => Math.min(255, Math.max(0, val)))       // apply limits
                         .map(val => ("0" + val.toString(16)).slice(-2))    // to hex
                         .join("");
}

function addToColor(delta) {
    return (color) => adoptColor(color, delta);
}


const _ROUTE_STYLES_OUTLINE = {
    name:           "outline",
    selected: {
        default:    { strokeColor: "#777777", lineWidth: 8 },
    },
    passive: {
        default:    { strokeColor: "#888888", lineWidth: 7 },
        walk:       { strokeColor: "#888888", lineWidth: 7, lineDash: [3, 10] },
        bus:        { strokeColor: "#804080", lineWidth: 7 },
    },
    highlighted: {
        default:    { strokeColor: "#666666", lineWidth: 8 },
//        default:    mergeColor("strokeColor", "#222222", .5, { lineWidth: 8 }),
//        default:    addToColor("strokeColor", -16, { strokeColor: addToColor(-16), lineWidth: 8 },
    },
}

const _ROUTE_STYLES = {
    name:           "line",
    selected: {
        default:    { strokeColor: "#dddddd", lineWidth: 5, x:1 },
//        default:    foo({ strokeColor: "#dddddd", lineWidth: 5, x:1 }),
//        metro:      { strokeColor: "red",    lineWidth: 5, x:1 },
    },
    passive: {
        default:    { strokeColor: "#cccccc", lineWidth: 5 },
//        walk:       { strokeColor: "#cccccc", lineWidth: 5, lineDash: [3, 10] },
//        bus:        { strokeColor: "#a36aa3", lineWidth: 5 },
    },
    highlighted: {
        default:    { strokeColor: "#dddddd", l_ineWidth: 4 },
    },
}
*/


class HereMapRoutes extends SelectedMixin(HTMLElement) {
    /** @private */
    constructor() {
        super();
        this._routeUi = {}
        this._routes = [];
        this._uiElements = [];
        this._map;
    }

    /** @private */
    connectedCallback() {
        let mapComp = findRootElement(this, this.getAttribute("map"), HereMap);
        let router = document.querySelector(this.getAttribute("router"));
        let styler = document.querySelector(this.getAttribute("styler"));

        mapComp.whenReady.then(({map}) => {
            this._map = map;
            /*
            router.addEventListener("request", (ev) => {
                this.clearRoutes(map);
            });
            router.addEventListener("routes", (ev) => {
                this.addRoutes(map, ev.detail.routes);
            });
            if (styler) {
                styler.addEventListener("styles", (ev) => {
                    let styles = ev.detail;
                    for (let id in styles) {
                        this._applyRouteStyleUi(this._routeUi[id], styles[id]);
                    }
                });
            }
            */
            this._routes && this.onItems(this._routes);
        });
        this._router = router;
        super.connectedCallback && super.connectedCallback();
    }

    _getUiForRoute(route) {
        return this._uiElements[this._routes.indexOf(route)];
    }

    onItems(routes) {
        if (!this._map) {
            this._routes = routes;
            return;
        }
        // remove old elements
        this._uiElements.forEach(obj => this._map.removeObject(obj))
        // set new scenario
        this._routes = routes;
        this._uiElements = routes.map(route => this.addRoute(route));
    }

    onItemSelected(route) {
        if (!this._map) {
            this._selectedRoute = route;
            return;
        }
        this._applyRouteStyleUi(this._getUiForRoute(route), "selected");
    }

    onItemDeselected(route) {
        if (!this._map) {
            this._selectedRoute = null;
            return;
        }
        this._applyRouteStyleUi(this._getUiForRoute(route));
    }

    onEmphasizedItem(route, accent, isSelected) {
        if (!this._map) return;
        if (isSelected) return;
        this._applyRouteStyleUi(this._getUiForRoute(route), accent);
    }

    addRoute(route) {
        let ui = new H.map.Group();
        for (let leg of route.legs) {
            this._addLegUI(ui, leg);
        }
        this._routeUi[route.uid] = ui;
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