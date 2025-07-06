class Person {
    static idCounter = 0;

    constructor(wealth, house = null, yearEntered = 2025) {
        this.id = `person_${++Person.idCounter}`;
        this.wealth = wealth;
        this.house = house;
        this.yearEntered = yearEntered;
    }

    canAfford(house) {
        return this.wealth >= house.calculateValue();
    }

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

    getBidAmount() {
        // In our simplified model, people always bid their full wealth
        return this.wealth;
    }

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