// ==UserScript==
// @id             maxfieldplanner@muaddibus
// @name           IITC plugin: MaxField planner (Portal, agent data -> web / script )
// @category       Data
// @version        0.1.0.@@DATETIMEVERSION@@
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

window.plugin.maxfieldplanner._localStorageKey = "plugin-maxfieldplanner-plans";
window.plugin.maxfieldplanner._plansCache = {
  "0": {
    name: "Testinis planas",
    agents: 2,
    portals: {
      "guid":"portal.object"
    }
  }
};
//window.plugin.maxfieldplanner._plansCache = {};
window.plugin.maxfieldplanner._localStorageLastUpdate = 0;
window.plugin.maxfieldplanner._planIndex = null;
window.plugin.maxfieldplanner._editable = false;

// Set up GUI HTML

window.plugin.maxfieldplanner.setupHTML = function() {
  var container = $('<div id="maxfieldplanner-container">');
  $(container).append('<div id="toolbarForm" class="drawtoolsSetbox"><button id="toggleEdit" onclick="window.plugin.maxfieldplanner.toggleEditMode();" type="button" class="ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only" role="button"><span class="ui-button-text">Edit plans (Status:disabled)</span></button><button onclick="window.plugin.maxfieldplanner.save(true);" type="button" class="ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only" role="button"><span class="ui-button-text">Save all plans</span></button><button onclick="window.plugin.maxfieldplanner.clearLocalstorage();" type="button" class="ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only" role="button"><span class="ui-button-text">Clear ALL from broser storage</span></button>');
  $(container).append('<div id="contentForm"><form action="" method="POST"><input type="text" name="planName" style="width:100%"><br/><input style="margin-left:auto;margin-right:auto;width:100px;" type="submit" value="Submit"></form></div>');
  $(container).append('<ul id="Plans"></ul>');
  $(container).append('<ul id="planPortals"><li>testy</li><li>testy</li><li>testy</li><li>testy</li><li>testy</li></ul>');
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
    if(window.plugin.maxfieldplanner.statusEditMode()) {
	window.plugin.maxfieldplanner.enableEditMode();
    }else {
	window.plugin.maxfieldplanner.disableEditMode();
    }
    window.plugin.maxfieldplanner.reloadPlanList();
};

// Save plans object to localstorage (disable timer wait = true/false)
window.plugin.maxfieldplanner.save = function(disabled_timer) {
  if(disabled_timer) {
      try {
        localStorage[window.plugin.maxfieldplanner._localStorageKey] = JSON.stringify(window.plugin.maxfieldplanner._plansCache);
        console.log("[plugin.maxfieldplanner] Saved plans to localStorage");
        console.log("[plugin.maxfieldplanner] Plan count:"+Object.keys(window.plugin.maxfieldplanner._plansCache).length);
        return true;
      } catch(e) {
      }
  } else {
    if(window.plugin.maxfieldplanner._localStorageLastUpdate < Date.now() - 10*1000) {
      try {
        localStorage[window.plugin.maxfieldplanner._localStorageKey] = JSON.stringify(window.plugin.maxfieldplanner._plansCache);
        window.plugin.maxfieldplanner._localStorageLastUpdate = Date.now();
        console.log("[plugin.maxfieldplanner] Saved plans to localStorage");
        console.log("[plugin.maxfieldplanner] Plan count:"+Object.keys(window.plugin.maxfieldplanner._plansCache).length);
        return true;
      } catch(e) {
      }
    }
  }
  return false;
};
// Load plans object from localstorage
window.plugin.maxfieldplanner.load = function() {
  try {
    var cache = JSON.parse(localStorage[window.plugin.maxfieldplanner._localStorageKey]);
    window.plugin.maxfieldplanner._plansCache = cache;
    console.log("[plugin.maxfieldplanner] Loaded plans from localStorage");
    console.log("[plugin.maxfieldplanner] Plan count:"+Object.keys(window.plugin.maxfieldplanner._plansCache).length);
    return true;
  } catch(e) {
  }
  return false;
};

