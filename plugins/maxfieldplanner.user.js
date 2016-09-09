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
window.plugin.maxfieldplanner._editable = false;

// Set up GUI HTML

window.plugin.maxfieldplanner.setupHTML = function() {
  var container = $('<div id="maxfieldplanner-container">');
  $(container).append('<div id="toolbarForm" class="drawtoolsSetbox"><a onclick="window.plugin.maxfieldplanner.toggleEditMode();" id="toggleEdit">Edit missions (Status:disabled)</a><a onclick="window.plugin.maxfieldplanner.save(true);">Save ALL missions to browser storage</a><a onclick="window.plugin.maxfieldplanner.clearLocalstorage();">CLEAR ALL missions from browser storage</a></div>');
  $(container).append('<div id="contentForm"><form action="" method="POST"><input type="text" name="missionName" style="width:100%"><br/><input style="margin-left:auto;margin-right:auto;width:100px;" type="submit" value="Submit"></form></div>');
  $(container).append('<ul id="Missions"></ul>');
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
    var dlg = dialog({title:'MaxField planner',html:'Loading GUI...',width:450,minHeight:420});
    dlg.on('dialogclose', function(event) { window.plugin.maxfieldplanner.save(true); });
    dlg.html(window.plugin.maxfieldplanner.setupHTML);
    window.plugin.maxfieldplanner.reloadMissionList();
};

// Save missions object to localstorage (disable timer wait = true/false)
window.plugin.maxfieldplanner.save = function(disabled_timer) {
  if(disabled_timer) {
      try {
        console.log("Portal count:"+Object.keys(window.plugin.maxfieldplanner._missionsCache[window.plugin.maxfieldplanner._missionIndex].portals).length);
        localStorage[window.plugin.maxfieldplanner._localStorageKey] = JSON.stringify(window.plugin.maxfieldplanner._missionsCache);
        window.plugin.maxfieldplanner._localStorageLastUpdate = Date.now();
        console.log("[plugin.maxfieldplanner] Saved missions to "+window.plugin.maxfieldplanner._localStorageKey);
        return true;
      } catch(e) {
      }
  } else {
    if(window.plugin.maxfieldplanner._localStorageLastUpdate < Date.now() - 10*1000) {
      try {
        console.log("Portal count:"+Object.keys(window.plugin.maxfieldplanner._missionsCache[window.plugin.maxfieldplanner._missionIndex].portals).length);
        localStorage[window.plugin.maxfieldplanner._localStorageKey] = JSON.stringify(window.plugin.maxfieldplanner._missionsCache);
        window.plugin.maxfieldplanner._localStorageLastUpdate = Date.now();
        console.log("[plugin.maxfieldplanner] Saved missions to "+window.plugin.maxfieldplanner._localStorageKey);
        return true;
      } catch(e) {
      }
    }
  }
  return false;
};
// Load missions object from localstorage
window.plugin.maxfieldplanner.load = function() {
  try {
    var cache = JSON.parse(localStorage[window.plugin.maxfieldplanner._localStorageKey]);
    window.plugin.maxfieldplanner._missionsCache = cache;
    console.log("[plugin.maxfieldplanner] Loaded missions from "+window.plugin.maxfieldplanner._localStorageKey);
    console.log("Portal count:"+Object.keys(window.plugin.maxfieldplanner._missionsCache[window.plugin.maxfieldplanner._missionIndex].portals).length);
    return true;
  } catch(e) {
  }
  return false;
};

// Clear all missions from local storage
window.plugin.maxfieldplanner.clearLocalstorage = function() {
if(window.plugin.maxfieldplanner._editable) {
  $('<div></div>').appendTo('body')
    .html('<div><h6>Are you sure?</h6></div>')
    .dialog({
      modal: true,
      title: 'Delete message',
      zIndex: 10000,
      autoOpen: true,
      width: 'auto',
      resizable: false,
      buttons: {
        Yes: function () {
          window.plugin.maxfieldplanner._missionsCache = {};
          window.plugin.maxfieldplanner.save();
          console.log("[plugin.maxfieldplanner] Missions purged.");
          window.plugin.maxfieldplanner.reloadMissionList();
          $(this).dialog("close");
        },
        No: function () {
          $(this).dialog("close");
        }
      },
      close: function (event, ui) {
        $(this).remove();
      }
    });
}
};

