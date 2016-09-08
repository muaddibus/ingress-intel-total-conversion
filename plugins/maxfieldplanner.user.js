// ==UserScript==
// @id             maxfieldplanne@muaddibus
// @name           IITC plugin: MaxField planner (Portal, agent data -> web / script )
// @category       Data
// @version        0.0.1.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Prepares portal and agent data for MaxField script, posts (forwards) entered data to webpage / writes ready scriptm, for plan generation with MaxField script.
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @include        https://www.ingress.com/mission/*
// @include        http://www.ingress.com/mission/*
// @match          https://www.ingress.com/mission/*
// @match          http://www.ingress.com/mission/*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin

window.plugin.maxfieldplanner = function() {};

// Plugin variables and local storage data

window.plugin.maxfieldplanner._localStorageKey = "plugin-maxfieldplanner-missions";
window.plugin.maxfieldplanner._missionsCache = {};
window.plugin.maxfieldplanner._localStorageLastUpdate = 0;
window.plugin.maxfieldplanner._missionIndex = null;

// Functions
// Set up GUI HTML
window.plugin.maxfieldplanner.setupHTML = function() {
  var container = $('<div id="maxfieldplanner-container">');
  $(container).append('<div id="toolbarForm" class="drawtoolsSetbox"><a onclick="window.plugin.maxfieldplanner.save();">Save ALL missions to browser storage</a></div>');
  $(container).append('<div id="contentForm"><form action="" method="POST"><input type="text" name="missionName" style="width:100%"><br/><input style="margin-left:auto;margin-right:auto;width:100px;" type="submit" value="Submit"></form></div>');
  $(container).append('<ul id="missionPortals"><li>testy</li><li>testy</li><li>testy</li><li>testy</li><li>testy</li></ul>');
  return container;
};

// Inject css file
window.plugin.maxfieldplanner.setupCSS = function() {
  $("<style>")
    .prop("type", "text/css")
    .html("@@INCLUDESTRING:plugins/maxfieldplanner.css@@")
    .appendTo("head");
};
// Draw popup for main interface
window.maxfieldplannerGUI = function() {
    window.plugin.maxfieldplanner.load();
    var dlg = dialog({title:'MaxField planner',html:'Loading GUI...',width:450,minHeight:320});
    dlg.html(window.plugin.maxfieldplanner.setupHTML);
    window.plugin.maxfieldplanner.load();
    window.addHook('portalSelected', window.selectPortal);
};

// Save missions array to localstorage
window.plugin.maxfieldplanner.save = function() {
  if(window.plugin.maxfieldplanner._localStorageLastUpdate < Date.now() - 10*1000) {
    try {
      localStorage[window.plugin.maxfieldplanner._localStorageKey] = JSON.stringify(window.plugin.maxfieldplanner._missionsCache);
      window.plugin.maxfieldplanner._localStorageLastUpdate = Date.now();
      console.log("[plugin.maxfieldplanner] Saved missions to "+window.plugin.maxfieldplanner._localStorageKey);
      return true;
    } catch(e) {
    }
  }
    return false;
};
// Load missions array from localstorage
window.plugin.maxfieldplanner.load = function() {
  try {
    var cache = JSON.parse(localStorage[window.plugin.maxfieldplanner._localStorageKey]);
    window.plugin.maxfieldplanner._missionsCache = cache;
    window.plugin.maxfieldplanner._localStorageLastUpdate = Date.now();
    console.log("[plugin.maxfieldplanner] Loaded missions from "+window.plugin.maxfieldplanner._localStorageKey);
    return true;
  } catch(e) {
  }
  return false;
};


// Main assignment
window.selectPortal = function(data) {
  var guid = data;
  if(!window.portals[guid]) return;

  var data = window.portals[guid].options.data;
  var details = window.portalDetail.get(guid);

  var lvl = data.level;
  if(data.team === "NEUTRAL")
    var t = '<span class="portallevel">L0</span>';
  else
    var t = '<span class="portallevel" style="background: '+COLORS_LVL[lvl]+';">L' + lvl + '</span>';
  t += data.title;

  $("#missionPortals").append("<li>"+t+"</li>");
};


var setup = function() {
    window.plugin.maxfieldplanner.setupCSS();
    $("#toolbox").append('<a onclick="window.maxfieldplannerGUI()" title="Make and submit plan to maxfield script">Maxfield planner</a>');
};

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
