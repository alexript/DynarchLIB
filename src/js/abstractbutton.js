// @require container.js
// @require radiogroup.js

(function() {

	var DEFAULT_LISTENERS = [ "onMouseEnter",
				  "onMouseLeave",
				  "onMouseDown",
				  "onMouseUp",
				  "onUpdateLabel",
				  "onClick",
				  "onCheck",
				  "onChange",
				  "onDisabled"
				];

	var BASE = DlAbstractButton.inherits(DlWidget);
	function DlAbstractButton(args) {
		if (args) {
			D.setDefaults(this, args);
			DlWidget.call(this, args);
			var gid = this.__groupId;
			if (gid != null) {
				var g;
				if (typeof gid == "object") {
					g = gid;
					this.__groupId = g.id;
				} else
					g = DlRadioGroup.get(gid);
				this.__group = g;
				// this.refNode("__group");
				g.addWidget(this, typeof args.appendArgs == "number" ? args.appendArgs : null);
			}
			if (!this._noCapture) {
				this._btnpressCapture = {
					onMouseMove  : DlException.stopEventBubbling,
					onMouseUp    : this._cap_onMouseUp.$(this),
					onMouseOver  : DlException.stopEventBubbling,
					onMouseOut   : DlException.stopEventBubbling,
					onMouseEnter : this._cap_onMouseEnter.$(this),
					onMouseLeave : this._cap_onMouseLeave.$(this)
				};
			}
		}
	};

	eval(Dynarch.EXPORT("DlAbstractButton", true));

        var DEFAULT_EVENTS = [ "onCheck", "onUncheck", "onChange", "onUpdateLabel" ];

	var TYPE = {
		STANDARD : 1,
		TWOSTATE : 2
	};

	D.DEFAULT_ARGS = {
		_label	     : [ "label"       , "" ],
		_classes     : [ "classes"     , {} ],
		_checked     : [ "checked"     , false ],
		__groupId    : [ "group"       , null ],
		_btnType     : [ "type"	       , TYPE.STANDARD ],
		_value	     : [ "value"       , window.undefined ],
		_noCapture   : [ "noCapture"   , false ],
		_alwaysCheck : [ "alwaysCheck" , false ]
	};

	P._cap_onMouseUp = function(ev) {
		var obj = ev.getObject();
		DlEvent.releaseGlobals(this._btnpressCapture);
		this.applyHooks("onMouseUp", [ ev ]);
		if (!this._ev_mouseInside)
			this.applyHooks("onMouseLeave", [ ev ]);
		if (obj !== this) {
			obj && obj.applyHooks("onMouseEnter", [ ev ]);
			DlException.stopEventBubbling();
		}
	};

	P._cap_onMouseEnter = function(ev) {
		var obj = ev.getObject();
		if (obj === this)
			this.addClass(this._classes.active);
		obj && (obj._ev_mouseInside = true);
		DlException.stopEventBubbling();
	};

	P._cap_onMouseLeave = function(ev) {
		var obj = ev.getObject();
		if (obj === this)
			this.delClass(this._classes.active);
		obj && (obj._ev_mouseInside = false);
		DlException.stopEventBubbling();
	};

	D.TYPE = TYPE;

//	var HOVERED_BTN = null;

	P._onMouseEnter = function(ev) {
// 		if (HOVERED_BTN)
// 			HOVERED_BTN._onMouseLeave();
		this.addClass(this._classes.hover);
// 		HOVERED_BTN = this;
	};

	P._onMouseLeave = function(ev) {
		this.delClass(this._classes.hover);
		this.delClass(this._classes.active);
// 		HOVERED_BTN = null;
	};

	P._onMouseDown = function(ev) {
                // FIXME: not sure here's the right place for focus()
                //        uncomment in widget.js / onMouseDown if you remove this
		// this.focus();
		if (ev.button === 0) {
			this._ev_mouseInside = true;
			this.addClass(this._classes.hover);
			this.addClass(this._classes.active);
			if (!this._noCapture) {
				DlEvent.captureGlobals(this._btnpressCapture);
                                ev.domStop = true;
				// DlException.stopEventBubbling(); //XXX?
			}
		}
	};

	P._onMouseUp = function(ev) {
		this.delClass(this._classes.active);
	};

	P._onUpdateLabel = function() {
		var el = this.getElement();
		CC(el, !this._label || !/\S/.test(this._label), this._classes.empty);
	};

	P._onClick = function() {
		if (this._btnType == TYPE.TWOSTATE) {
			this._alwaysCheck
				? this.checked(true)
				: this.toggle();
		}
	};

        P.keyClicked = function(ev) {
                this.addClass(this._classes.active);
		(function() {
			this.delClass(this._classes.hover);
			this.delClass(this._classes.active);
			this.applyHooks("onClick", [ ev ]);
		}).delayed(90, this);
                if (ev) {
                        ev.domStop = true;
                        DlException.stopEventBubbling();
                }
        };

	P._handle_focusKeys = function(ev) {
                var k = ev.keyCode;
                if (k == DlKeyboard.ENTER || ev.charCode == DlKeyboard.SPACE) {
                        this.keyClicked(ev);
                } else if (!this._customMoveKeys && this.__group && k in DlKeyboard.KEYS_MOVE) {
                        var prev = k in DlKeyboard.KEYS_MOVE_PREV, w = prev
                                ? this.__group.getPrevButton(this)
                                : this.__group.getNextButton(this);
                        if (w) {
                                w.focus();
                                if (ev.shiftKey) {
                                        this.checked(true);
                                        w.checked(true);
                                }
                                ev.domStop = true;
                                DlException.stopEventBubbling();
                        }
		}
                BASE._handle_focusKeys.call(this, ev);
	};

        P._handle_accessKey = function(ev) {
                this.focus();
                this.keyClicked(ev);
        };

	P.disabled = function(v, force) {
		if (v != null && v) {
			DC(this.getElement(), this._classes.hover);
			DC(this.getElement(), this._classes.active);
		}
		return BASE.disabled.call(this, v, force);
	};

	P._onChange = function() {
		if (this.__group != null)
			this.__group.applyHooks("onChange", [ this ]);
	};

	P._onCheck = Dynarch.noop;

	P._onDisabled = function(v) {
		CC(this.getElement(), v, this._classes.disabled);
		if (v && this._capture) {
			DlEvent.releaseCapture(this._capture);
			this._capture = null;
		}
	};

	P.initDOM = function() {
		this.registerEvents(DEFAULT_EVENTS);
		BASE.initDOM.call(this);
		this.setUnselectable();
	};

	P._createElement = function() {
		BASE._createElement.call(this);
		this._createLabelElement();
		this.label(this._label, true);
		this._updateState();
	};

	P._setListeners = function() {
		BASE._setListeners.call(this);
		DEFAULT_LISTENERS.r_foreach(function(ev) {
			this.addEventListener(ev, this["_"+ev]);
		}, this);
	};

	P._createLabelElement = Dynarch.noop;

	P.label = function(label, force) {
		if (force || arguments.length > 0 && label !== this._label) {
			// var cls = this._className.peek();
			this._label = label;
                        if (label)
                                label = "<div class='DlButton-Label'>" + this._label + "</div>";
			this.setContent(label);
			// this.condClass(label == "", cls + "-noLabel");
			this.applyHooks("onUpdateLabel", [ this._label ]);
		}
		return this._label;
	};

	P.setLabel = P.label;
	P.getLabel = P.label;

	/* two-state button stuff */

	P.group = function() {
		return this.__group;
	};

	P._checkTwoState = function(nothrow) {
		var cond = this._btnType != TYPE.TWOSTATE;
		if (cond && !nothrow)
			throw new DlExInvalidOperation("This operation is only available for a TWOSTATE button");
		return !cond;
	};

	P._updateState = function() {
		if (this._checkTwoState(true)) {
			var c = this._classes;
			CC(this.getElement(), this._checked, c.checked, c.unchecked);
		}
	};

	P.checked = function(checked, nohooks) {
		this._checkTwoState();
		if (arguments.length > 0) {
			checked = !!checked;
			var diff = !nohooks && (this._checked !== checked);
			this._checked = checked;
			this._updateState();
			if (diff) {
				this.callHooks("onChange");
				this.callHooks(checked ? "onCheck" : "onUncheck");
			}
		}
		return this._checked;
	};

	P.toggle = function(nohooks) {
		this._checkTwoState();
		this.checked(!this._checked, nohooks);
	};

	P.value = function(newval) {
		var oldval = this._value;
		if (arguments.length > 0)
			this._value = newval;
		return oldval;
	};

	P.setValue = P.value;
        P.getValue = P.value;

})();
