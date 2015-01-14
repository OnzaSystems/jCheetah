/**
 *  jCheetah class events module
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
	
	$.jCheetah.modules.classEvents = {};
	
	//Get attribute to event object, meaning that those
	//Are the events related to the given class event
	var attrToEvent = {
		"data-add-class-on-click":["click"],
		"data-add-class-on-dblclick":["dblclick"],
		"data-add-class-on-mouseover":["mouseenter","mouseleave"],
		"data-add-class-on-move":["movestart","moveend"],
		"data-add-class-on-resize":["resizestart","resizeend"],
		"data-add-class-on-focus":["focusin","focusout"],
		"data-add-class-on-drag":["dragstart","dragend"],
		"data-add-class-on-play":["play","pause"],
		"data-add-class-on-keypress":["keydown","keyup"],
		"data-add-class-on-mousepress":["mousedown","mouseup"]
	}
	
	var defaultClassEventHandler = function(event) {
		
		var attr = event.data.attr;
		var attr_data = event.data.attr_data;
		
		//Gotta get the classes of the attribute
		var event_class = $.jCheetah.getValue(
				//The element
				event.currentTarget,
				//The wanted attribute
				attr,
				//The event
				event,
				//The accepted types
				["string","object"],
				//What would you get by default if the attribute doesn't exist?
				undefined,
				//Allowed results
				undefined);
		
		//So if we got a string we set it to an object
		if (typeof(event_class) === "string") {
			event_class = {add:event_class,remove:''}
		}
		
		//And if we've got that object we need (it could be undefined)
		if (typeof(event_class) === "object") {
			
			//We check the classes to add
			var classes_to_add = event_class.add;
			//The ones to remove
			var classes_to_remove = event_class.remove;
			//And the status of the attribute
			var status = $(event.currentTarget).attr(attr + "-status");
			
			var _target = $.jCheetah.getSelector(
					//The selector
					event.currentTarget,
					//The wanted attribute
					"data-add-class-target",
					//The event,
					event,
					//What would you get by default if the attribute doesn't exist?
					event.currentTarget);
			
			var _time = $.jCheetah.getValue(
					//The element
					event.currentTarget,
					//The wanted attribute
					"data-add-class-animation-timing",
					//The event
					event,
					//The accepted types
					["number"],
					//What would you get by default if the attribute doesn't exist?
					undefined,
					//Allowed results
					undefined);
			
			var _reversible = $.jCheetah.getValue(
					//The element
					event.currentTarget,
					//The wanted attribute
					"data-add-class-reversible",
					//The event
					event,
					//The accepted types
					["boolean"],
					//What would you get by default if the attribute doesn't exist?
					true,
					//Allowed results
					undefined);
			
			if (typeof(_time) !== "undefined" && 
					typeof($.ui) === "undefined") {
				throw new Error("setting 'data-add-class-animation-timing' requires from jQuery ui");
			}
			
			//if the status is not active
			if (status == "0") {
				
				console.debug("CLASSEVENTS: performing change based on",attr,"to add classes",classes_to_add,"and removing",classes_to_remove,"to",_target,"in time",_time);
				
				//We add stuff, and remove stuff accordingly, and then set the status to active
				$(event.currentTarget).attr(attr + "-status",1);
				if (typeof(_time) !== "undefined") {
					$(_target).switchClass(classes_to_remove,classes_to_add,_time);
				} else {
					$(_target).addClass(classes_to_add).removeClass(classes_to_remove);
				}

			} else if (_reversible) {
				
				//if the data for the second remove event doesn't exist, which means it must be triggered
				//by the same event or if it exists and it's the current event we're going to execute the animation
				if (typeof(attr_data[1])==="undefined" || attr_data[1] == event.type) {
					
					console.debug("CLASSEVENTS: performing change based on",attr,"to remove classes",classes_to_add,"and adding",classes_to_remove,"to",_target,"in time",_time);
				
					//we're going to do it the opposite way, remove the added, and 
					//add the removed
					$(event.currentTarget).attr(attr + "-status",0);
					if (typeof(_time) !== "undefined") {
						$(_target).switchClass(classes_to_add,classes_to_remove,_time);
					} else {
						$(_target).addClass(classes_to_remove).removeClass(classes_to_add);
					}
				}
			};
		};
		
	};
	
	//The jQuery extension to load the classes
	$.jCheetah.modules.classEvents.load = function(index,element){
			
		//And we're gonna loop per attribute
		for (attr in attrToEvent){
			
			//if it exists, then we've got something to bind
			if (typeof(element.attributes[attr]) !== "undefined" &&
				//this is to check that there's not an active class event of the same type
				typeof(element.attributes[attr + "-status"]) === "undefined") {
				
				$element = $(element);
				
				//We get the name of the events
				var events_names = attrToEvent[attr];
				var binds = events_names.join(" ");
				
				$element.attr(attr + "-status","0");
				
				console.debug("CLASSEVENTS: binding events",binds,"according to attr",attr,"to element",element);
				
				//And we bind the function to the default event handler, with its attribute
				$element.bind(binds,{'attr':attr,'attr_data':events_names},
					      defaultClassEventHandler);
			};
		};
	};
	
	//---- jQuery extension
	
	$.fn.jCheetahSwitchClass = function(old_class,new_class) {
		return this.each(function(index,element){
			
			var $element = $(element);
			var to_set = $element.attr("class");
			if (typeof(to_set) !== "undefined") {
				to_set = to_set.replace(old_class,new_class);
				$(element).attr("class",to_set);
			}
		});
	};
	
	//----- triggers
	
	//A default function for removing, (changes do not need to be applied as these are alive attributes)
	var attrremove = function(attr,attrevents,index,element){
		
		if (typeof(element.attributes[attr + "-status"]) !== "undefined") {
			//We unbind the events to the handler
			$(element).unbind(attrevents,defaultClassEventHandler).removeAttr(attr + "-status");
		};
	};
	
	//Gonna create the triggers
	$.jCheetah.modules.classEvents.triggers = {};
	var registers = [];
	for (attr in attrToEvent) {
		$.jCheetah.modules.classEvents.triggers[attr] = {remove:attrremove.bind(null,attr,attrToEvent[attr].join(" "))}
		registers.push(attr);
		registers.push(attr + "-status");
	}
	
	$.jCheetah.register(registers);
	
})(jQuery);