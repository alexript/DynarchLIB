// @require container.js

(function(){

	var BASE = DlColorPickerHSV.inherits(DlWidget);
	function DlColorPickerHSV(args) {
		if (args)
			DlWidget.call(this, args);
	};

	eval(Dynarch.EXPORT("DlColorPickerHSV", true));

        var DEFAULT_EVENTS = [ "onSelect", "onHover", "onHoverOut", "onHueChange" ];

        var HTML = String.buffer(
                "<table cellspacing='1' cellpadding='0' border='0'>",
                "<tbody>",
                "<tr>",
                "<td></td>".repeat(11),
                "<td rowspan='11' class='DlColorPickerHSV-Sep'></td>",
                "<td rowspan='11' class='DlColorPickerHSV-HSV' hueCell='1'>",
                "<div class='DlColorPickerHSV-HSV-bar'></div>",
                "</td>",
                "</tr>",
                ("<tr>" + "<td></td>".repeat(11) + "</tr>").repeat(10),
                "</tbody></table>"
        ).get();

	P.getHueBarElement = function() {
		return this.getElement().rows[0].cells[12].firstChild;
	};

	P._createElement = function() {
		BASE._createElement.call(this, HTML);
		this.setUnselectable();
	};

	function getTD(ev) {
		var el = ev.target;
		try {
			while (el && el.tagName.toLowerCase() != "td")
				el = el.parentNode;
		} catch(ex) {
			el = null;
		}
		return el;
	};

	function onMouseUp(ev) {
		var td = getTD(ev);
		if (!td)
			return;
		if (td.rgb) {
			this.applyHooks("onSelect",
					[ td.rgb, td.hsv,
					  td.style.backgroundColor,
					  DlColor.RGBrightness(td.rgb) ]);
		}
		throw new DlExStopEventBubbling;
	};

	function onMouseDown(ev) {
		var td = getTD(ev);
		if (!td)
			return;
		var isHue = td.getAttribute("hueCell");
		if (isHue) {
			ev.computePos(this);
			this._refresh(ev);
			DlEvent.captureGlobals(this._dragHandlers);
		}
		throw new DlExStopEventBubbling;
	};

	function onMouseOver(ev) {
		if (this._currentHover) {
			DC(this._currentHover, "hover1");
			DC(this._currentHover, "hover2");
		}
		var td = getTD(ev);
		if (td) {
			if (td.rgb) {
				this._currentHover = td;
				var br = DlColor.RGBrightness(td.rgb);
				CC(td, br > 0.6, "hover2", "hover1");
				this.applyHooks("onHover", [ td.rgb, td.hsv, td.style.backgroundColor, br ]);
			} else if (this._currentHover) {
				this.callHooks("onHoverOut");
				this._currentHover = null;
			}
		}
	};

	function onMouseLeave() {
		var el = this._currentHover;
		if (el) {
			DC(el, "hover1");
			DC(el, "hover2");
			this.callHooks("onHoverOut");
		}
		this._currentHover = null;
	};

	function stopDrag(ev) {
		DlEvent.releaseGlobals(this._dragHandlers);
		throw new DlExStopEventBubbling;
	};

	function doDrag(ev) {
		var pos = ev.computePos(this);
		var y = pos.y - 2;
		if (y < 0)
			y = 0;
		else if (y > 119)
			y = 119;
 		this.getHueBarElement().style.top = y + "px";
		if (this.__cphsvTimeout)
			clearTimeout(this.__cphsvTimeout);
		this.__cphsvTimeout = this._refresh.$(this, ev).delayed(5);
		throw new DlExStopEventBubbling;
	};

	P.initDOM = function() {
		this.registerEvents(DEFAULT_EVENTS);
		BASE.initDOM.call(this);
		this.addEventListener({ onMouseUp     : onMouseUp,
					onMouseDown   : onMouseDown,
					onMouseOver   : onMouseOver,
					onMouseLeave  : onMouseLeave });
		this._dragHandlers = {
		    onMouseMove  : doDrag.$(this),
		    onMouseUp    : stopDrag.$(this),
		    onMouseOver  : DlException.stopEventBubbling,
		    onMouseOut   : DlException.stopEventBubbling,
		    onMouseEnter : DlException.stopEventBubbling,
		    onMouseLeave : DlException.stopEventBubbling
		};
		this._redraw(360);
	};

	P._refresh = function(ev) {
		var y = Math.limit(ev.relPos.y - 2, 0, 119);
		var hue = Math.round((1 - y / 120) * 360);
		hue = this._redraw(hue);
		this.applyHooks("onHueChange", [ hue ]);
 		this.__cphsvTimeout = null;
	};

	P.setHSV = function(hsv) {
		this._redraw(hsv[0]);
	};

	P._redraw = function(hue) {
		var i, c, j, cells,
			div = this.getHueBarElement(),
			table = this.getElement(),
			rows = table.rows,
			di = rows.length - 1,
			dj = rows[0].cells.length - 3;
		div.style.top = (120 - hue / 3) + "px";
		if (hue == 360)
			hue = 0;
		for (i = di; i >= 0; --i) {
			cells = rows[i].cells;
			for (j = dj; j >= 0; --j) {
				c = cells[j];
				c.hsv = [ hue, 1 - i / di, j / dj ];
				c.rgb = DlColor.HSV2RGB(c.hsv);
				c.style.backgroundColor = DlColor.RGB2color(c.rgb);
			}
		}

		return hue;
	};

})();
