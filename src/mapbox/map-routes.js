import {findRootElement} from '../generics.js';


class MapboxMapRoutes extends HTMLElement {
    constructor() {
        super();
        this._routes = {}
    }

    connectedCallback() {
        let mapComp = findRootElement(this, this.getAttribute("map"), customElements.get("mapbox-map"));
        let router = document.querySelector(this.getAttribute("router"));
        let styler = document.querySelector(this.getAttribute("styler"));

        mapComp.whenReady.then(({L, map}) => {
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
                        let state = styles[id].length > 0 ? styles[id][styles[id].length-1] : "passive";
                        this._applyRouteStyleUi(this._routes[id], state);
                    }
                });
            }
            router.currentRoutes && this.addRoutes(map, router.currentRoutes);
        });
        this._router = router;
    }

    clearRoutes(map) {
        for (let route_id in this._routes) {
            for (let uiPair of this._routes[route_id][1]) {
                uiPair.forEach(ui => map.removeLayer(ui));
            }
        }
        this._routes = {};
    }

    addRoutes(map, routes, style=undefined) {
        for (let route of routes) {
            this.addRoute(map, route, style);
        }
    }

    addRoute(map, route, styles=undefined) {
        console.log(route);
        let uis = route.legs.map(leg => this._buildLeg(leg));
        for (let uipair of uis) uipair.forEach(ui => ui.addTo(map));
        this._routes[route.uid] = [route, uis];
    }

    _buildLeg(leg) {
        let path = [[leg.departure.lat, leg.departure.lng]].concat(leg.geometry).concat([[leg.arrival.lat, leg.arrival.lng]]);
        let style = buildLegStyle(leg, "passive");
        return [
            L.polyline(path, cycleStyle(style, "outline")),
            L.polyline(path, cycleStyle(style, "inline"))
        ];
    }

//    _applyRouteStyle(route, styleName) {
//        this._applyRouteStyleUi(this._routes[route.uid], styleName);
//    }

    _applyRouteStyleUi([route, uis], state) {
        route.legs.forEach((leg, index) => {
            let transport = leg.transport;
            let [uiOutline, uiInline] = uis[index];
            let style = buildLegStyle(leg, state);

            if (state === "passive") {
                uiInline.bringToBack();
                uiOutline.bringToBack();
            }

            if (state === "selected") {
                uiOutline.bringToFront();
                uiInline.bringToFront();
            }

            uiInline.setStyle(cycleStyle(style, "inline"));
//            style.front && uiInline.bringToFront();
//            style.back && uiInline.bringToBack();
            uiOutline.setStyle(cycleStyle(style, "outline"));
//            style.front && uiOutline.bringToFront();
//            style.back && uiOutline.bringToBack();
        });
    }
}


function mergeColor(color, merging, weight) {
    if (!color.startsWith("#") || !merging.startsWith("#")) return color;

    let _merge = [1,3,5].map(ofs => merging.slice(ofs, ofs+2))               // hex pieces
                        .map(hex => parseInt(hex, 16));                    // to dec

    return "#" +  [1,3,5].map(ofs => color.slice(ofs, ofs+2))               // hex pieces
                         .map(hex => parseInt(hex, 16))                     // to dec and add delta
                         .map((val, idx) => val+(_merge[idx]-val)*weight)        // apply limits
                         .map(val => ("0" + Math.round(val).toString(16)).slice(-2))    // to hex
                         .join("");
}


function mergeWithColor(color, weight) {
    return function(prev) {
        if (!prev) return color;
        return mergeColor(prev, color, weight);
    }
}

const TRANSPORT_STYLES = {
    default:    {},
    walk:       { dash: [3, 10], },
}

const STATE_STYLES = {
    default:    { width: 5, border: 2, },
    passive:    { color: mergeWithColor("#cccccc", .9), outline: mergeWithColor("#888888", .4), width: 5, border: 2, back: true, },
    selected:   { color: mergeWithColor("#cccccc", .2), outline: mergeWithColor("#444444", .4), width: 6, border: 4, front: true, },
    highlighted:{ color: mergeWithColor("#cccccc", .6), outline: mergeWithColor("#666666", .4), width: 5, border: 3, front: true, },
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


function buildLegStyle(leg, state) {
    let transport = leg.transport;
    return combineStyles(
        { color: transport.color || "#888888", outline: transport.color || "#888888", lineJoin: "round", },   // color layer
        TRANSPORT_STYLES[transport.type] || TRANSPORT_STYLES.default,
        STATE_STYLES[state] || STATE_STYLES.default,
    );
}

function cycleStyle(style, cycle) {
    if (cycle === "outline") {
        return {
            color: style.outline,
            weight: style.width + style.border,
            opacity: style.opacity,
            lineJoin: style.lineJoin,
            dashArray: style.dash,
        };
    } else if (cycle === "inline") {
        return {
            color: style.color,
            weight: style.width,
            opacity: style.opacity,
            lineJoin: style.lineJoin,
            dashArray: style.dash,
        }
    }
    return style;
};


customElements.define("mapbox-map-routes", MapboxMapRoutes);


export { MapboxMapRoutes }
