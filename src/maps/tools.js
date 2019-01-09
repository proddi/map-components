/**
 * Create a Promise that can be resolved later.
 * @example
 * let p = new OpenPromose((resolve, reject) => {
 *   // usually you can only solve that Promise inside.
 * });
 * p.resolve("Yay!");  // but this can be resolved/reject from outside as well.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
 */
class OpenPromise extends Promise {

    /**
     * create instance
     * @param {function(resolve:function, reject:function)} executor
     */
    constructor(executor) {
        let _resolve, _reject;
        super((resolve, reject) => {
            [_resolve, _reject] = [resolve, reject];
            executor(resolve, reject);
        });

        /**
         * @type {function}
         * @param {any} value
         */
        this.resolve = _resolve;

        /**
         * @type {function}
         * @param {any} reason
         */
        this.reject = _reject;
    }

}


function formatTime(time) {
    return time.getHours() + ":" + ("0"+time.getMinutes()).slice(-2);
}


function formatDuration(time1, time2) {
    const FOO = [[60*60*1000, "hr", "hrs"], [60*1000, "min", "mins"], [1000, "sec", "secs"]];
    let ms = time2 - time1;
    let parts = [];
    for (let [factor, sn, pl] of FOO) {
        let val = Math.floor(ms/factor);
        if (val) {
            let unit = val==1 ? sn : pl;
            parts.push(`${val} ${unit}`);
            ms -= val * factor;
        }
    }
    return parts.join(" ");
}


function formatDistance(distance) {
    return `${distance} m`;
}


export {
    OpenPromise,
    formatDuration, formatTime, formatDistance
}
