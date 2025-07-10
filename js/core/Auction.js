class Auction {
    constructor(houses, eligibleBidders) {
        this.houses = houses;
        this.eligibleBidders = eligibleBidders;
        this.results = [];
        
        // Handle MathUtils for both browser and Node.js
        this.MathUtils = typeof MathUtils !== 'undefined' ? MathUtils : require('../utils/MathUtils.js');
    }

    conductVickreyAuction(valueIntrinsicness, upgradeThreshold) {
        console.log(`\n=== Auction for ${this.houses.length} houses ===`);
        
        // Track which people have already won houses in this auction
        const alreadyWon = new Set();
        
        for (const house of this.houses) {
            const result = this.auctionSingleHouse(house, valueIntrinsicness, upgradeThreshold, alreadyWon);
            this.results.push(result);
            
            // If someone won this house, they can't bid on others
            if (result.winner) {
                alreadyWon.add(result.winner);
            }
        }
        
        return this.results;
    }

    auctionSingleHouse(house, valueIntrinsicness, upgradeThreshold, alreadyWon = new Set()) {
        const houseValue = house.calculateValue(valueIntrinsicness);
        
        // Reduce console output for large markets
        const showDetails = this.houses.length <= 20;
        if (showDetails) {
            console.log(`\nAuctioning ${house.id} (Value: ${this.MathUtils.formatCurrency(houseValue)})`);
        }
        
        // Determine who will bid on this house (excluding those who already won)
        const bidders = this.eligibleBidders.filter(person => 
            !alreadyWon.has(person) && person.shouldBid(house, upgradeThreshold)
        );
        
        if (bidders.length === 0) {
            if (showDetails) {
                console.log(`  No bidders for ${house.id}`);
            }
            return {
                house: house,
                winner: null,
                winningBid: 0,
                secondPrice: 0,
                bidderCount: 0
            };
        }

        // Get bids from each bidder (everyone bids their full wealth)
        const bids = bidders.map(person => ({
            person: person,
            amount: person.getBidAmount()
        }));

        // Sort bids by amount (highest first)
        bids.sort((a, b) => b.amount - a.amount);

        const winner = bids[0].person;
        const winningBid = bids[0].amount;
        
        // Determine price to pay (second-price auction)
        let priceToPayGeneric;
        if (bids.length === 1) {
            // Single bidder pays 75% of their bid
            priceToPayGeneric = winningBid * 0.75;
        } else {
            // Winner pays second-highest bid
            priceToPayGeneric = bids[1].amount;
        }

        if (showDetails) {
            console.log(`  Winner: ${winner.id} (Wealth: ${this.MathUtils.formatCurrency(winner.wealth)})`);
            console.log(`  Price paid: ${this.MathUtils.formatCurrency(priceToPayGeneric)}`);
            console.log(`  Bidders: ${bidders.length}`);
        }

        return {
            house: house,
            winner: winner,
            winningBid: winningBid,
            secondPrice: priceToPayGeneric,
            bidderCount: bidders.length,
            allBids: bids
        };
    }

    executeTransactions() {
        console.log('\n=== Executing Transactions ===');
        
        // Track houses that become available when people move
        const housesFromUpgrades = [];
        
        for (const result of this.results) {
            if (result.winner) {
                // Check if winner already owns a house (will be sold)
                if (result.winner.house) {
                    housesFromUpgrades.push(result.winner.house);
                }
                
                // Winner takes ownership
                result.winner.buyHouse(result.house, result.secondPrice);
                console.log(`  ${result.winner.id} bought ${result.house.id} for ${this.MathUtils.formatCurrency(result.secondPrice)}`);
            }
        }
        
        // Store houses that became available for the market to reclaim
        this.housesFromUpgrades = housesFromUpgrades;
        
        return this.results;
    }

    getSuccessfulSales() {
        return this.results.filter(result => result.winner !== null);
    }

    getFailedSales() {
        return this.results.filter(result => result.winner === null);
    }

    /**
     * Gets houses that became available when people upgraded (sold their old house).
     * @returns {House[]} Array of houses that became available from upgrades
     */
    getHousesFromUpgrades() {
        return this.housesFromUpgrades || [];
    }

    generateReport() {
        const successful = this.getSuccessfulSales();
        const failed = this.getFailedSales();
        
        return {
            totalHouses: this.houses.length,
            successfulSales: successful.length,
            failedSales: failed.length,
            totalRevenue: successful.reduce((sum, result) => sum + result.secondPrice, 0),
            averagePrice: successful.length > 0 ? 
                successful.reduce((sum, result) => sum + result.secondPrice, 0) / successful.length : 0,
            results: this.results
        };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Auction;
}