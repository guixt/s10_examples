//------------------------------------------------
//         Synactive S10 
//
// Copyright (c) Synactive GmbH, Germany, 2008-2021
//    All rights reserved
//-----------------------------------------------


// base pointer for s10 utility functions used in other windows
var s10 = this;

// save top url including query string
var topurl = top.document.URL;


// choose random name for msg area so that it becomes a unique frame name
var msgname = 'msg' + Math.floor(Math.random() * 1000001) + Math.floor(Math.random() * 1000001) + Math.floor(Math.random() * 1000001);

// generate frameset
document.write('<frameset rows="*,0" border=0 frameborder="0" framespacing="0" border="0">');
document.write('<frame src="synactiveS10.ctl.html" application="yes"  id="ctl" name="ctl" marginheight="0" marginwidth="0" scrolling="no" target="_self">');
document.write('<frame src=""  application="yes" id="msg" name="' + msgname + '" marginheight="0" marginwidth="0"  scrolling="no">');
document.write('</frameset>');
document.close();




// screen data stack
var scrdata_stack = new Array();

// its parameters
var its_service_url = ""; // to be set via s10logon()
var its_wgate_url = ""; // provided from ITS logon


var is_mobile = (navigator.userAgent.match(/Android/i) != null ||
    navigator.userAgent.match(/webOS/i) != null ||
    navigator.userAgent.match(/iPhone/i) != null ||
    navigator.userAgent.match(/iPad/i) != null ||
    navigator.userAgent.match(/iPod/i) != null ||
    navigator.userAgent.match(/BlackBerry/i) != null ||
    navigator.userAgent.match(/Windows Phone/i) != null);



//------------------------------
// General utility functions
//-----------------------------


// className contains given S10 class 
String.prototype.hc =
    function (f) {
        return (f != null && f.classList != null && f.classList.contains(this));
    }


// starts with given string
String.prototype.startsWith =
    function (str) {
        return (this.lastIndexOf(str, 0) == 0);
    }


// ends with given string
String.prototype.endsWith =
    function (str) {
        return (this.match(str + "$") == str);
    }


function stringEndsWith(s, t) {
    return s.endsWith(t);
};

//  to number or 0
String.prototype.toNumber =
    function () {
        var z = parseInt(this, 10);
        if (isNaN(z)) return 0;
        return z;
    }

Number.prototype.toNumber =
    function () {
        if (isNaN(this)) return 0;
        return this;
    }


// string to hex
function s2h(str) {
    var x = new Array();
    for (var i = 0; i < str.length; i++) {
        x.push(str.charCodeAt(i).toString(16));
    };
    return x.join('');
};

// hex to string
function h2s(str) {
    var x = new Array();
    for (var i = 0; i < str.length; i += 2) {
        x.push(String.fromCharCode(parseInt(str.substr(i, 2), 16)));
    };
    return x.join('');
};

// trim
function trim(s) {
    if (!s) return s;
    return s.replace(/^\s\s*/, '').replace(/\s\s*$/, '')
};


// array length (some arrays contain a member a.length of type object)
function mylength(a) {

    if (typeof (a.length) == 'number') return a.length;

    var i = 0;

    while (typeof (a[i + 100]) != 'undefined') i = i + 100;
    while (typeof (a[i + 10]) != 'undefined') i = i + 10;
    while (typeof (a[i]) != 'undefined') i++;

    return i;

}

// used in settimeout, passing an object
function execute_onchange(f, ocf) {

    if (ocf == null) {
        ocf = f.onchange;

    };

    // Return a reference to an anonymous inner function created with a function expression
    return (function () {
        ocf.apply(f);
    });
}

// querySelectorAll as array (IE11 for each... problem)
function myQuerySelectorAll(f, condition) {
    return Array.prototype.slice.call(f.querySelectorAll(condition));
}

// check whether iframe is accessible
function frame_is_accessible(frm) {
    try {
        return (typeof (frm.frameElement) == 'object');
    } catch (e) {
        ;
    };
    return false;
};

// transform text string into html format
function textToHTML(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
};



// set value of input, select, ....
function set_element_value(f, val) {

    var changed = false;
    val = trim(val);

    switch (f.tagName) {
        case 'INPUT':

            // date ?
            if (f.type.toLowerCase() == 'date') {
                var newvalue = standarddate(val);
                if (f.value != newvalue) {
                    f.value = newvalue;
                    changed = true;
                }

                break;
            };

            // checkbox ?
            if (f.type.toLowerCase() == 'checkbox') {

                if (val.toLowerCase() == 'x') val = '1';  // allow 1, x, X
                if ((val == "1" && f.checked == false) || (val != "1" && f.checked == true)) {
                    if (val == "1") {
                        f.checked = true;
                        changed = true;
                    }
                    else {
                        f.checked = false;
                        changed = true;
                    };

                    if (typeof (f.onclick) == "function") {
                        f.onclick.apply(f);
                    };
                };

                break;
            };

            if (f.value != val) {
                f.value = val;
                changed = true;
            };

            break;



        case 'SELECT':
            if (f.multiple) {

                var values = val.split(',');
                for (var k = 0; k < f.options.length; k++) {
                    if (values.includes(f.options[k].value)) {
                        if (f.options[k].selected != true) {
                            f.options[k].selected = true;
                            changed = true;
                        };

                    }
                    else {
                        if (f.options[k].selected != false) {
                            f.options[k].selected = false;
                            changed = true;
                        };
                    };

                    // checkbox visualization?
                    var checkboxid = f.options[k].getAttribute('s10checkboxid');
                    if (checkboxid) {
                        var chbox = f.ownerDocument.getElementById(checkboxid);
                        if (chbox) {
                            chbox.checked = f.options[k].selected;
                        };
                    };

                };


                // set text field if specified
                s10_multiple_selection_display_input(f);
            }
            else {

                if (f.value != val) {
                    changed = true;
                };

                for (var k = 0; k < f.options.length; k++) {
                    if (f.options[k].value == val) {
                        f.value = val;
                        f.options[k].selected = true;
                        break;
                    }
                    else {
                        f.options[k].selected = false;
                    };
                };
            };
            break;

        case 'DIV': case 'SPAN': case 'BUTTON':
            changed = mysetinnerHTML(f.ownerDocument, f, val);
            break;

        default:
            if (f.value != val) {
                f.value = val;
                changed = true;
            };
            break;

    };

    return changed;
}


// get value of input, select, ....
function get_element_value(f) {

    switch (f.tagName) {
        case 'INPUT':
            return f.value;
            break;

        case 'SELECT':
            if (f.multiple) {

                var values = new Array;
                for (var k = 0; k < f.options.length; k++) {
                    if (f.options[k].selected) {
                        values.push(f.options[k].value);
                    };
                };
                return values.join(',');

            } else {
                return f.value;
            };
            break;

        case 'DIV': case 'SPAN': case 'BUTTON':
            return f.innerHTML;
            break;

        default:
            return f.value;
            break;

    };


}




// parse various date formates into YYYY-MM-DD
function standarddate(str) {

    var parts;
    parts = str.split('-');
    if (parts.length != 3) parts = str.split('.');
    if (parts.length != 3) parts = str.split('/');
    if (parts.length != 3) return str;

    if (parts[0].length == 4) return (parts[0] + '-' + parts[1] + '-' + parts[2]);
    if (parts[2].length == 4) return (parts[2] + '-' + parts[1] + '-' + parts[0]);
    return str; // probaly invalid date format 

}



// noramlize file path
function filepath(s) {
    s = s.replace(/\\/g, "/");

    var k = s.indexOf(':');

    if (k == 1) // C:... etc
    {
        return (s);
    };

    if (s.indexOf(':') < 0 && s.substr(0, 2) != '..') {
        return (rootpath + s);
    };

    return s;
}


function mytop() {

    var p = window;

    while (p.parent != null && p.parent != p && !p.location.href.toLowerCase().endsWith("synactives10.ctlmain.html")) {

        p = p.parent;

    };

    return p.parent;


}


//--------------------------------
// Global session data
//--------------------------------



// session id
var sessionid = "";

// root folder path before "classes/...."
var rootpath = location.href.substring(0, location.href.indexOf("classes"));

// step number
var stepno = 0;

// previous step numbwer
var previous_stepno = -1;


// language
var language = "en";

// license
var license = "";

// color scheme
var colorscheme = "colorscheme1";


// viewtarget, default: language
var viewtarget = "en";

// logoff is active
var logoff_active = false;

// unload is active
var unload_active = false;

// popup level
var popuplevel = 0;

// dialog screen data
var dialog_applid = "";
var dialog_screenid = "";
var dialog_tabid = "";


// return string from popups
var retval = "";

// tree generation
var tree_generate = "";

