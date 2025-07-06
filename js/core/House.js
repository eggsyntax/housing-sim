class House {
    static idCounter = 0;

    constructor(intrinsicValue, initialPrice) {
        this.id = `house_${++House.idCounter}`;
        this.intrinsicValue = intrinsicValue;
        this.lastSellingPrice = initialPrice;
        this.owner = null;
        this.yearsSinceOwnership = 0;
    }

    calculateValue(valueIntrinsicness = 0.7) {
        // Hybrid value: weighted average of intrinsic value and market price
        return valueIntrinsicness * this.intrinsicValue + 
               (1 - valueIntrinsicness) * this.lastSellingPrice;
    }

    isAvailable() {
        return this.owner === null;
    }

    setOwner(person) {
        this.owner = person;
        this.yearsSinceOwnership = 0;
    }

    incrementOwnershipYears() {
        if (this.owner) {
            this.yearsSinceOwnership++;
        }
    }

    getColorState() {
        if (this.isAvailable()) {
            return this.yearsSinceOwnership === 0 ? 'just-available' : 'available';
        } else {
            return this.yearsSinceOwnership === 0 ? 'just-occupied' : 'occupied';
        }
    }

    getDisplayInfo() {
        return {
            id: this.id,
            intrinsicValue: this.intrinsicValue,
            lastSellingPrice: this.lastSellingPrice,
            currentValue: this.calculateValue(),
            isAvailable: this.isAvailable(),
            ownerId: this.owner ? this.owner.id : null,
            ownerWealth: this.owner ? this.owner.wealth : null,
            yearsSinceOwnership: this.yearsSinceOwnership,
            colorState: this.getColorState(),
            formattedIntrinsicValue: MathUtils.formatCurrency(this.intrinsicValue),
            formattedLastPrice: MathUtils.formatCurrency(this.lastSellingPrice),
            formattedCurrentValue: MathUtils.formatCurrency(this.calculateValue())
        };
    }

    toString() {
        const ownerInfo = this.owner ? ` (owned by ${this.owner.id})` : ' (available)';
        const MathUtilsRef = typeof MathUtils !== 'undefined' ? MathUtils : require('../utils/MathUtils.js');
        const valueInfo = `Value: ${MathUtilsRef.formatCurrency(this.calculateValue())}`;
        const priceInfo = `Last Price: ${MathUtilsRef.formatCurrency(this.lastSellingPrice)}`;
        return `${this.id}: ${valueInfo}, ${priceInfo}${ownerInfo}`;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = House;
}