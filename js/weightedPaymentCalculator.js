// Feature request:
// User provides different payments and calculator says how much faster you'll pay off the loan, and how much you'll save in interest while doing so.

$(function() {
	$('body').keyup(function(e) {
		// Update output when Enter key is pressed
		if (e.keyCode === 13) {
			updateOutput();
		}
	});
	$('input').keyup(function(e) { updateOutput(); });

	function updateOutput() {
		var loans = $('.loan');
		var numLoans = loans.length;
		var validLoans = [];

		for (var i = 0; i < numLoans; i++) {
			// Check if each row is valid. If 2+ rows are valid, then show output.
			// If all rows are valid, add a row.
			var principal = $('#principal' + (i + 1) + '-input').val();
			var interest = $('#rate' + (i + 1) + '-input').val();

			var loan = getValidRow(principal, interest);
			if (loan !== null) {
				validLoans.push(loan);
			}
		}

		if (validLoans.length < 2) {
			return;
		}

		// Clear table before adding more rows
		var tableBody = $('#loan-output-table > tbody');
		tableBody.empty();

		// Show output
		// Calculate monthly interest and output each loan with this data, sorted by descending interest generated per loan.
		// In this table, also list the current amount that your "extra" payment should go to (if the "Desired Payment Beyond Minimum" is filled out. If not, say "Need 'Desired Payment Beyond Minimum' to calculate").
		validLoans.sort(function(a, b) {
			if (a.monthlyInterest < b.monthlyInterest) {
				return 1;
			}

			if (a.monthlyInterest > b.monthlyInterest) {
				return -1;
			}

			return 0;
		});

		var desiredPayment = getValidDecimal($('#payment-input').val());

		var test = calculatePayment(validLoans, desiredPayment);
		console.log(test);

		for (var i = 0; i < validLoans.length; i++) {
			var distribution = 'Need "Desired Payment Beyond Minimum" to calculate.';

			var newRowHtml =    '<tr>' +
									'<td>' + (i + 1) + '</td>' +
									'<td>$' + validLoans[i].monthlyInterest.toFixed(2) + '</td>' +
									'<td>$' + test[i].toFixed(2) + '</td>' +
								'</tr>';

			tableBody.append(newRowHtml);
		}

		if (validLoans.length === numLoans) {
			addLoanRow();
		}
	}

	function calculatePayment(loans, remainder) {
		if (loans.length < 1) {
			console.log('Ran out of loans. Hopefully this is what normally happens.');
			return [0];
		}

		if (loans.length === 1) {
			return [remainder];
		}

		if (remainder <= 0) {
			console.log('Ran out of remainder.');
			return [0];
		}

		var loan1InterestGeneratedAfterRemainder = (loans[0].principal - remainder) * loans[0].interest / 12;

		if (loan1InterestGeneratedAfterRemainder > getMonthlyInterest(loans[1])) {
			return [remainder, 0];
		} else {
			var distribution = getPaymentDistribution(loans[0].interest, loans[1].interest, remainder);
			var newRemainder = remainder - distribution[0];
			return [distribution[0]].concat(calculatePayment(loans.slice(1, loans.length), newRemainder));
		}
	}

	function getPaymentDistribution(rate1, rate2, payment) {
		var weightFactor = rate1 / rate2;
		var normalizedPayment = 1 + weightFactor;

		var rate2Payment = payment / normalizedPayment;
		var rate1Payment = payment - rate2Payment;

		return [rate1Payment, rate2Payment];
	}

	function getAnnualInterest(loan) {
		return loan.principal * loan.interest;
	}

	function getMonthlyInterest(loan) {
		return getAnnualInterest(loan) / 12;
	}

	function getValidRow(principal, interest) {
		principal = getValidDecimal(principal);
		interest = getValidDecimal(interest);

		if (principal === null || interest === null) {
			return null;
		}

		var interestDecimal = interest / 100;

		return { principal: principal, interest: interestDecimal, monthlyInterest: principal * interestDecimal / 12 };
	}

	function getValidDecimal(decimal) {
		var decimalRegex = /[0-9.]+/;

		decimal = decimal.match(decimalRegex);

		if ($(decimal).length === 0) {
			return null;
		}

		decimal = decimal[0];

		if (!$.isNumeric(decimal)) {
			return null;
		}
		return decimal;
	}

	function addLoanRow() {
		var numLoans = $('.loan').length;
		var nextLoanNumber = numLoans + 1;

		var newLoanHtml =   '<div id="loan' + nextLoanNumber + '" class="row loan">' +
							'   <div class="col-md-4">' +
							'       <div class="form-group">' +
							'           <label class="sr-only" for="principal' + nextLoanNumber + '-input">Principal</label>' +
							'           <div class="input-group">' +
							'               <div class="input-group-addon">$</div>' +
							'               <input type="text" class="form-control" id="principal' + nextLoanNumber + '-input" placeholder="10000">' +
							'           </div>' +
							'       </div>' +
							'   </div>' +
							'   <div class="col-md-4">' +
							'       <div class="form-group">' +
							'           <label class="sr-only" for="rate' + nextLoanNumber + '-input">Interest Rate (Percentage)</label>' +
							'           <div class="input-group">' +
							'               <input type="text" class="form-control" id="rate' + nextLoanNumber + '-input" placeholder="5.0">' +
							'               <div class="input-group-addon">%</div>' +
							'           </div>' +
							'       </div>' +
							'   </div>' +
							'</div>';

		$('#loan-list').append(newLoanHtml);
	}
});
