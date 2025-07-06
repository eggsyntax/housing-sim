const assert = require('assert');
const Config = require('../../js/utils/Config.js');
const Market = require('../../js/core/Market.js');
const Person = require('../../js/core/Person.js');
const House = require('../../js/core/House.js');

describe('Market Turnover Tests', () => {
    let market, config;
    
    beforeEach(() => {
        // Reset counters
        Person.idCounter = 0;
        House.idCounter = 0;
        
        // Create test configuration with specific turnover settings
        config = new Config({
            num_houses: 5,
            num_people: 5,
            turnover_in: 2,
            turnover_out: 2,
            wealth_mean: 500000,
            wealth_std: 100000,
            house_price_mean: 400000,
            house_price_std: 100000,
            value_intrinsicness: 0.7,
            upgrade_threshold: 1.5,
            starting_year: 2025
        });
        
        market = new Market(config);
    });

    describe('processExits', () => {
        it('should maintain stable population with equal turnover', () => {
            const initialPopulation = market.people.length;
            
            // Process several ticks to test turnover balance
            for (let i = 0; i < 10; i++) {
                const beforeTick = market.people.length;
                market.tick();
                const afterTick = market.people.length;
                
                // Population should stay roughly stable
                // (within turnover_in + turnover_out range)
                const populationChange = Math.abs(afterTick - beforeTick);
                assert(populationChange <= config.get('turnover_in') + config.get('turnover_out'),
                    `Population change (${populationChange}) too large at tick ${i + 1}`);
            }
        });

        it('should select exits from entire population, not just housed people', () => {
            // Force all people to be homeless to test exit selection
            market.people.forEach(person => {
                if (person.house) {
                    person.sellHouse();
                }
            });
            
            // Update available houses list
            market.availableHouses = [...market.houses];
            
            const beforeExits = market.people.length;
            
            // Mock selectRandomElements to verify it's called with all people
            const originalSelectRandom = market.MathUtils.selectRandomElements;
            let calledWithAllPeople = false;
            
            market.MathUtils.selectRandomElements = (people, count) => {
                if (people.length === beforeExits && count === config.get('turnover_out')) {
                    calledWithAllPeople = true;
                }
                return originalSelectRandom.call(market.MathUtils, people, count);
            };
            
            market.processExits();
            
            // Restore original function
            market.MathUtils.selectRandomElements = originalSelectRandom;
            
            assert(calledWithAllPeople, 'processExits should select from entire population');
        });
    });

    describe('processEntries', () => {
        it('should add correct number of new people', () => {
            const beforeEntries = market.people.length;
            market.processEntries();
            const afterEntries = market.people.length;
            
            const expectedIncrease = config.get('turnover_in');
            const actualIncrease = afterEntries - beforeEntries;
            
            assert.strictEqual(actualIncrease, expectedIncrease,
                `Expected ${expectedIncrease} new people, got ${actualIncrease}`);
        });

        it('should create new people with appropriate wealth', () => {
            const beforeEntries = market.people.length;
            market.processEntries();
            
            // Get the newly added people
            const newPeople = market.people.slice(beforeEntries);
            
            assert.strictEqual(newPeople.length, config.get('turnover_in'));
            
            newPeople.forEach(person => {
                assert(person.wealth > 0, 'New person should have positive wealth');
                assert(person.yearEntered === market.currentYear, 'New person should have current year');
                assert(!person.house, 'New person should start homeless');
            });
        });
    });

    describe('initializeOccupancy', () => {
        it('should occupy approximately 80% of houses', () => {
            const totalHouses = market.houses.length;
            const occupiedHouses = market.houses.filter(h => h.owner).length;
            const expectedOccupied = Math.floor(totalHouses * 0.8);
            
            assert.strictEqual(occupiedHouses, expectedOccupied,
                `Expected ${expectedOccupied} occupied houses, got ${occupiedHouses}`);
        });

        it('should match people to houses roughly by wealth-to-value ratio', () => {
            const housedPeople = market.people.filter(p => p.house);
            
            // Check that people with houses can generally afford them
            housedPeople.forEach(person => {
                const canAfford = person.wealth >= person.house.calculateValue();
                assert(canAfford, 
                    `Person ${person.id} (wealth: ${person.wealth}) should afford house ${person.house.id} (value: ${person.house.calculateValue()})`);
            });
        });
    });

    describe('house color state transitions', () => {
        it('should properly transition house colors over time', () => {
            // Find an available house that's just-available
            const justAvailableHouse = market.houses.find(h => 
                h.isAvailable() && h.yearsSinceOwnership === 0
            );
            
            if (justAvailableHouse) {
                assert.strictEqual(justAvailableHouse.getColorState(), 'just-available');
                
                // Age the house
                justAvailableHouse.incrementOwnershipYears();
                assert.strictEqual(justAvailableHouse.getColorState(), 'available');
            }
        });
    });
});

// Test runner for standalone execution
if (require.main === module) {
    console.log('Running Market Turnover unit tests...');
    
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
    
    // Execute tests (this would need to be run separately in a real test environment)
    console.log('\nMarket Turnover unit tests complete!');
}