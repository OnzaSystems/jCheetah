/**
 *  jCheetah events module
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
	
	$.jCheetah.modules.JCEvents = {};
	
	defaultJCEventHandler = function(event) {
		
		var $element = $(event.currentTarget);
		var current_run_times = parseInt($element.attr("data-jcevent-n"));
		
		var jcevent_run_times = $.jCheetah.getValue(
				//The element
				event.currentTarget,
				//The wanted attribute
				"data-jcevent-run-times",
				//The event
				undefined,
				//The accepted types
				["number"],
				//What would you get by default if the attribute doesn't exist?
				undefined,
				//Allowed results
				undefined);
		
		if (typeof(jcevent_run_times) === "undefined" ||
				current_run_times < jcevent_run_times) {
			
			$element.attr("data-jcevent-n",current_run_times + 1);
			
			var jctarget = $.jCheetah.getSelector(
					//The selector
					event.currentTarget,
					//The wanted attribute
					"data-jcevent-target",
					//The event,
					event,
					//What would you get by default if the attribute doesn't exist?
					event.currentTarget);
			
			var jcfunction = $.jCheetah.getValue(
					//The element
					event.currentTarget,
					//The wanted attribute
					"data-jcevent-function",
					//The event
					undefined,
					//The accepted types
					["string","function"],
					//What would you get by default if the attribute doesn't exist?
					undefined,
					//Allowed results
					undefined);
			
			var jcargs = $.jCheetah.getValue(
					//The element
					event.currentTarget,
					//The wanted attribute
					"data-jcevent-args",
					//The event
					undefined,
					//The accepted types
					["array"],
					//What would you get by default if the attribute doesn't exist?
					[],
					//Allowed results
					undefined);
			
			if (typeof(jcfunction) === "function") {
				
				var jc_send_event_and_target = $.jCheetah.getValue(
						//The element
						event.currentTarget,
						//The wanted attribute
						"data-jcevent-send-event-and-target",
						//The event
						undefined,
						//The accepted types
						["boolean"],
						//What would you get by default if the attribute doesn't exist?
						true,
						//Allowed results
						undefined);
				
				var jc_context = $.jCheetah.getValue(
						//The element
						event.currentTarget,
						//The wanted attribute
						"data-jcevent-context",
						//The event
						undefined,
						//The accepted types
						undefined,
						//What would you get by default if the attribute doesn't exist?
						event.currentTarget,
						//Allowed results
						undefined);
				
				var applied_args;
				if (jc_send_event_and_target) {
					applied_args = ([event,$(jctarget)]).concat(jcargs);
				} else {
					applied_args = jcargs;
				}
				jcfunction.apply(jc_context,applied_args);
			} else if (typeof(jcfunction) === "string") {
				var $jctarget = $(jctarget);
				$jctarget[jcfunction].apply($jctarget,jcargs);
			}
		}
	}
	
	$.jCheetah.modules.JCEvents.load = function(index,element){
			
		if (typeof(element.attributes['data-jcevent']) !== "undefined") {
				
			var $element = $(element);
			
			if (typeof($element.attr("data-jcevent-n")) === "undefined") {
				$element.attr("data-jcevent-n",0);
			};
			
			var jcevent = $.jCheetah.getValue(
					//The element
					element,
					//The wanted attribute
					"data-jcevent",
					//The event
					undefined,
					//The accepted types
					["string"],
					//What would you get by default if the attribute doesn't exist?
					undefined,
					//Allowed results
					undefined);
			
			$element.bind(jcevent,defaultJCEventHandler)
				.attr("data-jcevent-binds",jcevent);
		}
	};
	
	var unload = function(index,element){
			
		if (typeof(element.attributes['data-jcevent-binds']) !== "undefined") {
		
			var $element = $(element);
		
			$element.unbind($element.attr("data-jcevent-binds"),defaultJCEventHandler)
					.removeAttr("data-jcevent-binds");
		}
	};
	
	$.jCheetah.modules.JCEvents.triggers = {};
	$.jCheetah.modules.JCEvents.triggers["data-jcevent"] = {change:[unload,$.jCheetah.modules.JCEvents.load],remove:unload}
	
	$.jCheetah.register([
		"data-jcevent",
		"data-jcevent-function",
		"data-jcevent-target",
		"data-jcevent-run-times",
		"data-jcevent-args",
		"data-jcevent-send-event-and-target",
		"data-jcevent-context",
		"data-jcevent-binds",
		"data-jcevent-n"
	]);
})(jQuery);