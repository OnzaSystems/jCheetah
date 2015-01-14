/**
 *  jCheetah animation events module
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
	
	$.jCheetah.modules.animationEvents = {};
	
	defaultAnimationEventHandler = function(event) {
		
		var $event_target = $(event.currentTarget);
		
		var n = parseInt($event_target.attr("data-animation-n"));
		var disabled = $event_target.attr("data-animation-disabled") == "1";
		
		var times = $.jCheetah.getValue(
				//The element
				event.currentTarget,
				//The wanted attribute
				"data-animation-times",
				//The event
				event,
				//The accepted types
				["number"],
				//What would you get by default if the attribute doesn't exist?
				undefined,
				//Allowed results
				undefined);
		
		//So we're executing the animation
		var execAnim = true;
		//If this trigger is disabled
		if (disabled) {
			//We're not
			execAnim = false;
		//Otherwise if we've got a limit
		} else if (typeof(times) !== "undefined") {
			//If the current position is the same as the limit
			if (n >= times) {
				//No animation is being executed
				execAnim = false;
			}
		}
		
		//So if we're executing the animation
		if (execAnim) {
			var target = $.jCheetah.getSelector(
					//The selector
					event.currentTarget,
					//The wanted attribute
					"data-animation-target",
					//The event,
					event,
					//What would you get by default if the attribute doesn't exist?
					event.currentTarget);
			
			var setOtherTrigForward = $.jCheetah.getSelector(
					//The selector
					event.currentTarget,
					//The wanted attribute
					"data-animation-set-other-trigger-forward",
					//The event,
					event,
					//What would you get by default if the attribute doesn't exist?
					undefined);
			
			var setOtherTrigBackward = $.jCheetah.getSelector(
					//The selector
					event.currentTarget,
					//The wanted attribute
					"data-animation-set-other-trigger-backward",
					//The event,
					event,
					//What would you get by default if the attribute doesn't exist?
					undefined);
			
			var properties = $.jCheetah.getValue(
					//The element
					event.currentTarget,
					//The wanted attribute
					"data-animation-properties",
					//The event
					event,
					//The accepted types
					["object"],
					//What would you get by default if the attribute doesn't exist?
					{},
					//Allowed results
					undefined);
			
			var duration = $.jCheetah.getValue(
					//The element
					event.currentTarget,
					//The wanted attribute
					"data-animation-duration",
					//The event
					event,
					//The accepted types
					["number","string"],
					//What would you get by default if the attribute doesn't exist?
					undefined,
					//Allowed results
					undefined);
			
			var easing = $.jCheetah.getValue(
					//The element
					event.currentTarget,
					//The wanted attribute
					"data-animation-easing",
					//The event
					event,
					//The accepted types
					["string"],
					//What would you get by default if the attribute doesn't exist?
					undefined,
					//Allowed results
					undefined);
			
			var queue = $.jCheetah.getValue(
					//The element
					event.currentTarget,
					//The wanted attribute
					"data-animation-queue",
					//The event
					event,
					//The accepted types
					["boolean","string"],
					//What would you get by default if the attribute doesn't exist?
					undefined,
					//Allowed results
					undefined);
			
			var specialEasing = $.jCheetah.getValue(
					//The element
					event.currentTarget,
					//The wanted attribute
					"data-animation-special-easing",
					//The event
					event,
					//The accepted types
					["object"],
					//What would you get by default if the attribute doesn't exist?
					undefined,
					//Allowed results
					undefined);
			
			var step = $.jCheetah.getValue(
					//The element
					event.currentTarget,
					//The wanted attribute
					"data-animation-step",
					//The event
					event,
					//The accepted types
					["function"],
					//What would you get by default if the attribute doesn't exist?
					undefined,
					//Allowed results
					undefined);
			
			var progress = $.jCheetah.getValue(
					//The element
					event.currentTarget,
					//The wanted attribute
					"data-animation-progress",
					//The event
					event,
					//The accepted types
					["function"],
					//What would you get by default if the attribute doesn't exist?
					undefined,
					//Allowed results
					undefined);
			
			var complete = $.jCheetah.getValue(
					//The element
					event.currentTarget,
					//The wanted attribute
					"data-animation-complete",
					//The event
					event,
					//The accepted types
					["function"],
					//What would you get by default if the attribute doesn't exist?
					undefined,
					//Allowed results
					undefined);
			
			var start = $.jCheetah.getValue(
					//The element
					event.currentTarget,
					//The wanted attribute
					"data-animation-start",
					//The event
					event,
					//The accepted types
					["function"],
					//What would you get by default if the attribute doesn't exist?
					undefined,
					//Allowed results
					undefined);
			
			var done = $.jCheetah.getValue(
					//The element
					event.currentTarget,
					//The wanted attribute
					"data-animation-done",
					//The event
					event,
					//The accepted types
					["function"],
					//What would you get by default if the attribute doesn't exist?
					undefined,
					//Allowed results
					undefined);
			
			var fail = $.jCheetah.getValue(
					//The element
					event.currentTarget,
					//The wanted attribute
					"data-animation-fail",
					//The event
					event,
					//The accepted types
					["function"],
					//What would you get by default if the attribute doesn't exist?
					undefined,
					//Allowed results
					undefined);
			
			var always = $.jCheetah.getValue(
					//The element
					event.currentTarget,
					//The wanted attribute
					"data-animation-always",
					//The event
					event,
					//The accepted types
					["function"],
					//What would you get by default if the attribute doesn't exist?
					undefined,
					//Allowed results
					undefined);
			
			if (typeof(setOtherTrigForward) !== "undefined") {
				var $setOtherTrigForward = $(setOtherTrigForward);
				console.debug("ANIMATIONEVENTS: performing +1 on animation-n over",$setOtherTrigForward);
				$setOtherTrigForward.attr("data-animation-n",parseInt($setOtherTrigForward.attr("data-animation-n")) + 1);
			}
			if (typeof(setOtherTrigBackward) !== "undefined") {
				var $setOtherTrigBackward = $(setOtherTrigBackward);
				console.debug("ANIMATIONEVENTS: performing -1 on animation-n over",$setOtherTrigBackward);
				$setOtherTrigBackward.attr("data-animation-n",parseInt($setOtherTrigBackward.attr("data-animation-n")) - 1);
			}
			
			var options = {
					'duration' : duration,
					'easing' : easing,
					'queue' : queue,
					'specialEasing' : specialEasing,
					'step' : step,
					'progress' : progress,
					'complete' : complete,
					'start' : start,
					'done' : done,
					'fail' : fail,
					'always' : always
			}
			
			if (typeof(target) !== "undefined") {
				//We perform the animation, or no animation in the case of toggle
				console.debug("ANIMATIONEVENTS: performing css animation",properties,"over",target);
				
				$(event.currentTarget).attr("data-animation-n",n+1);
				$(target).animate(properties,options);
			}
			
		}
	}
	
	$.jCheetah.modules.animationEvents.load = function(index,element) {
		
		if (typeof(element.attributes['data-animation-events']) !== "undefined") {
			
			var $element = $(element);
			
			if (typeof($element.attr("data-animation-n")) === "undefined") {
				$element.attr("data-animation-n",0);
			}
			if (typeof($element.attr("data-animation-disabled")) === "undefined") {
				$element.attr("data-animation-disabled",0);
			}
			
			var events = $.jCheetah.getValue(
					//The element
					element,
					//The wanted attribute
					"data-animation-events",
					//The event
					undefined,
					//The accepted types
					["string"],
					//What would you get by default if the attribute doesn't exist?
					undefined,
					//Allowed results
					undefined);
			
			if (typeof(events) === "string") {
				console.debug("ANIMATIONEVENTS: Adding css animation event on",events);
				
				$element.bind(events,defaultAnimationEventHandler)
					.attr("data-animation-events-binds",events);
			};
		};
	};
	
	var unload = function(index,element) {
			
		if (typeof(element.attributes["data-animation-events-binds"]) !== "undefined") {
		
			var $element = $(element);
			var binds = $element.attr("data-animation-events-binds");

			console.debug("ANIMATIONEVENTS: Removing css animation event on",binds);
			
			$element.unbind(binds,defaultAnimationEventHandler)
				.removeAttr("data-animation-events-binds");
		};
	};
	
	$.jCheetah.modules.animationEvents.triggers = {};
	$.jCheetah.modules.animationEvents.triggers["data-animation-events"] = {
		change:[unload,$.jCheetah.modules.animationEvents.load],
		remove:unload
	}
	
	$.jCheetah.register([
		"data-animation-events",
		"data-animation-target",
		"data-animation-times",
		"data-animation-set-other-trigger-forward",
		"data-animation-set-other-trigger-backward",
		"data-animation-properties",
		"data-animation-duration",
		"data-animation-easing",
		"data-animation-queue",
		"data-animation-special-easing",
		"data-animation-step",
		"data-animation-progress",
		"data-animation-complete",
		"data-animation-start",
		"data-animation-done",
		"data-animation-fail",
		"data-animation-always",
		"data-animation-n",
		"data-animation-disabled"
	]);
	
})(jQuery);