/**
 * Manages the housing market simulation including people, houses, and auctions.
 * Handles market initialization, turnover, and auction processes.
 */
class Market {
    /**
     * Creates a new Market instance.
     * @param {Config} config - Configuration object containing market parameters
     */
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
        this.AnalyticsHistory = typeof AnalyticsHistory !== 'undefined' ? AnalyticsHistory : require('./AnalyticsHistory.js');
        
        // Initialize analytics history tracking
        this.analyticsHistory = new this.AnalyticsHistory();
        
        this.initialize();
    }

    /**
     * Initializes the market with houses and people, then sets up initial occupancy.
     */
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
        
        // Initialize with 80% occupancy - match people to houses by wealth
        this.initializeOccupancy();
        
        console.log(`After initial occupancy - Available houses: ${this.availableHouses.length}`);
        
        // Show initial wealth distribution
        this.logWealthDistribution();
    }

    /**
     * Sets up initial 80% occupancy by matching people to houses based on wealth.
     */
    initializeOccupancy() {
        // Determine how many houses to initially occupy (80%)
        const numHousesToOccupy = Math.floor(this.houses.length * 0.8);
        
        // Sort houses by value (ascending) and people by wealth (ascending)
        const sortedHouses = [...this.houses].sort((a, b) => a.calculateValue() - b.calculateValue());
        const sortedPeople = [...this.people].sort((a, b) => a.wealth - b.wealth);
        
        console.log(`\n--- Initial Occupancy (${numHousesToOccupy}/${this.houses.length} houses) ---`);
        
        // Match people to houses based on closest wealth-to-value ratio
        for (let i = 0; i < numHousesToOccupy && i < sortedPeople.length; i++) {
            const house = sortedHouses[i];
            const person = sortedPeople[i];
            
            // Set up the ownership
            person.buyHouse(house, house.calculateValue());
            
            // Remove from available houses
            this.availableHouses = this.availableHouses.filter(h => h !== house);
            
            // Reduce console spam for large markets
            if (this.houses.length <= 20 || i < 5 || i >= numHousesToOccupy - 5) {
                console.log(`  ${person.id} (wealth: ${this.MathUtils.formatCurrency(person.wealth)}) -> ${house.id} (value: ${this.MathUtils.formatCurrency(house.calculateValue())})`);
            } else if (i === 5) {
                console.log(`  ... (${numHousesToOccupy - 10} more assignments) ...`);
            }
        }
    }

    /**
     * Processes one simulation tick: ages houses, processes exits/entries, and conducts auctions.
     */
    tick() {
        this.tickCount++;
        console.log(`\n${'='.repeat(50)}`);
        console.log(`YEAR ${this.currentYear} (Tick ${this.tickCount})`);
        console.log(`${'='.repeat(50)}`);
        
        // Age all house ownerships
        this.houses.forEach(house => house.incrementOwnershipYears());
        
        // Apply vacant house depreciation
        this.applyVacantDepreciation();
        
        // Process exits
        this.processExits();
        
        // Process entries
        this.processEntries();
        
        // Conduct auctions
        this.conductAuctions();
        
        // Show market status
        this.showMarketStatus();
        
        // Record analytics snapshot
        this.analyticsHistory.recordSnapshot(this.getMarketStats());
        
        // Advance year
        this.currentYear++;
    }

    /**
     * Applies depreciation to vacant houses based on configuration.
     */
    applyVacantDepreciation() {
        const depreciationRate = this.config.get('vacant_depreciation');
        if (depreciationRate <= 0) return;
        
        const vacantHouses = this.houses.filter(h => h.isAvailable());
        if (vacantHouses.length === 0) return;
        
        console.log(`\n--- Applying Vacant House Depreciation (${(depreciationRate * 100).toFixed(1)}%) ---`);
        
        let depreciatedCount = 0;
        let totalValueLoss = 0;
        
        vacantHouses.forEach(house => {
            const oldValue = house.intrinsicValue;
            house.applyVacantDepreciation(depreciationRate);
            const valueLoss = oldValue - house.intrinsicValue;
            
            if (valueLoss > 0) {
                depreciatedCount++;
                totalValueLoss += valueLoss;
                
                // Only log for smaller markets to avoid spam
                if (this.houses.length <= 20) {
                    console.log(`  ${house.id}: ${this.MathUtils.formatCurrency(oldValue)} -> ${this.MathUtils.formatCurrency(house.intrinsicValue)} (-${this.MathUtils.formatCurrency(valueLoss)})`);
                }
            }
        });
        
        if (depreciatedCount > 0) {
            console.log(`Applied depreciation to ${depreciatedCount} vacant house${depreciatedCount > 1 ? 's' : ''}, total value loss: ${this.MathUtils.formatCurrency(totalValueLoss)}`);
        } else {
            console.log(`No vacant houses to depreciate`);
        }
    }

    processExits() {
        const turnoverOut = this.config.get('turnover_out');
        if (turnoverOut === 0) return;
        
        // Select random people to exit from ALL people, not just housed ones
        const exitingPeople = this.MathUtils.selectRandomElements(this.people, turnoverOut);
        
        if (exitingPeople.length > 0) {
            console.log(`\n--- People Exiting Market ---`);
            exitingPeople.forEach(person => {
                if (person.house) {
                    console.log(`${person.id} exits, selling ${person.house.id}`);
                    const house = person.sellHouse();
                    if (house) {
                        this.availableHouses.push(house);
                    }
                } else {
                    console.log(`${person.id} exits (was unhoused)`);
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

    /**
     * Conducts multiple auction batches based on n_auction_steps configuration.
     * Each batch auctions a subset of available houses, creating more dynamic market activity.
     */
    conductAuctions() {
        if (this.availableHouses.length === 0) {
            console.log('\n--- No Houses Available for Auction ---');
            return;
        }
        
        const nAuctionSteps = this.config.get('n_auction_steps');
        console.log(`\n--- Conducting ${nAuctionSteps} Auction Batch${nAuctionSteps > 1 ? 'es' : ''} ---`);
        console.log(`Available houses: ${this.availableHouses.length}`);
        
        let allAuctionResults = [];
        let totalReport = {
            successfulSales: 0,
            totalHouses: 0,
            totalRevenue: 0,
            averagePrice: 0
        };
        
        // Divide houses into batches
        const housesPerBatch = Math.max(1, Math.ceil(this.availableHouses.length / nAuctionSteps));
        
        for (let batchNum = 0; batchNum < nAuctionSteps && this.availableHouses.length > 0; batchNum++) {
            console.log(`\n=== Auction Batch ${batchNum + 1}/${nAuctionSteps} ===`);
            
            // Select houses for this batch
            const batchHouses = this.availableHouses.slice(0, housesPerBatch);
            
            if (batchHouses.length === 0) break;
            
            console.log(`Auctioning ${batchHouses.length} house${batchHouses.length > 1 ? 's' : ''}`);
            
            // Conduct auction for this batch
            const auction = new this.Auction(batchHouses, this.people);
            const results = auction.conductVickreyAuction(
                this.config.get('value_intrinsicness'),
                this.config.get('upgrade_threshold')
            );
            
            auction.executeTransactions();
            allAuctionResults.push(...results);
            
            // Remove sold houses from available list
            const soldHouses = auction.getSuccessfulSales().map(result => result.house);
            this.availableHouses = this.availableHouses.filter(house => !soldHouses.includes(house));
            
            // Accumulate batch statistics
            const batchReport = auction.generateReport();
            totalReport.successfulSales += batchReport.successfulSales;
            totalReport.totalHouses += batchReport.totalHouses;
            totalReport.totalRevenue += batchReport.totalRevenue;
            
            console.log(`Batch ${batchNum + 1} results: ${batchReport.successfulSales}/${batchReport.totalHouses} houses sold`);
            
            // Brief pause between batches (simulates time delay)
            if (batchNum < nAuctionSteps - 1 && this.availableHouses.length > 0) {
                console.log(`--- Brief delay before next batch ---`);
            }
        }
        
        // Store all auction results for visualization
        this.lastAuctionResults = allAuctionResults;
        
        // Calculate overall statistics
        totalReport.averagePrice = totalReport.successfulSales > 0 
            ? totalReport.totalRevenue / totalReport.successfulSales 
            : 0;
        
        // Show overall auction summary
        console.log(`\n--- Overall Auction Summary ---`);
        console.log(`Total houses sold: ${totalReport.successfulSales}/${totalReport.totalHouses}`);
        console.log(`Total revenue: ${this.MathUtils.formatCurrency(totalReport.totalRevenue)}`);
        console.log(`Average price: ${this.MathUtils.formatCurrency(totalReport.averagePrice)}`);
        console.log(`Remaining available houses: ${this.availableHouses.length}`);
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

    /**
     * Returns comprehensive market statistics and analytics.
     * @returns {Object} Detailed market metrics
     */
    getMarketStats() {
        const housedPeople = this.people.filter(p => p.house);
        const houselessPeople = this.people.filter(p => !p.house);
        const occupiedHouses = this.houses.filter(h => h.owner);
        
        // Wealth analysis
        const wealths = this.people.map(p => p.wealth).sort((a, b) => b - a);
        const totalWealth = wealths.reduce((a, b) => a + b, 0);
        const medianWealth = wealths.length > 0 ? wealths[Math.floor(wealths.length / 2)] : 0;
        
        // House value analysis
        const houseValues = this.houses.map(h => h.calculateValue()).sort((a, b) => b - a);
        const totalHouseValue = houseValues.reduce((a, b) => a + b, 0);
        const medianHouseValue = houseValues.length > 0 ? houseValues[Math.floor(houseValues.length / 2)] : 0;
        
        // Market velocity (houses that changed hands recently)
        const recentlyTraded = this.houses.filter(h => h.yearsSinceOwnership <= 1 && h.owner);
        
        // Wealth distribution metrics (Gini coefficient calculation)
        let giniCoefficient = 0;
        if (wealths.length > 1 && totalWealth > 0) {
            let giniSum = 0;
            for (let i = 0; i < wealths.length; i++) {
                for (let j = 0; j < wealths.length; j++) {
                    giniSum += Math.abs(wealths[i] - wealths[j]);
                }
            }
            giniCoefficient = giniSum / (2 * wealths.length * wealths.length * (totalWealth / wealths.length));
        }
        
        // Market concentration (what percentage of wealth is held by top 10%)
        const top10PercentCount = Math.max(1, Math.floor(wealths.length * 0.1));
        const top10PercentWealth = wealths.slice(0, top10PercentCount).reduce((a, b) => a + b, 0);
        const wealthConcentration = totalWealth > 0 ? top10PercentWealth / totalWealth : 0;
        
        // Affordability ratio (average house value / average wealth)
        const affordabilityRatio = totalWealth > 0 && wealths.length > 0 
            ? (totalHouseValue / houseValues.length) / (totalWealth / wealths.length)
            : 0;
            
        // Market efficiency (percentage of houses occupied)
        const occupancyRate = this.houses.length > 0 ? occupiedHouses.length / this.houses.length : 0;
        
        return {
            // Basic metrics
            currentYear: this.currentYear,
            tickCount: this.tickCount,
            totalPeople: this.people.length,
            housedPeople: housedPeople.length,
            houselessPeople: houselessPeople.length,
            totalHouses: this.houses.length,
            occupiedHouses: occupiedHouses.length,
            availableHouses: this.availableHouses.length,
            
            // Wealth metrics
            averageWealth: wealths.length > 0 ? totalWealth / wealths.length : 0,
            medianWealth: medianWealth,
            wealthRange: wealths.length > 0 ? wealths[0] - wealths[wealths.length - 1] : 0,
            giniCoefficient: giniCoefficient,
            wealthConcentration: wealthConcentration,
            
            // House metrics
            averageHouseValue: houseValues.length > 0 ? totalHouseValue / houseValues.length : 0,
            medianHouseValue: medianHouseValue,
            houseValueRange: houseValues.length > 0 ? houseValues[0] - houseValues[houseValues.length - 1] : 0,
            
            // Market dynamics
            marketVelocity: recentlyTraded.length,
            occupancyRate: occupancyRate,
            affordabilityRatio: affordabilityRatio,
            
            // Auction metrics (if available)
            lastAuctionResults: this.lastAuctionResults ? {
                totalAuctioned: this.lastAuctionResults.length,
                successfulSales: this.lastAuctionResults.filter(r => r.winner).length,
                averagePrice: this.lastAuctionResults.length > 0 
                    ? this.lastAuctionResults.filter(r => r.winner).reduce((sum, r) => sum + r.secondPrice, 0) / 
                      Math.max(1, this.lastAuctionResults.filter(r => r.winner).length)
                    : 0
            } : null
        };
    }

    /**
     * Gets the analytics history tracker.
     * @returns {AnalyticsHistory} The analytics history instance
     */
    getAnalyticsHistory() {
        return this.analyticsHistory;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Market;
}