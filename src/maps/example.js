class MapsExample extends HTMLElement {

    constructor() {
        super();
        this.code = this.innerHTML;
//        this.code = this.textContent;
        this._ensureBaseStyles();

        // move elements into subelement
        /* */
        let demoDiv = document.createElement('div');
        demoDiv.classList.add("example");
        for (let el; el = this.childNodes[0];) {
            demoDiv.appendChild(el);
        }
        this.appendChild(demoDiv);
        /* */

        let pre = document.createElement('pre');
        let code = document.createElement('code')
        code.textContent = this.code;
        pre.appendChild(code);
        this.appendChild(pre);
    }

    connectedCallback() {
    }


    _ensureBaseStyles() {
        MapsExample.prototype._ensureBaseStyles = () => {};
        let style = document.createElement('style');
        style.textContent=`
maps-example {
    display:block;
    margin: 0 10%;
    border: 1px solid #888;
    box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.14), 0 1px 5px 0 rgba(0, 0, 0, 0.12), 0 3px 1px -2px rgba(0, 0, 0, 0.2);
    margin-bottom: 40px;
}

maps-example > div {
    padding: 5px;
}

maps-example > pre {
    margin: 0;
    border-top: 1px solid #888;
    background: #eee;
    font-size: 0.7em;
}
`;
        document.head.appendChild(style);
    }

}
customElements.define("maps-example", MapsExample);


export { MapsExample }
