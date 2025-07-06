#!/usr/bin/env node

// Load test framework
require('./simple_test_runner.js');

console.log('🏠 Housing Market Simulation - Test Suite');
console.log('=' .repeat(50));

const tests = [
    'tests/unit/person.test.js',
    'tests/unit/house.test.js', 
    'tests/unit/auction.test.js',
    'tests/integration/market.test.js',
    'tests/integration/long_term_market.test.js'
];

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

tests.forEach(testFile => {
    console.log(`\n🧪 Running ${testFile}...`);
    console.log('-'.repeat(40));
    
    try {
        // Reset test counter for each file
        global.getTestResults = () => ({ totalTests: 0, passedTests: 0, failedTests: 0 });
        
        // Load and run the test file
        require(`./${testFile}`);
        
        // Get results from this test file
        const results = global.getTestResults();
        
        totalTests += results.totalTests;
        passedTests += results.passedTests; 
        failedTests += results.failedTests;
        
        console.log(`📊 ${testFile}: ${results.passedTests} passed, ${results.failedTests} failed`);
        
    } catch (error) {
        console.error(`❌ Error running ${testFile}:`);
        console.error(error.message);
        failedTests++;
        totalTests++;
    }
});

console.log('\n' + '='.repeat(50));
console.log('📈 TEST SUMMARY');
console.log('='.repeat(50));
console.log(`Total Tests: ${totalTests}`);
console.log(`✅ Passed: ${passedTests}`);
console.log(`❌ Failed: ${failedTests}`);
console.log(`📊 Success Rate: ${totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : 0}%`);

if (failedTests > 0) {
    console.log('\n⚠️  Some tests failed. Please review the output above.');
    process.exit(1);
} else {
    console.log('\n🎉 All tests passed!');
    process.exit(0);
}