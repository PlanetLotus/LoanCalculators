// Feature request:
// User provides different payments and calculator says how much faster you'll pay off the loan, and how much you'll save in interest while doing so.

$(function() {
    $(document).ready(function() {
        loadPayment();
        loadLoans();
    });

    $('body').keyup(function(e) {
        // Update output when Enter key is pressed
        if (e.keyCode === 13) {
            updateOutput();
        }
    });

    $('input').keyup(function(e) { updateOutput(); });

    function loadPayment() {
        var payment = localStorage.getItem('payment');
        if (!payment) {
            return;
        }

        $('#payment-input').val(payment);
    }

    function loadLoans() {
        var json = localStorage.getItem('loans');
        if (!json) {
            return;
        }

        var loans = JSON.parse(json);
        console.log(loans);

        var numLoanRows = $('.loan').length;

        for (var i = 0; i < loans.length; i++) {
            // Fill page with data
            var principal = getMoneyString(loans[i].principal);
            var rate = (loans[i].interest * 100).toFixed(2);

            $('#principal' + (i + 1) + '-input').val(principal);
            $('#rate' + (i + 1) + '-input').val(rate);

            if (i + 1 === numLoanRows) {
                addLoanRow();
                numLoanRows++;
            }
        }

        if (loans.length >= 2) {
            updateOutput(loans);
        }
    }

    function saveData(loans, payment) {
        if (loans) {
            localStorage.setItem('loans', JSON.stringify(loans));
        }

        if (payment) {
            localStorage.setItem('payment', payment);
        }
    }

    function updateOutput(validLoans) {
        if (!validLoans) {
            var loans = $('.loan');
            var numLoans = loans.length;
            var validLoans = [];

            for (var i = 0; i < numLoans; i++) {
                // Check if each row is valid. If 2+ rows are valid, then show output.
                var principal = $('#principal' + (i + 1) + '-input').val();
                var interest = $('#rate' + (i + 1) + '-input').val();

                var loan = getValidRow(principal, interest);
                if (loan !== null) {
                    loan.displayOrder = i;
                    validLoans.push(loan);
                }
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

        var desiredPaymentInput = $('#payment-input').val();
        var desiredPayment = getValidDecimal(desiredPaymentInput);

        var distributions = calculatePayment(validLoans, desiredPayment);

        // Map payment distributions to loans
        for (var i = 0; i < distributions.length; i++) {
            validLoans[i].distribution = +distributions[i].toFixed(2);
        }

        // Restore original order for display
        validLoans.sort(function(a, b) {
            if (a.displayOrder < b.displayOrder) {
                return -1;
            }

            if (a.displayOrder > b.displayOrder) {
                return 1;
            }

            return 0;
        });

        console.log(validLoans);

        for (var i = 0; i < validLoans.length; i++) {
            var distribution = 'Need "Desired Payment Beyond Minimum" to calculate.';

            var newRowHtml =    '<tr>' +
                                    '<td>' + (i + 1) + '</td>' +
                                    '<td>$' + getMoneyString(validLoans[i].monthlyInterest) + '</td>' +
                                    '<td>$' + getMoneyString(validLoans[i].distribution) + '</td>' +
                                '</tr>';

            tableBody.append(newRowHtml);
        }

        // Side effect
        saveData(validLoans, desiredPayment);

        if (validLoans.length === numLoans) {
            addLoanRow();
        }
    }

    function calculatePayment(loans, remainder) {
        console.log('Loans: ' + loans.length + ', ' + 'Remainder: ' + remainder);
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

        var loan1Payment = 0;

        // First, make the monthly interest accrued equal
        // Then, if there's any payment leftover, distribute it with a ratio
        if (loans[0].monthlyInterest > loans[1].monthlyInterest) {
            var targetBalance = loans[1].monthlyInterest * 12 / loans[0].interest;
            var paymentToReachTarget = loans[0].principal - targetBalance;

            if (paymentToReachTarget > remainder) {
                var distribution = [remainder];
                for (var i = 1; i < loans.length; i++) {
                    distribution.push(0);
                }

                return distribution;
            } else {
                loan1Payment = paymentToReachTarget;
                remainder -= loan1Payment;
            }
        }

        var distribution = getPaymentDistribution(loans[0].interest, loans[1].interest, remainder);
        var newRemainder = remainder - distribution[0];
        loan1Payment += distribution[0];
        return [loan1Payment].concat(calculatePayment(loans.slice(1, loans.length), newRemainder));
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

        return { principal: principal, interest: interestDecimal, monthlyInterest: +(principal * interestDecimal / 12).toFixed(2) };
    }

    function getValidDecimal(decimal) {
        decimal = decimal.replace(/[^\d\.]+/g, '');

        if (decimal.length === 0) {
            return null;
        }

        return +decimal;
    }

    function getMoneyString(value) {
        valueString = value.toFixed(2);

        if (value < 10000) {
            return valueString;
        }

        var decimalIndex = valueString.indexOf('.');
        var hundredsIndex = decimalIndex - 3;

        // There are (x - 1) / 3 (rounded to nearest whole number) commas
        var numDecimalChars = 3;
        var numCommas = Math.floor((valueString.length - numDecimalChars - 1) / 3);

        // The first comma is inserted where the hundreds place is now
        valueString = valueString.substr(0, hundredsIndex) + ',' + valueString.substr(hundredsIndex);

        var commaIndex = hundredsIndex - 3;

        // The rest of the commas are inserted 3 places before the last comma
        for (var i = 1; i < numCommas; i++) {
            valueString = valueString.substr(0, commaIndex) + ',' + valueString.substr(commaIndex);
            commaIndex -= 3;
        }

        return valueString;
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
                            '               <input type="text" class="form-control" id="principal' + nextLoanNumber + '-input" placeholder="10,000">' +
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
                            '   <div class="col-md-4">' +
                            '       <div class="form-group">' +
                            '           <label class="sr-only" for="minPmt' + nextLoanNumber + '-input">Minimum Payment</label>' +
                            '           <div class="input-group">' +
                            '               <div class="input-group-addon">$</div>' +
                            '               <input type="text" class="form-control" id="minPmt' + nextLoanNumber + '-input" placeholder="10,000">' +
                            '           </div>' +
                            '       </div>' +
                            '   </div>' +
                            '</div>';

        $('#loan-list').append(newLoanHtml);
    }
});
