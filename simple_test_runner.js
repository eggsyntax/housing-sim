// Simple test framework for Node.js
function createTestRunner() {
    let currentSuite = '';
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;
    let beforeEachFn = null;

    function describe(name, fn) {
        currentSuite = name;
        console.log(`\n=== ${name} ===`);
        
        const tests = [];
        const originalIt = global.it;
        
        global.it = (testName, testFn) => {
            tests.push({ name: testName, fn: testFn });
        };
        
        global.beforeEach = (setupFn) => {
            beforeEachFn = setupFn;
        };
        
        fn();
        
        // Run collected tests
        tests.forEach(test => {
            totalTests++;
            if (beforeEachFn) beforeEachFn();
            
            try {
                test.fn();
                console.log(`✓ ${test.name}`);
                passedTests++;
            } catch (error) {
                console.log(`✗ ${test.name}: ${error.message}`);
                failedTests++;
            }
        });
        
        global.it = originalIt;
        beforeEachFn = null;
    }

    function it(name, fn) {
        // This is the standalone version
        totalTests++;
        try {
            fn();
            console.log(`✓ ${name}`);
            passedTests++;
        } catch (error) {
            console.log(`✗ ${name}: ${error.message}`);
            failedTests++;
        }
    }

    function beforeEach(fn) {
        beforeEachFn = fn;
    }

    function getResults() {
        return { totalTests, passedTests, failedTests };
    }

    return { describe, it, beforeEach, getResults };
}

// Set up global test functions
const testRunner = createTestRunner();
global.describe = testRunner.describe;
global.it = testRunner.it;
global.beforeEach = testRunner.beforeEach;
global.getTestResults = testRunner.getResults;

module.exports = testRunner;