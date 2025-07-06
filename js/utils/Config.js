class Config {
    static DEFAULT_CONFIG = {
        // Population
        num_houses: 10,
        num_people: 10,
        
        // Wealth Distribution
        wealth_mean: 500000,
        wealth_std: 300000,
        
        // Housing
        house_price_mean: 400000,
        house_price_std: 250000,
        value_intrinsicness: 0.7,
        
        // Market Dynamics
        turnover_in: 2,
        turnover_out: 2,
        upgrade_threshold: 1.5,
        n_auction_steps: 1, // Start with 1 for MVP
        
        // Simulation
        simulation_speed: 1000,
        starting_year: 2025,
        
        // Rendering
        canvas_width: 1200,
        canvas_height: 800,
        house_size: 20,
        person_size: 8,
        
        // Analytics
        show_analytics: true,
        update_frequency: 1
    };

    constructor(userConfig = {}) {
        this.config = { ...Config.DEFAULT_CONFIG, ...userConfig };
        this.validate();
    }

    validate() {
        const errors = [];
        
        if (this.config.num_houses <= 0) errors.push('num_houses must be positive');
        if (this.config.num_people <= 0) errors.push('num_people must be positive');
        if (this.config.wealth_mean <= 0) errors.push('wealth_mean must be positive');
        if (this.config.wealth_std <= 0) errors.push('wealth_std must be positive');
        if (this.config.house_price_mean <= 0) errors.push('house_price_mean must be positive');
        if (this.config.house_price_std <= 0) errors.push('house_price_std must be positive');
        if (this.config.value_intrinsicness < 0 || this.config.value_intrinsicness > 1) {
            errors.push('value_intrinsicness must be between 0 and 1');
        }
        if (this.config.turnover_in < 0) errors.push('turnover_in must be non-negative');
        if (this.config.turnover_out < 0) errors.push('turnover_out must be non-negative');
        if (this.config.upgrade_threshold <= 0) errors.push('upgrade_threshold must be positive');
        if (this.config.n_auction_steps <= 0) errors.push('n_auction_steps must be positive');
        
        if (errors.length > 0) {
            throw new Error('Configuration validation failed: ' + errors.join(', '));
        }
    }

    get(key) {
        return this.config[key];
    }

    set(key, value) {
        this.config[key] = value;
        this.validate();
    }

    getAll() {
        return { ...this.config };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Config;
}