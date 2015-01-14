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
	
})(jQuery);