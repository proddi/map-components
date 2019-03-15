import '/node_modules/@cwmr/paper-autocomplete/paper-autocomplete.js';


//import '/node_modules/@polymer/polymer/polymer-legacy.js';
// <link rel="import" href="../polymer/polymer.html">
// <link rel="import" href="../iron-flex-layout/iron-flex-layout.html">
import '/node_modules/@polymer/paper-input/paper-input.js';
// <link rel="import" href="../paper-input/paper-input.html">
import '/node_modules/@polymer/paper-icon-button/paper-icon-button.js';
//    <link rel="import" href="../paper-icon-button/paper-icon-button.html">
import '/node_modules/@polymer/iron-icons/iron-icons.js';
//    <link rel="import" href="../iron-icons/iron-icons.html">
// <link rel="import" href="./paper-autocomplete-suggestions.html">
import '/node_modules/@polymer/paper-item/paper-item.js';
//    <link rel="import" href="../paper-item/paper-item.html">
// <link rel="import" href="../paper-ripple/paper-ripple.html">
import '/node_modules/@polymer/paper-material/paper-material.js';
// <link rel="import" href="../paper-material/paper-material.html">
/**
  `location-input`

  Cloned from: https://github.com/ellipticaljs/paper-autocomplete/blob/master/paper-autocomplete.html
*/

// import {Polymer} from '@polymer/polymer/lib/legacy/polymer-fn.js';
import {html, render, repeat} from '../lit-html.js';


class LocationInputSuggestions extends HTMLElement {
    constructor() {
        super();

        this._bodyRenderer  = this.bodyRenderer;

        // prepare root
        this.attachShadow({mode: 'open'});

        this._suggestions = [];
        this.highlightedSuggestion = null;

        // initial render
        this.render();
    }

    suggestions(arr) {
        this._suggestions = arr;
        this.render();
//        this._suggestions = [{
//            name: "Option1",
//        }, {
//            name: "Option2",
//        }, {
//            name: "Option3",
//        }, {
//            name: "Option4",
//        }];
    }

    _onSelectIndex(index) {
        console.log("onSelectIndex", index);
//        var index = this.modelForElement(event.currentTarget).index;
//        this._selection(index);
    }

    render() {
        return html `
            <style>
                paper-material,
                [role=listbox] {
                    display: none;
                    position: absolute;
                    width: 100%;
                    z-index: 1000;
                    background-color: white;
                    max-height: 252px;
                    overflow-y: auto;
                    @apply --suggestions-wrapper;
                }
                paper-item,
                :host ::slotted(paper-item) {
                    min-height: var(--paper-item-min-height, 36px);
                    padding: 0 16px;
                    position: relative;
                    line-height: 18px;
                    @apply --suggestions-item;
                }
                paper-item:hover,
                :host ::slotted(paper-item:hover) {
                    background: #eee;
                    color: #333;
                    cursor: pointer;
                }
                paper-item.active,
                :host ::slotted(paper-item.active) {
                    background: #eee;
                    color: #333;
                }
                /**
                * IE11 paper-item min-height bug: https://github.com/PolymerElements/paper-item/issues/35
                */
                @media screen and (-ms-high-contrast: active), (-ms-high-contrast: none) {
                    paper-item {
                        height: var(--paper-item-min-height, 36px);
                    }
                }
            </style>

            <div>
                <!-- unselectable is needed to fix an issue related to the focus being taken away when clicking in the
                 results scrollbar -->
                <paper-material elevation="1" id="suggestionsWrapper" unselectable="on"></paper-material>

                <div role="listbox" style="display:inherit" @click=${ev => console.log("listbox", ev)}>
                    ${repeat(this._suggestions, (sug, idx) => idx, (sug, index) => html`
                        <paper-item id$="[[_getSuggestionId(index)]]" role="option" aria-selected="false" @click=${_ => this._onSelectIndex(index)}>
                            <div>${sug.name}</div>
                            <paper-ripple></paper-ripple>
                        </paper-item>
                    `)}
                    <paper-item id$="[[_getSuggestionId(index)]]" role="option" aria-selected="false" on-tap="_onSelect">
                        <div>[[_getItemText(suggestion1)]]</div>
                        <paper-ripple></paper-ripple>
                    </paper-item>
                    <paper-item id$="[[_getSuggestionId(index)]]" role="option" aria-selected="false" on-tap="_onSelect">
                        <div>[[_getItemText(suggestion2)]]</div>
                        <paper-ripple></paper-ripple>
                    </paper-item>
                </div>

                <!-- Default suggestion template -->
                <template id="defaultTemplate">
                    <paper-item id$="[[_getSuggestionId(index)]]" role="option" aria-selected="false" on-tap="_onSelect">
                        <div>[[_getItemText(default)]]</div>
                        <paper-ripple></paper-ripple>
                    </paper-item>
                </template>

                <!-- Custom template -->
                <slot id="templates" name="autocomplete-custom-template"></slot>
            </div>
`;
    }
}




