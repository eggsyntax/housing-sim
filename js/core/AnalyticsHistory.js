/**
 * Manages historical analytics data for the housing market simulation.
 * Tracks time-series data for key market metrics and provides data for visualization.
 */
class AnalyticsHistory {
    /**
     * Creates a new AnalyticsHistory instance.
     * @param {number} maxDataPoints - Maximum number of data points to store (default: 1000)
     */
    constructor(maxDataPoints = 1000) {
        this.maxDataPoints = maxDataPoints;
        this.data = [];
        this.startTime = Date.now();
    }

    /**
     * Records a snapshot of market statistics at the current time.
     * @param {Object} marketStats - Market statistics from Market.getMarketStats()
     */
    recordSnapshot(marketStats) {
        const snapshot = {
            timestamp: Date.now(),
            year: marketStats.currentYear,
            tick: marketStats.tickCount,
            
            // Population metrics
            totalPeople: marketStats.totalPeople,
            housedPeople: marketStats.housedPeople,
            houselessPeople: marketStats.houselessPeople,
            housingRate: marketStats.totalPeople > 0 ? marketStats.housedPeople / marketStats.totalPeople : 0,
            
            // Housing metrics
            totalHouses: marketStats.totalHouses,
            occupiedHouses: marketStats.occupiedHouses,
            availableHouses: marketStats.availableHouses,
            occupancyRate: marketStats.occupancyRate,
            
            // Wealth metrics
            averageWealth: marketStats.averageWealth,
            medianWealth: marketStats.medianWealth,
            wealthRange: marketStats.wealthRange,
            giniCoefficient: marketStats.giniCoefficient,
            wealthConcentration: marketStats.wealthConcentration,
            
            // Market metrics
            averageHouseValue: marketStats.averageHouseValue,
            medianHouseValue: marketStats.medianHouseValue,
            houseValueRange: marketStats.houseValueRange,
            affordabilityRatio: marketStats.affordabilityRatio,
            marketVelocity: marketStats.marketVelocity,
            
            // Auction metrics (if available)
            auctionSuccessRate: marketStats.lastAuctionResults ? 
                marketStats.lastAuctionResults.successfulSales / Math.max(1, marketStats.lastAuctionResults.totalAuctioned) : 0,
            averageAuctionPrice: marketStats.lastAuctionResults ? 
                marketStats.lastAuctionResults.averagePrice : 0
        };
        
        this.data.push(snapshot);
        
        // Maintain maximum data points by removing oldest entries
        if (this.data.length > this.maxDataPoints) {
            this.data.shift();
        }
    }

    /**
     * Gets time-series data for a specific metric.
     * @param {string} metric - The metric name to retrieve
     * @returns {Array} Array of {x: tick, y: value} objects
     */
    getTimeSeriesData(metric) {
        return this.data.map(snapshot => ({
            x: snapshot.tick,
            y: snapshot[metric] || 0
        }));
    }

    /**
     * Gets the latest recorded snapshot.
     * @returns {Object|null} Latest snapshot or null if no data
     */
    getLatestSnapshot() {
        return this.data.length > 0 ? this.data[this.data.length - 1] : null;
    }

    /**
     * Gets snapshots within a specific tick range.
     * @param {number} startTick - Starting tick (inclusive)
     * @param {number} endTick - Ending tick (inclusive)
     * @returns {Array} Array of snapshots within the range
     */
    getSnapshotsInRange(startTick, endTick) {
        return this.data.filter(snapshot => 
            snapshot.tick >= startTick && snapshot.tick <= endTick
        );
    }

    /**
     * Gets summary statistics for a metric over time.
     * @param {string} metric - The metric name
     * @returns {Object} Summary statistics (min, max, avg, trend)
     */
    getMetricSummary(metric) {
        const values = this.data.map(snapshot => snapshot[metric] || 0);
        
        if (values.length === 0) {
            return { min: 0, max: 0, avg: 0, trend: 0, count: 0 };
        }
        
        const min = Math.min(...values);
        const max = Math.max(...values);
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        
        // Calculate simple trend (difference between last and first values)
        const trend = values.length > 1 ? values[values.length - 1] - values[0] : 0;
        
        return {
            min: min,
            max: max,
            avg: avg,
            trend: trend,
            count: values.length
        };
    }

