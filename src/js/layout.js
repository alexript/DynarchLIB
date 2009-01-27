// @require container.js

(function() {

	var BASE = DlLayout.inherits(DlContainer);
	function DlLayout(args) {
		if (args) {
			D.setDefaults(this, args);
			DlContainer.call(this, args);
		}
	};

	eval(Dynarch.EXPORT("DlLayout"));

	D.DEFAULT_ARGS = {
		_outerSpace : [ "outerSpace", 0 ],
		_fillParent : [ "fillParent", true ]
	};

	D.setFill = function(widget, fill) {
		var oldfill = widget._dllayout_args.fill;
		widget._dllayout_args.fill = fill;
		if (fill != oldfill)
			widget.parent.doLayout();
	};

	D.getArgs = function(widget) {
		return widget._dllayout_args;
	};

	P._appendWidgetElement = function(w, pos) {
		var div = DynarchDomUtils.createElement("div", null, { className: "DlLayout-positioned" },
							this.getElement());
		if (pos.zIndex)
			div.style.zIndex = pos.zIndex;
		if (pos.overflow)
			div.style.overflow = pos.overflow;
		div.appendChild(w.getElement());
		w._dllayout_args = pos;
	};

	P._removeWidgetElement = function(w) {
		if (this._widgets.contains(w)) {
			var el = w.getElement();
			if (el.parentNode) {
				el.parentNode.parentNode.removeChild(el.parentNode);
				el.parentNode.removeChild(el);
			}
		}
	};

	P.packWidget = function(w, args) {
		this.appendWidget(w, args);
	};

	P.doLayout = function() {
		var full_size = this.getInnerSize();
		var left, right, bottom, top;
		var OS = this._outerSpace;
		function reinit() {
			if (typeof OS == "number")
				left = right = bottom = top = OS;
			else if (OS instanceof Array) {
				top = OS[0];
				right = OS[1];
				bottom = OS[2];
				left = OS[3];
			} else {
				top = OS.top || 0;
				right = OS.right || 0;
				bottom = OS.bottom || 0;
				left = OS.left || 0;
			}
		};
		reinit();
		var wa = this._widgets;
		var info = new Array(wa.length);
		var margins = {};
		for (var i = 0; i < wa.length; ++i) {
			var w = wa[i];
                        if (!w.display())
                                continue;
			var div = w.getElement().parentNode;
			var args = w._dllayout_args;
			var space_before = args.before = args.before || 0;
			var space_after = args.after = args.after || 0;
			var fill = args.fill;
			if (args.resetSize) {
				w.getElement().style.height = "";
				w.getElement().style.width = "";
			}
			var ws = w.getOuterSize();
			switch (args.pos) {
			    case "top":
				top += space_before;
				if (fill == null)
					fill = ws.y;
				info[i] = {
					sy : fill
				};
				if (typeof fill == "number")
					top += fill;
				top += space_after;
				break;

			    case "right":
				right += space_before;
				if (fill == null)
					fill = ws.x;
				info[i] = {
					sx : fill
				};
				if (typeof fill == "number")
					right += fill;
				right += space_after;
				break;

			    case "bottom":
				bottom += space_before;
				if (fill == null)
					fill = ws.y;
				info[i] = {
					sy : fill
				};
				if (typeof fill == "number")
					bottom += fill;
				bottom += space_after;
				break;

			    case "left":
				left += space_before;
				if (fill == null)
					fill = ws.x;
				info[i] = {
					sx : fill
				};
				if (typeof fill == "number")
					left += fill;
				left += space_after;
				break;
			}
			info[i].w = w;
			info[i].args = args;
			info[i].div = div;
		}
		var remaining_x = full_size.x - left - right;
		var remaining_y = full_size.y - top - bottom;
		reinit();
		info.foreach(function(info, i){
                        if (!info)
                                $CONTINUE();
			var args = info.args;
			var w = info.w;
			if (!w.display())
				return;
			switch (args.pos) {
			    case "top":
			    case "bottom":
				if (typeof info.sy != "number") {
					if (info.sy == "*") {
						info.sy = remaining_y;
					} else if (/%/.test(info.sy)) {
						info.sy = Math.floor(parseFloat(info.sy) * remaining_y / 100);
					}
					if (args.min != null && info.sy < args.min)
						info.sy = args.min;
					if (args.max != null && info.sy > args.max)
						info.sy = args.max;
					remaining_y -= info.sy;
				}
				break;

			    case "left":
			    case "right":
				if (typeof info.sx != "number") {
					if (info.sx == "*") {
						info.sx = remaining_x;
					} else if (/%/.test(info.sx)) {
						info.sx = Math.floor(parseFloat(info.sx) * remaining_x / 100);
					}
					if (args.min != null && info.sx < args.min)
						info.sx = args.min;
					if (args.max != null && info.sx > args.max)
						info.sx = args.max;
					remaining_x -= info.sx;
				}
				break;
			}
			function doHAlign() {
			};
			function doVAlign() {
				var y = top;
				var h = full_size.y - top - bottom;
				var s = { x: info.sx };
				switch (args.valign) {
				    case "top":
					break;
				    case "center":
					y += (h - w.getOuterSize().y) / 2;
					break;
				    case "bottom":
					y += h - w.getOuterSize().y;
				    default:
					s.y = h;
				}
				info.div.style.top = y + "px";
				w.setSize(s);
			};
			switch (args.pos) {
			    case "top":
				top += args.before;
				info.div.style.left = left + "px";
				info.div.style.top = top + "px";
				w.setSize({ x: full_size.x - left - right,
					    y: info.sy });
				top += info.sy + args.after;
				break;

			    case "bottom":
				bottom += args.before;
				info.div.style.left = left + "px";
				info.div.style.top = full_size.y - bottom - info.sy + "px";
				w.setSize({ x: full_size.x - left - right,
					    y: info.sy });
				bottom += info.sy + args.after;
				break;

			    case "left":
				left += args.before;
				info.div.style.left = left + "px";
				doVAlign();
				left += info.sx + args.after;
				break;

			    case "right":
				right += args.before;
				info.div.style.left = full_size.x - right - info.sx + "px";
				doVAlign();
				right += info.sx + args.after;
				break;
			}
		});
	};

	// P.__doLayout = P.doLayout; // Grr, see DlContainer /onResize
	P.__doLayout = function() {
		this.doLayout();
	};

	// XXX: this doesn't quite work
	P.sizeToFit = function() {
		var wa = this._widgets;
		var height = 0, width = 0;
		for (var i = 0; i < wa.length; ++i) {
			var w = wa[i];
			var args = w._dllayout_args;
			var ws = w.getOuterSize();
			switch (args.pos) {
			    case "top":
			    case "bottom":
				height += ws.y;
				if (ws.x > width)
					width = ws.x;
				break;
			    case "left":
			    case "right":
				width += ws.x;
				if (ws.h > height)
					height = ws.h;
				break;
			}
			// alert(w.id + " => " + ws.toSource() + "\n\n" + width + "x" + height);
		}
		this.setOuterSize({ x: width, y: height });
	};

})();
