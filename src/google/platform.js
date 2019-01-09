import {loadScript, parseString} from '../generics.js';


/**
 * The platform element is required to handle credentials for GOOGLE services.
 *
 * @example
 * <google-platform key="..."></google-platform>
 *
 * <google-router platform="google-platform"
 *      start="lat,lon"
 *      dest="lat,lon">
 * </google-router>
 *
 * @see https://developers.google.com/maps/documentation/
 **/
class GooglePlatform extends HTMLElement {
    constructor() {
        super();

        /** @type {string} */
        this.key = parseString(this.getAttribute("key"), window);

        /** @type {Promise<{service:google.maps.DirectionsService}>} */
        this.whenReady = loadScript(
                "https://maps.googleapis.com/maps/api/js?key=" + this.key
            ).then(_ => {
                return Promise.resolve({ service: new google.maps.DirectionsService() });
            });
    }
}


/**
 * @external {google.maps.DirectionsService} https://developers.google.com/maps/documentation/directions/start
 */


customElements.define("google-platform", GooglePlatform);


export { GooglePlatform }
