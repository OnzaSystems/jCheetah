/**
 *  jCheetah base
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
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>
 */

(function($){
	
	//this is the set for everything
	$.jCheetah = {};
	
	//The modules
	$.jCheetah.modules = {};
	
	//The triggers
	$.jCheetah.triggers = {};
	
	//The attributes (checks for name collisions)
	$.jCheetah.attributes = [];
	
	//Var to save the dummies
	window.jCheetahDummies = {};
	
	/**
	 * Loads jCheetah in the current document
	 */
	$.jCheetah.load = function(){
		
		//SETTING TRIGGERS
		for (var module in $.jCheetah.modules) {
			
			console.debug("BASE: loading triggers for module",module);
			
			for (var trigger in $.jCheetah.modules[module].triggers) {
				
				console.debug("BASE:\tadding trigger for attribute",trigger);
				
				if (typeof($.jCheetah.triggers[trigger]) !== "undefined"){
					throw new Error("Trigger for attribute " + trigger + " exists twice or more times");
				}
				$.jCheetah.triggers[trigger] = $.jCheetah.modules[module].triggers[trigger];
			}
		}
		
		//-----------------------------------------
		
		//run basics
		$(document.getElementsByTagName('*')).jCheetahPerformBasics();
		
		//----------------------------------------
	}
	
	//Put paterns here for speed
	//pattern for a string matching boolean
	var patternBoolean = /^true|false$/;
	//pattern for an integer
	var patternInt = /^[\d\+\-]\d*$/;
	//pattern for a floating point number
	var patternFloat = /^[\d\+\-]\d*.[\d*$]|^[\d\+\-]\d*\./;
	//pattern for an array
	var patternArray = /^\[.*\]$/;
	//Then for an object
	var patternObject = /^\{.*\}$/;
	//and the string type
	var patternString = /^'.*'$|^".*"$/;
	
	/**
	 * Parses an string to its corresponding type, depending to syntax
	 * @param obj the object to parse given as a string
	 * @param args the arguments to run in case the user wants to call a function
	 * @param element the element to use as context, in case
	 * @returns
	 */
	$.jCheetah.parseItem = function(obj,args,element) {
		
		//if the object is undefined the type is undefined
		if (typeof(obj) === "undefined") {
			//Returning undefined
			return undefined;
		}
		
		//If the given object is not a string, then we must raise
		//an error
		if (typeof(obj) !== "string") {
			//Let's construct the error message
			throw new TypeError("The parameter obj must be of type string"); 
		};
		
		//if the object is an empty string, we don't know what it is
		if (obj === "") {
			//must be a string then!
			return obj;
		};
		
		//Is it a boolean?
		if (patternBoolean.test(obj)) {
			
			//We return if the gotten string is equal to true
			return (obj == "true");
			
		//Or an integer
		} else if (patternInt.test(obj)) {
			
			//we return the integer parsed
			return parseInt(obj);
		
		//Maybe a float
		} else if (patternFloat.test(obj)) {
			
			//The float parsed
			return parseFloat(obj);
		
		//Can be an array or an object, let's check
		} else if (patternArray.test(obj) || patternObject.test(obj)) {
			
			//The type we want is array or object according to the type
			var _type = (patternArray.test(obj) ? "array" : "object");
			
			//Gonna seek for the object
			var _obj;
			
			try {
				
				//Firstly we try parsing the item replacing the ' to " as " is commonly used inside
				//Attributes say by attribute="{'stuff'='otherstuff'}" we try with JSON parsing
				_obj = JSON.parse(obj.replace(/"/g,'\\"').replace(/\\'/,"'").replace(/'/g,'"'));
				
			//but if we fail!
			} catch (SE) {

				//Let's try just as it is
				try {
					//Just parse it, maybe the user prefers ' enclosed attributes like
					//attribute='{"stuff":"otherstuff"}'
					_obj = JSON.parse(obj);
					
				//But what if we fail
				} catch (SE2) {
					
					//Well let's try with an ACCESSOR, direcly from the window object
					try {
						//USES ACCESSOR
						//So basically this is what an ACCESSOR does! not a big deal right
						_obj = (new Function("","return " + obj).call(element));
						
					//And if this fails too!
					} catch (SE3) {
						
						//There's nothing to do, the developer typed something wrong
						
						//The error would be (depending if it's an object or array)
						var error = (_type == "array") ? 
							"Bad syntax for array " :
							"Bad syntax for object ";
						
						//And we add the object so that the developer knows what
						//we're talking about
						throw new SyntaxError(error + obj);
					};
				};
			};
			
			//If we've got an object we return it
			return _obj;
			
		//Is it a string
		} else if (patternString.test(obj)) {
			
			//Remove the quots or double quots
			//this is why jCheetah strings don't need escaping
			//but hey "'don\'t'" looks more confusing than "'don't'"
			//and we'd want readability
			return obj.substr(1,obj.length - 2);
			
		//Is it a reference or a function?
		} else {
			
			//So firstly! let's try to find it in our window
			//Our current element is the window
			var current_element = window;
			
			//CHECK FOR GENERAL/COMPLEX PARSED VARIABLE ACCESSOR
			//So we check if it's something marked as # which means "call this and I want the result"
			var value_returned_by_function = (obj.indexOf("#") === 0);
			//Not all browsers support startsWith! so we gotta use indexOf
			
			//START GENERAL VARIABLE ACCESSOR
			//And the array for the "possible path" like $.parseStuff
			//So firstly we check if it's "#..." or "..." because we have to
			//remove the trailing # to split values
			var object_split = (value_returned_by_function ?
					obj.substr(1).split(".") : obj.split("."));
			
			//So the object haven't been found, sure, we haven't even seek!
			var object_found = false;
			
			//We start looping
			for (var i = 0;i < object_split.length; i++) {
				//if the current element we've gotten so far is undefined
				if (typeof(current_element) === "undefined") {
					//let's get outta here this failed!
					break;
				}
				//The current element is going to be the child which name
				//corresponds to the next element in our array
				current_element = current_element[object_split[i]];
				
				//if we've reach the end and our current element is not undefined
				if ((i === (object_split.length - 1)) && 
					typeof(current_element) !== "undefined") {
					//then wola! we found our object, success!
					object_found = true;
				}
			}
			
			//If we found an object
			if (object_found) {
				
				//Then
				//GENERAL VARIABLE ACCESSOR WAS SUCESSFUL
				
				//We check what the return type is
				var _type = typeof(current_element);
				
				//if the type is not a function and the user added a trailing #
				//which means, "call this function".
				if (_type !== "function" && value_returned_by_function) {
					
					//Gonna complain that there's no function!
					throw new Error("Error this value is not a function: " +
							//where? in that string the developer gave.
							obj.substr(1));
					
				//But anyway if it's a function and also we wanted to call
				//a function
				} else if (_type === "function" && value_returned_by_function) {
					
					//this is the
					//GENERAL PARSED VARIABLE ACCESSOR
					//we're running a function to get its result
					//we call it in the element context, and using the
					//given args (args is a parameter in this function)
					return current_element.call(element,args);
					
				} else {
					//if not we used
					//GENERAL VARIABLE ACCESSOR
					//a very efficient one by the way
					//we just return whatever we've got
					return current_element;
				}
			
			//Otherwise if we didn't find it that way
			} else {
				
				//We may try this way this is the
				//COMPLEX VARIABLE ACCESSOR
				
				try {
					
					//remember that it may still have a preceding #
					var r_obj_val = (value_returned_by_function ?
						obj.substr(1) : obj)
					
					//Get a fuction to return that what we want
					current_element = new Function("","return " + r_obj_val).call(element);
					
					//We check what the return type is
					var _type = typeof(current_element);
					
					//if the type is not a function and the user added a trailing #
					//which means, "call this function".
					if (_type !== "function" && value_returned_by_function) {
						
						//We complain there's no function!
						throw new Error("Error this value is not a function: " +
								obj.substr(1));
						
					//But anyway if it's a function and also we wanted to call
					//a function
					} else if (_type === "function" && value_returned_by_function) {
						
						//This is the!
						//COMPLEX PARSED VARIABLE ACCESSOR
						
						//Call the function and return the result
						return current_element.call(element,args);
					
					//otherwise
					} else {
						
						//it's just a default
						//COMPLEX VARIABLE ACCESOR
						return current_element;
					}
					
				} catch (err) {
					
					//if we get here even the complex variable accesor failed
					//everything FAILED badly, so this stuff must be a string
					//the developer forgot to quot data like say myattr="mystring"
					//instead myattr="'mystring'";
					
					//let's give the developer a warn!
					console.log("Using as string, cannot parse " + obj + " : " + err);
					
					//so we return it
					return obj;
					
				};
				
			};
			
		};
	};
	
	/**
	 * Gets the value of an attribute from an element
	 * @param element the element we want to get an attribute from
	 * @param attribute the jCheetah attribute we want to parse
	 * @param arrayAcceptedTypes the types we would accept, use undefined to accept all.
	 * @param event the event (if there's one)
	 * @param _default the default value we would get in case the attribute doesn't exist
	 * @param _accept_only an array of possible results, different results throw an error, use undefined not to use this feature.
	 * @returns
	 */
	$.jCheetah.getValue = function(element,attribute,event,
			arrayAcceptedTypes,_default,_accept_only) {
		
		//Firstly we check if it's a metaobject
		if (attribute.indexOf("_*_") !== -1) {
			
			//so the object is empty because we haven't added values
			var obj = {};
			
			//we would have to check per element's attribute
			for (var i = 0;i < element.attributes.length;i++) {
				
				//this'd be the current attribute
				var cur_attr = element.attributes[i];
				//and this the current attribute name
				var cur_attr_name = cur_attr.name;
				
				//if the current attribute name replacing the last *_ from the attribute
				//is zero indexed, eg. say... dialog-button-_*_ is the meta attribute name
				//and dialog-button-_OK_, the way to check if it belongs to the
				//metaobject is take the dialog-button-_*_ and remove *_ so it becomes dialog-btn-_
				//and the index of that in dialog-button-_OK_ must be zero, in fact it is, so
				//that attribute would belong to that metaobject
				var attribute_cut = attribute.replace("*_","");
				if (cur_attr_name.indexOf(attribute_cut) === 0) {
					
					//Now to ge the name we'd get the dialog-button-_ and replace this to
					//an empty string to the actual attribute name so we'd get OK_
					//and we split it in the _ character to get smaller chunks, say
					// ["OK",""] for OK_ and ["NO","THANKS",""] for NO_THANKS_
					var obj_data = cur_attr_name.replace(attribute_cut,"").split("_");
					
					//We remove the last empty string
					obj_data.pop();
					
					//And join it back together so that it's the name ["OK"] becomes OK and
					//["NO","THANKS"] becomes NO THANKS
					var obj_name = obj_data.join(" ");
					
					//and the value must be gotten with a recursive call to this same function
					var obj_val = $.jCheetah.getValue(
							//The element
							element,
							//The wanted attribute,
							//this is the real attribute name from the element like
							//dialog-button-_OK_ instead its metaobject name dialog-button-_*_
							cur_attr_name,
							//The event
							event,
							//The accepted types
							arrayAcceptedTypes,
							//What would you get by default if the attribute doesn't exist?
							_default,
							//Allowed results
							_accept_only);
					
					//We set it in the obeject
					obj[obj_name] = obj_val;
				};
			};
			
			//finally we'd return the object, we're not running the rest of this function
			//because it's not designed to handle metaobjects
			return obj;
		}
		
		//Firstly we get the value of the attribute, this is like $(element).attr(attribute)
		//but using this syntax for speed, anyway this is the base/core it must be as fast as
		//possible
		var attr_val = (typeof(element.attributes[attribute]) !== "undefined" ? 
				element.attributes[attribute].value : undefined);
		
		//We create the args for the function, firstly as undefined
		//this is to save memory
		var args = undefined;
		
		//We're only setting them to the args we'd want if actually
		//the attribute value startsWith "#" which means is a PARSED
		//ACCESSOR and so it'd need from the args
		if (typeof(attr_val) === "string" && attr_val.indexOf("#") == 0) {
			//so we set them
			var args = {'element':element,
		            'attribute':attribute,
		            'event':event,
		            'acceptedTypes':arrayAcceptedTypes,
		            'acceptOnly' : _accept_only
			}
		}
		
		//Finally we call the parsing function
		var object = $.jCheetah.parseItem(attr_val,args,element);
		//And we get the type
		var _typeof = typeof(object);
		
		//if the attribute didn't exist, then we return the default
		if (_typeof === "undefined") {
			return _default;
		};
		
		//if the object is an instance of an array, then it's an array.
		//jCheetah uses boolean,string,number,array,object,function for
		//attribute values, and array is an object, so we have to (say)
		//revive the array typeof
		if (object instanceof Array) {
			_typeof = "array";
		};

		//if the array for accepted types is not undefined we'd perform
		//checking, otherwise nope.
		if (typeof(arrayAcceptedTypes) === "undefined" ||
				arrayAcceptedTypes.indexOf(_typeof) >= 0) {
			
			//if the array for the accepted results is not undefined
			//and the given result doesn't exist in that array
			if (typeof(_accept_only) !== "undefined" && 
					_accept_only.indexOf(object) === -1){
				
				//Throw an Error!
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
			
			//Otherwise we return the object
			return object;
			
		//otherwise
		} else {
			//if we've come here it means that the developer
			//put a wrong data type in an attribute that required
			//something different
			
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
	
	/**
	 * Gets a selector contained in an attribute from a given element
	 * @param element the element we want to get the selector from
	 * @param attribute the attribute within is contained
	 * @param event the event (if exists)
	 * @param _default what would you get by default if the selector doesn't exists
	 * @returns a jQuery selector
	 */
	$.jCheetah.getSelector = function(element,attribute,event,_default) {
		
		//we'd get the value contained in that attribute without caring
		//of accepted types, neither result filtering, getting undefined if it doesn't exist
		var object = $.jCheetah.getValue(
				//The element
				element,
				//the wanted attribute
				attribute,
				//the event
				event,
				//the array of accepted types (undefined to accept everything that comes)
				undefined,
				//our default result
				undefined,
				//result filtering, we're not filtering results
				undefined);
		
		//so if we get undefined
		if (typeof(object) === "undefined") {
			//we return whatever was default
			return _default;
		};
		
		//so if the type is not a string
		if (typeof(object) !== "string"
			//and it's not an array
			&& !object instanceof Array
			//or a jQuery element
			&& !object instanceof jQuery
			//or a HTMLElement
			&& !object instanceof HTMLElement
			//or a HTMLCollection which is also selectable
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
		
		//Set the value for that selector, undefined now
		var selector;
		
		//if the type is a string and there is the double : syntax
		if (typeof(object) === "string"
			&& (object.indexOf("::") === 0)) {
			
			//We must get the function names.replacing the first occurrence
			//of :: with an empty string, and splitting the rest into chuncks
			//so that "::next item ::prev" becomes ["next item ","prev"]
			functions = object.replace("::","").split("::");
			//our selector is our element
			selector = element;
			
			//so we start looping into our function names
			for (var i = 0; i < functions.length; i++) {
				
				//our item is that value say "next item " or "prev", would become
				//["next","item"] ["prev"]
				var item_data = functions[i].match(/\S+/g);
				
				//Then the name would be 
				var fn_name = item_data[0];
				
				//if the function is ::this
				if (fn_name === "this") {
					//the it's the same selector
					selector = element;
				} else {
					
					//otherwise we get the argument, it may be
					//undefined like in "prev" or "item" like in "next item"
					var arg = item_data[1];
					
					//we run the function
					selector = $(selector)[fn_name](arg);
				};
			}
			
		//if it's just a bare string, array, object or jQuery
		} else {
			//We set that to be the selector
			selector = object;
		};
		
		//and return it
		return selector;
	};
	
	/**
	 * Registers attributes to check for name collisions, only checks for collisions
	 * does not save the parent module for speed, and it's not used anywhere else
	 * @param attrs an array with the names of the attribute
	 */
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
	
	
	//~~~~~~~~~~~~~~~~~~~~ JQUERY extensions ~~~~~~~~~~~~~~~~~~~~~~~~~~//
	
	/**
	 * Will perform all the basics functions per module
	 */
	$.fn.jCheetahPerformBasics = function(){
		
		//we loop per (whatever) elements we're checking
		this.each(function(index,element){
			
			//these nodes are not allowed, can cause trouble
			if (element.nodeName !== "SCRIPT" && element.nodeName !== "HEAD" && element.nodeName !== "STYLE" 
				&& element.nodeName !== "HTML" && element.nodeName !== "BODY") {
				
				//so we have a jcheetahloaded data in that element we wrote using jQuery's data
				//we get it
				var basicsAlreadyLoaded = $(element).data("jcheetahloaded");
				
				//if there's no data of loading
				if (typeof(basicsAlreadyLoaded) === "undefined") {
					
					//We're going to load our module for that function
					for (var module in $.jCheetah.modules) {
						//so for all the items, we run that basic function
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
	
	/**
	 * Retrives and sets jCheetah attributes
	 */
	$.fn.attrjCheetah = function(attr,value) {
		
		//if the type of the value is undefined
		if (typeof(value) === "undefined" && 
				typeof(attr) !== "undefined") {
			
			//We return the value we get from it
			return $.jCheetah.getValue(
					this[0],
					attr,
					undefined,
					undefined,
					undefined,
					undefined)
		
		//Otherwise if it's something to set
		} else if (typeof(attr) !== "undefined"
			&& typeof(value) !== "undefined") {
			
			//Creating a dummy randomly
			var name = "jCheetahDummy" + Math.random() * 100000000000000000;
			
			//anyway let's make sure it doesn't exist, the probs are ridiculously low but
			//hey, this must be perfect.
			while (window.jCheetahDummies.hasOwnProperty(name)) {
				name = "jCheetahDummy" + Math.random() * 100000000000000000;
			}
			
			//We add the value in the window in our dummies section
			window.jCheetahDummies[name] = value;
			
			//and set that as attribute
			this.attr(attr,"jCheetahDummies." + name);
			
			//So we check the triggers list to see if there are
			//triggers for the given attr
			var triggers;
			
			//if it's not a metaobject
			if (attr.indexOf("_") == -1) {
				//the name of the attribute is as it is
				triggers = $.jCheetah.triggers[attr];
			} else {
				//otherwise the name of the attribute is from attr-example-_variable_ to attr-example-_*_
				//this would be ["attr-example-","variable",""][0] so "attr-example-"
				var attr_r_name = attr.split("_")[0];
				//and we're going to check triggers for "attr-example-_*_"
				triggers = $.jCheetah.triggers[attr_r_name + "_*_"];
			}
			
			//if there are
			if (typeof(triggers) !== "undefined") {
				
				//we get the change trigger, as .attrjCheetah changes data
				var changeTrigger = triggers.change;
				
				//so get the type
				var _typeof_changeTrigger = typeof(changeTrigger);
				
				//if the type is not undefined and it's a string
				if (_typeof_changeTrigger !== "undefined" && 
						_typeof_changeTrigger== "function") {
					
					console.debug("BASE: running function for change",changeTrigger);
					
					//We execute it for this element
					this.each(function(index,element){
						changeTrigger(index,element,value)
					});
					
				//otherwise it's an array
				} else if (changeTrigger instanceof Array) {
					//let's run all those change triggers
					for (var i = 0;i < changeTrigger.length ; i++) {
						
						console.debug("BASE: running function for change",changeTrigger[i]);
						
						this.each(function(index,element){
							changeTrigger[i](index,element,value)
						})
					}
				};
			};
			
		};
		
		//we return this element, it doesn't happen if value is undefined
		return this;
	};
	
	/**
	 * Removes a jCheetah attribute
	 */
	$.fn.removeAttrjCheetah = function(attr) {
		
		//Remove the attribute
		this.removeAttr(attr);
		
		//So we check the triggers list to see if there are
		//triggers for the given attr
		var triggers;
		
		//if it's not a metaobject
		if (attr.indexOf("_") == -1) {
			//the name of the attribute is as it is
			triggers = $.jCheetah.triggers[attr];
		} else {
			//otherwise the name of the attribute is from attr-example-_variable_ to attr-example-_*_
			//this would be ["attr-example-","variable",""][0] so "attr-example-"
			var attr_r_name = attr.split("_")[0];
			//and we're going to check triggers for "attr-example-_*_"
			triggers = $.jCheetah.triggers[attr_r_name + "_*_"];
		}
		
		//if there are
		if (typeof(triggers) !== "undefined") {
			
			//we get the remove trigger, as .removeAttrjCheetah removes data
			var removeTrigger = triggers.remove;
			
			//and its type
			var _typeof_removeTrigger = typeof(removeTrigger);
			
			//if there is one
			if (_typeof_removeTrigger !== "undefined" && 
					_typeof_removeTrigger == "function") {
				
				console.debug("BASE: running function for remove",removeTrigger);
				
				//We execute it for this element
				this.each(removeTrigger);
			
			//otherwise it's an array
			} else if (removeTrigger instanceof Array) {
				//let's run all those remove triggers
				for (var i = 0;i < removeTrigger.length ; i++) {
					
					console.debug("BASE: running function for remove",removeTrigger[i]);
					
					this.each(removeTrigger[i]);
				}
			}
		};
		
		//return this, always happens
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
					//The element
					element,
					//The wanted attribute
					"data-autocomplete-source",
					//The event
					undefined,
					//The accepted types
					["string","array","function"],
					//What would you get by default if the attribute doesn't exist?
					undefined,
					//Allowed results
					undefined);
			
			var append_to = $.jCheetah.getSelector(
					//The selector
					element,
					//The wanted attribute
					"data-autocomplete-append-to",
					//The event,
					undefined,
					//What would you get by default if the attribute doesn't exist?
					undefined);
			
			var auto_focus = $.jCheetah.getValue(
					//The element
					element,
					//The wanted attribute
					"data-autocomplete-auto-focus",
					//The event
					undefined,
					//The accepted types
					["boolean"],
					//What would you get by default if the attribute doesn't exist?
					undefined,
					//Allowed results
					undefined);
			
			var delay = $.jCheetah.getValue(
					//The element
					element,
					//The wanted attribute
					"data-autocomplete-delay",
					//The event
					undefined,
					//The accepted types
					["number"],
					//What would you get by default if the attribute doesn't exist?
					undefined,
					//Allowed results
					undefined);
			
			var disabled = $.jCheetah.getValue(
					//The element
					element,
					//The wanted attribute
					"data-autocomplete-disabled",
					//The event
					undefined,
					//The accepted types
					["boolean"],
					//What would you get by default if the attribute doesn't exist?
					undefined,
					//Allowed results
					undefined);
			
			var min_len = $.jCheetah.getValue(
					//The element
					element,
					//The wanted attribute
					"data-autocomplete-min-length",
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
					"data-autocomplete-position",
					//The event
					undefined,
					//The accepted types
					["object"],
					//What would you get by default if the attribute doesn't exist?
					undefined,
					//Allowed results
					undefined);
			
			var data = {'source':autocomplete,
				'appendTo' : append_to,
				'autoFocus' : auto_focus,
				'delay':delay,
				'disabled':disabled,
				'minLength':min_len,
				'position':position};
			console.debug("AUTOCOMPLETE: creating autocomplete in",element,"with data",data);
			$this.autocomplete(data).attr("data-is-autocomplete",1);
		}
	}
	
	$.jCheetah.modules.autocomplete.triggers = {};
	
	//This is the basic trigger that adds and removes autocomplete widgets, say the key attribute,
	//So let's create it lonely
	$.jCheetah.modules.autocomplete.triggers["data-autocomplete-source"] = {
		change:
			function(index,element,newValue){
				if (typeof(element.attributes["data-is-autocomplete"]) !== "undefined") {
					console.debug("AUTOCOMPLETE: changing source to ",newValue);
					$(element).autocomplete("option","source",newValue);
				} else {
					console.debug("AUTOCOMPLETE: creating new autocomplete widget");
					$.jCheetah.modules.autocomplete.load(index,element);
				}
			},
		remove:
		
			function(index,element) {
				if (typeof(element.attributes["data-is-autocomplete"]) !== "undefined") {
					console.debug("AUTOCOMPLETE: destroying widget");
					$(element).autocomplete('destroy').removeAttr("data-is-autocomplete");
				}
			}
	};
	
	//However for the other attributes let's create this structure
	var triggdata = {
		//The name		      //the ui option		//the default value
		"data-autocomplete-position":["position",{my:"left top",at:"left bottom",collision:"none"}],
		"data-autocomplete-min-length":["minLength",null],
		"data-autocomplete-disabled":["disabled",false],
		"data-autocomplete-delay":["delay",300],
		"data-autocomplete-auto-focus":["autoFocus",false],
		"data-autocomplete-append-to":["appendTo",null]
	}
	
	//The function for change takes by default (at the end) a new value, so we don't have to use the default
	//Let's only put a uiopt option for the option
	var funcchange = function(uiopt,index,element,newValue){
				if (typeof(element.attributes["data-is-autocomplete"]) !== "undefined") {
					$(element).autocomplete("option",uiopt,newValue);
				}
			}
	
	//And the remove, needs the default value, so we need two uiopt and uidefault
	var funcremove = function(uiopt,uidefault,index,element) {
				if (typeof(element.attributes["data-is-autocomplete"]) !== "undefined") {
					$(element).autocomplete("option",uiopt,uidefault);
				}
			}
	
	//So per attribute
	for (attr in triggdata) {
	
		//We're going to add a trigger for that attribute
		$.jCheetah.modules.autocomplete.triggers[attr] = {
			//and replace the uiopt attribute with the option for that ui element
			change: funcchange.bind(null,triggdata[attr][0]),
			//replace the uiopt also but including the default value
			remove: funcremove.bind(null,triggdata[attr][0],triggdata[attr][1])
		};
		
	}
	
	//finally we register our attributes
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
/**
 *  jCheetah ajax module
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
	
	//This is not very readable but increases efficiency as new instances of RegExp don't
	//need to be created each time
	var encoders = [/\>/g,/\</g,/\>\=/g,/\<\=/g,/\=\=/g,/\!\=/g,/"/g]
	
	/**
	 * Encodes a string so that is not noticed as HTML
	 */
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
	/**
	 * Decodes string so that it's not noticed as HTML
	 */
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
		
		//if we didn't got an item we return undefined
		if (typeof(item) === "undefined") {
			return undefined;
		};
		
		var decoded_val = valDecode(item);
		//console.debug("evaluating...",decoded_val);
		//We check the condition inside the window
		var outitem = new Function("return (" + decoded_val + ")").call(window);
		
		return outitem;
	};
	
	var ajaxDesignerRegs = [/\{\{ +/g,/ +\}\}/g,/\{\{end/gi,/\{\{%/g,/%\}\}/g,/\{\{[a-z|A-Z].+?\}\}/g,
		/\{\{if +/gi,/\}\}/g,/\{\{out +/gi,/\{\{foreach +/gi
	]
	/**
	 * Function to make the designs
	 * @param object the object that will be used
	 * @param structure the string/NodeList/array that will create the design
	 * @param object_name the name of the object inside javascript
	 */
	var ajaxDesigner = function(object,structure,object_name,is_child) {
		
		if (typeof(is_child) === "undefined") {
			//We create a variable to store a possible existant previous
			//element in the place we're going to put this new object
			var _prev_obj = window[object_name];
			window[object_name] = object;
		}
	  
		//console.debug("designer got",structure);
		
		//We set the structure that will be out
		var out_struct = new String();
		//we get the html
		var html = structure;
		
		//if the type of it is a string
		if (typeof(structure) === "string") {
			
			var prepared = structure
			//removing the spaces between {{ }} so that {{   if whatever }} becomes {{if whatever}}
			//	/\{\{ +/g				/ +\}\}/g
			.replace(ajaxDesignerRegs[0],'{{').replace(ajaxDesignerRegs[1],'}}')
			//{{endforeach}} and {{endif}} become {{/endforeach}} and {{/if}}
			//	/\{\{end/gi
			.replace(ajaxDesignerRegs[2],"{{/")
			//{{% var %}} becomes {{OUT var}}{{/OUT}}
			// 	/\{\{%/g				/%\}\}/g
			.replace(ajaxDesignerRegs[3],"{{out ").replace(ajaxDesignerRegs[4],"}}{{/out}}");
			
			//Now we're going to check for designer tags enclosed {{}} data
			//				/\{\{[a-z|A-Z].+?\}\}/g
			var matches = prepared.match(ajaxDesignerRegs[5]);
			
			//if we've got them
			if (matches !== null) {
				
				//for each one of those tags we're going to reparse it
				matches.forEach(function(dtag){
					
					//Here we will save the data
					var dtagparsed;
					
					//if it's an if tag
					//		/\{\{if +/gi
					if (dtag.search(ajaxDesignerRegs[6]) == 0) {
						//let's get it's test value
						//				/\{\{if +/gi			/\}\}/g
						var test = valEncode(dtag.replace(ajaxDesignerRegs[6],"").replace(ajaxDesignerRegs[7],""));
						if (test.length == 0) {
							throw new SyntaxError("Wrong designer syntax in " + dtag);
							return;
						}
						dtagparsed = "{{if test='" + test + "'}}";
					
					//if it's an out tag
					//			/\{\{out +/gi	
					} else if (dtag.search(ajaxDesignerRegs[8]) == 0) {
						
						//let's check what it outputs
						//				    /\{\{out +/gi		/\}\}/g
						var value = valEncode(dtag.replace(ajaxDesignerRegs[8],"").replace(ajaxDesignerRegs[7],""));
						if (value.length == 0) {
							throw new SyntaxError("Wrong designer syntax in {{% %}}");
							return;
						}
						dtagparsed = "{{out value='" + value + "'}}";
					
					//othewrise if it's a foreach tag
					//			/\{\{foreach +/gi
					} else if (dtag.search(ajaxDesignerRegs[9]) == 0) {
						
						//let's check what it contains
						//			 /\{\{foreach +/gi		/\}\}/g
						var data = dtag.replace(ajaxDesignerRegs[9],"").replace(ajaxDesignerRegs[7],"");
						try {
							//We split in the as element like "json.data as index => val"
							var as_split = data.split("as");
							//the key and value is what we get in the end index => val
							var keyval = as_split.pop();
							
							//Now the reason we're joining with as is because someone may
							//have written something as json.astuff.asotherstuff as ...
							//it'd be splitted many times, we need to get that back
							var items = valEncode(as_split.join("as").trim());
							
							//we get the key and value
							var keyvalsplitted = keyval.split("=>");
							var key = keyvalsplitted[0].trim();
							var val = keyvalsplitted[1].trim();
							
						} catch (e) {
							throw new SyntaxError("Wrong designer syntax in " + dtag);
							return;
						}
						//and we write the tag if succeds
						dtagparsed = "{{foreach items='" + items + "' key='" + key + "' val='" + val + "'}}";
					
					//otherwise if we didn't get a match
					} else {
						//This is an error
						throw new SyntaxError("Unknown tag style " + dtag);
					}
					//now we're replacing that match
					prepared = prepared.replace(dtag,dtagparsed);
				});
			}
			
			//console.debug("prepared",prepared);
			
			//We need to parse it, revoving the < > " & tags to avoid the elements to be understood
			//as html, also using {{ and }} as < and > to present them as tag
			var escaped = valEscape(prepared);
			html = $.parseHTML(escaped);
		}
		
		//If we actually get something
		if (html !== null) {
		
			//We start looping in those HTMLElements
			for (var i = 0; i < html.length ; i++) {
			
				//We get the element
				var element = html[i];
				//The tagName
				var tagName = html[i].nodeName;
				//The attributes
				var attributes = html[i].attributes;
				//And the contents, or the nodes that it's composed by
				var contents = html[i].childNodes;
			
				if (tagName == "OUT") {
					
					var value;
					//then we get the value
				    if (typeof(attributes['value']) !== "undefined") {
					  var value = getVal(object,attributes['value'].value,object_name);
					}
					
					if (typeof(value) !== "undefined") {
						//we add it to the structure
						out_struct += value;
					};
				
				//if the name of the tag is for if
				} else if (tagName == "IF") {
					
					//we need to get the condition
					var condition = attributes['test'].value;
					
					//We create a variable to store a possible existant previous
					//object in the place we're going to put this new object
					var _prev_obj = window[object_name];
					window[object_name] = object;
					
					//We check the condition inside the window
					var condition_val = getVal(object,condition,object_name);
					//console.debug(condition,"evaluates to",condition_val);
					
					//We delete the object
					delete window[object_name];
					//and put it in its previous state
					window[object_name] = _prev_obj;
					
					//if the condition evaluates to true
					if (condition_val) {
						//we add whatever was inside, using its contents
						out_struct += ajaxDesigner(object,contents,object_name,true);
					};
					
				//if it's actually a foreach
				} else if (tagName == "FOREACH") {
					
					//we get the key, val and items we want to loop
					var key = attributes['key'].value;
					var val = attributes['val'].value;
					var items = getVal(object,attributes['items'].value,object_name);
					
					//saving dummies for the previous key and variable in the window
					var _prev_key;
					if (typeof(key) !== "undefined" && key != "") {
						_prev_key = window[key];
					}
					var _prev_val;
					if (typeof(val) !== "undefined" && val != "") {
						_prev_val = window[val];
					}
					
					//And now we loop inside those items
					$.each(items,function(_key,_val){
						
						//if the type is not undefined and the name for
						//the key exists and is not an empty string
						if (typeof(key) !== "undefined" && key != "") {
							//we add it
							window[key] = _key;
						}
						
						//same for the value
						if (typeof(val) !== "undefined" && val != "") {
							window[val] = _val;
						}
						
						//the outer struct gets that content adds as many times for this each
						out_struct += ajaxDesigner(object,contents,object_name,true);
					});
					
					//We put variables on its previous state if they were changed
					if (typeof(key) !== "undefined" && key != "") {
						delete window[key];
						window[key] = _prev_key;
					}
					if (typeof(val) !== "undefined" && val != "") {
						delete window[val];
						window[val] = _prev_val;
					}
				
				//Otherwise is the element is just text
				} else if (element instanceof Text){
					
					//we add that text
					out_struct += element.data;
				
				//Otherwise is is just a random HTMLElement
				} else {
					//Which shouldn't even happen, but anyway...
					throw new Error("unknown designer tag: " + element.tagName);
				};
			};
			
			//if this is a child, say an instance of this function called by this function
			if (typeof(is_child) === "boolean" && is_child) {
				//We return it as it is
				return out_struct;
			//if this is the main called function and the user expects a string result
			} else {
				//We reparse it
				return valUnescape(out_struct);
				
				//We delete the object
				delete window[object_name];
				//and put it in its previous state
				window[object_name] = _prev_obj;
			}
		
		};
		
		//This is returned when the designer gets a null html
		return "";
	};
	
	$.jCheetah.modules.ajax.load = function(index,element) {
		
		//THE SETTINGS FOR THE LOAD AND ITS OPTIONS
		if (typeof(element.attributes['data-ajax-load']) !== "undefined") {
			
			console.debug("AJAX: loading ajax over",element);
				
			var $this = $(element);
				
			var ajax_avoid_first_loads = $.jCheetah.getValue(
					//The element
					element,
					//The wanted attribute
					"data-ajax-avoid-first-loads",
					//The event
					undefined,
					//The accepted types
					["number"],
					//What would you get by default if the attribute doesn't exist?
					undefined,
					//The expected enum
					undefined);
				
			//A variable to know if the user wants to load
			var performLoad = true;
			
			//So we check if the developer set a limit to start loading
			if (typeof(ajax_avoid_first_loads) !== "undefined") {
					
				var current_number = $this.attr("data-ajax-n");
				if (typeof(current_number) === "undefined") {
					current_number = 0;
				}
					
				if (parseInt(current_number) < ajax_avoid_first_loads) {
					$this.attr("data-ajax-n",parseInt(current_number) + 1);
						performLoad = false;
							
					console.debug("AJAX: not performing load as it was told to be avoided",ajax_avoid_first_loads,"times and this is the",current_number)
				};
			};
				
			//If the load is gonna be performed 
			if (performLoad) {
					
				//We obtain the url we want to load
				var ajax_load = $.jCheetah.getValue(
						//The element
						element,
						//The wanted attribute
						"data-ajax-load",
						//The event
						undefined,
						//The accepted types
						["string"],
						//What would you get by default if the attribute doesn't exist?
						"",
						//The expected enum
						undefined).replace(/::hash::/g,location.hash.replace("#",""));
					
				var ajax_datatype = $.jCheetah.getValue(
						//The element
						element,
						//The wanted attribute
						"data-ajax-datatype",
						//The event
						undefined,
						//The accepted types
						["string"],
						//What would you get by default if the attribute doesn't exist?
						"html",
						//The expected enum
						["json","xml","html","csv"]);
					
				var ajax_designer = $.jCheetah.getValue(
						//The element
						element,
						//The wanted attribute
						"data-ajax-designer",
						//The event
						undefined,
						//The accepted types
						["string"],
						//What would you get by default if the attribute doesn't exist?
						undefined,
						//The expected enum
						undefined);
					
				var ajax_method = $.jCheetah.getValue(
						//The element
						element,
						//The wanted attribute
						"data-ajax-method",
						//The event
						undefined,
						//The accepted types
						["string"],
						//What would you get by default if the attribute doesn't exist?
						"get",
						//The expected enum
						["get","post"]);
				
				//Also some of the data, the queryString
				var ajax_data = $.jCheetah.getValue(
						//The element
						element,
						//The wanted attribute
						"data-ajax-query",
						//The event
						undefined,
						//The accepted types
						["object"],
						//What would you get by default if the attribute doesn't exist?
						{},
						//The expected enum
						undefined);
				
				//We also extend the queryString with the meta data query
				$.extend(ajax_data,$.jCheetah.getValue(
						//The element
						element,
						//The wanted attribute
						"data-ajax-query-_*_",
						//The event
						undefined,
						//The accepted types
						undefined,
						//What would you get by default if the attribute doesn't exist?
						{},
						//The expected enum
						undefined));
				
				var ajax_send_lang = $.jCheetah.getValue(
						//The element
						element,
						//The wanted attribute
						"data-ajax-send-lang",
						//The event
						undefined,
						//The accepted types
						["boolean"],
						//What would you get by default if the attribute doesn't exist?
						false,
						//The expected enum
						undefined)
				
				if (ajax_send_lang) {
					var lang = $.jCheetah.getLang(element);
					if (typeof(lang) !== "undefined") {
						ajax_data["lang"] = lang;
					}
				}
				
				//Then the numerical id
				var ajax_number_id = $.jCheetah.getValue(
						//The element
						element,
						//The wanted attribute
						"data-ajax-number-id",
						//The event
						undefined,
						//The accepted types
						["number"],
						//What would you get by default if the attribute doesn't exist?
						undefined,
						//The expected enum
						undefined);
					
				//if we've got an id we add it to the data
				if (typeof(ajax_number_id) !== "undefined") {
					ajax_data.id = ajax_number_id;
				};
					
				//Then the string filter
				var ajax_filter = $.jCheetah.getValue(
						//The element
						element,
						//The wanted attribute
						"data-ajax-filter",
						//The event
						undefined,
						//The accepted types
						["string"],
						//What would you get by default if the attribute doesn't exist?
						undefined,
						//The expected enum
						undefined);
				
				//if we've got a filter and add it to the data
				if (typeof(ajax_filter) !== "undefined") {
					ajax_data.filter = ajax_filter;
				};
				
				//Also we check if there's a function for callback
				var ajax_onload_done = $.jCheetah.getValue(
						//The element
						element,
						//The wanted attribute
						"data-ajax-onload-done",
						//The event
						undefined,
						//The accepted types
						["function"],
						//What would you get by default if the attribute doesn't exist?
						undefined,
						//The expected enum
						undefined);
					
				//Also we check if there's a function for fail
				var ajax_onload_fail = $.jCheetah.getValue(
						//The element
						element,
						//The wanted attribute
						"data-ajax-onload-fail",
						//The event
						undefined,
						//The accepted types
						["function"],
						//What would you get by default if the attribute doesn't exist?
						undefined,
						//The expected enum
						undefined);
					
				//Also we check if there's a function for always
				var ajax_onload_always = $.jCheetah.getValue(
						//The element
						element,
						//The wanted attribute
						"data-ajax-onload-always",
						//The event
						undefined,
						//The accepted types
						["function"],
						//What would you get by default if the attribute doesn't exist?
						undefined,
						//The expected enum
						undefined);
					
				//We get the item to reload
				var ajax_onload_reload = $.jCheetah.getSelector(
						//The selector
						element,
						//The wanted attribute
						"data-ajax-onload-reload",
						//The event,
						undefined,
						//What would you get by default if the attribute doesn't exist?
						undefined);
					
				//And the input group that will add filters
				var ajax_input_group = $.jCheetah.getSelector(
						//The selector
						element,
						//The wanted attribute
						"data-ajax-input-group",
						//The event
						undefined,
						//What would you get by default if the attribute doesn't exist?
						undefined);
				
				//We check if there is one
				if (typeof(ajax_input_group) !== "undefined") {
					
					//Every item that composes that selector
					$(ajax_input_group).each(function(index,ielement){
							
						var $element = $(ielement);
						
						//And we get the name
						var name = $element.attr("name");
							
						//And try to find the value
						var val;
						//If it's a checkbox or a radio
						if ($element.attr("type") == "checkbox" ||
								$element.attr("type") == "radio") {
								
							//We check if it's checked
							if ($element.is(":checked")) {
								//And if it is, the we get the val
								val = $element.val();
								//But if there's actually no val
								if (typeof(val) === "undefined") {
									//We put an empty string, at least is checked
									val = "";
								};
							};
						//Otherwise if it's an average input group
						} else {
							
							//get the meta attribute for the method, this is for jctype jquery ui widgets
							var retrieve_method = $element.attr('data-jctype-method');
							var retrieve_method_function = $element.attr('data-jctype-method-function');
							var is_jctype = typeof($element.attr('data-jctype')) !== 'undefined'
							
							//if it's a jctype element
							if (typeof(retrieve_method) !== 'undefined' &&
							    typeof(retrieve_method_function) !== 'undefined' &&
							    is_jctype) {
								//set the value
								val = $element[retrieve_method_function](retrieve_method);
							} else {
								//We just put it there
								val = $element.val();
							}
						}
						
						//If we actually got a name and a val
						if (typeof(name) !== "undefined" &&
								typeof(val) !== "undefined") {
							//We add it to the ajax data
							ajax_data[name] = val;
						};
							
					});
				};
					
				console.debug("AJAX: loading ajax",ajax_load,"using data",ajax_data,"expecting",ajax_datatype);

				$[ajax_method](ajax_load,ajax_data,function(response,status,xhr) {
						
					//We get the number of times this thing was tried to reload
					var currentn = $this.attr("data-ajax-n");
					//if this is the first time it loads
					if (typeof(currentn) === "undefined") {
						//Then it's 0
						$this.attr("data-ajax-n",1);
					} else {
						//Otherwise it's the current number + 1
						$this.attr("data-ajax-n",parseInt(currentn) + 1);
					}
						
					if (ajax_datatype === "html") {
						
						$this.html(response);
						
					} else if (ajax_datatype == "json" || ajax_datatype == "xml" ||
							ajax_datatype == "csv") {
						
						console.debug("AJAX: creating json/xml/csv from the designer");
						
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
					
					//The basics are performed
					console.debug("AJAX: performing basic functions over loaded data");
					$this.find('*').jCheetahPerformBasics();
						
					//If we've got something to reload
					if (typeof(ajax_onload_reload) !== "undefined") {
							
						console.debug("AJAX: checking elements to reload",ajax_onload_reload);
						$(ajax_onload_reload).jCheetahLoadAjax();
								
					}
				},ajax_datatype == "csv" ? "text" : ajax_datatype)
					.done(ajax_onload_done)
					.fail(ajax_onload_fail)
					.always(ajax_onload_always);
				};
			};
	};
	
	//----------- FUNCTIONS
	
	$.fn.jCheetahLoadAjax = function() {
		return this.each($.jCheetah.modules.ajax.load);
	}
	
	//------------ TRIGGERS
	
	$.jCheetah.modules.ajax.triggers = {};
	$.jCheetah.modules.ajax.triggers["data-ajax-load"] = {change:$.jCheetah.modules.ajax.load};
	
	//------------ REGISTERING ATTRIBUTES
	
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
		
		//We get which is the request type
		var ajax_request_type = $.jCheetah.getValue(
				//The element
				event.currentTarget,
				//The wanted attribute
				"data-ajax-request-type",
				//The event
				event,
				//The accepted types
				["string"],
				//What would you get by default if the attribute doesn't exist?
				"get",
				//Allowed results
				["get","post"]);
		
		//We obtain the url we want to load
		var ajax_request_url = $.jCheetah.getValue(
				//The element
				event.currentTarget,
				//The wanted attribute
				"data-ajax-request-url",
				//The event
				event,
				//The accepted types
				["string"],
				//What would you get by default if the attribute doesn't exist?
				undefined,
				//Allowed results
				undefined);

		if (typeof(ajax_request_url) === "undefined") {
			throw new Error("Setting 'data-ajax-request-on-events' requires 'data-ajax-request-url' to be set");
		}
		
		//Replacing the hash
		ajax_request_url.replace(/::hash::/g,location.hash.replace("#",""));
		
		var ajax_data =  $.jCheetah.getValue(
				//The element
				event.currentTarget,
				//The wanted attribute
				"data-ajax-request-data-query",
				//The event
				event,
				//The accepted types
				["object"],
				//What would you get by default if the attribute doesn't exist?
				{},
				//Allowed results
				undefined);
		
		//We also extend the queryString with the meta data query
		$.extend(ajax_data,$.jCheetah.getValue(
				//The element
				event.currentTarget,
				//The wanted attribute
				"data-ajax-request-data-query-_*_",
				//The event
				undefined,
				//The accepted types
				undefined,
				//What would you get by default if the attribute doesn't exist?
				{},
				//The expected enum
				undefined));
		
		var ajax_request_send_lang = $.jCheetah.getValue(
				//The element
				event.currentTarget,
				//The wanted attribute
				"data-ajax-request-send-lang",
				//The event
				undefined,
				//The accepted types
				["boolean"],
				//What would you get by default if the attribute doesn't exist?
				false,
				//The expected enum
				undefined)
		
		if (ajax_request_send_lang) {
			var lang = $.jCheetah.getLang(event.currentTarget);
			if (typeof(lang) !== "undefined") {
				ajax_data["lang"] = lang;
			}
		}
		
		var ajax_request_input_group = $.jCheetah.getSelector(
				//The selector
				event.currentTarget,
				//The wanted attribute
				"data-ajax-request-input-group",
				//The event,
				event,
				//What would you get by default if the attribute doesn't exist?
				undefined);
		
		//We check if there is one
		if (typeof(ajax_request_input_group) !== "undefined") {
			
			//Every item that composes that selector
			$(ajax_request_input_group).each(function(item,element){
				
				//And we get the name
				var $element = $(element);
				var name = $element.attr("name");
				
				//And try to find the value
				var val;
				//If it's a checkbox or a radio
				if ($element.attr("type") == "checkbox" ||
						$element.attr("type") == "radio") {
					
					//We check if it's checked
					if ($(element).is(":checked")) {
						//And if it is, the we get the val
						val = $element.val();
						//But if there's actually no val
						if (typeof(val) === "undefined") {
							//We put an empty string, at least is checked
							val = "";
						};
					};
				//Otherwise if it's an average input group
				} else {
					//get the meta attribute for the method
					var retrieve_method = $element.attr('data-jctype-method');
					var retrieve_method_function = $element.attr('data-jctype-method-function');
					var is_jctype = typeof($element.attr('data-jctype')) !== 'undefined'
								
					//if it's a jctype element
					if (typeof(retrieve_method) !== 'undefined' &&
					    typeof(retrieve_method_function) !== 'undefined' &&
					    is_jctype) {
						//set the value
						val = $element[retrieve_method_function](retrieve_method);
					} else {
						//We just put it there
						val = $element.val();
					}
				}
				
				//If we actually got a name and a val
				if (typeof(name) !== "undefined" &&
						typeof(val) !== "undefined") {
					//We add it to the ajax data
					ajax_data[name] = val;
				};
				
			});
		};
		
		//We get the username
		var ajax_request_username = $.jCheetah.getValue(
				//The element
				event.currentTarget,
				//The wanted attribute
				"data-ajax-request-username",
				//The event
				event,
				//The accepted types
				["string"],
				//What would you get by default if the attribute doesn't exist?
				undefined,
				//Allowed results
				undefined);
		
		//and the password
		var ajax_request_password = $.jCheetah.getValue(
				//The element
				event.currentTarget,
				//The wanted attribute
				"data-ajax-request-password",
				//The event
				event,
				//The accepted types
				["string"],
				//What would you get by default if the attribute doesn't exist?
				undefined,
				//Allowed results
				undefined);
		
		//Also the datatype
		var ajax_request_datatype = $.jCheetah.getValue(
				//The element
				event.currentTarget,
				//The wanted attribute
				"data-ajax-request-datatype",
				//The event
				event,
				//The accepted types
				["string"],
				//What would you get by default if the attribute doesn't exist?
				undefined,
				//Allowed results
				undefined);
		
		//And the timeout
		var ajax_request_timeout = $.jCheetah.getValue(
				//The element
				event.currentTarget,
				//The wanted attribute
				"data-ajax-request-timeout",
				//The event
				event,
				//The accepted types
				["number"],
				//What would you get by default if the attribute doesn't exist?
				undefined,
				//Allowed results
				undefined);
		
		//The cross domain
		var ajax_request_cross_domain = $.jCheetah.getValue(
				//The element
				event.currentTarget,
				//The wanted attribute
				"data-ajax-request-cross-domain",
				//The event
				event,
				//The accepted types
				["boolean"],
				//What would you get by default if the attribute doesn't exist?
				false,
				//Allowed results
				undefined);
		
		var ajax_request_global = $.jCheetah.getValue(
				//The element
				event.currentTarget,
				//The wanted attribute
				"data-ajax-request-global",
				//The event
				event,
				//The accepted types
				["boolean"],
				//What would you get by default if the attribute doesn't exist?
				true,
				//Allowed results
				undefined);
		
		var ajax_request_headers = $.jCheetah.getValue(
				//The element
				event.currentTarget,
				//The wanted attribute
				"data-ajax-request-headers",
				//The event
				event,
				//The accepted types
				["object"],
				//What would you get by default if the attribute doesn't exist?
				undefined,
				//Allowed results
				undefined);
		
		var ajax_request_if_modified = $.jCheetah.getValue(
				//The element
				event.currentTarget,
				//The wanted attribute
				"data-ajax-request-if-modified",
				//The event
				event,
				//The accepted types
				["boolean"],
				//What would you get by default if the attribute doesn't exist?
				false,
				//Allowed results
				undefined);
			
		//we get the before send function
		var ajax_request_beforesend = $.jCheetah.getValue(
				//The element
				event.currentTarget,
				//The wanted attribute
				"data-ajax-request-beforesend",
				//The event
				event,
				//The accepted types
				["function"],
				//What would you get by default if the attribute doesn't exist?
				undefined,
				//Allowed results
				undefined);
		
		//Also the request when it's done
		var ajax_request_success = $.jCheetah.getValue(
				//The element
				event.currentTarget,
				//The wanted attribute
				"data-ajax-request-success",
				//The event
				event,
				//The accepted types
				["function"],
				//What would you get by default if the attribute doesn't exist?
				undefined,
				//Allowed results
				undefined);
		
		//And the one for failure
		var ajax_request_error = $.jCheetah.getValue(
				//The element
				event.currentTarget,
				//The wanted attribute
				"data-ajax-request-error",
				//The event
				event,
				//The accepted types
				["function"],
				//What would you get by default if the attribute doesn't exist?
				undefined,
				//Allowed results
				undefined);
		
		//the always one
		var ajax_request_complete = $.jCheetah.getValue(
				//The element
				event.currentTarget,
				//The wanted attribute
				"data-ajax-request-complete",
				//The event
				event,
				//The accepted types
				["function"],
				//What would you get by default if the attribute doesn't exist?
				undefined,
				//Allowed results
				undefined);
		
		var ajax_request_is_local = $.jCheetah.getValue(
				//The element
				event.currentTarget,
				//The wanted attribute
				"data-ajax-request-is-local",
				//The event
				event,
				//The accepted types
				["boolean"],
				//What would you get by default if the attribute doesn't exist?
				undefined,
				//Allowed results
				undefined);
		
		var ajax_request_data_filter = $.jCheetah.getValue(
				//The element
				event.currentTarget,
				//The wanted attribute
				"data-ajax-request-data-filter",
				//The event
				event,
				//The accepted types
				["function"],
				//What would you get by default if the attribute doesn't exist?
				undefined,
				//Allowed results
				undefined);
		
		var ajax_request_jsonp = $.jCheetah.getValue(
				//The element
				event.currentTarget,
				//The wanted attribute
				"data-ajax-request-jsonp",
				//The event
				event,
				//The accepted types
				["string"],
				//What would you get by default if the attribute doesn't exist?
				undefined,
				//Allowed results
				undefined);
		
		var ajax_request_jsonp_callback = $.jCheetah.getValue(
				//The element
				event.currentTarget,
				//The wanted attribute
				"data-ajax-request-jsonp-callback",
				//The event
				event,
				//The accepted types
				["string","function"],
				//What would you get by default if the attribute doesn't exist?
				undefined,
				//Allowed results
				undefined);
		
		var ajax_request_accepts = $.jCheetah.getValue(
				//The element
				event.currentTarget,
				//The wanted attribute
				"data-ajax-request-accepts",
				//The event
				event,
				//The accepted types
				["object"],
				//What would you get by default if the attribute doesn't exist?
				undefined,
				//Allowed results
				undefined);
		
		var ajax_request_async = $.jCheetah.getValue(
				//The element
				event.currentTarget,
				//The wanted attribute
				"data-ajax-request-async",
				//The event
				event,
				//The accepted types
				["boolean"],
				//What would you get by default if the attribute doesn't exist?
				undefined,
				//Allowed results
				undefined);
		
		var ajax_request_cache = $.jCheetah.getValue(
				//The element
				event.currentTarget,
				//The wanted attribute
				"data-ajax-request-cache",
				//The event
				event,
				//The accepted types
				["boolean"],
				//What would you get by default if the attribute doesn't exist?
				undefined,
				//Allowed results
				undefined);
		
		var ajax_request_content_type = $.jCheetah.getValue(
				//The element
				event.currentTarget,
				//The wanted attribute
				"data-ajax-request-content-type",
				//The event
				event,
				//The accepted types
				["boolean"],
				//What would you get by default if the attribute doesn't exist?
				undefined,
				//Allowed results
				undefined);
		
		var ajax_request_converters = $.jCheetah.getValue(
				//The element
				event.currentTarget,
				//The wanted attribute
				"data-ajax-request-converters",
				//The event
				event,
				//The accepted types
				["object"],
				//What would you get by default if the attribute doesn't exist?
				undefined,
				//Allowed results
				undefined);
		
		var ajax_request_context = $.jCheetah.getValue(
				//The element
				event.currentTarget,
				//The wanted attribute
				"data-ajax-request-context",
				//The event
				event,
				//The accepted types
				["object"],
				//What would you get by default if the attribute doesn't exist?
				undefined,
				//Allowed results
				undefined);
		
		var ajax_request_mime_type = $.jCheetah.getValue(
				//The element
				event.currentTarget,
				//The wanted attribute
				"data-ajax-request-mime-type",
				//The event
				event,
				//The accepted types
				["string"],
				//What would you get by default if the attribute doesn't exist?
				undefined,
				//Allowed results
				undefined);
		
		var ajax_request_process_data = $.jCheetah.getValue(
				//The element
				event.currentTarget,
				//The wanted attribute
				"data-ajax-request-process-data",
				//The event
				event,
				//The accepted types
				["boolean"],
				//What would you get by default if the attribute doesn't exist?
				undefined,
				//Allowed results
				undefined);
		
		var ajax_request_script_charset = $.jCheetah.getValue(
				//The element
				event.currentTarget,
				//The wanted attribute
				"data-ajax-request-script-charset",
				//The event
				event,
				//The accepted types
				["string"],
				//What would you get by default if the attribute doesn't exist?
				undefined,
				//Allowed results
				undefined);
		
		var ajax_request_status_code = $.jCheetah.getValue(
				//The element
				event.currentTarget,
				//The wanted attribute
				"data-ajax-request-status-code",
				//The event
				event,
				//The accepted types
				["object"],
				//What would you get by default if the attribute doesn't exist?
				undefined,
				//Allowed results
				undefined);
		
		var ajax_request_traditional = $.jCheetah.getValue(
				//The element
				event.currentTarget,
				//The wanted attribute
				"data-ajax-request-traditional",
				//The event
				event,
				//The accepted types
				["boolean"],
				//What would you get by default if the attribute doesn't exist?
				undefined,
				//Allowed results
				undefined);
		
		var ajax_request_xhr = $.jCheetah.getValue(
				//The element
				event.currentTarget,
				//The wanted attribute
				"data-ajax-request-xhr",
				//The event
				event,
				//The accepted types
				["function"],
				//What would you get by default if the attribute doesn't exist?
				undefined,
				//Allowed results
				undefined);
		
		var ajax_request_xhr_fields = $.jCheetah.getValue(
				//The element
				event.currentTarget,
				//The wanted attribute
				"data-ajax-request-xhr-fields",
				//The event
				event,
				//The accepted types
				["object"],
				//What would you get by default if the attribute doesn't exist?
				undefined,
				//Allowed results
				undefined);
		
		var ajax_request_on_ = $.jCheetah.getValue(
				//The element
				event.currentTarget,
				//The wanted attribute
				"data-ajax-request-on-_*_",
				//The event
				event,
				//The accepted types
				["function"],
				//What would you get by default if the attribute doesn't exist?
				{},
				//Allowed results
				undefined);
		
		//Finally we perform the request with all the data!
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
	
	//Will load the events
	$.jCheetah.modules.ajaxRequestEvents.load = function(index,element){
		
		//And now get the targets
		if (typeof(element.attributes["data-ajax-request-on-events"]) !== "undefined") {
				
			var $element = $(element);
			
			//Check for the given events
			var ajax_request_on_events = $.jCheetah.getValue(
					//The element
					element,
					//The wanted attribute
					"data-ajax-request-on-events",
					//The event
					undefined,
					//The accepted types
					["string"],
					//What would you get by default if the attribute doesn't exist?
					undefined,
					//Allowed results
					undefined);
				
			console.debug("AJAXREQUESTEVENTS: adding bind for target",element,"on events",ajax_request_on_events);
				
			//we're going to bind the whole events
			$element.bind(ajax_request_on_events,defaultAjaxRequestEventHandler)
				.attr("data-ajax-requests-events-binds",ajax_request_on_events);
		};
	};
	
	var unload  = function(index,element) {
		//And now get the targets
		if (typeof(element.attributes["data-ajax-requests-events-binds"]) !== "undefined") {
				
			var $element = $(element);
				
			var binds = $element.attr("data-ajax-requests-events-binds");
				
			if (typeof(binds) !== "undefined") {
				
				console.debug("AJAXREQUESTEVENTS: removing events",binds);
					
				//we're going to unbind the whole events
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
			console.debug("FORMVALIDATEACTIVATION: activating form validation in element",element);
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
			
		//get the current element
		var $this = $(element);
		
		//This is the locale for the element
		var locale = $.jCheetah.getLang(element);
		
		//We check if the regional for the datepicker is defined
		var regional_datepicker_defined = (typeof(locale) !== "undefined") && (typeof($.datepicker.regional[locale]) !== "undefined");
		
		//If the locale is defined but we can't find a regional for it
		//we show an alert
		if (!regional_datepicker_defined && (typeof(locale) !== "undefined")) {
			console.log("INPUT(DATEPICKER): regional for locale",locale,"hasn't been found, using defaults");
		}
					
		var alt_field = $.jCheetah.getSelector(
				//The selector
				element,
				//The wanted attribute
				"data-datepicker-alt-field",
				//The event,
				undefined,
				//What would you get by default if the attribute doesn't exist?
				undefined);
		
		var alt_format = $.jCheetah.getValue(
				//The element
				element,
				//The wanted attribute
				"data-datepicker-alt-format",
				//The event
				undefined,
				//The accepted types
				["string"],
				//What would you get by default if the attribute doesn't exist?
				undefined,
				//Allowed results
				undefined);
					
		var append_text = $.jCheetah.getValue(
				//The element
				element,
				//The wanted attribute
				"data-datepicker-append-text",
				//The event
				undefined,
				//The accepted types
				["string"],
				//What would you get by default if the attribute doesn't exist?
				undefined,
				//Allowed results
				undefined);
				
		var autosize = $.jCheetah.getValue(
				//The element
				element,
				//The wanted attribute
				"data-datepicker-autosize",
				//The event
				undefined,
				//The accepted types
				["boolean"],
				//What would you get by default if the attribute doesn't exist?
				undefined,
				//Allowed results
				undefined);
		
		var before_show = $.jCheetah.getValue(
				//The element
				element,
				//The wanted attribute
				"data-datepicker-before-show",
				//The event
				undefined,
				//The accepted types
				["function"],
				//What would you get by default if the attribute doesn't exist?
				undefined,
				//Allowed results
				undefined);
		
		var before_show_day = $.jCheetah.getValue(
				//The element
				element,
				//The wanted attribute
				"data-datepicker-before-show-day",
				//The event
				undefined,
				//The accepted types
				["function"],
				//What would you get by default if the attribute doesn't exist?
				undefined,
				//Allowed results
				undefined);
		
		var button_image = $.jCheetah.getValue(
				//The element
				element,
				//The wanted attribute
				"data-datepicker-button-image",
				//The event
				undefined,
				//The accepted types
				["function"],
				//What would you get by default if the attribute doesn't exist?
				undefined,
				//Allowed results
				undefined);
		
		var button_image_only = $.jCheetah.getValue(
				//The element
				element,
				//The wanted attribute
				"data-datepicker-button-image-only",
				//The event
				undefined,
				//The accepted types
				["boolean"],
				//What would you get by default if the attribute doesn't exist?
				undefined,
				//Allowed results
				undefined);
			
		var button_text = $.jCheetah.getValue(
				//The element
				element,
				//The wanted attribute
				"data-datepicker-button-text",
				//The event
				undefined,
				//The accepted types
				["string"],
				//What would you get by default if the attribute doesn't exist?
				undefined,
				//Allowed results
				undefined);
		
		var calculate_week = $.jCheetah.getValue(
				//The element
				element,
				//The wanted attribute
				"data-datepicker-calculate-week",
				//The event
				undefined,
				//The accepted types
				["function"],
				//What would you get by default if the attribute doesn't exist?
				undefined,
				//Allowed results
				undefined);
		
		var change_month = $.jCheetah.getValue(
				//The element
				element,
				//The wanted attribute
				"data-datepicker-change-month",
				//The event
				undefined,
				//The accepted types
				["boolean"],
				//What would you get by default if the attribute doesn't exist?
				undefined,
				//Allowed results
				undefined);
		
		var change_year = $.jCheetah.getValue(
				//The element
				element,
				//The wanted attribute
				"data-datepicker-change-year",
				//The event
				undefined,
				//The accepted types
				["boolean"],
				//What would you get by default if the attribute doesn't exist?
				undefined,
				//Allowed results
				undefined);
		
		var close_text = $.jCheetah.getValue(
				//The element
				element,
				//The wanted attribute
				"data-datepicker-close-text",
				//The event
				undefined,
				//The accepted types
				["string"],
				//What would you get by default if the attribute doesn't exist?
				regional_datepicker_defined ?
				$.datepicker.regional[locale].closeText : undefined,
				//Allowed results
				undefined);
		
		var constrain_input = $.jCheetah.getValue(
				//The element
				element,
				//The wanted attribute
				"data-datepicker-constrain-input",
				//The event
				undefined,
				//The accepted types
				["boolean"],
				//What would you get by default if the attribute doesn't exist?
				undefined,
				//Allowed results
				undefined);
		
		var current_text = $.jCheetah.getValue(
				//The element
				element,
				//The wanted attribute
				"data-datepicker-current-text",
				//The event
				undefined,
				//The accepted types
				["string"],
				//What would you get by default if the attribute doesn't exist?
				regional_datepicker_defined ?
				$.datepicker.regional[locale].currentText : undefined,
				//Allowed results
				undefined);
		
		var date_format = $.jCheetah.getValue(
				//The element
				element,
				//The wanted attribute
				"data-datepicker-date-format",
				//The event
				undefined,
				//The accepted types
				["string"],
				//What would you get by default if the attribute doesn't exist?
				regional_datepicker_defined ?
				$.datepicker.regional[locale].dateFormat : undefined,
				//Allowed results
				undefined);
		
		var day_names = $.jCheetah.getValue(
				//The element
				element,
				//The wanted attribute
				"data-datepicker-day-names",
				//The event
				undefined,
				//The accepted types
				["array"],
				//What would you get by default if the attribute doesn't exist?
				regional_datepicker_defined ?
				$.datepicker.regional[locale].dayNames : undefined,
				//Allowed results
				undefined);
		
		var day_names_min = $.jCheetah.getValue(
				//The element
				element,
				//The wanted attribute
				"data-datepicker-day-names-min",
				//The event
				undefined,
				//The accepted types
				["array"],
				//What would you get by default if the attribute doesn't exist?
				regional_datepicker_defined ?
				$.datepicker.regional[locale].dayNamesMin : undefined,
				//Allowed results
				undefined);
		
		var day_names_short = $.jCheetah.getValue(
				//The element
				element,
				//The wanted attribute
				"data-datepicker-day-names-short",
				//The event
				undefined,
				//The accepted types
				["array"],
				//What would you get by default if the attribute doesn't exist?
				regional_datepicker_defined ?
				$.datepicker.regional[locale].dayNamesShort : undefined,
				//Allowed results
				undefined);
					
		var default_date = $.jCheetah.getValue(
				//The element
				element,
				//The wanted attribute
				"data-datepicker-default-date",
				//The event
				undefined,
				//The accepted types
				["object","number","string"],
				//What would you get by default if the attribute doesn't exist?
				undefined,
				//Allowed results
				undefined);
		if (typeof(default_date) === "object") {
			if (!(default_date instanceof Date)) {
				default_date = undefined;
			};
		};
		
		var duration = $.jCheetah.getValue(
				//The element
				element,
				//The wanted attribute
				"data-datepicker-duration",
				//The event
				undefined,
				//The accepted types
				["string","number"],
				//What would you get by default if the attribute doesn't exist?
				undefined,
				//Allowed results
				undefined);
		
		var first_day = $.jCheetah.getValue(
				//The element
				element,
				//The wanted attribute
				"data-datepicker-first-day",
				//The event
				undefined,
				//The accepted types
				["number"],
				//What would you get by default if the attribute doesn't exist?
				regional_datepicker_defined ?
				$.datepicker.regional[locale].firstDay : undefined,
				//Allowed results
				undefined);
		
		var goto_current = $.jCheetah.getValue(
				//The element
				element,
				//The wanted attribute
				"data-datepicker-goto-current",
				//The event
				undefined,
				//The accepted types
				["boolean"],
				//What would you get by default if the attribute doesn't exist?
				undefined,
				//Allowed results
				undefined);
			
		var hide_if_no_prev_next = $.jCheetah.getValue(
				//The element
				element,
				//The wanted attribute
				"data-datepicker-hide-if-no-prev-next",
				//The event
				undefined,
				//The accepted types
				["boolean"],
				//What would you get by default if the attribute doesn't exist?
				undefined,
				//Allowed results
				undefined);
		
		var is_RTL = $.jCheetah.getValue(
				//The element
				element,
				//The wanted attribute
				"data-datepicker-is-RTL",
				//The event
				undefined,
				//The accepted types
				["boolean"],
				//What would you get by default if the attribute doesn't exist?
				regional_datepicker_defined ?
				$.datepicker.regional[locale].isRTL : undefined,
				//Allowed results
				undefined);
		
		var max_date = $.jCheetah.getValue(
				//The element
				element,
				//The wanted attribute
				"data-datepicker-max",
				//The event
				undefined,
				//The accepted types
				["object","number","string"],
				//What would you get by default if the attribute doesn't exist?
				undefined,
				//Allowed results
				undefined);
		if (typeof(max_date) === "object") {
			if (!(max_date instanceof Date)) {
					max_date = undefined;
			};
		};
		
		var min_date = $.jCheetah.getValue(
				//The element
				element,
				//The wanted attribute
				"data-datepicker-min",
				//The event
				undefined,
				//The accepted types
				["object","number","string"],
				//What would you get by default if the attribute doesn't exist?
				undefined,
				//Allowed results
				undefined);
		if (typeof(min_date) === "object") {
			if (!(min_date instanceof Date)) {
				min_date = undefined;
			};
		};
		
		var month_names = $.jCheetah.getValue(
				//The element
				element,
				//The wanted attribute
				"data-datepicker-month-names",
				//The event
				undefined,
				//The accepted types
				["array"],
				//What would you get by default if the attribute doesn't exist?
				regional_datepicker_defined ?
				$.datepicker.regional[locale].monthNames : undefined,
				//Allowed results
				undefined);
		
		var month_names_short = $.jCheetah.getValue(
				//The element
				element,
				//The wanted attribute
				"data-datepicker-month-names-short",
				//The event
				undefined,
				//The accepted types
				["array"],
				//What would you get by default if the attribute doesn't exist?
				regional_datepicker_defined ?
				$.datepicker.regional[locale].monthNamesShort : undefined,
				//Allowed results
				undefined);
		
		var navigation_as_date_format = $.jCheetah.getValue(
				//The element
				element,
				//The wanted attribute
				"data-datepicker-navigation-as-datepicker-format",
				//The event
				undefined,
				//The accepted types
				["boolean"],
				//What would you get by default if the attribute doesn't exist?
				undefined,
				//Allowed results
				undefined);
		
		var next_text = $.jCheetah.getValue(
				//The element
				element,
				//The wanted attribute
				"data-datepicker-next-text",
				//The event
				undefined,
				//The accepted types
				["string"],
				//What would you get by default if the attribute doesn't exist?
				regional_datepicker_defined ?
				$.datepicker.regional[locale].nextText : undefined,
				//Allowed results
				undefined);
		
		var number_of_months = $.jCheetah.getValue(
				//The element
				element,
				//The wanted attribute
				"data-datepicker-number-of-months",
				//The event
				undefined,
				//The accepted types
				["number","array"],
				//What would you get by default if the attribute doesn't exist?
				undefined,
				//Allowed results
				undefined);
			
		var on_change_month_year = $.jCheetah.getValue(
				//The element
				element,
				//The wanted attribute
				"data-datepicker-on-change-month-year",
				//The event
				undefined,
				//The accepted types
				["function"],
				//What would you get by default if the attribute doesn't exist?
				undefined,
				//Allowed results
				undefined);
		
		var on_close = $.jCheetah.getValue(
				//The element
				element,
				//The wanted attribute
				"data-datepicker-on-close",
				//The event
				undefined,
				//The accepted types
				["function"],
				//What would you get by default if the attribute doesn't exist?
				undefined,
				//Allowed results
				undefined);
		
		var on_select = $.jCheetah.getValue(
				//The element
				element,
				//The wanted attribute
				"data-datepicker-on-select",
				//The event
				undefined,
				//The accepted types
				["function"],
				//What would you get by default if the attribute doesn't exist?
				undefined,
				//Allowed results
				undefined);
		
		var prev_text = $.jCheetah.getValue(
				//The element
				element,
				//The wanted attribute
				"data-datepicker-prev-text",
				//The event
				undefined,
				//The accepted types
				["string"],
				//What would you get by default if the attribute doesn't exist?
				regional_datepicker_defined ?
				$.datepicker.regional[locale].prevText : undefined,
				//Allowed results
				undefined);
		
		var select_other_months = $.jCheetah.getValue(
				//The element
				element,
				//The wanted attribute
				"data-datepicker-select-other-months",
				//The event
				undefined,
				//The accepted types
				["boolean"],
				//What would you get by default if the attribute doesn't exist?
				undefined,
				//Allowed results
				undefined);
		
		var short_year_cutoff = $.jCheetah.getValue(
				//The element
				element,
				//The wanted attribute
				"data-datepicker-short-year-cutoff",
				//The event
				undefined,
				//The accepted types
				["number","string"],
				//What would you get by default if the attribute doesn't exist?
				undefined,
				//Allowed results
				undefined);
		
		var show_anim = $.jCheetah.getValue(
				//The element
				element,
				//The wanted attribute
				"data-datepicker-show-anim",
				//The event
				undefined,
				//The accepted types
				["string"],
				//What would you get by default if the attribute doesn't exist?
				undefined,
				//Allowed results
				undefined);
		
		var show_button_panel = $.jCheetah.getValue(
				//The element
				element,
				//The wanted attribute
				"data-datepicker-show-button-panel",
				//The event
				undefined,
				//The accepted types
				["boolean"],
				//What would you get by default if the attribute doesn't exist?
				undefined,
				//Allowed results
				undefined);
		
		var show_current_at_pos = $.jCheetah.getValue(
				//The element
				element,
				//The wanted attribute
				"data-datepicker-show-current-at-pos",
				//The event
				undefined,
				//The accepted types
				["number"],
				//What would you get by default if the attribute doesn't exist?
				undefined,
				//Allowed results
				undefined);
		
		var show_month_after_year = $.jCheetah.getValue(
				//The element
				element,
				//The wanted attribute
				"data-datepicker-show-month-after-year",
				//The event
				undefined,
				//The accepted types
				["boolean"],
				//What would you get by default if the attribute doesn't exist?
				regional_datepicker_defined ?
				$.datepicker.regional[locale].showMonthAfterYear : undefined,
				//Allowed results
				undefined);
		
		var show_on = $.jCheetah.getValue(
				//The element
				element,
				//The wanted attribute
				"data-datepicker-show-on",
				//The event
				undefined,
				//The accepted types
				["string"],
				//What would you get by default if the attribute doesn't exist?
				undefined,
				//Allowed results
				undefined);
		
		var show_options = $.jCheetah.getValue(
				//The element
				element,
				//The wanted attribute
				"data-datepicker-show-options",
				//The event
				undefined,
				//The accepted types
				["object"],
				//What would you get by default if the attribute doesn't exist?
				undefined,
				//Allowed results
				undefined);
		
		var show_other_months = $.jCheetah.getValue(
				//The element
				element,
				//The wanted attribute
				"data-datepicker-show-other-months",
				//The event
				undefined,
				//The accepted types
				["boolean"],
				//What would you get by default if the attribute doesn't exist?
				undefined,
				//Allowed results
				undefined);
		
		var show_week = $.jCheetah.getValue(
				//The element
				element,
				//The wanted attribute
				"data-datepicker-show-week",
				//The event
				undefined,
				//The accepted types
				["boolean"],
				//What would you get by default if the attribute doesn't exist?
				undefined,
				//Allowed results
				undefined);
		
		var step_months = $.jCheetah.getValue(
				//The element
				element,
				//The wanted attribute
				"data-datepicker-step-months",
				//The event
				undefined,
				//The accepted types
				["number"],
				//What would you get by default if the attribute doesn't exist?
				undefined,
				//Allowed results
				undefined);
		
		var week_header = $.jCheetah.getValue(
				//The element
				element,
				//The wanted attribute
				"data-datepicker-week-header",
				//The event
				undefined,
				//The accepted types
				["number"],
				//What would you get by default if the attribute doesn't exist?
				regional_datepicker_defined ?
				$.datepicker.regional[locale].weekHeader : undefined,
				//Allowed results
				undefined);
		
		var year_range = $.jCheetah.getValue(
				//The element
				element,
				//The wanted attribute
				"data-datepicker-year-range",
				//The event
				undefined,
				//The accepted types
				["string"],
				//What would you get by default if the attribute doesn't exist?
				undefined,
				//Allowed results
				undefined);
		
		var year_suffix = $.jCheetah.getValue(
				//The element
				element,
				//The wanted attribute
				"data-datepicker-year-suffix",
				//The event
				undefined,
				//The accepted types
				["string"],
				//What would you get by default if the attribute doesn't exist?
				regional_datepicker_defined ?
				$.datepicker.regional[locale].yearSuffix : undefined,
				//Allowed results
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
	
	//The function for change takes by default (at the end) a new value
	var funcchange = function(uiopt,index,element,newValue){
				if (typeof(element.attributes["data-is-datepicker"]) !== "undefined") {
					$(element).datepicker("option",uiopt,newValue);
				}
			}
	
	//And the remove, we would get the default value via $.datepicker._defaults
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
	
		//We're going to add a trigger for that attribute
		$.jCheetah.modules.input.triggers[attr] = {
			//and replace the uiopt attribute with the option for that ui element
			change: funcchange.bind(null,triggdata[attr]),
			//replace the uiopt also but including the default value
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
	
	
})(jQuery);$(document).ready(function(){
	$.jCheetah.load();
});