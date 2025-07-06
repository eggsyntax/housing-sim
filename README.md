# Housing Market Simulation

An interactive JavaScript simulation of housing market dynamics featuring Vickrey auctions, wealth distribution effects, and market turnover. Designed for economic research and educational use.

## How to Run

**Simple Setup:**
1. Open `index.html` in your web browser
2. The simulation will initialize automatically with default parameters
3. Use the control buttons to start, pause, or step through the simulation

**No server required** - this is a client-side application that runs entirely in your browser.

## What It Simulates

This simulation models a discrete-time housing market where:

- **People** with varying wealth levels compete for **houses** through auctions
- **Vickrey (sealed-bid, second-price) auctions** determine house sales
- **Market turnover** occurs as people enter and exit the market
- **Wealth inequality** follows a power-law distribution similar to real economies
- **House values** combine intrinsic worth with market pricing

## Key Features

### Economic Mechanics
- **Vickrey Auctions**: Winners pay the second-highest bid, creating truthful bidding incentives
- **Hybrid House Valuation**: `value = 0.7 * intrinsic_value + 0.3 * last_selling_price`
- **Upgrade Threshold Logic**: Existing homeowners only bid on houses worth ≥1.5× their current home
- **Power Law Wealth Distribution**: Realistic wealth inequality (Gini coefficient ~60%)
- **Vacant House Depreciation**: Unoccupied houses lose 5% value per year

### Market Dynamics
- **Population Turnover**: People enter and exit the market each tick
- **Batch Auctions**: Multiple auction rounds per tick for dynamic trading
- **Initial Occupancy**: Markets start with ~80% of houses occupied
- **Market Analytics**: Comprehensive statistics including inequality metrics

### Visualization
- **Real-time Graphics**: Interactive canvas showing houses and people
- **Color-coded States**: Houses show availability, recent trades, and ownership status
- **Enhanced Tooltips**: Hover over houses for detailed information
- **Rich Statistics**: Live market metrics including Gini coefficient and wealth concentration

### Analytics Features
- **Historical Data Tracking**: Complete time-series data for all market metrics
- **Dual-Chart System**: Separate views for percentage metrics (0-100% fixed scale) and financial metrics
- **Market Trend Analysis**: Housing rates, occupancy rates, wealth inequality over time
- **Fixed Scaling**: Percentage charts use consistent 0-100% Y-axis for accurate trend comparison
- **Data Export**: Historical data can be exported for external analysis

## Core Parameters

### Population & Market Size
- `num_houses` (100): Number of houses in the market
- `num_people` (100): Number of people in the market

### Wealth Distribution
- `wealth_mean` ($400,000): Average person wealth
- `wealth_std` ($200,000): Wealth distribution spread

### Housing Values
- `house_price_mean` ($300,000): Average initial house price
- `house_price_std` ($150,000): House price distribution spread
- `value_intrinsicness` (0.7): Weight of intrinsic value vs. market price in house valuation
- `vacant_depreciation` (0.05): Yearly value loss for unoccupied houses (5%)

### Market Dynamics
- `turnover_in` (2): People entering market per tick
- `turnover_out` (2): People exiting market per tick
- `upgrade_threshold` (1.5): Minimum value multiplier for homeowner upgrades
- `n_auction_steps` (3): Number of auction batches per tick

### Simulation Control
- `simulation_speed` (1000ms): Time between simulation ticks
- `starting_year` (2025): Initial simulation year

## Understanding the Display

### House Colors
- **Light Red**: Available for auction
- **Light Orange**: Just became available (recently vacated)
- **Light Green**: Occupied
- **Light Blue**: Just bought (recently occupied)

### House Information
- **House ID**: Displayed as "H1", "H2", etc.
- **Current Value**: Shown in thousands (e.g., "250k")
- **Ownership Years**: Shows how long current owner has lived there

### Statistics Panel
- **Population Metrics**: Total people, housed vs. unhoused
- **Wealth Distribution**: Average, median, Gini coefficient
- **Market Activity**: Occupancy rate, recent trades, affordability ratio

## Economic Behavior

### Bidding Strategy
- **All participants bid their full wealth** (simplified but effective model)
- **Homeless people** bid on any house they can afford
- **Homeowners** only bid on houses worth ≥1.5× their current home value

### Market Forces
- **Wealth inequality** creates natural market stratification
- **Vickrey auctions** ensure efficient price discovery
- **Turnover** provides market liquidity and prevents stagnation
- **Vacant depreciation** encourages housing utilization
- **Batch auctions** create more dynamic trading patterns

### Typical Dynamics
1. **Wealthy newcomers** often outbid existing residents
2. **Market cycles** emerge from turnover and wealth distribution
3. **Price appreciation** occurs through competitive bidding
4. **Wealth concentration** develops over time
5. **Housing shortages** can develop if turnover is imbalanced

## Research Applications

This simulation is designed to explore:
- **Wealth inequality effects** on housing markets
- **Auction mechanism efficiency** in real estate
- **Market stability** under different turnover rates
- **Price discovery** in competitive housing markets
- **Policy impact modeling** (via parameter adjustment)

## Controls

### Simulation Controls
- **Start**: Begin or resume the simulation
- **Pause**: Temporarily halt the simulation (can be resumed)
- **Step**: Advance exactly one tick
- **Reset**: Return to initial state with new random seed
- **Speed Slider**: Adjust time between ticks (100ms - 3000ms)

### View Controls
- **Market View**: Display interactive house grid with tooltips and real-time market activity
- **Analytics View**: Show historical charts with percentage trends and financial metrics

## Technical Details

- **Architecture**: Object-oriented JavaScript with ES6 classes
- **Rendering**: HTML5 Canvas with real-time updates
- **Testing**: Comprehensive unit and integration test suite
- **Performance**: Optimized for 100+ houses with smooth performance
- **Browser Compatibility**: Modern browsers supporting ES6+

## Files Structure

```
├── index.html              # Main application page
├── css/style.css           # Styling
├── js/
│   ├── main.js            # Application entry point
│   ├── core/              # Core simulation logic
│   │   ├── Market.js      # Market management
│   │   ├── Person.js      # Person behavior
│   │   ├── House.js       # House properties
│   │   ├── Auction.js     # Auction mechanics
│   │   └── AnalyticsHistory.js # Time-series data tracking
│   ├── ui/                # User interface
│   │   └── SimulationRenderer.js # Canvas rendering & analytics views
│   └── utils/             # Utilities
│       ├── Config.js      # Configuration management
│       ├── MathUtils.js   # Mathematical utilities
│       └── ChartRenderer.js # Chart visualization
└── tests/                 # Test suite
    ├── unit/              # Unit tests
    └── integration/       # Integration tests
```

## Development

See `ROADMAP.md` for future development considerations.

Run tests with: `node run_tests.js`

---

*Built for economic research and educational exploration of housing market dynamics.*