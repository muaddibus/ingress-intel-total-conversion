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

window.plugin.maxfieldplanner.arrayMissions = {};
window.plugin.maxfieldplanner.selectedMissionIndex = null;

// Functions

window.plugin.maxfieldplanner.setupHTML = function() {
  $('<div id="maxfieldplanner-container">')
    .html('<div id="maxfieldplanner-content"><div id="contentForm"><form action="" method="POST"><input type="text" name="pavadinimas" style="width:100%"><br/><input style="margin-left:auto;margin-right:auto;width:100px;" type="submit" value="Submit"><ul id="missionPortals"><li>testy</li><li>testy</li><li>testy</li><li>testy</li><li>testy</li></ul></form></div></div><a id="maxfieldplanner-toggle"><span class="toggle open"></span></a>')
    .appendTo("body");
};

window.plugin.maxfieldplanner.setupJS = function() {
  $("#maxfieldplanner-toggle").click(function(e){
    $("span",this).toggleClass("open").toggleClass("close");
    $("#maxfieldplanner-content").toggle();
  });
};

window.plugin.maxfieldplanner.setupCSS = function() {
  $("<style>")
    .prop("type", "text/css")
    .html("@@INCLUDESTRING:plugins/maxfieldplanner.css@@")
    .appendTo("head");
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

  var percentage = data.health;
  if(details) {
    var totalEnergy = getTotalPortalEnergy(details);
    if(getTotalPortalEnergy(details) > 0) {
      percentage = Math.floor(getCurrentPortalEnergy(details) / totalEnergy * 100);
    }
  }
  t += ' ' + percentage + '% ';
  t += data.title;

  if(details) {
    var l,v,max,perc;
    var eastAnticlockwiseToNorthClockwise = [2,1,0,7,6,5,4,3];

    for(var ind=0;ind<8;ind++)
    {
      if(details.resonators.length == 8) {
        var slot = eastAnticlockwiseToNorthClockwise[ind];
        var reso = details.resonators[slot];
      } else {
        var slot = null;
        var reso = ind < details.resonators.length ? details.resonators[ind] : null;
      }

      var className = TEAM_TO_CSS[getTeam(details)];
      if(slot !== null && OCTANTS[slot] === 'N')
        className += ' north';
      if(reso) {
        l = parseInt(reso.level);
        v = parseInt(reso.energy);
        max = RESO_NRG[l];
        perc = v/max*100;
      } else {
        l = 0;
        v = 0;
        max = 0;
        perc = 0;
      }

      t += '<div class="resonator '+className+'" style="border-top-color: '+COLORS_LVL[l]+';left: '+(100*ind/8.0)+'%;">';
      t += '<div class="filllevel" style="width:'+perc+'%;"></div>';
      t += '</div>';
    }
  }
  $("#missionPortals").append("<li>"+t+"</li>");
};


var setup = function() {
    window.plugin.maxfieldplanner.setupCSS();
    window.plugin.maxfieldplanner.setupHTML();
    window.plugin.maxfieldplanner.setupJS();
    window.addHook('portalSelected', window.selectPortal);
};

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
