const assert = require('assert');
const House = require('../../js/core/House.js');
const Person = require('../../js/core/Person.js');

describe('House Class', () => {
    let house, person;
    
    beforeEach(() => {
        House.idCounter = 0;
        Person.idCounter = 0;
        
        house = new House(500000, 450000); // Intrinsic: 500k, Initial price: 450k
        person = new Person(600000);
    });

    describe('constructor', () => {
        it('should create house with correct properties', () => {
            assert.strictEqual(house.id, 'house_1');
            assert.strictEqual(house.intrinsicValue, 500000);
            assert.strictEqual(house.lastSellingPrice, 450000);
            assert.strictEqual(house.owner, null);
            assert.strictEqual(house.yearsSinceOwnership, 0);
        });

        it('should assign unique IDs', () => {
            const house2 = new House(300000, 280000);
            assert.strictEqual(house2.id, 'house_2');
        });
    });

    describe('calculateValue', () => {
        it('should calculate hybrid value correctly with default intrinsicness', () => {
            // Default is 0.7 intrinsic, 0.3 market
            // Expected: 0.7 * 500000 + 0.3 * 450000 = 350000 + 135000 = 485000
            const expectedValue = 0.7 * 500000 + 0.3 * 450000;
            assert.strictEqual(house.calculateValue(), expectedValue);
        });

        it('should calculate hybrid value with custom intrinsicness', () => {
            // 50% intrinsic, 50% market
            // Expected: 0.5 * 500000 + 0.5 * 450000 = 250000 + 225000 = 475000
            const expectedValue = 0.5 * 500000 + 0.5 * 450000;
            assert.strictEqual(house.calculateValue(0.5), expectedValue);
        });

        it('should handle pure intrinsic value', () => {
            assert.strictEqual(house.calculateValue(1.0), 500000);
        });

        it('should handle pure market value', () => {
            assert.strictEqual(house.calculateValue(0.0), 450000);
        });

        it('should update value when selling price changes', () => {
            const originalValue = house.calculateValue();
            
            // Simulate sale at higher price
            house.lastSellingPrice = 600000;
            const newValue = house.calculateValue();
            
            assert(newValue > originalValue, 'Value should increase with higher selling price');
        });
    });

    describe('isAvailable', () => {
        it('should return true when no owner', () => {
            assert.strictEqual(house.isAvailable(), true);
        });

        it('should return false when owned', () => {
            house.owner = person;
            assert.strictEqual(house.isAvailable(), false);
        });
    });

    describe('setOwner', () => {
        it('should set owner and reset ownership years', () => {
            house.yearsSinceOwnership = 5;
            house.setOwner(person);
            
            assert.strictEqual(house.owner, person);
            assert.strictEqual(house.yearsSinceOwnership, 0);
        });
    });

    describe('incrementOwnershipYears', () => {
        it('should increment when owned', () => {
            house.owner = person;
            house.yearsSinceOwnership = 2;
            
            house.incrementOwnershipYears();
            assert.strictEqual(house.yearsSinceOwnership, 3);
        });

        it('should not increment when not owned', () => {
            house.owner = null; // Ensure no owner
            house.yearsSinceOwnership = 2;
            
            house.incrementOwnershipYears();
            assert.strictEqual(house.yearsSinceOwnership, 2);
        });
    });

    describe('getColorState', () => {
        it('should return "available" when not owned and not new', () => {
            house.owner = null; // Ensure not owned
            house.yearsSinceOwnership = 1;
            assert.strictEqual(house.getColorState(), 'available');
        });

        it('should return "just-available" when not owned and new', () => {
            house.owner = null; // Ensure not owned
            house.yearsSinceOwnership = 0;
            assert.strictEqual(house.getColorState(), 'just-available');
        });

        it('should return "occupied" when owned and not new', () => {
            house.owner = person;
            house.yearsSinceOwnership = 1;
            assert.strictEqual(house.getColorState(), 'occupied');
        });

        it('should return "just-occupied" when owned and new', () => {
            house.owner = person;
            house.yearsSinceOwnership = 0;
            assert.strictEqual(house.getColorState(), 'just-occupied');
        });
    });

    describe('getDisplayInfo', () => {
        it('should return complete display information', () => {
            // Mock MathUtils for this test since we're running in Node.js
            const originalMathUtils = global.MathUtils;
            global.MathUtils = {
                formatCurrency: (amount) => `$${Math.round(amount).toLocaleString()}`
            };
            
            house.owner = person;
            house.yearsSinceOwnership = 3;
            
            const info = house.getDisplayInfo();
            
            assert.strictEqual(info.id, 'house_1');
            assert.strictEqual(info.intrinsicValue, 500000);
            assert.strictEqual(info.lastSellingPrice, 450000);
            assert.strictEqual(info.isAvailable, false);
            assert.strictEqual(info.ownerId, 'person_1');
            assert.strictEqual(info.ownerWealth, 600000);
            assert.strictEqual(info.yearsSinceOwnership, 3);
            assert.strictEqual(info.colorState, 'occupied');
            assert(info.formattedIntrinsicValue.includes('$500,000'));
            assert(info.formattedLastPrice.includes('$450,000'));
            
            // Restore original MathUtils
            global.MathUtils = originalMathUtils;
        });
    });
});

// Simple test runner for standalone execution
if (require.main === module) {
    console.log('Running House unit tests...');
    
    // Mock test framework
    global.describe = (name, fn) => {
        console.log(`\n=== ${name} ===`);
        const tests = [];
        const originalIt = global.it;
        
        global.it = (testName, testFn) => {
            tests.push({ name: testName, fn: testFn });
        };
        
        global.beforeEach = (setupFn) => {
            global._beforeEach = setupFn;
        };
        
        fn();
        
        tests.forEach(test => {
            if (global._beforeEach) global._beforeEach();
            try {
                test.fn();
                console.log(`✓ ${test.name}`);
            } catch (error) {
                console.log(`✗ ${test.name}: ${error.message}`);
            }
        });
        
        global.it = originalIt;
    };
    
    // Execute tests
    eval(require('fs').readFileSync(__filename, 'utf8'));
    
    console.log('\nHouse unit tests complete!');
}