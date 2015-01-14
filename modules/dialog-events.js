/**
 *  jCheetah dialog events module
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
		console.log("ERROR (dialog-events): Module can't be loaded: missing jQuery ui");
		return;
	}
	
	$.jCheetah.modules.dialogEvents = {};
	
	var defaultDialogEventHandler = function(event) {
		
		var target = $.jCheetah.getSelector(
				//The selector
				event.currentTarget,
				//The wanted attribute
				"data-dialog-target",
				//The event,
				event,
				//What would you get by default if the attribute doesn't exist?
				undefined);
		
		var action = $.jCheetah.getValue(
				//The element
				event.currentTarget,
				//The wanted attribute
				"data-dialog-action",
				//The event
				undefined,
				//The accepted types
				["string"],
				//What would you get by default if the attribute doesn't exist?
				"open",
				//Allowed results
				undefined);
		
		console.debug("DIALOGEVENTS: performing action",action,"over dialog",target);
		$(target).dialog(action);
	}
	
	$.jCheetah.modules.dialogEvents.load = function(index,element){
		if (typeof(element.attributes['data-dialog-events'])!== "undefined") {
				
			var $element = $(element);
			
			var events = $.jCheetah.getValue(
					//The element
					element,
					//The wanted attribute
					"data-dialog-events",
					//The event
					undefined,
					//The accepted types
					["string"],
					//What would you get by default if the attribute doesn't exist?
					undefined,
					//Allowed results
					undefined);
			
			console.debug("DIALOGEVENTS: adding bind on events",events,"for",element);
			
			$element.bind(events,defaultDialogEventHandler)
				.attr("data-dialog-events-binds",events);
		}
	}
	
	var unload = function(index,element){
		if (typeof(element.attributes['data-dialog-events-binds'])!== "undefined") {
			var $element = $(element);
			$element.unbind($element.attr("data-dialog-events-binds"),defaultDialogEventHandler)
				.removeAttr("data-dialog-events-binds");
		}
	};
	
	$.jCheetah.modules.dialogEvents.triggers = {};
	$.jCheetah.modules.dialogEvents.triggers["data-dialog-events"] = {change:[unload,$.jCheetah.modules.dialogEvents.load],remove:unload}
	
	$.jCheetah.register([
		"data-dialog-events",
		"data-dialog-events-binds",
		"data-dialog-target",
		"data-dialog-action"
	]);
	
})(jQuery);