// dialog popup
var show_dialog_popup = "";

// file exists on server
var server_file_status = {};

// global audiio element
var audioElement = null;
try {
    audioElement = new Audio("");
    audioElement.muted = false;
    audioElement.volume = 1;
} catch (e) { };

var tabledetailarea = null;

//------------------------------
// General DOM functions
//------------------------------

// element position: left
function relPosLeft(f) {
    if (!f) return 0;

    var left = f.offsetLeft;
    while (f.offsetParent) {
        f = f.offsetParent;
        left += f.offsetLeft;
    };

    return left;

}

// element position: top
function relPosTop(f) {

    if (!f) return 0;

    var top = f.offsetTop;
    while (f.offsetParent) {
        f = f.offsetParent;
        top += f.offsetTop;
    };

    return top;
}



// document completely loaded?
function check_completion(wnd, level) {

    if (!level) level = 0;

    if (wnd == null) {
        return true;
    };

    var doc = wnd.document;
    if (doc == null) return true;

    if (typeof (wnd.document) != 'object') return true;

    try {

        if (typeof (doc.readyState) == "undefined") {
            return true; // firefox
        }

        if (doc.readyState != 'complete') {
            return false;
        };

        var allframes = wnd.frames;


        for (var k = 0; k < allframes.length; k++) {
            var frm = allframes[k].frameElement;

            if (!check_completion(frm.contentWindow, level + 1)) return false;
        };
    } catch (e) {
        ;
    };

    return true;


}

// myscreenleft (window)
function myscreenleft(wnd) {
    if (typeof (wnd.screenX) != 'undefined') return wnd.screenX;
    if (typeof (wnd.screenLeft) != 'undefined') return wnd.screenLeft;
    if (typeof (wnd.screen.left) != 'undefined') return wnd.screen.left;

    return 0;
}

// myscreentop (window) 


function myscreentop(wnd) {

    if (typeof (wnd.screenY) != 'undefined') return wnd.screenY;
    if (typeof (wnd.screenTop) != 'undefined') return wnd.screenTop;
    if (typeof (wnd.screen.top) != 'undefined') return wnd.screen.top;

    return 0;
}



// parent window for document
function myparentWindow(doc) {
    if (typeof (doc.parentWindow) == 'object' && doc.parentWindow != null) return doc.parentWindow;
    if (typeof (doc.defaultView) == 'object' && doc.defaultView != null) return doc.defaultView;

    return null;
}


// parentNode / parentElement
function myparentnode(f) {
    if (typeof (f.parentNode) == 'object') return f.parentNode;
    if (typeof (f.parentElement) == 'object') return f.parentElement;
    return null;

};


// display popup
function mypopupshow(scrdata, myp, left, top, width, height, zIndex, scroll, f_focus, dialog) {

    // already new popup created? then no action
    if (f_focus != undefined) {
        try {
            if (scrdata.ctmPopup != null && scrdata.ctmPopup.visible) return;
        } catch (e) {
            return;
        };
    };

    var pdoc = null;

    if (myp.anchor == null) {
        // dialog screen?
        if (dialog == true) {
            pdoc = scrdata_stack[0].appl_doc;

            // set previous popup inactive
            if (popuplevel > 0) {
                scrdata_stack[popuplevel - 1].dia_popup_set_inactive();

            };


        } else {
            pdoc = scrdata.appl_doc;
        };

    } else {

        pdoc = myp.anchor.ownerDocument;
    };


    myp.element = pdoc.createElement("div");
    myp.doc = pdoc;



    var element = myp.element;



    element.style.display = "none";

    element.style.zIndex = zIndex;
    element.style.backgroundColor = "transparent";
    element.style.position = "absolute";
    element.style.padding = "0px";
    element.style.border = "0px";


    element.style.left = left + "px";
    element.style.top = top + "px";

    element.style.width = width + "px";

    if (height > 0) {
        element.style.height = height + "px";
    } else {
        element.style.height = "";
    };


    // full screen?
    myp.fullscreen = false;
    if (height < 10 && width < 10) {
        element.style.width = '100%';
        element.style.height = '100vh'; //  Math.max(pdoc.body.scrollHeight, 1024) + 'px';
        element.style.left = "0px";
        element.style.top = "0px";
        element.style.position = 'absolute';
        myp.fullscreen = true;

        pdoc.body.insertAdjacentElement("beforebegin", myp.element);



    } else {
        pdoc.body.appendChild(myp.element);

        element.style.borderwidth = "1px";

        if (scroll) {

            if (height > 1600) {
                element.style.height = 1600 + "px";
                element.style.overflow = "auto";
            };
        };
    };



    var popupcontent = myp.body.join('');
    mysetinnerHTML(document, element, popupcontent);

    myp.visible = true;

    // create shim 
    if (!scroll) {
        myp.shim = createShim(scrdata.appl_doc, myp.anchor, left, top, width, height, zIndex);
    };


    // fullscreen windows will be made visible later on
    if (!myp.fullscreen) element.style.display = "block";

}

// additional info in wait popup
function mypopupwaitinfo(myp, msg) {
    var msgareas = myp.element.getElementsByClassName('processingmessage3');
    if (msgareas.length > 0) msgareas[0].innerHTML = msg;

};




function mysetinnerHTML(doc, element, value) {
    var changed = false;
    if (!element) return changed;
    if (typeof (element.innerHTML) != 'undefined') {
        if (element.innerHTML != value) {
            changed = true;
            element.innerHTML = value;
        };


        return changed;
    };
    changed = true;
    var range = doc.createRange();
    range.setStartBefore(element);
    var fragment = range.createContextualFragment(value);
    while (element.hasChildNodes()) element.removeChild(element.lastChild);
    element.appendChild(fragment);
    return changed;
}







// copy <input> values and defaultvalues and <select> status
function copy_inputvalues(source, target) {

    if (!target || !source) return;

    var inpsource = source.getElementsByTagName('INPUT');
    var inptarget = target.getElementsByTagName('INPUT');


    if (inpsource.length == inptarget.length)
        for (var k = 0; k < inpsource.length; k++) {
            inptarget[k].value = inpsource[k].defaultValue;
            if (inpsource[k].value != "") {
                inptarget[k].value = inpsource[k].value;
            };
        };


    // copy <select> options status
    var selsource = source.getElementsByTagName('SELECT');
    var seltarget = target.getElementsByTagName('SELECT');


    if (selsource.length == seltarget.length)
        for (var k = 0; k < selsource.length; k++) {
            if (seltarget[k].options.length == selsource[k].options.length) {
                for (var r = 0; r < seltarget[k].options.length; r++) {
                    seltarget[k].options[r].selected = selsource[k].options[r].selected;

                };

            };

        };

};


// set unique elements ids
var unique_id_modifier = 0;

function set_unique_ids(target) {

    if (!target) return;
    unique_id_modifier++;

    var elementList = myQuerySelectorAll(target, '[id]');
    elementList.forEach(function (f) {
        f.setAttribute("id", f.getAttribute('id') + '|' + unique_id_modifier);
    });
};

// iframe to block windowed controls for popups
function createShim(doc, anchor, left, top, width, height, zIndex) {

    // no shim for small elements (Google chrome problem)
    if (height < 20 || width < 20) return null;


    var shim = null;

    var shimdoc = doc;

    if (anchor != null) {
        shimdoc = anchor.ownerDocument;
    };


    shim = shimdoc.createElement('iframe');
    shimdoc.body.appendChild(shim);

    shim.style.borderWidth = "0px";
    shim.style.position = "absolute";
    shim.style.top = top + "px";
    shim.style.left = left + "px";
    shim.style.width = width + "px";
    shim.style.height = height + "px";
    shim.style.zIndex = zIndex - 1;
    shim.style.display = 'block';

    return shim;
}


function replace_class(obj, oldclass, newclass) {
    if (!obj) return false;
    if (!obj.classList) return false;
    if (!obj.classList.contains(oldclass)) return false;
    obj.classList.remove(oldclass);
    obj.classList.add(newclass);
    return true;

};

// set error  class
function set_error(obj) {
    if (!obj) return;
    if (!obj.classList) return;
    obj.classList.add('error');

};


// reset error  class
function reset_error(obj) {
    if (!obj) return;
    if (!obj.classList) return;
    obj.classList.remove('error');

};


// mypopup
function mypopup() {

    this.body = new Array();

    this.visible = false;
    this.anchor = null;

    // shim is used to hide windowed controls (e.g. pdf display)
    this.shim = null;

    this.background = "white";
    this.msgtype = '';

    // fullscreen?
    this.fullscreen = false;

    this.doc = null;

    this.id = "popup" + Math.random();
}



// write html to popup body
function mypopupwrite(myp, text) {
    myp.body.push(text);
}