// Clear all plans from local storage
window.plugin.maxfieldplanner.clearLocalstorage = function() {
if(window.plugin.maxfieldplanner.statusEditMode()) {
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
          window.plugin.maxfieldplanner._plansCache = {};
          window.plugin.maxfieldplanner.save(true);
          console.log("[plugin.maxfieldplanner] Plans purged.");
          window.plugin.maxfieldplanner.reloadPlanList();
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

// Get plan list, update GUI
window.plugin.maxfieldplanner.reloadPlanList = function() {
  $('#Plans').html('');
  console.log("[plugin.maxfieldplanner] Plan count:"+Object.keys(window.plugin.maxfieldplanner._plansCache).length);
  if(Object.keys(window.plugin.maxfieldplanner._plansCache).length>0) {
    $.each(window.plugin.maxfieldplanner._plansCache, function(id,plan) {
      var mp,ma;
      if(plan.portals) {
        mp = Object.keys(plan.portals).length;
      } else{
        mp = 0;
      }
      if(plan.agents) {
        ma = Object.keys(plan.agents).length;
      } else{
        ma = 0;
      }
      $('#Plans').append("<li>"+plan.name+" (P:"+mp+" | "+ma+")</li>");
    });
  }
  return false;
};
window.plugin.maxfieldplanner.reloadPlanPortalsList = function() {
  $('#planPortals').html('');
  console.log("[plugin.maxfieldplanner] Portal count:"+Object.keys(window.plugin.maxfieldplanner._plansCache[window.plugin.maxfieldplanner._planIndex].portals).length);
  if(Object.keys(window.plugin.maxfieldplanner._plansCache[window.plugin.maxfieldplanner._planIndex].portals).length>0) {
    $.each(window.plugin.maxfieldplanner._plansCache[window.plugin.maxfieldplanner._planIndex].portals, function(guid,portal) {
      $('#planPortals').append("<li>"+portal.name+" "+guid+"</li>");
    });
  }
  return false;
};

// Enable/disable/get status of  edit mode
window.plugin.maxfieldplanner.enableEditMode = function () {
    window.plugin.maxfieldplanner._editable = true;
    $("#toggleEdit > span").html("Edit plans (Status:enabled)");
  console.log("[plugin.maxfieldplanner] Editable: "+window.plugin.maxfieldplanner.statusEditMode());
};
window.plugin.maxfieldplanner.disableEditMode = function () {
    // Save before exiting edit mode
    window.plugin.maxfieldplanner.save(true);
    window.plugin.maxfieldplanner._editable = false;
    $("#toggleEdit > span").html("Edit plans (Status:disabled)");
  console.log("[plugin.maxfieldplanner] Editable: "+window.plugin.maxfieldplanner.statusEditMode());
};
window.plugin.maxfieldplanner.statusEditMode = function () {
    return window.plugin.maxfieldplanner._editable;
};

// Toggle edit mode and send response
window.plugin.maxfieldplanner.toggleEditMode = function () {
  if(window.plugin.maxfieldplanner.statusEditMode()) {
    window.plugin.maxfieldplanner.disableEditMode();
    $("#toggleEdit > span").html("Edit plans (Status:disabled)");
  } else {
    // Check if plan is selected before enabling
    if(window.plugin.maxfieldplanner._planIndex>=0) {
      window.plugin.maxfieldplanner.enableEditMode();
      $("#toggleEdit > span").html("Edit plans (Status:enabled)");
    } else {
      $("#toggleEdit > span").html("Edit plans (Status:disabled)");
    }
  }
};

// Main portal assignment to plan
// TESTING AREA
// TODO assign to object, auto update GUI, onclose and auto save
window.addPortaltoPlan = function(data) {
  if(window.plugin.maxfieldplanner.statusEditMode()) {
  var guid = data.guid;

  // No current plan, exit
  if(!window.plugin.maxfieldplanner._plansCache[window.plugin.maxfieldplanner._planIndex]) return;
  // Get current plan
  var plan = window.plugin.maxfieldplanner._plansCache[window.plugin.maxfieldplanner._planIndex];

  // One portal object
  var portal = {};
  // Extract required portal data fields
  portal.name = data.portalData.title;
  portal.pos_lng =data.portal._latlng.lng;
  portal.pos_lat = data.portal._latlng.lat;
  portal.level = data.portalData.level;
  portal.team = data.portalData.team;
  console.log("[plugin.maxfieldplanner] Portal:");
  console.log(portal);
  // Add portal to plan, overwrite if exists
  plan.portals[guid] = portal;
  // Save plan
  window.plugin.maxfieldplanner._plansCache[window.plugin.maxfieldplanner._planIndex] = plan;
  window.plugin.maxfieldplanner.reloadPlanList();
  window.plugin.maxfieldplanner.save(true);
  }
};


var setup = function() {
  // Injects CSS file
  //window.plugin.maxfieldplanner.load();
  window.plugin.maxfieldplanner.setupCSS();
  // Injects link to main #toolbax "Maxfield planner"
  $("#toolbox").append('<a onclick="window.maxfieldplannerGUI()" title="Make and submit plan to maxfield script">Maxfield planner</a>');
  // Hooks on "portalSelected" to intercept selected portal for adding to current plan
  window.addHook('portalDetailsUpdated', window.addPortaltoPlan);
  // Testing index
  window.plugin.maxfieldplanner._planIndex = 0;

};

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
