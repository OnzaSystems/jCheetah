/**
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
})(jQuery);