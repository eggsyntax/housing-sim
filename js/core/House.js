/**
 * Represents a house in the housing market simulation.
 * Houses have intrinsic value, market pricing, and ownership state.
 */
class House {
    static idCounter = 0;

    /**
     * Creates a new House instance.
     * @param {number} intrinsicValue - The house's intrinsic value
     * @param {number} initialPrice - The house's initial market price
     */
    constructor(intrinsicValue, initialPrice) {
        this.id = `house_${++House.idCounter}`;
        this.intrinsicValue = intrinsicValue;
        this.lastSellingPrice = initialPrice;
        this.owner = null;
        this.yearsSinceOwnership = 0;
    }

    /**
     * Calculates the current value as a weighted average of intrinsic value and market price.
     * @param {number} valueIntrinsicness - Weight for intrinsic value (0-1, default 0.7)
     * @returns {number} The calculated house value
     */
    calculateValue(valueIntrinsicness = 0.7) {
        // Hybrid value: weighted average of intrinsic value and market price
        return valueIntrinsicness * this.intrinsicValue + 
               (1 - valueIntrinsicness) * this.lastSellingPrice;
    }

    /**
     * Checks if the house is available for purchase.
     * @returns {boolean} True if the house has no owner
     */
    isAvailable() {
        return this.owner === null;
    }

    /**
     * Sets the house's owner and resets ownership years.
     * @param {Person} person - The new owner
     */
    setOwner(person) {
        this.owner = person;
        this.yearsSinceOwnership = 0;
    }

    /**
     * Increments the years since ownership change (used for color state transitions).
     */
    incrementOwnershipYears() {
        // Always increment years since ownership change (whether owned or not)
        this.yearsSinceOwnership++;
    }

    /**
     * Applies depreciation to vacant houses.
     * @param {number} depreciationRate - Yearly depreciation rate (e.g., 0.05 for 5%)
     */
    applyVacantDepreciation(depreciationRate) {
        // Only apply depreciation if house is vacant/available
        if (this.isAvailable() && depreciationRate > 0) {
            this.intrinsicValue *= (1 - depreciationRate);
            // Ensure intrinsic value doesn't go below a minimum threshold
            this.intrinsicValue = Math.max(this.intrinsicValue, 1000); // Minimum $1,000
        }
    }

    /**
     * Determines the visual state for rendering colors.
     * @returns {string} Color state: 'available', 'just-available', 'occupied', or 'just-occupied'
     */
    getColorState() {
        if (this.isAvailable()) {
            return this.yearsSinceOwnership === 0 ? 'just-available' : 'available';
        } else {
            return this.yearsSinceOwnership === 0 ? 'just-occupied' : 'occupied';
        }
    }

    /**
     * Returns display information for UI rendering.
     * @returns {Object} Object containing formatted house data
     */
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