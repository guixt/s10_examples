//------------------------------------------------
//         Synactive S10 
//
// Copyright (c) Synactive GmbH, Germany, 2008-2021
//    All rights reserved
//-----------------------------------------------
var s10 = null;
var s10ctl = this;

function find_s10_utitlities(w) {

    try {


        if (typeof (w) == 'object' && w != null && typeof (w.s10) == 'object' && w.s10 != null) return w.s10;

        // search parents   
        var p = w.parent;
        if (p != null && p != w) {
            locs10 = find_s10_utitlities(p);
            if (locs10 != null) {
                return locs10;
            };
        };


        p = w.opener;
        if (p != null && p != w) {
            locs10 = find_s10_utitlities(p);
            if (locs10 != null) return locs10;
        };


        var arg = w.dialogArguments;
        if (typeof (arg) == 'object' && arg != null) {
            locs10 = arg.s10;
            if (locs10 != null) return locs10;
        };


        p = w.frameElement;
        if (p != null) p = p.contentWindow;
        if (p != null && p != w) {
            locs10 = find_s10_utitlities(p);
            if (locs10 != null) return locs10;
        };

    } catch (e) {
        return null;
    };

    return null;

};

s10 = find_s10_utitlities(window);

if (s10 == null) {
    alert('s10 context not found: ' + window.location);

};



var scrdata = new s10.ScreenData(window);

// waiting for server  
var serverwait = false;



// focus within table 
var set_cell_focus = null;


function find_tableinfo(no) {

    if (no < 0 || no >= tableinfos.length) {
        alert('wrong table number: ' + no);
        debugger;
    }

    return tableinfos[no];

}


function find_tableinfo_by_tablename(tablename) {

    for (var k = 0; k < tableinfos.length; k++) {

        if (tableinfos[k].tablename.toLowerCase() == tablename.toLowerCase()) return tableinfos[k];
    }

    return null;

}


function doesHttpOnlyCookieExist(cookiename) {
    var d = new Date();
    d.setTime(d.getTime() + (1000));
    var expires = "expires=" + d.toUTCString();

    document.cookie = cookiename + "=new_value;path=/;" + expires;
    return document.cookie.indexOf(cookiename + '=') == -1;
}


// timout counter for init()
var timeoutcounter = 1;

// logon href
var logon_href = "";

var session_client = "";
var session_user = "";
var session_password = "";
var session_system = "";


var s10dialogArguments = null;


var s = s10.dialog_session(window);
if (s != null) {
    s10.popuplevel++;

    scrdata.applid = s10.dialog_applid;
    scrdata.screenid = s10.dialog_screenid;
    scrdata.tabid = s10.dialog_tabid;

} else {
    // popup window?
    if (window.dialogArguments) {
        s10.popuplevel++;

        scrdata.applid = s10.dialog_applid;
        scrdata.screenid = s10.dialog_screenid;
        scrdata.tabid = s10.dialog_tabid;

    } else {



        s10.sessionid = "";
        scrdata.applid = "user"
        scrdata.screenid = "logon";
        scrdata.tabid = "";

        // iFrame in launchpad ?
        if (window.top != s10.mytop()) {

            if (doesHttpOnlyCookieExist('MYSAPSSO2')) {
                scrdata.screenid = "sso2logon";
            }

        }

        var href = parent.parent.location.href;
        var search = parent.parent.location.search;

        s10.language = "en";
        s10.popuplevel = 0;



        // return
        s10.retval = "";

        // unload
        s10.unload_active = false;

    };

};


// set popup level
scrdata.set_popuplevel(s10.popuplevel);

// inline dialog
var inline_dialog_active = false;


// upload state
var upload_reader = null;
var upload_fileobject = null;
var upload_filename = "";
var upload_filesize = 0;
var upload_fileoffset = 0;
var upload_fcode = "";
var upload_name = "";
var upload_inputelement = null;
var upload_anchor = null;
var upload_data = null;
var upload_maxpartsize = 3 * 4000; // multiple of 3 because of Base64-String concatenation!



// Message variables
var msgtype = ""; // Type 'E', 'W', 'I', 'S', 'X'
var msgtext = ""; // message line
var msgexplanation = ""; // explanation
var msgurl = ""; // URL for modal dialog
var msgresult = ""; // dialog result
var myfocusfield = "";   // name or (for cells) id of focus field

// autologoff indicator
var autologoff = "N";


// required fields but empyt
var main_reqempty = 0;

// field responsible for last action
var f_action = null;


// Table interface
var tmode = "";
var tname = "";
var trows = 0;
var tcols = 0;


// table info
var tableinfos = new Array();

var tvalues = new Array();
var trownos = new Array();
var tcolnames = new Array();


// main descriptions
var main_ofields = "";
var main_ifields = "";
var main_tfields = "";

var main_ivalues = "";

var main_ielements = new Array();
var main_oelements = new Array();
var main_ifiid = 0;

var main_inputfield_count = 0;


// error cells
var error_fields = new Array();

// Input state
var save_cursor = new Array();

// iframe info
function ifi(thiswindow) {

    // window
    this.wnd = thiswindow;

    // document
    this.doc = thiswindow.document;

    // set ifi id
    main_ifiid++;
    this.ifiid = main_ifiid;

    // iframe
    this.iframe = null;

    // first input field 
    this.first_input = null;

    // number of inputfields
    this.inputfield_count = 0;

    // s10 object with "." if nonvoid
    this.s10object = "";

    this.ofields = "";
    this.oelements = new Array();

    this.ielements = new Array();

    // Checkboxes
    this.celements = new Array();
    this.clelements = new Array(); // checkbox labels

    // Radiobuttons
    this.relements = new Array();
    this.rnames = new Array();
    this.rlelements = new Array(); // radio button labels


    // tab pages
    this.tabpages = new Array();

    // message area
    this.messagearea = null;


    // ifi for included iframes
    this.ifis = new Array();

    // connect
    this.connect = true;
    this.connected = false;


}


function classtableinfo(ifi, tablename) {


    // table info
    this.no = tableinfos.length;
    this.ifi = ifi;
    this.tablename = tablename;

    this.tfields = "";
    this.tablebodyform = null;
    this.tablestyledisplay = "";
    this.newtab = "new:";
    this.tabpage = null;

    this.trowhtml = ""; // html coding within table form
    this.tvalues = new Array();
    this.trownos = new Array();
    this.tcolnames = new Array();

    // add to array of table infos
    tableinfos.push(this);

};



// concatenate tfields,.. for all ifis
function concatenate_ifi(ifi, parents10object) {


    // already connected?
    if (!ifi.connected) {
        connectframe(ifi);
    };


    // set first input field
    if (scrdata.first_input == null) {
        scrdata.first_input = ifi.first_input;
    };


    // count input fields
    if (ifi == scrdata.mainifi) {
        main_inputfield_count = ifi.inputfield_count;
    } else {
        main_inputfield_count = main_inputfield_count + ifi.inputfield_count;
    };


    var fulls10object = parents10object + ifi.s10object;


    // if necessary set s10object as prefix
    if (fulls10object == "") {
        main_ofields += ifi.ofields;
    } else {
        var s = new Array();
        s = ifi.ofields.split(";");

        for (var i = 0; i < s.length - 1; i++) s[i] = fulls10object + s[i]; // not last one (empty because of ending ; in ofields)
        main_ofields = main_ofields + s.join(";");
    };


    main_oelements = main_oelements.concat(ifi.oelements);



    for (var i = 0; i < ifi.ifis.length; i++) concatenate_ifi(ifi.ifis[i], fulls10object);

}


var continue_sessionid = "";
var continue_ifields = "";
var continue_ivalues = "";
var continue_action = "";
var continue_ofields = "";
var continue_tfields = "";


// continue after sending part of ivalues
function continue_package() {

    submit_direct(continue_sessionid, continue_ifields, continue_ivalues, continue_action, continue_ofields, continue_tfields);

};

// S10 step via ITSmobile 
function submit_direct(sessionid, ifields, ivalues, action, ofields, tfields) {

    var postdata = "";

    // size fits ITS protocol?
    // we take 8000 only becaue of ' ' -> %20 etc. by encoding
    if (ivalues.length <= 8000) {

        postdata =
            'command=step' +
            '&sessionid=' + encodeURIComponent(sessionid) +
            '&ifields=' + encodeURIComponent(ifields) +
            '&ivalues=' + encodeURIComponent(ivalues) +
            '&action=' + encodeURIComponent(action) +
            '&ofields=' + encodeURIComponent(ofields) +
            '&tfields=' + encodeURIComponent(tfields);

        continue_sessionid = "";
        continue_ifields = "";
        continue_ivalues = "";
        continue_action = "";
        continue_ofields = "";
        continue_tfields = "";
    }
    else {

        postdata =
            'command=step' +
            '&sessionid=' + encodeURIComponent(sessionid) +
            '&ifields=' + "" +
            '&ivalues=' + encodeURIComponent(ivalues.substr(0, 8000)) +
            '&action=' + "#" + s10.stepno + ";" + "~package" +
            '&ofields=' + "" +
            '&tfields=' + "";

        continue_sessionid = sessionid;
        continue_ifields = ifields;
        continue_ivalues = ivalues.substr(8000);
        continue_action = action;
        continue_ofields = ofields;
        continue_tfields = tfields;

    };

    ITSmobile_S10XMLHttpRequest(postdata + '&~OKCode==ENTER=Enter');

};


function process_server_response() {
    scrdata.window.setTimeout(this.responseText, 1);
}


function ITSmobile_process_server_response() {


    // logoff active?
    if (s10.logoff_active == true) {

        back_to_logonpage();

        // parent.parent.window.location.replace(logon_href);
        return;
    };



    // extract response part betweeen <script> and </script>
    var response = this.responseText;

    var jscode_beg = "// begin javascript itsmobile";
    var jscode_end = "// end javascript itsmobile";

    var parts = response.split(jscode_beg);
    if (parts.length > 1) {
        var s = parts[1].split(jscode_end)[0];
        var jscode = eval(s);
        scrdata.window.setTimeout(jscode);
        return;
    };


    // logon errors ?
    if (response == 'LOGON_ERROR_LOCKED' || response == 'LOGON_ERROR') {
        msgtype = 'E';
        msgtext = s10.ui_text(response);
        msgexplanation = '';
        ovalues = '';
        pbo();
        return;
    };


    // erroneous response
    top.document.documentElement.innerHTML = response;

}


function ITSmobile_S10XMLHttpRequest(postdata) {

    var XHR = new XMLHttpRequest();


    // to send cookies ???
    XHR.withCredentials = true;

    // Define what happens on successful data submission
    XHR.addEventListener("load", ITSmobile_process_server_response);

    // Set up our request
    // we need to separate the service name from the wgate url
    var wgatesession = s10.its_wgate_url;
    if (wgatesession && wgatesession.indexOf('(') > 0) {
        wgatesession = wgatesession.substr(wgatesession.indexOf('('));
    }

    XHR.open("POST", s10.its_service_url + wgatesession);


    XHR.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

    XHR.responseType = "text";


    // The data sent is what the user provided in the form
    XHR.send(postdata);
}




function submit(sessionid, ifields, ivalues, action, ofields, tfields) {

    // indicate: waiting for server
    serverwait = true;
    window.setTimeout(function () {
        submit_direct(sessionid, ifields, ivalues, action, ofields, tfields);
    }, 1);

}



function input_concatenate_ifi(ifi, exitaction, parents10object) {
    // should not occur, but occurs on logon sometimes
    if (ifi == null) {
        // alert("S10 internal problem: input_concatenate_ifi ifi=null");
        return;
    };


    // reset message
    if (ifi.messagearea != null) {
        ifi.messagearea.innerHTML = "";
        ifi.messagearea.classList.remove('info');
        ifi.messagearea.classList.remove('error');
    };


    var fulls10object = parents10object + ifi.s10object;

    for (var i = 0; i < ifi.ielements.length; i++) {
        var p = ifi.ielements[i];

        var name = fulls10object + p.getAttribute("name").toLowerCase();


        // Build input value string
        if (s10.is_input(p)) {
            if (p.type == "hidden" && typeof (p.onfocus) == "function") {
                s10.execute_onchange(p, p.onfocus); // allow application to set a value
            };


            var pcurrvalue;

            // trim value
            if (p.tagName == 'SELECT') {
                pcurrvalue = s10.get_element_value(p);

            } else {
                pcurrvalue = s10.get_element_value(p).trim();

            };


            if (p.oldvalue == null || pcurrvalue != p.oldvalue) {
                main_ifields = main_ifields + name + ";";
                main_ielements.push(p);
                main_ivalues = main_ivalues + encodeURIComponent(pcurrvalue) + ';';
                p.oldvalue = null;
            };
        };


        if (s10.is_radio(p) && p.checked) {
            if (p.getAttribute('s10checked') != true) {
                main_ifields = main_ifields + name + ";";
                main_ielements.push(p);
                main_ivalues = main_ivalues + encodeURIComponent(p.value) + ';';
                p.s10checked = true;
            };
        };




        if (s10.is_checkbox(p)) {



            if (p.checked) {
                if (p.oldvalue == null || p.oldvalue != '1') {
                    main_ifields = main_ifields + name + ";";
                    main_ielements.push(p);
                    main_ivalues = main_ivalues + '1;';
                    p.oldvalue = null;
                };
            } else {
                if (p.oldvalue == null || p.oldvalue != '0') {
                    main_ifields = main_ifields + name + ";";
                    main_ielements.push(p);
                    main_ivalues = main_ivalues + '0;';
                    p.oldvalue = null;
                };
            };
        };

        // Input required but still empty?
        if (s10.is_inputreq(p) && !exitaction && s10.get_element_value(p).trim() == "") {
            s10.set_error(p);


            if (!scrdata.first_error_field || ((s10.relPosTop(p) > s10.relPosTop(scrdata.first_error_field)) && (s10.relPosTop(p) < s10.relPosTop(scrdata.first_error_field) + 100))) {
                scrdata.first_error_field = p;
            };


            main_reqempty++;

            // save first req field
            if (main_reqempty == 1) {
                setinputfocus(p);

            };

            // save error field
            error_fields.push(p);


        };



    }; //endfor


    // included iframes
    for (var i = 0; i < ifi.ifis.length; i++) input_concatenate_ifi(ifi.ifis[i], exitaction, fulls10object);
}


