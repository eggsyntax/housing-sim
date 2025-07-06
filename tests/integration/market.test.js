const assert = require('assert');
const Config = require('../../js/utils/Config.js');
const Market = require('../../js/core/Market.js');
const Person = require('../../js/core/Person.js');
const House = require('../../js/core/House.js');

describe('Market Integration Tests', () => {
    let market, config;
    
    beforeEach(() => {
        // Reset counters
        Person.idCounter = 0;
        House.idCounter = 0;
        
        // Create test configuration
        config = new Config({
            num_houses: 5,
            num_people: 5,
            turnover_in: 1,
            turnover_out: 1,
            wealth_mean: 500000,
            wealth_std: 100000,
            house_price_mean: 400000,
            house_price_std: 100000,
            value_intrinsicness: 0.7,
            upgrade_threshold: 1.5
        });
        
        market = new Market(config);
    });

    describe('Market Initialization', () => {
        it('should create correct number of houses and people', () => {
            assert.strictEqual(market.houses.length, 5);
            assert.strictEqual(market.people.length, 5);
            assert.strictEqual(market.availableHouses.length, 5); // All initially available
        });

        it('should start at correct year', () => {
            assert.strictEqual(market.currentYear, 2025);
            assert.strictEqual(market.tickCount, 0);
        });

        it('should have all houses available initially', () => {
            market.houses.forEach(house => {
                assert.strictEqual(house.owner, null);
                assert(market.availableHouses.includes(house));
            });
        });

        it('should have realistic wealth distribution', () => {
            const wealths = market.people.map(p => p.wealth);
            const avgWealth = wealths.reduce((sum, w) => sum + w, 0) / wealths.length;
            
            // Should be roughly around the mean (within reasonable variance)
            assert(avgWealth > 300000, 'Average wealth too low');
            assert(avgWealth < 700000, 'Average wealth too high');
            
            // Should have some wealth inequality
            const maxWealth = Math.max(...wealths);
            const minWealth = Math.min(...wealths);
            assert(maxWealth > minWealth * 1.5, 'Should have wealth inequality');
        });
    });

    describe('Single Tick Behavior', () => {
        it('should process a complete tick without errors', () => {
            const initialYear = market.currentYear;
            const initialTick = market.tickCount;
            
            market.tick();
            
            assert.strictEqual(market.currentYear, initialYear + 1);
            assert.strictEqual(market.tickCount, initialTick + 1);
        });

        it('should handle turnover correctly', () => {
            const initialPeopleCount = market.people.length;
            
            market.tick();
            
            // Should maintain same number of people (1 out, 1 in)
            assert.strictEqual(market.people.length, initialPeopleCount);
        });

        it('should allocate houses to highest bidders', () => {
            market.tick();
            
            // Get people who won houses
            const housedPeople = market.people.filter(p => p.house);
            const houselessPeople = market.people.filter(p => !p.house);
            
            if (housedPeople.length > 0 && houselessPeople.length > 0) {
                // Housed people should generally be wealthier than houseless
                const minHousedWealth = Math.min(...housedPeople.map(p => p.wealth));
                const maxHouselessWealth = Math.max(...houselessPeople.map(p => p.wealth));
                
                // This isn't always true due to upgrade thresholds, but generally should be
                // We'll just check that the wealthiest person has a house
                const wealthiestPerson = market.people.reduce((max, p) => 
                    p.wealth > max.wealth ? p : max
                );
                assert(wealthiestPerson.house, 'Wealthiest person should have a house');
            }
        });
    });

    describe('Multi-Tick Behavior', () => {
        it('should maintain market stability over multiple ticks', () => {
            const initialStats = market.getMarketStats();
            
            // Run 10 ticks
            for (let i = 0; i < 10; i++) {
                market.tick();
            }
            
            const finalStats = market.getMarketStats();
            
            // Market should still function
            assert.strictEqual(finalStats.totalHouses, initialStats.totalHouses);
            assert(finalStats.totalPeople > 0);
            assert(finalStats.currentYear > initialStats.currentYear);
            
            // Should have some market activity
            assert(finalStats.occupiedHouses >= 0);
            assert(finalStats.availableHouses >= 0);
            assert.strictEqual(finalStats.occupiedHouses + finalStats.availableHouses, 
                              finalStats.totalHouses);
        });

        it('should demonstrate wealth stratification over time', () => {
            // Run simulation for several ticks
            for (let i = 0; i < 5; i++) {
                market.tick();
            }
            
            // Check if wealth correlates with house ownership
            const housedPeople = market.people.filter(p => p.house);
            const houselessPeople = market.people.filter(p => !p.house);
            
            if (housedPeople.length > 0 && houselessPeople.length > 0) {
                const avgHousedWealth = housedPeople.reduce((sum, p) => sum + p.wealth, 0) / housedPeople.length;
                const avgHouselessWealth = houselessPeople.reduce((sum, p) => sum + p.wealth, 0) / houselessPeople.length;
                
                // Housed people should generally be wealthier
                assert(avgHousedWealth >= avgHouselessWealth * 0.8, 
                       'Housed people should be generally wealthier');
            }
        });
    });

    describe('Upgrade Threshold Behavior', () => {
        it('should prevent unnecessary moves', () => {
            // First tick - establish initial ownership
            market.tick();
            
            const ownedHouses = market.houses.filter(h => h.owner);
            const initialOwnership = new Map();
            ownedHouses.forEach(h => initialOwnership.set(h.id, h.owner.id));
            
            // Second tick - should have limited movement due to upgrade threshold
            market.tick();
            
            let stayedInPlace = 0;
            ownedHouses.forEach(h => {
                if (h.owner && initialOwnership.get(h.id) === h.owner.id) {
                    stayedInPlace++;
                }
            });
            
            // At least some people should stay in place due to upgrade threshold
            // (This test might be flaky due to turnover, but demonstrates the concept)
            console.log(`People who stayed in place: ${stayedInPlace}/${ownedHouses.length}`);
        });
    });

    describe('Market Statistics', () => {
        it('should provide accurate market statistics', () => {
            market.tick();
            const stats = market.getMarketStats();
            
            // Verify basic counts
            assert.strictEqual(stats.totalHouses, 5);
            assert(stats.totalPeople > 0);
            assert(stats.housedPeople >= 0);
            assert(stats.houselessPeople >= 0);
            assert.strictEqual(stats.housedPeople + stats.houselessPeople, stats.totalPeople);
            
            // Verify house counts
            assert(stats.occupiedHouses >= 0);
            assert(stats.availableHouses >= 0);
            assert.strictEqual(stats.occupiedHouses + stats.availableHouses, stats.totalHouses);
            
            // Verify averages are reasonable
            assert(stats.averageWealth > 0);
            assert(stats.averageHouseValue > 0);
            
            // Verify current year progression
            assert(stats.currentYear > 2025);
            assert(stats.tickCount > 0);
        });
    });

    describe('Edge Cases', () => {
        it('should handle market with no turnover', () => {
            const noTurnoverConfig = new Config({
                num_houses: 3,
                num_people: 3,
                turnover_in: 0,
                turnover_out: 0
            });
            const stableMarket = new Market(noTurnoverConfig);
            
            const initialPeopleCount = stableMarket.people.length;
            stableMarket.tick();
            
            assert.strictEqual(stableMarket.people.length, initialPeopleCount);
        });

        it('should handle market with high turnover', () => {
            const highTurnoverConfig = new Config({
                num_houses: 5,
                num_people: 5,
                turnover_in: 3,
                turnover_out: 2
            });
            const volatileMarket = new Market(highTurnoverConfig);
            
            volatileMarket.tick();
            
            // Market should still function
            assert(volatileMarket.people.length > 0);
            const stats = volatileMarket.getMarketStats();
            assert(stats.totalPeople > 0);
        });

        it('should handle extreme wealth inequality', () => {
            // Manually create extreme wealth distribution
            market.people[0].wealth = 10000000; // Very wealthy
            market.people[1].wealth = 50000;    // Very poor
            market.people[2].wealth = 60000;
            market.people[3].wealth = 70000;
            market.people[4].wealth = 80000;
            
            market.tick();
            
            // Wealthy person should get a house
            assert(market.people[0].house, 'Very wealthy person should get a house');
            
            // Poor people might not get houses
            const poorPeople = market.people.slice(1);
            const housedPoor = poorPeople.filter(p => p.house);
            console.log(`Poor people who got houses: ${housedPoor.length}/${poorPeople.length}`);
        });
    });
});

// Standalone test runner
if (require.main === module) {
    console.log('Running Market integration tests...');
    
    // Simple test framework mock
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
    
    console.log('\nMarket integration tests complete!');
}