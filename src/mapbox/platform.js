import {loadScript, loadStyle, parseString} from '../generics.js';


// singleton: load mapbox javascript resources
const resources = Promise.all([
    loadScript("https://api.mapbox.com/mapbox.js/v3.1.1/mapbox.js"),
    loadStyle("https://api.mapbox.com/mapbox.js/v3.1.1/mapbox.css")
]);

/**
 * The platform element is required to handle credentials for HERE services.
 *
 * @example
 * <here-platform app-id="..." app-code="..."></here-platform>
 *
 * <here-map platform="here-platform" center="13.5,52.5" zoom="11">
 * </here-map>
 *
 * @see https://developer.here.com/documentation/maps/
 **/
class MapboxPlatform extends HTMLElement {
    constructor() {
        super();

        /** @type {Promise<{platform:H.service.Platform, maptypes:object}>} */
//        this.whenReady = loadResources(parseString(this.getAttribute("token"), window));

        this.whenReady = resources.then(_ => {
                L.mapbox.accessToken = parseString(this.getAttribute("token"), window);
                return {L:L};
            });
    }
}


/**
 * @external {L} https://www.mapbox.com/mapbox.js/api/v3.1.1/
 */


customElements.define("mapbox-platform", MapboxPlatform);


export { MapboxPlatform }