// close popup
function mypopupclose(myp) {

    if (myp == null) return false;
    //if (!myp.visible) return false;

    try {


        if (myp.element != null) {

            var q = myparentnode(myp.element);
            if (q != null) q.removeChild(myp.element);

            myp.element.innerHTML = '';


        };
    } catch (e) { };

    myp.element = null;

    if (myp.body != null) myp.body.length = 0;


    // delete shim
    if (myp.shim != null) {

        var q = myparentnode(myp.shim);
        if (q != null) q.removeChild(myp.shim);

        delete myp.shim;

        myp.shim = null;
    };

    return true;



}


function create_datalist_options(f, valuelist) {

    // clear existing options
    f.innerHTML = '';

    if (valuelist == '') return;

    var s = valuelist.split('\n');
    var s10options = f.getAttribute('data-s10options');
    var hidekeys = false;
    if (s10options && s10options.toLowerCase().indexOf('hidekeys') > -1) hidekeys = true;
    for (i = 0; i < s.length; i++) {
        var v = s[i].split('\t');

        v[0] = trim(v[0]);
        v[1] = trim(v[1]);

        var option = document.createElement('option');

        var vkey = "";
        if (hidekeys) {
            option.value = v[1];
        } else {
            option.value = v[0];
            option.label = v[1];
        }

        f.appendChild(option);

    };

}

// create options for <select>
function create_dynamic_options(f, valuelist) {

    var optlist = f.options;

    // save value
    var selvalue = get_element_value(f);

    optlist.length = 0;

    if (valuelist == '') return;

    var s = valuelist.split('\n');

    // remove invalid entries
    s = s.filter(function (a) { return a.split('\t').length > 1; });

    var s10options = f.getAttribute('data-s10options');

    var hidekeys = false;
    if (s10options && s10options.toLowerCase().indexOf('hidekeys') > -1) hidekeys = true;

    var noemptyentry = false;
    if (s10options && s10options.toLowerCase().indexOf('noemptyentry') > -1) noemptyentry = true;
    if (f.multiple) noemptyentry = true;


    // sort entries lexicographically if hidekeys flag is on
    if (hidekeys) {
        s.sort(function (a, b) {return a.split('\t')[1].localeCompare(b.split('\t')[1]); });
    };


    // start with empty entry
    if (!noemptyentry) {
        optlist[0] = new Option("", "", false, false);
    }


    for (i = 0; i < s.length; i++) {
        var v = s[i].split('\t');

        v[0] = trim(v[0]);
        v[1] = trim(v[1]);

        var vkey = "";
        if (hidekeys) {
            vkey = v[1];
        } else {
            if (v[0] == v[1]) {
                vkey = v[0];
            } else {
                vkey = v[0] + ' ' + v[1];
            };

        };

        optlist[optlist.length] = new Option(vkey, v[0], false, false);
    };
       


    if (f.multiple) {
        // build checkbox visualization of select element
        s10_multiple_select(f);
    };

    // set previous value, since dropdownlist can change while value remains the same
    set_element_value(f, selvalue);

}


// --------------------------------------------
// Multiple select with checkbox visualization
// ---------------------------------------------- 

// init  Pass id of <select> and optionally maximum height of selection list
var multiple_select_count = 0;
function s10_multiple_select(sel) {



    var options = sel.options;

    var container = sel.nextElementSibling;
    while (container && !container.classList.contains('selectlist')) {
        container = container.nextElementSibling;
    };

    if (!container) {
        return;
    };

    // increase count for id generation
    multiple_select_count++;

    // set links to container and select element
    sel.s10selectcontainer = container;
    container.s10selectelement = sel;


    // build list from <select> element      
    var a = new Array();

    var k = 0;
    var k_selected = -1;
    for (k = 0; k < options.length; k++) {

        var checkboxid = "s10select_item_" + multiple_select_count + "_" + k;
        a.push("<input type='checkbox' "
            + " onchange='s10.s10_multiple_selection_selitem(this," + k + ")' id='"
            + checkboxid + "'> <label style='font-size:13px;' for='s10select_item_" + multiple_select_count + "_" + k + "'>" + options[k].text + "</label><br>");

        options[k].setAttribute('s10checkboxid', checkboxid);


    };


    container.innerHTML = a.join("");

    // show element 
    sel.style.display = 'none';
    if (container.style.display == 'none') {
        container.style.display = 'inline-block';
    };

}

// called internally on checkbox change
function s10_multiple_selection_selitem(item, i) {

    var sel = item.parentElement.s10selectelement;
    var options = sel.options;

    options[i].selected = item.checked;

    // display selected items in input field
    s10_multiple_selection_display_input(sel);

};

// build up input field from selected items
function s10_multiple_selection_display_input(sel) {

    var selecttext = sel.nextElementSibling;
    while (selecttext && !selecttext.classList.contains('selecttext')) {
        selecttext = selecttext.nextElementSibling;
    };

    // without text field?
    if (!selecttext) return;

    var options = sel.options;

    var inpval = "";
    for (k = 0; k < options.length; k++) {
        if (options[k].selected) {
            if (inpval != "") {
                inpval += ", ";
            };
            var text = options[k].text;

            // remove " (...." if contained in text
            var n = text.indexOf(" (");
            if (n > 0) text = text.substr(0, n);

            inpval += text;

        };

    };

    // set value and display text field
    set_element_value(selecttext, inpval);
    if (selecttext.style.display == 'none') {
        selecttext.style.display = 'inline-block';
    };

};


// language dependent text
function ui_text(id) {

    switch (language.toLowerCase()) {

        case 'de':
            switch (id) {
                case 'Print':
                    return 'Drucken';
                case 'Search':
                    return 'Suchen';
                case 'Help':
                    return 'Hilfe';
                case 'ReqMsg':
                    return "Bitte alle benötigten Felder ausfüllen";
                case 'ReqExp':
                    return "";
                case 'confirm_logoff':
                    return "Möchten Sie die Anwendung verlassen (logoff)?";
                case 'Select':
                    return "Auswählen";
                case 'Open document':
                    return "Dokument öffnen";

                case 'LOGON_ERROR':
                    return "Bitte Benutzername und Kennwort prüfen";

                case 'LOGON_ERROR_LOCKED':
                    return "Der Benutzer ist gersperrt";

                default:
                    return id;
            };



        case 'fr':
            switch (id) {
                case 'Print':
                    return 'Imprimer';
                case 'Search':
                    return 'Recherche';
                case 'Help':
                    return 'Aide';
                case 'ReqMsg':
                    return "Voyez saisir toutes les données requises";
                case 'ReqExp':
                    return "";
                case 'confirm_logoff':
                    return "Voulez-vous quitter l'application?";
                case 'Select':
                    return "Sélection";
                case 'Open document':
                    return "Ouvrir le document";

                case 'LOGON_ERROR':
                    return "Veuillez vérifier le nom d'utilisateur et le mot de passe";

                case 'LOGON_ERROR_LOCKED':
                    return "L'utilisateur est verrouillé";


                default:
                    return id;
            };



        default:
            switch (id) {
                case 'Print':
                    return 'Print';
                case 'Search':
                    return 'Search';
                case 'Help':
                    return 'Help';
                case 'ReqMsg':
                    return "Please fill in all required entry fields";
                case 'ReqExp':
                    return "";
                case 'confirm_logoff':
                    return "Do you want to log off?";
                case 'Select':
                    return "Select";
                case 'Open document':
                    return "Open document";

                case 'LOGON_ERROR':
                    return "Please check user name and password";

                case 'LOGON_ERROR_LOCKED':
                    return "User is locked";


                default:
                    return id;
            };


    };


}


// ------------------------------
// change element properties
// ------------------------------
// row selection
var style_rowselect_color = '#010101';
var style_rowselect_backgroundColor = '#d0d0e0';



//-----------------------------
// S10 element identification
//-----------------------------


function is_output(f) {
    return ('output'.hc(f) || 'legend'.hc(f) || 'label'.hc(f) || 'outputhtml'.hc(f));;
}

function is_outputhtml(f) {
    return 'outputhtml'.hc(f);
}

function is_outputcell(f) {
    return ('outputcell'.hc(f) || 'checkboxoutcell'.hc(f) || 'outputcelldiv'.hc(f));
}

function is_outputcellselect(f) {
    return ('outputcellselect'.hc(f));
}


function is_outputcellhtml(f) {
    return ('outputcellhtml'.hc(f) || 'outputcellhtmldiv'.hc(f));
}

function is_outputcellactive(f) {
    return 'outputcellactive'.hc(f);
}

function is_outputselect(f) {
    return 'outputselect'.hc(f);
}

function is_input(f) {
    return ('input'.hc(f) || is_inputcell(f) || is_inputselect(f) || is_inputcellselect(f) );
}


