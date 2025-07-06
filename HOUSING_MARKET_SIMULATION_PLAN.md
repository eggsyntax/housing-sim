# Housing Market Simulation - Comprehensive Project Plan

## Table of Contents
1. [Project Overview](#project-overview)
2. [System Explanation](#system-explanation)
3. [Architecture Design](#architecture-design)
4. [Development Timeline](#development-timeline)
5. [Technical Specifications](#technical-specifications)
6. [Testing Strategy](#testing-strategy)
7. [Future Enhancements](#future-enhancements)

## Project Overview

This is an interactive JavaScript simulation of a housing market designed to explore economic dynamics, wealth distribution effects, and market behaviors. The simulation models discrete-time market interactions between buyers, sellers, and properties, with particular focus on emergent behaviors arising from wealth inequality and market turnover.

### Primary Goals
- Create a realistic yet simplified model of housing market dynamics
- Enable exploration of specific scenarios (e.g., wealthy downsizing)
- Provide both console-based and graphical interfaces for observation
- Support economic research and educational use
- Demonstrate emergent market behaviors from simple rules

### Target Audience
- Economics students and researchers
- Policy makers exploring housing market dynamics
- Anyone interested in complex system behaviors

## System Explanation

### Core Concepts

**Time Model**: The simulation operates in discrete time steps called "ticks," each representing one year. Time begins at year 2025 and progresses forward with each simulation step.

**Market Participants**: The market consists of people (representing households) who can own at most one house. Each person has a wealth value that represents their total purchasing power, used exclusively for housing.

**Housing Stock**: The market contains a fixed number of houses, each with two key value components:
- **Intrinsic Value**: An inherent quality/desirability factor (fixed at initialization)
- **Market Price History**: The last price paid for the house

**Hybrid Value System**: Each house's perceived value is calculated as:
```
house_value = value_intrinsicness * intrinsic_value + (1 - value_intrinsicness) * last_selling_price
```
Where `value_intrinsicness` is a configurable parameter (0-1) controlling how much intrinsic quality vs. market price influences desirability.

### Market Mechanics

**Wealth Distribution**: Initial wealth follows a power law distribution to approximate real-world wealth inequality. New entrants receive randomly assigned wealth from the same distribution.

**Auction System**: Houses are sold through Vickrey (sealed-bid, second-price) auctions where:
- All interested parties bid simultaneously
- Highest bidder wins but pays the second-highest bid amount
- If only one bidder, they pay 75% of their bid
- Bidders always bid their total wealth (simplified strategy)

**Bidding Strategy**: People bid on the highest-value house they can afford, with two behavioral rules:
1. **Affordability**: Only bid on houses with value ≤ their wealth
2. **Upgrade Threshold**: Existing homeowners only bid if available house value > upgrade_threshold × current_house_value

**Batch Auction System**: To create realistic market dynamics, available houses are divided into sequential auction batches. In each batch, bidders can only participate in one auction, preventing wealthy individuals from monopolizing all available properties simultaneously.

### Simulation Flow (Per Tick)

1. **Exit Phase**: `turnover_out` randomly selected people sell their houses and exit the market
2. **Entry Phase**: `turnover_in` new people enter with randomly assigned wealth
3. **Auction Setup**: Available houses (from exits + previous moves) are divided into `n_auction_steps` batches
4. **Auction Execution**: Sequential Vickrey auctions with brief pauses between batches
5. **Move Completion**: Winners move to new houses, their old houses become available for next tick
6. **Display Update**: Both console and graphical displays show new market state

### Key Behaviors and Emergent Properties

**Wealth Stratification**: Over time, the wealthiest individuals tend to acquire the most valuable houses, creating market stratification that reflects wealth inequality.

**Market Fluidity**: The combination of turnover and upgrade thresholds prevents the market from becoming completely static, maintaining ongoing transaction activity.

**Price Discovery**: The Vickrey auction mechanism ensures that market prices reflect the second-highest valuation, creating efficient price discovery.

**Cascade Effects**: When wealthy individuals move to more expensive houses, they free up mid-tier housing for less wealthy buyers, creating market cascades.

### Scenario System

The simulation supports predefined scenarios that can be triggered at specific years or manually during runtime:

**Downsizing Scenario**: At a specified year, a configurable percentage of the wealthiest homeowners decide to sell their current houses and purchase lower-value properties. This tests market response to sudden changes in demand patterns.

**Future Scenario Types** (extensible design):
- Economic shocks (sudden wealth changes)
- Policy interventions (transaction taxes, subsidies)
- Demographic changes (age-based preferences)
- Supply shocks (new construction, natural disasters)

### Parameters and Configuration

All simulation parameters are configurable to enable experimentation:

**Population Parameters**:
- `num_houses`: Total number of houses in the market
- `num_people`: Initial number of people in the market
- `wealth_mean`: Mean wealth for power law distribution
- `wealth_std`: Standard deviation for wealth distribution

**Housing Parameters**:
- `house_price_mean`: Mean initial house price
- `house_price_std`: Standard deviation for initial house prices
- `value_intrinsicness`: Weight of intrinsic vs. market value (0-1)

**Market Dynamics Parameters**:
- `turnover_in`: Number of people entering per tick
- `turnover_out`: Number of people exiting per tick
- `upgrade_threshold`: Minimum value ratio for homeowner bidding
- `n_auction_steps`: Number of sequential auction batches per tick

**Simulation Parameters**:
- `simulation_speed`: Milliseconds between ticks
- `starting_year`: Initial year for simulation

### Expected Behaviors

**Short-term**: Initial random distribution leads to sorting as wealthy individuals acquire valuable properties through auction processes.

**Medium-term**: Market reaches quasi-equilibrium with ongoing turnover maintaining transaction activity. Wealth-based stratification becomes apparent.

**Long-term**: Stable stratification with regular turnover creating opportunities for social mobility through the housing market.

**Scenario Testing**: Downsizing events should create temporary market disruptions with interesting redistribution effects as high-value properties become available to middle-wealth buyers.

## Architecture Design

### Class Structure

**`Person` Class**
```javascript
class Person {
    constructor(wealth, house = null, yearEntered = currentYear)
    
    // Core Properties
    id: string                    // Unique identifier
    wealth: number               // Total wealth (bidding power)
    house: House | null          // Currently owned house
    yearEntered: number          // Year entered market
    
    // Behavioral Methods
    canAfford(house): boolean    // Check if can afford house
    shouldBid(house): boolean    // Check upgrade threshold logic
    getBidAmount(): number       // Always returns full wealth
    
    // Utility Methods
    getDisplayInfo(): object     // For UI rendering
    sellHouse(): House          // Release current house
}
```

**`House` Class**
```javascript
class House {
    constructor(intrinsicValue, initialPrice)
    
    // Core Properties
    id: string                   // Unique identifier
    intrinsicValue: number       // Fixed quality value
    lastSellingPrice: number     // Most recent sale price
    owner: Person | null         // Current owner
    yearsSinceOwnership: number  // Time with current owner
    
    // Calculated Properties
    calculateValue(): number     // Hybrid value calculation
    
    // State Management
    isAvailable(): boolean       // Check if available for auction
    setOwner(person): void      // Assign new owner
    
    // Display Methods
    getDisplayInfo(): object     // For UI rendering
    getColorState(): string     // For visual state indication
}
```

**`Market` Class**
```javascript
class Market {
    constructor(config)
    
    // Core Data
    people: Person[]             // All market participants
    houses: House[]              // All houses
    availableHouses: House[]     // Houses available for auction
    currentYear: number          // Current simulation year
    config: object              // Configuration parameters
    
    // Simulation Methods
    tick(): void                // Execute one time step
    processEntry(): void        // Handle new entrants
    processExit(): void         // Handle departures
    conductAuctions(): void     // Run batch auction system
    
    // Market Analysis
    getMarketStats(): object    // Calculate market metrics
    getWealthDistribution(): object // Analyze wealth patterns
    
    // Scenario Support
    triggerScenario(scenario): void // Execute market scenarios
}
```

**`Auction` Class**
```javascript
class Auction {
    constructor(houses, eligibleBidders)
    
    // Auction Data
    houses: House[]             // Houses in this batch
    bidders: Person[]           // Eligible bidders
    bids: Map<Person, House>    // Bidder -> House mapping
    
    // Auction Process
    conductVickreyAuction(): AuctionResult[]
    determineBidders(): Person[]
    processBids(): void
    determineWinners(): AuctionResult[]
    
    // Result Processing
    executeTransactions(): void
    generateAuctionReport(): string
}
```

**`Scenario` Class (Base)**
```javascript
class Scenario {
    constructor(name, description, triggerYear)
    
    // Scenario Properties
    name: string
    description: string
    triggerYear: number
    isActive: boolean
    
    // Abstract Methods
    execute(market): void        // Must be implemented by subclasses
    canTrigger(year): boolean   // Check if scenario should activate
    
    // Utility Methods
    getDescription(): string
    reset(): void
}
```

**`DownsizingScenario` Class**
```javascript
class DownsizingScenario extends Scenario {
    constructor(triggerYear, wealthPercentile, downsizePercentage)
    
    // Scenario-specific Properties
    wealthPercentile: number     // Top X% of wealth holders
    downsizePercentage: number   // What % of those downsize
    
    // Implementation
    execute(market): void        // Force wealthy to downsize
    identifyTargets(market): Person[]
    forceDownsize(person): void
}
```

**`Simulation` Class**
```javascript
class Simulation {
    constructor(config, renderOptions)
    
    // Simulation Control
    market: Market
    renderer: SimulationRenderer
    scenarios: Scenario[]
    isRunning: boolean
    isPaused: boolean
    tickInterval: number
    
    // Control Methods
    start(): void
    stop(): void
    pause(): void
    resume(): void
    step(): void                // Single tick execution
    
    // Configuration
    updateConfig(newConfig): void
    addScenario(scenario): void
    
    // Analysis
    exportData(): string        // CSV export functionality
}
```

**`SimulationRenderer` Class**
```javascript
class SimulationRenderer {
    constructor(canvasElement, consoleElement, analyticsContainer)
    
    // Rendering Components
    canvas: HTMLCanvasElement
    consoleDiv: HTMLElement
    analyticsContainer: HTMLElement
    
    // Display Methods
    renderMarket(market): void
    renderPeople(people): void
    renderHouses(houses): void
    renderAuctions(auctions): void
    updateAnalytics(market): void
    
    // Interactive Features
    handleMouseOver(event): void
    handleClick(event): void
    showPersonDetails(person): void
    showHouseDetails(house): void
    
    // Console Integration
    logToConsole(message): void
    updateStats(stats): void
}
```

### Data Flow Architecture

**Text-First Design**: All simulation logic outputs to console first, then renderer translates to graphics. This ensures that the core simulation remains debuggable and that graphics are purely additive.

**Event-Driven Updates**: The renderer listens for market events and updates display accordingly, maintaining separation between simulation logic and presentation.

**Configuration-Driven**: All parameters are externalized in a configuration object, making experimentation easy and supporting different simulation presets.

## Development Timeline

### Phase 1: MVP - Core Simulation Engine (Week 1)
**Goal**: Working text-based simulation with basic market dynamics

**Deliverables**:
1. **Core Classes**: Person, House, Market classes with essential properties and methods
2. **Basic Auction Logic**: Single-batch Vickrey auctions with proper winner determination
3. **Console Output**: Clear, formatted tick-by-tick simulation results
4. **Parameter System**: Configuration object with validation and sensible defaults
5. **Small Test Market**: 10 houses, 10 people for initial debugging and validation

**Key Features**:
- Wealth distribution implementation (power law)
- Basic house value calculation (hybrid system)
- Simple auction mechanics
- Entry/exit turnover system
- Console logging of all market activity

**Success Criteria**: 
- Can run 10+ simulation ticks without errors
- Observe expected wealth stratification over time
- All auction results are valid (no negative prices, proper ownership transfers)
- Console output clearly shows market progression

### Phase 2: Graphical Interface (Week 2)
**Goal**: Visual representation of market state and auction activity

**Deliverables**:
1. **HTML Canvas Setup**: Responsive grid layout for houses and people
2. **House State Visualization**: Color-coded houses showing occupied/available/recently-changed states
3. **People Visualization**: Visual representation of people, both housed and unhoused
4. **Real-time Updates**: Graphics that update with each simulation tick
5. **Basic Interaction**: Pause/play controls and speed adjustment

**Visual Design**:
- Houses arranged in a grid with clear state indicators
- People shown as icons within houses or in an "unhoused" area
- Color coding: green=occupied, red=available, yellow=just-sold, blue=just-available
- Year display prominently shown
- Basic controls for simulation management

**Success Criteria**:
- Visual display matches console output exactly
- Smooth animations between simulation states
- Clear visual indication of market activity
- Intuitive pause/play functionality

### Phase 3: Complete Market Mechanics (Week 3)
**Goal**: Full-featured auction system with all specified mechanics

**Deliverables**:
1. **Batch Auction System**: Sequential auctions with `n_auction_steps` batches
2. **Upgrade Logic**: Existing homeowners bid based on `upgrade_threshold`
3. **Enhanced Turnover**: Proper handling of multiple simultaneous exits/entries
4. **Scenario System**: Framework for downsizing and other market events
5. **Market Analytics**: Basic statistics and metrics calculation

**Advanced Features**:
- Proper batch sequencing with delays between auctions
- Upgrade threshold enforcement
- Scenario triggering system
- Market health metrics
- Performance optimization for larger markets

**Success Criteria**:
- Realistic market behavior with 100 houses, 100 people
- Successful downsizing scenario execution
- Batch auctions create more dynamic market activity
- No performance issues with full-scale simulation

### Phase 4: Advanced Features and Analytics (Week 4)
**Goal**: Interactive analytics and comprehensive market analysis tools

**Deliverables**:
1. **Interactive Analytics**: Toggle-able analytics panels with real-time market data
2. **Mouseover Tracking**: Detailed information on hover for houses and people
3. **Market Statistics**: Wealth distribution graphs, price trends, market concentration
4. **Scenario Management**: UI for triggering scenarios and managing scenario parameters
5. **Parameter Controls**: Real-time adjustment of simulation parameters

**Analytics Features**:
- Wealth distribution histograms
- Price trend analysis
- Market velocity metrics
- Individual person/house tracking
- Scenario impact analysis

**Success Criteria**:
- Rich interactive analytics that provide market insights
- Smooth mouseover experience with detailed information
- Scenario system that supports multiple event types
- Parameter adjustment without simulation restart

### Phase 5: Polish & Advanced Scenarios (Week 5)
**Goal**: Production-ready simulation with multiple scenarios and export capabilities

**Deliverables**:
1. **Enhanced UI**: Professional styling, responsive design, accessibility features
2. **Multiple Scenarios**: Additional scenario types beyond downsizing
3. **Data Export**: CSV/JSON export of simulation results for external analysis
4. **Performance Optimization**: Support for very large markets (500+ houses)
5. **Documentation**: Complete user guide and developer documentation

**Advanced Features**:
- Save/load simulation states
- Batch simulation runs for statistical analysis
- Advanced scenario scripting
- Performance monitoring and optimization
- Comprehensive error handling

**Success Criteria**:
- Professional-quality user interface
- Robust performance with large markets
- Comprehensive scenario library
- Export functionality for research use

### Development Strategy

**Iterative Testing**: Each phase produces a fully functional simulation that can be demonstrated and tested independently.

**Test-Driven Development**: Unit tests for core classes, integration tests for market behavior, and scenario tests for expected outcomes.

**Performance Monitoring**: Regular performance testing to ensure simulation scales appropriately.

**Documentation**: Living documentation that evolves with the codebase, including API documentation and user guides.

## Technical Specifications

### File Structure
```
housing-sim/
├── index.html                 # Main simulation page
├── css/
│   └── style.css             # Styling
├── js/
│   ├── core/
│   │   ├── Person.js         # Person class
│   │   ├── House.js          # House class
│   │   ├── Market.js         # Market class
│   │   └── Auction.js        # Auction class
│   ├── scenarios/
│   │   ├── Scenario.js       # Base scenario class
│   │   └── DownsizingScenario.js
│   ├── ui/
│   │   ├── SimulationRenderer.js
│   │   └── Analytics.js
│   ├── utils/
│   │   ├── MathUtils.js      # Statistical functions
│   │   └── Config.js         # Configuration management
│   └── main.js               # Application entry point
├── tests/
│   ├── unit/
│   └── integration/
└── docs/
    └── README.md
```

### Configuration Schema
```javascript
const DEFAULT_CONFIG = {
    // Population
    num_houses: 100,
    num_people: 100,
    
    // Wealth Distribution
    wealth_mean: 500000,
    wealth_std: 300000,
    
    // Housing
    house_price_mean: 400000,
    house_price_std: 250000,
    value_intrinsicness: 0.7,
    
    // Market Dynamics
    turnover_in: 5,
    turnover_out: 5,
    upgrade_threshold: 1.5,
    n_auction_steps: 3,
    
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
```

### API Design

**Core Simulation API**:
```javascript
// Initialize simulation
const sim = new Simulation(config);

// Control simulation
sim.start();
sim.pause();
sim.resume();
sim.step();
sim.stop();

// Access market data
const stats = sim.market.getMarketStats();
const distribution = sim.market.getWealthDistribution();

// Scenario management
sim.addScenario(new DownsizingScenario(2030, 0.1, 0.5));
sim.triggerScenario('downsizing');

// Export data
const csvData = sim.exportData();
```

**Event System**:
```javascript
// Simulation events
sim.on('tick', (market) => { /* Handle tick */ });
sim.on('auction', (results) => { /* Handle auction */ });
sim.on('scenario', (scenario) => { /* Handle scenario */ });
```

## Testing Strategy

### Unit Testing
**Target**: Individual class methods and utility functions

**Key Test Areas**:
- Wealth distribution generation (power law validation)
- House value calculation (hybrid formula)
- Auction logic (Vickrey mechanism correctness)
- Bidding behavior (upgrade threshold enforcement)
- Person/House state management

**Example Tests**:
```javascript
describe('Auction', () => {
    it('should award house to highest bidder', () => {
        // Test basic Vickrey auction mechanics
    });
    
    it('should charge second-highest bid amount', () => {
        // Test pricing mechanism
    });
    
    it('should handle single-bidder edge case', () => {
        // Test 0.75 * bid pricing
    });
});
```

### Integration Testing
**Target**: Multi-class interactions and market behavior

**Key Test Areas**:
- Complete auction cycles
- Market turnover effects
- Scenario execution
- Long-term market stability
- Edge cases (empty markets, no bidders)

**Example Tests**:
```javascript
describe('Market Integration', () => {
    it('should maintain market stability over 100 ticks', () => {
        // Test long-term behavior
    });
    
    it('should handle simultaneous entry and exit', () => {
        // Test turnover mechanics
    });
    
    it('should execute downsizing scenario correctly', () => {
        // Test scenario system
    });
});
```

### Scenario Testing
**Target**: Specific market scenarios and their expected outcomes

**Key Test Areas**:
- Downsizing scenario effects
- Market response to wealth shocks
- Parameter sensitivity analysis
- Performance under different configurations

### Performance Testing
**Target**: Simulation scalability and responsiveness

**Key Test Areas**:
- Large market simulation (1000+ houses)
- Rendering performance
- Memory usage over time
- Auction algorithm efficiency

## Future Enhancements

### Additional Scenario Types
1. **Economic Shock**: Sudden wealth reduction for all participants
2. **Policy Intervention**: Transaction taxes, first-time buyer subsidies
3. **Demographic Change**: Age-based preferences, family formation
4. **Supply Shock**: New construction, natural disasters
5. **Credit Availability**: Financing options affecting bidding power

### Advanced Analytics
1. **Market Efficiency Metrics**: Price discovery speed, allocation efficiency
2. **Social Mobility Tracking**: Movement between housing tiers over time
3. **Market Concentration**: Gini coefficients, wealth distribution changes
4. **Predictive Modeling**: Scenario outcome forecasting
5. **Comparative Analysis**: Multiple simulation runs with statistical analysis

### Enhanced Realism
1. **Financing System**: Mortgage availability and interest rates
2. **Transaction Costs**: Fees that affect bidding behavior
3. **Market Liquidity**: Time-to-sell variations
4. **Geographic Modeling**: Location-based value differences
5. **Rental Markets**: Parallel rental system for non-owners

### Research Features
1. **Batch Simulation**: Run multiple scenarios automatically
2. **Statistical Analysis**: Built-in statistical testing
3. **Parameter Sweeps**: Automated parameter space exploration
4. **Sensitivity Analysis**: Understanding parameter impact
5. **Model Validation**: Comparison with real market data

This comprehensive plan provides a complete roadmap for developing a sophisticated housing market simulation that serves both educational and research purposes while maintaining the flexibility to explore various economic phenomena.