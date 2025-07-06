/**
 * Represents a person in the housing market simulation.
 * People can own houses, participate in auctions, and make buying/selling decisions.
 */
class Person {
    static idCounter = 0;

    /**
     * Creates a new Person instance.
     * @param {number} wealth - Person's wealth in dollars
     * @param {House} house - Currently owned house (null if homeless)
     * @param {number} yearEntered - Year the person entered the market
     */
    constructor(wealth, house = null, yearEntered = 2025) {
        this.id = `person_${++Person.idCounter}`;
        this.wealth = wealth;
        this.house = house;
        this.yearEntered = yearEntered;
    }

    /**
     * Checks if the person can afford a house based on their wealth.
     * @param {House} house - The house to check affordability for
     * @returns {boolean} True if person can afford the house
     */
    canAfford(house) {
        return this.wealth >= house.calculateValue();
    }

    /**
     * Determines if the person should bid on a house.
     * Homeless people bid on any house they can afford.
     * Housed people only bid if the house value exceeds their upgrade threshold.
     * @param {House} house - The house to consider bidding on
     * @param {number} upgradeThreshold - Multiplier for current house value to trigger upgrade
     * @returns {boolean} True if person should bid on the house
     */
    shouldBid(house, upgradeThreshold) {
        // If person doesn't have a house, they should bid on any they can afford
        if (!this.house) {
            return this.canAfford(house);
        }

        // If person has a house, only bid if upgrade threshold is met
        const currentValue = this.house.calculateValue();
        const targetValue = house.calculateValue();
        
        return this.canAfford(house) && targetValue >= (upgradeThreshold * currentValue);
    }

    /**
     * Returns the amount this person bids in auctions.
     * @returns {number} The person's full wealth (simplified bidding strategy)
     */
    getBidAmount() {
        // In our simplified model, people always bid their full wealth
        return this.wealth;
    }

    /**
     * Sells the person's current house if they own one.
     * @returns {House|null} The house that was sold, or null if no house was owned
     */
    sellHouse() {
        if (this.house) {
            const house = this.house;
            this.house.owner = null;
            house.yearsSinceOwnership = 0; // Reset to mark as "just-available"
            this.house = null;
            return house;
        }
        return null;
    }

    /**
     * Buys a house at the specified price.
     * Automatically sells current house if one is owned.
     * @param {House} house - The house to buy
     * @param {number} price - The purchase price
     */
    buyHouse(house, price) {
        if (this.house) {
            this.sellHouse();
        }
        
        this.house = house;
        house.owner = this;
        house.lastSellingPrice = price;
        house.yearsSinceOwnership = 0;
        
        // In our model, people don't lose wealth when buying
        // (simplified - no wealth depletion)
    }

    /**
     * Returns display information for UI rendering.
     * @returns {Object} Object containing formatted person data
     */
    getDisplayInfo() {
        return {
            id: this.id,
            wealth: this.wealth,
            hasHouse: !!this.house,
            houseId: this.house ? this.house.id : null,
            yearEntered: this.yearEntered,
            formattedWealth: MathUtils.formatCurrency(this.wealth)
        };
    }

    toString() {
        const houseInfo = this.house ? ` (owns ${this.house.id})` : ' (homeless)';
        const MathUtilsRef = typeof MathUtils !== 'undefined' ? MathUtils : require('../utils/MathUtils.js');
        return `${this.id}: ${MathUtilsRef.formatCurrency(this.wealth)}${houseInfo}`;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Person;
}