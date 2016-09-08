// ==UserScript==
// @id             maxfieldplanner@muaddibus
// @name           IITC plugin: MaxField planner (Portal, agent data -> web / script )
// @category       Data
// @version        0.0.2.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Prepares portal and agent data for MaxField script, posts entered data to webpage / writes ready script, for plan generation with MaxField script.
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
window.plugin.maxfieldplanner._missionsCache = {
  "0": {
    name: "",
    agents: null,
    portals: {
      "guid":"portal.object"
    }
  }
};
window.plugin.maxfieldplanner._missionCache = {
};
window.plugin.maxfieldplanner._localStorageLastUpdate = 0;
window.plugin.maxfieldplanner._missionIndex = null;

// Set up GUI HTML

window.plugin.maxfieldplanner.setupHTML = function() {
  var container = $('<div id="maxfieldplanner-container">');
  $(container).append('<div id="toolbarForm" class="drawtoolsSetbox"><a onclick="window.plugin.maxfieldplanner.save();">Save ALL missions to browser storage</a></div>');
  $(container).append('<div id="contentForm"><form action="" method="POST"><input type="text" name="missionName" style="width:100%"><br/><input style="margin-left:auto;margin-right:auto;width:100px;" type="submit" value="Submit"></form></div>');
  $(container).append('<ul id="missionPortals"><li>testy</li><li>testy</li><li>testy</li><li>testy</li><li>testy</li></ul>');
  return container;
};

// Inject CSS file

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
};

// Save missions object to localstorage
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
// Load missions object from localstorage
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


// Main portal assignment to plan
// TESTING AREA
// TODO assign to object, auto update GUI, auto save if not too often
window.selectPortal = function(data) {
  var guid = data;

  // No portal? Exit
  if(!window.portals[guid]) return;
  console.log("Selecting portal:"+guid);


  // No current mission, exit
  if(!window.plugin.maxfieldplanner._missionsCache[window.plugin.maxfieldplanner._missionIndex]) return;
  // Get current mission
  var mission = window.plugin.maxfieldplanner._missionsCache[window.plugin.maxfieldplanner._missionIndex];

  // One portal object
  var portal = {
    name: "",
    pos_lng: "",
    pos_lat: "",
    level: "",
    team: ""
  };
  // Extract required portal data fields
  data = window.portals[guid].options.data;
  var details = window.portalDetail.get(guid);
  portal.name = data.title;
  portal.pos_lng = data.title;
  portal.pos_lat = data.title;
  portal.level = data.level;
  portal.team = data.team;

  // Add portal to mission, overwrite if exists
  mission.portals[guid] = portal;
  // Save mission
  window.plugin.maxfieldplanner._missionsCache[window.plugin.maxfieldplanner._missionIndex] = mission;
  console.log(window.plugin.maxfieldplanner._missionsCache);
  window.plugin.maxfieldplanner.save();
};


var setup = function() {
  // Injects CSS file
  window.plugin.maxfieldplanner.setupCSS();
  // Injects link to main #toolbax "Maxfield planner"
  $("#toolbox").append('<a onclick="window.maxfieldplannerGUI()" title="Make and submit plan to maxfield script">Maxfield planner</a>');
  // Hooks on "portalSelected" to intercept selected portal for adding to current plan
  window.addHook('portalSelected', window.selectPortal);
  // Testing index
  window.plugin.maxfieldplanner._missionIndex = 0;

};

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
