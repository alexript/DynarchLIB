// @require widget.js
// @require htmlutils.js
// @require keyboard.js

DEFINE_CLASS("DlRteFrame", DlWidget, function(D, P, DOM) {

        var CE = DOM.createElement,
            AC = DOM.addClass,
            DC = DOM.delClass,
            CC = DOM.condClass,
            ID = DOM.ID;

	var FORWARD_EVENTS = [ "mouseover", "mouseout", "mousemove", "mousedown", "mouseup", "click",
			       "keydown", "keyup", "keypress", "contextmenu" ];

	var BR = is_gecko ? "<br type='_moz' />" : "";

	var INIT_HTML = ( '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" ' +
			  '"http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">' +
			  '<html class="DlRteFrame-HTML">' +
			  '<head><title>DynarchLIB Rich Text Editor</title></head>' +
			  '<body class="DlRteFrame-Body"><p>' + BR + '</p></body></html>' );

        D.BEFORE_BASE = function() {
                this.__eventProxy = eventProxy.$(this);
		this.callUpdateHooks = this.callUpdateHooks.clearingTimeout(40, this);
        };

        D.CONSTRUCT = function() {
                if (this.__sections)
			this.setSections(this.__sections);
        };

        D.DEFAULT_EVENTS = [ "onUpdate", "onSectionChange" ];

	D.DEFAULT_ARGS = {
		__paragraphsMode : [ "useParagraphs" , true ],
		__sections       : [ "sections"      , null ],
                _focusable       : [ "focusable"     , 2 ],
                _tabChar         : [ "tabChar"       , "    " ]
	};

	P.COMMANDS = {
		"backcolor"             : { id: is_ie ? "backcolor" : "hilitecolor" },
		"forecolor"             : { id: "forecolor" },
		"bold"                  : { id: "bold"                   , key: "CTRL 'B'" },
		"italic"                : { id: "italic"                 , key: "CTRL 'I'" },
		"underline"             : { id: "underline"              , key: "CTRL 'U'" },
		"strike"                : { id: "strikethrough"          , key: "CTRL '-'" },
		"subscript"             : { id: "subscript" },
		"superscript"           : { id: "superscript" },
		"removeformat"          : { id: "removeformat"           , key: "ALT-CTRL '0'" },
		"justifyleft"           : { id: "justifyleft"            , key: "ALT-CTRL 'l'" },
		"justifyright"          : { id: "justifyright"           , key: "ALT-CTRL 'r'" },
		"justifycenter"         : { id: "justifycenter"          , key: "ALT-CTRL 'e'" },
		"justifyfull"           : { id: "justifyfull"            , key: "ALT-CTRL 'j'" },
		"orderedlist"           : { id: "insertorderedlist"      , key: "ALT-CTRL 'o'" },
		"unorderedlist"         : { id: "insertunorderedlist"    , key: "ALT-CTRL-SHIFT 'o'" },
		"unorderedlist1"        : { id: "insertunorderedlist"    , key: "ALT-CTRL 'u'" },
		"indent"                : { id: "indent"                 , key: "CTRL '.'" },
		"outdent"               : { id: "outdent"                , key: "CTRL ','" },
		"undo"                  : { id: "undo" },
		"redo"                  : { id: "redo" },
		"<hr>"                  : { id: "inserthorizontalrule"   , key: "CTRL ' '" },
		"<h1>"                  : { id: "formatblock"            , key: "CTRL '1'", arg: "h1" },
		"<h2>"                  : { id: "formatblock"            , key: "CTRL '2'", arg: "h2" },
		"<h3>"                  : { id: "formatblock"            , key: "CTRL '3'", arg: "h3" },
		"<h4>"                  : { id: "formatblock"            , key: "CTRL '4'", arg: "h4" },
		"<h5>"                  : { id: "formatblock"            , key: "CTRL '5'", arg: "h5" },
		"<h6>"                  : { id: "formatblock"            , key: "CTRL '6'", arg: "h6" },
		"<p>"                   : { id: "formatblock"            , key: "CTRL 'm'", arg: "p" },
		"<pre>"                 : { id: "formatblock"            , key: "CTRL-ALT 'n'", arg: "pre" },
		"<address>"             : { id: "formatblock"            , arg: "pre" },
		"<blockquote>"          : { id: "formatblock"            , key: "CTRL 'q'", arg: "blockquote" },

		"_nextSection"          : { id: "_nextSection"           , key: "CTRL ']'" },
		"_prevSection"          : { id: "_prevSection"           , key: "CTRL '['" },

		// tmp
		"showHtml"              : { id: "showHtml"               , key: "CTRL-ALT-SHIFT 'h'" }
	};

	var FORMATBLOCK_TAGS = "h1 h2 h3 h4 h5 h6 p pre address blockquote".hashWords();

	P.SEMANTIC_TAGS = {
		"bold"	        : true,
		"italic"        : true,
		"strike"        : true,
		"subscript"     : true,
		"superscript"   : true,
		"indent"        : true,
		"underline"     : true,
		"outdent"       : true,
		"strikethrough" : true,
		"strike"        : true
	};

	P.callUpdateHooks = function(dev, ev) {
		if (!this.destroyed)
			this.applyHooks("onUpdate", [ dev, ev ]);
	};

	P.execCommand = function(cmd, param) {
		this.focus();
		var ret;
		var doc = this.getIframeDoc();
		if (is_gecko)
			doc.execCommand("styleWithCSS", false, !(cmd in this.SEMANTIC_TAGS));
		if (this.COMMANDS[cmd]) {
			cmd = this.COMMANDS[cmd];
			if (typeof param == "undefined")
				param = cmd.arg || "";
			cmd = cmd.id;
		}
		if (cmd == "formatblock") {
                        if (is_ie) {
                                // if we're in a <pre> block already,
                                // IE (Opera too, but we don't handle
                                // it for now) creates a horrible mess
                                // out of its content.
                                var h = this.getAncestorsHash();
                                if (h.pre) {
                                        if (param == "pre") {
                                                // <pre> already, move on.
                                                return;
                                        }
                                        var sel = this.getSelection(), r = this.getRange(sel);
                                        var r2 = this.createRange();
                                        r2.moveToElementText(h.pre);
                                        r.setEndPoint("EndToEnd", r2);
                                        r.select();
                                        var newEl, newElHtml = String.buffer("<", param, ">dummy</", param, ">").get();
                                        if (r.compareEndPoints("StartToStart", r2) == 0) {
                                                // easiest
                                                h.pre.insertAdjacentHTML("beforeBegin", newElHtml);
                                                newEl = h.pre.previousSibling;
                                        } else {
                                                var html = r.htmlText, text = r.text;
                                                // there might be a newline just before us, we should drop it.
                                                r.moveStart("character", -1);
                                                if (r.text.charAt(0) != text.charAt(0))
                                                        r.moveStart("character", 1);
                                                h.pre.insertAdjacentHTML("afterEnd", "<br />");
                                                r.pasteHTML("");
                                                h.pre.parentNode.removeChild(h.pre.nextSibling);
                                                h.pre.insertAdjacentHTML("afterEnd", newElHtml);
                                                newEl = h.pre.nextSibling;
                                                if (/\S/.test(text)) {
                                                        var p2 = h.pre.cloneNode(true);
                                                        p2.innerHTML = html;
                                                        newEl.parentNode.insertBefore(p2, newEl.nextSibling);
                                                }
                                        }
                                        r.moveToElementText(newEl);
                                        r.collapse();
                                        r.select();
                                        newEl.innerHTML = ""; // remove "dummy".
                                        return;
                                }
                                param = "<" + param + ">";
                        }
                        // if (is_gecko && param == "p") {
                        //         cmd = "insertParagraph";
                        //         param = null;
                        // }
                }
		switch (cmd) {
		    case "showHtml":
			try {
				alert(this.getHTML());
			} catch(ex) {
				alert("ERROR: " + ex);
			}
			break;
		    case "_nextSection":
			this.nextSection();
			break;
		    case "_prevSection":
			this.prevSection();
			break;
		    default:
			ret = doc.execCommand(cmd, false, param);
		}
		this.focus();
		this.callUpdateHooks();
		return ret;
	};

	P.queryCommandState = function(cmd) {
		if (this.COMMANDS[cmd])
			cmd = this.COMMANDS[cmd].id;
		return this.getIframeDoc().queryCommandState(cmd);
	};

	P.queryCommandValue = function(cmd) {
		if (this.COMMANDS[cmd])
			cmd = this.COMMANDS[cmd].id;
		if (!is_gecko && /^formatblock$/i.test(cmd)) {
			// only Gecko does this correctly; I wonder when it'll break.
			var a = this.getAllAncestors();
			for (var i = 0; i < a.length; ++i) {
				var tag = a[i].tagName.toLowerCase();
				if (tag in FORMATBLOCK_TAGS)
					return tag;
			};
		}
		return this.getIframeDoc().queryCommandValue(cmd);
	};

	P.getInnerHTML = function() {
		return this.getIframeBody().innerHTML;
	};

	P.getHTML = function(withMeta) {
                if (!is_ie) {
                        this.collapse(true);
                        var caret = this.getIframeDoc().createElement("span");
                        caret.id = "DYNARCHLIB_RTEFRAME_CARET";
                        this.insertNode(caret);
                }
                var html = DlHtmlUtils.getHTML(this.getIframeBody(), false, withMeta);
                if (!is_ie)
                        this.deleteNode(caret);
                return html;
	};

	P.getInnerText = function() {
		return DlHtmlUtils.getInnerText(this.getIframeBody());
	};

	P.getText = function() {
		return DlHtmlUtils.getText(this.getIframeBody());
	};

	// BEGIN: crappy code.  Use a hash instead to store sections
	// (or better, both a hash and an array).  Minimize the number
	// of places where we call setHTML and getHTML.

	P.setSections = function(sec) {
		this.__sections = sec;
		var h = this.__sectionsHash = {};
		sec.foreach(function(s, i) {
			s.index = i;
			h[s.name] = s;
			if (s.current || i == 0) {
				this.__currentSection = i;
				this.setHTML(s.content);
			}
		}.$(this));
	};

	P.setSectionContent = function(name, html) {
		var s = this.getSection(name, true);
		s.content = html;
		if (s.index == this.__currentSection)
			this.setHTML(html);
	};

	P.getSections = function() {
		var tmp = this.getHTML(true);
		Object.merge(this.getCurrentSection(), tmp);
		return this.__sectionsHash;
	};

	P.getSection = function(name, noSetContent) {
		var sec = this.__sectionsHash[name];
		if (sec.index == this.__currentSection && !noSetContent) {
			var tmp = this.getHTML(true);
			Object.merge(sec, tmp);
		}
		return sec;
	};

	P.getCurrentSection = function() {
		return this.__sections[this.__currentSection];
	};

	P._setCurrentSection = function(newsec) {
		var oldsec = this.getCurrentSection();
		if (oldsec !== newsec) {
			var tmp = this.getHTML(true);
			Object.merge(oldsec, tmp);
			this.__currentSection = newsec.index;
			this.setHTML(newsec.content);
			this.applyHooks("onSectionChange", [ oldsec, newsec ]);
		}
	};

	P.setCurrentSection = function(name) {
		var newsec = this.__sectionsHash[name];
		this._setCurrentSection(newsec);
	};

	P.setCurrentSectionIndex = function(idx) {
		if (idx != this.__currentSection) {
			var newsec = this.__sections[idx];
			this._setCurrentSection(newsec);
		}
	};

	P.prevSection = function() {
		this.setCurrentSectionIndex(this.__sections.rotateIndex(this.__currentSection - 1));
	};
	P.nextSection = function() {
		this.setCurrentSectionIndex(this.__sections.rotateIndex(this.__currentSection + 1));
	};

	// END: crappy code

//  	var CONTEXT_MENU = null;
// 	function getContextMenu(args) {
//  		if (!CONTEXT_MENU) {
//  			CONTEXT_MENU = new DlVMenu({});
//  			new DlMenuItem({ parent: CONTEXT_MENU, label: "Foo on " + args.ev.origTarget.tagName });
//  			new DlMenuItem({ parent: CONTEXT_MENU, label: "Bar" });
//  			new DlMenuItem({ parent: CONTEXT_MENU, label: "Baz" });
//  		}
//  		return CONTEXT_MENU;
// 		return null;
// 	};

	P._setListeners = function() {
		D.BASE._setListeners.call(this);
		this.addEventListener(is_ie ? "onKeyDown" : "onKeyPress", function(ev) {
                        this._onKeypress(ev)
                });
		this.addEventListener({ onDestroy : onDestroy });
		// this.setContextMenu(getContextMenu.$(this));
	};

	P._createElement = function() {
		D.BASE._createElement.call(this);
		var iframe = CE("iframe",
                                { display: 'block' },
			        { frameBorder: 0, marginHeight: 0, marginWidth: 0,
			          src : is_ie ? "javascript:'';" : "about:blank" },
				this.getElement());
		this.__hasFrameEvents = false;
		this.updateKeymap();
	};

	P.updateKeymap = function() {
		var keymap = this.__rte_keymap = [];
		for (var i in this.COMMANDS) {
			var cmd = this.COMMANDS[i];
			if (cmd.key)
				keymap.push([ DlKeyboard.parseKey(cmd.key), i ]);
		}
	};

	P.setOuterSize = P.setSize = function(s) {
		var pb1 = DOM.getBorder(this.getElement());
		var pb2 = DOM.getBorder(this.getContentElement());
		this.setInnerSize({ x: s.x - pb1.x - pb2.x, y: s.y - pb1.y - pb2.y });
	};

	P.getIframeElement = function() {
		return this.getElement().firstChild;
	};

	P.getContentElement = P.getIframeElement; // ALIAS

	P.getIframeWin = function() {
		return this.getIframeElement().contentWindow;
	};

	P.getIframeDoc = function() {
		return this.getIframeWin().document;
	};

	P.getIframeBody = function() {
		return this.getIframeDoc().body;
	};

	P.initDesignMode = function(callback) {
		var doc = this.getIframeDoc();
		doc.open();
		doc.write(INIT_HTML);
		doc.close();
		doc.designMode = "on";
		if (!this.__hasFrameEvents)
			addIframeEvents.delayed(5, this, callback);
	};

	P.setHTML = function(html) {
		if (html instanceof Array)
			html = html.join("");
		html = html.trim();
		if (this.__hasFrameEvents) {
                        if (is_ie) {
                                // IE messes out white-space in <pre> tags.
                                // the only decent solution I've found is to parse the HTML
                                // and insert nonbreakable spaces inside <pre>-s.
                                html = html.replace(/(<pre[^>]*>)((.|\n)+?)(<\x2fpre>)/gi, function(s, p1, p2, p3, p4) {
                                        p2 = p2.replace(/\x20/g, "\xA0").replace(/\t/g, "\xA0".repeat(4));
                                        return p1 + p2 + p4;
                                });
                        }
			this.getIframeBody().innerHTML = html;
			this._onSetHTML();
			this.moveBOF();
			this.callUpdateHooks();
		} else
			this.__pendingHTML = html;
	};

	P._onSetHTML = function() {
		var pres = this.getIframeDoc().getElementsByTagName("pre");
		for (var i = pres.length; --i >= 0;) {
			var pre = pres[i];
			pre.innerHTML = pre.innerHTML.replace(/\n/g, "<br>");
		}
                if (!is_ie) {
                        var caret = this.getIframeDoc().getElementById("DYNARCHLIB_RTEFRAME_CARET");
                        if (caret) (function(caret){
                                try {
                                        this.selectNodeContents(caret);
                                        this.collapse(true);
                                        this.deleteNode(caret);
                                } catch(ex) {};
                        }).delayed(10, this, caret);
                }
	};

	P.clear = function() {
		this.setHTML("");
	};

	P.focus = function() {
		this.getIframeWin().focus();
                D.BASE.focus.call(this);
	};

        // causes problems in both IE and Opera
//         P.blur = function() {
//                 this.getIframeWin().blur();
//                 BASE.blur.call(this);
//         };

	P.loadStyle = function(css) {
		var doc = this.getIframeDoc();
		var id = css.replace(/\x2f/g, "_");
		if (!doc.getElementById(id)) {
			var head = doc.getElementsByTagName("head")[0];
			var link = doc.createElement("link");
			link.type = "text/css";
			link.rel = "stylesheet";
			link.href = css;
			link.id = id;
			head.appendChild(link);
			// The Magic Gecko Hack
			link.disabled = true;
			link.disabled = false;
		}
	};

	P.createRange = function() {
		return is_ie
			? this.getIframeBody().createTextRange()
			: this.getIframeDoc().createRange();
	};

	P.getSelection = function() {
		return is_ie
			? this.getIframeDoc().selection
			: this.getIframeWin().getSelection();
	};

	P.getRange = function(sel) {
		if (sel == null)
			sel = this.getSelection();
		return is_ie
			? sel.createRange()
			: sel.getRangeAt(0);
	};

	// FIXME: this has been copied from HTMLArea almost literally; it might
	// not be as good as we want.
	P.getParentElement = function() {
		var sel = this.getSelection();
		var range = this.getRange(sel);
		if (is_ie) {
			switch (sel.type) {
			    case "Text":
			    case "None":
				return range.parentElement();
			    case "Control":
				return range.item(0);
			    default:
				// return this._doc.body;
				return null;
			}
		} else try {
			var p = range.commonAncestorContainer;
			if (!range.collapsed && range.startContainer == range.endContainer &&
			    range.startOffset - range.endOffset <= 1 && range.startContainer.hasChildNodes())
				p = range.startContainer.childNodes[range.startOffset];
			while (p.nodeType == 3)
				p = p.parentNode;
			return p;
		} catch(ex) {
			return null;
		}
	};

	P.getAllAncestors = function() {
		var p = this.getParentElement();
		if (p && p.nodeType == 1)
			p = this.getParentElement();
		var body = this.getIframeBody();
		var a = [];
		while (p && p !== body && p.nodeType == 1) {
			a.push(p);
			p = p.parentNode;
		}
		a.push(body);
		return a;
	};

	P.getAncestorsHash = function() {
		var p = this.getAllAncestors(), el, i, tn, pnodes = { __all: p };
		p.foreach(function(el) {
			tn = el.tagName.toLowerCase();
			if (!pnodes[tn])
				pnodes[tn] = el;
		});
		return pnodes;
	};

	P.getSelectedText = function() {
		var range = this.getRange();
		return is_ie ? range.text : range.toString();
	};

	P.selectRange = function(range) {
		if (is_ie)
			range.select();
		else {
			var sel = this.getSelection();
			sel.removeAllRanges();
			sel.addRange(range);
		}
	};

	P.isCollapsed = function() {
		var r = this.getRange();
		return is_w3
			? r.collapsed
			: r.compareEndPoints("StartToEnd", r) == 0;
	};

	P.collapse = function(toStart) {
		var sel = this.getSelection();
		var r = this.getRange(sel);
		if (is_w3)
			sel.removeAllRanges();
		r.collapse(!!toStart);
		this.selectRange(r);
	};

	P.insertNode = function(node, select) {
		var sel = this.getSelection(), r = this.getRange(sel);
		if (is_w3) {
			r.deleteContents();
			r.insertNode(node);
			if (select) {
				sel.removeAllRanges();
				r.selectNode(node);
				sel.addRange(r);
			}
		} else {
			var id = ID("rteframe");
			r.pasteHTML([ "<span id='", id, "'></span>" ].join(""));
			var el = this.getIframeDoc().getElementById(id);
			el.parentNode.insertBefore(node, el);
			el.parentNode.removeChild(el);
			if (select && node.nodeType != 3 /* IE fails here for text nodes */) {
				r.moveToElementText(node);
				r.select();
			}
		}
		return node;
	};

        P.insertText = function(str, select) {
		var node = this.getIframeDoc().createTextNode(str);
		return this.insertNode(node, select);
	};

	P.selectNodeContents = function(node) {
		var r = this.createRange();
		is_w3
			? r.selectNodeContents(node)
			: r.moveToElementText(node);
		this.selectRange(r);
	};

        P.selectNode = function(node) {
                if (is_w3) {
                        var r = this.createRange();
                        r.selectNode(node);
                        this.selectRange(r);
                } else
                        this.selectNodeContents(node);
        };

	P.createLink = function(url, text) {
		var tmp, as, link, i;
		if (text)
			this.insertText(text, true);
		tmp = "javascript:" + ID("link");
		this.execCommand("createlink", tmp);
		as = this.getIframeDoc().getElementsByTagName("a");
		for (i = as.length; --i >= 0;)
			if (as[i].href == tmp) {
				link = as[i];
				break;
			}
		link.href = url;
		return link;
	};

	P.createAnchor = function(name) {
		var text = this.getSelectedText() ? null : "Anchor";
		var link = this.createLink("#", text);
		link.removeAttribute("href");
		AC(link, text ? "DlAnchor-Empty" : "DlAnchor");
		link.setAttribute("name", name);
		if (text)
			link.innerHTML = "";
		return link;
	};

	P.getAnchors = function() {
		var as = this.getIframeDoc().getElementsByTagName("a"), i = as.length, a, ret = [];
		while (--i >= 0) {
			a = as[i];
			if (a.name)
				ret.unshift(a);
		}
		return ret;
	};

	P.unlink = function() {
		this.execCommand("unlink");
	};

	P.getSelectedImage = function() {
		var img = this.getParentElement();
		if (img && !/^img$/i.test(img.tagName))
			img = null;
		return img;
	};

	P.insertImage = function(params) {
		var img = this.getSelectedImage();
		// if (!img) {
		// 	// FIXME: THIS SUCKS
		// 	var sel = this.getSelection();
		// 	var range = this.getRange(sel);
		// 	this.execCommand("insertimage", params.url);
		// 	if (is_ie) {
		// 		img = range.parentElement();
		// 		if (img.tagName.toLowerCase() != "img")
		// 			img = img.previousSibling;
		// 	} else {
		// 		range = this.getRange();
                //                 var offset = range.startOffset - 1;
                //                 if (is_opera)
                //                         offset++;
		// 		img = range.startContainer.childNodes[offset];
		// 	}
		// } else {
		// 	img.src = params.url;
		// }

                if (!img) {
                        var tmp = "javascript:" + ID("img"), as, i;
                        this.execCommand("insertimage", tmp);
                        as = this.getIframeDoc().getElementsByTagName("img");
                        for (i = as.length; --i >= 0;)
                                if (as[i].src == tmp) {
                                        img = as[i];
                                        break;
                                }
                }
                img.src = params.url;

		if (params.width)
			img.width = params.width;
		if (params.height)
			img.height = params.height;
		if (params.align)
			img.align = params.align;
		if (params.alt)
			img.alt = params.alt;

		if (params.marginLeft)
			img.style.marginLeft = params.marginLeft;
		if (params.marginTop)
			img.style.marginTop = params.marginTop;
		if (params.marginRight)
			img.style.marginRight = params.marginRight;
		if (params.marginBottom)
			img.style.marginBottom = params.marginBottom;

		return img;
	};

	P.moveBOF = function(pos) {
		var body = this.getIframeBody(), sel, r;
		var el = pos ? body.lastChild : body.firstChild;
		if (!el)
			return;
		if (is_w3) {
                        r = this.getRange(sel = this.getSelection());
			sel.removeAllRanges();
			if (el.nodeType == 1)
				r.selectNodeContents(el);
			else
				r.selectNode(el);
			r.collapse(!pos);
			sel.addRange(r);
		} else {
                        r = body.createTextRange();
 			r.collapse(!pos);
                        r.select();
		}
	};

	P.moveEOF = function(pos) {
		return this.moveBOF(!pos);
	};

	P.setParagraphsMode = function(mode) {
		this.__paragraphsMode = mode;
	};

	// This returns "true" if after the operation the element has
	// the specified class name, false if it doesn't, or null if a
	// parent with the given tagName could not be found.
	P.addBlockClass = function(tagName, className, toggle) {
		var el = this.getAncestorsHash()[tagName];
		if (el) {
			if (DOM.hasClass(el, className)) {
				if (toggle) {
					DOM.delClass(el, className);
					return false;
				}
			} else {
				DOM.addClass(el, className);
			}
			return true;
		}
		return null;
	};

	P.canDeleteFullNode = function(el) {
		return DlHtmlUtils.canDeleteFullNode(el.tagName);
	};

	P.canDeleteContent = function(el) {
		return DlHtmlUtils.canDeleteContent(el.tagName);
	};

	P.canStripNode = function(el) {
		return DlHtmlUtils.canStripNode(el.tagName);
	};

	P.deleteNodeContents = function(el) {
		el.innerHTML = DlHtmlUtils.isBlockElement(el) ? BR : ""; // ;-)
	};

	P.deleteNode = function(el) {
		el.parentNode.removeChild(el);
	};

	P.stripNode = function(el) {
		var df = el.ownerDocument.createDocumentFragment();
		// var first = el.firstChild;
		while (el.firstChild)
			df.appendChild(el.firstChild);
		el.parentNode.insertBefore(df, el);
		el.parentNode.removeChild(el);
		this.callUpdateHooks();
	};

	function removeBR(el) {
		if (el.lastChild.nodeType == 1 && el.lastChild.tagName.toLowerCase() == "br")
			el.removeChild(el.lastChild);
	};

	// make sure we keep HTML nicely stored in paragraphs
        // XXX: this code is a mess!  But then, so is Firefox's HTML editing component.
	function handleEnter() {
		if (!this.__paragraphsMode)
			return;
		var anc = this.getAncestorsHash(), doit = true, doc = this.getIframeDoc();

                var sel = this.getSelection();
                var sel_range = this.getRange(sel);

                var el_li = anc.li || anc.dd;
                var el_p = anc.p;
                if (el_li) {
                        var r1 = this.createRange();
                        r1.selectNodeContents(el_li);
                        var r2;

                        var has_text = /\S/.test(r1.toString());
                        if (el_p && has_text) {
                                sel.removeAllRanges();
                                /* there's text in this list element
                                   we have 3 cases: (| symbolizes the caret, "..." is text or nothing)

                                   1. <li> ... <p> | ... </p> ... </li>
                                   2. <li> ... <p> ... | ... </p> ... </li>
                                   3. <li> ... <p> ... | </p> ... </li>

                                   whitespace MUST be ignored.
                                */

                                // check for case 1.
                                r2 = sel_range.cloneRange();
                                r2.setStartBefore(el_p.firstChild);
                                if (!/\S/.test(r2.toString())) {
                                        // check if it's the first paragraph
                                        var first = true;
                                        var tmp = el_p.previousSibling;
                                        while (tmp) {
                                                if (tmp.nodeType == 1) {
                                                        first = false;
                                                        break;
                                                }
                                                tmp = tmp.previousSibling;
                                        }
                                        if (first) {
                                                var li = el_li.cloneNode(false);
                                                r2.setStartBefore(el_li);
                                                r2.insertNode(li);
                                                r2.selectNodeContents(li);
                                                sel.addRange(r2);
                                                this.execCommand("<p>");
                                                return true;
                                        } else {
                                                // is it empty?
                                                r1.selectNodeContents(el_p);
                                                if (!/\S/.test(r1.toString())) {
                                                        // empty -- create new LI
                                                        r2 = sel_range.cloneRange();
                                                        r2.setStartBefore(el_p);
                                                        r2.setEndAfter(el_li);
                                                        var df = r2.extractContents();
                                                        var li = df.firstChild;
                                                        r2.insertNode(df);
                                                        r2.selectNodeContents(li.firstChild || li);
                                                        r2.collapse(true);
                                                        sel.addRange(r2);
                                                        this.execCommand("<p>");
                                                        return true;
                                                } else {
                                                        // must insert paragraph before it inside the same item
                                                        var p = el_p.cloneNode(false);
                                                        r2.setStartBefore(el_p);
                                                        r2.insertNode(p);
                                                        r2.selectNodeContents(p);
                                                        sel.addRange(r2);
                                                        this.execCommand("<p>");
                                                        return true;
                                                }
                                        }
                                }

                                // check for case 3.
                                r2 = sel_range.cloneRange();
                                r2.setEndAfter(el_p.lastChild);
                                if (!/\S/.test(r2.toString())) {
                                        // case 3 -- insert new <p> inside the same item
                                        var p = el_p.cloneNode(false);
                                        r2.setEndAfter(el_p);
                                        r2.collapse(false);
                                        r2.insertNode(p);
                                        r2.selectNodeContents(p);
                                        sel.addRange(r2);
                                        this.execCommand("<p>");
                                        return true;
                                }

                                // case 2 -- must split the paragraph
                                r2 = sel_range.cloneRange();
                                r2.setEndAfter(el_p);
                                var df = r2.extractContents();
                                r2.collapse(false);
                                var p = df.firstChild;
                                r2.insertNode(df);
                                r2.selectNodeContents(p);
                                r2.collapse(true);
                                sel.addRange(r2);
                                return true;

                        } else if (!has_text) {
                                sel.removeAllRanges();
                                var ul = el_li.parentNode;
                                r2 = sel_range.cloneRange();
                                r2.selectNode(ul);
                                r2.setStartAfter(el_li);
                                var df = r2.extractContents();
                                ul.removeChild(el_li);
                                var p = doc.createElement("p");
                                df.insertBefore(p, df.firstChild);
                                r2.setEndAfter(ul);
                                r2.collapse(false);
                                r2.insertNode(df);
                                r2.selectNodeContents(p);
                                r2.collapse(true);
                                sel.addRange(r2);
                                this.execCommand("<p>");
                                return true;
                        }
                } else {
                        var el_pre = anc.pre;
                        if (el_pre) {
                                sel.removeAllRanges();
                                r2 = sel_range.cloneRange();

                                // keep indentation
                                var indent = "";
                                var node = r2.startContainer;
                                if (node == el_pre)
                                        node = node.childNodes[r2.startOffset];
                                while (node && node.parentNode != el_pre)
                                        node = node.parentNode;
                                if (node) {
                                        // search the <br>
                                        while (node && !/^br$/i.test(node.tagName))
                                                node = node.previousSibling;
                                        node = node ? node.nextSibling : el_pre.firstChild;
                                        while (node && node.nodeType != 3)
                                                node = node.firstChild;
                                        if (node && /^(\s+)/.test(node.data))
                                                indent = RegExp.$1;
                                }
                                // insert newline now
                                var df = doc.createDocumentFragment();
                                var br = doc.createElement("br");
                                df.appendChild(br);
                                if (indent) {
                                        br = doc.createTextNode(indent);
                                        df.appendChild(br);
                                }
                                r2.insertNode(df);
                                r2.setEndAfter(br);
                                r2.collapse(false);
                                sel.addRange(r2);
                                return true;
                        }
                }

                var el_head = anc.h6 || anc.h5 || anc.h4 || anc.h3 || anc.h2 || anc.h1;

                if (el_head) {
                        var r1 = sel_range.cloneRange();
                        r1.setEndAfter(el_head);
                        if (!/\S/.test(r1.toString())) {
                                sel.removeAllRanges();
                                r1.collapse(false);
                                var p = this.getIframeDoc().createElement("p");
                                r1.insertNode(p);
                                r1.selectNodeContents(p);
                                r1.collapse(true);
                                sel.addRange(r1);
                                this.execCommand("<p>");
                                return true;
                        }
                }
















                /*
                //var force = /^p$/i.test(t1.tagName) && /^(dd|li)$/i.test(t2.tagName);
                if (t1 && t2) {
                        // We like to treat this special case differently.  If
                        // we have a <p> inside a <li>, it usually means that
                        // the end user wants to type more paragraphs into a
                        // list item--therefore, upon ENTER, we insert another
                        // paragraph, breaking the list only if ENTER is
                        // pressed in an empty paragraph.
                        var r1 = this.createRange();
                        r1.selectNodeContents(t1);
                        if (/\S/.test(r1.toString())) {
                                //removeBR(t1);
                                var sel = this.getSelection();
                                var r2 = this.getRange(sel);
                                sel.removeAllRanges();
                                r2.setEndAfter(t1);
                                if (r1.toString() != r2.toString()) {
                                        var df = r2.extractContents();
                                        var p = df.firstChild;
                                        r2.collapse(false);
                                        r2.insertNode(df);
                                        p.normalize();
                                        r2.selectNodeContents(p);
                                        if (r2.toString() == "") {
                                                p.innerHTML = BR;
                                                r2.selectNodeContents(p);
                                        }
                                        r2.collapse(true);
                                        sel.addRange(r2);
                                        if (is_gecko)
                                                p.scrollIntoView(false);
                                        throw new DlExStopFrameEvent;
                                } else {
                                        doit = false;
                                        r2.collapse(true);
                                        sel.addRange(r2);
                                }
                        } else if (t2.getElementsByTagName("p").length == 1) {
                                t1.parentNode.removeChild(t1);
                                doit = false;
                        } else
                                return true;
                } else if (t1) {
                        var sel = this.getSelection();
                        var r = this.getRange(sel);
                        if (r.startContainer == t1 /* && r.startOffset == t1.childNodes.length && r.collapsed *) {
                                // Gecko persistently inserts a <br>
                                var p = this.getIframeDoc().createElement("p");
                                p.innerHTML = BR;
                                t1.parentNode.insertBefore(p, t1.nextSibling);
                                r.selectNodeContents(p);
                                r.collapse(true);
                                sel.removeAllRanges();
                                sel.addRange(r);
                                if (is_gecko)
                                        p.scrollIntoView(false);
                                throw new DlExStopFrameEvent;
                        }
                }

		if (!force && doit)
			for (var tag in anc) {
				if (!/^(span|div|body|__all)$/i.test(tag)) {
					doit = false;
					break;
				}
			}
		if (doit) {
			this.execCommand("<p>");
			if (!handleList) {
				// Firefox consistently inserts a <br>
				// if you press ENTER in a <hX> tag
				anc = this.getAncestorsHash();
				var el = anc.p.nextSibling;
				if (el && el.tagName.toLowerCase() == "br")
					el.parentNode.removeChild(el);
			}
		}
		return false;
 */
	};

	P._onKeypress = function(ev) {
                var key = ev.keyCode;
		// FIXME: we should try this for other browsers as well (!is_ie)
		if (is_gecko && !ev.shiftKey && !ev.ctrlKey && !ev.altKey && key == DlKeyboard.ENTER) {
			// this keypress is quite a mess
                        if (handleEnter.call(this))
                                throw new DlExStopFrameEvent;
		}
		this.__rte_keymap.r_foreach(function(kc) {
			if (DlKeyboard.checkKey(ev, kc[0])) {
				this.execCommand(kc[1]);
				throw new DlExStopFrameEvent;
			}
		}, this);
                if (key == DlKeyboard.TAB) {
                        var tag = this.queryCommandValue("formatblock");
                        if (tag == "pre") {
                                this.insertText(this._tabChar, true);
                                this.collapse(false);
                                throw new DlExStopFrameEvent;
                        }
                } else if (key == DlKeyboard.ENTER && is_ie && !ev.shiftKey) {
                        // IE is so unbelievably stupid as to
                        // actually duplicate a <pre> tag when
                        // you press ENTER, or insert <p> tags
                        // into it.
                        var tag = this.queryCommandValue("formatblock");
                        if (tag == "pre") {
                                var sel = this.getSelection(), r = this.getRange(sel);
                                // The only magical hack (TM) that I could discover.  It works flawless.
                                r.pasteHTML("<br/><div class='DynarchLIB-REMOVE-ME'></div>");
                                throw new DlExStopFrameEvent;
                        }
                }
	};

	function eventProxy(ev) {
		ev || (ev = this.getIframeWin().event);
		var dev = new DlEvent(ev);
		if (dev.type == "oncontextmenu")
			DOM.stopEvent(ev);
		dev.origTarget = dev.target;
		var p1 = dev.origPos = dev.pos;
		var p2 = DOM.getPos(this.getIframeElement());
		dev.pos = { x: p1.x + p2.x, y: p1.y + p2.y };
		// dev.origRelatedTarget = dev.relatedTarget;
		dev.target = this.getElement();
		try {
			DlEvent._genericEventHandler(dev, ev);
		} catch(ex) {
			if (ex instanceof DlExStopFrameEvent)
				DOM.stopEvent(ev);
		}
		if (/onMouseDown|onMouseUp|onKey/.test(dev.dl_type))
			this.callUpdateHooks(dev, ev);
	};

	function addIframeEvents(callback) {
		var doc = this.getIframeDoc();
		this.__hasFrameEvents = true;
		DOM.addEvents(doc, FORWARD_EVENTS, this.__eventProxy);
		if (this.__pendingHTML) {
			this.getIframeBody().innerHTML = this.__pendingHTML;
			this._onSetHTML();
			this.moveBOF();
			this.__pendingHTML = null;
		}
		this.__rte_onFocus = onFocus.$(this);
		this.__rte_onBlur = onBlur.$(this);
		if (is_ie) {
			doc = this.getIframeElement();
			doc.onfocus = this.__rte_onFocus;
		} else {
			DOM.addEvent(doc, "focus", this.__rte_onFocus);
		}
		doc.onblur = this.__rte_onBlur;
		if (callback)
			callback.call(this);
	};

	// not sure if this helps, but I am willing to sacrifice a few
	// bytes hoping that buggy browsers will produce less memory
	// leaks
	function onDestroy() {
		var doc = this.getIframeDoc();
		DOM.removeEvents(doc, FORWARD_EVENTS, this.__eventProxy);
		if (is_ie) {
			doc = this.getIframeElement();
			delete doc["onfocus"];
			doc.onfocus = null;
		} else {
			DOM.removeEvent(doc, "focus", this.__rte_onFocus);
		}
		delete doc["onblur"];
		doc.onblur = null;
	};

	function onFocus() {
		AC(this.getIframeDoc().documentElement, "DlRteFrame-Focused");
		D.BASE.focus.call(this);
	};

	function onBlur() {
		DC(this.getIframeDoc().documentElement, "DlRteFrame-Focused");
		D.BASE.blur.call(this, true);
	};

});
