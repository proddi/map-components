/**
 * Event fired when a new RouteRequest is initiated.
 *
 * `detail.request:` {@link RouteRequest}
 **/
class RouteRequestEvent extends CustomEvent {
    /**
     * @param {RouteRequest} request
     */
    constructor(request) {
        super('route-request', { detail: { request: request, }});
    }
}


/**
 * @external {CustomEvent} https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent
 */


export { RouteRequestEvent }