function is_inputreq(f) {
    return 'input'.hc(f) && f.required;
}

function is_inputcell(f) {
    return ('inputcell'.hc(f) || 'checkboxcell'.hc(f) || 'inputcellselect'.hc(f));
}

function is_inputcellselect(f) {
    return 'inputcellselect'.hc(f);
}


function is_inputselect(f) {
    return 'inputselect'.hc(f);
}


function is_button(f) {
    return 'button'.hc(f);
}


function is_buttoncell(f) {
    return 'buttoncell'.hc(f);
}



function is_image(f) {
    return 'image'.hc(f);
}

function is_imagecell(f) {
    return 'imagecell'.hc(f);
}

function is_messagearea(f) {
    return 'messagearea'.hc(f);
}


function is_cell(f) {

    if (f.className == null || f.className.indexOf('cell') == -1) return false;

    return (
        'inputcell'.hc(f) ||
        'outputcell'.hc(f) ||
        'checkboxcell'.hc(f) ||
        'checkboxoutcell'.hc(f) ||
        'inputcellselect'.hc(f) ||
        'outputcelldiv'.hc(f) ||
        'outputcellhtml'.hc(f) ||
        'outputcellhtmldiv'.hc(f) ||
        'buttoncell'.hc(f) ||
        'imagecell'.hc(f));

}



function is_select(f) {
    return ('inputselect'.hc(f) || 'outputselect'.hc(f));
}

function is_datalist(f) {
    return 'datalist'.hc(f);
}

// textarea uses value instead of innerHTML'
function tagINNER(f) {
    return (f && (f.tagName == 'DIV' || f.tagName == 'SPAN' || f.tagName == 'LEGEND' || f.tagName == 'LABEL' || f.tagName == 'BUTTON'))

}


function is_colhead(f) {
    return 'colhead'.hc(f);
}

function is_radio(f) {
    return ("radio".hc(f) && !"radioout".hc(f));
}

function is_radioout(f) {
    return "radioout".hc(f);
}

function is_radioany(f) {
    return 'radio'.hc(f);
}


function is_checkbox(f) {
    return ('checkbox'.hc(f) && !'checkboxout'.hc(f));
}

function is_checkboxout(f) {
    return 'checkboxout'.hc(f);
}

function is_checkboxany(f) {
    return 'checkbox'.hc(f);
}


function is_tabimage(f) {
    return 'tabimage'.hc(f);
}


function is_label(f) {
    return 'label'.hc(f);
}

function is_labelradio(f) {
    return 'labelradio'.hc(f);
}

function is_labelcheckbox(f) {
    return 'labelcheckbox'.hc(f);
}

function is_box(f) {
    return 'box'.hc(f);

}


function is_table(f) {
    return 'table'.hc(f);

}


function is_repeat(f) {
    return 'repeat'.hc(f);

}


function is_tabpage(f) {
    return 'tabpage'.hc(f);

}

function is_tabpageactive(f) {
    return 'tabpageactive'.hc(f);

}



function is_link(f) {
    return 'link'.hc(f);
}


function is_linkkey(f) {
    return 'linkkey'.hc(f);
}


function is_valuehelp(f) {
    return 'valuehelp'.hc(f);
}


//------------------------------
// Various event handlers etc.
//------------------------------

function noaction(s10ctl, e) {

    e = S10Event(s10ctl, e)
    return eventnoaction(e);
};



function eventnoaction(e) {

    if (!e) return false;

    if (typeof (e.stopPropagation) == 'function') {
        e.stopPropagation();
    } else {
        e.cancelBubble = true;
    };

    if (typeof (e.preventDefault) == 'function') {
        e.preventDefault();
    };

    if (e.returnValue) {
        e.returnValue = false;
    };

    return false;
};



function search_event_app(e, app) {


    if (e != null) return e;
    if (app == null) return null;
    if (app.event != null) return app.event;

    var frames = app.frames;

    for (var i = 0; i < frames.length; i++) {
        var frm = frames[i];
        if (frame_is_accessible(frm)) {
            e = search_event_app(e, frm);
            if (e != null) return e;
        };
    };

    return null;
}


function target(e) {
    var targ = null;
    if (e != null) {
        if (e.target != null) targ = e.target;
        if (e.srcElement != null) targ = e.srcElement;
    } else {
        if (window.event != null && window.event.srcElement != null) targ = window.event.srcElement;
    };

    while (targ != null && targ.nodeType != 1) targ = targ.parentNode;

    return targ;

}


function S10Event(s10ctl, e) {
    if (e != null) return e;
    if (window.event) return window.event;

    var c = S10Event;

    while (c.caller) c = c.caller;
    if (c.arguments[0] && typeof (c.arguments[0].target) == 'object') return c.arguments[0];

    var app = null;

    switch (s10ctl.scrdata.application_frame_no) {
        case 1:
            app = s10ctl.parent.parent.app1;
            break;
        case 2:
            app = s10ctl.parent.parent.app2;
            break;
    };

    return search_event_app(e, app);

}


function eventtarget(scrdata, e) {
    var f = target(e);
    if (f == null) f = scrdata.lastfocus;
    return f;
};


//  mouseout is fired for innner element
function mouseout_inner_element(e, container) {

    if (e == null) e = window.event;

    // this is the element we've moved to
    var targ = (e.relatedTarget) ? e.relatedTarget : e.toElement;


    // starting with the tg element, we loop up through the DOM.
    // we just want to figure out if we're inside the container or outside it
    while (targ != null && targ != container && targ.tagName != 'BODY') {
        // get the parent element.
        targ = targ.parentNode;
        if (targ == container) {
            // we found container as a parent. So this is not really leaving the container
            return true;
        };
    };

    return false;
}


// cell changed
function cch(s10ctl, f) {
    s10ctl.scrdata.cellchanged(f);

}



//--------------------------------
// Identify external dialog window
//--------------------------------

function external_dialog_window(w) {
    try {
        var query = w.parent.parent.document.location.search;

        if (!query || query == "") {
            return "";
        };

        // skip '?'

        if (query.substr(1, 12) == "RemoteDialog") {
            return h2s(query.substr(14));
        };
    } catch (e) {
        return "";
    };

    return "";

};

// check license

