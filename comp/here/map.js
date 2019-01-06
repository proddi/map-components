import {parseCoordString, loadScript} from '../generics.js';


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
    constructor() {
        super();

        var center = parseCoordString(this.getAttribute("center"));
        var zoom   = this.getAttribute("zoom");

        let platform = document.querySelector(this.getAttribute("platform"));

        /** @type {Promise<{map:H.Map, behavior: H.mapevents.Behavior, platform:H.service.Platform, maptypes:object}>} */
        this.whenReady = platform.whenReady.then(({platform, maptypes}) => {
            let map = new H.Map(this, maptypes.terrain.map, {
                center: center,
                zoom: zoom,
                margin: 150,
                renderBaseBackground: {lower: 1, higher: 1},
    //            pixelRatio: pixelRatio
            });

            // add behavior
            let mapevents = new H.mapevents.MapEvents(map);
            let behavior = new H.mapevents.Behavior(mapevents);

            // add resize support
            window.addEventListener('resize', function() { map.getViewPort().resize(); });

            let ui = new H.ui.UI(map, {});
//            this.map = map;
            return Promise.resolve({map:map, behavior:behavior, platform:platform, maptypes:maptypes});
        });
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
