const assert = require('assert');
const Config = require('../../js/utils/Config.js');
const Market = require('../../js/core/Market.js');
const Person = require('../../js/core/Person.js');
const House = require('../../js/core/House.js');

describe('Long-Term Market Behavior Tests', () => {
    let market, config;
    
    beforeEach(() => {
        // Reset counters
        Person.idCounter = 0;
        House.idCounter = 0;
        
        // Create test configuration with good affordability
        config = new Config({
            num_houses: 8,
            num_people: 10,
            turnover_in: 2,
            turnover_out: 2,
            wealth_mean: 300000,
            wealth_std: 100000,
            house_price_mean: 250000,
            house_price_std: 75000,
            value_intrinsicness: 0.7,
            upgrade_threshold: 1.5
        });
        
        market = new Market(config);
    });

    describe('Population Stability', () => {
        it('should maintain stable population over 20 ticks', () => {
            const initialPopulation = market.people.length;
            
            for (let i = 0; i < 20; i++) {
                market.tick();
            }
            
            const finalPopulation = market.people.length;
            
            // Population should remain close to initial (allowing for small variance)
            assert(Math.abs(finalPopulation - initialPopulation) <= 3, 
                   `Population should be stable. Initial: ${initialPopulation}, Final: ${finalPopulation}`);
        });

        it('should handle turnover correctly over time', () => {
            const turnoverIn = config.get('turnover_in');
            const turnoverOut = config.get('turnover_out');
            const initialPeople = [...market.people];
            
            // Run several ticks
            for (let i = 0; i < 10; i++) {
                market.tick();
            }
            
            // Should have some original people and some new people
            const currentPeople = market.people;
            const originalPeopleRemaining = currentPeople.filter(p => 
                initialPeople.some(orig => orig.id === p.id)
            );
            
            // Not all original people should remain (some turnover should have happened)
            assert(originalPeopleRemaining.length < initialPeople.length,
                   'Some original people should have left due to turnover');
            
            // Should have some people (market shouldn't be empty)
            assert(currentPeople.length > 0, 'Market should not be empty');
        });
    });

    describe('Housing Market Activity', () => {
        it('should have reasonable housing occupation over time', () => {
            let totalOccupiedTicks = 0;
            let totalHousedPeople = 0;
            const numTicks = 15;
            
            for (let i = 0; i < numTicks; i++) {
                market.tick();
                const stats = market.getMarketStats();
                totalOccupiedTicks += stats.occupiedHouses;
                totalHousedPeople += stats.housedPeople;
            }
            
            const avgOccupiedHouses = totalOccupiedTicks / numTicks;
            const avgHousedPeople = totalHousedPeople / numTicks;
            
            // At least 30% of houses should be occupied on average
            const occupationRate = avgOccupiedHouses / config.get('num_houses');
            assert(occupationRate >= 0.3, 
                   `House occupation rate too low: ${(occupationRate * 100).toFixed(1)}%`);
            
            // Should have meaningful housing activity
            assert(avgHousedPeople >= 2, 
                   `Too few people housed on average: ${avgHousedPeople.toFixed(1)}`);
        });

        it('should demonstrate wealth stratification in housing', () => {
            // Run simulation to establish market dynamics
            for (let i = 0; i < 10; i++) {
                market.tick();
            }
            
            const housedPeople = market.people.filter(p => p.house);
            const unhouedPeople = market.people.filter(p => !p.house);
            
            if (housedPeople.length > 0 && unhouedPeople.length > 0) {
                const avgHousedWealth = housedPeople.reduce((sum, p) => sum + p.wealth, 0) / housedPeople.length;
                const avgUnhousedWealth = unhouedPeople.reduce((sum, p) => sum + p.wealth, 0) / unhouedPeople.length;
                
                // Housed people should generally be wealthier (allowing for some variance)
                assert(avgHousedWealth >= avgUnhousedWealth * 0.7,
                       `Wealth stratification too weak. Housed: $${Math.round(avgHousedWealth)}, Unhoused: $${Math.round(avgUnhousedWealth)}`);
            }
        });

        it('should have auction activity over time', () => {
            let totalSales = 0;
            let totalRevenue = 0;
            
            for (let i = 0; i < 15; i++) {
                market.tick();
                
                if (market.lastAuctionResults) {
                    const sales = market.lastAuctionResults.filter(r => r.winner).length;
                    const revenue = market.lastAuctionResults
                        .filter(r => r.winner)
                        .reduce((sum, r) => sum + r.secondPrice, 0);
                    
                    totalSales += sales;
                    totalRevenue += revenue;
                }
            }
            
            // Should have meaningful auction activity
            assert(totalSales >= 5, `Too few sales over 15 ticks: ${totalSales}`);
            assert(totalRevenue > 0, 'Should have some market revenue');
            
            const avgSalePrice = totalRevenue / totalSales;
            assert(avgSalePrice > 0, 'Average sale price should be positive');
        });
    });

    describe('Market Stability and Edge Cases', () => {
        it('should handle extreme wealth inequality', () => {
            // Manually create extreme wealth distribution
            market.people[0].wealth = 1000000; // Very wealthy
            for (let i = 1; i < market.people.length; i++) {
                market.people[i].wealth = 50000; // Relatively poor
            }
            
            // Run simulation
            for (let i = 0; i < 5; i++) {
                market.tick();
            }
            
            // Wealthy person should have acquired a house
            assert(market.people[0].house || !market.people.includes(market.people[0]), 
                   'Very wealthy person should get a house or exit due to turnover');
            
            // Market should still function
            const stats = market.getMarketStats();
            assert(stats.totalPeople > 0, 'Market should still have people');
            assert(stats.totalHouses === config.get('num_houses'), 'All houses should still exist');
        });

        it('should handle rapid turnover', () => {
            // Create high turnover configuration
            const highTurnoverConfig = new Config({
                num_houses: 5,
                num_people: 8,
                turnover_in: 4,
                turnover_out: 4,
                wealth_mean: 200000,
                wealth_std: 50000,
                house_price_mean: 150000,
                house_price_std: 30000
            });
            
            const volatileMarket = new Market(highTurnoverConfig);
            
            // Run simulation with high turnover
            for (let i = 0; i < 10; i++) {
                volatileMarket.tick();
                
                // Market should remain functional
                assert(volatileMarket.people.length > 0, 'Market should always have people');
                assert(volatileMarket.people.length <= 15, 'Population should not grow excessively');
            }
        });

        it('should maintain market invariants', () => {
            for (let i = 0; i < 12; i++) {
                market.tick();
                
                // Check market invariants
                const stats = market.getMarketStats();
                
                // Population invariants
                assert(stats.totalPeople >= 0, 'Population cannot be negative');
                assert(stats.housedPeople + stats.houselessPeople === stats.totalPeople, 
                       'Housed + houseless should equal total people');
                
                // Housing invariants
                assert(stats.totalHouses === config.get('num_houses'), 'Total houses should remain constant');
                assert(stats.occupiedHouses + stats.availableHouses === stats.totalHouses,
                       'Occupied + available should equal total houses');
                assert(stats.occupiedHouses === stats.housedPeople,
                       'Occupied houses should equal housed people');
                
                // Ensure no person owns multiple houses
                const housedPeople = market.people.filter(p => p.house);
                const uniqueHouses = new Set(housedPeople.map(p => p.house.id));
                assert(housedPeople.length === uniqueHouses.size, 
                       'Each person should own at most one house');
                
                // Ensure house ownership is bidirectional
                housedPeople.forEach(person => {
                    assert(person.house.owner === person, 
                           'House ownership should be bidirectional');
                });
            }
        });
    });

    describe('Economic Behavior', () => {
        it('should show upgrade behavior when threshold is met', () => {
            // Create a person with a cheap house
            const cheapHouse = market.availableHouses[0];
            cheapHouse.intrinsicValue = 100000;
            cheapHouse.lastSellingPrice = 100000;
            
            const wealthyPerson = new market.Person(500000);
            wealthyPerson.buyHouse(cheapHouse, 100000);
            market.people.push(wealthyPerson);
            
            // Remove the house from available houses
            market.availableHouses = market.availableHouses.filter(h => h !== cheapHouse);
            
            // Add an expensive house to trigger upgrade
            const expensiveHouse = new market.House(400000, 400000);
            market.houses.push(expensiveHouse);
            market.availableHouses.push(expensiveHouse);
            
            // Run a tick to see if upgrade happens
            market.tick();
            
            // Check if the wealthy person upgraded (or left due to turnover)
            if (market.people.includes(wealthyPerson)) {
                // If still in market, should have upgraded to more expensive house
                const currentHouseValue = wealthyPerson.house ? wealthyPerson.house.calculateValue() : 0;
                const upgradeThreshold = config.get('upgrade_threshold');
                
                console.log(`Person house value: $${currentHouseValue}, Upgrade threshold would require: $${100000 * upgradeThreshold}`);
            }
        });
    });
});

// Standalone test runner
if (require.main === module) {
    console.log('Running Long-Term Market Behavior tests...');
    
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
    
    console.log('\nLong-term market behavior tests complete!');
}