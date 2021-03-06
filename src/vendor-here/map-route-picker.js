import { RouteObserver } from '../mc/mixins.js';
import {deferredPromise} from '../generics.js';
import {qs, qp, whenElementReady} from '../mc/utils.js';
import {HereMap} from './map.js';

/**
 * Adds start+stop map-marker to map. This picker is a {@link RouteSource}. This means other components needs
 * to be attached to this element to get route changes reflected on attached components when markers
 * gets dragged. The referenced `router` is used for executing route requests.
 *
 * When setting `role="route-source"` nearby elements finds the picker as router automatically.
 *
 * @extends {RouteObserver}
 * @extends {HTMLElement}
 *
 * @todo Refactor to only use the attached {@link RouteSource} instead being a {@link RouteSource} itself.
 * @todo Fix route-source lookup
 *
 * @example
 * <here-platform app-id="..." app-code="..."></here-platform>
 * <demo-router>...</demo-router>
 *
 * <here-map center="13.5,52.5" zoom="11">
 *   <here-map-route-picker role="route-source" router="demo-router"></here-map-route-picker>
 *   <here-map-routes></here-map-routes>
 * </here-map>
 **/
class HereMapRoutePicker extends RouteObserver(HTMLElement) {
    /** @protected */
    constructor() {
        super();

        /**
         * An entry point when the element is ready.
         * @deprecated Implement `customElements.whenDefined('here-map')` instead.
         * @todo Make this private.
         * @type {Promise<{map:H.Map, startMarker: H.map.Marker, destMarker:H.map.Marker}>|Error>}
         */
        this.whenReady = deferredPromise();

        /**
         * The attached {@link HereMap} instance to be drawn onto.
         * @type {HereMap|null}
         */
        this.map = null;
        whenElementReady(qs(this.getAttribute("map")) || qp(this, "here-map") || qs("here-map"))
            .then(hereMap => this.setMap(hereMap))
            .catch(err => console.error("Unable to attach <here-map>:", err))
            ;

    }

    onRouteRequest(request) {
        if (!request.error) {
            this.whenReady.then(({map, startMarker, destMarker}) => {
                startMarker.setPosition(request.start);
                destMarker.setPosition(request.dest);
                startMarker.setVisibility(true);
                destMarker.setVisibility(true);
                map.setViewBounds(startMarker.getParentGroup().getBounds(), true);
            });
        }
    }

    onRouteClear() {
        this.whenReady.then(({map, startMarker, destMarker}) => {
            startMarker.setVisibility(false);
            destMarker.setVisibility(false);
        });
    }

    /**
     * Attaches the map component.
     * @todo - have to work with a domselecor and map instance
     */
    setMap(hereMap) {
        hereMap.whenReady.then(({map, behavior}) => {
            this._map = map;
            let startMarker = this._startMarker = new H.map.Marker({lat:0,lng:0}, {icon:new H.map.Icon(TRIP_START_SVG, {anchor: new H.math.Point(21, 50)})});
            startMarker.draggable = true;
            let destMarker = this._destMarker = new H.map.Marker({lat:0,lng:0}, {icon:new H.map.Icon(TRIP_DEST_SVG, {anchor: new H.math.Point(21, 50)})});
            destMarker.draggable = true;

            function _dragStartHandler() {
                behavior.disable();
            }

            let _dragEndHandler = ev => {
                let target = ev.target,
                    data = target.getData(),
                    position = target.getPosition();
                behavior.enable();

                this.updateRoute({
                    start: startMarker.getPosition(),
                    dest: destMarker.getPosition(),
                });
            }

            function _dragHandler(ev) {
                let marker = ev.target,
                    pointer = ev.currentPointer,
                    newPosition = map.screenToGeo(pointer.viewportX, pointer.viewportY);
                marker.setPosition(newPosition);
            }

            let draggableLayer = new H.map.Group();
            draggableLayer.addEventListener("dragstart", _dragStartHandler, true);
            draggableLayer.addEventListener("drag", _dragHandler, true);
            draggableLayer.addEventListener("dragend", _dragEndHandler, true);
            draggableLayer.addObjects([startMarker, destMarker]);
            map.addObject(draggableLayer);

            this.whenReady.resolve({
                    map: map,
                    startMarker: startMarker,
                    destMarker: destMarker,
                });
        }).catch(error => this.whenReady.reject(error));
    }
}