// toggle table row detail
function toggle_detail(f, update) {

    if (f.classList.contains('active')) {
        f.classList.remove('active');
        f.classList.add('hidden');


        var tablerequestdetail = f.querySelector(".tablerequestdetailactive");
        if (tablerequestdetail && tablerequestdetail.parentElement == f) tablerequestdetail.className = "tablerequestdetailhidden";

        if (f.s10detailarea) {
            f.s10detailarea.style.display = 'none';
            if (update === true) {
                f.removeChild(f.s10detailarea);
                f.s10detailarea = none;
            };
        };

        return;
    };

    if (f.classList.contains('hidden')) {
        f.classList.remove('hidden');
        f.classList.add('active');


        var tablerequestdetail = f.querySelector(".tablerequestdetailhidden");
        if (tablerequestdetail && tablerequestdetail.parentElement == f) tablerequestdetail.className = "tablerequestdetailactive";

        if (f.s10detailarea) {
            f.s10detailarea.style.display = 'block';
            return;
        };



    };


    var s10detailviewcell = f.firstElementChild;
    while (s10detailviewcell != null && (!s10detailviewcell.name || s10detailviewcell.name.toLowerCase() != 's10detailview')) {
        s10detailviewcell = s10detailviewcell.nextElementSibling;
    };

    if (s10detailviewcell) {
        s10detailviewcell.value = 'X';
        scrdata.cellchanged(s10detailviewcell);

        f.s10detailviewcell = s10detailviewcell;
    };

    var col = f.firstElementChild;
    while (col != null && (!col.id || col.id.indexOf('#') == -1)) {
        col = col.nextElementSibling;
    };

    // no valid column found?
    if (!col) return;

    var rid = col.id.split('#')[1];
    var parts = rid.split('.');

    if (parts.length < 3) {
        return;  // should not occur
    };

    // table name can be "object.table"
    tabname = parts.slice(0, parts.length - 2).join('.');
    rownumber = parts[parts.length - 2];



    // create detail area
    if (!f.s10detailarea) {
        f.s10detailarea = document.createElement('DIV');
        f.insertBefore(f.s10detailarea, f.lastElementChild.nextElementSibling);
    };

    // set source area
    f.s10sourcearea = f.ownerDocument.getElementById(tabname + '_detail');
    scrdata.table_detail_tablerow = f;

    // automatically copy new table details
    scrdata.table_detail_copy = true;

    // handle subobject in table name
    var parts = tabname.split('.');
    parts[parts.length - 1] = 'on_detail_' + parts[parts.length - 1];
    var methodname = parts.join('.');

    // indicate: processing active
    var tablerequestdetail = f.querySelector(".tablerequestdetail");
    if (tablerequestdetail && tablerequestdetail.parentElement == f) tablerequestdetail.className = "tablerequestdetailinwork";

    s10ctl.step(methodname + ':' + rownumber, f);

};


// update detail
function update_detail(f) {

    scrdata.table_detail_tablerow = f;

    // do not automatically copy new table details
    scrdata.table_detail_copy = false;

};






// refresh screen (with next screen refresh)
function screen_refresh(f, action, parms) {
    timeoutcounter = 1;
    scrdata.cursor_wait(f);

    if (parms && parms != "") action = action + ":" + parms;

    var func = "";

    if (action) {
        func = "initializeframe('" + action + "')";
    } else {
        func = "initializeframe()";
    };

    setTimeout(func, 1);

}



//  plus/minus tab pages
var tabpageplus = null;
var tabpageminus = null;
var processtabclick = null;


// Screen variables
var title;



function checkboxcellclicked(f) {
    scrdata.lastfocus = f;
    scrdata.cellchanged(f);
}



function step_on_cancel() {

    step('on_cancel_' + scrdata.screenid, null, true, true);

}



function exitscreen() {

    setTimeout(step_on_cancel, 1);

}


function S10ActivateTab(f) {


    // no action for active tabs
    if (f.classList.contains('tabactive')) return;

    // search tabstrip
    var p = f;
    while (p && p != p.parentNode && !p.classList.contains('tabstrip')) p = p.parentNode;

    // found? else no action
    if (!p.classList.contains('tabstrip')) return;

    var doc = f.ownerDocument;

    // loop through all tabs
    var activetabs = p.getElementsByClassName("tabactive");
    var activepages = doc.getElementsByClassName("tabpageactive");
    var pages = doc.getElementsByClassName("tabpage");

    // copy into array - otherwise it is changed dynamically when changing the css class 
    var array_activetabs = [];
    var array_activepages = [];
    var array_pages = [];

    Array.prototype.forEach.call(activetabs, function (h) {
        array_activetabs.push(h)
    });
    Array.prototype.forEach.call(activepages, function (h) {
        array_activepages.push(h)
    });
    Array.prototype.forEach.call(pages, function (h) {
        array_pages.push(h)
    });

    array_activetabs.forEach(function (a) {

        array_activepages.forEach(function (b) {

            // page id starts with tab id?
            if (b.id.lastIndexOf(a.id + '.', 0) == 0) {
                tabpageminus = b;
            };

        });

    });

    tabpageplus = null;
    array_pages.forEach(function (b) {

        // page id starts with tab id?
        if (b.id.lastIndexOf(f.id + '.', 0) == 0) {
            tabpageplus = b;

        };

    });


    if (!tabpageplus) {
        alert("Tab page '" + f.id + "' missing in HTML page");
        tabpageminus = null;
        return;
    };

    processtabclick = f;

    S10apply("on_init_" + scrdata.screenid + "_" + f.id, "", f);   // TBD a.id ????

};

function change_tab(f) {

    // search tabstrip
    var p = f;
    while (p && p != p.parentNode && !p.classList.contains('tabstrip')) p = p.parentNode;

    // found? else no action
    if (!p.classList.contains('tabstrip')) return;

    if (!tabpageplus) {
        alert("Tab page '" + f.id + "' missing in HTML page");
        tabpageminus = null;
        return;
    };


    // loop through all tabs
    var activetabs = p.getElementsByClassName("tabactive");

    // copy into array - otherwise it is changed dynamically when changing the css class 
    var array_activetabs = [];

    Array.prototype.forEach.call(activetabs, function (h) {
        array_activetabs.push(h)
    });
    array_activetabs.forEach(function (a) {

        a.classList.add('tab');
        a.classList.remove('tabactive');

    });

    f.classList.add('tabactive');
    f.classList.remove('tab');

    tabpageplus.classList.add('tabpageactive');
    tabpageplus.classList.remove('tabpage');

    tabpageminus.classList.add('tabpage');
    tabpageminus.classList.remove('tabpageactive');

};




function S10ErrorMessage(f, msg, explanation, width, height) {

    if (!explanation) explanation = "";
    scrdata.show_msg_popup('E', msg, explanation, f);
};

function S10InfoMessage(f, msg, explanation, width, height) {

    if (!explanation) explanation = "";
    scrdata.show_msg_popup('I', msg, explanation, f, width, height);

};


function reset_screen_info() {

    // Reset screen fields
    main_ielements.length = 0;
    main_oelements.length = 0;

    // error cells 
    error_fields.length = 0;


    // changed cells
    scrdata.chcells_reset_done = false;

    scrdata.mainifi = null;


    // reset first input field
    scrdata.first_input = null;

    // reset tableinfos
    tableinfos.length = 0;

}


function search_event_app(e, app) {


    if (e != null) return e;
    if (app == null) return null;
    if (typeof (app.event) == 'object' && app.event != null) return app.event;
    if (typeof (app.frames) == 'undefined') return null;

    var frames = app.frames;

    for (var i = 0; i < s10.mylength(frames); i++) {
        var frm = frames[i];
        if (s10.frame_is_accessible(frm)) {
            e = search_event_app(e, frm);
            if (e != null) return e;
        };
    };

    return null;
}



function onkeypress(f, e) {

    // no S10 field?
    if (!f.name) {
        return true;
    };

    scrdata.lastfocus = f;
    scrdata.close_popups();



    switch (e.keyCode) {

        case 13: // Enter
            {
                if (s10.is_inputcell(f)) {
                    scrdata.cellchanged(f);
                };

                step('on_enter_' + scrdata.screenid);

                s10.noaction(s10ctl, e);

                return false;
            };
            break;

        case 27: // ESC
            {


                if (s10.is_inputcell(f)) {
                    scrdata.cellchanged(f);
                };


                setTimeout(step_on_cancel, 1);
                s10.noaction(s10ctl, e);

                return false;
            };
            break;

    }



    return true;

}


function collect_s10_cells(c) {

    if (c == null) return;
    if (c.tagName == 'TD') return;

    collect_s10_cells(c.firstChild);
    collect_s10_cells(c.nextSibling);

}



function onkeydown(f, e) {


    if (!scrdata.allowui()) return true;

    // no S10 field?
    if (!f.name) {
        return true;
    };


    scrdata.close_popups();


    return true;

}



// initialize document
function initializedocument() {

    // no session active (logon screen)?
    if (s10.sessionid == "") {
        return;
    };


    var doc = scrdata.appl_doc;
    var wnd = scrdata.appl_wnd;

    if (timeoutcounter == 6000) {
        alert("timeout: iframes could not load in time"); // 5 minutes
        return;
    };


    if (!s10.check_completion(wnd)) {
        timeoutcounter++;
        setTimeout("initializedocument()", 50);
        return;
    };


    // set keycode handlers
    doc.body.onkeypress = okp;
    doc.body.onkeydown = okd;

    if (s10.popuplevel > 0
        && s10.scrdata_stack[scrdata.popuplevel - 1].diaPopup != null
        && s10.scrdata_stack[scrdata.popuplevel - 1].diaPopup.fullscreen) {

        // disable scrolling for popup dialog, otherwise 2 scrollbars will be displayed
        // scrolling is done via parent window
        // doc.body.style.overflow = 'hidden';

    };

    // reset old screen info
    reset_screen_info();


    // start ifiid with 0 again
    main_ifiid = 0;

    // set main ifi
    scrdata.mainifi = new ifi(wnd);

    // connect all frames
    connectframe(scrdata.mainifi);

    main_tfields = "";
    main_ofields = "";
    main_oelements.length = 0;

    // reset last focus
    scrdata.lastfocus = null;


    concatenate_ifi(scrdata.mainifi, "");

    // set main tfields
    set_main_tfields();

    // process next step
    var loc_ifields = "";
    var loc_ivalues = "";
    var loc_action = "#" + s10.stepno + ";" + "on_init_" + scrdata.screenid;

    var loc_ofields = "new:" + filter_main_ofields();
    var loc_tfields = main_tfields;

    submit(s10.sessionid, loc_ifields, loc_ivalues, loc_action, loc_ofields, loc_tfields);


}


function initializeframe() {

    main_tfields = "";
    main_ofields = "";
    main_oelements.length = 0;



    scrdata.first_input = null;

    concatenate_ifi(scrdata.mainifi, "");

    // set main tfields
    set_main_tfields();


    // process next step
    var loc_ifields = "";
    var loc_ivalues = "";
    var loc_action = "";
    if (tab_change) {
        loc_action = "#" + s10.stepno + ";" + tab_change;
    } else {
        loc_action = "#" + s10.stepno + ";";
    };

    var loc_ofields = "new:" + filter_main_ofields();
    var loc_tfields = main_tfields;

    submit(s10.sessionid, loc_ifields, loc_ivalues, loc_action, loc_ofields, loc_tfields);

}



// filter main ielements
function filter_main_ifields() {

    if (main_ifields == "") return main_ifields;

    var ifields = main_ifields.split(';');

    for (var k = 0; k < main_ielements.length; k++) {
        var f = main_ielements[k];

        // tab page currently not active? then ignore
        var tabpage = f.s10tabpage;

        if (tabpage && !s10.is_tabpageactive(tabpage)) {

            ifields[k] = '?'; // ignore this one

        };

        // table detail is active ?
        var tabledetail = f.s10tabledetail;
        if (tabledetail && (!scrdata.table_detail_tablerow || tabledetail != scrdata.table_detail_tablerow.s10sourcearea)) {

            ifields[k] = '?'; // ignore this one

        };



    };

    return ifields.join(';');

}




// filter main oelements
function filter_main_ofields() {

    if (main_ofields == "") return main_ofields;

    var ifields = main_ifields.split(';');

    var ofields = main_ofields.split(';');

    for (var k = 0; k < main_oelements.length; k++) {
        var f = main_oelements[k];

        // tab page not active after tab change? then ignore
        var tabpage = f.s10tabpage;

        if (tabpage && tabpage !== tabpageplus && (tabpage === tabpageminus || !s10.is_tabpageactive(tabpage))) {

            ofields[k] = '?'; // ignore this one

        };

        // table detail is active ?
        var tabledetail = f.s10tabledetail;
        if (tabledetail && (!scrdata.table_detail_tablerow || tabledetail != scrdata.table_detail_tablerow.s10sourcearea)) {

            ofields[k] = '?'; // ignore this one

        };


    };

    return ofields.join(';');

}


// set main tfields
function set_main_tfields() {
    for (var k = 0; k < tableinfos.length; k++) {
        var tableinfo = tableinfos[k];

        // tab page is active ?
        var tabpage = tableinfo.tabpage;

        if (!tabpage || tabpage === tabpageplus || (tabpage !== tabpageminus && s10.is_tabpageactive(tabpage))) {


            // table detail is active ?
            var tabledetail = tableinfo.tabledetail;
            if (!tabledetail || (scrdata.table_detail_tablerow && tabledetail == scrdata.table_detail_tablerow.s10sourcearea)) {


                var fulls10object = s10.get_fulls10object(scrdata.mainifi, tableinfo.ifi);
                main_tfields += ("~" + tableinfo.newtab + tableinfo.no + '#' + fulls10object + tableinfo.tablename + ";" + tableinfo.tfields);

            };

        }

    };
}


// reconnect whole document
function reconnect() {

    if (scrdata.appl_wnd == null) return;
    connect(scrdata.appl_wnd);

};




