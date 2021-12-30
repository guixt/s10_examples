var s10ctl = null;
var s10 = null;

function myctl() {
    if (s10ctl != null) return true;

    var p = window;
    while (p != null) {
        if (p.ctlmain && p.ctlmain.ctl && p.ctlmain.ctl.s10) {
            s10ctl = p.ctlmain.ctl;
            s10 = s10ctl.s10;
            return true;
        };

        if (p == p.parent) {
            debugger;
            return false;
        };

        p = p.parent;
    };


    if (window.opener && window.opener.s10) {
        s10ctl = window.opener;
        s10 = s10ctl.s10;
        return true;
    };

    alert("ctl not found");
    return false;
}

function $S() {
    myctl();
    return s10ctl.scrdata;
}


function allowui() {
    if (!myctl()) return false;
    return $S().allowui();
}


function search_event_app(e, app) {


    if (e != null) return e;
    if (app == null) return null;
    if (app.event != null) return app.event;

    var frames = app.frames;

    for (var i = 0; i < frames.length; i++) {
        e = search_event_app(e, frames[i]);
        if (e != null) return e;
    };

    return null;
}


function eventtarget(e) {
    if (!myctl()) return null;
    return s10.eventtarget($S(), e);
};


function noaction(e) {

    e = S10Event(e);
    if (!e) return;

    if (typeof (e.stopPropagation) == 'function') {
        e.stopPropagation();
    } else {
        e.cancelBubble = true;
    };

    if (typeof (e.preventDefault) == 'function') {
        e.preventDefault();
    } else {
        e.returnValue = false;
    };

};

function cfg(f)  // cellfocusgot
{
    $S().cellfocusgot($S(), f);
}



function cbc(f) // checkbox cell click
{

    if (!allowui()) return;
    s10ctl.checkboxcellclicked(f);

}


function colfilterchanged(f) // column filter clicked
{

    if (!allowui()) return;
    s10ctl.colfilterchanged(f);

}




function okp(e) {

    if (!allowui()) return;
    e = S10Event(e);
    var f = eventtarget(e);
    if (f == null) return;

    // no special handling within textarea
    if (f.tagName == "TEXTAREA") return;

    return s10ctl.onkeypress(f, e);


}

function okd(e) {


    e = S10Event(e);

    var f = eventtarget(e);
    if (f == null) {
        $S().close_popups();
        noaction(e);
        return;
    };


    return s10ctl.onkeydown(f, e);
}


function labelradioclicked() {
    if (!allowui()) return;
    s10ctl.labelradioclicked();

}


function labelcheckboxclicked() {
    if (!allowui()) return;
    s10ctl.labelcheckboxclicked();
}



function init() {

    // connect page to framework
    if (!myctl()) return;

    // for some reasons, the "connect" routine might not yet be defined in ctl, so wait a little bit in this case
    if (typeof (s10ctl.connect) == "undefined") {
        setTimeout("init()", 50);
        return;
    };

    s10ctl.connect(window);


}

// Activate a tab
function S10ActivateTab(tab) {
    if (!allowui()) return;

    if (myctl()) s10ctl.S10ActivateTab(tab);
}



function S10Initialize() {

    if (allowui()) s10ctl.reconnect();

}


function bcl(f) {
    if (allowui()) s10ctl.step(f.name, f);
}

function cbcl(f) {
    if (allowui()) s10ctl.buttoncell_step(f);

}


function linkcl(f, e) {
    if (allowui()) s10ctl.linkclicked(f, e);

}



function vhelp(f, e) {

    // valuehelp icon clicked? else no action
    if (e.offsetX < f.offsetWidth - 20) return;
    if (allowui()) s10ctl.valuehelp(f);

}


function S10Path(filename) {
    if (!myctl()) return filename;

    return s10.filepath(filename);
}



function S10TopWindow() {
    if (!myctl()) return null;

    return s10.mytop();
}


function S10Language() {
    if (!myctl()) return 'en';

    return s10.language.toLowerCase();
}


function S10Enter(f) {
    S10Apply(' ');
}

function S10apply(fcode, parm, f, exitcommand) {
    S10Apply(fcode, parm, f, exitcommand);
};


// Text for "offline" alert
function offline_alert_text() {
    if (!myctl()) return "No internet connection\n\n\nThe current network status is 'offline'";

    switch (s10.language.toLowerCase()) {
        case 'de':
            return "Keine Internet-Verbindung\n\n\nZur Zeit ist der Netzwerkstatus 'offline'";
        case 'en':
            return "No internet connection\n\n\nThe current network status is 'offline'";
        case 'fr':
            return "Pas de connexion Internet.\n\n\nActuellement, le réseau est déconnecté.";
        case 'it':
            return "Nessuna connessione internet.\n\n\nAttualmente, la rete va 'offline'.";

        default:
            return "No internet connection\n\n\nThe current network status is 'offline'";

    };



};


