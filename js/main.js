/**
 * Main simulation controller that orchestrates the housing market simulation.
 * Manages the market, renderer, user interface controls, and simulation timing.
 */
class Simulation {
    /**
     * Creates a new Simulation instance.
     * @param {Object} userConfig - Optional configuration overrides
     */
    constructor(userConfig = {}) {
        this.config = new Config(userConfig);
        this.market = null;
        this.renderer = null;
        this.isRunning = false;
        this.isPaused = false;
        this.intervalId = null;
        
        this.initialize();
    }

    /**
     * Initializes the simulation by creating market, renderer, and UI controls.
     */
    initialize() {
        console.log('=== Housing Market Simulation ===');
        console.log('Configuration:', this.config.getAll());
        
        this.market = new Market(this.config);
        
        // Initialize renderer
        this.setupRenderer();
        
        this.setupControls();
        
        // Initial render
        this.updateDisplay();
    }

    /**
     * Sets up the simulation renderer with canvas and statistics display.
     */
    setupRenderer() {
        const canvas = document.getElementById('market-canvas');
        const statsDiv = document.getElementById('stats');
        
        if (canvas) {
            this.renderer = new SimulationRenderer(canvas, null, statsDiv);
            this.renderer.setMarket(this.market);
            this.renderer.setupMouseInteraction(this.market);
        }
    }

    /**
     * Sets up user interface controls for simulation management and view switching.
     */
    setupControls() {
        // Add control buttons to the page
        const controlsDiv = document.getElementById('controls');
        if (controlsDiv) {
            controlsDiv.innerHTML = `
                <button id="startBtn">Start</button>
                <button id="pauseBtn" disabled>Pause</button>
                <button id="stepBtn">Step</button>
                <button id="resetBtn">Reset</button>
                <div>
                    <label for="speedSlider">Speed (ms): </label>
                    <input type="range" id="speedSlider" min="100" max="3000" value="${this.config.get('simulation_speed')}" step="100">
                    <span id="speedValue">${this.config.get('simulation_speed')}</span>
                </div>
            `;
            
            // Attach event listeners
            document.getElementById('startBtn').addEventListener('click', () => this.start());
            document.getElementById('pauseBtn').addEventListener('click', () => this.pause());
            document.getElementById('stepBtn').addEventListener('click', () => this.step());
            document.getElementById('resetBtn').addEventListener('click', () => this.reset());
            
            const speedSlider = document.getElementById('speedSlider');
            speedSlider.addEventListener('input', (e) => {
                const newSpeed = parseInt(e.target.value);
                this.config.set('simulation_speed', newSpeed);
                document.getElementById('speedValue').textContent = newSpeed;
                
                // Restart with new speed if running
                if (this.isRunning && !this.isPaused) {
                    this.stop();
                    this.start();
                }
            });
        }
        
        // Setup view toggle controls
        this.setupViewToggle();
    }

    setupViewToggle() {
        const marketViewBtn = document.getElementById('marketViewBtn');
        const analyticsViewBtn = document.getElementById('analyticsViewBtn');
        const viewTitle = document.getElementById('view-title');
        
        if (marketViewBtn && analyticsViewBtn && viewTitle) {
            marketViewBtn.addEventListener('click', () => {
                this.setViewMode('market');
                marketViewBtn.classList.add('active');
                analyticsViewBtn.classList.remove('active');
                viewTitle.textContent = 'Market Visualization';
                this.updateDisplay();
            });
            
            analyticsViewBtn.addEventListener('click', () => {
                this.setViewMode('analytics');
                analyticsViewBtn.classList.add('active');
                marketViewBtn.classList.remove('active');
                viewTitle.textContent = 'Market Analytics';
                this.updateDisplay();
            });
        }
    }

    /**
     * Sets the current view mode (market or analytics).
     * @param {string} mode - The view mode ('market' or 'analytics')
     */
    setViewMode(mode) {
        if (this.renderer) {
            this.renderer.setViewMode(mode);
        }
    }

