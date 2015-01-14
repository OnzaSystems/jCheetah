/**
 *  jCheetah
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

/**
 *  Includes:
 *  base.js
 *  autocomplete.js
 *  ajax-events.js
 *  animation-events.js
 *  jcevents.js
 *  toggle-events.js
 *  dialog-events.js
 *  ajax.js
 *  input.js
 *  dialog.js
 *  ajax-request-events.js
 *  class-events.js
 *  form-validate-activation.js
 *  datepicker.js
 *  spinner.js
 */(function($){
	$.jCheetah = {};
	$.jCheetah.modules = {};
	$.jCheetah.triggers = {};
	$.jCheetah.attributes = [];
	window.jCheetahDummies = {};
	$.jCheetah.load = function(){
		for (var module in $.jCheetah.modules) {
			for (var trigger in $.jCheetah.modules[module].triggers) {
				if (typeof($.jCheetah.triggers[trigger]) !== "undefined"){
					throw new Error("Trigger for attribute " + trigger + " exists twice or more times");
				}
				$.jCheetah.triggers[trigger] = $.jCheetah.modules[module].triggers[trigger];
			}
		}
		$(document.getElementsByTagName('*')).jCheetahPerformBasics();
	}
	var patternBoolean = /^true|false$/;
	var patternInt = /^[\d\+\-]\d*$/;
	var patternFloat = /^[\d\+\-]\d*.[\d*$]|^[\d\+\-]\d*\./;
	var patternArray = /^\[.*\]$/;
	var patternObject = /^\{.*\}$/;
	var patternString = /^'.*'$|^".*"$/;
	$.jCheetah.parseItem = function(obj,args,element) {
		if (typeof(obj) === "undefined") {
			return undefined;
		}
		if (typeof(obj) !== "string") {
			throw new TypeError("The parameter obj must be of type string"); 
		};
		if (obj === "") {
			return obj;
		};
		if (patternBoolean.test(obj)) {
			return (obj == "true");
		} else if (patternInt.test(obj)) {
			return parseInt(obj);
		} else if (patternFloat.test(obj)) {
			return parseFloat(obj);
		} else if (patternArray.test(obj) || patternObject.test(obj)) {
			var _type = (patternArray.test(obj) ? "array" : "object");
			var _obj;
			try {
				_obj = JSON.parse(obj.replace(/"/g,'\\"').replace(/\\'/,"'").replace(/'/g,'"'));
			} catch (SE) {
				try {
					_obj = JSON.parse(obj);
				} catch (SE2) {
					try {
						_obj = (new Function("","return " + obj).call(element));
					} catch (SE3) {
						var error = (_type == "array") ? 
							"Bad syntax for array " :
							"Bad syntax for object ";
						throw new SyntaxError(error + obj);
					};
				};
			};
			return _obj;
		} else if (patternString.test(obj)) {
			return obj.substr(1,obj.length - 2);
		} else {
			var current_element = window;
			var value_returned_by_function = (obj.indexOf("#") === 0);
			var object_split = (value_returned_by_function ?
					obj.substr(1).split(".") : obj.split("."));
			var object_found = false;
			for (var i = 0;i < object_split.length; i++) {
				if (typeof(current_element) === "undefined") {
					break;
				}
				current_element = current_element[object_split[i]];
				if ((i === (object_split.length - 1)) && 
					typeof(current_element) !== "undefined") {
					object_found = true;
				}
			}
			if (object_found) {
				var _type = typeof(current_element);
				if (_type !== "function" && value_returned_by_function) {
					throw new Error("Error this value is not a function: " +
							obj.substr(1));
				} else if (_type === "function" && value_returned_by_function) {
					return current_element.call(element,args);
				} else {
					return current_element;
				}
			} else {
				try {
					var r_obj_val = (value_returned_by_function ?
						obj.substr(1) : obj)
					current_element = new Function("","return " + r_obj_val).call(element);
					var _type = typeof(current_element);
					if (_type !== "function" && value_returned_by_function) {
						throw new Error("Error this value is not a function: " +
								obj.substr(1));
					} else if (_type === "function" && value_returned_by_function) {
						return current_element.call(element,args);
					} else {
						return current_element;
					}
				} catch (err) {
					console.log("Using as string, cannot parse " + obj + " : " + err);
					return obj;
				};
			};
		};
	};
	$.jCheetah.getValue = function(element,attribute,event,
			arrayAcceptedTypes,_default,_accept_only) {
		if (attribute.indexOf("_*_") !== -1) {
			var obj = {};
			for (var i = 0;i < element.attributes.length;i++) {
				var cur_attr = element.attributes[i];
				var cur_attr_name = cur_attr.name;
				var attribute_cut = attribute.replace("*_","");
				if (cur_attr_name.indexOf(attribute_cut) === 0) {
					var obj_data = cur_attr_name.replace(attribute_cut,"").split("_");
					obj_data.pop();
					var obj_name = obj_data.join(" ");
					var obj_val = $.jCheetah.getValue(
							element,
							cur_attr_name,
							event,
							arrayAcceptedTypes,
							_default,
							_accept_only);
					obj[obj_name] = obj_val;
				};
			};
			return obj;
		}
		var attr_val = (typeof(element.attributes[attribute]) !== "undefined" ? 
				element.attributes[attribute].value : undefined);
		var args = undefined;
		if (typeof(attr_val) === "string" && attr_val.indexOf("#") == 0) {
			var args = {'element':element,
		            'attribute':attribute,
		            'event':event,
		            'acceptedTypes':arrayAcceptedTypes,
		            'acceptOnly' : _accept_only
			}
		}
		var object = $.jCheetah.parseItem(attr_val,args,element);
		var _typeof = typeof(object);
		if (_typeof === "undefined") {
			return _default;
		};
		if (object instanceof Array) {
			_typeof = "array";
		};
		if (typeof(arrayAcceptedTypes) === "undefined" ||
				arrayAcceptedTypes.indexOf(_typeof) >= 0) {
			if (typeof(_accept_only) !== "undefined" && 
					_accept_only.indexOf(object) === -1){
				throw new Error(
						"Attribute '" +
						attribute +
						"' only accepts '" +
						_accept_only.join("/") + 
						"' but '" +
						attr_val +
						"' was given"
					  )
			};
			return object;
		} else {
			throw new TypeError(
					"Attribute '" +
					attribute +
					"' must be of type '" +
					arrayAcceptedTypes.join("/") +
					"' but a type of '" +
					_typeof +
					"' was given: '" +
					object.toString() +
					"'"
				)
		};
	};
	$.jCheetah.getSelector = function(element,attribute,event,_default) {
		var object = $.jCheetah.getValue(
				element,
				attribute,
				event,
				undefined,
				undefined,
				undefined);
		if (typeof(object) === "undefined") {
			return _default;
		};
		if (typeof(object) !== "string"
			&& !object instanceof Array
			&& !object instanceof jQuery
			&& !object instanceof HTMLElement
			&& !object instanceof HTMLCollection) {
			throw new TypeError(
						"Attribute '" +
						attribute +
						"' is a selector so it needs to be one of the following types: '" +
						"string/jQuery/? instanceof HTMLElement/? instanceof HTMLCollection/array" + 
						"' but '" +
						object +
						"' was given which is of type '" +
						_typeof + "'"
					  )
		};
		var selector;
		if (typeof(object) === "string"
			&& (object.indexOf("::") === 0)) {
			functions = object.replace("::","").split("::");
			selector = element;
			for (var i = 0; i < functions.length; i++) {
				var item_data = functions[i].match(/\S+/g);
				var fn_name = item_data[0];
				if (fn_name === "this") {
					selector = element;
				} else {
					var arg = item_data[1];
					selector = $(selector)[fn_name](arg);
				};
			}
		} else {
			selector = object;
		};
		return selector;
	};
	$.jCheetah.register = function(attrs) {
		attrs.forEach(function(attr){
			if ($.jCheetah.attributes.indexOf(attr) === -1) {
				$.jCheetah.attributes.push(attr);
			} else {
				throw new Error("Attribute '" + attr + "' was already registered");
			}
		});
	}
	$.jCheetah.getLang = function(element) {
		var lang = element.attributes["lang"];
		var current_element = element.parentElement;
		while (typeof(lang) === "undefined" && current_element !== null) {
			lang = current_element.attributes["lang"]
			current_element = current_element.parentElement;
		}
		return ((typeof(lang) !== "undefined") ? (lang.value) : undefined);
	}
	$.fn.jCheetahPerformBasics = function(){
		this.each(function(index,element){
			if (element.nodeName !== "SCRIPT" && element.nodeName !== "HEAD" && element.nodeName !== "STYLE" 
				&& element.nodeName !== "HTML" && element.nodeName !== "BODY") {
				var basicsAlreadyLoaded = $(element).data("jcheetahloaded");
				if (typeof(basicsAlreadyLoaded) === "undefined") {
					for (var module in $.jCheetah.modules) {
						try {
							$.jCheetah.modules[module].load(index,element);
						} catch (e) {
							console.log("Can't load module",module,"error thrown:",e.message);
						}
					}
					$(element).data("jcheetahloaded",true);
				};
			};
		});
		return this;
	};
	$.fn.attrjCheetah = function(attr,value) {
		if (typeof(value) === "undefined" && 
				typeof(attr) !== "undefined") {
			return $.jCheetah.getValue(
					this[0],
					attr,
					undefined,
					undefined,
					undefined,
					undefined)
		} else if (typeof(attr) !== "undefined"
			&& typeof(value) !== "undefined") {
			var name = "jCheetahDummy" + Math.random() * 100000000000000000;
			while (window.jCheetahDummies.hasOwnProperty(name)) {
				name = "jCheetahDummy" + Math.random() * 100000000000000000;
			}
			window.jCheetahDummies[name] = value;
			this.attr(attr,"jCheetahDummies." + name);
			var triggers;
			if (attr.indexOf("_") == -1) {
				triggers = $.jCheetah.triggers[attr];
			} else {
				var attr_r_name = attr.split("_")[0];
				triggers = $.jCheetah.triggers[attr_r_name + "_*_"];
			}
			if (typeof(triggers) !== "undefined") {
				var changeTrigger = triggers.change;
				var _typeof_changeTrigger = typeof(changeTrigger);
				if (_typeof_changeTrigger !== "undefined" && 
						_typeof_changeTrigger== "function") {
					this.each(function(index,element){
						changeTrigger(index,element,value)
					});
				} else if (changeTrigger instanceof Array) {
					for (var i = 0;i < changeTrigger.length ; i++) {
						this.each(function(index,element){
							changeTrigger[i](index,element,value)
						})
					}
				};
			};
		};
		return this;
	};
	$.fn.removeAttrjCheetah = function(attr) {
		this.removeAttr(attr);
		var triggers;
		if (attr.indexOf("_") == -1) {
			triggers = $.jCheetah.triggers[attr];
		} else {
			var attr_r_name = attr.split("_")[0];
			triggers = $.jCheetah.triggers[attr_r_name + "_*_"];
		}
		if (typeof(triggers) !== "undefined") {
			var removeTrigger = triggers.remove;
			var _typeof_removeTrigger = typeof(removeTrigger);
			if (_typeof_removeTrigger !== "undefined" && 
					_typeof_removeTrigger == "function") {
				this.each(removeTrigger);
			} else if (removeTrigger instanceof Array) {
				for (var i = 0;i < removeTrigger.length ; i++) {
					this.each(removeTrigger[i]);
				}
			}
		};
		return this;
	};
})(jQuery);/**
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
					element,
					"data-autocomplete-source",
					undefined,
					["string","array","function"],
					undefined,
					undefined);
			var append_to = $.jCheetah.getSelector(
					element,
					"data-autocomplete-append-to",
					undefined,
					undefined);
			var auto_focus = $.jCheetah.getValue(
					element,
					"data-autocomplete-auto-focus",
					undefined,
					["boolean"],
					undefined,
					undefined);
			var delay = $.jCheetah.getValue(
					element,
					"data-autocomplete-delay",
					undefined,
					["number"],
					undefined,
					undefined);
			var disabled = $.jCheetah.getValue(
					element,
					"data-autocomplete-disabled",
					undefined,
					["boolean"],
					undefined,
					undefined);
			var min_len = $.jCheetah.getValue(
					element,
					"data-autocomplete-min-length",
					undefined,
					["boolean"],
					undefined,
					undefined);
			var position = $.jCheetah.getValue(
					element,
					"data-autocomplete-position",
					undefined,
					["object"],
					undefined,
					undefined);
			var data = {'source':autocomplete,
				'appendTo' : append_to,
				'autoFocus' : auto_focus,
				'delay':delay,
				'disabled':disabled,
				'minLength':min_len,
				'position':position};
			$this.autocomplete(data).attr("data-is-autocomplete",1);
		}
	}
	$.jCheetah.modules.autocomplete.triggers = {};
	$.jCheetah.modules.autocomplete.triggers["data-autocomplete-source"] = {
		change:
			function(index,element,newValue){
				if (typeof(element.attributes["data-is-autocomplete"]) !== "undefined") {
					$(element).autocomplete("option","source",newValue);
				} else {
					$.jCheetah.modules.autocomplete.load(index,element);
				}
			},
		remove:
			function(index,element) {
				if (typeof(element.attributes["data-is-autocomplete"]) !== "undefined") {
					$(element).autocomplete('destroy').removeAttr("data-is-autocomplete");
				}
			}
	};
	var triggdata = {
		"data-autocomplete-position":["position",{my:"left top",at:"left bottom",collision:"none"}],
		"data-autocomplete-min-length":["minLength",null],
		"data-autocomplete-disabled":["disabled",false],
		"data-autocomplete-delay":["delay",300],
		"data-autocomplete-auto-focus":["autoFocus",false],
		"data-autocomplete-append-to":["appendTo",null]
	}
	var funcchange = function(uiopt,index,element,newValue){
				if (typeof(element.attributes["data-is-autocomplete"]) !== "undefined") {
					$(element).autocomplete("option",uiopt,newValue);
				}
			}
	var funcremove = function(uiopt,uidefault,index,element) {
				if (typeof(element.attributes["data-is-autocomplete"]) !== "undefined") {
					$(element).autocomplete("option",uiopt,uidefault);
				}
			}
	for (attr in triggdata) {
		$.jCheetah.modules.autocomplete.triggers[attr] = {
			change: funcchange.bind(null,triggdata[attr][0]),
			remove: funcremove.bind(null,triggdata[attr][0],triggdata[attr][1])
		};
	}
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
})(jQuery);/**
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
	var defaultAjaxEventHandler = function(event){
		var ajax_onevent_reload = $.jCheetah.getSelector(
				event.currentTarget,
				"data-ajax-onevent-reload",
				event,
				undefined);
		$(ajax_onevent_reload).each(function(index,element){
			var current_ajax_number_id = $.jCheetah.getValue(
					element,
					"data-ajax-number-id",
					event,
					["number"],
					undefined,
					undefined);
			var current_ajax_filter = $.jCheetah.getValue(
					element,
					"data-ajax-filter",
					event,
					["string"],
					undefined,
					undefined);
			var ajax_number_id_change_method = $.jCheetah.getValue(
					event.currentTarget,
					"data-ajax-number-id-change-method",
					event,
					["string"],
					"sum",
					["sum","set"]);
			var ajax_number_id_change = $.jCheetah.getValue(
					event.currentTarget,
					"data-ajax-number-id-change",
					event,
					["number","function"],
					undefined,
					undefined);
			if (typeof(ajax_number_id_change) === "function") {
				ajax_number_id_change = ajax_number_id_change(current_ajax_number_id,element);
			}
			var ajax_filter_change = $.jCheetah.getValue(
					event.currentTarget,
					"data-ajax-filter-change",
					event,
					["string","function"],
					undefined,
					undefined);
			if (typeof(ajax_filter_change) === "function") {
				ajax_filter_change = ajax_filter_change(current_ajax_filter,element);
			}
			if (typeof(ajax_number_id_change) !== "undefined") {
				if (ajax_number_id_change_method == "set") {
					$(element).attr("data-ajax-number-id",ajax_number_id_change);
				} else if (typeof(current_ajax_number_id) !== "undefined"){
					$(element).attr("data-ajax-number-id",
						current_ajax_number_id + ajax_number_id_change);
				};
			};
			if (typeof(ajax_filter_change) !== "undefined") {
				$(element).attr("ajax-filter","'" + ajax_filter_change + "'");
			};
			$(element).jCheetahLoadAjax();
		});
	};
	$.jCheetah.modules.ajaxEvents.load = function(index,element){
		if (typeof(element.attributes["data-ajax-onevent-reload"]) !== "undefined") {
			$element = $(element);
			var ajax_events = $.jCheetah.getValue(
					element,
					"data-ajax-events",
					undefined,
					["string"],
					"",
					undefined);
			$element.bind(ajax_events,
					defaultAjaxEventHandler);
			$element.attr("data-ajax-events-binds",ajax_events);
		};
	};
	var unload = function(index,element){
		if (typeof(element.attributes["data-ajax-events-binds"]) !== "undefined") {
			var $element = $(element);
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
})(jQuery);/**
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
				event.currentTarget,
				"data-animation-times",
				event,
				["number"],
				undefined,
				undefined);
		var execAnim = true;
		if (disabled) {
			execAnim = false;
		} else if (typeof(times) !== "undefined") {
			if (n >= times) {
				execAnim = false;
			}
		}
		if (execAnim) {
			var target = $.jCheetah.getSelector(
					event.currentTarget,
					"data-animation-target",
					event,
					event.currentTarget);
			var setOtherTrigForward = $.jCheetah.getSelector(
					event.currentTarget,
					"data-animation-set-other-trigger-forward",
					event,
					undefined);
			var setOtherTrigBackward = $.jCheetah.getSelector(
					event.currentTarget,
					"data-animation-set-other-trigger-backward",
					event,
					undefined);
			var properties = $.jCheetah.getValue(
					event.currentTarget,
					"data-animation-properties",
					event,
					["object"],
					{},
					undefined);
			var duration = $.jCheetah.getValue(
					event.currentTarget,
					"data-animation-duration",
					event,
					["number","string"],
					undefined,
					undefined);
			var easing = $.jCheetah.getValue(
					event.currentTarget,
					"data-animation-easing",
					event,
					["string"],
					undefined,
					undefined);
			var queue = $.jCheetah.getValue(
					event.currentTarget,
					"data-animation-queue",
					event,
					["boolean","string"],
					undefined,
					undefined);
			var specialEasing = $.jCheetah.getValue(
					event.currentTarget,
					"data-animation-special-easing",
					event,
					["object"],
					undefined,
					undefined);
			var step = $.jCheetah.getValue(
					event.currentTarget,
					"data-animation-step",
					event,
					["function"],
					undefined,
					undefined);
			var progress = $.jCheetah.getValue(
					event.currentTarget,
					"data-animation-progress",
					event,
					["function"],
					undefined,
					undefined);
			var complete = $.jCheetah.getValue(
					event.currentTarget,
					"data-animation-complete",
					event,
					["function"],
					undefined,
					undefined);
			var start = $.jCheetah.getValue(
					event.currentTarget,
					"data-animation-start",
					event,
					["function"],
					undefined,
					undefined);
			var done = $.jCheetah.getValue(
					event.currentTarget,
					"data-animation-done",
					event,
					["function"],
					undefined,
					undefined);
			var fail = $.jCheetah.getValue(
					event.currentTarget,
					"data-animation-fail",
					event,
					["function"],
					undefined,
					undefined);
			var always = $.jCheetah.getValue(
					event.currentTarget,
					"data-animation-always",
					event,
					["function"],
					undefined,
					undefined);
			if (typeof(setOtherTrigForward) !== "undefined") {
				var $setOtherTrigForward = $(setOtherTrigForward);
				$setOtherTrigForward.attr("data-animation-n",parseInt($setOtherTrigForward.attr("data-animation-n")) + 1);
			}
			if (typeof(setOtherTrigBackward) !== "undefined") {
				var $setOtherTrigBackward = $(setOtherTrigBackward);
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
					element,
					"data-animation-events",
					undefined,
					["string"],
					undefined,
					undefined);
			if (typeof(events) === "string") {
				$element.bind(events,defaultAnimationEventHandler)
					.attr("data-animation-events-binds",events);
			};
		};
	};
	var unload = function(index,element) {
		if (typeof(element.attributes["data-animation-events-binds"]) !== "undefined") {
			var $element = $(element);
			var binds = $element.attr("data-animation-events-binds");
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
})(jQuery);/**
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
				event.currentTarget,
				"data-jcevent-run-times",
				undefined,
				["number"],
				undefined,
				undefined);
		if (typeof(jcevent_run_times) === "undefined" ||
				current_run_times < jcevent_run_times) {
			$element.attr("data-jcevent-n",current_run_times + 1);
			var jctarget = $.jCheetah.getSelector(
					event.currentTarget,
					"data-jcevent-target",
					event,
					event.currentTarget);
			var jcfunction = $.jCheetah.getValue(
					event.currentTarget,
					"data-jcevent-function",
					undefined,
					["string","function"],
					undefined,
					undefined);
			var jcargs = $.jCheetah.getValue(
					event.currentTarget,
					"data-jcevent-args",
					undefined,
					["array"],
					[],
					undefined);
			if (typeof(jcfunction) === "function") {
				var jc_send_event_and_target = $.jCheetah.getValue(
						event.currentTarget,
						"data-jcevent-send-event-and-target",
						undefined,
						["boolean"],
						true,
						undefined);
				var jc_context = $.jCheetah.getValue(
						event.currentTarget,
						"data-jcevent-context",
						undefined,
						undefined,
						event.currentTarget,
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
					element,
					"data-jcevent",
					undefined,
					["string"],
					undefined,
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
})(jQuery);/**
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
		var animation = $.jCheetah.getValue(
				event.currentTarget,
				"data-toggle-animation",
				event,
				["string"],
				"fade",
				["blind","bounce","clip","drop","fade","fold","puff","pulsate",
				 "scale","shake","size","slide","explode"]);
		var target = $.jCheetah.getSelector(
				event.currentTarget,
				"data-toggle-target",
				event,
				event.currentTarget);
		var callback = $.jCheetah.getValue(
				event.currentTarget,
				"data-toggle-callback",
				event,
				["function"],
				undefined,
				undefined);
		var duration = $.jCheetah.getValue(
				event.currentTarget,
				"data-toggle-duration",
				event,
				["number","string"],
				400,
				undefined);
		var options = $.jCheetah.getValue(
				event.currentTarget,
				"data-toggle-options",
				event,
				["object"],
				{},
				undefined);
		var just_show = $.jCheetah.getValue(
				event.currentTarget,
				"data-toggle-just-show",
				event,
				["boolean"],
				false,
				undefined);
		var just_hide = $.jCheetah.getValue(
				event.currentTarget,
				"data-toggle-just-hide",
				event,
				["boolean"],
				false,
				undefined);
		var fn = "toggle";
		if (just_show) {
			fn = "show";
		} else if (just_hide) {
			fn = "hide";
		}
		if (typeof(target) !== "undefined") {
			$(target)[fn](animation,options,duration,callback);
		};
	};
	$.jCheetah.modules.toggleEvents.load = function(index,element) {
		if (typeof(element.attributes["data-toggle-events"]) !== "undefined") {
			var $element = $(element);
			var events = $.jCheetah.getValue(
					element,
					"data-toggle-events",
					undefined,
					["string"],
					undefined,
					undefined);
			if (typeof(events) === "string") {
				$element.bind(events,defaultToggleEventHandler)
					.attr("data-toggle-events-binds",events);
			};
		};
	};
	var unload = function(index,element) {
		if (typeof(element.attributes["data-toggle-events-binds"]) !== "undefined") {
			var $element = $(element);
			var binds = $element.attr("data-toggle-events-binds");
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
})(jQuery);/**
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
				event.currentTarget,
				"data-dialog-target",
				event,
				undefined);
		var action = $.jCheetah.getValue(
				event.currentTarget,
				"data-dialog-action",
				undefined,
				["string"],
				"open",
				undefined);
		$(target).dialog(action);
	}
	$.jCheetah.modules.dialogEvents.load = function(index,element){
		if (typeof(element.attributes['data-dialog-events'])!== "undefined") {
			var $element = $(element);
			var events = $.jCheetah.getValue(
					element,
					"data-dialog-events",
					undefined,
					["string"],
					undefined,
					undefined);
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
(function($){
	$.jCheetah.modules.ajax = {};
	var escapers = [/\&/g,/</g,/>/g,/"/g,/\{\{/g,/\}\}/g]
	var valEscape = function(item) {
		return item
		.replace(escapers[0],"&damp;")
		.replace(escapers[1],'&dlt;')
		.replace(escapers[2],'&dgt;')
		.replace(escapers[3],"&dquot;")
		.replace(escapers[4],"<")
		.replace(escapers[5],">");
	}
	var unescapers = [/\&dlt;/g,/\&dgt;/g,/\&dquot;/g,/\&damp;/g]
	var valUnescape = function(item) {
		return item
		.replace(unescapers[0],'<')
		.replace(unescapers[1],'>')
		.replace(unescapers[2],"\"")
		.replace(unescapers[3],"&")
	}
	var encoders = [/\>/g,/\</g,/\>\=/g,/\<\=/g,/\=\=/g,/\!\=/g,/"/g]
	var valEncode = function(item) {
		return item
		.replace(encoders[0],'%gt;')
		.replace(encoders[1],'%lt;')
		.replace(encoders[2],'%ge;')
		.replace(encoders[3],'%le;')
		.replace(encoders[4],'%eq;')
		.replace(encoders[5],'%ne;')
		.replace(encoders[6],'%quot;');
	}
	var decoders = [/%gt;/g,/%lt;/g,/%ge;/g,/%le;/g,/%eq;/g,/%ne;/g,/%quot;/g]
	var valDecode = function(item) {
		return item
		.replace(decoders[0],'>')
		.replace(decoders[1],'<')
		.replace(decoders[2],'>=')
		.replace(decoders[3],'<=')
		.replace(decoders[4],'==')
		.replace(decoders[5],'!=')
		.replace(decoders[6],'"');
	}
	/** Dummy function to get the value of a given string */
	var getVal = function(object,item,object_name) {
		if (typeof(item) === "undefined") {
			return undefined;
		};
		var decoded_val = valDecode(item);
		var outitem = new Function("return (" + decoded_val + ")").call(window);
		return outitem;
	};
	var ajaxDesignerRegs = [/\{\{ +/g,/ +\}\}/g,/\{\{end/gi,/\{\{%/g,/%\}\}/g,/\{\{[a-z|A-Z].+?\}\}/g,
		/\{\{if +/gi,/\}\}/g,/\{\{out +/gi,/\{\{foreach +/gi
	]
	var ajaxDesigner = function(object,structure,object_name,is_child) {
		if (typeof(is_child) === "undefined") {
			var _prev_obj = window[object_name];
			window[object_name] = object;
		}
		var out_struct = new String();
		var html = structure;
		if (typeof(structure) === "string") {
			var prepared = structure
			.replace(ajaxDesignerRegs[0],'{{').replace(ajaxDesignerRegs[1],'}}')
			.replace(ajaxDesignerRegs[2],"{{/")
			.replace(ajaxDesignerRegs[3],"{{out ").replace(ajaxDesignerRegs[4],"}}{{/out}}");
			var matches = prepared.match(ajaxDesignerRegs[5]);
			if (matches !== null) {
				matches.forEach(function(dtag){
					var dtagparsed;
					if (dtag.search(ajaxDesignerRegs[6]) == 0) {
						var test = valEncode(dtag.replace(ajaxDesignerRegs[6],"").replace(ajaxDesignerRegs[7],""));
						if (test.length == 0) {
							throw new SyntaxError("Wrong designer syntax in " + dtag);
							return;
						}
						dtagparsed = "{{if test='" + test + "'}}";
					} else if (dtag.search(ajaxDesignerRegs[8]) == 0) {
						var value = valEncode(dtag.replace(ajaxDesignerRegs[8],"").replace(ajaxDesignerRegs[7],""));
						if (value.length == 0) {
							throw new SyntaxError("Wrong designer syntax in {{% %}}");
							return;
						}
						dtagparsed = "{{out value='" + value + "'}}";
					} else if (dtag.search(ajaxDesignerRegs[9]) == 0) {
						var data = dtag.replace(ajaxDesignerRegs[9],"").replace(ajaxDesignerRegs[7],"");
						try {
							var as_split = data.split("as");
							var keyval = as_split.pop();
							var items = valEncode(as_split.join("as").trim());
							var keyvalsplitted = keyval.split("=>");
							var key = keyvalsplitted[0].trim();
							var val = keyvalsplitted[1].trim();
						} catch (e) {
							throw new SyntaxError("Wrong designer syntax in " + dtag);
							return;
						}
						dtagparsed = "{{foreach items='" + items + "' key='" + key + "' val='" + val + "'}}";
					} else {
						throw new SyntaxError("Unknown tag style " + dtag);
					}
					prepared = prepared.replace(dtag,dtagparsed);
				});
			}
			var escaped = valEscape(prepared);
			html = $.parseHTML(escaped);
		}
		if (html !== null) {
			for (var i = 0; i < html.length ; i++) {
				var element = html[i];
				var tagName = html[i].nodeName;
				var attributes = html[i].attributes;
				var contents = html[i].childNodes;
				if (tagName == "OUT") {
					var value;
				    if (typeof(attributes['value']) !== "undefined") {
					  var value = getVal(object,attributes['value'].value,object_name);
					}
					if (typeof(value) !== "undefined") {
						out_struct += value;
					};
				} else if (tagName == "IF") {
					var condition = attributes['test'].value;
					var _prev_obj = window[object_name];
					window[object_name] = object;
					var condition_val = getVal(object,condition,object_name);
					delete window[object_name];
					window[object_name] = _prev_obj;
					if (condition_val) {
						out_struct += ajaxDesigner(object,contents,object_name,true);
					};
				} else if (tagName == "FOREACH") {
					var key = attributes['key'].value;
					var val = attributes['val'].value;
					var items = getVal(object,attributes['items'].value,object_name);
					var _prev_key;
					if (typeof(key) !== "undefined" && key != "") {
						_prev_key = window[key];
					}
					var _prev_val;
					if (typeof(val) !== "undefined" && val != "") {
						_prev_val = window[val];
					}
					$.each(items,function(_key,_val){
						if (typeof(key) !== "undefined" && key != "") {
							window[key] = _key;
						}
						if (typeof(val) !== "undefined" && val != "") {
							window[val] = _val;
						}
						out_struct += ajaxDesigner(object,contents,object_name,true);
					});
					if (typeof(key) !== "undefined" && key != "") {
						delete window[key];
						window[key] = _prev_key;
					}
					if (typeof(val) !== "undefined" && val != "") {
						delete window[val];
						window[val] = _prev_val;
					}
				} else if (element instanceof Text){
					out_struct += element.data;
				} else {
					throw new Error("unknown designer tag: " + element.tagName);
				};
			};
			if (typeof(is_child) === "boolean" && is_child) {
				return out_struct;
			} else {
				return valUnescape(out_struct);
				delete window[object_name];
				window[object_name] = _prev_obj;
			}
		};
		return "";
	};
	$.jCheetah.modules.ajax.load = function(index,element) {
		if (typeof(element.attributes['data-ajax-load']) !== "undefined") {
			var $this = $(element);
			var ajax_avoid_first_loads = $.jCheetah.getValue(
					element,
					"data-ajax-avoid-first-loads",
					undefined,
					["number"],
					undefined,
					undefined);
			var performLoad = true;
			if (typeof(ajax_avoid_first_loads) !== "undefined") {
				var current_number = $this.attr("data-ajax-n");
				if (typeof(current_number) === "undefined") {
					current_number = 0;
				}
				if (parseInt(current_number) < ajax_avoid_first_loads) {
					$this.attr("data-ajax-n",parseInt(current_number) + 1);
						performLoad = false;
				};
			};
			if (performLoad) {
				var ajax_load = $.jCheetah.getValue(
						element,
						"data-ajax-load",
						undefined,
						["string"],
						"",
						undefined).replace(/::hash::/g,location.hash.replace("#",""));
				var ajax_datatype = $.jCheetah.getValue(
						element,
						"data-ajax-datatype",
						undefined,
						["string"],
						"html",
						["json","xml","html","csv"]);
				var ajax_designer = $.jCheetah.getValue(
						element,
						"data-ajax-designer",
						undefined,
						["string"],
						undefined,
						undefined);
				var ajax_method = $.jCheetah.getValue(
						element,
						"data-ajax-method",
						undefined,
						["string"],
						"get",
						["get","post"]);
				var ajax_data = $.jCheetah.getValue(
						element,
						"data-ajax-query",
						undefined,
						["object"],
						{},
						undefined);
				$.extend(ajax_data,$.jCheetah.getValue(
						element,
						"data-ajax-query-_*_",
						undefined,
						undefined,
						{},
						undefined));
				var ajax_send_lang = $.jCheetah.getValue(
						element,
						"data-ajax-send-lang",
						undefined,
						["boolean"],
						false,
						undefined)
				if (ajax_send_lang) {
					var lang = $.jCheetah.getLang(element);
					if (typeof(lang) !== "undefined") {
						ajax_data["lang"] = lang;
					}
				}
				var ajax_number_id = $.jCheetah.getValue(
						element,
						"data-ajax-number-id",
						undefined,
						["number"],
						undefined,
						undefined);
				if (typeof(ajax_number_id) !== "undefined") {
					ajax_data.id = ajax_number_id;
				};
				var ajax_filter = $.jCheetah.getValue(
						element,
						"data-ajax-filter",
						undefined,
						["string"],
						undefined,
						undefined);
				if (typeof(ajax_filter) !== "undefined") {
					ajax_data.filter = ajax_filter;
				};
				var ajax_onload_done = $.jCheetah.getValue(
						element,
						"data-ajax-onload-done",
						undefined,
						["function"],
						undefined,
						undefined);
				var ajax_onload_fail = $.jCheetah.getValue(
						element,
						"data-ajax-onload-fail",
						undefined,
						["function"],
						undefined,
						undefined);
				var ajax_onload_always = $.jCheetah.getValue(
						element,
						"data-ajax-onload-always",
						undefined,
						["function"],
						undefined,
						undefined);
				var ajax_onload_reload = $.jCheetah.getSelector(
						element,
						"data-ajax-onload-reload",
						undefined,
						undefined);
				var ajax_input_group = $.jCheetah.getSelector(
						element,
						"data-ajax-input-group",
						undefined,
						undefined);
				if (typeof(ajax_input_group) !== "undefined") {
					$(ajax_input_group).each(function(index,ielement){
						var $element = $(ielement);
						var name = $element.attr("name");
						var val;
						if ($element.attr("type") == "checkbox" ||
								$element.attr("type") == "radio") {
							if ($element.is(":checked")) {
								val = $element.val();
								if (typeof(val) === "undefined") {
									val = "";
								};
							};
						} else {
							var retrieve_method = $element.attr('data-jctype-method');
							var retrieve_method_function = $element.attr('data-jctype-method-function');
							var is_jctype = typeof($element.attr('data-jctype')) !== 'undefined'
							if (typeof(retrieve_method) !== 'undefined' &&
							    typeof(retrieve_method_function) !== 'undefined' &&
							    is_jctype) {
								val = $element[retrieve_method_function](retrieve_method);
							} else {
								val = $element.val();
							}
						}
						if (typeof(name) !== "undefined" &&
								typeof(val) !== "undefined") {
							ajax_data[name] = val;
						};
					});
				};
				$[ajax_method](ajax_load,ajax_data,function(response,status,xhr) {
					var currentn = $this.attr("data-ajax-n");
					if (typeof(currentn) === "undefined") {
						$this.attr("data-ajax-n",1);
					} else {
						$this.attr("data-ajax-n",parseInt(currentn) + 1);
					}
					if (ajax_datatype === "html") {
						$this.html(response);
					} else if (ajax_datatype == "json" || ajax_datatype == "xml" ||
							ajax_datatype == "csv") {
						if (typeof(ajax_designer) === "undefined") {
							throw new Error("Setting 'data-ajax-datatype' requires from 'data-ajax-designer' to be set");
						};
						var new_inner_html;
						if (ajax_datatype == "csv") {
							if (typeof($.csv) === "undefined") {
								throw new Error("Setting data-ajax-datatype='csv' needs from jQuery csv");
							};
							new_inner_html = ajaxDesigner(
									$.csv.toArrays(response),
									ajax_designer,ajax_datatype);
						} else {
							new_inner_html = ajaxDesigner(response,
									ajax_designer,ajax_datatype);
						};
						$this.html(new_inner_html);
					};
					$this.find('*').jCheetahPerformBasics();
					if (typeof(ajax_onload_reload) !== "undefined") {
						$(ajax_onload_reload).jCheetahLoadAjax();
					}
				},ajax_datatype == "csv" ? "text" : ajax_datatype)
					.done(ajax_onload_done)
					.fail(ajax_onload_fail)
					.always(ajax_onload_always);
				};
			};
	};
	$.fn.jCheetahLoadAjax = function() {
		return this.each($.jCheetah.modules.ajax.load);
	}
	$.jCheetah.modules.ajax.triggers = {};
	$.jCheetah.modules.ajax.triggers["data-ajax-load"] = {change:$.jCheetah.modules.ajax.load};
	$.jCheetah.register([
		"data-ajax-load",
		"data-ajax-method",
		"data-ajax-query",
		"data-ajax-query-_*_",
		"data-ajax-number-id",
		"data-ajax-filter",
		"data-ajax-onload-done",
		"data-ajax-onload-fail",
		"data-ajax-onload-always",
		"data-ajax-onload-reload",
		"data-ajax-input-group",
		"data-ajax-datatype",
		"data-ajax-designer",
		"data-ajax-avoid-first-loads",
		"data-ajax-n"
	]);
})(jQuery);/**
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
					element,
					"data-jctype",
					undefined,
					["string"],
					undefined,
					undefined);
			if (typeof($.jCheetah.modules.input.jctypes[jctype]) === "undefined") {
				throw new Error("Trying to use a jctype of type " + jctype + " but it doesn't exist");
			} else {
				$.jCheetah.modules.input.jctypes[jctype].load(index,element);
				$element.attr("data-jctype-submod",jctype);
			}
		}
	}
	var destroy = function(index,element) {
		var activejctype = $(element).attr("data-jctype-submod");
		if (typeof(activejctype) !== "undefined") {
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
					element,
					"data-dialog-append-to",
					undefined,
					undefined);
			var autoOpen = $.jCheetah.getValue(
					element,
					"data-dialog-auto-open",
					undefined,
					["boolean"],
					false,
					undefined);
			var buttons = $.jCheetah.getValue(
					element,
					"data-dialog-buttons",
					undefined,
					["object"],
					{},
					undefined);
			$.extend(buttons,$.jCheetah.getValue(
					element,
					"data-dialog-button-_*_",
					undefined,
					["function"],
					{},
					undefined));
			var closeOnEscape = $.jCheetah.getValue(
					element,
					"data-dialog-close-on-escape",
					undefined,
					["boolean"],
					undefined,
					undefined);
			var closeText = $.jCheetah.getValue(
					element,
					"data-dialog-close-text",
					undefined,
					["string"],
					undefined,
					undefined);
			var dialogClass = $.jCheetah.getValue(
					element,
					"data-dialog-class",
					undefined,
					["string"],
					undefined,
					undefined);
			var draggable = $.jCheetah.getValue(
					element,
					"data-dialog-draggable",
					undefined,
					["boolean"],
					undefined,
					undefined);
			var height = $.jCheetah.getValue(
					element,
					"data-dialog-height",
					undefined,
					["number"],
					undefined,
					undefined);
			var hide = $.jCheetah.getValue(
					element,
					"data-dialog-hide",
					undefined,
					["boolean","number","string","object"],
					{effect:"fade",duration:400},
					undefined);
			var maxHeight = $.jCheetah.getValue(
					element,
					"data-dialog-max-height",
					undefined,
					["number"],
					undefined,
					undefined);
			var maxWidth = $.jCheetah.getValue(
					element,
					"data-dialog-max-width",
					undefined,
					["number"],
					undefined,
					undefined);
			var minHeight = $.jCheetah.getValue(
					element,
					"data-dialog-min-height",
					undefined,
					["number"],
					undefined,
					undefined);
			var minWidth = $.jCheetah.getValue(
					element,
					"data-dialog-min-width",
					undefined,
					["number"],
					undefined,
					undefined);
			var modal = $.jCheetah.getValue(
					element,
					"data-dialog-modal",
					undefined,
					["boolean"],
					undefined,
					undefined);
			var position = $.jCheetah.getValue(
					element,
					"data-dialog-position",
					undefined,
					["object","string","array"],
					undefined,
					undefined);
			var resizable = $.jCheetah.getValue(
					element,
					"data-dialog-resizable",
					undefined,
					["boolean"],
					undefined,
					undefined);
			var show = $.jCheetah.getValue(
					element,
					"data-dialog-show",
					undefined,
					["boolean","number","string","object"],
					{effect:"fade",duration:400},
					undefined);
			var title = $.jCheetah.getValue(
					element,
					"data-dialog",
					undefined,
					["string"],
					undefined,
					undefined);
			var width = $.jCheetah.getValue(
					element,
					"data-dialog-width",
					undefined,
					["number"],
					undefined,
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
				element,
				"data-dialog-buttons",
				undefined,
				["object"],
				{},
				undefined);
		$.extend(buttons,$.jCheetah.getValue(
				element,
				"data-dialog-button-_*_",
				undefined,
				["function"],
				{},
				undefined));
		$element.dialog("option","buttons",buttons);
	}
	$.jCheetah.modules.dialog.triggers["data-dialog-buttons"] = {
		change:reloadButtons,
		remove:reloadButtons,
	}
	$.jCheetah.modules.dialog.triggers["data-dialog-button-_*_"] = $.jCheetah.modules.dialog.triggers["data-dialog-buttons"];
	var triggdata = {
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
	var funcchange = function(uiopt,index,element,newValue){
				if (typeof(element.attributes["data-is-dialog"]) !== "undefined") {
					$(element).dialog("option",uiopt,newValue);
				}
			}
	var funcremove = function(uiopt,uidefault,index,element) {
				if (typeof(element.attributes["data-is-dialog"]) !== "undefined") {
					$(element).dialog("option",uiopt,uidefault);
				}
			}
	for (attr in triggdata) {
		$.jCheetah.modules.dialog.triggers[attr] = {
			change: funcchange.bind(null,triggdata[attr][0]),
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
})(jQuery);/**
 *  jCheetah ajax request events module
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
	$.jCheetah.modules.ajaxRequestEvents = {};
	var defaultAjaxRequestEventHandler = function(event){
		var ajax_request_type = $.jCheetah.getValue(
				event.currentTarget,
				"data-ajax-request-type",
				event,
				["string"],
				"get",
				["get","post"]);
		var ajax_request_url = $.jCheetah.getValue(
				event.currentTarget,
				"data-ajax-request-url",
				event,
				["string"],
				undefined,
				undefined);
		if (typeof(ajax_request_url) === "undefined") {
			throw new Error("Setting 'data-ajax-request-on-events' requires 'data-ajax-request-url' to be set");
		}
		ajax_request_url.replace(/::hash::/g,location.hash.replace("#",""));
		var ajax_data =  $.jCheetah.getValue(
				event.currentTarget,
				"data-ajax-request-data-query",
				event,
				["object"],
				{},
				undefined);
		$.extend(ajax_data,$.jCheetah.getValue(
				event.currentTarget,
				"data-ajax-request-data-query-_*_",
				undefined,
				undefined,
				{},
				undefined));
		var ajax_request_send_lang = $.jCheetah.getValue(
				event.currentTarget,
				"data-ajax-request-send-lang",
				undefined,
				["boolean"],
				false,
				undefined)
		if (ajax_request_send_lang) {
			var lang = $.jCheetah.getLang(event.currentTarget);
			if (typeof(lang) !== "undefined") {
				ajax_data["lang"] = lang;
			}
		}
		var ajax_request_input_group = $.jCheetah.getSelector(
				event.currentTarget,
				"data-ajax-request-input-group",
				event,
				undefined);
		if (typeof(ajax_request_input_group) !== "undefined") {
			$(ajax_request_input_group).each(function(item,element){
				var $element = $(element);
				var name = $element.attr("name");
				var val;
				if ($element.attr("type") == "checkbox" ||
						$element.attr("type") == "radio") {
					if ($(element).is(":checked")) {
						val = $element.val();
						if (typeof(val) === "undefined") {
							val = "";
						};
					};
				} else {
					var retrieve_method = $element.attr('data-jctype-method');
					var retrieve_method_function = $element.attr('data-jctype-method-function');
					var is_jctype = typeof($element.attr('data-jctype')) !== 'undefined'
					if (typeof(retrieve_method) !== 'undefined' &&
					    typeof(retrieve_method_function) !== 'undefined' &&
					    is_jctype) {
						val = $element[retrieve_method_function](retrieve_method);
					} else {
						val = $element.val();
					}
				}
				if (typeof(name) !== "undefined" &&
						typeof(val) !== "undefined") {
					ajax_data[name] = val;
				};
			});
		};
		var ajax_request_username = $.jCheetah.getValue(
				event.currentTarget,
				"data-ajax-request-username",
				event,
				["string"],
				undefined,
				undefined);
		var ajax_request_password = $.jCheetah.getValue(
				event.currentTarget,
				"data-ajax-request-password",
				event,
				["string"],
				undefined,
				undefined);
		var ajax_request_datatype = $.jCheetah.getValue(
				event.currentTarget,
				"data-ajax-request-datatype",
				event,
				["string"],
				undefined,
				undefined);
		var ajax_request_timeout = $.jCheetah.getValue(
				event.currentTarget,
				"data-ajax-request-timeout",
				event,
				["number"],
				undefined,
				undefined);
		var ajax_request_cross_domain = $.jCheetah.getValue(
				event.currentTarget,
				"data-ajax-request-cross-domain",
				event,
				["boolean"],
				false,
				undefined);
		var ajax_request_global = $.jCheetah.getValue(
				event.currentTarget,
				"data-ajax-request-global",
				event,
				["boolean"],
				true,
				undefined);
		var ajax_request_headers = $.jCheetah.getValue(
				event.currentTarget,
				"data-ajax-request-headers",
				event,
				["object"],
				undefined,
				undefined);
		var ajax_request_if_modified = $.jCheetah.getValue(
				event.currentTarget,
				"data-ajax-request-if-modified",
				event,
				["boolean"],
				false,
				undefined);
		var ajax_request_beforesend = $.jCheetah.getValue(
				event.currentTarget,
				"data-ajax-request-beforesend",
				event,
				["function"],
				undefined,
				undefined);
		var ajax_request_success = $.jCheetah.getValue(
				event.currentTarget,
				"data-ajax-request-success",
				event,
				["function"],
				undefined,
				undefined);
		var ajax_request_error = $.jCheetah.getValue(
				event.currentTarget,
				"data-ajax-request-error",
				event,
				["function"],
				undefined,
				undefined);
		var ajax_request_complete = $.jCheetah.getValue(
				event.currentTarget,
				"data-ajax-request-complete",
				event,
				["function"],
				undefined,
				undefined);
		var ajax_request_is_local = $.jCheetah.getValue(
				event.currentTarget,
				"data-ajax-request-is-local",
				event,
				["boolean"],
				undefined,
				undefined);
		var ajax_request_data_filter = $.jCheetah.getValue(
				event.currentTarget,
				"data-ajax-request-data-filter",
				event,
				["function"],
				undefined,
				undefined);
		var ajax_request_jsonp = $.jCheetah.getValue(
				event.currentTarget,
				"data-ajax-request-jsonp",
				event,
				["string"],
				undefined,
				undefined);
		var ajax_request_jsonp_callback = $.jCheetah.getValue(
				event.currentTarget,
				"data-ajax-request-jsonp-callback",
				event,
				["string","function"],
				undefined,
				undefined);
		var ajax_request_accepts = $.jCheetah.getValue(
				event.currentTarget,
				"data-ajax-request-accepts",
				event,
				["object"],
				undefined,
				undefined);
		var ajax_request_async = $.jCheetah.getValue(
				event.currentTarget,
				"data-ajax-request-async",
				event,
				["boolean"],
				undefined,
				undefined);
		var ajax_request_cache = $.jCheetah.getValue(
				event.currentTarget,
				"data-ajax-request-cache",
				event,
				["boolean"],
				undefined,
				undefined);
		var ajax_request_content_type = $.jCheetah.getValue(
				event.currentTarget,
				"data-ajax-request-content-type",
				event,
				["boolean"],
				undefined,
				undefined);
		var ajax_request_converters = $.jCheetah.getValue(
				event.currentTarget,
				"data-ajax-request-converters",
				event,
				["object"],
				undefined,
				undefined);
		var ajax_request_context = $.jCheetah.getValue(
				event.currentTarget,
				"data-ajax-request-context",
				event,
				["object"],
				undefined,
				undefined);
		var ajax_request_mime_type = $.jCheetah.getValue(
				event.currentTarget,
				"data-ajax-request-mime-type",
				event,
				["string"],
				undefined,
				undefined);
		var ajax_request_process_data = $.jCheetah.getValue(
				event.currentTarget,
				"data-ajax-request-process-data",
				event,
				["boolean"],
				undefined,
				undefined);
		var ajax_request_script_charset = $.jCheetah.getValue(
				event.currentTarget,
				"data-ajax-request-script-charset",
				event,
				["string"],
				undefined,
				undefined);
		var ajax_request_status_code = $.jCheetah.getValue(
				event.currentTarget,
				"data-ajax-request-status-code",
				event,
				["object"],
				undefined,
				undefined);
		var ajax_request_traditional = $.jCheetah.getValue(
				event.currentTarget,
				"data-ajax-request-traditional",
				event,
				["boolean"],
				undefined,
				undefined);
		var ajax_request_xhr = $.jCheetah.getValue(
				event.currentTarget,
				"data-ajax-request-xhr",
				event,
				["function"],
				undefined,
				undefined);
		var ajax_request_xhr_fields = $.jCheetah.getValue(
				event.currentTarget,
				"data-ajax-request-xhr-fields",
				event,
				["object"],
				undefined,
				undefined);
		var ajax_request_on_ = $.jCheetah.getValue(
				event.currentTarget,
				"data-ajax-request-on-_*_",
				event,
				["function"],
				{},
				undefined);
		$.ajax({
			type : ajax_request_type,
			url : ajax_request_url,
			data : ajax_data,
			dataType : ajax_request_datatype,
			username : ajax_request_username,
			password : ajax_request_password,
			timeout : ajax_request_timeout,
			success : ajax_request_success,
			error : ajax_request_error,
			complete : ajax_request_complete,
			beforeSend : ajax_request_beforesend,
			crossDomain : ajax_request_cross_domain,
			headers : ajax_request_headers,
			global : ajax_request_global,
			ifModified : ajax_request_if_modified,
			isLocal : ajax_request_is_local,
			dataFilter : ajax_request_data_filter,
			jsonp : ajax_request_jsonp,
			jsonpCallback : ajax_request_jsonp_callback,
			accepts : ajax_request_accepts,
			async : ajax_request_async,
			cache : ajax_request_cache,
			contentType : ajax_request_content_type,
			converters : ajax_request_converters,
			context : ajax_request_context,
			mimeType : ajax_request_mime_type,
			processData : ajax_request_process_data,
			scriptCharset : ajax_request_script_charset,
			statusCode : ajax_request_status_code,
			traditional : ajax_request_traditional,
			xhr : ajax_request_xhr,
			xhrFields : ajax_request_xhr_fields
		}).then(function(data,textStatus,jqXHR){
			var stringStatus = jqXHR.status.toString();
			if (typeof(ajax_request_on_[stringStatus]) === "function") {
				ajax_request_on_[stringStatus](textStatus);
			}
		},function(jqXHR,textStatus,errorThrown){
			var stringStatus = jqXHR.status.toString();
			if (typeof(ajax_request_on_[stringStatus]) === "function") {
				ajax_request_on_[stringStatus](textStatus);
			}
		});
	};
	$.jCheetah.modules.ajaxRequestEvents.load = function(index,element){
		if (typeof(element.attributes["data-ajax-request-on-events"]) !== "undefined") {
			var $element = $(element);
			var ajax_request_on_events = $.jCheetah.getValue(
					element,
					"data-ajax-request-on-events",
					undefined,
					["string"],
					undefined,
					undefined);
			$element.bind(ajax_request_on_events,defaultAjaxRequestEventHandler)
				.attr("data-ajax-requests-events-binds",ajax_request_on_events);
		};
	};
	var unload  = function(index,element) {
		if (typeof(element.attributes["data-ajax-requests-events-binds"]) !== "undefined") {
			var $element = $(element);
			var binds = $element.attr("data-ajax-requests-events-binds");
			if (typeof(binds) !== "undefined") {
				$element.unbind(binds,defaultAjaxRequestEventHandler)
					.removeAttr("data-ajax-requests-events-binds");
			};
		};
	};
	$.jCheetah.modules.ajaxRequestEvents.triggers = {};
	$.jCheetah.modules.ajaxRequestEvents.triggers["data-ajax-request-on-events"] = {
		change:[unload,$.jCheetah.modules.ajaxRequestEvents.load],
		remove : unload
	};
	$.jCheetah.register([
		"data-ajax-request-on-events",
		"data-ajax-request-type",
		"data-ajax-request-url",
		"data-ajax-request-data-query",
		"data-ajax-request-data-query-_*_",
		"data-ajax-request-input-group",
		"data-ajax-request-username",
		"data-ajax-request-password",
		"data-ajax-request-datatype",
		"data-ajax-request-timeout",
		"data-ajax-request-cross-domain",
		"data-ajax-request-global",
		"data-ajax-request-headers",
		"data-ajax-request-if-modified",
		"data-ajax-request-content-type",
		"data-ajax-request-accepts",
		"data-ajax-request-async",
		"data-ajax-request-cache",
		"data-ajax-request-contents",
		"data-ajax-request-converters",
		"data-ajax-request-beforesend",
		"data-ajax-request-success",
		"data-ajax-request-error",
		"data-ajax-request-complete",
		"data-ajax-request-data-filter",
		"data-ajax-request-is-local",
		"data-ajax-request-jsonp",
		"data-ajax-request-jsonp-callback",
		"data-ajax-request-context",
		"data-ajax-request-mime-type",
		"data-ajax-request-process-data",
		"data-ajax-request-script-charset",
		"data-ajax-request-status-code",
		"data-ajax-request-traditional",
		"data-ajax-request-xhr",
		"data-ajax-request-xhr-fields",
		"data-ajax-request-events-binds"
	])
})(jQuery);
(function($){
	$.jCheetah.modules.classEvents = {};
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
		var event_class = $.jCheetah.getValue(
				event.currentTarget,
				attr,
				event,
				["string","object"],
				undefined,
				undefined);
		if (typeof(event_class) === "string") {
			event_class = {add:event_class,remove:''}
		}
		if (typeof(event_class) === "object") {
			var classes_to_add = event_class.add;
			var classes_to_remove = event_class.remove;
			var status = $(event.currentTarget).attr(attr + "-status");
			var _target = $.jCheetah.getSelector(
					event.currentTarget,
					"data-add-class-target",
					event,
					event.currentTarget);
			var _time = $.jCheetah.getValue(
					event.currentTarget,
					"data-add-class-animation-timing",
					event,
					["number"],
					undefined,
					undefined);
			var _reversible = $.jCheetah.getValue(
					event.currentTarget,
					"data-add-class-reversible",
					event,
					["boolean"],
					true,
					undefined);
			if (typeof(_time) !== "undefined" && 
					typeof($.ui) === "undefined") {
				throw new Error("setting 'data-add-class-animation-timing' requires from jQuery ui");
			}
			if (status == "0") {
				$(event.currentTarget).attr(attr + "-status",1);
				if (typeof(_time) !== "undefined") {
					$(_target).switchClass(classes_to_remove,classes_to_add,_time);
				} else {
					$(_target).addClass(classes_to_add).removeClass(classes_to_remove);
				}
			} else if (_reversible) {
				if (typeof(attr_data[1])==="undefined" || attr_data[1] == event.type) {
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
	$.jCheetah.modules.classEvents.load = function(index,element){
		for (attr in attrToEvent){
			if (typeof(element.attributes[attr]) !== "undefined" &&
				typeof(element.attributes[attr + "-status"]) === "undefined") {
				$element = $(element);
				var events_names = attrToEvent[attr];
				var binds = events_names.join(" ");
				$element.attr(attr + "-status","0");
				$element.bind(binds,{'attr':attr,'attr_data':events_names},
					      defaultClassEventHandler);
			};
		};
	};
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
	var attrremove = function(attr,attrevents,index,element){
		if (typeof(element.attributes[attr + "-status"]) !== "undefined") {
			$(element).unbind(attrevents,defaultClassEventHandler).removeAttr(attr + "-status");
		};
	};
	$.jCheetah.modules.classEvents.triggers = {};
	var registers = [];
	for (attr in attrToEvent) {
		$.jCheetah.modules.classEvents.triggers[attr] = {remove:attrremove.bind(null,attr,attrToEvent[attr].join(" "))}
		registers.push(attr);
		registers.push(attr + "-status");
	}
	$.jCheetah.register(registers);
})(jQuery);/**
 *  jCheetah activator formValidate
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
	if (typeof($.fn.formValidation) === "undefined") {
		console.log("ERROR (formValidation): Module can't be loaded: missing jQuery formValidator");
		return;
	}
	$.jCheetah.modules.formValidateActivation = {};
	$.jCheetah.modules.formValidateActivation.load = function(index,element){
		if (element.attributes["data-activate-form-validation"] !== "undefined") {
			$(element).formValidation();
		};
	}
})(jQuery);/**
 *  jCheetah datepicker sub-module
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
	$.jCheetah.modules.input.jctypes.datepicker = {};
	$.jCheetah.modules.input.jctypes.datepicker.load = function(index,element){
		var $this = $(element);
		var locale = $.jCheetah.getLang(element);
		var regional_datepicker_defined = (typeof(locale) !== "undefined") && (typeof($.datepicker.regional[locale]) !== "undefined");
		if (!regional_datepicker_defined && (typeof(locale) !== "undefined")) {
			console.log("INPUT(DATEPICKER): regional for locale",locale,"hasn't been found, using defaults");
		}
		var alt_field = $.jCheetah.getSelector(
				element,
				"data-datepicker-alt-field",
				undefined,
				undefined);
		var alt_format = $.jCheetah.getValue(
				element,
				"data-datepicker-alt-format",
				undefined,
				["string"],
				undefined,
				undefined);
		var append_text = $.jCheetah.getValue(
				element,
				"data-datepicker-append-text",
				undefined,
				["string"],
				undefined,
				undefined);
		var autosize = $.jCheetah.getValue(
				element,
				"data-datepicker-autosize",
				undefined,
				["boolean"],
				undefined,
				undefined);
		var before_show = $.jCheetah.getValue(
				element,
				"data-datepicker-before-show",
				undefined,
				["function"],
				undefined,
				undefined);
		var before_show_day = $.jCheetah.getValue(
				element,
				"data-datepicker-before-show-day",
				undefined,
				["function"],
				undefined,
				undefined);
		var button_image = $.jCheetah.getValue(
				element,
				"data-datepicker-button-image",
				undefined,
				["function"],
				undefined,
				undefined);
		var button_image_only = $.jCheetah.getValue(
				element,
				"data-datepicker-button-image-only",
				undefined,
				["boolean"],
				undefined,
				undefined);
		var button_text = $.jCheetah.getValue(
				element,
				"data-datepicker-button-text",
				undefined,
				["string"],
				undefined,
				undefined);
		var calculate_week = $.jCheetah.getValue(
				element,
				"data-datepicker-calculate-week",
				undefined,
				["function"],
				undefined,
				undefined);
		var change_month = $.jCheetah.getValue(
				element,
				"data-datepicker-change-month",
				undefined,
				["boolean"],
				undefined,
				undefined);
		var change_year = $.jCheetah.getValue(
				element,
				"data-datepicker-change-year",
				undefined,
				["boolean"],
				undefined,
				undefined);
		var close_text = $.jCheetah.getValue(
				element,
				"data-datepicker-close-text",
				undefined,
				["string"],
				regional_datepicker_defined ?
				$.datepicker.regional[locale].closeText : undefined,
				undefined);
		var constrain_input = $.jCheetah.getValue(
				element,
				"data-datepicker-constrain-input",
				undefined,
				["boolean"],
				undefined,
				undefined);
		var current_text = $.jCheetah.getValue(
				element,
				"data-datepicker-current-text",
				undefined,
				["string"],
				regional_datepicker_defined ?
				$.datepicker.regional[locale].currentText : undefined,
				undefined);
		var date_format = $.jCheetah.getValue(
				element,
				"data-datepicker-date-format",
				undefined,
				["string"],
				regional_datepicker_defined ?
				$.datepicker.regional[locale].dateFormat : undefined,
				undefined);
		var day_names = $.jCheetah.getValue(
				element,
				"data-datepicker-day-names",
				undefined,
				["array"],
				regional_datepicker_defined ?
				$.datepicker.regional[locale].dayNames : undefined,
				undefined);
		var day_names_min = $.jCheetah.getValue(
				element,
				"data-datepicker-day-names-min",
				undefined,
				["array"],
				regional_datepicker_defined ?
				$.datepicker.regional[locale].dayNamesMin : undefined,
				undefined);
		var day_names_short = $.jCheetah.getValue(
				element,
				"data-datepicker-day-names-short",
				undefined,
				["array"],
				regional_datepicker_defined ?
				$.datepicker.regional[locale].dayNamesShort : undefined,
				undefined);
		var default_date = $.jCheetah.getValue(
				element,
				"data-datepicker-default-date",
				undefined,
				["object","number","string"],
				undefined,
				undefined);
		if (typeof(default_date) === "object") {
			if (!(default_date instanceof Date)) {
				default_date = undefined;
			};
		};
		var duration = $.jCheetah.getValue(
				element,
				"data-datepicker-duration",
				undefined,
				["string","number"],
				undefined,
				undefined);
		var first_day = $.jCheetah.getValue(
				element,
				"data-datepicker-first-day",
				undefined,
				["number"],
				regional_datepicker_defined ?
				$.datepicker.regional[locale].firstDay : undefined,
				undefined);
		var goto_current = $.jCheetah.getValue(
				element,
				"data-datepicker-goto-current",
				undefined,
				["boolean"],
				undefined,
				undefined);
		var hide_if_no_prev_next = $.jCheetah.getValue(
				element,
				"data-datepicker-hide-if-no-prev-next",
				undefined,
				["boolean"],
				undefined,
				undefined);
		var is_RTL = $.jCheetah.getValue(
				element,
				"data-datepicker-is-RTL",
				undefined,
				["boolean"],
				regional_datepicker_defined ?
				$.datepicker.regional[locale].isRTL : undefined,
				undefined);
		var max_date = $.jCheetah.getValue(
				element,
				"data-datepicker-max",
				undefined,
				["object","number","string"],
				undefined,
				undefined);
		if (typeof(max_date) === "object") {
			if (!(max_date instanceof Date)) {
					max_date = undefined;
			};
		};
		var min_date = $.jCheetah.getValue(
				element,
				"data-datepicker-min",
				undefined,
				["object","number","string"],
				undefined,
				undefined);
		if (typeof(min_date) === "object") {
			if (!(min_date instanceof Date)) {
				min_date = undefined;
			};
		};
		var month_names = $.jCheetah.getValue(
				element,
				"data-datepicker-month-names",
				undefined,
				["array"],
				regional_datepicker_defined ?
				$.datepicker.regional[locale].monthNames : undefined,
				undefined);
		var month_names_short = $.jCheetah.getValue(
				element,
				"data-datepicker-month-names-short",
				undefined,
				["array"],
				regional_datepicker_defined ?
				$.datepicker.regional[locale].monthNamesShort : undefined,
				undefined);
		var navigation_as_date_format = $.jCheetah.getValue(
				element,
				"data-datepicker-navigation-as-datepicker-format",
				undefined,
				["boolean"],
				undefined,
				undefined);
		var next_text = $.jCheetah.getValue(
				element,
				"data-datepicker-next-text",
				undefined,
				["string"],
				regional_datepicker_defined ?
				$.datepicker.regional[locale].nextText : undefined,
				undefined);
		var number_of_months = $.jCheetah.getValue(
				element,
				"data-datepicker-number-of-months",
				undefined,
				["number","array"],
				undefined,
				undefined);
		var on_change_month_year = $.jCheetah.getValue(
				element,
				"data-datepicker-on-change-month-year",
				undefined,
				["function"],
				undefined,
				undefined);
		var on_close = $.jCheetah.getValue(
				element,
				"data-datepicker-on-close",
				undefined,
				["function"],
				undefined,
				undefined);
		var on_select = $.jCheetah.getValue(
				element,
				"data-datepicker-on-select",
				undefined,
				["function"],
				undefined,
				undefined);
		var prev_text = $.jCheetah.getValue(
				element,
				"data-datepicker-prev-text",
				undefined,
				["string"],
				regional_datepicker_defined ?
				$.datepicker.regional[locale].prevText : undefined,
				undefined);
		var select_other_months = $.jCheetah.getValue(
				element,
				"data-datepicker-select-other-months",
				undefined,
				["boolean"],
				undefined,
				undefined);
		var short_year_cutoff = $.jCheetah.getValue(
				element,
				"data-datepicker-short-year-cutoff",
				undefined,
				["number","string"],
				undefined,
				undefined);
		var show_anim = $.jCheetah.getValue(
				element,
				"data-datepicker-show-anim",
				undefined,
				["string"],
				undefined,
				undefined);
		var show_button_panel = $.jCheetah.getValue(
				element,
				"data-datepicker-show-button-panel",
				undefined,
				["boolean"],
				undefined,
				undefined);
		var show_current_at_pos = $.jCheetah.getValue(
				element,
				"data-datepicker-show-current-at-pos",
				undefined,
				["number"],
				undefined,
				undefined);
		var show_month_after_year = $.jCheetah.getValue(
				element,
				"data-datepicker-show-month-after-year",
				undefined,
				["boolean"],
				regional_datepicker_defined ?
				$.datepicker.regional[locale].showMonthAfterYear : undefined,
				undefined);
		var show_on = $.jCheetah.getValue(
				element,
				"data-datepicker-show-on",
				undefined,
				["string"],
				undefined,
				undefined);
		var show_options = $.jCheetah.getValue(
				element,
				"data-datepicker-show-options",
				undefined,
				["object"],
				undefined,
				undefined);
		var show_other_months = $.jCheetah.getValue(
				element,
				"data-datepicker-show-other-months",
				undefined,
				["boolean"],
				undefined,
				undefined);
		var show_week = $.jCheetah.getValue(
				element,
				"data-datepicker-show-week",
				undefined,
				["boolean"],
				undefined,
				undefined);
		var step_months = $.jCheetah.getValue(
				element,
				"data-datepicker-step-months",
				undefined,
				["number"],
				undefined,
				undefined);
		var week_header = $.jCheetah.getValue(
				element,
				"data-datepicker-week-header",
				undefined,
				["number"],
				regional_datepicker_defined ?
				$.datepicker.regional[locale].weekHeader : undefined,
				undefined);
		var year_range = $.jCheetah.getValue(
				element,
				"data-datepicker-year-range",
				undefined,
				["string"],
				undefined,
				undefined);
		var year_suffix = $.jCheetah.getValue(
				element,
				"data-datepicker-year-suffix",
				undefined,
				["string"],
				regional_datepicker_defined ?
				$.datepicker.regional[locale].yearSuffix : undefined,
				undefined);
		var data = {
			'altField' : alt_field,
			'altFormat' : alt_format,
			'appendText' : append_text,
			'autoSize' : autosize,
			'beforeShow' : before_show,
			'beforeShowDay' : before_show_day,
			'buttonImage' : button_image,
			'buttonImageOnly' : button_image_only,
			'buttonText' : button_text,
			'calculateWeek' : calculate_week,
			'changeMonth' : change_month,
			'changeYear' : change_year,
			'closeText' : close_text,
			'constrainInput' : constrain_input,
			'currentText' : current_text,
			'dateFormat' : date_format,
			'dayNames' : day_names,
			'dayNamesMin' : day_names_min,
			'dayNamesShort' : day_names_short,
			'defaultDate' : default_date,
			'duration' : duration,
			'firstDay' : first_day,
			'gotoCurrent' : goto_current,
			'hideIfNoPrevNext' : hide_if_no_prev_next,
			'isRTL' : is_RTL,
			'maxDate' : max_date,
			'minDate' : min_date,
			'monthNames' : month_names,
			'monthNamesShort' : month_names_short,
			'navigationAsDateFormat' : navigation_as_date_format,
			'nextText' : next_text,
			'numberOfMonths' : number_of_months,
			'onChangeMonthYear' : on_change_month_year,
			'onClose' : on_close,
			'onSelect' : on_select,
			'prevText' : prev_text,
			'selectOtherMonths' : select_other_months,
			'shortYearCutoff' : short_year_cutoff,
			'showAnim' : show_anim,
			'showButtonPanel' : show_button_panel,
			'showCurrentAtPos' : show_current_at_pos,
			'showMonthAfterYear' : show_month_after_year,
			'showOn' : show_on,
			'showOptions' : show_options,
			'showOtherMonths' : show_other_months,
			'showWeek' : show_week,
			'stepMonths' : step_months,
			'weekHeader' : week_header,
			'yearRange' : year_range,
			'yearSuffix' : year_suffix
		}
		$(element).datepicker(data).attr("data-is-datepicker",1);
	};
	$.jCheetah.modules.input.jctypes.datepicker.destroy = function(index,element){
		if (typeof(element.attributes['data-is-datepicker']) !== "undefined") {
			var $this = $(element);
			try {
				$this.removeAttr("data-is-datepicker").datepicker('destroy');
			} catch (err) {
			}
		}
	};
	var triggdata = {
		"data-datepicker-alt-field":"altField",
		"data-datepicker-alt-format":"altFormat",
		"data-datepicker-append-text":"appendText",
		"data-datepicker-autosize":"autosize",
		"data-datepicker-before-show":"beforeShow",
		"data-datepicker-before-show-day":"beforeShowDay",
		"data-datepicker-button-image":"buttonImage",
		"data-datepicker-button-image-only":"buttonImageOnly",
		"data-datepicker-button-text":"buttonText",
		"data-datepicker-calculate-week":"calculateWeek",
		"data-datepicker-change-month":"changeMonth",
		"data-datepicker-change-year":"changeYear",
		"data-datepicker-close-text":"closeText",
		"data-datepicker-constrain-input":"constrainInput",
		"data-datepicker-current-text":"currentText",
		"data-datepicker-date-format":"dateFormat",
		"data-datepicker-day-names":"dayNames",
		"data-datepicker-day-names-min":"dayNamesMin",
		"data-datepicker-day-names-short":"dayNamesShort",
		"data-datepicker-default-date":"defaultDate",
		"data-datepicker-duration":"duration",
		"data-datepicker-first-day":"firstDay",
		"data-datepicker-goto-current":"gotoCurrent",
		"data-datepicker-hide-if-no-prev-next":"hideIfNoPrevNext",
		"data-datepicker-is-RTL":"isRTL",
		"data-datepicker-max":"maxDate",
		"data-datepicker-min":"minDate",
		"data-datepicker-month-names":"monthNames",
		"data-datepicker-month-names-short":"monthNamesShort",
		"data-datepicker-navigation-as-datepicker-format":"navigationAsDateFormat",
		"data-datepicker-next-text":"nextText",
		"data-datepicker-number-of-months":"numberOfMonths",
		"data-datepicker-on-change-month-year":"onChangeMonthYear",
		"data-datepicker-on-close":"onClose",
		"data-datepicker-on-select":"onSelect",
		"data-datepicker-prev-text":"prevText",
		"data-datepicker-select-other-months":"selectOtherMonths",
		"data-datepicker-short-year-cutoff":"shortYearCutoff",
		"data-datepicker-show-anim":"showAnim",
		"data-datepicker-show-button-panel":"showButtonPanel",
		"data-datepicker-show-current-at-pos":"showCurrentAtPos",
		"data-datepicker-show-month-after-year":"showMonthAfterYear",
		"data-datepicker-show-on":"showOn",
		"data-datepicker-show-options":"showOptions",
		"data-datepicker-show-other-months":"showOtherMonths",
		"data-datepicker-show-week":"showWeek",
		"data-datepicker-step-months":"stepMonths",
		"data-datepicker-week-header":"weekHeader",
		"data-datepicker-year-range":"yearRange",
		"data-datepicker-year-suffix":"yearSuffix"
	}
	var funcchange = function(uiopt,index,element,newValue){
				if (typeof(element.attributes["data-is-datepicker"]) !== "undefined") {
					$(element).datepicker("option",uiopt,newValue);
				}
			}
	var funcremove = function(uiopt,index,element) {
				if (typeof(element.attributes["data-is-datepicker"]) !== "undefined") {
					var $element = $(element);
					var locale = $.jCheetah.getLang(element);
					var regional_datepicker_defined = (typeof(locale) !== "undefined") && (typeof($.datepicker.regional[locale]) !== "undefined");
					var _default = regional_datepicker_defined ? $.datepicker.regional[locale][uiopt] : $.datepicker._defaults[uiopt];
					$(element).spinner("option",uiopt,_default);
				}
			}
	for (attr in triggdata) {
		$.jCheetah.modules.input.triggers[attr] = {
			change: funcchange.bind(null,triggdata[attr]),
			remove: funcremove.bind(null,triggdata[attr])
		};
	};
	$.jCheetah.register(["data-datepicker-alt-field","data-datepicker-alt-format",
		"data-datepicker-append-text","data-datepicker-autosize",
		"data-datepicker-before-show","data-datepicker-before-show-day",
		"data-datepicker-button-image","data-datepicker-button-image-only",
		"data-datepicker-button-text","data-datepicker-calculate-week",
		"data-datepicker-change-month","data-datepicker-change-year",
		"data-datepicker-close-text","data-datepicker-constrain-input",
		"data-datepicker-current-text","data-datepicker-date-format","data-datepicker-day-names",
		"data-datepicker-day-names-min","data-datepicker-day-names-short",
		"data-datepicker-default-date","data-datepicker-duration",
		"data-datepicker-first-day","data-datepicker-goto-current",
		"data-datepicker-hide-if-no-prev-next","data-datepicker-is-RTL",
		"data-datepicker-max","data-datepicker-min","data-datepicker-month-names",
		"data-datepicker-month-names-short","data-datepicker-navigation-as-datepicker-format",
		"data-datepicker-next-text","data-datepicker-number-of-months",
		"data-datepicker-on-change-month-year","data-datepicker-on-close",
		"data-datepicker-on-select","data-datepicker-prev-text",
		"data-datepicker-select-other-months","data-datepicker-short-year-cutoff",
		"data-datepicker-show-anim","data-datepicker-show-button-panel",
		"data-datepicker-show-current-at-pos","data-datepicker-show-month-after-year",
		"data-datepicker-show-on","data-datepicker-show-options",
		"data-datepicker-show-other-months","data-datepicker-show-week",
		"data-datepicker-step-months","data-datepicker-week-header",
		"data-datepicker-year-range","data-datepicker-year-suffix",
		"data-is-datepicker"]);
})(jQuery);/**
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
	var defaultSpinnerKeydownHandler = function(event) {
		var typeofEvent = IS_WHAT(event);
		if (typeofEvent !== "NUMERIC" && typeofEvent != "DOT" && 
				typeofEvent !== "ERASE" && typeofEvent !== "SUM" &&
				typeofEvent !== "MINUS" && typeofEvent !== "ARROWS") {
			return false;
		};
		var $this = $(event.currentTarget);
		var val = $this.val();
		if (typeofEvent == "DOT") {
			if (val.indexOf('.') != -1) {
				return false;
			};
		};
		var number_type = $.jCheetah.getValue(
				event.currentTarget,
				"data-spinner-type",
				event,
				["string"],
				"integer",
				["integer","float"]);
		if (typeofEvent == "DOT" && number_type == "integer") {
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
			return true;
		}
		var number_type = $.jCheetah.getValue(
				event.currentTarget,
				"data-spinner-type",
				event,
				["string"],
				"integer",
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
			$curtar.spinner("value",min);
		} else if (max !== null && current_value > max) {
			$curtar.spinner("value",max);
		}
	};
	$.jCheetah.modules.input.jctypes.spinner.load = function(index,element){
		var $element = $(element);
		var number_type = $.jCheetah.getValue(
				element,
				"data-spinner-type",
				undefined,
				["string"],
				"integer",
				["integer","float"]);
		var number_min = $.jCheetah.getValue(
				element,
				"data-spinner-min",
				undefined,
				["number"],
				undefined,
				undefined);
		var number_max = $.jCheetah.getValue(
				element,
				"data-spinner-max",
				undefined,
				["number"],
				undefined,
				undefined);
		var number_step = $.jCheetah.getValue(
				element,
				"data-spinner-step",
				undefined,
				["number"],
				number_type == "float" ? 0.25 : 1,
				undefined);
		var number_disabled = $.jCheetah.getValue(
				element,
				"data-spinner-disabled",
				undefined,
				["boolean"],
				false,
				undefined);
		var number_icons = $.jCheetah.getValue(
				element,
				"data-spinner-icons",
				undefined,
				["object"],
				undefined,
				undefined);
		var number_incremental = $.jCheetah.getValue(
				element,
				"data-spinner-incremental",
				undefined,
				["boolean","function"],
				false,
				undefined);
		var number_format = $.jCheetah.getValue(
				element,
				"data-spinner-format",
				undefined,
				["string"],
				undefined,
				undefined);
		var number_culture = $.jCheetah.getValue(
				element,
				"data-spinner-culture",
				undefined,
				["string"],
				$.jCheetah.getLang(element),
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
					element,
					"data-spinner-type",
					undefined,
					["string"],
					"integer",
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
						element,
						"data-spinner-step",
						undefined,
						["number"],
						0.25,
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
		"data-spinner-min":["min",null],
		"data-spinner-max":["max",null],
		"data-spinner-disabled":["disabled",false],
		"data-spinner-icons":["icons",{ down: "ui-icon-triangle-1-s", up: "ui-icon-triangle-1-n" }],
		"data-spinner-incremental":["incremental",true],
		"data-spinner-format":["numberFormat","n"]
	}
	var funcchange = function(uiopt,index,element,newValue){
				if (typeof(element.attributes["data-is-spinner"]) !== "undefined") {
					$(element).spinner("option",uiopt,newValue);
				}
			}
	var funcremove = function(uiopt,uidefault,index,element) {
				if (typeof(element.attributes["data-is-spinner"]) !== "undefined") {
					$(element).spinner("option",uiopt,uidefault);
				}
			}
	for (attr in triggdata) {
		$.jCheetah.modules.input.triggers[attr] = {
			change: funcchange.bind(null,triggdata[attr][0]),
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
})(jQuery);$(document).ready(function(){
	$.jCheetah.load();
});
