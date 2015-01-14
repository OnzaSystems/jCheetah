/**
 *  jCheetah autocomplete module
 *  Copyright (C) 2015 Edward González
 * 
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as published
 *  by the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *   along with this program.  If not, see <http://www.gnu.org/licenses/>
 */

(function($){
	if (typeof($.ui) === "undefined") {
		console.log("ERROR (autocomplete): Module can't be loaded: missing jQuery ui");
		return;
	}
	
	$.jCheetah.modules.autocomplete = {};
	
	$.jCheetah.modules.autocomplete.load = function(index,element){
			
		if (typeof(element.attributes['data-autocomplete-source']) !== 'undefined') {
			
			var $this = $(element);
			
			var autocomplete = $.jCheetah.getValue(
					//The element
					element,
					//The wanted attribute
					"data-autocomplete-source",
					//The event
					undefined,
					//The accepted types
					["string","array","function"],
					//What would you get by default if the attribute doesn't exist?
					undefined,
					//Allowed results
					undefined);
			
			var append_to = $.jCheetah.getSelector(
					//The selector
					element,
					//The wanted attribute
					"data-autocomplete-append-to",
					//The event,
					undefined,
					//What would you get by default if the attribute doesn't exist?
					undefined);
			
			var auto_focus = $.jCheetah.getValue(
					//The element
					element,
					//The wanted attribute
					"data-autocomplete-auto-focus",
					//The event
					undefined,
					//The accepted types
					["boolean"],
					//What would you get by default if the attribute doesn't exist?
					undefined,
					//Allowed results
					undefined);
			
			var delay = $.jCheetah.getValue(
					//The element
					element,
					//The wanted attribute
					"data-autocomplete-delay",
					//The event
					undefined,
					//The accepted types
					["number"],
					//What would you get by default if the attribute doesn't exist?
					undefined,
					//Allowed results
					undefined);
			
			var disabled = $.jCheetah.getValue(
					//The element
					element,
					//The wanted attribute
					"data-autocomplete-disabled",
					//The event
					undefined,
					//The accepted types
					["boolean"],
					//What would you get by default if the attribute doesn't exist?
					undefined,
					//Allowed results
					undefined);
			
			var min_len = $.jCheetah.getValue(
					//The element
					element,
					//The wanted attribute
					"data-autocomplete-min-length",
					//The event
					undefined,
					//The accepted types
					["boolean"],
					//What would you get by default if the attribute doesn't exist?
					undefined,
					//Allowed results
					undefined);
			
			var position = $.jCheetah.getValue(
					//The element
					element,
					//The wanted attribute
					"data-autocomplete-position",
					//The event
					undefined,
					//The accepted types
					["object"],
					//What would you get by default if the attribute doesn't exist?
					undefined,
					//Allowed results
					undefined);
			
			var data = {'source':autocomplete,
				'appendTo' : append_to,
				'autoFocus' : auto_focus,
				'delay':delay,
				'disabled':disabled,
				'minLength':min_len,
				'position':position};
			console.debug("AUTOCOMPLETE: creating autocomplete in",element,"with data",data);
			$this.autocomplete(data).attr("data-is-autocomplete",1);
		}
	}
	
	$.jCheetah.modules.autocomplete.triggers = {};
	
	//This is the basic trigger that adds and removes autocomplete widgets, say the key attribute,
	//So let's create it lonely
	$.jCheetah.modules.autocomplete.triggers["data-autocomplete-source"] = {
		change:
			function(index,element,newValue){
				if (typeof(element.attributes["data-is-autocomplete"]) !== "undefined") {
					console.debug("AUTOCOMPLETE: changing source to ",newValue);
					$(element).autocomplete("option","source",newValue);
				} else {
					console.debug("AUTOCOMPLETE: creating new autocomplete widget");
					$.jCheetah.modules.autocomplete.load(index,element);
				}
			},
		remove:
		
			function(index,element) {
				if (typeof(element.attributes["data-is-autocomplete"]) !== "undefined") {
					console.debug("AUTOCOMPLETE: destroying widget");
					$(element).autocomplete('destroy').removeAttr("data-is-autocomplete");
				}
			}
	};
	
	//However for the other attributes let's create this structure
	var triggdata = {
		//The name		      //the ui option		//the default value
		"data-autocomplete-position":["position",{my:"left top",at:"left bottom",collision:"none"}],
		"data-autocomplete-min-length":["minLength",null],
		"data-autocomplete-disabled":["disabled",false],
		"data-autocomplete-delay":["delay",300],
		"data-autocomplete-auto-focus":["autoFocus",false],
		"data-autocomplete-append-to":["appendTo",null]
	}
	
	//The function for change takes by default (at the end) a new value, so we don't have to use the default
	//Let's only put a uiopt option for the option
	var funcchange = function(uiopt,index,element,newValue){
				if (typeof(element.attributes["data-is-autocomplete"]) !== "undefined") {
					$(element).autocomplete("option",uiopt,newValue);
				}
			}
	
	//And the remove, needs the default value, so we need two uiopt and uidefault
	var funcremove = function(uiopt,uidefault,index,element) {
				if (typeof(element.attributes["data-is-autocomplete"]) !== "undefined") {
					$(element).autocomplete("option",uiopt,uidefault);
				}
			}
	
	//So per attribute
	for (attr in triggdata) {
	
		//We're going to add a trigger for that attribute
		$.jCheetah.modules.autocomplete.triggers[attr] = {
			//and replace the uiopt attribute with the option for that ui element
			change: funcchange.bind(null,triggdata[attr][0]),
			//replace the uiopt also but including the default value
			remove: funcremove.bind(null,triggdata[attr][0],triggdata[attr][1])
		};
		
	}
	
	//finally we register our attributes
	$.jCheetah.register([
		"data-autocomplete-source",
		"data-autocomplete-position",
		"data-autocomplete-min-length",
		"data-autocomplete-disabled",
		"data-autocomplete-delay",
		"data-autocomplete-auto-focus",
		"data-autocomplete-append-to",
		"data-is-autocomplete"
	]);
})(jQuery);