    /**
     * Starts the simulation with automatic progression.
     */
    start() {
        if (this.isRunning && !this.isPaused) return;
        
        this.isRunning = true;
        this.isPaused = false;
        
        console.log('Starting simulation...');
        
        this.intervalId = setInterval(() => {
            this.step();
        }, this.config.get('simulation_speed'));
        
        this.updateControls();
    }

    /**
     * Pauses the automatic simulation progression.
     */
    pause() {
        if (!this.isRunning || this.isPaused) return;
        
        this.isPaused = true;
        clearInterval(this.intervalId);
        
        console.log('Simulation paused');
        this.updateControls();
    }

    /**
     * Resumes the simulation from a paused state.
     */
    resume() {
        if (!this.isRunning || !this.isPaused) return;
        
        this.isPaused = false;
        this.intervalId = setInterval(() => {
            this.step();
        }, this.config.get('simulation_speed'));
        
        console.log('Simulation resumed');
        this.updateControls();
    }

    /**
     * Advances the simulation by exactly one tick/year.
     */
    step() {
        if (!this.market) return;
        
        this.market.tick();
        
        // Update display
        this.updateDisplay();
    }

    /**
     * Stops the simulation completely.
     */
    stop() {
        this.isRunning = false;
        this.isPaused = false;
        
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        
        console.log('Simulation stopped');
        this.updateControls();
    }

    /**
     * Resets the simulation to initial conditions with a new random seed.
     */
    reset() {
        this.stop();
        console.clear();
        
        // Reset ID counters
        Person.idCounter = 0;
        House.idCounter = 0;
        
        this.market = new Market(this.config);
        if (this.renderer) {
            this.renderer.setMarket(this.market);
            this.renderer.setupMouseInteraction(this.market);
        }
        this.updateDisplay();
        
        console.log('Simulation reset');
    }

    /**
     * Updates the state of UI control buttons based on simulation status.
     */
    updateControls() {
        const startBtn = document.getElementById('startBtn');
        const pauseBtn = document.getElementById('pauseBtn');
        const stepBtn = document.getElementById('stepBtn');
        
        if (startBtn && pauseBtn && stepBtn) {
            if (this.isRunning && !this.isPaused) {
                startBtn.disabled = true;
                pauseBtn.disabled = false;
                stepBtn.disabled = true;
            } else if (this.isRunning && this.isPaused) {
                startBtn.disabled = false;
                pauseBtn.disabled = true;
                stepBtn.disabled = false;
            } else {
                startBtn.disabled = false;
                pauseBtn.disabled = true;
                stepBtn.disabled = false;
            }
        }
    }

    /**
     * Updates the visual display including market visualization and statistics.
     */
    updateDisplay() {
        if (this.renderer && this.market) {
            // Render the market visualization
            this.renderer.renderMarket(this.market);
            
            // Add auction feedback if available
            if (this.market.lastAuctionResults) {
                this.renderer.renderAuctionFeedback(this.market.lastAuctionResults);
            }
            
            // Update statistics
            this.renderer.updateStats(this.market);
        }
    }

    exportData() {
        if (!this.market) return '';
        
        const stats = this.market.getMarketStats();
        const people = this.market.people.map(p => p.getDisplayInfo());
        const houses = this.market.houses.map(h => h.getDisplayInfo());
        
        return JSON.stringify({
            stats,
            people,
            houses,
            timestamp: new Date().toISOString()
        }, null, 2);
    }
}

// Initialize simulation when page loads
let simulation;

document.addEventListener('DOMContentLoaded', () => {
    simulation = new Simulation();
    console.log('Simulation initialized. Use the controls to start.');
});

// Make simulation accessible globally for debugging
window.simulation = simulation;

/**
 * Settings Screen Management
 */