const PaperInput = customElements.get('paper-input');


class LocationInput extends PaperInput {
    constructor() {
        super();
    }
}


class LocationInput2 extends HTMLElement {
    constructor() {
        super();

        this._bodyRenderer  = this.bodyRenderer;

        const suggestionId = this.getAttribute('input-suggestions');
        if (suggestionId) this._suggestionsElement = document.querySelector(suggestionId);
//        if (!this._suggestionsElement) this._suggestionsElement =

        // prepare root
        this.attachShadow({mode: 'open'});-

        // initial render
        render(this._bodyRenderer({}), this.shadowRoot);

        this._inputElement = this.shadowRoot.querySelector('paper-input');
        console.log(this, this._inputElement);

        this._inputElement.addEventListener('focused-changed', ev => this._onFocusedChanged(ev));
        this._inputElement.addEventListener('value-changed', ev => this._onValueChanged(ev));
        this.addEventListener('change', ev => this._onChange(ev));
    }

    suggestions(arr) {
        console.log(this.focused);
        this._suggestionsElement.suggestions(arr);
    }

    hideSuggestions() {
        this._suggestionsElement.hideSuggestions();
    }

    _onFocusedChanged(ev) {
        console.log("focused-changed", ev.detail, this._inputElement.focused);
    }

    _onValueChanged(ev) {
        console.log("value-changed", ev.detail);
    }

    _onChange(ev) {
        console.log("change", ev.detail);
    }

