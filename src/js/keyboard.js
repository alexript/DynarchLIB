var DlKeyboard = {

	BACKSPACE   : 8,
	TAB         : 9,
	ENTER       : 13,
	ESCAPE      : 27,
        SPACE       : 32,
        DASH        : 45,
	PAGE_UP     : 33,
	PAGE_DOWN   : 34,
	END         : 35,
	HOME        : 36,
	ARROW_LEFT  : 37,
	ARROW_UP    : 38,
	ARROW_RIGHT : 39,
	ARROW_DOWN  : 40,
        INSERT      : 45,
	DELETE      : 46,
        F1          : 112,
        F2          : 113,
        F3          : 114,
        F4          : 115,
        F5          : 116,
        F6          : 117,
        F7          : 118,
        F8          : 119,
        F9          : 120,
        F10         : 121,
        F11         : 122,
        F12         : 123,

	parseKey : function(str) {
		var o = {}, m;
                str = str.toUpperCase();
		if ((m = /^([a-z]+)\s+\x27(.)\x27$/i.exec(str))) {
			o[m[1]] = true;
			o.key = m[2];
		} else if ((m = /^([a-z]+)-([a-z]+)\s+\x27(.)\x27$/i.exec(str))) {
			o[m[1]] = o[m[2]] = true;
			o.key = m[3];
		} else if ((m = /^([a-z]+)-([a-z]+)-([a-z]+)\s+\x27(.)\x27$/i.exec(str))) {
			o[m[1]] = o[m[2]] = o[m[3]] = true;
			o.key = m[4];
		}
		return o;
	},

        checkKey : function(ev, k) {
                if (typeof k == "string")
                        k = DlKeyboard.parseKey(k);
                return ( ((!k.CTRL  && !ev.ctrlKey)   ||  (k.CTRL    && ev.ctrlKey)) &&
			 ((!k.ALT   && !ev.altKey)    ||  (k.ALT     && ev.altKey)) &&
			 ((!k.SHIFT && !ev.shiftKey)  ||  (k.SHIFT   && ev.shiftKey)) &&
			 ev.keyStr.toUpperCase() == k.key.toUpperCase() );
        }

};

DlKeyboard.KEYS_CONTROL = [
	"BACKSPACE", "TAB", "DELETE", "ESCAPE", "ENTER",
	"PAGE_UP", "PAGE_DOWN", "END", "HOME",
	"ARROW_LEFT", "ARROW_UP", "ARROW_RIGHT", "ARROW_DOWN"
].keys_map(DlKeyboard).toHash(true);

DlKeyboard.KEYS_MOVE = [
        "ARROW_LEFT", "ARROW_UP", "ARROW_RIGHT", "ARROW_DOWN"
].keys_map(DlKeyboard).toHash(true);

DlKeyboard.KEYS_MOVE_PREV = [
        "ARROW_LEFT", "ARROW_UP"
].keys_map(DlKeyboard).toHash(true);