function connect(wnd) {
    if (!wnd) return;


    var doc = wnd.document;
    if (!doc) return;


    var wndname = wnd.name;

    if (!wndname) return;

    // set language
    var html = doc.getElementsByTagName('html')[0];
    if (html) html.setAttribute('lang', s10.language);

    // set colorscheme
    var b = doc.body;
    if (!b.classList.contains(s10.colorscheme)) {
        for (var k = 1; k <= 8; k++) { b.classList.remove('colorscheme' + k); };
        b.classList.add(s10.colorscheme);
    };



    // no action if this is an iframe
    if (wndname != "app1" && wndname != "app2") return;

    scrdata.appl_doc = doc;
    scrdata.appl_wnd = wnd;

    // initalize if all iframes are completed  
    timeoutcounter = 1;

    setTimeout("initializedocument()", 1);

}

function disable_element(p) {

    switch (p.tagName) {
        case 'INPUT':
            p.readOnly = true;
            p.disabled = true;
            p.style.backgroundColor = '#f0f0f0';
            p.style.color = '#404040';
            break;
        case 'SELECT':
            p.disabled = true;
            p.style.backgroundColor = '#f0f0f0';
            p.style.color = '#404040';
            break;
    };

    var children = p.getElementsByTagName('*');


    for (var i = 0; i < children.length; i++) {
        var q = children[i];

        switch (q.tagName) {
            case 'INPUT':
                q.readOnly = true;
                q.disabled = true;
                q.style.backgroundColor = '#f0f0f0';
                q.style.color = '#404040';
                break;
            case 'SELECT':
                q.disabled = true;
                q.style.backgroundColor = '#f0f0f0';
                q.style.color = '#404040';
                break;
        };
    };
};



function connectframe(parifi) {

    if (parifi.connected == true) alert('already connected');

    // indicate: connected 
    parifi.connected = true;

    var doc = parifi.doc;
    var wnd = parifi.wnd;


    // set keycode handlers
    doc.body.onkeypress = okp;
    doc.body.onkeydown = okd;

    // no delay for click event
    doc.body.style.touchAction = 'manipulation';


    // use click event, no "onpointerdown" ?
    var keep_click = false;
    if (s10.topurl.indexOf("click=yes") > -1) {
        keep_click = true;
    };


    // set message area
    parifi.messagearea = doc.body.querySelector(".messagearea");

    // set tabpages
    var tabpages = s10.myQuerySelectorAll(doc.body, ".tabpage, .tabpageactive");

    tabpages.forEach(function (p) {
        parifi.tabpages.push(p);

    });



    // tab id specified? then de-active currently active tab and activate new tab
    if (scrdata.tabid != "") {

        var tabs = s10.myQuerySelectorAll(doc.body, ".tab, .tabactive");

        tabs.forEach(function (p) {
            if (p.id.toLowerCase() == scrdata.tabid) {
                tabs.forEach(function (q) {

                    // set all tabs inactive
                    if (q.classList.contains('tabactive')) {
                        q.classList.add('tab');
                        q.classList.remove('tabactive');
                    };
                    if (q.id.toLowerCase() == scrdata.tabid) {
                        q.classList.add('tabactive');
                        q.classList.remove('tab');
                    };

                });
            };

        });

        // same for tab areas
        tabpages.forEach(function (p) {
            if (p.id.toLowerCase() == (scrdata.tabid + '.area')) {
                tabpages.forEach(function (q) {

                    // set all tabs inactive
                    if (q.classList.contains('tabpageactive')) {
                        q.classList.add('tabpage');
                        q.classList.remove('tabpageactive');
                    };
                    if (q.id.toLowerCase() == (scrdata.tabid + '.area')) {
                        q.classList.add('tabpageactive');
                        q.classList.remove('tabpage');
                    };

                });
            };

        });


    };

    var all_labels = s10.myQuerySelectorAll(doc.body, "label.label");
    all_labels.forEach(function (p) {
        var idfor = p.getAttribute('for');
        if (idfor && doc.getElementById(idfor) && doc.getElementById(idfor).required) {
            var pl = doc.createElement('span');
            pl.innerHTML = '*';
            pl.style.marginLeft = '4px';
            pl.style.color = 'red';
            p.appendChild(pl);
        };

    });



    var all_elements = s10.myQuerySelectorAll(doc.body, "[name]");

    all_elements.forEach(function (p) {

        var pname = p.getAttribute("name");

        // name always in lower case
        pname = pname.toLowerCase();



        if (s10.is_colhead(p)) {

            p.addEventListener('click', function (e) {
                colheadclicked(p, e);
            });

            // assume ...@columnheader if class 'output' is specified
            if (p.classList.contains('output') && pname.indexOf('@columnheader') == -1) {

                // search table name
                var colheaders = p.closest(".colheaders");

                // search table form
                var table = colheaders;
                while (table && !table.classList.contains('table')) {
                    table = table.nextElementSibling;
                };

                // text column?
                // if preceding column is not the same field name (without '@text') we do not take the text field column header, eg "Bezeichnung",
                // but the field label eg "Auftragsart" 
                if (pname.indexOf('@text') > 0) {

                    var q = p.previousElementSibling;
                    if (!q || !s10.is_colhead(q) || !q.getAttribute("name") || pname != (q.getAttribute("name") + "@text")) {
                        pname = pname.replace('@text', '@label');

                        if (table && table.name) {
                            pname = table.name + '-' + pname;
                        };
                    };

                };

                if (pname.indexOf('@label') == -1) {

                    if (table && table.name) {
                        pname = table.name + '-' + pname + '@columnheader';
                    }
                    else {
                        pname += '@columnheader';
                    };


                };


            };

        };

        if (s10.is_label(p)) {
            // assume ...@label if class output is specified
            if (p.classList.contains('output') && pname.indexOf('@label') == -1) pname += '@label';
        };

        if (s10.is_link(p)) {
            p.setAttribute('onclick', 'return linkcl(this, event);');

        };

        if (s10.is_valuehelp(p)) {
            p.setAttribute('onclick', 'return vhelp(this, event);');
        };



        if (s10.is_button(p)) {

            p.onclick = function () {
                bcl(this);
            }; // bcl;  // button click
            p.ontouchstart = function () {
                bcl(this);
                return false;
            }; // bcl;  // button click touch screen

            if (typeof (p.type) == 'string' && p.type.toLowerCase() != 'button') {
                alert("Please add type='button' in HTML tag <button name=" + p.name + " ...>");
            };

            return;
        };


        // dynamic dropdown list in table cell?
        if (s10.is_inputcellselect(p)) {

            var s10dropdownlist = p.getAttribute("data-s10dropdownlist");
            if (s10dropdownlist) {

                // search table form
                var table = p.closest(".table");
                if (table) p['s10tableform'] = table;


                if (table && table.name && s10dropdownlist.toLowerCase().indexOf('@dropdownlist') > - 1) {
                    s10dropdownlist = table.name + '-' + s10dropdownlist;
                };

                parifi.ofields = parifi.ofields + s10dropdownlist + ";";
                parifi.oelements.push(p);
            };

        };


        // build output value string
        if ((s10.is_output(p) | s10.is_input(p) | s10.is_checkboxany(p) | (s10.is_image(p)) && !s10.is_cell(p)) | s10.is_datalist(p) | s10.is_label(p)) {

            // dynamic dropdown list?
            if (s10.is_select(p)) {

                var s10dropdownlist = p.getAttribute("data-s10dropdownlist");
                if (s10dropdownlist) {
                    parifi.ofields = parifi.ofields + s10dropdownlist + ";";
                    parifi.oelements.push(p);
                };
            };



            if (s10.is_input(p)) {
                parifi.ofields = parifi.ofields + pname + "+;"; // indicate: input field
            } else {
                parifi.ofields = parifi.ofields + pname + ";";
            };

            if (!pname) {
                alert("Error in HTML page\r\n" + doc.URL + "\r\n\r\n Attribute 'name=' not specified in\r\n\r\n" + p.outerHTML);
            };

            // Set overflow-style 'ellipsis if not specified
            if (!p.style.textOverflow || p.style.textOverflow == "") p.style.textOverflow = "ellipsis";

            parifi.oelements.push(p);

        } else {
            if (s10.is_radioany(p)) {

                parifi.ielements.push(p);
                var rfound = false;
                for (var kr = 0; kr < parifi.rnames.length && rfound == false; kr++) {
                    if (parifi.rnames[kr] == pname) {
                        rfound = true;
                    };
                };

                if (rfound == false) {

                    parifi.rnames.push(pname);
                    parifi.ofields = parifi.ofields + pname + ";";
                    parifi.oelements.push(p);
                };

            }; // radioany



        };

        if (s10.is_radioany(p)) parifi.relements.push(p);
        if (s10.is_checkbox(p) && !s10.is_cell(p)) {
            parifi.celements.push(p);
            parifi.ielements.push(p);


        };
        if (s10.is_labelradio(p)) parifi.rlelements.push(p);
        if (s10.is_labelcheckbox(p)) parifi.clelements.push(p);




        if (s10.is_input(p) && !s10.is_cell(p)) {

            parifi.ielements.push(p);


            // no hidden fields
            if (p.type != 'hidden') {

                // increase number of input fields 
                parifi.inputfield_count++;


                prev_input = p; // save input field pointer


                // set first input field for ifirame 
                if (parifi.first_input == null) {
                    parifi.first_input = p;
                };


            };


        };


        if (s10.is_output(p)) {

            if (s10.is_outputselect(p)) {
                p.disabled = true;
            } else {
                p.readOnly = true;
                if (!s10.is_outputcell(p)) {
                    // delete default border (underline) used in design mode 
                    if (p.style.border == "") {
                        p.style.border = "0px";
                    };

                };
            };
            p.tabIndex = -1;
        };


        if (s10.is_label(p)) {
            p.readOnly = true;
            p.tabIndex = -1;

        };


        if (s10.is_radioout(p)) {
            p.disabled = true;
        };

        if (s10.is_checkboxout(p)) {
            p.disabled = true;
        };




        if (s10.is_labelradio(p)) {
            p.onclick = labelradioclicked;
        };


        if (s10.is_labelcheckbox(p)) {
            p.onclick = labelcheckboxclicked;
        };

    });



    // seaarch tables
    for (var k = 0; k < doc.forms.length; k++) {
        var f = doc.forms[k];

        // table?
        if ((s10.is_table(f) || s10.is_repeat(f)) && f.name) {

            if (typeof (f.name) == "object") {
                alert("Synactive S10 syntax problem: A table column with name 'name' is not possible - please rename it");
            };


            var tableinfo = new classtableinfo(parifi, f.name);

            tableinfo.tablebodyform = f;

            tableinfo.tabpage = f.closest(".tabpage, .tabpageactive");
            tableinfo.tabledetail = f.closest(".tabledetail");

            // set table number
            f.setAttribute('s10tableno', tableinfo.no);

            // restore innnerhTML
            // this is needed in case of centralized iframes since innerHTML is replaced by
            // actual table content
            var ihtml = f.getAttribute('s10tableinnerhtml');
            if (ihtml) {
                f.innerHTML = ihtml;
            } else {
                f.setAttribute('s10tableinnerhtml', f.innerHTML);

                // save display attribute
                tableinfo.tablestyledisplay = f.style.display;

            };


            var col_elements = s10.myQuerySelectorAll(f, "[name]");

            col_elements.forEach(function (p) {


                var cellname = p.getAttribute('name');
                if (cellname && s10.is_cell(p)) {

                    cellname = cellname.toLowerCase();
                    tableinfo.tcolnames.push(cellname);



                    if (s10.is_inputcell(p)) {
                        tableinfo.tfields += (cellname + "+;");


                    } else {
                        tableinfo.tfields += (cellname + ";");
                    };

                    // Set overflow-style 'ellipsis if not specified
                    if (!p.style.textOverflow || p.style.textOverflow == "") p.style.textOverflow = "ellipsis";


                };
            });


        };



    };



    // determine tab page and tabledetail element ielements
    parifi.ielements.forEach(function (f) {
        var p = f.closest(".tabpage, .tabpageactive");
        if (p) f.s10tabpage = p;
        var q = f.closest(".tabledetail");
        if (q) f.s10tabledetail = q;
    });



    // determine tab page and tabledetail element oelements
    parifi.oelements.forEach(function (f) {
        var p = f.closest(".tabpage, .tabpageactive");
        if (p) f.s10tabpage = p;
        var q = f.closest(".tabledetail");
        if (q) f.s10tabledetail = q;
    });



    // connect inner iframes
    for (var k = 0; k < wnd.frames.length; k++) {

        var frm = wnd.frames[k];

        init_iframe(parifi, frm);
    };


    // connect external iframes if top
    if (parifi == scrdata.mainifi) {

        for (var k = 0; k < parent.frames[0].frames.length; k++) {
            var frmext = parent.frames[0].frames[k];
            init_iframe(parifi, frmext);
        };

    };


}

function init_iframe(parifi, frm) {
    // frame is perhaps not accessible (different domain)
    if (!s10.frame_is_accessible(frm)) return;


    var locs10 = frm.frameElement.getAttribute('s10object');
    var s10fullheight = frm.frameElement.getAttribute('s10fullheight');


    // no S10 connection?
    if (locs10 == 'nothing') {
        return;
    };

    // document? (could be pdf-iframe etc.)
    if (frm.frameElement.contentWindow == null) {
        return;
    };


    if (typeof (frm.frameElement.contentWindow.document) != 'object') {
        return;
    };


    var newifi = new ifi(frm.frameElement.contentWindow);

    newifi.iframe = frm.frameElement;

    // Set s10 object of iframe
    if (locs10 != null && locs10 != "") {
        newifi.s10object = locs10 + ".";
    };


    parifi.ifis.push(newifi);

    // resize iframe (table body)?
    if (s10fullheight != null && s10fullheight.substr(0, 3).toLowerCase() == 'yes') {
        scrdata.initresizefullheight(frm.frameElement, s10fullheight);
    };


    // connect now?
    if (newifi.connect) {
        connectframe(newifi);
    };
}




// Show message frame
function show_msg_frame() {

    if (msgtype != '' && msgtype != ' ') {

        // decode
        msgtext = decodeURIComponent(msgtext);
        msgexplanation = decodeURIComponent(msgexplanation);


        scrdata.show_msg_popup(msgtype, msgtext, msgexplanation, f_action);

    };

    // reset msgtype
    msgtype = "";
    msgtext = "";
    msgexplanation = "";

}

function labelcheckboxclicked() {
    var ifi = s10.get_checkboxlabel_ifi(scrdata.mainifi, this);

    for (var k = 0; k < ifi.clelements.length; k++) {
        if (ifi.clelements[k] == this) {
            ifi.celements[k].click();
            return;
        };
    };
}

