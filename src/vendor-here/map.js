import {BaseMap} from '../mc/base-map.js';
import {parseCoordString, findRootElement, deferredPromise} from '../generics.js';
import {qs, qp, whenElementReady} from '../mc/utils.js';
import {HerePlatform} from './platform';

/**
 * Shows HERE map. This is the base canvas for other visualisation elements.
 * It requires a {@link HerePlatform} component to handle credentials.
 *
 * @example
 * <here-platform app-id="..." app-code="..."></here-platform>
 *
 * <here-map platform="here-platform" center="13.5,52.5" zoom="11">
 * </here-map>
 *
 * @see https://developer.here.com/documentation/maps/
 **/
class HereMap extends BaseMap {
    constructor() {
        super();

        /**
         * An entry point when the element is ready.
         * @deprecated Implement `customElements.whenDefined('here-map')` instead.
         * @type {Promise<{map:H.Map, behavior: H.mapevents.Behavior, platform:H.service.Platform, maptypes:object}|Error>} */
        this.whenReady = deferredPromise();

        this.center = parseCoordString(this.getAttribute("center"));
        this.zoom = this.getAttribute("zoom");
        /**
         * Defined padding when map is focusing on routes.
         * @type{Array<top,right,bottom,left>}
         */
        this.viewPadding = (this.getAttribute("view-padding") || "0 0 0 0")
                .split(" ")
                .map(str => str ? parseInt(str) : 0)

        /**
         * The reference to a `platform`-tag to handle credentials. Usually you put just one platform tag in your document and then it's automatically discovered.
         *
         * @example
         * <here-platform app-id="..." app-code="..."></here-platform>
         * <here-map platform="here-platform"></here-map>
         *
         * @type {HerePlatform|null}
         */
        this.platform = null; //findRootElement(this, this.getAttribute("platform"), HerePlatform);
        whenElementReady(qs(this.getAttribute("platform")) || qp(this, "here-platform") || qs("here-platform"))
            .then(platform => this.setPlatform(platform))
            .catch(err => console.error("Unable to attach <here-platform>:", err))
            ;

        /**
         * (Optional) An reference to a {@link History} element if you wanna enable browsers history rewriting.
         * @type {History|null}
         */
        this.history = null; //document.querySelector(this.getAttribute("history") || 'mc-history');
        whenElementReady(qs(this.getAttribute("history")) || qs("mc-history"))
            .then(history => this.setHistory(history))
            .catch(_ => {})  // ignore errors
            ;
    }


    setPlatform(platform) {
        console.assert(!this.platform, "Dynamic platforms not supported");

        console.assert(platform instanceof HerePlatform, "Reference isn't a valid <here-platform> node")

        this.platform = platform;

        this.platform.whenReady.then(({platform, maptypes}) => {
//            console.log("maptypes", maptypes);
            let {location, zoom} = decodeMapPosition(this.history && this.history.get('map'), {location:this.center,zoom:this.zoom});
            let map = this._map = new H.Map(this, maptypes.terrain.map, {
                center: location,
                zoom: zoom,
                renderBaseBackground: {lower: 1, higher: 1},
            });

            // add view-padding support
            map.oldSetViewBounds = map.setViewBounds;
            map.setViewBounds = (rect, anim) => {
                let center = rect.getCenter();
                let screenPt = map.geoToScreen(center);
                let newCenter1 = map.screenToGeo(screenPt.x-this.viewPadding[3], screenPt.y-this.viewPadding[2]);
                let newCenter2 = map.screenToGeo(screenPt.x+this.viewPadding[1], screenPt.y+this.viewPadding[0]);
                let top = newCenter2.lat - center.lat;
                let right = newCenter2.lng - center.lng;
                let bottom = newCenter1.lat - center.lat;
                let left = newCenter1.lng - center.lng;
                return map.oldSetViewBounds(new H.geo.Rect(rect.getTop() - top, rect.getLeft() + left, rect.getBottom() - bottom, rect.getRight() + right), anim);
            }

            // add behavior
            let mapevents = new H.mapevents.MapEvents(map);
            let behavior = new H.mapevents.Behavior(mapevents);

            map.addEventListener('mapviewchangeend', ev => {
                this.history && this.history.replace({
                        map: encodeMapPosition(map.getCenter(), map.getZoom()),
                        });
                this._viewLock = false;
            });

            // add resize support
            window.addEventListener('resize', function() { map.getViewPort().resize(); });

            let ui = new H.ui.UI(map, {});

            this.whenReady.resolve({map:map, behavior:behavior, platform:platform, maptypes:maptypes});
        }).catch(error => this.whenReady.reject(error));

//        super.connectedCallback && super.connectedCallback();
    }

    setHistory(history) {
        this.history = history;
    }

//    setViewBounds(bounds) {
//        this._map && this._map.setViewBounds(bounds, true);
//    }
}


function decodeMapPosition(s, default_={location:null, zoom:null}) {
    if (!s) return default_;
    let pieces = s.split(",");
    return {
        location: {
            lng: parseFloat(pieces[0]),
            lat: parseFloat(pieces[1]),
        },
        zoom: parseInt(pieces[2]),
    };
}

function encodeMapPosition(location, zoom) {
    return [location.lng.toPrecision(7), location.lat.toPrecision(7), zoom].join(",");
}


/**
 * @external {H.Map} https://developer.here.com/documentation/maps/topics_api/h-map.html
 */


/**
 * @external {H.service.Platform} https://developer.here.com/documentation/maps/topics_api/h-service-platform.html
 */


/**
 * @external {H.mapevents.Behavior} https://developer.here.com/documentation/maps/topics_api/h-mapevents-behavior.html
 */


customElements.define("here-map", HereMap);


export { HereMap }
