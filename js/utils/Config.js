class Config {
    static DEFAULT_CONFIG = {
        // Population (Phase 3: scaled up for realistic markets)
        num_houses: 100,
        num_people: 100,
        
        // Wealth Distribution
        wealth_mean: 300000,  // Reduced to better match house prices
        wealth_std: 200000,   // Reduced for better affordability
        
        // Housing
        house_price_mean: 300000,  // Reduced to be more affordable
        house_price_std: 150000,   // Reduced spread
        value_intrinsicness: 0.7,
        
        // Market Dynamics
        turnover_in: 2,
        turnover_out: 2,
        upgrade_threshold: 1.5,
        n_auction_steps: 3, // Multiple auction batches for more dynamic markets
        vacant_depreciation: 0.05, // 5% value loss per year for unoccupied houses
        
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

    static SETTINGS_METADATA = {
        // Population Settings
        num_houses: {
            name: "Number of Houses",
            description: "Total houses in the market",
            category: "Population",
            type: "number",
            min: 5,
            max: 500,
            step: 1
        },
        num_people: {
            name: "Number of People", 
            description: "Initial number of people in the market",
            category: "Population",
            type: "number",
            min: 5,
            max: 500,
            step: 1
        },
        
        // Wealth Distribution Settings
        wealth_mean: {
            name: "Average Wealth",
            description: "Mean wealth for new people entering market",
            category: "Wealth Distribution",
            type: "number",
            min: 10000,
            max: 2000000,
            step: 10000,
            format: "currency"
        },
        wealth_std: {
            name: "Wealth Variation",
            description: "Standard deviation of wealth distribution",
            category: "Wealth Distribution", 
            type: "number",
            min: 5000,
            max: 1000000,
            step: 5000,
            format: "currency"
        },
        
        // Housing Settings
        house_price_mean: {
            name: "Average House Price",
            description: "Mean initial price for houses",
            category: "Housing",
            type: "number",
            min: 50000,
            max: 2000000,
            step: 10000,
            format: "currency"
        },
        house_price_std: {
            name: "House Price Variation",
            description: "Standard deviation of house prices",
            category: "Housing",
            type: "number", 
            min: 10000,
            max: 1000000,
            step: 10000,
            format: "currency"
        },
        value_intrinsicness: {
            name: "Intrinsic Value Weight",
            description: "How much intrinsic vs market value affects house desirability (0-1)",
            category: "Housing",
            type: "number",
            min: 0,
            max: 1,
            step: 0.1,
            format: "percent"
        },
        vacant_depreciation: {
            name: "Vacant Depreciation",
            description: "Yearly value loss for unoccupied houses (0-0.2)",
            category: "Housing",
            type: "number",
            min: 0,
            max: 0.2,
            step: 0.01,
            format: "percent"
        },
        
        // Market Dynamics Settings
        turnover_in: {
            name: "People Entering/Year",
            description: "Number of new people entering market each year",
            category: "Market Dynamics",
            type: "number",
            min: 0,
            max: 20,
            step: 1
        },
        turnover_out: {
            name: "People Exiting/Year", 
            description: "Number of people leaving market each year",
            category: "Market Dynamics",
            type: "number",
            min: 0,
            max: 20,
            step: 1
        },
        upgrade_threshold: {
            name: "Upgrade Threshold",
            description: "Min value ratio for homeowners to bid on new house",
            category: "Market Dynamics",
            type: "number",
            min: 1,
            max: 3,
            step: 0.1
        },
        n_auction_steps: {
            name: "Auction Batches",
            description: "Number of auction batches per year (1-5)",
            category: "Market Dynamics",
            type: "number",
            min: 1,
            max: 5,
            step: 1
        },
        
        // Simulation Settings
        simulation_speed: {
            name: "Simulation Speed",
            description: "Milliseconds between simulation steps",
            category: "Simulation",
            type: "number",
            min: 100,
            max: 5000,
            step: 100,
            format: "time"
        },
        starting_year: {
            name: "Starting Year",
            description: "Initial year for the simulation",
            category: "Simulation", 
            type: "number",
            min: 2020,
            max: 2030,
            step: 1
        }
    };

    constructor(userConfig = {}) {
        // Load saved settings from localStorage if available
        const savedSettings = this.loadFromStorage();
        this.config = { ...Config.DEFAULT_CONFIG, ...savedSettings, ...userConfig };
        this.validate();
    }

    /**
     * Load user settings from localStorage
     */
    loadFromStorage() {
        if (typeof localStorage === 'undefined') return {};
        
        try {
            const saved = localStorage.getItem('housing-sim-settings');
            return saved ? JSON.parse(saved) : {};
        } catch (error) {
            console.warn('Failed to load settings from localStorage:', error);
            return {};
        }
    }

    /**
     * Save current settings to localStorage
     */
    saveToStorage() {
        if (typeof localStorage === 'undefined') return;
        
        try {
            // Only save settings that have metadata (exclude rendering settings)
            const settingsToSave = {};
            Object.keys(Config.SETTINGS_METADATA).forEach(key => {
                if (this.config.hasOwnProperty(key)) {
                    settingsToSave[key] = this.config[key];
                }
            });
            
            localStorage.setItem('housing-sim-settings', JSON.stringify(settingsToSave));
        } catch (error) {
            console.warn('Failed to save settings to localStorage:', error);
        }
    }

    /**
     * Update multiple settings at once
     */
    updateSettings(newSettings) {
        Object.entries(newSettings).forEach(([key, value]) => {
            if (Config.SETTINGS_METADATA.hasOwnProperty(key)) {
                this.config[key] = value;
            }
        });
        this.validate();
        this.saveToStorage();
    }

    /**
     * Get all user-configurable settings with their metadata
     */
    getConfigurableSettings() {
        const settings = {};
        Object.keys(Config.SETTINGS_METADATA).forEach(key => {
            settings[key] = {
                value: this.config[key],
                ...Config.SETTINGS_METADATA[key]
            };
        });
        return settings;
    }

    /**
     * Reset to default values but keep them in localStorage
     */
    resetToDefaults() {
        Object.keys(Config.SETTINGS_METADATA).forEach(key => {
            this.config[key] = Config.DEFAULT_CONFIG[key];
        });
        this.validate();
        this.saveToStorage();
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
        
        // Save to localStorage if this is a user-configurable setting
        if (Config.SETTINGS_METADATA.hasOwnProperty(key)) {
            this.saveToStorage();
        }
    }

    getAll() {
        return { ...this.config };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Config;
}