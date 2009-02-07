// @require widget.js

(function(){

	var BASE = DlEntry.inherits(DlContainer);
	function DlEntry(args) {
		if (args) {
			args.tagName = "table";
			D.setDefaults(this, args);
			this._isTextArea = args.type == "textarea";
			DlContainer.call(this, args);
		}
	};

	eval(Dynarch.EXPORT("DlEntry", true));

        var DEFAULT_EVENTS = [ "onChange", "onKey-ENTER", "onKey-ESCAPE", "onValidationError", "onValidation" ];

	D.DEFAULT_ARGS = {
		_domType    : [ "type"       , "text" ],
		_value      : [ "value"      , null ],
		_size       : [ "size"       , null ],
		_rows       : [ "rows"       , null ],
		_readonly   : [ "readonly"   , false ],
                _emptyText  : [ "emptyText"  , "" ],
		_width      : [ "width"      , null ],
		_name       : [ "name"       , null ],
		_validators : [ "validators" , [] ],
		_allowEmpty : [ "allowEmpty" , null ],
		_focusable  : [ "focusable"  , 2 ],
                _maxlen     : [ "maxlength"  , null ],
                _noSelect   : [ "noSelect"   , false ],
		_noWrap     : [ "noWrap"     , false ] // only for textareas
	};

	P.validate = function(val) {
		if (val == null)
			val = this.getValue();
		if (this._allowEmpty != null) {
			if (!/\S/.test(val)) {
                                this.condClass(!this._allowEmpty, "DlEntry-ValidationError");
                                this.applyHooks("onValidation", [ !this._allowEmpty ]);
				return this._allowEmpty;
                        }
		}
		var a = this._validators, i, v, err = false;
		for (i = 0; i < a.length; ++i) {
			v = a[i];
			if (!v.ok(val)) {
				err = v.getError() || true;
				break;
			}
		}
		if (v && !err)
			this.setValue(v.getLastVal(), true);
		this.validationError = err;
 		if (!this._noSelect && this._focused && !this.readonly() && this._domType != "textarea")
 		        this.select();
		// alert(err + " \n " + this._validators.length);
		this.condClass(err, "DlEntry-ValidationError");
                this.applyHooks("onValidation", [ err ]);
		if (err)
			this.applyHooks("onValidationError", [ err ]);
		return !err;
	};

	P.timerFocus = function(timeout) {
		return this.focus.clearingTimeout(timeout || 10, this);
	};

	P.select = function() {
		try {
			if (is_gecko)
				this.setSelectionRange(0, this.getValue().length);
			else
				this.getInputElement().select();
		} catch(ex) {}
	};

	P.focus = function() {
		this.getInputElement().focus();
		if (!this._noSelect && !this.readonly() && this._domType != "textarea")
			this.select();
	};

	P.blur = function() {
		this.getInputElement().blur();
	};

	function element_focus() {
		this.addClass("DlEntry-Focus");
		this._focused = true;
		BASE.focus.call(this);
                if (this._isEmpty) {
                        this.getInputElement().value = "";
                        this.delClass("DlEntry-empty");
                        this._isEmpty = false;
                }
	};

	function element_blur() {
		this.delClass("DlEntry-Focus");
		this._focused = false;
		BASE.blur.call(this);
                this.__setEmpty();
	};

	function element_change() {
                this.__setEmpty();
		this.callHooks("onChange");
	};

        P.__setEmpty = function(value) {
                if (value == null)
                        value = this.getInputElement().value;
                this._isEmpty = this.__checkEmpty(value);
                if (!this._isEmpty) {
                        this.delClass("DlEntry-empty");
                } else if (!this._focused) {
                        this.addClass("DlEntry-empty");
                        this.getInputElement().value = "";
                        (function(){
                                if (!this.destroyed && !this._focused && this.__checkEmpty())
                                        this.getInputElement().value = this._emptyText;
                        }).delayed(0, this);
                } else {
                        this.getInputElement().value = value;
                }
                return this._isEmpty;
        };

        P.__checkEmpty = function(value) {
                if (value == null)
                        value = this.getInputElement().value;
                return value === "";
        };

	P._createElement = function() {
		BASE._createElement.apply(this, arguments);
		var el = this.getElement();
		el.appendChild(DlElementCache.get("TBODY_RC"));
		el.cellSpacing = el.cellPadding = el.border = 0;
		el = el.rows[0].cells[0];
		el.className = "DlEntry-cell";
		var input = this._isTextArea
			? document.createElement("textarea")
			: input = document.createElement("input");
		input.setAttribute("autocomplete", "off", 1);
		if (this._noWrap)
			input.setAttribute("wrap", "off");
		if (this._isTextArea) {
			if (this._rows)
				input.rows = this._rows;
		}
                if (this._maxlen != null)
                        input.setAttribute("maxlength", this._maxlen);
		switch (this._domType) {
		    case "password":
		    case "file":
		    case "hidden":
			input.type = this._domType;
		}
                if (is_gecko && gecko_version < 1.9 && !this._no_gecko_bug)
                        el = CE("div", null, { className: "Gecko-Bug-226933" }, el);
		el.appendChild(input);
	};

	P.getInputElement = function() {
		return this.getElement().getElementsByTagName(this._isTextArea ? "textarea" : "input")[0];
	};

	P.getContentElement = P.getInputElement; // ALIAS

	P.setIfEmpty = function(value, nocall) {
		if (this._isEmpty && value)
			this.setValue(value, nocall);
	};

        P.isEmpty = function() {
                return this.__checkEmpty();
        };

	P.setValue = function(value, nocall) {
                if (!this.__setEmpty(value)) {
                        if (this._maxlen != null)
                                value = String(value).substr(0, this._maxlen);
		        this.getInputElement().value = value;
                }
		if (!nocall)
			this.callHooks("onChange");
	};

	P.clear = function(nocall) {
		this.setValue("", nocall);
                return this;
	};

	P.getValue = function() {
		return this._isEmpty ? "" : this.getInputElement().value;
	};

	P.getSelectionRange = function() {
		return DOM.getSelectionRange(this.getInputElement());
	};

	P.setSelectionRange = function(start, end) {
		DOM.setSelectionRange(this.getInputElement(), start, end);
	};

	P.moveEOF = function() {
		var l = this.getValue().length;
		this.setSelectionRange(l, l);
	};

	P.moveBOF = function() {
		this.setSelectionRange(0, 0);
	};

	P.collapse = function(atStart) {
		var p = this.getSelectionRange();
		p = atStart ? p.start : p.end;
		this.setSelectionRange(p, p);
	};

	function onChange() {
		this.validate();
	};

	function onKeyPress(ev) {
                //if (ev.keyCode in DlKeyboard.KEYS_CONTROL)
                //this.__setEmpty();
                this._isEmpty = false;
		if (ev.keyCode == DlKeyboard.ENTER) {
			this.applyHooks("onKey-ENTER", [ ev ]);
		} else if (ev.keyCode == DlKeyboard.ESCAPE) {
			this.applyHooks("onKey-ESCAPE", [ ev ]);
		}
	};

	function onDestroy() {
		// remove event handlers to prevent leaks
		DOM.removeEvent(this.getInputElement(),
				{ focus   : this._on_element_focus,
				  blur    : this._on_element_blur,
				  change  : this._on_element_change });
	};

	P.initDOM = function() {
		this.registerEvents(DEFAULT_EVENTS);
		BASE.initDOM.call(this);
		var input = this.getInputElement();
		DOM.addEvent(input, { focus   : this._on_element_focus = element_focus.$(this),
				      blur    : this._on_element_blur = element_blur.$(this),
				      change  : this._on_element_change = element_change.$(this) });
		this.addEventListener({ onChange   : onChange,
					onKeyPress : onKeyPress,
					onDestroy  : onDestroy
				      });
		if (this._value != null)
			this.setValue(this._value, true);
                else
                        this.clear(true);
		if (this._width != null)
			input.style.width = this._width;
		else if (this._size != null)
			// input.size = this._size;
                        // input.style.width = this._size * 15 + "px";
                        this.setSize({ x: this._size * 9 + 7 - this._size });
		if (this._name != null)
			input.name = this._name;
		this.readonly(this._readonly);
	};

	P.readonly = function(readonly) {
		var input = this.getInputElement();
		if (readonly != null) {
			input.readOnly = readonly;
			readonly
				? input.setAttribute("readonly", true, 1)
				: input.removeAttribute("readonly");
			this.condClass(readonly, "DlEntry-Readonly");
		}
		return input.getAttribute("readonly");
	};

	P.disabled = function(v, force) {
		var isDisabled = BASE.disabled.call(this, v, force);
		if (v != null)
			this.getInputElement().disabled = !!v;
		return isDisabled;
	};

	P.setSize = P.setOuterSize = function(size) {
		var input = this.getInputElement(), x = size.x, y = size.y, pb = DOM.getPaddingAndBorder(input);
		if (x != null)
			x -= pb.x + 4;
		if (y != null)
			y -= pb.y + 4;
                if (this._domType != "textarea")
                        y = null;
                DOM.setInnerSize(input, x, y);
                if (x != null) {
                        x += 8;
                        DOM.setInnerSize(this.getElement(), x);
                }
	};

})();
