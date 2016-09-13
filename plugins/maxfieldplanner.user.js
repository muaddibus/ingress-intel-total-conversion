// ==UserScript==
// @id             maxfieldplanner@muaddibus
// @name           IITC plugin: MaxField planner (Plan = (Portal list, agent count) -> web / script )
// @category       Data
// @version        0.1.3.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Prepares portal list and agent count for MaxField script, posts entered data to webpage / writes ready script, for plan generation with MaxField script.
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
    0:{
	name:"Test",
	agents: 4,
	portals:{}
    }
};
window.plugin.maxfieldplanner._localStorageLastUpdate = 0;
window.plugin.maxfieldplanner._planIndex = null;
window.plugin.maxfieldplanner._oldHighlighter = null;
window.plugin.maxfieldplanner._editable = false;

// Set up GUI HTML
window.plugin.maxfieldplanner.setupHTML = function() {
  var container = $('<div id="maxfieldplanner-container">');
  $(container).append('<div id="maxfieldplanner-toolbar"><button id="toggleEdit" onclick="window.plugin.maxfieldplanner.toggleEditMode();" type="button" class="ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only" role="button">Edit plans (Status:disabled)</button><button onclick="window.plugin.maxfieldplanner.savePlans(true);" type="button" class="ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only" role="button">Save all plans</button><button onclick="window.plugin.maxfieldplanner.clearPlans();" type="button" class="ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only" role="button">Clear ALL plans from browser storage</button>');
  $(container).append('<hr/><div id="maxfieldplanner-plans"><select id="plansList"></select><button id="newPlan" onclick="window.plugin.maxfieldplanner.newPlan();" type="button" class="ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only" role="button">New plan</button><button id="deletePlan" onclick="window.plugin.maxfieldplanner.deletePlan();" type="button" class="ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only" role="button">Delete</button></div>');
  $(container).append('<hr/><div id="maxfieldplanner-plan">Plan</div>');
  $(container).append('<hr/><div id="maxfieldplanner-portals">Portals</div>');
  return container;
};

// Inject CSS file

window.plugin.maxfieldplanner.setupCSS = function() {
  $("<style>")
    .prop("type", "text/css")
    .html("#maxfieldplanner-container {\
		display:block;\
	    }\
	    #plansList {\
		width:60%;\
		padding:1px;\
	        font-size: 13px;\
	        background-color: #0E3C46;\
	        color: #ffce00;\
	    }\
	    #maxfieldplanner-plans > button {\
		width:19%;\
		margin-left:1%;\
	    }\
	    ")
    .appendTo("head");
};

// Draw popup for main interface

window.maxfieldplannerGUI = function() {
    var dlg = dialog({title:'MaxField planner',html:'Loading GUI...',width:450,minHeight:420});
    dlg.on('dialogclose', function(event) { window.plugin.maxfieldplanner.savePlans(true); });
    dlg.html(window.plugin.maxfieldplanner.setupHTML);
    $('#plansList').change(function(){
      window.plugin.maxfieldplanner._planIndex = $(this).val();
      window.plugin.maxfieldplanner.reloadPlanList();
      window.plugin.maxfieldplanner.reloadPlanPortals();
      window.changePortalHighlights('MaxField planner');
    });
    if(window.plugin.maxfieldplanner.statusEditMode()) {
	window.plugin.maxfieldplanner.enableEditMode();
    }else {
	window.plugin.maxfieldplanner.disableEditMode();
    }
    window.plugin.maxfieldplanner.reloadPlanList();
    window.plugin.maxfieldplanner.reloadPlanPortals();
};

// Hightlight selected portal
window.plugin.maxfieldplanner.highlight = function(data) {
  var guid = data.portal.options.guid;
  // if in my array black
  if(window.plugin.maxfieldplanner._plansCache!==undefined || window.plugin.maxfieldplanner._planIndex!==undefined) {
    if(window.plugin.maxfieldplanner._plansCache[window.plugin.maxfieldplanner._planIndex].portals[guid]!== undefined) {
      var color,fill_opacity;
      color = 'black';
      fill_opacity = 100;
      var params = {fillColor: color, fillOpacity: fill_opacity};
      data.portal.setStyle(params);
    }
  }
};