function check_license(license) {

    var _0xc145e9 = _0x56c6; (function (_0x33ecfc, _0x348fa5) { var _0x540fdd = _0x56c6, _0xfc25e3 = _0x33ecfc(); while (!![]) { try { var _0x53ff1e = -parseInt(_0x540fdd(0x95)) / 0x1 + parseInt(_0x540fdd(0x83)) / 0x2 * (parseInt(_0x540fdd(0x92)) / 0x3) + -parseInt(_0x540fdd(0x8c)) / 0x4 * (-parseInt(_0x540fdd(0x8e)) / 0x5) + -parseInt(_0x540fdd(0x87)) / 0x6 + parseInt(_0x540fdd(0x9b)) / 0x7 + -parseInt(_0x540fdd(0x8d)) / 0x8 * (-parseInt(_0x540fdd(0x80)) / 0x9) + -parseInt(_0x540fdd(0x93)) / 0xa * (parseInt(_0x540fdd(0x88)) / 0xb); if (_0x53ff1e === _0x348fa5) break; else _0xfc25e3['push'](_0xfc25e3['shift']()); } catch (_0x1f1a87) { _0xfc25e3['push'](_0xfc25e3['shift']()); } } }(_0x3c8e, 0xd0881)); var _0x4d29f7 = (function () { var _0x43aee5 = !![]; return function (_0x5cfaa6, _0x356a59) { var _0x1415f9 = _0x43aee5 ? function () { var _0x54adf6 = _0x56c6; if (_0x356a59) { var _0x2cd6f9 = _0x356a59[_0x54adf6(0x7e)](_0x5cfaa6, arguments); return _0x356a59 = null, _0x2cd6f9; } } : function () { }; return _0x43aee5 = ![], _0x1415f9; }; }()), _0x3dadce = _0x4d29f7(this, function () { var _0x408012 = _0x56c6; return _0x3dadce[_0x408012(0x7f)]()[_0x408012(0x81)](_0x408012(0x98))[_0x408012(0x7f)]()[_0x408012(0x99)](_0x3dadce)[_0x408012(0x81)]('(((.+)+)+)+$'); }); _0x3dadce(); var _0x2630fd = (function () { var _0x28635e = !![]; return function (_0x5720ef, _0xaf33b5) { var _0x2ada36 = _0x28635e ? function () { if (_0xaf33b5) { var _0x3734f8 = _0xaf33b5['apply'](_0x5720ef, arguments); return _0xaf33b5 = null, _0x3734f8; } } : function () { }; return _0x28635e = ![], _0x2ada36; }; }()), _0x3a96a6 = _0x2630fd(this, function () { var _0x59804c = _0x56c6, _0x1ab8b0; try { var _0x57939f = Function(_0x59804c(0x97) + _0x59804c(0x85) + ');'); _0x1ab8b0 = _0x57939f(); } catch (_0x17fab1) { _0x1ab8b0 = window; } var _0x2bbdea = _0x1ab8b0[_0x59804c(0x89)] = _0x1ab8b0[_0x59804c(0x89)] || {}, _0x416244 = [_0x59804c(0x8b), _0x59804c(0x84), _0x59804c(0x94), _0x59804c(0x7d), _0x59804c(0x7a), _0x59804c(0x79), _0x59804c(0x90)]; for (var _0x3e2112 = 0x0; _0x3e2112 < _0x416244[_0x59804c(0x9a)]; _0x3e2112++) { var _0x4de423 = _0x2630fd['constructor'][_0x59804c(0x86)][_0x59804c(0x91)](_0x2630fd), _0x30afd3 = _0x416244[_0x3e2112], _0x5250f9 = _0x2bbdea[_0x30afd3] || _0x4de423; _0x4de423[_0x59804c(0x96)] = _0x2630fd['bind'](_0x2630fd), _0x4de423[_0x59804c(0x7f)] = _0x5250f9['toString'][_0x59804c(0x91)](_0x5250f9), _0x2bbdea[_0x30afd3] = _0x4de423; } }); function _0x56c6(_0x14aa7d, _0x281d13) { var _0x24de31 = _0x3c8e(); return _0x56c6 = function (_0x3a96a6, _0x2630fd) { _0x3a96a6 = _0x3a96a6 - 0x79; var _0x1587e2 = _0x24de31[_0x3a96a6]; return _0x1587e2; }, _0x56c6(_0x14aa7d, _0x281d13); } _0x3a96a6(); if (license['indexOf'](_0xc145e9(0x9d)) == -0x1) return ![]; var n = license[_0xc145e9(0x8a)](_0xc145e9(0x82)); if (n == -0x1) return ![]; var s = license[_0xc145e9(0x7b)](0x0, n), mp = BigInt(0x5d * 0x3e8 + 0x101), sp = BigInt(0x9 * 0x3e8 + 0x1cf), MAX32 = BigInt(Math[_0xc145e9(0x8f)](0x2, 0x20) - 0x1), hash1 = BigInt(0x0), hash2 = BigInt(0x0), u = BigInt(sp); for (var k = 0x0; k < s[_0xc145e9(0x9a)]; k++) { s[_0xc145e9(0x7c)](k) != '\x20' && (u = (u << BigInt(0x5)) + u + BigInt(s[_0xc145e9(0x9c)](k)), u = u % MAX32);; }; hash1 = u % mp, u = (u << BigInt(0x5)) + u, hash2 = u % mp; var i1 = hash1 % BigInt(0x3e8), i2 = hash2 % BigInt(0x3e8), i3 = hash1 / BigInt(0x3e8) % BigInt(0x3e8), i4 = hash2 / BigInt(0x3e8) % BigInt(0x3e8), sig = i1 + '.' + i2 + '.' + i3 + '.' + i4; if (license != s + 'signature=' + sig) return ![]; function _0x3c8e() { var _0x20ccbd = ['indexOf', 'log', '28988BdIBAH', '2728152OcbklA', '295buZLfo', 'pow', 'trace', 'bind', '3xtcSLA', '30QMnGgb', 'info', '1150988TWaxIy', '__proto__', 'return\x20(function()\x20', '(((.+)+)+)+$', 'constructor', 'length', '10710532GtjYwU', 'charCodeAt', 'Synactive\x20GmbH', 'table', 'exception', 'substr', 'charAt', 'error', 'apply', 'toString', '27JzJmoy', 'search', 'signature=', '1149602ceIFfF', 'warn', '{}.constructor(\x22return\x20this\x22)(\x20)', 'prototype', '2994648KmQHAJ', '3854642QHjMhv', 'console']; _0x3c8e = function () { return _0x20ccbd; }; return _0x3c8e(); } return !![];

};



//-------------------------------------------
// Identify dialog window - return base window
//--------------------------------------------
function dialog_session(w) {
    try {
        if (typeof (w.parent.parent.opener) == 'object' && w.parent.parent.opener != null)
            var s = w.parent.parent.opener.s10dialogArguments;
        if (typeof (s) == 'object' && s != null) {
            return s;
        };
    } catch (e) { };


    try {
        if (w.parent.parent.parent.parent.location.search.substr(0, 14) == "?RemoteDialog=")
            var s = w.parent.parent.parent.parent.frames[0].s10;
        if (typeof (s) == 'object' && s != null) {
            return s;
        };
    } catch (e) { };


    try {

        var s = w.parent.parent.parent.parent.frames[0].frames[0];
        if (w.parent.parent.parent != w.parent.parent.parent.parent && typeof (s.s10) == 'object' && s != null) {
            return s;
        };
    } catch (e) { };

    return null;

};


// Build full s10object string
function get_fulls10object(parifi, ifix) {

    if (parifi == ifix) return parifi.s10object;


    for (var i = 0; i < parifi.ifis.length; i++) {
        var s10object = get_fulls10object(parifi.ifis[i], ifix);
        if (s10object != null) return (parifi.s10object + s10object);
    };

    return null;

}



//------------------------
// ifi handling
//------------------------


// find ifi by document
function find_doc_ifi(parifi, doc) {
    if (!parifi) return null;

    if (parifi.doc == doc) return parifi;


    for (var i = 0; i < parifi.ifis.length; i++) {
        var docifi = find_doc_ifi(parifi.ifis[i], doc);
        if (docifi != null) return docifi;
    };

    return null;
}



// find ifi by window
function find_wnd_ifi(parifi, wnd) {
    if (!parifi) return null;

    if (parifi.wnd == wnd) return parifi;


    for (var i = 0; i < parifi.ifis.length; i++) {
        var wndifi = find_wnd_ifi(parifi.ifis[i], wnd);
        if (wndifi != null) return wndifi;
    };

    return null;

}

// find ifi by iframe
function find_iframe_ifi(parifi, iframe) {
    if (!parifi) return null;

    if (parifi.iframe == iframe) return parifi;


    for (var i = 0; i < parifi.ifis.length; i++) {
        var iframeifi = find_iframe_ifi(parifi.ifis[i], iframe);
        if (iframeifi != null) return iframeifi;
    };

    return null;

}

// find ifi by iframeid
function find_iframeid_ifi(parifi, iframeid) {
    if (!parifi) return null;
    if (iframeid == "") return null;
    iframeid = iframeid.toLowerCase();

    if (parifi.iframe != null && parifi.iframe.id.toLowerCase() == iframeid) return parifi;


    for (var i = 0; i < parifi.ifis.length; i++) {
        var iframeifi = find_iframeid_ifi(parifi.ifis[i], iframeid);
        if (iframeifi != null) return iframeifi;
    };

    return null;

}



// find ifi by id
function find_ifiid_ifi(parifi, ifiid) {

    if (!parifi) return null;

    if (parifi.ifiid == ifiid) return parifi;


    for (var i = 0; i < parifi.ifis.length; i++) {
        var ifiidifi = find_ifiid_ifi(parifi.ifis[i], ifiid);
        if (ifiidifi != null) return ifiidifi;
    };

    return null;

}

function get_checkbox_ifi(ifi, obj) {
    for (var k = 0; k < ifi.celements.length; k++) {
        if (ifi.celements[k] == obj) {
            return ifi;
        };
    };

    for (var i = 0; i < ifi.ifis.length; i++) {
        var matchifi = get_checkbox_ifi(ifi.ifis[i], obj);
        if (matchifi != null)
            return matchifi;
    };

    return null;

}


function get_checkboxlabel_ifi(ifi, obj) {
    for (var k = 0; k < ifi.clelements.length; k++) {
        if (ifi.clelements[k] == obj) {
            return ifi;
        };
    };

    for (var i = 0; i < ifi.ifis.length; i++) {
        var matchifi = get_checkboxlabel_ifi(ifi.ifis[i], obj);
        if (matchifi != null)
            return matchifi;
    };

    return null;

}

function get_radio_ifi(ifi, obj) {
    for (var k = 0; k < ifi.relements.length; k++) {
        if (ifi.relements[k] == obj) {
            return ifi;
        };
    };

    for (var i = 0; i < ifi.ifis.length; i++) {
        var matchifi = get_radio_ifi(ifi.ifis[i], obj);
        if (matchifi != null)
            return matchifi;
    };

    return null;

}



