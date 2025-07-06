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