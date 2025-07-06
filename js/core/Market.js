class Market {
    constructor(config) {
        this.config = config;
        this.people = [];
        this.houses = [];
        this.availableHouses = [];
        this.currentYear = config.get('starting_year');
        this.tickCount = 0;
        
        // Handle dependencies for both browser and Node.js
        this.MathUtils = typeof MathUtils !== 'undefined' ? MathUtils : require('../utils/MathUtils.js');
        this.House = typeof House !== 'undefined' ? House : require('./House.js');
        this.Person = typeof Person !== 'undefined' ? Person : require('./Person.js');
        this.Auction = typeof Auction !== 'undefined' ? Auction : require('./Auction.js');
        
        this.initialize();
    }

    initialize() {
        console.log('=== Initializing Market ===');
        
        // Create houses
        for (let i = 0; i < this.config.get('num_houses'); i++) {
            const intrinsicValue = this.MathUtils.generateGaussian(
                this.config.get('house_price_mean'),
                this.config.get('house_price_std')
            );
            const initialPrice = intrinsicValue; // Start with intrinsic = price
            
            const house = new this.House(intrinsicValue, initialPrice);
            this.houses.push(house);
            this.availableHouses.push(house);
        }

        // Create people
        for (let i = 0; i < this.config.get('num_people'); i++) {
            const wealth = this.MathUtils.generatePowerLawWealth(
                this.config.get('wealth_mean'),
                this.config.get('wealth_std')
            );
            
            const person = new this.Person(wealth, null, this.currentYear);
            this.people.push(person);
        }

        console.log(`Created ${this.houses.length} houses and ${this.people.length} people`);
        console.log(`Available houses: ${this.availableHouses.length}`);
        
        // Show initial wealth distribution
        this.logWealthDistribution();
    }

    tick() {
        this.tickCount++;
        console.log(`\n${'='.repeat(50)}`);
        console.log(`YEAR ${this.currentYear} (Tick ${this.tickCount})`);
        console.log(`${'='.repeat(50)}`);
        
        // Age all house ownerships
        this.houses.forEach(house => house.incrementOwnershipYears());
        
        // Process exits
        this.processExits();
        
        // Process entries
        this.processEntries();
        
        // Conduct auctions
        this.conductAuctions();
        
        // Show market status
        this.showMarketStatus();
        
        // Advance year
        this.currentYear++;
    }

    processExits() {
        const turnoverOut = this.config.get('turnover_out');
        if (turnoverOut === 0) return;
        
        const housedPeople = this.people.filter(person => person.house !== null);
        const exitingPeople = this.MathUtils.selectRandomElements(housedPeople, turnoverOut);
        
        if (exitingPeople.length > 0) {
            console.log(`\n--- People Exiting Market ---`);
            exitingPeople.forEach(person => {
                console.log(`${person.id} exits, selling ${person.house.id}`);
                const house = person.sellHouse();
                if (house) {
                    this.availableHouses.push(house);
                }
            });
            
            // Remove exiting people from market
            this.people = this.people.filter(person => !exitingPeople.includes(person));
        }
    }

    processEntries() {
        const turnoverIn = this.config.get('turnover_in');
        if (turnoverIn === 0) return;
        
        console.log(`\n--- People Entering Market ---`);
        for (let i = 0; i < turnoverIn; i++) {
            const wealth = this.MathUtils.generatePowerLawWealth(
                this.config.get('wealth_mean'),
                this.config.get('wealth_std')
            );
            
            const person = new this.Person(wealth, null, this.currentYear);
            this.people.push(person);
            console.log(`${person.id} enters with wealth ${this.MathUtils.formatCurrency(wealth)}`);
        }
    }

    conductAuctions() {
        if (this.availableHouses.length === 0) {
            console.log('\n--- No Houses Available for Auction ---');
            return;
        }
        
        console.log(`\n--- Conducting Auctions ---`);
        console.log(`Available houses: ${this.availableHouses.length}`);
        
        // For MVP, we'll do single-batch auctions
        const auction = new this.Auction(this.availableHouses, this.people);
        const results = auction.conductVickreyAuction(
            this.config.get('value_intrinsicness'),
            this.config.get('upgrade_threshold')
        );
        
        auction.executeTransactions();
        
        // Remove sold houses from available list
        const soldHouses = auction.getSuccessfulSales().map(result => result.house);
        this.availableHouses = this.availableHouses.filter(house => !soldHouses.includes(house));
        
        // Show auction summary
        const report = auction.generateReport();
        console.log(`\n--- Auction Summary ---`);
        console.log(`Houses sold: ${report.successfulSales}/${report.totalHouses}`);
        console.log(`Total revenue: ${this.MathUtils.formatCurrency(report.totalRevenue)}`);
        console.log(`Average price: ${this.MathUtils.formatCurrency(report.averagePrice)}`);
    }

    showMarketStatus() {
        console.log(`\n--- Market Status ---`);
        console.log(`Total people: ${this.people.length}`);
        console.log(`People with houses: ${this.people.filter(p => p.house).length}`);
        console.log(`People without houses: ${this.people.filter(p => !p.house).length}`);
        console.log(`Available houses: ${this.availableHouses.length}`);
        console.log(`Occupied houses: ${this.houses.filter(h => h.owner).length}`);
        
        // Show wealth distribution
        this.logWealthDistribution();
    }

    logWealthDistribution() {
        const wealths = this.people.map(p => p.wealth).sort((a, b) => b - a);
        if (wealths.length === 0) return;
        
        console.log(`\n--- Wealth Distribution ---`);
        console.log(`Richest: ${this.MathUtils.formatCurrency(wealths[0])}`);
        console.log(`Poorest: ${this.MathUtils.formatCurrency(wealths[wealths.length - 1])}`);
        console.log(`Median: ${this.MathUtils.formatCurrency(wealths[Math.floor(wealths.length / 2)])}`);
        console.log(`Average: ${this.MathUtils.formatCurrency(wealths.reduce((a, b) => a + b, 0) / wealths.length)}`);
    }

    getMarketStats() {
        const housedPeople = this.people.filter(p => p.house);
        const houselessPeople = this.people.filter(p => !p.house);
        const occupiedHouses = this.houses.filter(h => h.owner);
        
        return {
            currentYear: this.currentYear,
            tickCount: this.tickCount,
            totalPeople: this.people.length,
            housedPeople: housedPeople.length,
            houselessPeople: houselessPeople.length,
            totalHouses: this.houses.length,
            occupiedHouses: occupiedHouses.length,
            availableHouses: this.availableHouses.length,
            averageWealth: this.people.reduce((sum, p) => sum + p.wealth, 0) / this.people.length,
            averageHouseValue: this.houses.reduce((sum, h) => sum + h.calculateValue(), 0) / this.houses.length
        };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Market;
}