function S10Apply(fcode, parm, f, no_field_transport, no_required_input_check) {
    if (!allowui()) return;

    // check online /offline
    if (!navigator.onLine) {
        alert(offline_alert_text());
        return;
    };

    if (typeof (fcode) == 'undefined') fcode = '';

    if (!f && document.querySelector) {
        var nodes = document.querySelectorAll('.infobuttonactive');
        if (nodes.length > 0) f = nodes[nodes.length - 1];
    };

    if (!f) {
        f = document.activeElement;
    };

    if (!f || f.tagName == 'BODY') {
        f = S10EventTarget();
    };


    // detail display of table row active?
    var r = f.closest('.tabledetail');
    if (r) {
        r = r.closest('.tablerow');

        // set source area
        if (r)  s10ctl.update_detail(r);
    };




    if (parm) {
        s10ctl.step(fcode + ':' + parm, f, no_field_transport, no_required_input_check);
    } else {
        s10ctl.step(fcode, f, no_field_transport, no_required_input_check);
    };

    // no further event handling
    noaction();
}



function S10Upload(fcode, inputelementid, anchor) {
    if (!allowui()) return;

    var f = document.getElementById(inputelementid);
    if (!f) return;

    s10ctl.upload(fcode, f, anchor);

}

function S10UploadData(base64string, fcode, name, filename, anchor) {
    if (!allowui()) return;

    if (!name) name = "data";
    if (!filename) filename = "data";
    if (!fcode) fcode = 'on_upload_' + name;

    s10ctl.uploaddata(base64string, fcode, name, filename, anchor);

}




function S10Contextinfo(f) {
    if (!myctl()) return;

    return s10ctl.context_info(f);

}



function S10ShowIframe(ifr) {
    if (!myctl()) return;

    s10ctl.set_iframe_visible(ifr, true);

}


function S10HideIframe(ifr) {
    if (!myctl()) return;
    s10ctl.set_iframe_visible(ifr, false);

}

function S10ToggleIframe(ifr) {

    if (!myctl()) return;
    s10ctl.set_iframe_visible(ifr, (ifr.height == 0));

}


function S10ToggleDetail(f, update) {


    if (!allowui()) return;
    if (!myctl()) return;

    if (!f) {
        f = document.activeElement;
    };

    if (!f || f.tagName == 'BODY') {
        f = S10EventTarget();
    };

    var r = f.closest('.tablerow');

    // inner table row without onlick? then ignore ?
    if (document.activeElement) {
        var t = document.activeElement.closest('.tablerow');
        if (t && t != r) {
            noaction();
            return;
        };
    };

    s10ctl.toggle_detail(r, update);

    // no further event handling
    noaction();

}



function S10FilterTable(f) {

    if (!allowui()) return;
    if (!myctl()) return;
    s10ctl.filter_table(f);

}



function S10DownloadTable(f) {

    if (!allowui()) return;
    if (!myctl()) return;
    s10ctl.download_table(f);

}


function S10TableDetail() {

    if (!myctl()) return null;
    return s10.tabledetailarea;

}


function S10SetColorscheme(n) {
    if (n < 1 || n > 9) {
        alert('S10SetColorscheme allows value 1..9, not ' && n);
        return;
    };

    s10.colorscheme = 'colorscheme' + n;

    var b = document.body;

    // set colorscheme
    if (!b.classList.contains(s10.colorscheme)) {
        for (var k = 1; k <= 9; k++) { b.classList.remove('colorscheme' + k); };
        b.classList.add(s10.colorscheme);
    };
};


function S10SetCookie(n, v, d) {

    var exp = '';
    if (typeof (d) == 'number' && d > 0) {
        var now = new Date();
        var then = now.getTime() + (d * 24 * 60 * 60 * 1000);
        now.setTime(then);
        exp = '; expires=' + now.toGMTString();
    };

    document.cookie = n + "=" + escape(v) + '; path=/' + exp;
}

