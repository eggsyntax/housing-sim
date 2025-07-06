class MathUtils {
    static generatePowerLawWealth(mean, std) {
        // Simplified power law approximation using exponential distribution
        // This creates wealth inequality similar to real-world distributions
        const lambda = 1 / mean;
        const exponentialValue = -Math.log(1 - Math.random()) / lambda;
        
        // Add some normal distribution noise for variation
        const normalNoise = this.generateNormal(0, std * 0.1);
        
        return Math.max(exponentialValue + normalNoise, mean * 0.1);
    }

    static generateNormal(mean, std) {
        // Box-Muller transform for normal distribution
        if (this.spare !== undefined) {
            const value = this.spare;
            delete this.spare;
            return value * std + mean;
        }
        
        let u1, u2;
        do {
            u1 = Math.random();
            u2 = Math.random();
        } while (u1 <= Number.EPSILON);
        
        const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        const z1 = Math.sqrt(-2 * Math.log(u1)) * Math.sin(2 * Math.PI * u2);
        
        this.spare = z1;
        return z0 * std + mean;
    }

    static generateGaussian(mean, std) {
        // Ensure non-negative values for prices
        return Math.max(this.generateNormal(mean, std), mean * 0.1);
    }

    static shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    static selectRandomElements(array, count) {
        if (count >= array.length) return [...array];
        
        const shuffled = this.shuffleArray(array);
        return shuffled.slice(0, count);
    }

    static formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }

    static formatNumber(number) {
        return new Intl.NumberFormat('en-US').format(number);
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = MathUtils;
}