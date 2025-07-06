const assert = require('assert');
const Config = require('../../js/utils/Config.js');
const Market = require('../../js/core/Market.js');
const Person = require('../../js/core/Person.js');
const House = require('../../js/core/House.js');

// Mock test framework
global.describe = (name, fn) => {
    console.log(`\n=== ${name} ===`);
    const tests = [];
    
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
};

describe('Vacant House Depreciation Tests', () => {
    let house, market, config;
    
    beforeEach(() => {
        // Reset counters
        Person.idCounter = 0;
        House.idCounter = 0;
        
        config = new Config({
            num_houses: 5,
            num_people: 5,
            vacant_depreciation: 0.05 // 5% depreciation
        });
        
        house = new House(100000, 100000); // $100k house
        market = new Market(config);
    });

    describe('House.applyVacantDepreciation', () => {
        it('should depreciate vacant houses', () => {
            // Ensure house is vacant
            assert(house.isAvailable(), 'House should be available/vacant');
            
            const originalValue = house.intrinsicValue;
            house.applyVacantDepreciation(0.05); // 5% depreciation
            
            const expectedValue = originalValue * 0.95; // 95% of original
            assert.strictEqual(house.intrinsicValue, expectedValue, 'Should depreciate by 5%');
        });

        it('should not depreciate occupied houses', () => {
            const person = new Person(150000);
            house.setOwner(person);
            
            const originalValue = house.intrinsicValue;
            house.applyVacantDepreciation(0.05);
            
            assert.strictEqual(house.intrinsicValue, originalValue, 'Occupied house should not depreciate');
        });

        it('should not depreciate below minimum threshold', () => {
            // Start with a very low value house
            const lowValueHouse = new House(500, 500); // $500 house
            
            // Apply high depreciation that would go below $1000 minimum
            lowValueHouse.applyVacantDepreciation(0.9); // 90% depreciation
            
            assert(lowValueHouse.intrinsicValue >= 1000, 'Should not go below $1000 minimum');
        });

        it('should handle zero depreciation rate', () => {
            const originalValue = house.intrinsicValue;
            house.applyVacantDepreciation(0); // No depreciation
            
            assert.strictEqual(house.intrinsicValue, originalValue, 'Should not change with 0% depreciation');
        });
    });

    describe('Market.applyVacantDepreciation', () => {
        it('should depreciate all vacant houses in market', () => {
            // Count initial vacant houses
            const vacantHouses = market.houses.filter(h => h.isAvailable());
            const initialVacantCount = vacantHouses.length;
            
            // Store original values
            const originalValues = vacantHouses.map(h => h.intrinsicValue);
            
            market.applyVacantDepreciation();
            
            // Check that all vacant houses were depreciated
            vacantHouses.forEach((house, index) => {
                const expectedValue = originalValues[index] * 0.95; // 5% depreciation
                assert(Math.abs(house.intrinsicValue - expectedValue) < 0.01, 
                    `House ${house.id} should be depreciated correctly`);
            });
        });

        it('should not affect occupied houses during market depreciation', () => {
            // Find an occupied house
            const occupiedHouse = market.houses.find(h => !h.isAvailable());
            
            if (occupiedHouse) {
                const originalValue = occupiedHouse.intrinsicValue;
                market.applyVacantDepreciation();
                
                assert.strictEqual(occupiedHouse.intrinsicValue, originalValue, 
                    'Occupied house should not be affected by market depreciation');
            }
        });

        it('should work with different depreciation rates', () => {
            // Test with 10% depreciation
            config.set('vacant_depreciation', 0.10);
            
            const vacantHouse = market.houses.find(h => h.isAvailable());
            if (vacantHouse) {
                const originalValue = vacantHouse.intrinsicValue;
                market.applyVacantDepreciation();
                
                const expectedValue = originalValue * 0.90; // 10% depreciation
                assert(Math.abs(vacantHouse.intrinsicValue - expectedValue) < 0.01, 
                    'Should apply 10% depreciation correctly');
            }
        });
    });

    describe('Integration with Market.tick', () => {
        it('should apply depreciation during market tick', () => {
            // Find a vacant house
            const vacantHouse = market.houses.find(h => h.isAvailable());
            
            if (vacantHouse) {
                const originalValue = vacantHouse.intrinsicValue;
                
                // Run a market tick
                market.tick();
                
                // House should be depreciated
                assert(vacantHouse.intrinsicValue < originalValue, 
                    'Vacant house should depreciate during market tick');
                
                const expectedValue = originalValue * 0.95; // 5% depreciation
                assert(Math.abs(vacantHouse.intrinsicValue - expectedValue) < 0.01, 
                    'Should apply correct depreciation amount');
            }
        });

        it('should compound depreciation over multiple ticks', () => {
            // Find a vacant house that stays vacant
            const vacantHouse = market.houses.find(h => h.isAvailable());
            
            if (vacantHouse) {
                const originalValue = vacantHouse.intrinsicValue;
                
                // Run multiple ticks
                market.tick();
                market.tick();
                
                // Should compound: 0.95 * 0.95 = 0.9025
                const expectedValue = originalValue * 0.95 * 0.95;
                
                // Allow for small floating point differences
                assert(Math.abs(vacantHouse.intrinsicValue - expectedValue) < 1, 
                    'Should compound depreciation over multiple years');
            }
        });
    });
});

if (require.main === module) {
    console.log('Running Vacant House Depreciation tests...');
}