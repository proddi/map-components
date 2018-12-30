import {findRootElement} from '../generics.js';


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

const _ROUTE_STYLES = {
    "selected": {
        default:    [{ strokeColor: "black",  lineWidth: 7 }, { strokeColor: "white",  lineWidth: 5, x:1 }],
//            "walk":     [{ strokeColor: "black",  lineWidth: 3, lineDash: [3, 6] }, {}],
//            "bus":      [{ strokeColor: "purple", lineWidth: 3 }, {}],
//            "bus":      [{ strokeColor: "white"  }, { strokeColor: "purple" }],   // sbahn
//            "metro":    [{ strokeColor: "#222266" }, { strokeColor: "#8888FF" }],   // sbahn
//            "subway":   [{ strokeColor: "brown",  lineWidth: 6 }, {}],   // ubahn
//            "train":    [{ strokeColor: "red",    lineWidth: 8 }, {}],   // train
    },
    "passive": {
        default:    [{ strokeColor: "#888888", lineWidth: 7 }, { strokeColor: "#cccccc", lineWidth: 5 }],
        "walk":     [{ strokeColor: "#888888",  lineWidth: 7, lineDash: [3, 10] }, { strokeColor: "#cccccc",  lineWidth: 5, lineDash: [3, 10] }],
        "bus":      [{ strokeColor: "#804080", lineWidth: 7 }, { strokeColor: "#a36aa3",   lineWidth: 5 }],
    },
    "highlighed": {
        default:    [{ strokeColor: addToColor(-16), lineWidth: 8 }, { strokeColor: addToColor(16), l_ineWidth: 4 }],
    },
}

const _ROUTE_ZINDICES = {
    "passive": 0,
    "selected": 10,
    "highlighed": 5,
}

class HereMapRoutes extends HTMLElement {
    constructor() {
        super();
        this._routeUi = {}
    }

    connectedCallback() {
        let mapComp = findRootElement(this, this.getAttribute("map"), customElements.get("here-map"));
        let router = document.querySelector(this.getAttribute("router"));

        mapComp.whenReady.then(({map}) => {
            router.addEventListener("request", (ev) => {
                this.clearRoutes(map);
            });
            router.addEventListener("routes", (ev) => {
                this.addRoutes(map, ev.detail.routes);
            });
            router.addEventListener("styles", (ev) => {
                let styles = ev.detail;
                for (let id in styles) {
                    this._applyRouteStyleUi(this._routeUi[id], styles[id]);
                }
            });

            router.currentRoutes && this.addRoutes(map, router.currentRoutes);
        });
        this._router = router;
    }

    clearRoutes(map) {
        for (let id in this._routeUi) {
            map.removeObject(this._routeUi[id]);
        }
        this._routeUi = {};
    }

    addRoutes(map, routes, style=undefined) {
        for (let route of routes) {
            this.showRoute(map, route, style);
        }
    }

    showRoute(map, route, styles=undefined) {
        let ui = new H.map.Group();
        for (let leg of route.legs) {
            this._addLegUI(ui, leg);
        }
        this._routeUi[route.uid] = ui;
        this._applyRouteStyleUi(ui, styles);
        map.addObject(ui);
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

    _applyRouteStyle(route, styleName) {
        this._applyRouteStyleUi(this._routeUi[route.uid], styleName);
    }

    _applyRouteStyleUi(uiRoot, styleNames) {
        styleNames = ["passive"].concat(styleNames || []);
        let zIndex = styleNames.map(name => _ROUTE_ZINDICES[name]).reduce((prev, val) => Math.max(prev, val), 0);
        uiRoot.setZIndex(zIndex);
        uiRoot.getObjects().forEach((ui, index) => {
            index = index % 2;
            let leg = ui.getData();
            let type = leg.transport.type;
            let style = this._combineStyles(
                styleNames.map(
                    setName => _ROUTE_STYLES[setName][type] || _ROUTE_STYLES[setName].default
                ).map(pair => pair[index])
            );
            if (style.x && leg.transport.color) style.strokeColor = leg.transport.color;
            ui.setStyle(style);
        });
    }

    _combineStyles(styles) {
        let result = {};
        for (let style of styles) {
            for (let key in style) {
                let value = style[key];
                result[key] = value.call ? style[key](result[key]) : value;
            }
        }
        return result;
    }

}


customElements.define("here-map-routes", HereMapRoutes);


export { HereMapRoutes }
