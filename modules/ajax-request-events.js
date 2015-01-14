/**
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
