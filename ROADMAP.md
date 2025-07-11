# Housing Market Simulation - Future Development Roadmap

This document contains ideas and features to consider for future development of the housing market simulation.

## Strategic Bidding System (Phase 3 Consideration)

**Status**: Considered but reverted to maintain current simulation behavior

**Description**: Replace the current simple bidding strategy (everyone bids full wealth) with strategic bidding based on housing status and house value.

**Proposed Implementation**:
```javascript
getBidAmount(house) {
    const houseValue = house.calculateValue();
    
    if (!this.house) {
        // Homeless: bid 80-100% of wealth, more aggressive
        const aggressiveBid = Math.max(houseValue, this.wealth * (0.8 + Math.random() * 0.2));
        return Math.min(aggressiveBid, this.wealth);
    } else {
        // Housed: bid 110-130% of house value, more conservative
        const conservativeBid = houseValue * (1.1 + Math.random() * 0.2);
        return Math.min(conservativeBid, this.wealth);
    }
}
```

**Rationale**: 
- More realistic bidding behavior
- Homeless people would be more desperate (bid closer to full wealth)
- Housed people would be more conservative (bid based on house value)
- Adds strategic variation to prevent predictable outcomes

**Considerations**:
- Fundamentally changes auction dynamics and outcomes
- Could affect market research value and comparability with current results
- Should be configurable (toggle between simple/strategic modes)
- Would need comprehensive testing to understand impact on market behavior

**Implementation Requirements**:
- Add configuration parameter `strategic_bidding: boolean`
- Modify `Person.getBidAmount()` to support both modes
- Update auction logic to pass house parameter when needed
- Add unit tests for both bidding strategies
- Document behavioral differences in simulation documentation

---

## Other Future Considerations

### Consider having people give up if they go to long without finding a house

### Market Maker/Bank System
- Add institutional buyers that participate in auctions
- Could help stabilize markets or add different dynamics

### Multiple House Types
- Different house sizes/qualities with different intrinsic values
- Could create more complex upgrade patterns

### Geographic/Location Effects
- Houses in different "neighborhoods" with location-based value modifiers
- Could simulate gentrification or area development

### Economic Shocks/Events
- Periodic events that affect wealth distribution or house values
- Could test market resilience and recovery patterns

### Analytics History Tracking (Phase 4 Priority)
- **Time-series data collection**: Track all analytics variables over time (housed count, wealth distribution, affordability ratios, etc.)
- **Graphical analytics view**: Toggle-able view that replaces the market visualization with graphs of historical data
- **Key metrics to track**:
  - Population metrics (housed vs. unhoused over time)
  - Wealth inequality (Gini coefficient trends)
  - Market efficiency (occupancy rates, turnover)
  - Price trends (average house values, affordability ratios)
  - Market velocity (auction success rates, trade volume)
- **Implementation considerations**:
  - Add `AnalyticsHistory` class to store time-series data
  - Modify `SimulationRenderer` to support analytics view mode
  - Add chart rendering using Canvas or lightweight charting library
  - Provide view toggle controls (Market View / Analytics View)
  - Consider data export functionality for research use

### Advanced Analytics
- Market concentration indices (Herfindahl-Hirschman Index)
- Price volatility metrics
- Turnover rate analysis
- Long-term trend analysis

### Visualization Enhancements
- Time-series graphs of key metrics
- Wealth distribution histograms
- Interactive parameter adjustment
- Export capabilities for research data

---

*Note: All major behavioral changes should be discussed before implementation to maintain simulation integrity and research value.*
