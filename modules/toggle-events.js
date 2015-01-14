/**
 *  jCheetah toggle events module
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
		console.log("ERROR (toggle-events): Module can't be loaded: missing jQuery ui");
		return;
	}
	
	$.jCheetah.modules.toggleEvents = {};
	
	var defaultToggleEventHandler = function(event) {
		
		//The animation
		var animation = $.jCheetah.getValue(
				//The element
				event.currentTarget,
				//The wanted attribute
				"data-toggle-animation",
				//The event
				event,
				//The accepted types
				["string"],
				//What would you get by default if the attribute doesn't exist?
				"fade",
				//Allowed results
				["blind","bounce","clip","drop","fade","fold","puff","pulsate",
				 "scale","shake","size","slide","explode"]);
		
		//the target
		var target = $.jCheetah.getSelector(
				//The selector
				event.currentTarget,
				//The wanted attribute
				"data-toggle-target",
				//The event,
				event,
				//What would you get by default if the attribute doesn't exist?
				event.currentTarget);
		
		//The callback function
		var callback = $.jCheetah.getValue(
				//The element
				event.currentTarget,
				//The wanted attribute
				"data-toggle-callback",
				//The event
				event,
				//The accepted types
				["function"],
				//What would you get by default if the attribute doesn't exist?
				undefined,
				//Allowed results
				undefined);
		
		var duration = $.jCheetah.getValue(
				//The element
				event.currentTarget,
				//The wanted attribute
				"data-toggle-duration",
				//The event
				event,
				//The accepted types
				["number","string"],
				//What would you get by default if the attribute doesn't exist?
				400,
				//Allowed results
				undefined);
		
		var options = $.jCheetah.getValue(
				//The element
				event.currentTarget,
				//The wanted attribute
				"data-toggle-options",
				//The event
				event,
				//The accepted types
				["object"],
				//What would you get by default if the attribute doesn't exist?
				{},
				//Allowed results
				undefined);
		
		var just_show = $.jCheetah.getValue(
				//The element
				event.currentTarget,
				//The wanted attribute
				"data-toggle-just-show",
				//The event
				event,
				//The accepted types
				["boolean"],
				//What would you get by default if the attribute doesn't exist?
				false,
				//Allowed results
				undefined);
		
		var just_hide = $.jCheetah.getValue(
				//The element
				event.currentTarget,
				//The wanted attribute
				"data-toggle-just-hide",
				//The event
				event,
				//The accepted types
				["boolean"],
				//What would you get by default if the attribute doesn't exist?
				false,
				//Allowed results
				undefined);
		
		var fn = "toggle";
		if (just_show) {
			fn = "show";
		} else if (just_hide) {
			fn = "hide";
		}
		
		//If we've got a target
		if (typeof(target) !== "undefined") {
			//We perform the animation, or no animation in the case of toggle
			console.debug("TOGGLEEVENTS: performing animation",animation,"over",target,"using",fn);
			$(target)[fn](animation,options,duration,callback);
		};
	};
	
	$.jCheetah.modules.toggleEvents.load = function(index,element) {
		
		if (typeof(element.attributes["data-toggle-events"]) !== "undefined") {
			
			var $element = $(element);
			
			var events = $.jCheetah.getValue(
					//The element
					element,
					//The wanted attribute
					"data-toggle-events",
					//The event
					undefined,
					//The accepted types
					["string"],
					//What would you get by default if the attribute doesn't exist?
					undefined,
					//Allowed results
					undefined);
			
			if (typeof(events) === "string") {
				console.debug("TOGGLEEVENTS: Adding toggle event on",events,"to",element);
				$element.bind(events,defaultToggleEventHandler)
					.attr("data-toggle-events-binds",events);
			};
		};
	};
	
	var unload = function(index,element) {
			
		if (typeof(element.attributes["data-toggle-events-binds"]) !== "undefined") {
		
			var $element = $(element);
			var binds = $element.attr("data-toggle-events-binds");
			console.debug("TOGGLEEVENTS: Removing toggle event on",binds,"to",element);
			$element.unbind(binds,
					$.jCheetah.modules.toggleEventsdefaultToggleEventHandler)
					.removeAttr("data-toggle-events-binds");
		};
	};
	
	$.jCheetah.modules.toggleEvents.triggers = {};
	$.jCheetah.modules.toggleEvents.triggers["data-toggle-events"] = {change:[unload,$.jCheetah.modules.toggleEvents.load],remove:unload};
	
	$.jCheetah.register([
		"data-toggle-events",
		"data-toggle-events-binds",
		"data-toggle-just-show",
		"data-toggle-just-hide",
		"data-toggle-options",
		"data-toggle-duration",
		"data-toggle-callback",
		"data-toggle-target",
		"data-toggle-animation"
	])
})(jQuery);