// Get mission list, update GUI
window.plugin.maxfieldplanner.reloadMissionList = function() {
  $('#Missions').html('');
  console.log("Mission count:"+Object.keys(window.plugin.maxfieldplanner._missionsCache).length);
  if(Object.keys(window.plugin.maxfieldplanner._missionsCache).length>0) {
    $.each(window.plugin.maxfieldplanner._missionsCache, function(id,mission) {
      var mp,ma;
      if(mission.portals) {
        mp = Object.keys(mission.portals).length;
      } else{
        mp = 0;
      }
      if(mission.agents) {
        ma = Object.keys(mission.agents).length;
      } else{
        ma = 0;
      }
      $('#Missions').append("<li>"+mission.name+" (P:"+mp+" | "+ma+")</li>");
    });
  }
  return false;
};
window.plugin.maxfieldplanner.reloadMissionPortalsList = function() {
  $('#missionPortals').html('');
  console.log("Portal count:"+Object.keys(window.plugin.maxfieldplanner._missionsCache[window.plugin.maxfieldplanner._missionIndex].portals).length);
  if(Object.keys(window.plugin.maxfieldplanner._missionsCache[window.plugin.maxfieldplanner._missionIndex].portals).length>0) {
    $.each(window.plugin.maxfieldplanner._missionsCache[window.plugin.maxfieldplanner._missionIndex].portals, function(guid,portal) {
      $('#missionPortals').append("<li>"+portal.name+" "+guid+"</li>");
    });
  }
  return false;
};

// Toggle edit mode and send response
window.plugin.maxfieldplanner.toggleEditMode = function () {
  if(window.plugin.maxfieldplanner._editable) {
    // save before exiting edit
    window.plugin.maxfieldplanner.save(true);
    window.plugin.maxfieldplanner._editable = false;
    $("#toggleEdit").html("Edit missions (Status:disabled)");
    return false;
  } else {
    // Check if mission is selected before enabling
    if(window.plugin.maxfieldplanner._missionIndex>=0) {
      window.plugin.maxfieldplanner._editable = true;
      $("#toggleEdit").html("Edit missions (Status:enabled)");
      return true;
    } else {
      $("#toggleEdit").html("Edit missions (Status:disabled)");
      return false;
    }
  }
};

// Main portal assignment to plan
// TESTING AREA
// TODO assign to object, auto update GUI, onclose and auto save
window.selectPortal = function(data) {
  if(window.plugin.maxfieldplanner._editable) {
console.log(window.portal);
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
  portal.pos_lng = window.portals[guid]._latlng.lng;
  portal.pos_lat = window.portals[guid]._latlng.lat;
  portal.level = data.level;
  portal.team = data.team;

  // Add portal to mission, overwrite if exists
  mission.portals[guid] = portal;
  // Save mission
  window.plugin.maxfieldplanner._missionsCache[window.plugin.maxfieldplanner._missionIndex] = mission;
  window.plugin.maxfieldplanner.reloadMissionList();
  window.plugin.maxfieldplanner.save(true);
  }
};


var setup = function() {
  // Injects CSS file
  window.plugin.maxfieldplanner.load();
  window.plugin.maxfieldplanner.setupCSS();
  // Injects link to main #toolbax "Maxfield planner"
  $("#toolbox").append('<a onclick="window.maxfieldplannerGUI()" title="Make and submit plan to maxfield script">Maxfield planner</a>');
  // Hooks on "portalSelected" to intercept selected portal for adding to current plan
//  window.addHook('portalSelected', window.selectPortal);
  // Testing index
  window.plugin.maxfieldplanner._missionIndex = 0;

};

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