function S10ReadCookie(n) {
    var cookiecontent = "";
    if (document.cookie.length > 0) {
        var cookiename = n + '=';
        var cookiebegin = document.cookie.indexOf(cookiename);
        var cookieend = 0;
        if (cookiebegin > -1) {
            cookiebegin += cookiename.length;
            cookieend = document.cookie.indexOf(";", cookiebegin);
            if (cookieend < cookiebegin) {
                cookieend = document.cookie.length;
            }
            cookiecontent = document.cookie.substring(cookiebegin, cookieend);
        };
    };
    return unescape(cookiecontent);
}

function S10Event(e) {
    if (e != null) return e;
    if (window.event) return window.event;

    var c = S10Event;

    while (c.caller) c = c.caller;
    if (c.arguments[0] && typeof (c.arguments[0].target) == 'object') return c.arguments[0];

    if (!myctl()) return null;

    var app = null;

    switch ($S().application_frame_no) {
        case 1:
            app = s10ctl.parent.parent.app1;
            break;
        case 2:
            app = s10ctl.parent.parent.app2;
            break;
    };

    return search_event_app(e, app);

}

function S10EventTarget() {
    var e = null;
    e = S10Event(e);
    return eventtarget(e);
}


function S10RefreshScreen(f, action, parms) {
    if (!allowui()) return;

    if (!f) {
        var e = null;
        e = S10Event(e);
        f = eventtarget(e);
    };

    s10ctl.screen_refresh(f, action, parms)

}




function S10CloseMessagePopup() {
    if (myctl()) $S().close_popups();
}


function S10MessagePopupAnchor() {
    if (myctl() && $S().msgPopup != null) return $S().msgPopup.msganchor;
    return null;
}

function S10ErrorMessage(f, msg, explanation) {


    if (myctl()) {

        S10CloseMessagePopup();
        s10ctl.S10ErrorMessage(f, msg, explanation);

        // no further event handling
        noaction();
    };
}


function S10InfoMessage(f, msg, explanation, width, height) {
    if (myctl()) {

        S10CloseMessagePopup();
        s10ctl.S10InfoMessage(f, msg, explanation, width, height);

        // no further event handling
        noaction();
    };

}


function S10Busy(f, e) {

    // disable onclick if ontouchstart or onpointerdown
    if (f != null && f.style != null) {
        e = S10Event(e);

        if (e.type == 'touchstart') {
            f.setAttribute('onclick', null);
            f.setAttribute('onpointerdown', null);
        };

        if (e.type == 'pointerdown') {
            f.setAttribute('onclick', null);
            f.setAttribute('ontouchstart', null);
        };


    };


    if (!myctl()) return true;
    // check online /offline
    if (!navigator.onLine) {
        alert(offline_alert_text());
        return true;
    };



    return !$S().allowui();
}



function S10Logon(client, user, password, language, classname, mainprogram, service_url, viewtarget, options, post_data) {
    if (allowui()) s10ctl.S10Logon(client, user, password, language, classname, mainprogram, service_url, viewtarget, options, post_data);
}


function S10Logoff(confirm) {
    if (allowui()) s10ctl.S10Logoff(confirm);

}


function S10AutoLogon() {
    if (allowui()) s10ctl.S10AutoLogon();
};


function S10ChangedTableCells(frm) {

    if (!myctl()) return null;

    if (!frm) {
        alert("Error: S10ChangedTableCells() called without table or iframe");
        debugger;
        return null;
    };

    // table element specified instead of iframe?
    if (frm.tagName && frm.tagName == 'TABLE') frm = frm.ownerDocument.defaultView.frameElement;


    var tabifi = s10.find_iframe_ifi($S().mainifi, frm);

    if (tabifi == null) {
        alert("Error: S10ChangedTableCells(), table not found");
        debugger;
        return null;
    };



    return tabifi.changed_table_cells;
}



function S10Audio() {

    if (!myctl()) return null;
    return s10.audioElement;

};



// Local seach for element with given data-locid attibute
// Try given element, children, then parent and so on
function S10ElementByLocid(f, locid, searchednodes) {

    // dctionary of searched nodes
    if (!searchednodes) searchednodes = [];
    if (!f) return null;


    for (var k = searchednodes.length; k > 0; k--) {
        if (f == searchednodes[k - 1]) return null;
    };

    var s = search_by_locid_down(f, locid);
    if (s) return s;

    searchednodes.push(f);

    return S10ElementByLocid(f.parentNode, locid, searchednodes);

};


function search_by_locid_down(f, locid) {

    if (!f) return null;
    if (!f.getAttribute) return null;
    if (locid == f.getAttribute('data-locid')) return f;

    var px = f.children;
    for (var k = 0; k < px.length; k++) {
        var s = search_by_locid_down(px[k], locid);
        if (s) return s;
    };

    return null;

};