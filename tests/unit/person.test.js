const assert = require('assert');
const Person = require('../../js/core/Person.js');
const House = require('../../js/core/House.js');

describe('Person Class', () => {
    let person, house1, house2;
    
    beforeEach(() => {
        // Reset ID counter for consistent test results
        Person.idCounter = 0;
        House.idCounter = 0;
        
        person = new Person(500000);
        house1 = new House(400000, 400000); // Value: 400k
        house2 = new House(800000, 800000); // Value: 800k
    });

    describe('constructor', () => {
        it('should create person with correct properties', () => {
            assert.strictEqual(person.id, 'person_1');
            assert.strictEqual(person.wealth, 500000);
            assert.strictEqual(person.house, null);
            assert.strictEqual(person.yearEntered, 2025);
        });

        it('should assign unique IDs', () => {
            const person2 = new Person(300000);
            assert.strictEqual(person2.id, 'person_2');
        });
    });

    describe('canAfford', () => {
        it('should return true when person can afford house', () => {
            assert.strictEqual(person.canAfford(house1), true);
        });

        it('should return false when person cannot afford house', () => {
            assert.strictEqual(person.canAfford(house2), false);
        });

        it('should return true when person wealth equals house value', () => {
            const exactHouse = new House(500000, 500000);
            assert.strictEqual(person.canAfford(exactHouse), true);
        });
    });

    describe('shouldBid', () => {
        it('should bid on affordable house when homeless', () => {
            assert.strictEqual(person.shouldBid(house1, 1.5), true);
        });

        it('should not bid on unaffordable house when homeless', () => {
            assert.strictEqual(person.shouldBid(house2, 1.5), false);
        });

        it('should bid on upgrade when threshold is met', () => {
            // Person owns house1 (400k), house2 (800k) is 2x value
            person.house = house1;
            house1.owner = person;
            
            assert.strictEqual(person.shouldBid(house2, 1.5), false); // Can't afford
            
            // Make person wealthy enough
            person.wealth = 1000000;
            assert.strictEqual(person.shouldBid(house2, 1.5), true); // 800k > 1.5 * 400k = 600k
        });

        it('should not bid when upgrade threshold not met', () => {
            person.house = house1;
            house1.owner = person;
            person.wealth = 1000000;
            
            const smallUpgrade = new House(500000, 500000); // Only 1.25x upgrade
            assert.strictEqual(person.shouldBid(smallUpgrade, 1.5), false);
        });
    });

    describe('getBidAmount', () => {
        it('should always bid full wealth', () => {
            // Reset person wealth to original value since previous test modified it
            person.wealth = 500000;
            assert.strictEqual(person.getBidAmount(), 500000);
        });
    });

    describe('buyHouse and sellHouse', () => {
        it('should handle buying first house', () => {
            person.buyHouse(house1, 350000);
            
            assert.strictEqual(person.house, house1);
            assert.strictEqual(house1.owner, person);
            assert.strictEqual(house1.lastSellingPrice, 350000);
            assert.strictEqual(house1.yearsSinceOwnership, 0);
        });

        it('should handle selling house', () => {
            person.buyHouse(house1, 350000);
            const soldHouse = person.sellHouse();
            
            assert.strictEqual(soldHouse, house1);
            assert.strictEqual(person.house, null);
            assert.strictEqual(house1.owner, null);
        });

        it('should handle buying when already owning (move)', () => {
            // Buy first house
            person.buyHouse(house1, 350000);
            
            // Buy second house (should sell first automatically)
            person.buyHouse(house2, 750000);
            
            assert.strictEqual(person.house, house2);
            assert.strictEqual(house2.owner, person);
            assert.strictEqual(house2.lastSellingPrice, 750000);
            assert.strictEqual(house1.owner, null); // First house should be released
        });
    });
});

// Simple test runner if this file is run directly
if (require.main === module) {
    console.log('Running Person unit tests...');
    
    // Mock describe and it functions for standalone running
    global.describe = (name, fn) => {
        console.log(`\n=== ${name} ===`);
        fn();
    };
    
    global.it = (name, fn) => {
        try {
            fn();
            console.log(`✓ ${name}`);
        } catch (error) {
            console.log(`✗ ${name}: ${error.message}`);
        }
    };
    
    global.beforeEach = (fn) => {
        // Simple beforeEach implementation
        global._beforeEach = fn;
    };
    
    // Run the tests
    const originalDescribe = global.describe;
    global.describe = (name, fn) => {
        console.log(`\n=== ${name} ===`);
        const tests = [];
        const originalIt = global.it;
        
        global.it = (testName, testFn) => {
            tests.push({ name: testName, fn: testFn });
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
    
    // Run all tests
    eval(require('fs').readFileSync(__filename, 'utf8'));
    
    console.log('\nPerson unit tests complete!');
}