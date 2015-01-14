/**
 *  jCheetah input module
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
	$.jCheetah.modules.input = {};
	$.jCheetah.modules.input.jctypes = {};
	$.jCheetah.modules.input.triggers = {};
	$.jCheetah.modules.input.load = function(index,element) {
		
		if (typeof(element.attributes['data-jctype']) !== "undefined") {
			
			var $element = $(element);
			
			var jctype = $.jCheetah.getValue(
					//The element
					element,
					//The wanted attribute
					"data-jctype",
					//The event
					undefined,
					//The accepted types
					["string"],
					//What would you get by default if the attribute doesn't exist?
					undefined,
					//Allowed results
					undefined);
			
			if (typeof($.jCheetah.modules.input.jctypes[jctype]) === "undefined") {
				throw new Error("Trying to use a jctype of type " + jctype + " but it doesn't exist");
			} else {
				console.debug("INPUT: creating",jctype);
				$.jCheetah.modules.input.jctypes[jctype].load(index,element);
				$element.attr("data-jctype-submod",jctype);
			}
		}
	}
	
	var destroy = function(index,element) {
		var activejctype = $(element).attr("data-jctype-submod");
		if (typeof(activejctype) !== "undefined") {
			console.debug("INPUT: destroying",activejctype);
			$.jCheetah.modules.input.jctypes[activejctype].destroy(index,element);
		}
	}
	
	$.jCheetah.modules.input.triggers["jctype"] = {change:[destroy,$.jCheetah.modules.input.load],remove:destroy}
	
	$.jCheetah.register([
		"data-jctype",
		"data-jctype-method",
		"data-jctype-method-function"
	]);
})(jQuery);
