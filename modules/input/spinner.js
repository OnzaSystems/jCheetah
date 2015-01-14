/**
 *  jCheetah spinner sub-module
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
	
	$.jCheetah.modules.input.jctypes.spinner = {};
	
	//---------------------------------------------------------
	
	/**
	 * Allows me to know which sort of input is given
	 */
	var IS_WHAT = function(event){
		var keyCode = ('which' in event) ? event.which : event.keyCode;
		
		isNumeric = (keyCode >= 48 && keyCode <= 57) ||
        (keyCode >= 96 && keyCode <= 105);
		modifiers = (event.altKey || event.ctrlKey || event.shiftKey);
		if (isNumeric && !modifiers){
			return "NUMERIC";
		} else if (keyCode === 32 && !modifiers) {
			return "SPACE";
		} else if (keyCode === 8 && !modifiers) {
			return "ERASE";
		} else if (keyCode === 190 && !modifiers) {
			return "DOT";
		} else if (keyCode === 188 && !modifiers) {
			return "COMMA";
		} else if ((keyCode === 171 || keyCode === 107) && !modifiers) {
			return "SUM";
		} else if ((keyCode === 173 || keyCode === 109) && !modifiers) {
			return "MINUS";
		} else if ((keyCode >= 37 && keyCode <= 40) && !modifiers) {
			return "ARROWS";
		} else {
			return "ELSE";
		};
	};
	
	//---------------------------------------------------------
	
	var defaultSpinnerKeydownHandler = function(event) {
		
		var typeofEvent = IS_WHAT(event);
		if (typeofEvent !== "NUMERIC" && typeofEvent != "DOT" && 
				typeofEvent !== "ERASE" && typeofEvent !== "SUM" &&
				typeofEvent !== "MINUS" && typeofEvent !== "ARROWS") {
			console.debug("INPUT(SPINNER): (keydown handler): input is not allowed for spinner");
			return false;
		};
		
		var $this = $(event.currentTarget);
		var val = $this.val();
		
		if (typeofEvent == "DOT") {
			if (val.indexOf('.') != -1) {
				console.debug("INPUT(SPINNER): (keydown handler): double dot not allowed");
				return false;
			};
		};
		
		var number_type = $.jCheetah.getValue(
				//The element
				event.currentTarget,
				//The wanted attribute
				"data-spinner-type",
				//The event
				event,
				//The accepted types
				["string"],
				//What would you get by default if the attribute doesn't exist?
				"integer",
				//Allowed results
				["integer","float"]);
		
		if (typeofEvent == "DOT" && number_type == "integer") {
			console.debug("INPUT(SPINNER): (keydown handler): input is a dot and number is integer, avoiding event");
			return false;
		};
		
		$this.data('typeofEvent',typeofEvent);
	}
	
	var defaultSpinnerInputHandler = function(event) {
		
		var $curtar = $(event.currentTarget);
		var typeofEvent = $curtar.data('typeofEvent');
		var val = $curtar.val();
		
		if (typeofEvent === "DOT" ||
			typeofEvent === "ARROWS" ||
			typeofEvent === "MINUS" ||
			typeofEvent === "SUM" ||
			(typeofEvent === "NUMERIC" && val.indexOf('0') === (val.length - 1))) {
			console.debug("INPUT(SPINNER): (input handler): input is dot, symbols, arrows or last zero, not parsing");
			return true;
		}
		
		var number_type = $.jCheetah.getValue(
				//The element
				event.currentTarget,
				//The wanted attribute
				"data-spinner-type",
				//The event
				event,
				//The accepted types
				["string"],
				//What would you get by default if the attribute doesn't exist?
				"integer",
				//Allowed results
				["integer","float"]);
		
		var parseFunction = number_type === "integer" ? parseInt : parseFloat;
		var current_value = $curtar.spinner('value');
		var hasdigits = (val.match(/\d/g) !== null);
		if (current_value == null && hasdigits) {
			var nval = parseFunction(val);
			if (!isNaN(nval)) {
				$curtar.spinner("value",nval);
			} else {
				$curtar.spinner("value",0);
			}
			current_value = nval;
		} else if (hasdigits) {
			current_value = parseFunction(current_value);
		}
		
		var min = $curtar.spinner("option","min");
		var max = $curtar.spinner("option","max");
		if (min !== null && current_value < min) {
			console.debug("SPINNER: value is smaller than",min,"truncating");
			$curtar.spinner("value",min);
		} else if (max !== null && current_value > max) {
			console.debug("SPINNER: value is bigger than",max,"truncating");
			$curtar.spinner("value",max);
		}
	};
	
	$.jCheetah.modules.input.jctypes.spinner.load = function(index,element){
				
		console.debug("INPUT(SPINNER): input events: found spinner input",element);
		
		var $element = $(element);
		
		var number_type = $.jCheetah.getValue(
				//The element
				element,
				//The wanted attribute
				"data-spinner-type",
				//The event
				undefined,
				//The accepted types
				["string"],
				//What would you get by default if the attribute doesn't exist?
				"integer",
				//Allowed results
				["integer","float"]);
		
		var number_min = $.jCheetah.getValue(
				//The element
				element,
				//The wanted attribute
				"data-spinner-min",
				//The event
				undefined,
				//The accepted types
				["number"],
				//What would you get by default if the attribute doesn't exist?
				undefined,
				//Allowed results
				undefined);
		
		var number_max = $.jCheetah.getValue(
				//The element
				element,
				//The wanted attribute
				"data-spinner-max",
				//The event
				undefined,
				//The accepted types
				["number"],
				//What would you get by default if the attribute doesn't exist?
				undefined,
				//Allowed results
				undefined);
		
		var number_step = $.jCheetah.getValue(
				//The element
				element,
				//The wanted attribute
				"data-spinner-step",
				//The event
				undefined,
				//The accepted types
				["number"],
				//What would you get by default if the attribute doesn't exist?
				number_type == "float" ? 0.25 : 1,
				//Allowed results
				undefined);
		
		var number_disabled = $.jCheetah.getValue(
				//The element
				element,
				//The wanted attribute
				"data-spinner-disabled",
				//The event
				undefined,
				//The accepted types
				["boolean"],
				//What would you get by default if the attribute doesn't exist?
				false,
				//Allowed results
				undefined);
		
		var number_icons = $.jCheetah.getValue(
				//The element
				element,
				//The wanted attribute
				"data-spinner-icons",
				//The event
				undefined,
				//The accepted types
				["object"],
				//What would you get by default if the attribute doesn't exist?
				undefined,
				//Allowed results
				undefined);
			
		var number_incremental = $.jCheetah.getValue(
				//The element
				element,
				//The wanted attribute
				"data-spinner-incremental",
				//The event
				undefined,
				//The accepted types
				["boolean","function"],
				//What would you get by default if the attribute doesn't exist?
				false,
				//Allowed results
				undefined);
		
		var number_format = $.jCheetah.getValue(
				//The element
				element,
				//The wanted attribute
				"data-spinner-format",
				//The event
				undefined,
				//The accepted types
				["string"],
				//What would you get by default if the attribute doesn't exist?
				undefined,
				//Allowed results
				undefined);
		
		var number_culture = $.jCheetah.getValue(
				//The element
				element,
				//The wanted attribute
				"data-spinner-culture",
				//The event
				undefined,
				//The accepted types
				["string"],
				//What would you get by default if the attribute doesn't exist?
				$.jCheetah.getLang(element),
				//Allowed results
				undefined);
		
		var data = {
			culture : number_culture,
			disabled : number_disabled,
			icons : number_icons,
			incremental : number_incremental,
			max : number_max,
			min : number_min,
			numberFormat : number_format,
			step : number_step
		}
		
		console.debug("INPUT(SPINNER): creating spinner with",data,"over",element);
		$element.spinner(data)
			.bind('keydown',defaultSpinnerKeydownHandler)
			.bind('input',defaultSpinnerInputHandler)
			.attr("data-is-spinner",1)
			.attr('data-jctype-method','value')
			.attr('data-jctype-method-function','spinner');
	};
	
	$.jCheetah.modules.input.jctypes.spinner.destroy = function(index,element){
		if (typeof(element.attributes['is-spinner']) !== "undefined") {
			var $this = $(element);
			try {
				$this.spinner('destroy')
				     .removeAttr('data-jctype-method')
				     .removeAttr('data-jctype-method-function')
				     .unbind('keydown',defaultSpinnerKeydownHandler)
				     .unbind('input',defaultSpinnerInputHandler)
				     .removeAttr("data-is-spinner");
			} catch (err) {
				
			}
		}
	};
	
	$.jCheetah.modules.input.triggers["data-spinner-step"] = {
		change:
		function(index,element,newVal){
			if (typeof(element.attributes["data-is-spinner"]) !== "undefined") {
				$(element).spinner("option","step",newVal)
			}
		},
		remove:
		function(index,element){
			if (typeof(element.attributes["data-is-spinner"]) !== "undefined") {
				
				var $element = $(element);
				
				var number_type = $.jCheetah.getValue(
					//The element
					element,
					//The wanted attribute
					"data-spinner-type",
					//The event
					undefined,
					//The accepted types
					["string"],
					//What would you get by default if the attribute doesn't exist?
					"integer",
					//Allowed results
					["integer","float"]);
				
				$(element).spinner("option","step",number_type == "float" ? 0.25 : 1)
			}
		},
	}
	
	$.jCheetah.modules.input.triggers["data-spinner-type"] = {
		change:
		function(index,element,newVal){
			if (typeof(element.attributes["data-is-spinner"]) !== "undefined") {
				
				var $element = $(element);
				
				if (newVal != "integer" && newVal != "float") {
					$element.attrjCheetah("data-spinner-type","integer")
				} else if (newVal == "integer") {
					
					var current_value = $element.spinner('value');
		
					if (current_value == null) {
						var nval = parseInt(val);
						if (!isNaN(nval)) {
							$element.spinner("value",nval);
						} else {
							$element.spinner("value",0);
						}
						current_value = nval;
					} else {
						$element.spinner("value",parseInt(current_value))
					}
					$element.spinner("option","step",1);
				} else if (newVal == "float") {
					
					var number_step = $.jCheetah.getValue(
						//The element
						element,
						//The wanted attribute
						"data-spinner-step",
						//The event
						undefined,
						//The accepted types
						["number"],
						//What would you get by default if the attribute doesn't exist?
						0.25,
						//Allowed results
						undefined);
					
					$element.spinner("option","step",number_step);
				}
			}
		},
		remove:
		function(index,element){
			if (typeof(element.attributes["data-is-spinner"]) !== "undefined") {
				$(element).attrjCheetah("data-spinner-type","integer")
			}
		},
	}
	
	$.jCheetah.modules.input.triggers["data-spinner-culture"] = {
		change:
		function(index,element,newValue){
				if (typeof(element.attributes["data-is-spinner"]) !== "undefined") {
					$(element).spinner("option","culture",newValue);
				}
			},
		remove:
		function(index,element){
				if (typeof(element.attributes["data-is-spinner"]) !== "undefined") {
					$(element).spinner("option","culture",$.jCheetah.getLang(element));
				}
			}
	}
	
	var triggdata = {
		//The name		      //the ui option		//the default value
		"data-spinner-min":["min",null],
		"data-spinner-max":["max",null],
		"data-spinner-disabled":["disabled",false],
		"data-spinner-icons":["icons",{ down: "ui-icon-triangle-1-s", up: "ui-icon-triangle-1-n" }],
		"data-spinner-incremental":["incremental",true],
		"data-spinner-format":["numberFormat","n"]
	}
	
	//The function for change takes by default (at the end) a new value, so we don't have to use the default
	//Let's only put a uiopt option for the option
	var funcchange = function(uiopt,index,element,newValue){
				if (typeof(element.attributes["data-is-spinner"]) !== "undefined") {
					$(element).spinner("option",uiopt,newValue);
				}
			}
	
	//And the remove, needs the default value, so we need two uiopt and uidefault
	var funcremove = function(uiopt,uidefault,index,element) {
				if (typeof(element.attributes["data-is-spinner"]) !== "undefined") {
					$(element).spinner("option",uiopt,uidefault);
				}
			}
			
	//So per attribute
	for (attr in triggdata) {
	
		//We're going to add a trigger for that attribute
		$.jCheetah.modules.input.triggers[attr] = {
			//and replace the uiopt attribute with the option for that ui element
			change: funcchange.bind(null,triggdata[attr][0]),
			//replace the uiopt also but including the default value
			remove: funcremove.bind(null,triggdata[attr][0],triggdata[attr][1])
		};
		
	};
	
	$.jCheetah.register([
		"data-spinner-type",
		"data-spinner-min",
		"data-spinner-max",
		"data-spinner-disabled",
		"data-spinner-icons",
		"data-spinner-incremental",
		"data-spinner-format",
		"data-spinner-culture",
		"data-spinner-step",
		"data-is-spinner"
	]);
	
	
})(jQuery);