const TRIP_START_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="50" viewBox="0 0 40 50" xmlns:xlink="http://www.w3.org/1999/xlink"><defs><path id="b" d="M34.25 31.652A19.015 19.015 0 0 0 39 19.06C39 8.549 30.478 0 20 0S1 8.55 1 19.059c0 4.823 1.795 9.233 4.75 12.593L19.975 46 34.25 31.652z"/><path id="a" d="M34.25 31.652A19.015 19.015 0 0 0 39 19.06C39 8.549 30.478 0 20 0S1 8.55 1 19.059c0 4.823 1.795 9.233 4.75 12.593L19.975 46 34.25 31.652z"/><mask id="c" width="38" height="46" x="0" y="0" fill="#fff"><use xlink:href="#a"/></mask></defs><g fill="none" fill-rule="evenodd"><ellipse cx="20" cy="45.16" fill="#FFF" stroke="#979797" stroke-width=".25" rx="3.5" ry="3.5"/><use fill="#01B6B2" xlink:href="#b"/><path fill="#323232" fill-opacity=".5" d="M11.81 37.66h16.38l-8.2 8z"/><use stroke="#416A86" stroke-width=".5" mask="url(#c)" xlink:href="#a"/><ellipse cx="19.81" cy="19.19" fill="#FFF" rx="4.81" ry="4.81"/></g></svg>`;
const TRIP_DEST_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="50" viewBox="0 0 40 50" xmlns:xlink="http://www.w3.org/1999/xlink"><defs><path id="a" d="M34.25 31.652A19.015 19.015 0 0 0 39 19.06C39 8.549 30.478 0 20 0S1 8.55 1 19.059c0 4.823 1.795 9.233 4.75 12.593L19.975 46 32.83 33.104c.407-.374 1.419-1.452 1.419-1.452z"/><mask id="c" width="38" height="46" x="0" y="0" fill="#fff"><use xlink:href="#a"/></mask><ellipse id="b" cx="19.807" cy="19.168" rx="12.363" ry="12.197"/><mask id="d" width="25.725" height="25.394" x="-.5" y="-.5"><path fill="#fff" d="M6.944 6.471h25.725v25.394H6.944z"/><use xlink:href="#b"/></mask></defs><g fill="none" fill-rule="evenodd"><ellipse cx="20" cy="45.16" fill="#FFF" stroke="#979797" stroke-width=".25" rx="3.5" ry="3.5"/><use fill="#323232" xlink:href="#a"/><path fill="#7D7D7D" d="M12.011 37.805h15.978l-7.916 8z"/><use stroke="#7C7C7C" stroke-width=".5" mask="url(#e)" xlink:href="#a"/><use stroke="#FFF" stroke-width=".5" mask="url(#c)" xlink:href="#a"/><ellipse fill="#FFF" cx="19.807" cy="19.168" rx="12.363" ry="12.197"/><path fill="#323232" d="M6.812 6.948h6.45v6.364h-6.45zm0 12.727h6.45v6.364h-6.45zm6.45-6.363h6.45v6.364h-6.45zm0 12.727h6.45v6.364h-6.45zm6.45-19.091h6.45v6.364h-6.45zm0 12.727h6.45v6.364h-6.45zm6.45-6.363h6.45v6.364h-6.45zm0 12.727h6.45v6.364h-6.45z"/><use stroke="#FFF" mask="url(#d)" xlink:href="#b" stroke-linecap="square"/></g></svg>`;


customElements.define("here-map-route-picker", HereMapRoutePicker);


export { HereMapRoutePicker }