// MAIN FUNCTIONS

// Save plans to localstorage (disable timer wait = true/false)
window.plugin.maxfieldplanner.savePlans = function(disabled_timer) {
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
// Load plans from localstorage
window.plugin.maxfieldplanner.loadPlans = function() {
    var cache = JSON.parse(localStorage[window.plugin.maxfieldplanner._localStorageKey]);
    window.plugin.maxfieldplanner._plansCache = cache;
    // Set to first plan in array
    if(window.plugin.maxfieldplanner._planIndex===null) {
      for(var elem in window.plugin.maxfieldplanner._plansCache)
            window.plugin.maxfieldplanner._planIndex = elem;
    }
    console.log("[plugin.maxfieldplanner] Loaded plans from localStorage");
    console.log("[plugin.maxfieldplanner] Plan count:"+Object.keys(window.plugin.maxfieldplanner._plansCache).length);
};

// Clear all plans from local storage
window.plugin.maxfieldplanner.clearPlans = function() {
if(window.plugin.maxfieldplanner.statusEditMode()) {
  dialog({
    id: 'plugin-maxfield-planner',
    title: "All plans WILL BE PURGED!",
    height: 'auto',
    html: "You should really think twise! All plans will be purged permamently!",
    width: '450px',
  }).dialog('option', 'buttons', {
    'Purge': function() {
      window.plugin.maxfieldplanner._plansCache = {};
      window.plugin.maxfieldplanner.savePlans(true);
      console.log("[plugin.maxfieldplanner] Plans purged!!!");
      window.plugin.maxfieldplanner.reloadPlanList();
      $(this).dialog("close");
    },
    'Cancel': function() { $(this).dialog('close'); },
  });
}
};

// EDIT MODE functions (edit/delete/create only in edit mode, else only highlight selected)

// Enable/disable/get status of edit mode
window.plugin.maxfieldplanner.enableEditMode = function () {
  window.plugin.maxfieldplanner._editable = true;
  window.plugin.maxfieldplanner._oldHighlighter = window._current_highlighter;
  window.changePortalHighlights('MaxField planner');
  window.updatePortalHighlighterControl();
  $("#toggleEdit").html("Edit plans (Status:enabled)");
  console.log("[plugin.maxfieldplanner] Editable: "+window.plugin.maxfieldplanner.statusEditMode());
};
window.plugin.maxfieldplanner.disableEditMode = function () {
  // Save before exiting edit mode
  window.plugin.maxfieldplanner.savePlans(true);
  window.plugin.maxfieldplanner._editable = false;
  window.changePortalHighlights(window.plugin.maxfieldplanner._oldHighlighter);
  window.updatePortalHighlighterControl();
  $("#toggleEdit").html("Edit plans (Status:disabled)");
  console.log("[plugin.maxfieldplanner] Editable: "+window.plugin.maxfieldplanner.statusEditMode());
};
window.plugin.maxfieldplanner.statusEditMode = function () {
    return window.plugin.maxfieldplanner._editable;
};

// Toggle edit mode and send response
window.plugin.maxfieldplanner.toggleEditMode = function () {
  if(window.plugin.maxfieldplanner.statusEditMode()) {
    window.plugin.maxfieldplanner.disableEditMode();
    $("#toggleEdit").html("Edit plans (Status:disabled)");
  } else {
    // Check if plan is selected before enabling
    if(window.plugin.maxfieldplanner._planIndex>=0) {
      window.plugin.maxfieldplanner.enableEditMode();
      $("#toggleEdit").html("Edit plans (Status:enabled)");
    } else {
      $("#toggleEdit").html("Edit plans (Status:disabled)");
    }
  }
};



// PLAN LIST functions

// New plan
window.plugin.maxfieldplanner.newPlan = function() {
};

// Delete plan
window.plugin.maxfieldplanner.deletePlan = function(id) {
};

// Refresh plan list
window.plugin.maxfieldplanner.reloadPlanList = function() {
  $('#plansList').html('');
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
      var selected = "";
      if(id===window.plugin.maxfieldplanner._planIndex) {
        selected = " selected";
      }
      $('#plansList').append('<option value="'+id+'"'+selected+'>'+plan.name+" (Prtl:"+mp+" | Agnt:"+ma+")</option>");
    });
  }
  return false;
};



