/**
 *  jCheetah ajax event module
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
	
	$.jCheetah.modules.ajaxEvents = {};
	
	/**
	 * This is the function that handles the default
	 * reload event
	 */
	var defaultAjaxEventHandler = function(event){
		
		//checking the ajax target
		var ajax_onevent_reload = $.jCheetah.getSelector(
				//The element
				event.currentTarget,
				//The wanted attribute
				"data-ajax-onevent-reload",
				//The current event
				event,
				//What would you get by default if the attribute doesn't exist?
				undefined);
		
		//We're going to do this for every target that we want to reload
		$(ajax_onevent_reload).each(function(index,element){
			
			//We check the attribute of the number id
			var current_ajax_number_id = $.jCheetah.getValue(
					//The element
					element,
					//The wanted attribute
					"data-ajax-number-id",
					//The event
					event,
					//The accepted types
					["number"],
					//What would you get by default if the attribute doesn't exist?
					undefined,
					//Allowed results
					undefined);
			
			//Also the filter one
			var current_ajax_filter = $.jCheetah.getValue(
					//The element
					element,
					//The wanted attribute
					"data-ajax-filter",
					//The event
					event,
					//The accepted types
					["string"],
					//What would you get by default if the attribute doesn't exist?
					undefined,
					//Allowed results
					undefined);
			
			//Getting the method for change
			var ajax_number_id_change_method = $.jCheetah.getValue(
					//The element
					event.currentTarget,
					//The wanted attribute
					"data-ajax-number-id-change-method",
					//The event
					event,
					//The accepted types
					["string"],
					//What would you get by default if the attribute doesn't exist?
					"sum",
					//Allowed results
					["sum","set"]);
			
			//Checking the change value
			var ajax_number_id_change = $.jCheetah.getValue(
					//The element
					event.currentTarget,
					//The wanted attribute
					"data-ajax-number-id-change",
					//The event
					event,
					//The accepted types
					["number","function"],
					//What would you get by default if the attribute doesn't exist?
					undefined,
					//Allowed results
					undefined);
			if (typeof(ajax_number_id_change) === "function") {
				ajax_number_id_change = ajax_number_id_change(current_ajax_number_id,element);
			}
			
			//Checking the filter change
			var ajax_filter_change = $.jCheetah.getValue(
					//The element
					event.currentTarget,
					//The wanted attribute
					"data-ajax-filter-change",
					//The event
					event,
					//The accepted types
					["string","function"],
					//What would you get by default if the attribute doesn't exist?
					undefined,
					//Allowed results
					undefined);
			if (typeof(ajax_filter_change) === "function") {
				ajax_filter_change = ajax_filter_change(current_ajax_filter,element);
			}
			
			//We check that we've got a number-id change, and a current
			//Attribute for that number
			if (typeof(ajax_number_id_change) !== "undefined") {

				//Now that we've got the value, we need to know the method
				if (ajax_number_id_change_method == "set") {
					//If it's set we just change the attribute to the given value, we need to trigger
					//The event of change
					$(element).attr("data-ajax-number-id",ajax_number_id_change);
					console.debug("AJAXEVENTS: data-ajax-number-id becomes",ajax_number_id_change);
				} else if (typeof(current_ajax_number_id) !== "undefined"){
					//if it's sum, we sum that new value, we need to trigger the event of change
					$(element).attr("data-ajax-number-id",
						current_ajax_number_id + ajax_number_id_change);
					console.debug("AJAXEVENTS: data-ajax-number-id becomes",current_ajax_number_id + ajax_number_id_change);
				};
				
			};
			
			//Now we check a filterchange
			if (typeof(ajax_filter_change) !== "undefined") {
				
				//we set the value
				console.debug("AJAXEVENTS: data-ajax-filter becomes",ajax_filter_change);
				$(element).attr("ajax-filter","'" + ajax_filter_change + "'");
				
			};
			
			console.debug("AJAXEVENTS: reloading ajax");
			$(element).jCheetahLoadAjax();
		});
	};
	
	//Will load the events
	$.jCheetah.modules.ajaxEvents.load = function(index,element){
			
		//Check it
		if (typeof(element.attributes["data-ajax-onevent-reload"]) !== "undefined") {
			
			console.debug("AJAXEVENTS: loading ajax-event over element",element);
		
			$element = $(element);
				
			//Check for the given events
			var ajax_events = $.jCheetah.getValue(
					//The element
					element,
					//The wanted attribute
					"data-ajax-events",
					//The event
					undefined,
					//The accepted types
					["string"],
					//What would you get by default if the attribute doesn't exist?
					"",
					//The expected enum
					undefined);
			
			console.debug("AJAXEVENTS: adding bind for target",element,"on events",ajax_events);
				
			//we're going to bind the whole events
			$element.bind(ajax_events,
					//To reload the ajax
					defaultAjaxEventHandler);
			
			$element.attr("data-ajax-events-binds",ajax_events);
		};
	};
	
	//Unloads the events
	var unload = function(index,element){
			
		if (typeof(element.attributes["data-ajax-events-binds"]) !== "undefined") {
			
			var $element = $(element);
			
			//we're going to unbind the whole events
			$element.unbind($element.attr("data-ajax-events-binds"),
					defaultAjaxEventHandler)
					.removeAttr("data-ajax-events-binds");
		}
	};
	
	$.jCheetah.modules.ajaxEvents.triggers = {};
	$.jCheetah.modules.ajaxEvents.triggers["ajax-events"] = {change:[unload,$.jCheetah.modules.load],remove:unload}
	
	$.jCheetah.register([
		"data-ajax-events",
		"data-ajax-onevent-reload",
		"data-ajax-number-id-change",
		"data-ajax-number-id-change-method",
		"data-ajax-filter-change",
		"data-ajax-request-binds"
	]);

})(jQuery);