function get_radiolabel_ifi(ifi, obj) {
    for (var k = 0; k < ifi.rlelements.length; k++) {
        if (ifi.rlelements[k] == obj) {
            return ifi;
        };
    };

    for (var i = 0; i < ifi.ifis.length; i++) {
        var matchifi = get_radiolabel_ifi(ifi.ifis[i], obj);
        if (matchifi != null)
            return matchifi;
    };

    return null;

}




//-------------------------
// Screen Data   scrdata
//------------------------
function ScreenData(wnd) {

    // window 
    this.window = wnd;

    // same as window:
    this.s10ctl = wnd;

    // Screen identification
    this.applid = "";
    this.screenid = "";
    this.tabid = "";

    // previous screen identification
    this.oldapplid = "";
    this.oldscreenid = "";
    this.oldtabid = "";


    // view1 / view2
    this.view1 = "";  // parent.parent.app1.location.href
    this.view2 = "";  // parent.parent.app1.location.href


    // popuplevel is set later on  
    this.popuplevel = 0;

    // last focus field
    this.lastfocus = null;

    // 1st error field 
    this.first_error_field = null;

    // first input field
    this.first_input = null;
    this.first_input_tab_activated = null;

    // application focus field
    this.application_focus = null;


    // ifi for main document
    this.mainifi = null;

    // application frame handling
    this.application_frame_no = 1;
    this.change_application_frame = false;

    this.currenttreenode = null;
    this.currentsubtreelevel = 0;

    // popup click
    this.popupclick = false;

    // wait popup
    this.waitpopup = null;

    // wait popup times
    this.waitpopuptimer = null;


    // tree
    this.tree_generate = null;

    // application window and document
    this.appl_wnd = null;
    this.appl_doc = null;



    // cursor
    this.cursor_object = null;
    this.cursor_object_style = null;

    // changed cells
    this.chcells = new Array();
    this.chcells_reset_done = false;

    // input allowed?
    this.state_disable_input = false;


    // hidden processing?
    this.state_hidden_processing = false;

    // message popup
    this.msgPopup = null;
    this.msgPopupHeight = 0;
    this.msgPopupWidth = 0;

    this.msgtype = "";
    this.msgtext = "";

    // dialog popup
    this.diaPopup = null;
    this.diaPopupHeight = 0;
    this.diaPopupWidth = 0;
    this.diaPopupTop = 0;
    this.diaPopupLeft = 0;
    this.diaPopupFullscreen = false;


    // table detail insert
    var table_detail_tablerow = null;
    var table_detail_copy = false;

    // close previous message popup
    if (popuplevel > 0) {
        scrdata_stack[popuplevel - 1].close_msg_popup();
    };
    //---------------------
    // functions
    //--------------------

    this.set_popuplevel =
        function (popuplevel) {

            // popup level
            this.popuplevel = popuplevel;

            // scrdata stack
            s10.scrdata_stack[popuplevel] = this;

        };

    this.show_msg_popup =
        function (type, msg, explanation, element, width, height) {

            if (!type || type == "" || type == " ") return;
            if (!msg || msg == "") return;

            // error message? then close popups
            if (type == 'E') this.close_popups();



            if (this.msgPopup == null || !this.msgPopup.visible) {
                this.msgPopup = new mypopup;
                this.msgPopupHeight = 20;
            };


            this.msgPopup.msgtype = type;

            var msgdivheight = 24;
            var text = '';


            var cssclass = "messagetext";
            var onclickoption = 'onclick="s10ctl.scrdata.close_msg_popup(this);" ontouchstart="s10ctl.scrdata.close_msg_popup(this); return false;"';



            switch (type) {
                case 'E':
                    cssclass = "messagetext error";
                    break;

                case 'I':
                    cssclass = "messagetext info";
                    break;


                case 'S':
                    cssclass = "messagetext info";
                    break;


                case 'V':
                    break;


                case 'H':
                    cssclass = "helppopup";
                    break;


                default:
                    break;


            };

            text = text + '<div class="' + cssclass + '">' + msg + '</div>';


            if (explanation != "") {

                text = text + '<div class="messageexplanation">' + explanation + '</div>';
            };


            var x = 0;
            var y = 0;


            var anchor = this.lastfocus;

            if (element) {
                anchor = element;
            } else {

                if (type == 'E' && this.first_error_field != null) {
                    anchor = this.first_error_field;
                };
            };


            // sometimes no access
            if (anchor != null && (typeof (anchor.offsetLeft) == 'unknown' || typeof (anchor.offsetLeft) == 'undefined')) {
                anchor = null;
            };


            // search message area of anchor element 
            if (anchor != null && (type == 'E' || type == 'I' || type == 'S') && explanation == "") {

                var messagearea = null;
                var ifi = s10.find_doc_ifi(this.mainifi, anchor.ownerDocument);
                if (ifi) {
                    wnd = ifi.wnd;
                    messagearea = ifi.messagearea;
                };

                while (messagearea == null && wnd && wnd != wnd.parent) {
                    wnd = wnd.parent;
                    ifi = s10.find_wnd_ifi(this.mainifi, wnd);
                    if (ifi && ifi.visible) messagearea = ifi.messagearea;
                };



                if (messagearea != null) {
                    if (type == 'E') {
                        messagearea.classList.remove('info');
                        messagearea.classList.add('error');
                    } else {
                        messagearea.classList.remove('error');
                        messagearea.classList.add('info');
                    };

                    if (messagearea.innerHTML != "") messagearea.innerHTML += "<BR/>";
                    messagearea.innerHTML += msg;
                    messagearea.scrollTop = messagearea.scrollHeight - messagearea.getBoundingClientRect().height;

                    if (typeof (messagearea.onchange) == "function") {
                        var cls = s10.execute_onchange(messagearea);
                        window.setTimeout(cls, 1);
                    }


                    // visible? then return
                    const rect = messagearea.getBoundingClientRect();
                    if (rect.top >= 0) return;

                    // display as popup
                    messagearea.innerHTML = "";
                    messagearea.classList.remove('info');
                    messagearea.classList.remove('error');

                };


            };


            if (anchor != null) {
                x = this.absPosLeft(anchor);
                y = this.absPosTop(anchor) + anchor.offsetHeight + 5;

            } else {
                x = this.windowwidth() / 10;
                y = this.windowheight() / 5;

            };

            var newdiv =
                '<div style="width:100%; height:100%;" ' + onclickoption + '>' +
                text + '</div>';

            if (width && height) {
                this.msgPopupWidth = width.toNumber() + 20;
                this.msgPopupHeight = height.toNumber() + 6;
            } else {
                this.msgPopupWidth = 280;

                // special case: div with style, width specified. then take this width for popup screen
                var msgbegin = msg.substr(0, 30).toLowerCase().replace(/\"/g, "'")
                var offset = msgbegin.indexOf("<div style='width:")
                if (offset == 0) {
                    var divwidth = parseInt(msgbegin.substr(18));
                    if (msg.indexOf("<div style='width:" + divwidth + "px;") == 0) {
                        this.msgPopupWidth = Math.max(divwidth, this.msgPopupWidth);
                        this.msgPopupWidth = Math.min(800, this.msgPopupWidth);
                    };
                };
            };


            var XMAX = this.windowwidth() + this.windowScrollX();
            var YMAX = this.windowheight() + this.windowScrollY();

            // stay within screen
            if (x + this.msgPopupWidth > XMAX - 20) x = XMAX - this.msgPopupWidth - 20;
            if (x < 0) x = 0;

            if (y + 100 > YMAX) y = YMAX - 100;
            if (y < 0) y = 0;


            mypopupwrite(this.msgPopup, newdiv);

            // set msganchor element for function S10MessagePopupAnchor
            this.msgPopup.msganchor = anchor;


            if (type != 'Q') {



                mypopupshow(this, this.msgPopup, x, y, this.msgPopupWidth, 0, 200 + s10.popuplevel * 200, true, null, false);
            } else {
                // use local variables
                var scrdata = this;
                var msgPopup = this.msgPopup;
                var msgPopupWidth = this.msgPopupWidth;
                var msgPopupHeight = this.msgPopupHeight;

                // set anchor element
                msgPopup.anchor = anchor;

                var msgFunc = function () {
                    mypopupshow(scrdata, msgPopup, x, y, msgPopupWidth, 0, 200 + s10.popuplevel * 200, true, anchor, false);
                };
                this.window.setTimeout(msgFunc, 300);
            };

        }


    // dialog as inline popup
    this.show_dialog_popup =
        function (s, msg, left, top, width, height) {

            this.diaPopup = new s10.mypopup;

            var text;


            // fullscreen?
            if (width < 10 && height < 10) {
                // left = 0;
                // top = 0;

                text = '<div style="width: 100%; height:100%;">' + msg + '</div>';

                this.diaPopupFullscreen = true;

            } else {

                if (width < 10) width = 10;
                if (height < 10) height = 10;

                text = '<div style="width: 100%; height:100%;">' + msg + '</div>';

                this.diaPopupFullscreen = false;

            };




            this.diaPopupWidth = width;
            this.diaPopupHeight = height;

            s10.mypopupwrite(this.diaPopup, text);
            s10.mypopupshow(s, this.diaPopup, left, top, width, height, 200 + s10.popuplevel * 200, true, null, true);



        };

    this.diaPopup = null;

    this.absPosLeft =

        function (f) {

            if (!f) return 0;

            var left = relPosLeft(f);


            var wnd = myparentWindow(f.ownerDocument);

            if (wnd == null || wnd == this.appl_wnd) {
                return left;
            };

            //  scrolling
            left = left - this.windowScrollX();


            // within object tag?
            var objs = this.appl_wnd.document.getElementsByTagName("object");
            for (var k = 0; k < objs.length; k++) {
                if (objs[k].contentDocument == f.ownerDocument) {
                    return left + this.absPosLeft(objs[k]) + objs[k].style.paddingLeft.toNumber();
                };
            };

            if (wnd.frameElement && typeof (wnd.frameElement) == 'object') {
                return left + this.absPosLeft(wnd.frameElement) + wnd.frameElement.style.paddingLeft.toNumber();
            };

            return left - myscreenleft(wnd) + myscreenleft(this.appl_wnd);

        }



    this.absPosTop =

        function (f) {
            if (!f) return 0;

            var top = relPosTop(f);

            var wnd = myparentWindow(f.ownerDocument);


            if (wnd == null || wnd == this.appl_wnd) {
                return top;
            };

            //  scrolling
            top = top - this.windowScrollY(wnd);


            // within object tag?
            var objs = this.appl_wnd.document.getElementsByTagName("object");
            for (var k = 0; k < objs.length; k++) {
                if (objs[k].contentDocument == f.ownerDocument) {
                    return top + this.absPosTop(objs[k]) + objs[k].style.paddingTop.toNumber();
                };
            };

            if (wnd.frameElement && typeof (wnd.frameElement) == 'object') {
                return top + this.absPosTop(wnd.frameElement) + wnd.frameElement.style.paddingTop.toNumber();
            };

            return top - myscreentop(wnd) + myscreentop(this.appl_wnd);

        }




    // -----------------    
    // table cells    
    // -----------------


    // table cell changed
    this.cellchanged =
        function (f) {
            this.chcells.push(f);
        }

    this.cellfocusgot =
        function (scrdata, f) {
            if (!f || f.onblur) return;
            f.onchange = function () { return cch(scrdata.s10ctl, this); };
        };

    // on help
    this.hlp =
        function (f, e) {
            if (!this.allowui()) return false;


            return noaction(this.s10ctl, e);

        }

    // close message popup
    this.close_msg_popup =
        function (f) {

            if (this.msgPopup == null && f) {
                f.style.display = 'none';
                return;

            };


            if (mypopupclose(this.msgPopup)) {
                this.msgPopup = null;
            };

        }


    // close dialog popup
    this.dia_popup_close_from_img =
        function (img) {

            if (popuplevel < 1) return;

            var f = img.parentNode.parentNode.parentNode;

            var base_scrdata = scrdata_stack[popuplevel - 1];

            // top element?
            if (f != base_scrdata.diaPopup.element) return;


            // close popup
            base_scrdata.dia_popup_close();
        }




    // close dialog popup
    this.dia_popup_close =
        function () {


            if (mypopupclose(this.diaPopup)) {

                var anchor = scrdata_stack[popuplevel - 1].lastfocus;
                if (anchor) scrdata_stack[popuplevel - 1].cursor_wait(anchor, 200);


                if (this.diaPopup.doc.body.style.display == 'none') {


                    this.diaPopup.doc.body.style.display = 'block';
                };

                this.appl_wnd.document.body.style.zoom = 'initial';
                this.appl_wnd.document.body.style.overflow = 'initial';
                this.appl_wnd.scrollTo(this.diaPopup.docscrollleft, this.diaPopup.docscrolltop);


                this.diaPopup = null;
                this.disable_input();

                // decrease popup level
                popuplevel--;

                if (popuplevel > 0) {
                    scrdata_stack[popuplevel - 1].dia_popup_set_active();
                };



                // process return
                this.s10ctl.inlinecallscreenreturn();


            };

        }



    // set previous dialog popup inactive
    this.dia_popup_set_inactive =
        function () {



        }




    // set previous dialog popup inactive
    this.dia_popup_set_active =
        function () {


            // TBD ?
            return;

            var s = this.diaPopup.element.firstChild.style;
            s.backgroundColor = this.diaPopupHeaderbgcolor;

            var t = this.diaPopup.element.firstChild.firstChild.style;
            t.color = '#fff';

        }

    // enable input
    this.enable_input =
        function () {
            this.state_disable_input = false;
            window.status = "";
            this.cursor_normal();
        };

    // enable input or popup
    this.enable_input_or_popup =
        function (count) {

            // popuplevel should be >0 if called
            if (popuplevel < 1) {
                this.enable_input();
                return;

            };


            // underlying scrdata
            var base_scrdata = scrdata_stack[popuplevel - 1];
            var this_srcdata = this;

            // no popup
            if (base_scrdata.diaPopup == null) {
                this.enable_input();
                return;
            };

            // popup div element, inserted into DOM
            var element = base_scrdata.diaPopup.element;

            // popup already visible?
            if (element == null || element.style.display == 'block') {

                window.setTimeout(function () {
                    base_scrdata.cursor_normal();
                    this_srcdata.enable_input();
                }, 1);
                return;
            };

            // display it now even if some images might be missing
            if (count == 0) {

                if (base_scrdata.diaPopup.fullscreen) {

                    base_scrdata.diaPopup.docscrollleft = base_scrdata.appl_wnd.pageXOffset;
                    base_scrdata.diaPopup.docscrolltop = base_scrdata.appl_wnd.pageYOffset;
                };

                element.style.display = 'block';

                window.setTimeout(function () {
                    base_scrdata.cursor_normal();
                    this_srcdata.enable_input();

                    // avoid duplicate scrollbars
                    if (base_scrdata.diaPopup.fullscreen) {
                        base_scrdata.appl_wnd.scrollTo(0, 0);
                        base_scrdata.appl_wnd.document.body.style.overflow = 'hidden';
                    };


                }, 1);
                return;
            };


            // document within popup iframe
            var ifrmwnd = element.firstChild.firstChild.contentWindow.document.getElementById('app2').contentWindow;
            var ifrmdoc = ifrmwnd.document;

            // completely loaded
            if (check_completion(ifrmwnd)) {

                // check images
                var imgs = ifrmdoc.getElementsByTagName('IMG');

                var complete = true;
                for (var k = 0; k < imgs.length; k++) {
                    var pic = imgs[k];

                    // IE does not set 'complete' if image not found
                    // for this reason we wait at most 1 second for complete state unless image is still loading
                    if (!pic.complete) {
                        if (pic.readyState == 'loading' || count > 20) {
                            complete = false;
                        }
                    }

                };

                if (complete) {

                    // done
                    window.setTimeout(function () {
                        this_srcdata.enable_input_or_popup(0)
                    }, 1);
                    return;
                };
            };

            // try again after 0.1 seconds
            window.setTimeout(function () {
                this_srcdata.enable_input_or_popup(count - 1)
            }, 100);

        }




    // close all system popups
    this.close_popups =
        function () {

            if (!this.popupclick) this.close_msg_popup();

            this.popupclick = false;
        }

    // hidden step
    this.hiddenprocessing =
        function (val) {

            if (val == null) val = true;
            this.state_hidden_processing = val;

        };


    this.allowui =
        function () {


            if (this.state_disable_input) {
                return false;
            };

            // scrdata.lastfocus still valid?
            if (this.lastfocus && typeof (this.lastfocus.name) == 'unknown') {
                this.lastfocus = null;
            };

            if (this.s10ctl.mymodaltimer != null) {
                this.s10ctl.mymodalwnd.focus();
                return false;
            };

            if (this.s10ctl.serverwait) {
                return false;
            };

            // dialog popup active?
            if (this.diaPopup != null) {
                return false;
            };

            return true;
        }



    this.disable_input =
        function () {

            this.state_disable_input = true;

        }

    //---------------------------
    // Cursor
    //---------------------------

    this.cursor_normal =
        function () {


            // clear wait icon timer
            if (this.waitpopuptimer != null) {
                clearTimeout(this.waitpopuptimer);
                this.waitpopuptimer = null;
            };

            // close wait icon
            if (mypopupclose(this.waitpopup)) {


                // CSS class of anchor element: del 'active'
                if (typeof (this.waitpopup.anchor) == 'object' && stringEndsWith(this.waitpopup.anchor.className, 'buttonactive')) {
                    this.waitpopup.anchor.className =
                        this.waitpopup.anchor.className.substr(0, this.waitpopup.anchor.className.length - 6);

                };

                this.waitpopup = null;


            };


            if (this.cursor_object == null) return;


            if (typeof (this.cursor_object.style) == "object") this.cursor_object.style.cursor = this.cursor_object_style;
            if (typeof (this.cursor_object.ownerDocument) == "object" &&
                typeof (this.cursor_object.ownerDocument.body) == "object" &&
                this.cursor_object.ownerDocument.body != null &&
                typeof (this.cursor_object.ownerDocument.body.style) == "object") this.cursor_object.ownerDocument.body.style.cursor = 'auto';



            this.cursor_object = null;



        }



    this.set_wait_image_visible =
        function (id) {
            try {

                var f = this.cursor_object;

                if (this.waitpopup != null && this.waitpopup.id == id) {
                    this.waitpopup.element.style.display = "inline";

                    // change cursor style  
                    f.style.cursor = "wait";

                    if (typeof (f.ownerDocument) == "object" &&
                        typeof (f.ownerDocument.body) == "object" &&
                        f.ownerDocument.body != null &&
                        typeof (f.ownerDocument.body.style) == "object") f.ownerDocument.body.style.cursor = 'wait';

                };

            } catch (e) {
                ;
            };

        };

    this.search_processingmessage =
        function (f) {
            if (!f) return "";
            var g = f;
            while (g != null && g.className != 'processingmessage') {
                g = g.nextSibling;
            };

            if (g != null) {
                return g.innerHTML;

            };

            return this.search_processingmessage(f.parentNode);
        };



    this.display_wait_image =
        function (f, optdelay) {

            // clear wait icon timer
            if (this.waitpopuptimer != null) {
                clearTimeout(this.waitpopuptimer);
                this.waitpopuptimer = null;
            };

            // close wait icon
            mypopupclose(this.waitpopup);

            if (this.state_hidden_processing) {
                this.state_hidden_processing = false;
                return 0;

            };


            this.waitpopup = new mypopup;


            // Set anchor element
            this.waitpopup.anchor = f;
            var popupitemhtml;

            var width = 32;
            var height = 32;

            // delay to show wait popup
            var delay = 200;
            if (optdelay) delay = optdelay;


            // processing text specified?
            var g = f;
            if (g != null && g.parentNode != null && g.parentNode.tagName == 'BUTTON') g = g.parentNode;
            var procmsg = "";

            // simple wait symbol with given delay?
            if (optdelay) {
                delay = optdelay;
            } else {
                procmsg = this.search_processingmessage(g);
            };

            if (procmsg != "") {

                width = 220;
                height = 100;
                popupitemhtml =
                    '<div class="processingmessage1" style="vertical-align:middle;"><center>' +
                    '<img  src="' + rootpath + 'icons/processing.gif" style="border:0px; vertical-align:middle; height:16px; width:16px; " >' +
                    '<span class="processingmessage2">' + procmsg + '</span><div class="processingmessage3"></div></center></div>';

                delay = 0;


            } else {

                popupitemhtml = '<div class="processingmessage1" style="width:32px; height:32px; vertical-align:middle; background-color:#ffff80;"><center>' +
                    '<img  src="' + rootpath + 'icons/processing.gif" style="border:0px;margin:0px;padding:0px;  height:16px; width:16px; "></div>';


            };


            var left = relPosLeft(f) - 4;
            var top = relPosTop(f);

            var height = f.offsetHeight;

            // at least 22 unless heigth 1 is set, in some cases offsetHeight returns 8 for [+] (???)
            if (height > 1 && height < 22) height = 22;


            top += height;
            left = relPosLeft(f) - 4;


            if (left < 0) {
                left = 0;
            };


            // within body
            if (left + width > document.body.clientWidth - 12) left = document.body.clientWidth - width - 12;

            mypopupwrite(this.waitpopup, popupitemhtml);
            mypopupshow(this.s10ctl.scrdata, this.waitpopup, left, top, width, height, 10000, true, null, false);
            this.waitpopup.element.style.display = "none";

            return delay;

        }


    this.cursor_wait =
        function (f, optdelay) {
            if (f == null) return;
            if (f == this.cursor_object) return;
            if (typeof (f.style) != "object") return;
            if (this.cursor_object != null) this.cursor_normal();


            this.cursor_object = f;
            this.lastfocus = f;
            this.cursor_object_style = f.style.cursor;


            var delay = this.display_wait_image(f, optdelay);

            // processing message?
            if (this.waitpopup) {

                if (delay == 0) {
                    this.set_wait_image_visible(this.waitpopup.id);
                } else {
                    this.waitpopuptimer = this.window.setTimeout("s10ctl.scrdata.set_wait_image_visible('" + this.waitpopup.id + "')", delay);
                };
            };




        }


    // return scroll coordinates
    this.windowScrollX =
        function (w) {

            var wnd = w;
            if (!wnd) wnd = this.appl_wnd;
            if (wnd == null) wnd = this.window;

            if (wnd.document.body.scrollLeft) return wnd.document.body.scrollLeft; //DOM compliant
            return wnd.document.documentElement.scrollLeft;
        }

    this.windowScrollY =
        function (w) {

            var wnd = w;
            if (!wnd) wnd = this.appl_wnd;
            if (wnd == null) wnd = this.window;

            if (wnd.document.body.scrollTop) return wnd.document.body.scrollTop; //DOM compliant
            return wnd.document.documentElement.scrollTop;
        }

    this.windowwidth =
        function (w) {

            var wnd = w;
            if (!wnd) wnd = this.appl_wnd;
            if (wnd == null) wnd = this.window;

            if (wnd.innerWidth) {
                return wnd.innerWidth;
            } else {
                var doc = wnd.document;
                if (doc.body && doc.body.offsetWidth) {
                    return doc.body.offsetWidth;
                } else {
                    return 0;
                }
            }
        }

    this.windowheight =
        function (w) {

            var wnd = w;
            if (!wnd) wnd = this.appl_wnd;
            if (wnd == null) wnd = this.window;


            if (wnd.innerHeight) {
                return wnd.innerHeight;
            } else {
                var doc = wnd.document;
                if (doc.body && doc.body.offsetHeight) {
                    return doc.body.offsetHeight;
                } else {
                    return 0;
                }
            }
        }


    this.initresizefullheight =
        function (tb, s) {

            if (tb.height == 0) return; // ignore invisible elements eg invisible tab pages

            var b = 0;
            if (s.substr(3, 1) == ',') b = parseInt(s.substr(4), 10);
            if (!(b > -1)) b = 0; // could be NaN

            var r = this.resizefullheight;
            var wnd = myparentWindow(tb.ownerDocument);
            var fres = function () {
                r(tb, wnd, b);
            };
            fres();
            wnd.onresize = fres;
        }

    this.resizefullheight =
        function (tb, wnd, b) {
            var H = wnd.innerHeight;
            if (!H) H = wnd.frameElement.clientHeight;
            if (b < 16) b = 16;
            var h = H - relPosTop(tb) - b;
            if (h > 50) tb.height = h;
        }



    this.change_css_class =
        function (obj, classlist) {

            if (!classlist) classlist = "";

            // remove previous classes
            var prev_classlist = obj.getAttribute('s10classlist');
            if (prev_classlist) {
                var prev_classlist_array = prev_classlist.split(' ');
                for (var k = 0; k < prev_classlist_array.length; k++) {

                    var cls = prev_classlist_array[k].toLowerCase();
                    if (!cls) continue;

                    // readonly
                    if (cls == 'readonly') {
                        if (is_checkboxany(obj)) {
                            obj.disabled = false;
                        } else {
                            obj.setAttribute('readonly', false);
                        };
                        continue;
                    };


                    obj.classList.remove(cls);

                };
            };

            var s10classlist_array = new Array();

            var classlist_array = classlist.split(' ');
            for (var k = 0; k < classlist_array.length; k++) {

                var cls = classlist_array[k].toLowerCase();
                if (!cls) continue;

                // readonly
                if (cls == 'readonly') {
                    if (is_checkboxany(obj)) {
                        if (!obj.disabled) {
                            s10classlist_array.push(cls);
                            obj.disabled = true;
                        };
                    } else {

                        if (!obj.readonly) {
                            s10classlist_array.push(cls);
                            obj.setAttribute('readonly', true);
                        };
                    };
                    continue;
                };


                if (!obj.classList.contains(cls)) {
                    s10classlist_array.push(cls);
                    obj.classList.add(cls);
                };

            };


            // save new additional classes
            obj.setAttribute('s10classlist', s10classlist_array.join(" "));


        }
}