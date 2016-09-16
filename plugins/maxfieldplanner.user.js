// ==UserScript==
// @id             maxfieldplanner@muaddibus
// @name           IITC plugin: MaxField planner (Plan = (Portal list, agent count) -> web / script )
// @category       Data
// @version        0.1.5.@@DATETIMEVERSION@@
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

window.plugin.maxfieldplanner.debug = true;
window.plugin.maxfieldplanner.log = function(text) {
  if(window.plugin.maxfieldplanner.debug) {
    console.log("[plugin.maxfieldplanner] "+text);
  }
};


// Plugin variables and local storage data

window.plugin.maxfieldplanner._localStorageKeyPlans = "plugin-maxfieldplanner-plans";
window.plugin.maxfieldplanner._localStorageKeyIndex = "plugin-maxfieldplanner-index";
window.plugin.maxfieldplanner._localStorageKeyOldHighlighter = "plugin-maxfieldplanner-oldhighliter";
window.plugin.maxfieldplanner._plansCache = [];
window.plugin.maxfieldplanner._localStorageLastUpdate = 0;
window.plugin.maxfieldplanner._planIndex = localStorage[window.plugin.maxfieldplanner._localStorageKeyIndex];
window.plugin.maxfieldplanner._editable = false;

plugin.maxfieldplanner.previewOptions = {
  color: "#C33",
  opacity: 0.3,
  weight: 2,
  fill: true,
  dashArray: "1,6",
  radius: 16,
};

// Set up GUI HTML
window.plugin.maxfieldplanner.setupHTML = function() {
  var container = $('<div id="maxfieldplanner-container">');
  $(container).append('<div id="maxfieldplanner-toolbar"><button id="toggleEdit" onclick="window.plugin.maxfieldplanner.toggleEditMode();" type="button" class="ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only" role="button">Edit (Disabled)</button><button onclick="window.plugin.maxfieldplanner.savePlans(true);" type="button" class="ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only" role="button">Save ALL</button><button onclick="window.plugin.maxfieldplanner.clearPlans();" type="button" class="ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only" role="button">Purge ALL!</button>');
  $(container).append('<hr/><div id="maxfieldplanner-plans"><select id="plansList"></select><button id="newPlan" onclick="window.plugin.maxfieldplanner.newPlan();" type="button" class="ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only" role="button">New plan</button><button id="deletePlan" onclick="window.plugin.maxfieldplanner.deletePlan();" type="button" class="ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only" role="button">Delete</button></div>');
  $(container).append('<hr/><div id="maxfieldplanner-plan"><input id="planName" value=""/><input id="planAgents" value="1"/><button id="savePlan" onclick="window.plugin.maxfieldplanner.savePlan();" type="button" class="ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only" role="button">Save</button></div>');
  $(container).append('<hr/><ul id="maxfieldplanner-portals">Portal list loading...</ul>');
  return container;
};

// Inject CSS file