    bodyRenderer() {
        return html `
            <style>
                :host {
                    display: block;
                    box-sizing: border-box;
                    position: relative;

                    --paper-input-container-focus-color: var(--primary-color);

                    --paper-icon-button: {
                      height: 24px;
                      width: 24px;
                      padding: 2px;
                    }

                    --paper-input-container-ms-clear: {
                      display: none;
                    }
                }

                .input-wrapper {
                    @apply --layout-horizontal;
                }

                .input-wrapper paper-input {
                    @apply --layout-flex;
                }

                #clear {
                    display: none;
                    line-height: 8px;
                }

                .sr-only {
                    position: absolute;
                    clip: rect(1px, 1px, 1px, 1px);
                }

                paper-autocomplete-suggestions {
                    --suggestions-wrapper: {
                      @apply --paper-autocomplete-suggestions-wrapper;
                    };

                    --paper-item-min-height: var(--paper-autocomplete-suggestions-item-min-height, 36px);
                }
            </style>

    <div class="input-wrapper" role="combobox" aria-haspopup="true" aria-owns="suggestionsWrapper" aria-expanded$="[[_isSuggestionsOpened]]">
        <!-- For accessibility, it is needed to have a label or aria-label. Label is preferred -->
        <label for="autocompleteInput" class="sr-only">[[label]]</label>

        <paper-input id="autocompleteInput"
                   label="[[label]]"
                   a_utocapitalize="[[autocapitalize]]"
                   n_o-label-float="[[noLabelFloat]]"
                   ?disabled="${this.disabled}"
                   ?readonly="${this.readOnly}"
                   ?focused="${this.focused}"
                   a_uto-validate$="[[autoValidate]]"
                   e_rror-message$="[[errorMessage]]"
                   r_equired$="[[required]]"
                   value="{{text}}"
                   a_llowed-pattern="[[allowedPattern]]"
                   p_attern="[[pattern]]"
                   no-label-float="[[noLabelFloat]]"
                   a_lways-float-label="[[alwaysFloatLabel]]"
                   c_har-counter$="[[charCounter]]"
                   m_axlength$="[[maxlength]]"
                   p_laceholder="[[placeholder]]"
                   i_nvalid="{{invalid}}"

                   role="textbox"
                   aria-autocomplete="list"
                   aria-multiline="false"
                   aria-activedescendant$="[[_highlightedSuggestion.elementId]]"
                   aria-disabled$="[[disabled]]"
                   aria-controls="autocompleteStatus suggestionsWrapper">

            <slot name="prefix" slot="prefix"></slot>
            <!-- TODO: remove tabindex workaround when  is fixed https://github.com/PolymerElements/paper-input/issues/324 -->
            <paper-icon-button slot="suffix" suffix id="clear" icon="clear" on-click="_clear" tabindex="-1"></paper-icon-button>
            <slot name="suffix" slot="suffix"></slot>
        </paper-input>

        <!-- to announce current selection to screen reader -->
        <span id="autocompleteStatus" role="status" class="sr-only">[[_highlightedSuggestion.textValue]]</span>
    </div>

    <l_ocation-input-suggestions for="autocompleteInput"
                                    id="paperAutocompleteSuggestions"
                                    min-length="[[minLength]]"
                                    text-property="[[textProperty]]"
                                    value-property="[[valueProperty]]"
                                    selected-option="{{selectedOption}}"
                                    source="[[source]]"
                                    remote-source="[[remoteSource]]"
                                    query-fn="[[queryFn]]"
                                    event-namespace="[[eventNamespace]]"
                                    highlighted-suggestion="{{_highlightedSuggestion}}"
                                    is-open="{{_isSuggestionsOpened}}"
                                    highlight-first="[[highlightFirst]]"
                                    show-results-on-focus="[[showResultsOnFocus]]">

      <slot id="templates" name="autocomplete-custom-template"></slot>

    </l_ocation-input-suggestions>
`;
    }
}
if (false) {
Polymer({
    _template: html`<div>FOO</div>`,

  _te_mplate: html`
    <style>
      :host {
        display: block;
        box-sizing: border-box;
        position: relative;

        --paper-input-container-focus-color: var(--primary-color);

        --paper-icon-button: {
          height: 24px;
          width: 24px;
          padding: 2px;
        }

        --paper-input-container-ms-clear: {
          display: none;
        }
      }

      .input-wrapper {
        @apply --layout-horizontal;
      }

      .input-wrapper paper-input {
        @apply --layout-flex;
      }

      #clear {
        display: none;
        line-height: 8px;
      }

      .sr-only {
        position: absolute;
        clip: rect(1px, 1px, 1px, 1px);
      }

      paper-autocomplete-suggestions {
        --suggestions-wrapper: {
          @apply --paper-autocomplete-suggestions-wrapper;
        };

        --paper-item-min-height: var(--paper-autocomplete-suggestions-item-min-height, 36px);
      }
    </style>
    <div class="input-wrapper" role="combobox" aria-haspopup="true" aria-owns="suggestionsWrapper" aria-expanded$="[[_isSuggestionsOpened]]">
      <!-- For accessibility, it is needed to have a label or aria-label. Label is preferred -->
      <label for="autocompleteInput" class="sr-only">[[label]]</label>

      <!-- Adding a hidden input to integrate with iron-form, if required -->
      <input type="hidden" name$="[[name]]" value$="[[value]]" >

      <paper-input id="autocompleteInput"
                   label="[[label]]"
                   autocapitalize="[[autocapitalize]]"
                   no-label-float="[[noLabelFloat]]"
                   disabled="{{disabled}}"
                   readonly="[[readonly]]"
                   focused="{{focused}}"
                   auto-validate$="[[autoValidate]]"
                   error-message$="[[errorMessage]]"
                   required$="[[required]]"
                   value="{{text}}"
                   allowed-pattern="[[allowedPattern]]"
                   pattern="[[pattern]]"
                   no-label-float="[[noLabelFloat]]"
                   always-float-label="[[alwaysFloatLabel]]"
                   char-counter$="[[charCounter]]"
                   maxlength$="[[maxlength]]"
                   placeholder="[[placeholder]]"
                   invalid="{{invalid}}"

                   role="textbox"
                   aria-autocomplete="list"
                   aria-multiline="false"
                   aria-activedescendant$="[[_highlightedSuggestion.elementId]]"
                   aria-disabled$="[[disabled]]"
                   aria-controls="autocompleteStatus suggestionsWrapper">

        <slot name="prefix" slot="prefix"></slot>
        <!-- TODO: remove tabindex workaround when  is fixed https://github.com/PolymerElements/paper-input/issues/324 -->
        <paper-icon-button slot="suffix" suffix id="clear" icon="clear" on-click="_clear" tabindex="-1"></paper-icon-button>
        <slot name="suffix" slot="suffix"></slot>
      </paper-input>
      <!-- to announce current selection to screen reader -->
      <span id="autocompleteStatus" role="status" class="sr-only">[[_highlightedSuggestion.textValue]]</span>
    </div>

    <location-input-suggestions for="autocompleteInput"
                                    id="paperAutocompleteSuggestions"
                                    min-length="[[minLength]]"
                                    text-property="[[textProperty]]"
                                    value-property="[[valueProperty]]"
                                    selected-option="{{selectedOption}}"
                                    source="[[source]]"
                                    remote-source="[[remoteSource]]"
                                    query-fn="[[queryFn]]"
                                    event-namespace="[[eventNamespace]]"
                                    highlighted-suggestion="{{_highlightedSuggestion}}"
                                    is-open="{{_isSuggestionsOpened}}"
                                    highlight-first="[[highlightFirst]]"
                                    show-results-on-focus="[[showResultsOnFocus]]">

      <slot id="templates" name="autocomplete-custom-template"></slot>

    </location-input-suggestions>
`,

  is: 'location-input',

  properties: {
    /**
     * `autoValidate` Set to true to auto-validate the input value.
     */
    autoValidate: {
      type: Boolean,
      value: false
    },
    /**
     * Setter/getter manually invalid input
     */
    invalid : {
      type: Boolean,
      notify: true,
      value: false
    },
    /**
     * `autocapitalize` Sets auto-capitalization for the input element.
     */
    autocapitalize: String,

    /**
     * `errorMessage` The error message to display when the input is invalid.
     */
    errorMessage: {
      type: String
    },

    /**
     * `label` Text to display as the input label
     */
    label: String,

    /**
     * `noLabelFloat` Set to true to disable the floating label.
     */
    noLabelFloat: {
      type: Boolean,
      value: false
    },

    /**
     * `alwaysFloatLabel` Set to true to always float label
     */
    alwaysFloatLabel: {
      type: Boolean,
      value: false
    },

    /**
     * The placeholder text
     */
    placeholder: String,

    /**
     * `required` Set to true to mark the input as required.
     */
    required: {
      type: Boolean,
      value: false
    },

    /**
     * `readonly` Set to true to mark the input as readonly.
     */
    readonly: {
      type: Boolean,
      value: false
    },

    /**
     * `focused` If true, the element currently has focus.
     */
    focused: {
      type: Boolean,
      value: false,
      notify: true
    },

    /**
     * `disabled` Set to true to mark the input as disabled.
     */
    disabled: {
      type: Boolean,
      value: false
    },

    /**
     * `source` Array of objects with the options to execute the autocomplete feature
     */
    source: {
      type: Array,
      observer: '_sourceChanged'
    },

    /**
     * Property of local datasource to as the text property
     */
    textProperty: {
      type: String,
      value: 'text'
    },

    /**
     * Property of local datasource to as the value property
     */
    valueProperty: {
      type: String,
      value: 'value'
    },

    /**
     * `value` Selected object from the suggestions
     */
    value: {
      type: Object,
      notify: true
    },

    /**
     * The current/selected text of the input
     */
    text: {
      type: String,
      notify: true,
      value: ''
    },

    /**
     * Disable showing the clear X button
     */
    disableShowClear: {
      type: Boolean,
      value: false
    },

    /**
     * Binds to a remote data source
     */
    remoteSource: {
      type: Boolean,
      value: false
    },

    /**
     * Event type separator
     */
    eventNamespace: {
      type: String,
      value: '-'
    },

    /**
     * Minimum length to trigger suggestions
     */
    minLength: {
      type: Number,
      value: 1
    },

    /**
     * `pattern` Pattern to validate input field
     */
    pattern: String,

    /**
     * allowedPattern` allowedPattern to validate input field
     */
    allowedPattern: String,

    /**
     * Set to `true` to show a character counter.
     */
    charCounter: {
      type: Boolean,
      value: false
    },

    /**
     * The maximum length of the input value.
     */
    maxlength: {
      type: Number
    },

    /**
     * Name to be used by the autocomplete input. This is necessary if wanted to be integrated with iron-form.
     */
    name: String,

    /**
     * Function used to filter available items. This function is actually used by paper-autocomplete-suggestions,
     * it is also exposed here so it is possible to provide a custom queryFn.
     */
    queryFn: {
      type: Function
    },

    /**
     * If `true`, it will always highlight the first result each time new suggestions are presented.
     */
     highlightFirst: {
      type: Boolean,
      value: false
    },

    /**
     * Set to `true` to show available suggestions on focus. This overrides the default behavior that only shows
     * notifications after user types
     */
    showResultsOnFocus: {
      type: Boolean,
      value: false
    },

    /*************
    * PRIVATE
    *************/
    // TODO: check if we need _value and _text properties. It seems they can be removed
    _value: {
      value: undefined
    },

    _text: {
      value: undefined
    },

    /**
     * Indicates whether the clear button is visible or not
     */
    _isClearButtonVisible: {
      type: Boolean,
      value: false
    },

    /**
     * Indicates whether the suggestion popup is visible or not.
     */
    _isSuggestionsOpened: {
      type: Boolean,
      value: false
    },

    /**
     * Object containing the information of the currently selected option
     */
    selectedOption: {
      type: Object,
      notify: true
    }
  },

  observers: [
    '_textObserver(text)'
  ],

  _sourceChanged: function (newSource) {
    var text = this.text;
    if (!Array.isArray(newSource) || newSource.length === 0 || text == null || text.length < this.minLength) {
      return;
    }
    if (!this.$.autocompleteInput.focused) {
      return;
    }
    this.$.paperAutocompleteSuggestions._handleSuggestions({
      target: {
        value: text
      }
    });
  },

  // Element Lifecycle
  ready: function () {
    this._value = this.value;

    this.addEventListener(
      'autocomplete' + this.eventNamespace + 'selected',
      this._onAutocompleteSelected.bind(this)
    );
  },

  /**
   * Clears the input text
   */
  _clear: function () {
    var option = {
      text: this.text,
      value: this.value
    };

    this.value = null;
    this._value = null;
    this.text = '';
    this._text = '';

    this._fireEvent(option, 'reset-blur');

    this._hideClearButton();

    // Fix: https://github.com/PolymerElements/paper-input/issues/493
    if (!this.$.autocompleteInput.focused) {
      this.$.autocompleteInput.focus();
    }
  },

  /**
   * Dispatches autocomplete events
   */
  _fireEvent: function (option, evt) {
    var id = this._getId();
    var event = 'autocomplete' + this.eventNamespace + evt;

    this.fire(event, {
      id: id,
      value: option[this.valueProperty] || option.value,
      text: option[this.textProperty] || option.text,
      target: this,
      option: option
    });
  },

  /**
   * On text event handler
   */
  _textObserver: function (text) {
    if (text && text.trim()) {
      this._showClearButton();
    } else {
      this._hideClearButton();
    }
  },

  /**
   * On autocomplete selection
   */
  _onAutocompleteSelected: function (event) {
    var selection = event.detail;

    this.value = selection.value;
    this.text = selection.text;
  },

  /**
   * Show the clear button (X)
   */
  _showClearButton: function () {
    if (this.disableShowClear) {
      return;
    }

    if (this._isClearButtonVisible) {
      return;
    }

    this.$.clear.style.display = 'inline-block';
    this._isClearButtonVisible = true;
  },

  /**
   * Hide the clear button (X)
   */
  _hideClearButton: function () {
    if (!this._isClearButtonVisible) {
      return;
    }

    this.$.clear.style.display = 'none';
    this._isClearButtonVisible = false;
  },

  _getId: function () {
    var id = this.getAttribute('id');
    if (!id) id = this.dataset.id;
    return id;
  },

  /****************************
   * PUBLIC
   ****************************/

  /**
   * Gets the current text/value option of the input
   * @returns {Object}
   */
  getOption: function () {
    return {
      text: this.text,
      value: this.value
    };
  },

  /**
   * Sets the current text/value option of the input
   * @param {Object} option
   */
  setOption: function (option) {
    this.text = option[this.textProperty] || option.text;
    this.value = option[this.valueProperty] || option.value;
    this._showClearButton();
  },

  /**
   * Disables the input
   */
  disable: function () {
    this.disabled = true;
  },

  /**
   * Enables the input
   */
  enable: function () {
    this.disabled = false;
  },

  /**
   * Sets the component's current suggestions
   * @param {Array} arr
   */
  suggestions: function (arr) {
    this.$.paperAutocompleteSuggestions.suggestions(arr);
  },

  /**
   * Validates the input
   * @returns {Boolean}
   */
  validate: function () {
    return this.$.autocompleteInput.validate();
  },

  /**
   * Clears the current input
   */
  clear: function () {
    this._value = '';
    this._text = '';
    this._clear();
  },

  /**
   * Resets the current input (DEPRECATED: please use clear)
   */
  reset: function () {
    this._clear();
  },

  /**
   * Hides the suggestions popup
   */
  hideSuggestions: function () {
    this._hideClearButton();
    this.$.paperAutocompleteSuggestions.hideSuggestions();
  },

  /**
   * Allows calling the onSelect function from outside
   * This in time triggers the autocomplete-selected event
   * with all the data required
   */
  onSelectHandler: function (event) {
    this.$.paperAutocompleteSuggestions._onSelect(event);
  }

  /**
   * Fired when a selection is made
   *
   * @event autocomplete-selected
   * @param {String} id
   * @param {String} text
   * @param {Element} target
   * @param {Object} option
   */

  /**
   * Fired on input change
   *
   * @event autocomplete-change
   * @param {String} id
   * @param {String} text
   * @param {Element} target
   * @param {Object} option
   */

  /**
   * Fired on input focus
   *
   * @event autocomplete-focus
   * @param {String} id
   * @param {String} text
   * @param {Element} target
   * @param {Object} option
   */

  /**
   * Fired on input blur
   *
   * @event autocomplete-blur
   * @param {String} id
   * @param {String} text
   * @param {Element} target
   * @param {Object} option
   */

  /**
   * Fired on input reset/clear
   *
   * @event autocomplete-reset-blur
   * @param {String} id
   * @param {String} text
   * @param {Element} target
   * @param {Object} option
   */
});
}

customElements.define('location-input-suggestions', LocationInputSuggestions);
customElements.define('location-input', LocationInput);


export { LocationInput, LocationInputSuggestions }