    /**
     * Gets all available metric names.
     * @returns {Array} Array of metric names
     */
    getAvailableMetrics() {
        if (this.data.length === 0) return [];
        
        const snapshot = this.data[0];
        return Object.keys(snapshot).filter(key => 
            !['timestamp', 'year', 'tick'].includes(key)
        );
    }

    /**
     * Gets metrics grouped by category for organized display.
     * @returns {Object} Metrics grouped by category
     */
    getMetricsByCategory() {
        return {
            population: [
                { key: 'totalPeople', label: 'Total People' },
                { key: 'housedPeople', label: 'Housed People' },
                { key: 'houselessPeople', label: 'Looking for Houses' },
                { key: 'housingRate', label: 'Housing Rate', format: 'percentage' }
            ],
            housing: [
                { key: 'totalHouses', label: 'Total Houses' },
                { key: 'occupiedHouses', label: 'Occupied Houses' },
                { key: 'availableHouses', label: 'Available Houses' },
                { key: 'occupancyRate', label: 'Occupancy Rate', format: 'percentage' }
            ],
            wealth: [
                { key: 'averageWealth', label: 'Average Wealth', format: 'currency' },
                { key: 'medianWealth', label: 'Median Wealth', format: 'currency' },
                { key: 'giniCoefficient', label: 'Gini Coefficient', format: 'percentage' },
                { key: 'wealthConcentration', label: 'Top 10% Wealth Share', format: 'percentage' }
            ],
            market: [
                { key: 'averageHouseValue', label: 'Average House Value', format: 'currency' },
                { key: 'medianHouseValue', label: 'Median House Value', format: 'currency' },
                { key: 'affordabilityRatio', label: 'Affordability Ratio', format: 'decimal' },
                { key: 'marketVelocity', label: 'Market Velocity' }
            ],
            auctions: [
                { key: 'auctionSuccessRate', label: 'Auction Success Rate', format: 'percentage' },
                { key: 'averageAuctionPrice', label: 'Average Auction Price', format: 'currency' }
            ]
        };
    }

    /**
     * Exports historical data as JSON.
     * @returns {string} JSON string of all historical data
     */
    exportData() {
        return JSON.stringify({
            metadata: {
                recordingStartTime: this.startTime,
                exportTime: Date.now(),
                dataPointCount: this.data.length,
                maxDataPoints: this.maxDataPoints
            },
            data: this.data
        }, null, 2);
    }

    /**
     * Imports historical data from JSON.
     * @param {string} jsonData - JSON string containing historical data
     */
    importData(jsonData) {
        try {
            const imported = JSON.parse(jsonData);
            if (imported.data && Array.isArray(imported.data)) {
                this.data = imported.data;
                this.startTime = imported.metadata?.recordingStartTime || Date.now();
                
                // Maintain maxDataPoints limit
                if (this.data.length > this.maxDataPoints) {
                    this.data = this.data.slice(-this.maxDataPoints);
                }
            }
        } catch (error) {
            console.error('Failed to import analytics data:', error);
        }
    }

    /**
     * Clears all historical data.
     */
    clear() {
        this.data = [];
        this.startTime = Date.now();
    }

    /**
     * Gets the total number of recorded data points.
     * @returns {number} Number of data points
     */
    getDataPointCount() {
        return this.data.length;
    }

    /**
     * Gets the tick range of recorded data.
     * @returns {Object} Object with min and max tick values
     */
    getTickRange() {
        if (this.data.length === 0) {
            return { min: 0, max: 0 };
        }
        
        const ticks = this.data.map(snapshot => snapshot.tick);
        return {
            min: Math.min(...ticks),
            max: Math.max(...ticks)
        };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnalyticsHistory;
}