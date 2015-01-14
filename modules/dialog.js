/**
 *  jCheetah dialog module
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
		console.log("ERROR (dialog): Module can't be loaded: missing jQuery ui");
		return;
	}
	
	$.jCheetah.modules.dialog = {};
	
	$.jCheetah.modules.dialog.load = function(index,element){
		
		if (typeof(element.attributes['data-dialog'])!== "undefined") {
			
			var $element = $(element);
				
			var appendTo = $.jCheetah.getSelector(
					//The selector
					element,
					//The wanted attribute
					"data-dialog-append-to",
					//The event,
					undefined,
					//What would you get by default if the attribute doesn't exist?
					undefined);
				
			var autoOpen = $.jCheetah.getValue(
					//The element
					element,
					//The wanted attribute
					"data-dialog-auto-open",
					//The event
					undefined,
					//The accepted types
					["boolean"],
					//What would you get by default if the attribute doesn't exist?
					false,
					//Allowed results
					undefined);
			
			var buttons = $.jCheetah.getValue(
					//The element
					element,
					//The wanted attribute
					"data-dialog-buttons",
					//The event
					undefined,
					//The accepted types
					["object"],
					//What would you get by default if the attribute doesn't exist?
					{},
					//Allowed results
					undefined);
			
			$.extend(buttons,$.jCheetah.getValue(
					//The element
					element,
					//The wanted attribute
					"data-dialog-button-_*_",
					//The event
					undefined,
					//The accepted types
					["function"],
					//What would you get by default if the attribute doesn't exist?
					{},
					//Allowed results
					undefined));
			
			var closeOnEscape = $.jCheetah.getValue(
					//The element
					element,
					//The wanted attribute
					"data-dialog-close-on-escape",
					//The event
					undefined,
					//The accepted types
					["boolean"],
					//What would you get by default if the attribute doesn't exist?
					undefined,
					//Allowed results
					undefined);
			
			var closeText = $.jCheetah.getValue(
					//The element
					element,
					//The wanted attribute
					"data-dialog-close-text",
					//The event
					undefined,
					//The accepted types
					["string"],
					//What would you get by default if the attribute doesn't exist?
					undefined,
					//Allowed results
					undefined);
				
			var dialogClass = $.jCheetah.getValue(
					//The element
					element,
					//The wanted attribute
					"data-dialog-class",
					//The event
					undefined,
					//The accepted types
					["string"],
					//What would you get by default if the attribute doesn't exist?
					undefined,
					//Allowed results
					undefined);
			
			var draggable = $.jCheetah.getValue(
					//The element
					element,
					//The wanted attribute
					"data-dialog-draggable",
					//The event
					undefined,
					//The accepted types
					["boolean"],
					//What would you get by default if the attribute doesn't exist?
					undefined,
					//Allowed results
					undefined);
			
			var height = $.jCheetah.getValue(
					//The element
					element,
					//The wanted attribute
					"data-dialog-height",
					//The event
					undefined,
					//The accepted types
					["number"],
					//What would you get by default if the attribute doesn't exist?
					undefined,
					//Allowed results
					undefined);
			
			var hide = $.jCheetah.getValue(
					//The element
					element,
					//The wanted attribute
					"data-dialog-hide",
					//The event
					undefined,
					//The accepted types
					["boolean","number","string","object"],
					//What would you get by default if the attribute doesn't exist?
					{effect:"fade",duration:400},
					//Allowed results
					undefined);
			
			var maxHeight = $.jCheetah.getValue(
					//The element
					element,
					//The wanted attribute
					"data-dialog-max-height",
					//The event
					undefined,
					//The accepted types
					["number"],
					//What would you get by default if the attribute doesn't exist?
					undefined,
					//Allowed results
					undefined);
				
			var maxWidth = $.jCheetah.getValue(
					//The element
					element,
					//The wanted attribute
					"data-dialog-max-width",
					//The event
					undefined,
					//The accepted types
					["number"],
					//What would you get by default if the attribute doesn't exist?
					undefined,
					//Allowed results
					undefined);
			
			var minHeight = $.jCheetah.getValue(
					//The element
					element,
					//The wanted attribute
					"data-dialog-min-height",
					//The event
					undefined,
					//The accepted types
					["number"],
					//What would you get by default if the attribute doesn't exist?
					undefined,
					//Allowed results
					undefined);
				
			var minWidth = $.jCheetah.getValue(
					//The element
					element,
					//The wanted attribute
					"data-dialog-min-width",
					//The event
					undefined,
					//The accepted types
					["number"],
					//What would you get by default if the attribute doesn't exist?
					undefined,
					//Allowed results
					undefined);
			
			var modal = $.jCheetah.getValue(
					//The element
					element,
					//The wanted attribute
					"data-dialog-modal",
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
					"data-dialog-position",
					//The event
					undefined,
					//The accepted types
					["object","string","array"],
					//What would you get by default if the attribute doesn't exist?
					undefined,
					//Allowed results
					undefined);
			
			var resizable = $.jCheetah.getValue(
					//The element
					element,
					//The wanted attribute
					"data-dialog-resizable",
					//The event
					undefined,
					//The accepted types
					["boolean"],
					//What would you get by default if the attribute doesn't exist?
					undefined,
					//Allowed results
					undefined);
			
			var show = $.jCheetah.getValue(
					//The element
					element,
					//The wanted attribute
					"data-dialog-show",
					//The event
					undefined,
					//The accepted types
					["boolean","number","string","object"],
					//What would you get by default if the attribute doesn't exist?
					{effect:"fade",duration:400},
					//Allowed results
					undefined);
			
			var title = $.jCheetah.getValue(
					//The element
					element,
					//The wanted attribute
					"data-dialog",
					//The event
					undefined,
					//The accepted types
					["string"],
					//What would you get by default if the attribute doesn't exist?
					undefined,
					//Allowed results
					undefined);
			
			var width = $.jCheetah.getValue(
					//The element
					element,
					//The wanted attribute
					"data-dialog-width",
					//The event
					undefined,
					//The accepted types
					["number"],
					//What would you get by default if the attribute doesn't exist?
					undefined,
					//Allowed results
					undefined);
			
			var AllData = {
					'appendTo' : appendTo,
					'autoOpen' : autoOpen,
					'buttons' : buttons,
					'closeOnEscape' : closeOnEscape,
					'closeText' : closeText,
					'dialogClass' : dialogClass,
					'draggable' : draggable,
					'height' : height,
					'hide' : hide,
					'maxHeight' : maxHeight,
					'maxWidth' : maxWidth,
					'minHeight' : minHeight,
					'minWidth' : minWidth,
					'modal' : modal,
					'position' : position,
					'resizable' : resizable,
					'show' : show,
					'title' : title,
					'width' : width
			};
			
			console.debug("DIALOG: creating dialog with",AllData,"on element",element);
			
			$(element).dialog(AllData).attr("data-is-dialog",1);
		};
	};
	
	$.jCheetah.modules.dialog.triggers = {};
	$.jCheetah.modules.dialog.triggers["data-dialog"] = {
		change : function(index,element,newVal){
			if (typeof(element.attributes["data-is-dialog"]) !== "undefined") {
				$(element).dialog("option","title",newVal);
			} else {
				$.jCheetah.modules.dialog.load(index,element);
			}
		},
		remove:function(index,element){
			if (typeof(element.attributes["data-is-dialog"]) !== "undefined") {
				try {
					var $element = $(element);
					$element.dialog("destroy").removeAttr("data-is-dialog");
				} catch (e) {
				}
			}
		}
	}
	
	var reloadButtons = function(index,element) {
		
		var $element = $(element);
		
		var buttons = $.jCheetah.getValue(
				//The element
				element,
				//The wanted attribute
				"data-dialog-buttons",
				//The event
				undefined,
				//The accepted types
				["object"],
				//What would you get by default if the attribute doesn't exist?
				{},
				//Allowed results
				undefined);
			
		$.extend(buttons,$.jCheetah.getValue(
				//The element
				element,
				//The wanted attribute
				"data-dialog-button-_*_",
				//The event
				undefined,
				//The accepted types
				["function"],
				//What would you get by default if the attribute doesn't exist?
				{},
				//Allowed results
				undefined));
		
		$element.dialog("option","buttons",buttons);
	}
	$.jCheetah.modules.dialog.triggers["data-dialog-buttons"] = {
		change:reloadButtons,
		remove:reloadButtons,
	}
	$.jCheetah.modules.dialog.triggers["data-dialog-button-_*_"] = $.jCheetah.modules.dialog.triggers["data-dialog-buttons"];
	
	//However for the other attributes let's create this structure
	var triggdata = {
		//The name	//the ui option	//the default value
		"data-dialog-append-to":["appendTo","body"],
		"data-dialog-auto-open":["autoOpen",false],
		"data-dialog-close-on-escape":["closeOnEscape",true],
		"data-dialog-close-text":["closeText","close"],
		"data-dialog-class":["dialogClass",""],
		"data-dialog-draggable":["draggable",true],
		"data-dialog-height":["height","auto"],
		"data-dialog-hide":["hide",{effect:"fade",duration:400}],
		"data-dialog-max-height":["maxHeight",false],
		"data-dialog-max-width":["maxWidth",false],
		"data-dialog-min-height":["minHeight",150],
		"data-dialog-min-width":["minWidth",150],
		"data-dialog-modal":["modal",false],
		"data-dialog-position":["position",{ my: "center", at: "center", of: window }],
		"data-dialog-resizable":["resizable",true],
		"data-dialog-show":["show",{effect:"fade",duration:400}],
		"data-dialog-width":["width",300]
	}
	
	//The function for change takes by default (at the end) a new value, so we don't have to use the default
	//Let's only put a uiopt option for the option
	var funcchange = function(uiopt,index,element,newValue){
				if (typeof(element.attributes["data-is-dialog"]) !== "undefined") {
					$(element).dialog("option",uiopt,newValue);
				}
			}
	
	//And the remove, needs the default value, so we need two uiopt and uidefault
	var funcremove = function(uiopt,uidefault,index,element) {
				if (typeof(element.attributes["data-is-dialog"]) !== "undefined") {
					$(element).dialog("option",uiopt,uidefault);
				}
			}
	
	//So per attribute
	for (attr in triggdata) {
	
		//We're going to add a trigger for that attribute
		$.jCheetah.modules.dialog.triggers[attr] = {
			//and replace the uiopt attribute with the option for that ui element
			change: funcchange.bind(null,triggdata[attr][0]),
			//replace the uiopt also but including the default value
			remove: funcremove.bind(null,triggdata[attr][0],triggdata[attr][1])
		};
		
	}
	
	$.jCheetah.register([
		"data-dialog-append-to",
		"data-dialog-auto-open",
		"data-dialog-close-on-escape",
		"data-dialog-close-text",
		"data-dialog-class",
		"data-dialog-draggable",
		"data-dialog-height",
		"data-dialog-hide",
		"data-dialog-max-height",
		"data-dialog-max-width",
		"data-dialog-min-height",
		"data-dialog-min-width",
		"data-dialog-modal",
		"data-dialog-position",
		"data-dialog-resizable",
		"data-dialog-show",
		"data-dialog-width",
		"data-is-dialog"
	]);
	
})(jQuery);