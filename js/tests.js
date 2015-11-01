QUnit.test("hello test", function (assert) {
    assert.ok(1 == "1", "Passed!");
});

QUnit.test("payment calculation test 1", function (assert) {
    var results = weightedPaymentCalculator.calculatePayment([], 0);
    assert.ok(results.length === 1 && results[0] === 0, "Passed!");
});