$(function() {
	var daysInYear = 365;
	var monthsInYear = 12;
	var decimalRegex = /[0-9.]+/;

	$('body').keyup(function(e) {
		// Update output when Enter key is pressed
		if (e.keyCode === 13) {
			updateOutput();
		}
	});
	$('#principal-input').keyup(function(e) { updateOutput(); });
	$('#rate-input').keyup(function(e) { updateOutput(); });
	
	function updateOutput() {
		var principal = $('#principal-input').val().match(decimalRegex);
		var interest = $('#rate-input').val().match(decimalRegex);
		
		if ($(principal).length === 0 || $(interest).length === 0) {
			return;
		}

		principal = principal[0];
		interest = interest[0];
		
		if (!$.isNumeric(principal) || !$.isNumeric(interest))
			return;
		
		var annualInterest = principal * interest;
		var monthlyInterest = annualInterest / monthsInYear;
		var dailyInterest = annualInterest / daysInYear;
		
		$('#daily-input').text('$' + dailyInterest.toFixed(2));
		$('#monthly-input').text('$' + monthlyInterest.toFixed(2));
		$('#annually-input').text('$' + annualInterest.toFixed(2));
		
		updateSavings(interest);
	}
	
	function updateSavings(interest) {
		var hypotheticalPayment = $('#hypothetical-payment-input').val().match(decimalRegex);
		
		if ($(hypotheticalPayment).length === 0) {
			return;
		}
		
		hypotheticalPayment = hypotheticalPayment[0];
		
		if (!$.isNumeric(hypotheticalPayment)) {
			return;
		}
		
		var annualSavings = hypotheticalPayment / interest;
		var monthlySavings = annualSavings / monthsInYear;
		var dailySavings = annualSavings / daysInYear;
		
		$('#daily-savings').text('$' + dailySavings.toFixed(2) + ' every day.');
		$('#monthly-savings').text('$' + monthlySavings.toFixed(2) + ' every month.');
		$('#annual-savings').text('$' + annualSavings.toFixed(2) + ' every year.');
		
		$('#hypothetical-payment-div').show('fast');
		$('#savings-div').show('fast');
	}
});