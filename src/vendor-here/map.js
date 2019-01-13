"use strict";
import {parseCoordString, findRootElement, deferredPromise} from '../generics.js';
import {HerePlatform} from './platform.js';


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
class HereMap extends HTMLElement {
    /** @private */
    constructor() {
        super();
        this.center = parseCoordString(this.getAttribute("center"));
        this.zoom = this.getAttribute("zoom");
        /**
         * Defined padding when map is focusing on routes.
         * @type{Array<top,right,bottom,left>}
         */
        this.viewPadding = (this.getAttribute("view-padding") || "0 0 0 0")
                .split(" ")
                .map(str => str ? parseInt(str) : 0)

        /** @type {HerePlatform */
        this.platform = findRootElement(this, this.getAttribute("platform"), HerePlatform);
        /** @type {Promise<{map:H.Map, behavior: H.mapevents.Behavior, platform:H.service.Platform, maptypes:object}|Error>} */
        this.whenReady = deferredPromise();
    }

    /** @private */
    connectedCallback() {
        this.platform.whenReady.then(({platform, maptypes}) => {
            let map = new H.Map(this, maptypes.terrain.map, {
                center: this.center,
                zoom: this.zoom,
                margin: 150,
                renderBaseBackground: {lower: 1, higher: 1},
    //            pixelRatio: pixelRatio
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

            // add resize support
            window.addEventListener('resize', function() { map.getViewPort().resize(); });

            let ui = new H.ui.UI(map, {});

            this.whenReady.resolve({map:map, behavior:behavior, platform:platform, maptypes:maptypes});
        }).catch(error => this.whenReady.reject(error));
    }
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