function reset_radio_error(ifi) {
    if (typeof (ifi) == "undefined" || ifi == null) return;

    if (typeof (ifi.relements) == "undefined") return;

    for (var k = 0; k < ifi.relements.length; k++) {
        var obj = ifi.relements[k];
        if (is_radio(f)) s10.reset_error(f);
    };

    for (var i = 0; i < ifi.ifis.length; i++) {
        reset_radio_error(ifi.ifis[i]);
    };
}




function labelradioclicked() {
    var ifi = s10.get_radiolabel_ifi(scrdata.mainifi, this);

    for (var k = 0; k < ifi.rlelements.length; k++) {
        if (ifi.rlelements[k] == this) {
            ifi.relements[k].click();
            return;
        };
    };

}



function colheadclicked(f, e) {

    var colheaders = f.closest(".colheaders");
    if (!colheaders) return;

    // search table form
    var table = colheaders;
    while (table && !table.classList.contains('table') && !table.classList.contains('repeat')) {
        table = table.nextElementSibling;
    };
    if (!table || !table.name) return;

    if (f.classList.contains('colheadup')) {

        f.classList.remove('colheadup');
        f.classList.add('colheaddown');

        S10Apply('~sortfolder', table.name + '@' + f.getAttribute('name') + '-', f);
    } else {

        var cols = s10.myQuerySelectorAll(f.parentElement, ".colheadup, .colheaddown");

        cols.forEach(function (p) {
            p.classList.remove('colheaddown');
            p.classList.remove('colheadup');

        });

        f.classList.add('colheadup');

        S10Apply('~sortfolder', table.name + '@' + f.getAttribute('name'), f);
    };

    return;
}



function filter_table(f) {

    // search table name
    var colheaders = f.closest(".colheaders");
    if (!colheaders) return;

    var colfilters = colheaders.querySelector(".colfilters");
    if (!colfilters) {
        colfilters = insert_colfilters(colheaders);
    };

    // search table form
    var tableform = colheaders;
    while (tableform && !tableform.classList.contains('table')) {
        tableform = tableform.nextElementSibling;
    };
    if (!tableform || !tableform.name) return;

    tableform.s10colheaders = colheaders;

    // active? then close it
    if (colfilters.style.display == 'block') {

        var tables = tableform.getElementsByTagName('TABLE');
        if (!tables) return;
        var table = tables[0];
        if (!table) return;

        // display all rows
        // loop through table rows
        for (var i = 0; i < table.rows.length; i++) {

            var row = table.rows[i];
            row.style.display = 'table-row';
            row.removeAttribute('s10filterexclusion');

            // remove total line
            if (row.getAttribute('s10totals')) {
                row.parentNode.removeChild(row);
            };
        };

        // remove colfilters
        colfilters.parentNode.removeChild(colfilters);
        tableform.s10colfilters = null;


        return;
    };

    tableform.s10colfilters = colfilters;
    colfilters.style.display = 'block';

    buildfiltervalues(tableform);

}


function insert_colfilters(colheaders) {

    var colheaderelements = s10.myQuerySelectorAll(colheaders, ".colhead");

    var filterhtml = "";

    colheaderelements.forEach(function (p) {


        var classname = 'colfilter';
        if (p.classList.contains('portrait')) classname += ' portrait';
        if (p.classList.contains('landscape')) classname += ' landscape';
        if (p.classList.contains('desktop')) classname += ' desktop';


        if (p.classList.contains('totals')) classname += ' totals';

        var width = p.style.width;
        if (width != "") width = "width:" + width + ";"

        var maxwidth = p.style.maxWidth;
        if (maxwidth != "") maxwidth = "max-width:" + maxwidth + ";"

        var minwidth = p.style.minWidth;
        if (minwidth != "") minwidth = "min-width:" + minwidth + ";"

        var padding = p.style.padding;
        if (padding != "") padding = "padding:" + padding + ";"


        var styles = getComputedStyle(p);

        var portraitwidth = styles.getPropertyValue('--portrait-width');
        if (portraitwidth != "") portraitwidth = "--portrait-width:" + portraitwidth + ";"

        var landscapewidth = styles.getPropertyValue('--landscape-width');
        if (landscapewidth != "") landscapewidth = "--landscape-width:" + landscapewidth + ";"

        var desktopwidth = styles.getPropertyValue('--desktop-width');
        if (desktopwidth != "") desktopwidth = "--desktop-width:" + desktopwidth + ";"

        var colname = p.getAttribute('name');

        if (colname) {
            filterhtml += "<select class='" + classname + "' size='1' style='" + width + minwidth + maxwidth + padding + portraitwidth + landscapewidth + desktopwidth + "' onchange='colfilterchanged(this)' name='" + colname + "'><option value=''></option></select>";
        }
        else {
            if (p.innerHTML.indexOf('filter.png') < 0) {  // omit filter symbol
                filterhtml += "<div style='float:left;" + width + minwidth + maxwidth + padding + portraitwidth + landscapewidth + desktopwidth + "'>&nbsp;</div>";
            };
        };


    });

    // download button
    filterhtml += '<img src="../../../icons/download.png" style="width: 18px; height: 18px; float:right; cursor:pointer; margin-right:2px;" title="Download" onclick="S10DownloadTable(this);"  />';


    var div = document.createElement('div');
    div.classList.add('colfilters');
    div.innerHTML = filterhtml;
    colheaders.appendChild(div)

    return colheaders.querySelector(".colfilters");
}


function colfilterchanged(f) {

    var colname = f.name;
    if (!colname) return;

    if (f.selectedIndex != 0) {
        f.style.backgroundColor = '#fff5ba';
    }
    else {
        f.style.backgroundColor = '';
    };

    var colfilters = f.closest(".colfilters");
    if (!colfilters) return;

    var colheaders = colfilters.closest(".colheaders");
    if (!colheaders) return;


    // search table form
    var tableform = colheaders;
    while (tableform && !tableform.classList.contains('table')) {
        tableform = tableform.nextElementSibling;
    };
    if (!tableform || !tableform.name) return;

    // apply active filters
    applyfilters(tableform, colfilters);
}


function clearfilters(colfilters) {

    // determine active column filter names
    var filters = s10.myQuerySelectorAll(colfilters, ".colfilter");

    var changed = false;

    filters.forEach(function (p) {
        if (p.selectedIndex != 0) {
            changed = true;
        };

        // clear all options
        p.options.length = 0;

        // insert 1st one (no selections)
        p.options[0] = new Option("", "", false, false);
        p.options[0].selected = true;

        p.style.backgroundColor = '';
        p.value = "";
        p.selectedIndex = 0;

    });

    return changed;
}

function applyfilters(tableform) {

    var colfilters = tableform.s10colfilters;
    if (!colfilters) return;

    var tables = tableform.getElementsByTagName('TABLE');
    if (!tables) return;
    var table = tables[0];
    var table = tables[0];
    if (!table) {
        // empty table
        clearfilters(colfilters);
        return;
    };

    var no = tableform.getAttribute('s10tableno');
    if (!no) return;


    // determine active column filter names
    var filters = s10.myQuerySelectorAll(colfilters, ".colfilter");

    // loop through table rows
    for (var i = 0, row; row = table.rows[i]; i++) {


        // we save the info which filters excluded this row
        var s10filterexclusion = "";


        var cells = s10.myQuerySelectorAll(row, "[name]");
        for (var k = 0; k < filters.length; k++) {

            var filter = filters[k];
            if (filter.selectedIndex != 0) {

                var cell = cells[k];

                if (cell) {
                    var cellvalue = s10.get_element_value(cell);
                    if (filter.value == '[]') {
                        if (cellvalue != '') {
                            s10filterexclusion += (filters[k].name + ',');
                        };
                    }
                    else {
                        if (cellvalue != filter.value) {
                            s10filterexclusion += (filters[k].name + ',');
                        };
                    };
                };

            };
            if (s10filterexclusion == "") {

                row.removeAttribute('s10filterexclusion');
                row.style.display = 'table-row';
            }
            else {

                row.setAttribute('s10filterexclusion', s10filterexclusion);
                row.style.display = 'none';

            };

        };

    };


    // build new filter values asynchonously 
    window.setTimeout(function () {
        buildfiltervalues(tableform);
    }, 1);

}


