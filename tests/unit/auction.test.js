const assert = require('assert');
const Auction = require('../../js/core/Auction.js');
const Person = require('../../js/core/Person.js');
const House = require('../../js/core/House.js');

describe('Auction Class', () => {
    let auction, houses, people;
    
    beforeEach(() => {
        // Reset counters
        Person.idCounter = 0;
        House.idCounter = 0;
        
        // Create test houses
        houses = [
            new House(400000, 400000), // house_1: 400k value
            new House(600000, 600000)  // house_2: 600k value
        ];
        
        // Create test people with different wealth levels
        people = [
            new Person(300000), // person_1: can afford house_1 only
            new Person(500000), // person_2: can afford house_1 only
            new Person(700000)  // person_3: can afford both houses
        ];
        
        auction = new Auction(houses, people);
    });

    describe('constructor', () => {
        it('should create auction with houses and bidders', () => {
            assert.strictEqual(auction.houses.length, 2);
            assert.strictEqual(auction.eligibleBidders.length, 3);
            assert.strictEqual(auction.results.length, 0);
        });
    });

    describe('auctionSingleHouse', () => {
        it('should handle auction with multiple bidders', () => {
            const result = auction.auctionSingleHouse(houses[0], 0.7, 1.5);
            
            // All three people should bid on affordable house_1
            assert.strictEqual(result.bidderCount, 3);
            assert.strictEqual(result.winner, people[2]); // Highest wealth wins
            assert.strictEqual(result.winningBid, 700000);
            assert.strictEqual(result.secondPrice, 500000); // Second highest bid
        });

        it('should handle auction with single bidder', () => {
            const result = auction.auctionSingleHouse(houses[1], 0.7, 1.5);
            
            // Only person_3 can afford house_2
            assert.strictEqual(result.bidderCount, 1);
            assert.strictEqual(result.winner, people[2]);
            assert.strictEqual(result.winningBid, 700000);
            assert.strictEqual(result.secondPrice, 700000 * 0.75); // 75% rule for single bidder
        });

        it('should handle auction with no bidders', () => {
            // Create expensive house no one can afford
            const expensiveHouse = new House(1000000, 1000000);
            const result = auction.auctionSingleHouse(expensiveHouse, 0.7, 1.5);
            
            assert.strictEqual(result.bidderCount, 0);
            assert.strictEqual(result.winner, null);
            assert.strictEqual(result.winningBid, 0);
            assert.strictEqual(result.secondPrice, 0);
        });

        it('should respect already-won constraint', () => {
            const alreadyWon = new Set([people[2]]); // person_3 already won
            const result = auction.auctionSingleHouse(houses[0], 0.7, 1.5, alreadyWon);
            
            // Should exclude person_3 from bidding
            assert.strictEqual(result.bidderCount, 2);
            assert.strictEqual(result.winner, people[1]); // person_2 now wins
            assert.strictEqual(result.secondPrice, 300000); // person_1's bid
        });
    });

    describe('conductVickreyAuction', () => {
        it('should prevent same person winning multiple houses', () => {
            const results = auction.conductVickreyAuction(0.7, 1.5);
            
            assert.strictEqual(results.length, 2);
            
            // Count unique winners
            const winners = results.filter(r => r.winner).map(r => r.winner);
            const uniqueWinners = new Set(winners);
            
            assert.strictEqual(uniqueWinners.size, winners.length, 'Each winner should be unique');
        });

        it('should allocate houses efficiently by wealth', () => {
            const results = auction.conductVickreyAuction(0.7, 1.5);
            
            // Wealthiest person should get most valuable house
            const expensiveHouseResult = results.find(r => r.house === houses[1]);
            assert.strictEqual(expensiveHouseResult.winner, people[2]);
            
            // Second wealthiest gets remaining house
            const cheapHouseResult = results.find(r => r.house === houses[0]);
            assert.strictEqual(cheapHouseResult.winner, people[1]);
        });
    });

    describe('executeTransactions', () => {
        it('should properly transfer ownership', () => {
            const results = auction.conductVickreyAuction(0.7, 1.5);
            auction.executeTransactions();
            
            // Verify ownership transfers
            results.filter(r => r.winner).forEach(result => {
                assert.strictEqual(result.house.owner, result.winner);
                assert.strictEqual(result.winner.house, result.house);
                assert.strictEqual(result.house.lastSellingPrice, result.secondPrice);
                assert.strictEqual(result.house.yearsSinceOwnership, 0);
            });
        });
    });

    describe('upgrade threshold behavior', () => {
        it('should respect upgrade threshold for existing owners', () => {
            // Give person_2 a house worth 400k
            people[1].house = houses[0];
            houses[0].owner = people[1];
            
            // Create a house worth 500k (only 1.25x upgrade)
            const smallUpgrade = new House(500000, 500000);
            const testAuction = new Auction([smallUpgrade], people);
            
            const result = testAuction.auctionSingleHouse(smallUpgrade, 0.7, 1.5);
            
            // person_2 shouldn't bid (1.25x < 1.5x threshold)
            // Only person_3 (homeless) and person_1 (homeless) should bid
            const bidderIds = result.allBids ? result.allBids.map(b => b.person.id) : [];
            assert(!bidderIds.includes('person_2'), 'person_2 should not bid due to upgrade threshold');
        });

        it('should allow bidding when upgrade threshold is met', () => {
            // Give person_1 a house worth 300k
            const cheapHouse = new House(300000, 300000);
            people[0].house = cheapHouse;
            cheapHouse.owner = people[0];
            people[0].wealth = 700000; // Make them wealthy enough
            
            // house_1 (400k) is > 1.5 * 300k = 450k? No, 400k < 450k
            // So person_1 shouldn't bid on house_1
            
            // But house_2 (600k) > 450k, so they should bid if they can afford it
            const result = auction.auctionSingleHouse(houses[1], 0.7, 1.5);
            
            // person_1 should bid (meets upgrade threshold and can afford)
            const bidderIds = result.allBids ? result.allBids.map(b => b.person.id) : [];
            assert(bidderIds.includes('person_1'), 'person_1 should bid when upgrade threshold is met');
        });
    });

    describe('generateReport', () => {
        it('should generate accurate auction report', () => {
            auction.conductVickreyAuction(0.7, 1.5);
            const report = auction.generateReport();
            
            assert.strictEqual(report.totalHouses, 2);
            assert(report.successfulSales >= 0);
            assert(report.failedSales >= 0);
            assert.strictEqual(report.successfulSales + report.failedSales, report.totalHouses);
            assert(report.totalRevenue >= 0);
            assert(report.results.length === 2);
        });
    });
});

// Standalone test runner
if (require.main === module) {
    console.log('Running Auction unit tests...');
    
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
                console.log(`   ${error.stack}`);
            }
        });
        
        global.it = originalIt;
    };
    
    // Execute tests
    eval(require('fs').readFileSync(__filename, 'utf8'));
    
    console.log('\nAuction unit tests complete!');
}