class SettingsManager {
    constructor(simulation) {
        this.simulation = simulation;
        this.modal = document.getElementById('settingsModal');
        this.settingsForm = document.getElementById('settingsForm');
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Settings button
        document.getElementById('settingsBtn').addEventListener('click', () => {
            this.openSettings();
        });

        // Close settings
        document.getElementById('closeSettings').addEventListener('click', () => {
            this.closeSettings();
        });

        // Close on outside click
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeSettings();
            }
        });

        // Reset to defaults
        document.getElementById('resetToDefaults').addEventListener('click', () => {
            this.resetToDefaults();
        });

        // Save settings
        document.getElementById('saveSettings').addEventListener('click', () => {
            this.saveSettings();
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.style.display === 'block') {
                this.closeSettings();
            }
        });
    }

    openSettings() {
        this.renderSettingsForm();
        this.modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    closeSettings() {
        this.modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    renderSettingsForm() {
        const settings = this.simulation.config.getConfigurableSettings();
        const categories = this.groupSettingsByCategory(settings);
        
        this.settingsForm.innerHTML = '';
        
        Object.entries(categories).forEach(([categoryName, categorySettings]) => {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'settings-category';
            
            const categoryTitle = document.createElement('h3');
            categoryTitle.textContent = categoryName;
            categoryDiv.appendChild(categoryTitle);
            
            Object.entries(categorySettings).forEach(([key, setting]) => {
                const settingItem = this.createSettingItem(key, setting);
                categoryDiv.appendChild(settingItem);
            });
            
            this.settingsForm.appendChild(categoryDiv);
        });
    }

    groupSettingsByCategory(settings) {
        const categories = {};
        
        Object.entries(settings).forEach(([key, setting]) => {
            const category = setting.category || 'Other';
            if (!categories[category]) {
                categories[category] = {};
            }
            categories[category][key] = setting;
        });
        
        return categories;
    }

    createSettingItem(key, setting) {
        const item = document.createElement('div');
        item.className = 'setting-item';
        
        const info = document.createElement('div');
        info.className = 'setting-info';
        
        const name = document.createElement('div');
        name.className = 'setting-name';
        name.textContent = setting.name;
        
        const description = document.createElement('div');
        description.className = 'setting-description';
        description.textContent = setting.description;
        
        info.appendChild(name);
        info.appendChild(description);
        
        const inputContainer = document.createElement('div');
        inputContainer.className = 'setting-input';
        
        const input = document.createElement('input');
        input.type = setting.type;
        input.id = `setting-${key}`;
        input.value = setting.value;
        input.min = setting.min;
        input.max = setting.max;
        input.step = setting.step;
        
        inputContainer.appendChild(input);
        
        // Add unit label if applicable
        if (setting.format) {
            const unit = document.createElement('div');
            unit.className = 'setting-unit';
            unit.textContent = this.getUnitLabel(setting.format, setting.value);
            inputContainer.appendChild(unit);
        }
        
        item.appendChild(info);
        item.appendChild(inputContainer);
        
        return item;
    }

    getUnitLabel(format, value) {
        switch (format) {
            case 'currency':
                return `$${value.toLocaleString()}`;
            case 'percent':
                return `${(value * 100).toFixed(1)}%`;
            case 'time':
                return `${value}ms`;
            default:
                return '';
        }
    }

    collectFormData() {
        const data = {};
        const settings = this.simulation.config.getConfigurableSettings();
        
        Object.keys(settings).forEach(key => {
            const input = document.getElementById(`setting-${key}`);
            if (input) {
                let value = parseFloat(input.value);
                
                // Validate against constraints
                const setting = settings[key];
                if (value < setting.min) value = setting.min;
                if (value > setting.max) value = setting.max;
                
                data[key] = value;
            }
        });
        
        return data;
    }

    resetToDefaults() {
        if (confirm('Reset all settings to default values? This will also reset the simulation.')) {
            this.simulation.config.resetToDefaults();
            this.renderSettingsForm();
            this.simulation.reset();
            this.closeSettings();
        }
    }

    saveSettings() {
        const newSettings = this.collectFormData();
        
        try {
            this.simulation.config.updateSettings(newSettings);
            this.simulation.reset(); // Reset simulation with new settings
            this.closeSettings();
            
            // Show brief confirmation
            this.showNotification('Settings saved and simulation reset!');
        } catch (error) {
            alert('Error saving settings: ' + error.message);
        }
    }

    showNotification(message) {
        // Create temporary notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #27ae60;
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            z-index: 1001;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            animation: slideInRight 0.3s ease;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Initialize settings manager when page loads
document.addEventListener('DOMContentLoaded', () => {
    if (simulation) {
        window.settingsManager = new SettingsManager(simulation);
    }
});