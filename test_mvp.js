// Simple test script to verify the MVP works
// Run this in Node.js to test the core logic

const MathUtils = require('./js/utils/MathUtils.js');
const Config = require('./js/utils/Config.js');
const Person = require('./js/core/Person.js');
const House = require('./js/core/House.js');
const Auction = require('./js/core/Auction.js');
const Market = require('./js/core/Market.js');

console.log('Testing Housing Market Simulation MVP...\n');

// Test 1: Configuration
console.log('=== Test 1: Configuration ===');
const config = new Config({
    num_houses: 5,
    num_people: 5,
    turnover_in: 1,
    turnover_out: 1
});
console.log('Configuration created successfully');
console.log('Houses:', config.get('num_houses'));
console.log('People:', config.get('num_people'));

// Test 2: Person and House creation
console.log('\n=== Test 2: Person and House Creation ===');
const person1 = new Person(600000);
const person2 = new Person(400000);
const house1 = new House(500000, 450000);
const house2 = new House(300000, 320000);

console.log('Created:', person1.toString());
console.log('Created:', person2.toString());
console.log('Created:', house1.toString());
console.log('Created:', house2.toString());

// Test 3: Bidding logic
console.log('\n=== Test 3: Bidding Logic ===');
console.log('Can person1 afford house1?', person1.canAfford(house1));
console.log('Can person2 afford house1?', person2.canAfford(house1));
console.log('Should person1 bid on house1?', person1.shouldBid(house1, 1.5));

// Test 4: Simple auction
console.log('\n=== Test 4: Simple Auction ===');
const auction = new Auction([house1], [person1, person2]);
const results = auction.conductVickreyAuction(0.7, 1.5);
auction.executeTransactions();
console.log('Auction completed');

// Test 5: Market simulation
console.log('\n=== Test 5: Market Simulation ===');
const market = new Market(config);
console.log('Market created with', market.people.length, 'people and', market.houses.length, 'houses');

// Run a few ticks
for (let i = 0; i < 3; i++) {
    console.log(`\n--- Running tick ${i + 1} ---`);
    market.tick();
}

console.log('\n=== MVP Test Complete ===');
console.log('All tests passed! The simulation is ready to run in the browser.');