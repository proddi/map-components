import {findRootElement} from '../generics.js';


/**
 * Adds start+stop map-marker to map and bind them to the router. When markers dragged the router gets updated.
 *
 * @example
 * <here-platform app-id="..." app-code="..."></here-platform>
 * <router id="router"></router>
 *
 * <here-map platform="here-platform" center="13.5,52.5" zoom="11">
 *   <here-map-route-picker router="#router"></here-map-route-picker>
 * </here-map>
 **/
class HereMapRoutePicker extends HTMLElement {
    constructor() {
        super();
        let mapComp = findRootElement(this, this.getAttribute("map"), customElements.get("here-map"));
        let router = document.querySelector(this.getAttribute("router"));

        mapComp.whenReady.then(({map, behavior}) => {

            let startMarker = new H.map.DomMarker({lat:0,lng:0});//, {icon: new H.map.DomIcon(`<div class="svg-icon start-icon"></div>`)});
            startMarker.draggable = true;
            let destMarker = new H.map.DomMarker({lat:0,lng:0});//, {icon: new H.map.DomIcon(`<div class="svg-icon start-icon"></div>`)});
            destMarker.draggable = true;

            function _dragStartHandler() {
                behavior.disable();
            }

            function _dragEndHandler(ev) {
                let target = ev.target,
                    data = target.getData(),
                    position = target.getPosition();
                behavior.enable();
                router.update(startMarker.getPosition(), destMarker.getPosition());
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

            // Router
            router.addEventListener("request", ev => {
                let request = ev.detail;
                startMarker.setPosition(request.start);
                destMarker.setPosition(request.dest);
            });
            if (router.currentRequest) {
                startMarker.setPosition(router.currentRequest.start);
                destMarker.setPosition(router.currentRequest.dest);
            }
        });
    }
}


customElements.define("here-map-route-picker", HereMapRoutePicker);


export { HereMapRoutePicker }