window.plugin.maxfieldplanner.setupCSS = function() {
  $("<style>")
    .prop("type", "text/css")
    .html("#maxfieldplanner-container {\
		display:block;\
	    }\
	    ::-webkit-scrollbar {\
	      width: 3px;\
	      height: 3px;\
	    }\
	    ::-webkit-scrollbar-button {\
	      width: 3px;\
	      height: 3px;\
	    }\
	    ::-webkit-scrollbar-thumb {\
	      background: #ffce00;\
	      border:none;\
	    }\
	    ::-webkit-scrollbar-thumb:hover {\
	      background: #20A8B1;\
	    }\
	    ::-webkit-scrollbar-thumb:active {\
	      background: #20A8B1;\
	    }\
	    ::-webkit-scrollbar-track {\
	      background: rgba(0, 0, 0, 0.6);\
	      border:none;\
	    }\
	    ::-webkit-scrollbar-corner {\
	      background: transparent;\
	    }\
	    hr {\
		color:#FFCE00;\
	    }\
	    #plansList {\
		width:60%;\
		padding:1px;\
	        font-size: 13px;\
	        background-color: #0E3C46;\
	        color: #ffce00;\
	    }\
	    #maxfieldplanner-toolbar > button {\
		width:32%;\
		margin-left:1%;\
	    }\
	    #maxfieldplanner-plans > button {\
		width:19%;\
		margin-left:1%;\
	    }\
	    #maxfieldplanner-portals {\
		list-style-type:none;\
		display:block;\
		height:200px;\
		overflow-y:auto;\
		padding:0px;\
		margin:0px;\
		border:1px solid #FFCE00;\
	    }\
	    #maxfieldplanner-portals > li {\
		border-bottom:1px solid #FFCE00;\
		color:#FFCE00;\
	    }\
	    #maxfieldplanner-portals > li:HOVER {\
		background-color: rgba(0, 0, 0, 0.6);\
	    }\
	    #maxfieldplanner-portals > li:last-child {\
		border-bottom:none;\
	    }\
	    #maxfieldplanner-portals > li > .portal_info {\
	    }\
	    #maxfieldplanner-portals > li > .portal_info > .lvl_E {\
		display:table-cell;\
		background:green;\
		padding:3px;\
	    }\
	    #maxfieldplanner-portals > li > .portal_info > .lvl_R {\
		display:table-cell;\
		background:blue;\
		padding:3px;\
	    }\
	    #maxfieldplanner-portals > li > .portal_info > .name {\
		display:table-cell;\
		cursor:pointer;\
		padding:3px;\
	    }\
	    #maxfieldplanner-portals > li > .portal_toolbar {\
		display:table-cell;\
		float:right;\
	    }\
        .portal_toolbar {\
          background:#FFCE00;\
          }\
        .portal_toolbar a {\
	display:block;\
	width:19px;\
	height:19px;\
        margin:1px;\
	}\
        .leaflet-draw-edit-remove {\
          background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAANIAAAAeCAYAAABZs0CNAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAtVJREFUeNrsmlFy2jAQhkWG93CD0hM0PUHhhdfADeAECScInAA4QblBeOYFcoK6Jyg5QdwTtLvp747GhNgmWttx/m/GY42s8Uqy/l1JlnOEEEIIIYQQQgghhBBCCCGEHNNiF5C6MxgMOnIbb7fbpcG7Z3K7S2XPxdasyHvaASv0J0lLJVpGDb6Ra4OGHho+eLpyG8rVQVasbbduNwat2u0i6wC7sbHNq3S+2Nzj2U6fS/qL5E0MqvBfOBhn1UQkNPZJBaSCCi0keedYbt9T2WtLQfmO4TWMnMat3BYnHk8tPDPs6mC+90TkPDGNxG5kICC113vhsX7fKdLaFzoGJlKHtVEUyhSZqZB8j2ExuE6IyFxQVQkpQ0RmYsJ3/AERafRZ4dENoqL279eQkUls7iCiA64EFewc40rp6/jSCFXXGUQ7oIi08f3AHZ0lIgdPNW7Ceg/TuUWOogspG3qa50/n+kn0UTuewIZwXKF4FpHY+pzhnHtSZlPC2uisaPQmIdVERE1jWLBsyKjU9aJs5KflWxyVCcgmQ0STVLQKujYK9aKLOooIFBFR1BAhdYzKnrNWOkoLlwbmfmeIKPKmeLXloqYicgWnEHFDhPSpQtt+H+506oPpjz+IH43rcOuLCBsLQ0unUYmQShRREnbzvvuhIUL6WaHzWKei3R2uzpnO7S0E2Z2rpZBKFpHDQnr1wSLSxqhsnv6OM9YMc8vvjTrMdBf0vYkot5CwFfxUlog8ljlF0og1EpzHNEfRqdH/s+WJhf0h8MaGz3We59jRrC3tAh+5BUGVJaJnLyk2V+71bcrY2e3qVCGmJXbJSv8hi/4eYebhn6gYGX3zvVw9/E96aXr+Dc57X/eTLLn+vVgf/8lh/5f7t/W6h2gekY7KEnUFbe66Co4IwXZywsE5gxMNqeXCqZMNvtiCCzn0fyRCCCGEEEIIIYQQQgghhBBCCCFG/BVgAMuWWtfqVjkMAAAAAElFTkSuQmCC);\
          background-repeat: no-repeat;\
          background-position: -186px -6px;\
            }\
    ")
    .appendTo("head");
};

// Draw popup for main interface