// PLAN inner functions

window.plugin.maxfieldplanner.reloadPlanPortals = function() {
  $('#maxfieldplanner-portals').html('');
  console.log("[plugin.maxfieldplanner] Portal count:"+Object.keys(window.plugin.maxfieldplanner._plansCache[window.plugin.maxfieldplanner._planIndex].portals).length);
  if(Object.keys(window.plugin.maxfieldplanner._plansCache[window.plugin.maxfieldplanner._planIndex].portals).length>0) {
    $.each(window.plugin.maxfieldplanner._plansCache[window.plugin.maxfieldplanner._planIndex].portals, function(guid,portal) {
      $('#maxfieldplanner-portals').append("<li>"+portal.name+" "+guid+"</li>");
    });
  }
  return false;
};

// Rename plan
window.plugin.maxfieldplanner.renamePlan = function() {

  window.plugin.maxfieldplanner.reloadPlanList();
  window.plugin.maxfieldplanner.reloadPlanPortals();
};
// Set plan agents
window.plugin.maxfieldplanner.setPlanAgents = function() {
};


// add/remove portal with plan
window.togglePlanPortal = function(data) {
  if(window.plugin.maxfieldplanner.statusEditMode()) {
    var guid = data.guid;
    // No current plan, exit
    if(!window.plugin.maxfieldplanner._plansCache[window.plugin.maxfieldplanner._planIndex]) return;
    // Get current plan for modifications
    var plan = window.plugin.maxfieldplanner._plansCache[window.plugin.maxfieldplanner._planIndex];

    if(plan.portals[guid]===undefined) {
      // One portal object
      var portal = {};
      // Extract required portal data fields
      portal.name = data.portalData.title;
      portal.pos_lng =data.portal._latlng.lng;
      portal.pos_lat = data.portal._latlng.lat;
      portal.level = data.portalData.level;
      portal.team = data.portalData.team;
      console.log("[plugin.maxfieldplanner] Portal:"+guid);
      // Add portal to plan
      plan.portals[guid] = portal;
      // Save plan to array
    } else {
      // Remove portal from plan if already exists
      delete plan.portals[guid];
      console.log("[plugin.maxfieldplanner] Removing portal:"+guid);
    }
    window.plugin.maxfieldplanner._plansCache[window.plugin.maxfieldplanner._planIndex] = plan;
    window.plugin.maxfieldplanner.savePlans(true);
    window.plugin.maxfieldplanner.reloadPlanPortals();
    window.changePortalHighlights('MaxField planner');
  }
};




var setup = function() {
  // Injects CSS file
  window.plugin.maxfieldplanner.loadPlans();
  window.plugin.maxfieldplanner.setupCSS();
  // Injects link to main #toolbax "Maxfield planner"
  $("#toolbox").append('<a onclick="window.maxfieldplannerGUI()" title="Make and submit plan to maxfield script">Maxfield planner</a>');
  // Hooks on "portalDetailsUpdated" to intercept selected portal for adding/removing to current plan
  window.addHook('portalDetailsUpdated', window.togglePlanPortal);
  // Add specific highlighter
  window.addPortalHighlighter('MaxField planner', window.plugin.maxfieldplanner.highlight);
};

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
