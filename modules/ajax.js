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

})(jQuery);