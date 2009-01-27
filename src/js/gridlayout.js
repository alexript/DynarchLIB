// @require layout.js

// @deprecate! I should remove this file; the API is confusing, the name is
//             confusing, not to mention it only works well with FF.

(function() {

	var BASE = DlGridLayout.inherits(DlLayout);
	function DlGridLayout(args) {
		if (args) {
			D.setDefaults(this, args);
			DlLayout.call(this, args);
		}
	};

	eval(Dynarch.EXPORT("DlGridLayout", true));

	D.DEFAULT_ARGS = {
		__layout      : [ "layout", null ],
		__layoutHTML  : [ "layoutHTML", null ],
		__cellSpacing : [ "cellSpacing", 0 ],
		__cellPadding : [ "cellPadding", 1 ]
	};

/*

Format for __layout:

  [ row1, row2, ... ]

Each row:

  {
    props: { minHeight : true ?,
             height : height spec. ?
           },                         (or NULL for all defaults)
    cells: [ cell1, cell2, ... ]
  }

Each cell:

  null: all defaults

  {
    minWidth : true ?
    width    : width spec. ?
    colSpan
    rowSpan
    className
  }

*/

	var CELL_STYLE_PROPS = [
		"width",
		"padding",
		"paddingLeft",
		"paddingRight",
		"paddingTop",
		"paddingBottom",
		"verticalAlign",
		"textAlign",
		"whiteSpace"
	];

	P._createElement = function() {
		BASE._createElement.call(this);
		var table;
		if (!this.__layoutHTML) {
			table = CE("table", null, { cellSpacing: this.__cellSpacing,
						    cellPadding: this.__cellPadding,
						    className: "DlGridLayout-table" });
			CE("tbody", null, null, table);
			var rows = this.__layout;
			rows.foreach(function(row) {
				var row_props = row.props;
				var tr = table.insertRow(-1);
				if (row_props && row_props.minHeight) {
					AC(tr, "DlGridLayout-tr-minHeight");
					tr.minHeight = true;
				}
				row.cells.foreach(function(cell, i) {
					var td = tr.insertCell(-1);
					if (i == 0 && row_props && row_props.height) {
						td.style.height = row_props.height;
					}
					if (cell) {
						if (cell.colSpan)
							td.colSpan = cell.colSpan;
						if (cell.className)
							td.className = cell.className;
						if (cell.rowSpan)
							td.rowSpan = cell.rowSpan;
						if (cell.minWidth)
							AC(td, "DlGridLayout-td-minWidth");
						if (cell.minHeight) {
							td.minHeight = true;
							AC(td, "DlGridLayout-td-minHeight");
						}
						CELL_STYLE_PROPS.r_foreach(function(prop) {
							var val = cell[prop];
							if (val != null)
								this[prop] = val;
						}, td.style);
					}
				});
			});
			// this.setContent(table);
			this.getElement().appendChild(table);
		} else {
			this.setContent(this.__layoutHTML);
			table = this.getElement().getElementsByTagName("table")[0];
		}
		this.refNode("__table", table);
	};

	P._appendWidgetElement = function(w, pos) {
		if (pos.inCell) {
			// request to append the widget directly to a certain cell
			var td = this.getCellElement(pos.row, pos.col);
			td.appendChild(w.getElement());
			w._dllayout_args = pos;
		} else
			BASE._appendWidgetElement.call(this, w, pos);
	};

	P._removeWidgetElement = function(w) {
		if (this._widgets.contains(w)) {
			if (!w._dllayout_args.inCell)
				BASE._removeWidgetElement.call(this, w);
			else {
				var el = w.getElement();
				el.parentNode.removeChild(el);
			}
		}
	};

	P.getTableElement = function() {
		return this.__table;
	};

	P.getCellElement = function(row, col) {
		return this.getTableElement().rows[row].cells[col];
	};

	P.doLayout = function() {
		var wa = this.children();
		(2).times(function(iteration) {
			wa.foreach(function(wid) {
				var pos = wid._dllayout_args;
				if (!pos.inCell) {
					var td = this.getCellElement(pos.row, pos.col);
					var x = td.offsetLeft, y = td.offsetTop;
					var w = td.offsetWidth, h = td.offsetHeight;
					if (iteration == 0) {
						var sz = wid.getOuterSize();
						if ((td.minHeight || td.parentNode.minHeight) && h < sz.y) {
							td.style.height = sz.y + "px";
						}
					} else {
						var div = wid.getElement().parentNode.style;
						div.left = x + "px";
						div.top = y + "px";
						wid.setOuterSize({ x: w, y: h });
					}
				}
			}, this);
		}, this);
	};

	P.showWidgets = function(show) {
		if (arguments.length == 0)
			show = true;
		this.children().r_foreach(function(w) {
			w.display(show);
		});
	};

})();