function buildfiltervalues(tableform) {

    var colfilters = tableform.s10colfilters;
    if (!colfilters) return;


    var tables = tableform.getElementsByTagName('TABLE');
    if (!tables) return;

    var table = tables[0];
    if (!table) {
        // empty table
        clearfilters(colfilters);
        return;
    };

    var tableno = tableform.getAttribute('s10tableno');
    if (!tableno) return;



    // determine active column filter names
    var filters = s10.myQuerySelectorAll(colfilters, ".colfilter");
    var filtervalues = new Array();
    var filtermaps = new Array();

    filters.forEach(function (p) {

        filtervalues.push(p.value);

        // create maps
        var mymap = new Map();
        filtermaps.push(mymap);

    });

    clearfilters(colfilters);

    var displayed_rows = 0;

    // loop through table rows
    for (var i = 0, row; row = table.rows[i]; i++) {


        // remove total line
        if (row.getAttribute('s10totals')) {
            row.parentNode.removeChild(row);
            break;
        };

        var s10filterexclusion = row.getAttribute('s10filterexclusion');

        if (!s10filterexclusion || s10filterexclusion == "") {
            displayed_rows++;
        };

        var cells = s10.myQuerySelectorAll(row, "[name]");

        for (var k = 0; k < filters.length; k++) {

            // check that this row is selected by all filters except current one
            if (!s10filterexclusion || s10filterexclusion == "" || s10filterexclusion == (filters[k].name + ',')) {

                var cell = cells[k];

                if (cell) {
                    var cellvalue = s10.get_element_value(cell);

                    // special handling for empty value selection
                    if (cellvalue == '') cellvalue = '[]';

                    var value = filter_sort_format(cellvalue);
                    var count = filtermaps[k].get(value);
                    if (count) {
                        filtermaps[k].set(value, count + 1);
                    }
                    else {
                        filtermaps[k].set(value, 1);
                    };
                };
            };
        };

    };



    // insert map values
    for (var k = 0; k < filters.length; k++) {
        var filterelement = filters[k];
        var filterhtml = new Array();

        // sort map
        var filtermap = new Map([...filtermaps[k]].sort(function (a, b) { return a[0].localeCompare(b[0]); })); 
        var value_found = false;

        filtermap.forEach((value, key) => {

            key = filter_unsort_format(key);
            var label = key;
            if (value > 1) {
                label = key + ' (' + value + ')';
            };

            var keylit = key.replace(/'/g, "&#39;");

            filterhtml.push("<option value='" + keylit + "'>" + label + "</option>")

            if (key == filtervalues[k]) {
                value_found = true;
            };


        });



        filterelement.innerHTML += filterhtml.join("");

        if (value_found == true) {
            filterelement.value = filtervalues[k];
            filterelement.style.backgroundColor = '#fff5ba';
        }
        else {

            if (filtervalues[k] != "") {
                filterelement.options[filterelement.options.length] = new Option(filtervalues[k] + ' (0)', filtervalues[k], false, false);
                filterelement.value = filtervalues[k];
                filterelement.style.backgroundColor = '#fff5ba';
            };
        };

    };


    // add total line 
    if (displayed_rows > 1 && colfilters.querySelector('.totals')) {

        var lastrow = table.rows[table.rows.length - 1];
        var tableinfo = find_tableinfo(tableno);

        var totalrow = document.createElement('TR');
        var trowhtml = tableinfo.trowhtml.replace(/onclick=/g, "data-s10ignore=");
        totalrow.innerHTML = "<td class='tablerow' style='font-weight:bold; background-color: #e9e8e7'>" + trowhtml + "</td>";

        totalrow.setAttribute('s10totals', "true");


        var cells = s10.myQuerySelectorAll(totalrow, "[name]");

        // set values
        for (var k = 0; k < filters.length; k++) {

            var cell = cells[k];
            s10.set_element_value(cell, '');

            if (k == 0) s10.set_element_value(cell, '*');

            // totals to calculate?
            if (filters[k].classList.contains('totals')) {

                var total = build_total(table, filters[k].name);
                s10.set_element_value(cell, total);
            };

        };


        // suppress "request detail" cell
        var requestdetailcell = totalrow.querySelector('.tablerequestdetail');
        if (requestdetailcell) {
            requestdetailcell.style.display = 'none';
        };

        lastrow.parentElement.appendChild(totalrow);
    };

};



function build_total(table, colname) {

    var total = BigInt(0);
    var selector = "[name='" + colname + "']";


    var decimalcomma = false;
    var decimalpoint = false;


    // loop through table rows
    for (var i = 0, row; row = table.rows[i]; i++) {

        var s10filterexclusion = row.getAttribute('s10filterexclusion');

        // skip hidden rows
        if (s10filterexclusion && s10filterexclusion != "") {
            continue;
        };


        var cell = row.querySelector(selector);
        var factor = BigInt(100);

        if (cell) {
            var cellvalue = s10.get_element_value(cell);
            if (cellvalue != "") {
                if (cellvalue.length > 3 && cellvalue.indexOf(',') == cellvalue.length - 3) {
                    decimalcomma = true;
                    factor = BigInt(1);
                };
                if (cellvalue.length > 3 && cellvalue.indexOf('.') == cellvalue.length - 3) {
                    decimalpoint = true;
                    factor = BigInt(1);
                };

                cellvalue = cellvalue.replace(/,/g, '').replace(/\./g, '');
                if (!isNaN(cellvalue)) {
                    total += BigInt(cellvalue) * factor;
                };
            };
        };

    };

    var result = total / 100n + '';

    if (decimalcomma == true) {
        result = parseInt(result).toLocaleString('de-DE');
        var decpart = (total % 100n) + "";
        if (decpart.length < 2) decpart = '0' + decpart;
        result = result + ',' + decpart;
        return result;
    };

    if (decimalpoint == true) {
        result = parseInt(result).toLocaleString('en-US');
        var decpart = (total % 100n) + "";
        if (decpart.length < 2) decpart = '0' + decpart;
        result = result + '.' + decpart;
        result = result.replace(".0", ".00");
    };

    result = parseInt(result).toLocaleString();
    return result;

}

function filter_sort_format(x) {

    // sortable format
    var y = 'a';


    // possibly date format?
    if (x.length == 10) {

        var parts = x.split('.');
        if (parts.length != 3) parts = x.split('-');
        if (parts.length != 3) parts = x.split('/');
        if (parts.length == 3) {
            if (parts[2].length == 4) y = parts[2] + parts[1] + parts[0];
        };

    };

    // no date ? then check for number
    if (y == 'a') {
        var n = x.replace(/,/g, '').replace(/\./g, '');
        if (!isNaN(n)) {
            y = BigInt(n) + BigInt(90000000000000000000000000);
        };
    };

    return (y + '\t°°' + x);
}

function filter_unsort_format(x) {

    return (x.split('\t°°')[1]);

}




function download_table(f) {


    var columnDelimiter = ';';
    var lineDelimiter = '\n';
    var csvdata = new Array();
    var csvline = "";


    var colfilters = f.closest(".colfilters");
    if (!colfilters) return;

    var colheaders = f.closest(".colheaders");
    if (!colheaders) return;

    var colfilterelements = s10.myQuerySelectorAll(colfilters, "[name]");

    // search table form
    var tableform = colheaders;
    while (tableform && !tableform.classList.contains('table')) {
        tableform = tableform.nextElementSibling;
    };
    if (!tableform || !tableform.name) return;

    var tables = tableform.getElementsByTagName('TABLE');
    if (!tables) return;
    var table = tables[0];
    if (!table) return;


    // loop through table rows
    for (var i = 0, row; row = table.rows[i]; i++) {

        // omit totlas row
        if (row.getAttribute('s10totals')) {
            continue;
        };

        // skip hidden rows
        if (row.style.display == "none") {
            continue;
        };

        var csvline = "";

        var cells = s10.myQuerySelectorAll(row, "[name]");

        for (var k = 0; k < colfilterelements.length; k++) {
            var cell = cells[k];
            var cellvalue = s10.get_element_value(cell);
            if (csvline != "") csvline += columnDelimiter;
            if (cellvalue.indexOf(columnDelimiter) != -1) {
                csvline += '"' + cellvalue.replace(/"/g, '""') + '"';
            }
            else {
                csvline += cellvalue;
            };

        };

        csvdata.push(csvline);

    };

    var data = 'data:text/csv;charset=utf-8,' + '\uFEFF' + encodeURI(csvdata.join(lineDelimiter));  // with UTF-8 BOM

    var link = document.createElement('a');
    link.setAttribute('href', data);
    link.setAttribute("download", tableform.name + ".csv");
    link.click();
}

function context_info(f) {

    // hyperlink info for anchor element
    if (!f) return "";

    var parm = 's10contextinfo';

    var name = f.getAttribute('name');

    var value = s10.get_element_value(f);

    if (name) {
        name = name.toLowerCase();
        parm += ('~~~s10fieldname=' + name);
        parm += ('~~~s10fieldvalue=' + value);
        parm += ('~~~' + name + '=' + value);
    };


    // collect linkvalues for tabledetail
    var tabledetail = f.closest('.tabledetail');
    if (tabledetail) {
        var h = tabledetail.firstElementChild;
        while (h) {
            if (s10.is_linkkey(h)) {
                var h_name = h.getAttribute('name');
                if (h_name) {


                    // no subobject name, since method is usually called up in subobject
                    var dotpos = h_name.lastIndexOf('.');
                    if (dotpos > - 1) {
                        h_name = h_name.substr(dotpos + 1);
                    };


                    parm += ('~~~' + h_name.toLowerCase() + '=' + s10.get_element_value(h));
                } else {
                    alert('class=linkkey specified without name= (belonging to link ' + name + ')');
                };

            };
            h = h.nextElementSibling;
        };
    };


    var h = f.parentElement.firstElementChild;

    // for tablerow, look at all columns
    if (f.classList.contains('tablerow')) {
        h = f.firstElementChild;
    };

    while (h) {
        if (s10.is_linkkey(h)) {
            var h_name = h.getAttribute('name');
            if (h_name) {


                // no subobject name, since method is usually called up in subobject
                var dotpos = h_name.lastIndexOf('.');
                if (dotpos > - 1) {
                    h_name = h_name.substr(dotpos + 1);
                };

                parm += ('~~~' + h_name.toLowerCase() + '=' + s10.get_element_value(h));
            } else {
                alert('class=linkkey specified without name= (belonging to link ' + name + ')');
            };

        };
        h = h.nextElementSibling;
    };


    var tablename = "";
    var row = 0;

    // table cell ?
    var tabrow = f.closest('.tablerow');
    if (tabrow) {
        var col1 = tabrow.firstElementChild;
        while (col1 && !(s10.is_cell(col1) && col1.id && col1.id.indexOf('#') != -1)) col1 = col1.nextElementSibling;

        if (col1) {
            var fid = col1.id.split('#')[1];
            var parts = fid.split('.');

            if (parts.length >= 3) {
                // table name can be "object.table"
                tablename = parts.slice(0, parts.length - 2).join('.');
                row = parts[parts.length - 2];
            };

        };
    };

    parm += ('~~~s10tablename=' + tablename.toLowerCase());
    parm += ('~~~s10rownumber=' + row);


    while (f && !f.id) f = f.parentElement;

    if (f) parm += ('~~~s10elementid=' + f.id);

    return parm;

}



function linkclicked(f, e) {

    f.classList.add('linkvisited');

    var linkname = f.getAttribute('name');
    if (!linkname) return;
    var methodname = "";

    // handle text/label link as link to original field
    linkname = linkname.replace(/@text/ig, '');
    linkname = linkname.replace(/@label/ig, '');


    var dotpos = linkname.lastIndexOf('.');
    if (dotpos > - 1) {
        methodname = linkname.substr(0, dotpos) + '.on_link_' + linkname.substr(dotpos + 1);
    }
    else {
        methodname = 'on_link_' + linkname;
    };

    var val = s10.get_element_value(f);

    S10Apply(methodname, val, f, true);
}




function setinputfocus(p) {

    if (p == null || s10.is_mobile == true) return;

    try // element could be deleted (table)
    {
        if (p.tagName == 'SELECT') return;

        p.focus(); // processed onfocus asynchronously!
    } catch (e) {
        ;
    };

}


//  inline dialog screen closed
function inlinecallscreenreturn() {


    msgurl = "";
    msgtext = "";
    msgtype = "";


    // process return
    var loc_ifields = "";
    var loc_ivalues = "";
    var loc_action = "#0;~dialog_return";

    var loc_ofields = "";
    var loc_tfields = "";



    submit(s10.sessionid, loc_ifields, loc_ivalues, loc_action, loc_ofields, loc_tfields);

}



//  dialog screen closed
function callscreenreturn() {


    s10.popuplevel--;

    msgurl = "";
    msgtext = "";
    msgtype = "";


    // process return
    var loc_ifields = "";
    var loc_ivalues = s10.retval;
    var loc_action = "#0;~dialog_return";

    var loc_ofields = "";
    var loc_tfields = "";


    submit(s10.sessionid, loc_ifields, loc_ivalues, loc_action, loc_ofields, loc_tfields);

    return;
}


function valuehelp(f) {

    var val = s10.get_element_value(f);

    var action = 'on_valuehelp_' + f.name;

    // table cell ?
    if (s10.is_cell(f)) {

        var s = f.id.split("#");
        var t = s[1].split('.');

        if (t.length == 3) {
            action = t[0] + '.' + t[1] + '.' + action;
        };


    };



    var f_ifi = s10.find_doc_ifi(scrdata.mainifi, f.ownerDocument);
    action = s10.get_fulls10object(scrdata.mainifi, f_ifi) + action;

    S10Apply(action, val, f, false, true);

};


function back_to_logonpage() {

    // iFrame in launchpad ?
    if (window.history.length > 0 && window.top != s10.mytop()) {
        window.history.back();
    }
    else {
        parent.parent.window.location.replace(logon_href);
    }


}

function pbo() {


    if (s10ctl != s10.scrdata_stack[s10.popuplevel].s10ctl) {

        // should not occur
        // Enable input /Show popup screen
        return;
    }

    // indicate: no longer waiting for server after processing
    window.setTimeout('serverwait = false;', 1);

    // auto logoff?
    if (autologoff == 'X') {
        alert("Session timeout.\n\n Please logon again.");
        logoff();
        window.setTimeout('scrdata.enable_input();', 1);

    };


    // logoff?
    if (s10.logoff_active == true) {
        // unload?
        if (s10.unload_active) return;

        // return to logon page, if specified 
        if (logon_href != "") {

            back_to_logonpage();
            // parent.parent.window.location.replace(logon_href);

        } else {
            setTimeout(s10restart, 1);
        };
        window.setTimeout('scrdata.enable_input();', 1);
        return;
    };


    if (msgtype == 'L') // logoff
    {
        msgtype = "";

        if (logon_href != "") {
            back_to_logonpage();
            // parent.parent.window.location.replace(logon_href);
        } else {
            setTimeout(s10restart, 1);
        };
        window.setTimeout('scrdata.enable_input();', 1);

        return;
    };



    // problem with browser back?
    if (msgtype == 'X') {
        msgtype = "";

        window.setTimeout('scrdata.enable_input(0);', 1);

        if (confirm(s10.ui_text("confirm_logoff"))) {
            logoff();
        };

        return;
    };



    // force integer type  
    if (typeof (s10.stepno) == 'string') s10.stepno = parseInt(s10.stepno);
    if (typeof (s10.previous_stepno) == 'string') s10.previous_stepno = parseInt(s10.previous_stepno);




    s10.previous_stepno = s10.stepno;


    // check license if specified
    if (s10.license != "") {
        if (!s10.check_license(decodeURIComponent(s10.license))) {
            alert("S10 license invalid:\n" + decodeURIComponent(s10.license) + "\nPlease contact Synactive GmbH to obtain a valid license.")
        };
        s10.license = "";
    };

    // reset error field
    scrdata.first_error_field = null;



    // open document?
    if (msgtype == 'O') {

        scrdata.cursor_normal();

        var url = decodeURIComponent(msgurl);
        var name = decodeURIComponent(msgtext);
        var options = decodeURIComponent(msgexplanation);


        msgtype = "";
        msgurl = "";
        msgtext = "";
        msgexplanation = "";


        // open new window or document
        var whref = s10.filepath(url);


        // special handling of certain documents
        if (s10.stringEndsWith(url, '.zip') || s10.stringEndsWith(url, '.doc')) {
            scrdata.show_msg_popup('I', "<a target=_blank href='" + whref + "'>" + s10.ui_text("Open document") + " (" + url.substr(url.length - 4, 4) + ")</a>", "");
        } else {
            var w = window.open(whref, name, options);
            try {
                w.focus();
            } catch (e) {
                ;
            };

        };



        // process continue
        var loc_ifields = "";
        var loc_ivalues = "";
        var loc_action = "#" + s10.stepno + ";" + "~continue";

        var loc_ofields = "";
        var loc_tfields = "";

        submit(s10.sessionid, loc_ifields, loc_ivalues, loc_action, loc_ofields, loc_tfields);

        return;

    };



    // Call screen?
    if (msgtype == 'C') {

        // scrdata.cursor_normal();

        var top = -1;
        var left = -1;

        var width = 0;
        var height = 0;
        var anchor = "";

        var options = decodeURIComponent(msgtext);
        var wnd = s10.scrdata_stack[0].appl_wnd;

        var s = new Array();
        s = options.split(";");

        for (var i = 0; i < s.length; i++) {
            if (s[i].substr(0, 6) == "width:") width = parseInt(s[i].substr(6), 10);
            if (s[i].substr(0, 7) == "height:") height = parseInt(s[i].substr(7), 10);
            if (s[i].substr(0, 7) == "anchor:") anchor = s[i].substr(7);
            if (s[i].substr(0, 4) == "top:") top = parseInt(s[i].substr(4), 10);
            if (s[i].substr(0, 5) == "left:") left = parseInt(s[i].substr(5), 10);

        };


        if (anchor != "") {
            var f = wnd.document.getElementById(anchor);
            if (!f) {
                var fs = wnd.document.getElementsByName(anchor);
                if (fs.length > 0) f = fs[0];
            };

            if (f) {
                top += s10.relPosTop(f);
                left += s10.relPosLeft(f);
            };

        };

        if (top < 0) top = 100 + s10.popuplevel * 30;
        if (left < 0) left = 100 + s10.popuplevel * 40;


        if (anchor == "") {

            if (typeof (wnd.pageXOffset) == 'number') {
                left += wnd.pageXOffset;
                top += wnd.pageYOffset;
            } else {

                left += wnd.document.body.scrollLeft;
                top += wnd.document.body.scrollTop;
            };

        }



        // Set screen id
        s10.dialog_applid = scrdata.applid;
        s10.dialog_screenid = scrdata.screenid;
        s10.dialog_tabid = scrdata.tabid;

        // restore old one
        scrdata.applid = scrdata.oldapplid;
        scrdata.screenid = scrdata.oldscreenid;
        scrdata.tabid = scrdata.oldtabid;

        var url = s10.rootpath + 'classes/synactiveS10/synactiveS10.dialog' + (s10.popuplevel + 1) + '.html';

        // change application frame?  (needs to be done here as well beacaus of ic.dialog() in on_init_...
        if (scrdata.change_application_frame) {
            scrdata.change_application_frame = false;
            scrdata.application_frame_no = 3 - scrdata.application_frame_no;
        };


        switch (scrdata.application_frame_no) {
            case 1:
                scrdata.appl_wnd.parent.document.getElementsByTagName('frameset')[0].rows = "0,*,0";
                break;

            case 2:
                scrdata.appl_wnd.parent.document.getElementsByTagName('frameset')[0].rows = "0,0,*";
                break;
        };


        var popupitemhtml = '<iframe application="yes" name="dialog' + (s10.popuplevel + 1) + '" src="' + url + '" width=100%  height=100% marginwidth="0" marginheight="0"  border="1" frameborder="0" framespacing="0" border="0" target="_self"></iframe>';

        inline_dialog_active = true;

        scrdata.show_dialog_popup(scrdata, popupitemhtml, left, top, width, height);

        return;
    };




    // return from dialog?
    if (msgtype == 'R') {

        // enable input again after processing
        window.setTimeout('scrdata.enable_input();', 1);


        if (s10.popuplevel > 0) {
            // inline popup?
            if (s10.scrdata_stack[scrdata.popuplevel - 1].diaPopup != null) {
                s10.scrdata_stack[scrdata.popuplevel - 1].dia_popup_close();
            } else {
                parent.parent.close();
            };
        };
    };




    // Immediate message?
    if (msgtype == 'S') {

        show_msg_frame();


        // return from message
        var loc_ifields = "";
        var loc_ivalues = "";
        var loc_action = "#" + s10.stepno + ";" + "~continue";

        var loc_ofields = "";
        var loc_tfields = "";

        submit(s10.sessionid, loc_ifields, loc_ivalues, loc_action, loc_ofields, loc_tfields);

        return;

    };



    // confirmation ?
    if (msgtype == 'M') {

        var r = confirm(decodeURIComponent(msgtext));

        msgtype = "";
        msgurl = "";
        msgtext = "";
        msgexplanation = "";


        // return from message
        var loc_ifields = "";
        var loc_ivalues = "";
        if (r == true) loc_ivalues = 'X';
        var loc_action = "#" + s10.stepno + ";" + "~confirmation";

        var loc_ofields = "";
        var loc_tfields = "";

        submit(s10.sessionid, loc_ifields, loc_ivalues, loc_action, loc_ofields, loc_tfields);

        return;

    };



    // continue action with large ivalues
    if (msgtype == 'K') {

        msgtype = "";
        msgurl = "";
        msgtext = "";
        msgexplanation = "";

        continue_package();

        return;

    };





    // continue upload
    if (msgtype == 'U') {

        msgtype = "";
        msgurl = "";
        msgtext = "";
        msgexplanation = "";

        upload_file_part();

        return;

    };


    scrdata.oldapplid = scrdata.applid;
    scrdata.oldscreenid = scrdata.screenid;
    scrdata.oldtabid = scrdata.tabid;

    var myview = scrdata.screenid + '@' + scrdata.applid;

    // Screen changed?
    if (msgtype != 'E' && scrdata.change_application_frame == false &&

        (
            (scrdata.application_frame_no == 1 && scrdata.view1 != myview) ||
            (scrdata.application_frame_no == 2 && scrdata.view2 != myview))) {


        // reset previous screen info
        reset_screen_info();


        // load into invisible frame
        var applocation = null;
        switch (scrdata.application_frame_no) {
            case 1:
                scrdata.view2 = myview;
                applocation = parent.parent.app2.location;
                break;
            case 2:
                scrdata.view1 = myview;
                applocation = parent.parent.app1.location;
                break;
        };

        set_applocation(applocation, scrdata.applid, scrdata.screenid);


        scrdata.change_application_frame = true;

    } else {

        // set current screen id
        switch (scrdata.application_frame_no) {
            case 1:
                scrdata.view2 = myview;
                break;
            case 2:
                scrdata.view1 = myview;
                break;
        };



        // reset error / focus state
        for (var i = 0; i < s10.mylength(main_ielements); i++) s10.reset_error(main_ielements[i]);

        // reset  error fields
        for (var i = 0; i < s10.mylength(error_fields); i++) s10.reset_error(error_fields[i]);

        // reset array of error cells
        error_fields.length = 0;


        // save message type and text
        scrdata.msgtext = msgtext;
        scrdata.msgtype = msgtype;

        // reset radiobutton error status 
        if (typeof (scrdata.mainifi) != "undefined") reset_radio_error(scrdata.mainifi);

        // set focus?
        myfocusfield = decodeURIComponent(myfocusfield).trim().toLowerCase();
        if (myfocusfield != "") {

            //  table cell?
            var parts = myfocusfield.split('.');
            if (parts.length == 3) {
                var tablename = parts[0];
                var rownumber = parts[1];
                var colname = parts[2];
                var tableinfo = find_tableinfo_by_tablename(tablename);
                if (tableinfo) {
                    var f = tableinfo.tablebodyform.ownerDocument.getElementById(tableinfo.no + '#' + tablename + '.' + rownumber + '.' + colname);
                    if (f) {
                        scrdata.application_focus = f;
                        myfocusfield = "";
                    };
                };
            };



            if (myfocusfield != "") {

                // input/output field?
                for (var i = 0; i < s10.mylength(main_oelements); i++) {
                    if (main_oelements[i].getAttribute('name').toLowerCase() == myfocusfield) {
                        scrdata.application_focus = main_oelements[i];
                        myfocusfield = "";
                        break;
                    };
                };
            };

            myfocusfield = "";

        };


        if (msgtype == 'E') {

            var values = new Array();

            if (typeof (ovalues) == "undefined") {

                if (msgtext != '') {
                    alert(msgtext + '\n\n' + msgexplanation);
                    return;

                };

                alert("Server not responding, configuration problem");
                return;
            };

            values = ovalues.split(";");

            // ignore tabclick / filter click, if any
            processtabclick = null;
            tabpageplus = null;
            tabpageminus = null;

            var oelen = s10.mylength(main_oelements);
            var ielen = s10.mylength(main_ielements);
            var velen = s10.mylength(values);

            for (var i = 0; i < velen; i++) {
                var obj;
                var txt = values[i];

                if (i < oelen) {
                    obj = main_oelements[i];
                } else {

                    if (i < oelen + ielen) {
                        obj = main_ielements[i - oelen];
                    } else {

                        if (txt != "") {
                            var nameparts = new Array();
                            nameparts = txt.split(".");
                            obj = null;

                            // find table info                      
                            var tableinfo = find_tableinfo(nameparts[0]);

                            var doc = tablebodyform.ownerDocument;
                            obj = doc.getElementById(txt); // table cell


                            if (obj != null) {
                                txt = 'E';
                            } else {
                                text = ''; // should not occur
                            };

                        };
                    };


                };




                // error related to this field?
                if (txt == 'E') {

                    // save error field  
                    error_fields.push(obj);
                    s10.set_error(obj);

                    // set focus
                    if (!scrdata.application_focus) {
                        scrdata.application_focus = obj;
                    };

                    if (!scrdata.first_error_field || ((s10.relPosTop(obj) > s10.relPosTop(scrdata.first_error_field)) && (s10.relPosTop(obj) < s10.relPosTop(scrdata.first_error_field) + 100))) {
                        scrdata.first_error_field = obj;
                    };


                };

                ;
            }; //for



        } else {




            var values = new Array();

            if (typeof (ovalues) == "undefined") {

                alert("Server not responding, configuration problem");
                return;
            };


            // reset changed cells 
            if (!scrdata.chcells_reset_done) {
                scrdata.chcells.length = 0;
            };

            scrdata.chcells_reset_done = false;



            values = ovalues.split(";");

            for (var i = 0; i < s10.mylength(main_oelements); i++) {

                var obj = main_oelements[i];

                // select? then create options 
                if (s10.is_select(obj)) {
                    var s10dropdownlist = obj.getAttribute("data-s10dropdownlist");
                    if (s10dropdownlist) {
                        if (values[i] != '~') s10.create_dynamic_options(obj, decodeURIComponent(values[i]));

                        // skip dropdown list so that value is set later on
                        i = i + 1;

                    };
                };


                // no change?
                if (values[i] == '~') {
                    continue;
                };


                // inputcell select? then save ddl into table form
                if (s10.is_inputcellselect(obj)) {
                    var s10dropdownlist = obj.getAttribute("data-s10dropdownlist");
                    if (s10dropdownlist) {

                        var tableform = obj['s10tableform'];
                        if (tableform && values[i] != '~') tableform.setAttribute('s10ddl_' + obj.name, (values[i]));
                    };
                    continue;
                };



                // datalist? then create datalist options 
                if (s10.is_datalist(obj)) {
                    s10.create_datalist_options(obj, decodeURIComponent(values[i]));

                    // no value
                    continue;
                };




                // set new values if no error message
                if (msgtype != 'E') {

                    // Set output text
                    if (typeof (values[i]) == "undefined") values[i] = "";


                    // handle special formats
                    var val = new Array();
                    val = values[i].split("#");

                    var txt = decodeURIComponent(val[0]).trim();

                    // set new css class
                    scrdata.change_css_class(obj, val[1]);


                    if (s10.tagINNER(obj) && s10.is_output(obj)) {
                        if (obj.oldvalue == null || obj.oldvalue != txt) {

                            if (s10.is_outputhtml(obj)) {
                                s10.mysetinnerHTML(document, obj, txt);
                            } else {
                                s10.mysetinnerHTML(document, obj, s10.textToHTML(txt));
                            };

                            obj.oldvalue = txt;
                        };
                        continue;
                    };




                    if (s10.is_image(obj)) {
                        obj.setAttribute('src', s10.filepath(txt));
                        continue;
                    };



                    // save old value
                    obj.oldvalue = txt;




                    if (s10.is_radioany(obj)) {
                        var ifi = s10.get_radio_ifi(scrdata.mainifi, obj);


                        // search matching radiobuttons
                        for (var k = 0; k < ifi.relements.length; k++) {
                            var r = ifi.relements[k];

                            if (r.getAttribute("name") == obj.getAttribute("name")) {

                                if (txt == r.value) {
                                    r.checked = true;
                                    r.setAttribute("s10checked", true);

                                } else {
                                    r.checked = false;
                                    r.setAttribute("s10checked", false);
                                };
                            };

                        };

                    } else {


                        // set new element value
                        if (s10.set_element_value(obj, txt)) {

                            if (obj.type == 'hidden' && typeof (obj.onchange) == "function") {
                                var cls = s10.execute_onchange(obj);
                                var wnd = s10.myparentWindow(obj.ownerDocument);
                                wnd.setTimeout(cls, 1);
                            };

                            ;
                        };

                    };



                } else {
                    if (!s10.is_radioany(obj)) {
                        obj.value = "";
                    };


                };


            }; // for

        };




        // set drop down lists into table cells
        for (var k = 0; k < tableinfos.length; k++) {

            var tableform = tableinfos[k].tablebodyform;
            var ddlcells = s10.myQuerySelectorAll(tableform, '.inputcellselect');

            for (var n = 0; n < ddlcells.length; n++) {

                var p = ddlcells[n];
                var ddl = tableform.getAttribute('s10ddl_' + p.name);
                if (ddl) {

                    s10.create_dynamic_options(p, decodeURIComponent(ddl));

                    if (p.hasAttribute('s10selectvalue')) {
                        p.value = p.getAttribute('s10selectvalue');
                        p.removeAttribute('s10selectvalue');
                    };


                };

            };

        };



        // copy table detail?  
        if (scrdata.table_detail_tablerow && scrdata.table_detail_copy) {

            var source = scrdata.table_detail_tablerow.s10sourcearea;
            var target = scrdata.table_detail_tablerow.s10detailarea;

            // copy the table detail area asynchonously to that onchange= for tables is processed before copying
            setTimeout(function () { copy_table_details(source, target); }, 1);

        };


        // display correct tab
        if (processtabclick) {
            change_tab(processtabclick);
            processtabclick = null;
            tabpageplus = null;
            tabpageminus = null;
        };


        // Enable input /Show popup screen
        window.setTimeout('scrdata.enable_input_or_popup(30);', 1);


        if (scrdata.application_focus != null) {
            scrdata.application_focus.focus();
            scrdata.application_focus = null;

        } else {

            // set focus
            try {
                scrdata.appl_doc.body.focus(); // default
            } catch (e) {
                ;
            };

            if (scrdata.first_error_field != null) {
                setinputfocus(scrdata.first_error_field);
            } else {
                // tab just activated?
                if (scrdata.first_input_tab_activated != null) {
                    setinputfocus(scrdata.first_input_tab_activated);
                    scrdata.first_input_tab_activated = null;
                } else {

                    if (scrdata.lastfocus != null) {

                        setinputfocus(scrdata.lastfocus);

                    } else {
                        if (scrdata.first_input != null) {
                            //setinputfocus(scrdata.first_input);

                            // scroll to top of page
                            //s10.myparentWindow(scrdata.first_input.ownerDocument).scrollTo(0, 0);

                        };
                    };


                };
            };


            // change application frame
            // asynchonously, since "onchange" handlers for hidden fields should execute first
            window.setTimeout(change_application_frame, 1);

        };

        if ((msgtext != '' || msgexplanation != '') && (msgtype == '' || msgtype == ' ')) msgtype = 'I'; // pending message


        // Show message
        show_msg_frame();

    };

}


// copy table details
function copy_table_details(source, target) {

    if (source && target) {

        var detailviewcell = scrdata.table_detail_tablerow.s10detailviewcell;

        target.innerHTML = source.innerHTML;
        target.className = source.className;
        target.style.display = 'block';


        // set link to target
        s10.tabledetailarea = target;

        scrdata.table_detail_tablerow.classList.add('active');
        scrdata.table_detail_tablerow.classList.remove('hidden');

        var tablerequestdetail = scrdata.table_detail_tablerow.querySelector(".tablerequestdetailinwork");
        if (tablerequestdetail && tablerequestdetail.parentElement == scrdata.table_detail_tablerow) tablerequestdetail.className = "tablerequestdetailactive";


        // copy input values and select
        s10.copy_inputvalues(source, target);

        // set element ids to pertain uniqueness
        s10.set_unique_ids(target);

        if (detailviewcell) {
            detailviewcell.value = '';
            scrdata.cellchanged(detailviewcell);
        };


        scrdata.table_detail_tablerow = null;
    };


}

function change_application_frame() {
    if (scrdata.change_application_frame) {
        scrdata.change_application_frame = false;
        scrdata.application_frame_no = 3 - scrdata.application_frame_no;

    };


    switch (scrdata.application_frame_no) {
        case 1:
            scrdata.appl_wnd.parent.document.getElementsByTagName('frameset')[0].rows = "0,*,0";
            break;

        case 2:
            scrdata.appl_wnd.parent.document.getElementsByTagName('frameset')[0].rows = "0,0,*";
            break;
    };


}




function S10Logon(client, user, password, language, classname, mainprogram, service_url, viewtarget, options, post_data) {

    if (!scrdata.allowui()) return;

 


    // program specified?
    if (mainprogram) {
        classname = '\\PROGRAM=' + mainprogram + '\\CLASS=' + classname;
    };


    // set classname
    if (!classname) {
        alert("S10 logon: Please specify the ABAP class as 5th parameter");
        return;
    };

    classname = classname.toUpperCase();


    // set service url
    if (!service_url) {
        service_url = "s10";
    };


    //  set viewtarget
    if (!viewtarget) {
        viewtarget = language;
    };


    if (!post_data) {
        post_data = "";
    };
    if (post_data != '') postdata = '&' + postdata;


    if (!options) {
        options = "";
    };

    s10.language = language.toLowerCase();

    // absolute service url specified?
    if (service_url.indexOf("://") > -1) {
        s10.its_service_url = service_url;
    }
    else {
        var m = window.location.href.indexOf('/sap/bc');
        if (m > 0) {
            s10.its_service_url = window.location.href.substr(0, m) + "/" + service_url;
        }
        else {
            s10.its_service_url = window.location.origin + "/" + service_url;
        };
     
    };


    s10.viewtarget = viewtarget.toLowerCase();

    logon_href = parent.parent.location.href;

    // Default system
    var appname = document.referrer;
    appname = appname.substring(0, appname.indexOf("classes"));
    appname = appname.substring(0, appname.length - 1);
    var i = appname.length - 1;

    while (i > 0 && appname.charAt(i) != '/' && appname.charAt(i) != '\\') i--;
    appname = appname.substring(i + 1);

    session_system = appname;
    session_client = client;
    session_user = s10.trim(user);
    session_password = password;

    // reset logoff indicator
    s10.logoff_active = false;

    // set step numbers
    s10.stepno = 0;
    s10.previous_stepno = -1;


    var mediawidth = 320;
    var mediaheight = 320;

    while (window.matchMedia && window.matchMedia("(min-device-width: " + mediawidth + "px)").matches) {
        mediawidth += 10;
    };

    mediawidth -= 10;

    while (window.matchMedia && window.matchMedia("(min-device-height: " + mediaheight + "px)").matches) {
        mediaheight += 10;
    };

    mediaheight -= 10;


    options = "href=" + document.location.href.substr(0, document.location.href.indexOf('/classes/synactiveS10')) + ';' +
        "querystring=" + s10.mytop().document.location.search.substr(1) + ";" +
        "userAgent=" + navigator.userAgent.replace(/;/g, '°') + ';' +
        "screenWidth=" + window.screen.width + ';' +
        "screenHeight=" + window.screen.height + ';' +
        "innerWidth=" + top.innerWidth + ';' +
        "innerHeight=" + top.innerHeight + ';' +
        "outerWidth=" + top.outerWidth + ';' +
        "outerHeight=" + top.outerHeight + ';' +
        "deviceWidth=" + mediawidth + ';' +
        "deviceHeight=" + mediaheight + ';' +
        "devicePixelRatio=" + window.devicePixelRatio + ';' +
        options;


    // disable input
    scrdata.disable_input();

    // cursor to wait
    var e = null;
    e = S10Event(e);
    var anchor = eventtarget(e);

    scrdata.cursor_wait(anchor);

    // close popups
    scrdata.close_popups();


    // ITS logon
    var postdata =
        'sap-client=' + encodeURIComponent(session_client) +
        '&sap-user=' + encodeURIComponent(session_user) +
        '&sap-password=' + encodeURIComponent(session_password) +
        '&sap-language=' + encodeURIComponent(s10.language.toUpperCase()) +
        '&command=logon' +
        '&user=' + encodeURIComponent(session_user) +
        '&password=' + encodeURIComponent(session_password) +
        '&program=' + encodeURIComponent(classname) +
        '&options=' + encodeURIComponent(options);

    ITSmobile_S10XMLHttpRequest(postdata + post_data + '&~OKCode==ENTER=Enter');

}


function S10AutoLogon() {
    // auto logon?
    var splitVars = new Array();
    var urlvars = new Array();
    splitVars = parent.parent.location.search.replace("?", "").split("&");
    for (i = 0; i < splitVars.length; i++) {
        var v = splitVars[i].split("=");
        var vname = v[0];
        urlvars[vname] = decodeURIComponent(v[1]);
    }

    // auto logon?
    if (urlvars['auto_logon_user']) {
        S10logon(urlvars['auto_logon_user'], urlvars['auto_logon_password'], urlvars['auto_logon_options']);
    };

};



function S10Logoff(confirm_popup) {

    if (s10.sessionid == "" || s10.popuplevel != 0) {
        return;
    };

    if (confirm_popup == null || confirm_popup == false || confirm(s10.ui_text("confirm_logoff"))) {
        logoff();
    };
};



function unload() {

    s10.unload_active = true;
    logoff();
}



// Logoff
function logoff() {


    if (s10.sessionid == "") // || s10.popuplevel != 0)
    {
        return;
    };


    s10.logoff_active = true;


    // reset auto logoff
    autologoff = 'N';

    // reset screen-related info
    reset_screen_info();



    var postdata =
        'command=logoff' +
        '&sessionid=' + encodeURIComponent(s10.sessionid);

    ITSmobile_S10XMLHttpRequest(postdata + '&~OKCode==ENTER=Enter');

    s10.sessionid = "";

}

// user action
function step(action, f, no_field_transport, no_required_input_check) {

    // anchor element? than add context info
    if (f) {
        if (action.indexOf(':') > -1) {
            action += context_info(f);
        } else {
            action += (':' + context_info(f));
        };

    };

    // table cell?
    if (f != null && s10.is_inputcell(f)) s10.cch(s10ctl, f);


    // save element that is responsable for this action
    f_action = f;


    var locaction = action;

    if (no_field_transport != true) {
        if (scrdata.state_disable_input == true) return s10.noaction(s10ctl);
    };

    // reset error field
    scrdata.first_error_field = null;


    // Check required input

    // required fields, but empty
    main_reqempty = 0;

    main_ofields = "";
    main_tfields = "";
    main_oelements.length = 0;

    main_ifields = "";
    main_ivalues = "";
    main_ielements.length = 0;


    tvalues.length = 0;
    trownos.length = 0;
    tcolnames.length = 0;


    // input values
    if (no_field_transport != true) {
        input_concatenate_ifi(scrdata.mainifi, no_required_input_check, "");

        if (main_reqempty > 0 && !no_required_input_check) {

            // ignore previous tabclick, if any
            processtabclick = null;

            scrdata.close_popups();
            scrdata.show_msg_popup("E", s10.ui_text('ReqMsg'), s10.ui_text('ReqExp'));

            // enable input again after processing
            window.setTimeout('scrdata.enable_input();', 1);

            return s10.noaction(s10ctl);

        };



        // include each changed cell only once 
        scrdata.chcells.sort(function (a, b) {
            if (a.id < b.id) return -1;
            if (a.id > b.id) return 1;
            return 0;
        });
        var p;

        for (var i = 0; i < s10.mylength(scrdata.chcells); i++) {
            var q = scrdata.chcells[i];
            if (i == 0) p = q;

            if (i == 0 || p.id != q.id) {


                var sl = q.id.search('#');
                var idnew = q.id.slice(sl + 1); // reset after #
                var tableno = q.id.substring(0, sl);
                var tableinfo = find_tableinfo(tableno);
                var cellifi = tableinfo.ifi;
                var cells10object = s10.get_fulls10object(scrdata.mainifi, cellifi);

                // do not include cells of copied table details, input in table detail currently not supported
                // set_unique_ids() in framework.comp.js added a |
                if (idnew.indexOf('|') > -1) {
                    continue;
                };


                main_ifields = main_ifields + cells10object + idnew + ";";


                main_ielements.push(q);
                if (s10.is_checkbox(q)) {
                    if (q.checked) {
                        main_ivalues = main_ivalues + '1;';
                    } else {
                        main_ivalues = main_ivalues + '0;';
                    };

                } else {
                    main_ivalues = main_ivalues + encodeURIComponent(q.value.trim()) + ';';
                };

                p = q;

            };

        }; //endfor 



        // output fields
        concatenate_ifi(scrdata.mainifi, "");

        // set main tfields
        set_main_tfields();

    };

    // reset message fields
    msgtype = "";
    msgtext = "";
    msgexplanation = "";


    // encode action parameter
    var s = locaction.indexOf(":");

    if (s > 0) {
        var parm = locaction.substr(s + 1);
        locaction = locaction.substr(0, s + 1) + encodeURIComponent(parm);
    };


    // element specified? then set local action for this iframe
    if (f != null && typeof (f.className) == 'string') {
        scrdata.cursor_wait(f);

        var f_ifi = s10.find_doc_ifi(scrdata.mainifi, f.ownerDocument);
        if (f_ifi != null) locaction = s10.get_fulls10object(scrdata.mainifi, f_ifi) + action;
    };

    scrdata.disable_input();


    // process step
    var loc_ifields = filter_main_ifields();
    var loc_ivalues = main_ivalues;
    var loc_action = "#" + s10.stepno + ";" + locaction;

    var loc_ofields = filter_main_ofields();
    var loc_tfields = main_tfields;

    submit(s10.sessionid, loc_ifields, loc_ivalues, loc_action, loc_ofields, loc_tfields);

    return s10.noaction(s10ctl);


}




// buttoncell step
function buttoncell_step(f) {

    var f_ifi = s10.find_doc_ifi(scrdata.mainifi, f.ownerDocument);

    var s = new Array();
    s = f.id.split("#");

    var stepaction = '~cbc.' + s10.get_fulls10object(scrdata.mainifi, f_ifi) + s[1];

    scrdata.cursor_wait(f);

    step(stepaction, null);


}



// Upload
function upload(fcode, inputelement, anchor) {

    upload_inputelement = inputelement;
    upload_anchor = anchor;
    upload_data = null;

    // reset value, otherwise onchange is not triggered for same filename
    upload_inputelement.onchange = null;
    upload_inputelement.value = '';

    upload_inputelement.onchange = function (e) {
        handle_uploaded_files()
    };


    upload_fcode = fcode;
    upload_name = upload_inputelement.name;

    upload_inputelement.click();

}



// UploadData (base64 URL) 
function uploaddata(base64string, fcode, name, filename, anchor) {

    upload_anchor = anchor;
    upload_data = base64string;
    upload_fcode = fcode;
    upload_name = name;
    upload_filename = filename;
    upload_filesize = base64string.length;
    upload_fileoffset = 0;

    upload_data_part();

}




function handle_uploaded_files() {

    var files = upload_inputelement.files;

    // nothing selected?
    if (!files) return;

    // 1st file (nultiple files not supported)
    upload_fileobject = files[0];

    // set file name and size
    upload_filename = upload_fileobject.name;
    upload_filesize = upload_fileobject.size;

    if (upload_filesize > 16 * 1024 * 1024) {

        alert('File size > 16 MB, no upload possible)');
        return;
    };

    if (upload_filesize == 0) {
        alert('FIle is empty, no upload)');
        return;
    };

    upload_reader = new FileReader();

    // start uploading
    upload_fileoffset = 0;
    upload_file_part();


}

function upload_file_part() {

    if (upload_data !== null) {
        upload_data_part()
        return;
    };


    // file uload done?
    if (upload_fileoffset >= upload_filesize) {

        // reset reader
        upload_reader = null;

        // reset file object
        upload_fileobject = null;

        window.setTimeout('scrdata.enable_input();  S10Apply(upload_fcode, upload_filename, upload_anchor);', 1);


        return;

    };


    upload_reader.onloadend = function (event) {
        var result = upload_reader.result;

        // strip of data URL header by indexOf(',')
        var loc_ifields = upload_name;
        var loc_ivalues = upload_maxpartsize + ";" + upload_filesize + ";" + upload_fileoffset + ";" + result.substr(result.indexOf(',') + 1);
        var loc_action = "#" + s10.stepno + ";" + "~upload";
        var loc_ofields = "";
        var loc_tfields = "";


        var percentage = Math.floor(upload_fileoffset * 100 / upload_filesize);
        var kb = (upload_fileoffset / 1024 / 1024).toFixed(1);

        scrdata.show_msg_popup('S', '&#8593;&nbsp;&nbsp;' + percentage + '%&nbsp;&nbsp;&nbsp;' + kb + ' MB', '', upload_anchor);

        upload_fileoffset = upload_fileoffset + upload_maxpartsize;


        submit(s10.sessionid, loc_ifields, loc_ivalues, loc_action, loc_ofields, loc_tfields);

    };

    upload_reader.readAsDataURL(upload_fileobject.slice(upload_fileoffset, upload_fileoffset + upload_maxpartsize));
};


function upload_data_part() {


    // uload done?
    if (upload_fileoffset >= upload_filesize) {

        // reset data
        upload_data = null;

        window.setTimeout('scrdata.enable_input();  S10Apply(upload_fcode, upload_filename, upload_anchor);', 1);

        return;

    };

    var result = upload_data.substr(upload_fileoffset, upload_maxpartsize);

    var loc_ifields = upload_name;
    var loc_ivalues = upload_maxpartsize + ";" + upload_filesize + ";" + upload_fileoffset + ";" + result;
    var loc_action = "#" + s10.stepno + ";" + "~upload";
    var loc_ofields = "";
    var loc_tfields = "";


    var percentage = Math.floor(upload_fileoffset * 100 / upload_filesize);
    var kb = (upload_fileoffset / 1024 / 1024).toFixed(1);

    scrdata.show_msg_popup('S', '&#8593;&nbsp;&nbsp;' + percentage + '%&nbsp;&nbsp;&nbsp;' + kb + ' MB', '', upload_anchor);

    upload_fileoffset = upload_fileoffset + upload_maxpartsize;

    submit(s10.sessionid, loc_ifields, loc_ivalues, loc_action, loc_ofields, loc_tfields);
};




var replace_row = 0;
var prevrowval = new Array();

function do_replace_row(str) {
    // row number?
    if (str == '~~R~~') {
        return replace_row + 1;
    };


    // value?
    if (str.substr(0, 5) == '~ V ~') {

        var i = parseInt(str.substr(5), 10) - 1;
        var val = prevrowval[i].split("#");

        return decodeURIComponent(val[0]);


    }

    // value within "..."?
    if (str.substr(0, 5) == '~ W ~') {

        var i = parseInt(str.substr(5), 10) - 1;
        var val = prevrowval[i].split("#");

        return decodeURIComponent(val[0]).replace(/"/g, '&quot;').replace(/&/g, '&amp;');


    }



    // HTML value?
    if (str.substr(0, 5) == '~ H ~') {

        var i = parseInt(str.substr(5), 10) - 1;
        var val = prevrowval[i].split("#");

        return s10.textToHTML(decodeURIComponent(val[0]));

    }


    // file name?
    if (str.substr(0, 6) == 's10src') {

        var i = parseInt(str.substr(6), 10) - 1;
        var val = prevrowval[i].split("#");

        return "src='" + s10.filepath(decodeURIComponent(val[0])) + "'";

    }


    // css class?
    if (str.substr(0, 11) == 's10addclass') {
        var i = parseInt(str.substr(11), 10) - 1;

        var val = prevrowval[i].split("#");
        if (val[1]) {
            return "s10addclass='" + val[1] + "'";

        };
        return '';


    }


    if (str.substr(0, 10) == 's10checked') {

        var i = parseInt(str.substr(10), 10) - 1;
        var val = prevrowval[i].split("#");



        if (val[0] == "1") {
            return 'CHECKED';
        };

        return '';

    }


}


function table_set_trowhtml(tableinfo) {

    var f = tableinfo.tablebodyform;

    var colcount = 0;
    var f_allelements = f.getElementsByTagName('*');

    for (var i = 0; i < s10.mylength(f_allelements); i++) {
        var p = f_allelements[i];

        var cellname = p.getAttribute('name');
        if (cellname && s10.is_cell(p)) {
            colcount++;

            cellname = cellname.toLowerCase();
            p.setAttribute('id', tableinfo.no + '#' + tableinfo.tablename + '.' + '~~R~~.' + cellname);


            if (s10.is_link(p)) {
                p.setAttribute('onclick', 'return linkcl(this, event);');

            };


            if (s10.is_buttoncell(p)) {
                p.setAttribute('onclick', 'cbcl(this);');

                if (typeof (p.type) == 'string' && p.type.toLowerCase() != 'button') {
                    alert("Please add type='button' in HTML tag <button name=" + p.name + " ...>");
                };
            };



            if (s10.is_checkboxany(p)) {
                p.setAttribute('s10checked' + colcount, '');
                p.setAttribute('onclick', 'cbc(this);');
            } else {
                if (s10.is_imagecell(p)) {
                    p.removeAttribute('src');
                    p.setAttribute('s10src' + colcount, '');
                } else {
                    if (s10.tagINNER(p)) {
                        if (s10.is_outputcellhtml(p)) {
                            s10.mysetinnerHTML(document, p, '~ V ~' + colcount);
                        } else {
                            s10.mysetinnerHTML(document, p, '~ H ~' + colcount);

                            if (p.tagName == 'TEXTAREA') {
                                p.setAttribute('onfocus', 'cfg(this);');
                            };

                        };

                    } else
                        if (!s10.is_buttoncell(p)) {

                            if (s10.is_inputcellselect(p) || s10.is_outputcellselect(p)) {
                                p.setAttribute('s10selectvalue', '~ W ~' + colcount);
                            } else {
                                p.setAttribute('value', '~ W ~' + colcount);
                            };


                            p.setAttribute('onfocus', 'cfg(this);');



                            // Firefox needs innerHTML
                            if (p.tagName == 'TEXTAREA' && p.value != '~ W ~' + colcount) {
                                p.innerHTML = '~ V ~' + colcount;
                            };
                        };
                };
            };


            // add 'adddclass' attribute
            p.setAttribute('s10addclass' + colcount, '');

            if (s10.is_outputcell(p)) {
                if (s10.is_checkboxout(p)) {
                    p.disabled = true;
                } else {
                    p.setAttribute('readOnly', true);

                };
                p.setAttribute('tabIndex', '-1');
            };
        }; // s10.is_cell
    }; // for

    // save row template
    tableinfo.trowhtml = f.innerHTML;
    s10.mysetinnerHTML(document, f, "");
}



// table handling: new
function table_generate_rows(tabname, colcount, values) {

    // find table info  
    var no = tabname.split('#')[0];

    var tableinfo = find_tableinfo(no);


    // found? else no action (might be back button)
    if (tableinfo == null) return;


    // indicate: generated
    tableinfo.newtab = "";

    // set row template
    if (!tableinfo.trowhtml) {
        table_set_trowhtml(tableinfo);
    };



    var rowcount = values.length;

    // nothing to do?
    if (rowcount == 0 || colcount == 0) {

        tableinfo.tablebodyform.style.display = 'none';
        s10.mysetinnerHTML(tableinfo.tablebodyform.ownerDocument, tableinfo.tablebodyform, "");

        // display "no content" message
        var tablenocontent = tableinfo.tablebodyform.nextElementSibling;
        if (tablenocontent && tablenocontent.classList.contains('tablenocontent')) {
            tablenocontent.style.display = 'block';
        };


        var bf = tableinfo.tablebodyform;
        if (typeof (bf.onchange) == "function") {
            var cls = s10.execute_onchange(bf);
            var wnd = s10.myparentWindow(bf.ownerDocument);
            wnd.setTimeout(cls, 1);
        };


        // apply filters to update value list
        applyfilters(tableinfo.tablebodyform);


        return;

    };

    // set original style display
    tableinfo.tablebodyform.style.display = tableinfo.tablestyledisplay;

    // hide "no content" message
    var tablenocontent = tableinfo.tablebodyform.nextElementSibling;
    if (tablenocontent && tablenocontent.classList.contains('tablenocontent')) {
        tablenocontent.style.display = 'none';
    };


    var is_repeat = s10.is_repeat(tableinfo.tablebodyform);



    var newsource = new Array();
    var s;
    if (is_repeat) {
        s = tableinfo.trowhtml;
    } else {
        s = '<tr><td class="tablerow">' + tableinfo.trowhtml + '</td></tr>';
    };

    var rowval = new Array();


    // preset prevrowval with ""
    for (var i = 0; i < colcount; i++) {
        prevrowval.push("");
    };

    // Generate rows  

    // cell focus
    set_cell_focus = null;
    var cell_focus_id = null;


    for (replace_row = 0; replace_row < rowcount; replace_row++) {


        rowval = values[replace_row].split(";");

        for (var i = 0; i < colcount; i++) {
            var nval = rowval[i];

            // new value?
            if (nval != "@") {
                prevrowval[i] = rowval[i];
            };

        };


        // replace values and formats in row template 
        newsource.push(s.replace(/~~R~~|~ V ~[0-9]*|~ W ~[0-9]*|~ H ~[0-9]*|s10src[0-9]*|s10addclass[0-9]*=""|s10checked[0-9]*/g, do_replace_row));
        if (set_cell_focus != null) {
            var colnames = new Array();
            colnames = tableinfo.tfields.split(";");

            cell_focus_id = tableinfo.no + '#' + tabname + '.' + (replace_row + 1) + '.' + colnames[set_cell_focus];

            // delete "+" at the end (input cell)
            var leng = cell_focus_id.length;
            if (cell_focus_id.substr(leng - 1) == "+") {
                cell_focus_id = cell_focus_id.substr(0, leng - 1);
            };
            set_cell_focus = null;
        };


    };


    var target = tableinfo.tablebodyform;
    var specialtargetid = target.getAttribute('data-targetid');
    if (specialtargetid && specialtargetid != "") {

        tableinfo.tablebodyform.style.display = 'none';
        var doc = tableinfo.tablebodyform.ownerDocument;
        while (doc && specialtargetid.substr(0, 7) == "parent.") {
            doc = s10.myparentWindow(doc).parent.document;
            specialtargetid = specialtargetid.substr(7);
        };

        target = doc.getElementById(specialtargetid);

        if (!target) {
            alert("Invalid data-targetid= specified for table: " + tableinfo.tablebodyform.getAttribute('data-targetid'));
        };

    };

    if (is_repeat) {
        s10.mysetinnerHTML(tableinfo.tablebodyform.ownerDocument, target, newsource.join(""));
    } else {
        s10.mysetinnerHTML(tableinfo.tablebodyform.ownerDocument, target, '<table class=table cellpadding=0 cols=1>' + newsource.join("") + '</table>');
    };

    // set selected element from value
    var selects = target.getElementsByTagName('SELECT');
    for (var i = 0; i < selects.length; i++) {
        var s = selects[i];
        var val = s.getAttribute('value');
        if (val != "") {
            s.value = val;

        };

        if (s.hasAttribute('s10selectvalue')) {
            s.value = s.getAttribute('s10selectvalue');
        };


    };


    // add classes
    var add_class_elements = s10.myQuerySelectorAll(tableinfo.tablebodyform, "[s10addclass]");

    add_class_elements.forEach(function (p) {

        // set new css class
        scrdata.change_css_class(p, p.getAttribute('s10addclass'));
        p.removeAttribute('s10addclass');

    });


    tableinfo.tablebodyform.scrollTo(0, 0);


    // focus?
    if (cell_focus_id != null) {
        var cell = tablebodyform.ownerDocument.getElementById(cell_focus_id);
        if (cell != null) {
            var cls = function () {
                cell.focus();
            };
            window.setTimeout(cls, 1);
        };

    };


    // delete table source            
    newsource.length = 0;


    var bf = tableinfo.tablebodyform;
    if (typeof (bf.onchange) == "function") {
        var cls = s10.execute_onchange(bf);
        var wnd = s10.myparentWindow(bf.ownerDocument);
        wnd.setTimeout(cls, 1);
    };


    // apply filters
    applyfilters(tableinfo.tablebodyform);

}

// table handling: update
function table_update_rows(tabname, colcount, values) {

    // find table info  
    var no = tabname.split('#')[0];

    var tableinfo = find_tableinfo(no);

    var doc = tableinfo.tablebodyform.ownerDocument;

    var specialtargetid = tableinfo.tablebodyform.getAttribute('data-targetid');
    if (specialtargetid && specialtargetid != "") {
        while (doc && specialtargetid.substr(0, 7) == "parent.") {
            doc = s10.myparentWindow(doc).parent.document;
            specialtargetid = specialtargetid.substr(7);
        };
    };


    // found? else no action (might be back button)
    if (tableinfo == null) return;

    var rowcount = values.length;

    var rowval = new Array();




    // preset prevrowval with ""
    for (var i = 0; i < colcount; i++) {
        prevrowval.push("");
    };


    // generate cell update values  
    for (replace_row = 0; replace_row < rowcount; replace_row++) {


        rowval = values[replace_row].split(";");

        var changed = false;
        for (var i = 0; i < colcount; i++) {
            var nval = rowval[i + 1];

            // new value?
            if (nval != "@") {
                prevrowval[i] = rowval[i + 1];
            };


            val = prevrowval[i].split("#");

            var cell = doc.getElementById(tabname + '.' + rowval[0] + '.' + tableinfo.tcolnames[i]);

            if (cell != null) {
                if (s10.set_element_value(cell, decodeURIComponent(val[0]))) {
                    changed = true;
                };

                // set new css class
                scrdata.change_css_class(cell, val[1]);


                // update or remove details for this row
                if (i == colcount - 1) {
                    var tablerow = cell.closest('.tablerow');
                    if (tablerow) {

                        // detail view indicator ?
                        var s10detailviewcell = tablerow.s10detailviewcell;
                        if (s10detailviewcell && s10detailviewcell.value == 'X') {

                            // copy content later on after single field copy
                            scrdata.table_detail_tablerow = tablerow;
                            scrdata.table_detail_copy = true;

                        }
                        else {

                            if (changed && (tablerow.classList.contains('active') || tablerow.classList.contains('hidden'))) {

                                tablerow.classList.remove('active');
                                tablerow.classList.remove('hidden');

                                var tablerequestdetail = tablerow.querySelector(".tablerequestdetailactive");
                                if (tablerequestdetail && tablerequestdetail.parentElement == tablerow) tablerequestdetail.className = "tablerequestdetail";

                                tablerequestdetail = tablerow.querySelector(".tablerequestdetailhidden");
                                if (tablerequestdetail && tablerequestdetail.parentElement == tablerow) tablerequestdetail.className = "tablerequestdetail";


                                if (tablerow.s10detailarea) {
                                    tablerow.removeChild(tablerow.s10detailarea);
                                    tablerow.s10detailarea = null;
                                };


                            };
                        };


                    };


                };
            };



        };



    };



    values.length = 0;


    var bf = tableinfo.tablebodyform;
    if (typeof (bf.onchange) == "function") {
        var cls = s10.execute_onchange(bf);
        var wnd = s10.myparentWindow(bf.ownerDocument);
        wnd.setTimeout(cls, 1);
    };


    // apply filters
    applyfilters(tableinfo.tablebodyform);

};



function set_applocation(applocation, applid, screenid) {



    // set viewtarget if not yet done (SSO2 logon)
    if (!s10.viewtarget) {
        s10.viewtarget = s10.language;
    };



    // new view to be displayed 
    var view = "";
    var publicview = "";
    var namespace = "";
    var short_applid = applid;


    view = s10.rootpath + "classes/" + applid + "/views." + s10.viewtarget + "/" + applid + "." + screenid + ".html";


    // handle namespace
    if (applid.substr(0, 1) == '/' && applid.substr(1).indexOf('/') > -1) {
        short_applid = applid.substr(applid.substr(1).indexOf('/') + 2);
        namespace = applid.substr(1, applid.substr(1).indexOf('/'));

        view = s10.rootpath + "classes/" + namespace + '.' + short_applid + "/views." + s10.viewtarget + "/" + short_applid + "." + scrdata.screenid + ".html";

    };

    if (ServerFileExists(view)) {
        applocation.replace(view);
        return;
    }

    if (namespace != "") {
        publicview = window.location.origin + '/sap/bc/bsp/' + namespace + '/public/classes/' + short_applid + "/views." + s10.viewtarget + "/" + short_applid + "." + screenid + ".html";
    }
    else {
        publicview = window.location.origin + '/sap/bc/bsp/public/classes/' + short_applid + "/views." + s10.viewtarget + "/" + short_applid + "." + screenid + ".html";
    };

    if (ServerFileExists(publicview)) {
        applocation.replace(publicview);
        return;
    };

    alert("HTML view not found:\n" + view + "\n\nAlso not found in the 'public' folder:\n" + publicview);

};

// check whether file exists on server
function ServerFileExists(urlToFile) {

    var status = s10.server_file_status[urlToFile];
    if (!status) {
        var xhr = new XMLHttpRequest();
        xhr.open('HEAD', urlToFile, false);
        xhr.send();

        status = xhr.status;
        s10.server_file_status[urlToFile] = status;
    };

    return (status >= 200 && status <= 299);
}