window.maxfieldplannerGUI = function() {
  var dlg = dialog({title:'MaxField planner',html:'Loading GUI...',width:450,minHeight:420});
  dlg.on('dialogclose', function(event) { window.plugin.maxfieldplanner.savePlans(true); });
  dlg.html(window.plugin.maxfieldplanner.setupHTML);

  // Bind plan selector
  $('#plansList').change(function(){
    window.plugin.maxfieldplanner._planIndex = localStorage[window.plugin.maxfieldplanner._localStorageKeyIndex] = $(this).val();
    window.plugin.maxfieldplanner.reloadPlanList();
    window.plugin.maxfieldplanner.setHighlighter();
  });

  if(window.plugin.maxfieldplanner.statusEditMode()) {
    window.plugin.maxfieldplanner.enableEditMode();
  }
  window.plugin.maxfieldplanner.reloadPlanList();
  window.plugin.maxfieldplanner.setHighlighter();
};

// Hightlight selected portal
window.plugin.maxfieldplanner.highlight = function(data) {
  var guid = data.portal.options.guid;
  // if in my array -> highlight
  if(window.plugin.maxfieldplanner._plansCache===undefined || window.plugin.maxfieldplanner._planIndex==="null") return;
  var portals = window.plugin.maxfieldplanner._plansCache[window.plugin.maxfieldplanner._planIndex].portals;
  for(var portal_index in portals) {
    if(window.plugin.maxfieldplanner._plansCache[window.plugin.maxfieldplanner._planIndex].portals[portal_index].guid===guid) {
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
        localStorage[window.plugin.maxfieldplanner._localStorageKeyPlans] = JSON.stringify(window.plugin.maxfieldplanner._plansCache);
        window.plugin.maxfieldplanner.log("Save output json"+JSON.stringify(window.plugin.maxfieldplanner._plansCache));
        window.plugin.maxfieldplanner.log("Saved plans to localStorage Plan count:"+window.plugin.maxfieldplanner._plansCache.length);
  }else {
    if(window.plugin.maxfieldplanner._localStorageLastUpdate < Date.now() - 10*1000) {
        localStorage[window.plugin.maxfieldplanner._localStorageKeyPlans] = JSON.stringify(window.plugin.maxfieldplanner._plansCache);
        window.plugin.maxfieldplanner._localStorageLastUpdate = Date.now();
        window.plugin.maxfieldplanner.log("Saved plans to localStorage Plan count:"+window.plugin.maxfieldplanner._plansCache.length);
    }
  }
};
// Load plans from localstorage
window.plugin.maxfieldplanner.loadPlans = function() {
    window.plugin.maxfieldplanner._plansCache = JSON.parse(localStorage[window.plugin.maxfieldplanner._localStorageKeyPlans]);
    window.plugin.maxfieldplanner._planIndex = localStorage[window.plugin.maxfieldplanner._localStorageKeyIndex];
    // Set to first plan in array
    if(window.plugin.maxfieldplanner._planIndex==="null") {
      for(var elem in window.plugin.maxfieldplanner._plansCache)
            window.plugin.maxfieldplanner._planIndex = localStorage[window.plugin.maxfieldplanner._localStorageKeyIndex] = elem;
    }
    window.plugin.maxfieldplanner.log("Loaded plans from localStorage");
    window.plugin.maxfieldplanner.log("Plan count:"+window.plugin.maxfieldplanner._plansCache.length);
};

// Clear all plans from local storage
window.plugin.maxfieldplanner.clearPlans = function() {
if(window.plugin.maxfieldplanner.statusEditMode()) {
  dialog({
    id: 'plugin-maxfield-planner',
    title: "All plans WILL BE PURGED!",
    height: 'auto',
    html: "You should really think twise! All plans will be purged permamently!",
    width: '250px',
  }).dialog('option', 'buttons', {
    'Purge': function() {
      window.plugin.maxfieldplanner._plansCache = [];
      localStorage[window.plugin.maxfieldplanner._localStorageKeyIndex] = "null";
      window.plugin.maxfieldplanner.savePlans(true);
      window.plugin.maxfieldplanner.log("All plans purged!!!");
      window.plugin.maxfieldplanner.reloadPlanList();
      $(this).dialog("close");
    },
    'Cancel': function() { $(this).dialog('close'); },
  });
}
};

// EDIT MODE functions (edit/delete/create only in edit mode, else only highlight selected)

// Set highlighter to own save old
window.plugin.maxfieldplanner.setHighlighter = function() {
  // Check if not maxfield highlighter
  if(window._current_highlighter!=='MaxField planner') {
    localStorage[window.plugin.maxfieldplanner._localStorageKeyOldHighlighter] = localStorage.portal_highlighter;
    window.plugin.maxfieldplanner.log("Setting highlighter:"+localStorage.portal_highlighter);
    window.changePortalHighlights('MaxField planner');
    window.updatePortalHighlighterControl();
  }
  resetHighlightedPortals();
};
// Restore old highlighter
window.plugin.maxfieldplanner.restoreHighlighter = function() {
  if(localStorage[window.plugin.maxfieldplanner._localStorageKeyOldHighlighter]!== "null") {
    window.plugin.maxfieldplanner.log("Restoring highlighter:"+localStorage[window.plugin.maxfieldplanner._localStorageKeyOldHighlighter]);
    window.changePortalHighlights(localStorage[window.plugin.maxfieldplanner._localStorageKeyOldHighlighter]);
    localStorage[window.plugin.maxfieldplanner._localStorageKeyOldHighlighter] = "null";
    window.updatePortalHighlighterControl();
  }
  resetHighlightedPortals();
};
// Enable/disable/get status of edit mode
window.plugin.maxfieldplanner.enableEditMode = function() {
  window.plugin.maxfieldplanner._editable = true;
  $("#toggleEdit").html("Edit (Enabled)");
  window.plugin.maxfieldplanner.log("Editable: "+window.plugin.maxfieldplanner.statusEditMode());
};
window.plugin.maxfieldplanner.disableEditMode = function() {
  // Save before exiting edit mode
  window.plugin.maxfieldplanner.savePlans(true);
  window.plugin.maxfieldplanner._editable = false;
  $("#toggleEdit").html("Edit (Disabled)");
  window.plugin.maxfieldplanner.log("Editable: "+window.plugin.maxfieldplanner.statusEditMode());
};
window.plugin.maxfieldplanner.statusEditMode = function () {
    return window.plugin.maxfieldplanner._editable;
};

// Toggle edit mode and send response
window.plugin.maxfieldplanner.toggleEditMode = function () {
  if(window.plugin.maxfieldplanner.statusEditMode()) {
    window.plugin.maxfieldplanner.disableEditMode();
    $("#toggleEdit").html("Edit (Disabled)");
  } else {
    // Check if plan is selected before enabling
    window.plugin.maxfieldplanner.enableEditMode();
    $("#toggleEdit").html("Edit (Enabled)");
  }
};



// PLAN LIST functions

// New plan
window.plugin.maxfieldplanner.newPlan = function() {
  if(window.plugin.maxfieldplanner.statusEditMode()) {
    var planas = {
	name:"New plan [rename it]",
	agents: 1,
	portals:[]
    };
    window.plugin.maxfieldplanner.log("Adding plan...");
    window.plugin.maxfieldplanner._planIndex = localStorage[window.plugin.maxfieldplanner._localStorageKeyIndex] = window.plugin.maxfieldplanner._plansCache.push(planas)-1;
    window.plugin.maxfieldplanner.savePlans(true);
    window.plugin.maxfieldplanner.reloadPlanList();
  }
};

// Delete plan
window.plugin.maxfieldplanner.deletePlan = function() {
if(window.plugin.maxfieldplanner.statusEditMode()) {
  dialog({
    id: 'plugin-maxfield-planner',
    title: "Plan WILL BE DELETED!",
    height: 'auto',
    html: "Plan will be deleted permamently!",
    width: '250px',
  }).dialog('option', 'buttons', {
    'Delete': function() {
      window.plugin.maxfieldplanner._plansCache.splice($('#plansList').val(),1);
      window.plugin.maxfieldplanner.savePlans(true);
      window.plugin.maxfieldplanner.reloadPlanList();
      window.plugin.maxfieldplanner.log("Plan purged!!!");
      $(this).dialog("close");
    },
    'Cancel': function() { $(this).dialog('close'); },
  });
}

};

// Refresh plan list
window.plugin.maxfieldplanner.reloadPlanList = function() {
  $('#plansList').html('');
  window.plugin.maxfieldplanner.log("Reload plan list. Plan count:"+window.plugin.maxfieldplanner._plansCache.length);
  if(window.plugin.maxfieldplanner._plansCache.length>0) {
    for(var id in window.plugin.maxfieldplanner._plansCache) {
      var plan = window.plugin.maxfieldplanner._plansCache[id];
      var selected = '';
      if(id===window.plugin.maxfieldplanner._planIndex) {
        selected = ' selected';
      }
      $('#plansList').append('<option value="'+id+'"'+selected+'>'+plan.name+" (Prtl:"+plan.portals.length+" | Agnt:"+plan.agents+")</option>");
    }
  }
  window.plugin.maxfieldplanner.reloadPlan();
  return false;
};



// PLAN inner functions
window.plugin.maxfieldplanner.reloadPlan = function () {
  if(window.plugin.maxfieldplanner._plansCache===undefined || window.plugin.maxfieldplanner._planIndex==="null") return;
  $('#maxfieldplanner-plan > #planName').val(window.plugin.maxfieldplanner._plansCache[window.plugin.maxfieldplanner._planIndex].name);
  $('#maxfieldplanner-plan > #planAgents').val(window.plugin.maxfieldplanner._plansCache[window.plugin.maxfieldplanner._planIndex].agents);
  window.plugin.maxfieldplanner.reloadPlanPortals();
};

window.plugin.maxfieldplanner.reloadPlanPortals = function() {
  $('#maxfieldplanner-portals').html('');
  window.plugin.maxfieldplanner.log("Portal list refresh. Portal count:"+window.plugin.maxfieldplanner._plansCache[window.plugin.maxfieldplanner._planIndex].portals.length);
  if(window.plugin.maxfieldplanner._plansCache[window.plugin.maxfieldplanner._planIndex].portals.length>0) {
    var portals = window.plugin.maxfieldplanner._plansCache[window.plugin.maxfieldplanner._planIndex].portals;
    for(var portal_index in portals) {
      var portal = portals[portal_index];
      $('#maxfieldplanner-portals').append('<li data-guid="'+portal.guid+'" data-lat="'+portal.pos_lat+'" data-lng="'+portal.pos_lng+'"><span class="portal_info"><span class="lvl_'+portal.team+'">'+portal.level+'</span><span class="name">'+portal.name+'</span></span><span class="portal_toolbar"><a class="leaflet-draw-edit-remove" href="#" title="Delete portal"></a></span></li>');
    }
  }
  // Bind portal indicator on mouse over and out
  $('#maxfieldplanner-portals > li').on('mouseover',function () {
    plugin.maxfieldplanner.removePreview();
    var element = $(this);
    var lat = element.attr('data-lat');
    var lng = element.attr('data-lng');

    var remote = L.latLng(lat, lng);
    plugin.maxfieldplanner.preview = L.layerGroup().addTo(map);
    L.circleMarker(remote, plugin.maxfieldplanner.previewOptions).addTo(plugin.maxfieldplanner.preview);
  });
  $('#maxfieldplanner-portals > li').on('mouseout',function () {
    plugin.maxfieldplanner.removePreview();
  });
  $('.name').on('click',function () {
    var element = $(this).parent().parent();
    var guid = element.attr('data-guid');
    var lat = element.attr('data-lat');
    var lng = element.attr('data-lng');
    if(!guid) return; // overflow
    var position = L.latLng(lat, lng);
    if(!map.getBounds().contains(position)) map.setView(position);

    var portals = window.plugin.maxfieldplanner._plansCache[window.plugin.maxfieldplanner._planIndex].portals;
    for(var portal_index in portals) {
      if(window.plugin.maxfieldplanner._plansCache[window.plugin.maxfieldplanner._planIndex].portals[portal_index].guid===guid)
        renderPortalDetails(guid);
      else
        zoomToAndShowPortal(guid, position);
    }
  });
  $('.leaflet-draw-edit-remove').on('click',function () {
    if(window.plugin.maxfieldplanner.statusEditMode()) {
      var guid = $(this).parent().parent().attr("data-guid");
      window.removePortal4Plan(guid);
    }
  });
  return false;
};

// remove portal indicator
plugin.maxfieldplanner.removePreview = function() {
  if(plugin.maxfieldplanner.preview)
    map.removeLayer(plugin.maxfieldplanner.preview);
  plugin.maxfieldplanner.preview = "null";
};


// Set plan agents
window.plugin.maxfieldplanner.setPlanData = function() {
  window.plugin.maxfieldplanner._plansCache[window.plugin.maxfieldplanner._planIndex].name = $('#maxfieldplanner-plan > #planName').val();
  window.plugin.maxfieldplanner._plansCache[window.plugin.maxfieldplanner._planIndex].agents = $('#maxfieldplanner-plan > #planAgents').val();
};


// add portal to plan
window.addPortal2Plan = function(data) {
  if(window.plugin.maxfieldplanner.statusEditMode()) {
    // get data
    var guid = data.selectedPortalGuid;
    // No current plan, exit
    if(	!window.plugin.maxfieldplanner._plansCache[window.plugin.maxfieldplanner._planIndex]) return;
    // Get current plan for modifications
    var plan = window.plugin.maxfieldplanner._plansCache[window.plugin.maxfieldplanner._planIndex];

    for(var portal_index in plan.portals) {
      if(plan.portals[portal_index].guid===undefined) {
        window.plugin.maxfieldplanner.log("Not found. Adding... :"+guid);
        var tportal = window.portalDetail.get(guid);
        console.log(tportal);
        if(tportal) {
          var portal = {};
          // Extract required portal data fields
          portal.name = tportal.title;
          portal.pos_lng = tportal.lngE6/1E6;
          portal.pos_lat = tportal.latE6/1E6;
          portal.level = tportal.level;
          portal.team = tportal.team;
          portal.image = tportal.image;
          portal.guid = guid;
          plan.portals[guid] = portal;
          window.plugin.maxfieldplanner._plansCache[window.plugin.maxfieldplanner._planIndex] = plan;
          window.plugin.maxfieldplanner.log("Current plan index"+window.plugin.maxfieldplanner._planIndex);
          window.plugin.maxfieldplanner.savePlans(true);
          resetHighlightedPortals();
          window.plugin.maxfieldplanner.reloadPlanList();
        } else {
          window.plugin.maxfieldplanner.log("Skipping portal adding.");
        }
      }
    }
  }
};

// remove portal from plan
window.removePortal4Plan = function(guid) {
  if(window.plugin.maxfieldplanner.statusEditMode()) {
    if(!window.plugin.maxfieldplanner._plansCache[window.plugin.maxfieldplanner._planIndex]) return;
    // Get current plan for modifications
    var plan = window.plugin.maxfieldplanner._plansCache[window.plugin.maxfieldplanner._planIndex];

    for(var portal_index in plan.portals) {
      if(plan.portals[portal_index].guid===guid) {
        // Remove portal from plan if already exists
        delete plan.portals[portal_index];
        window.plugin.maxfieldplanner.log("Removing portal:"+guid);
        window.plugin.maxfieldplanner._plansCache[window.plugin.maxfieldplanner._planIndex] = plan;
        window.plugin.maxfieldplanner.savePlans(true);
        resetHighlightedPortals();
        window.plugin.maxfieldplanner.reloadPlanList();
      }
    }
  }
};

var setup = function() {
  // Injects CSS file
  window.plugin.maxfieldplanner.loadPlans();

  window.plugin.maxfieldplanner.setupCSS();
  // Injects link to main #toolbax "Maxfield planner"
  $("#toolbox").append('<a onclick="window.maxfieldplannerGUI()" title="Make and submit plan to maxfield script">Maxfield planner</a>');
  // Hook on portalSelected to intercept selected portal for adding/removing to current plan
  window.addHook('portalSelected', window.addPortal2Plan);
  // Add specific highlighter
  window.addPortalHighlighter('MaxField planner', window.plugin.maxfieldplanner.highlight);
  localStorage[window.plugin.maxfieldplanner._localStorageKeyOldHighlighter] = "null";
  if(localStorage.portal_highlighter==='MaxField planner') {
    window.changePortalHighlights('No Highlights');
    window.updatePortalHighlighterControl();
  }

};

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
