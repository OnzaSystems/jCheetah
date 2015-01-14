/**
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
	
})(jQuery);