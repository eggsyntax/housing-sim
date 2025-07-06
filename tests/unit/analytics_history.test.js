const assert = require('assert');
const AnalyticsHistory = require('../../js/core/AnalyticsHistory.js');

// Mock test framework
global.describe = (name, fn) => {
    console.log(`\n=== ${name} ===`);
    const tests = [];
    
    global.it = (testName, testFn) => {
        tests.push({ name: testName, fn: testFn });
    };
    
    global.beforeEach = (setupFn) => {
        global._beforeEach = setupFn;
    };
    
    fn();
    
    tests.forEach(test => {
        if (global._beforeEach) global._beforeEach();
        try {
            test.fn();
            console.log(`✓ ${test.name}`);
        } catch (error) {
            console.log(`✗ ${test.name}: ${error.message}`);
        }
    });
};

describe('AnalyticsHistory Tests', () => {
    let history;
    
    beforeEach(() => {
        history = new AnalyticsHistory(100); // Small limit for testing
    });
    
    describe('Data Recording', () => {
        it('should record market statistics snapshots', () => {
            const testStats = {
                currentYear: 2025,
                tickCount: 1,
                totalPeople: 100,
                housedPeople: 80,
                houselessPeople: 20,
                occupancyRate: 0.8,
                giniCoefficient: 0.6,
                averageHouseValue: 300000,
                averageWealth: 250000
            };
            
            history.recordSnapshot(testStats);
            
            assert.strictEqual(history.getDataPointCount(), 1, 'Should record one data point');
            
            const latest = history.getLatestSnapshot();
            assert.strictEqual(latest.year, 2025, 'Should record correct year');
            assert.strictEqual(latest.housingRate, 0.8, 'Should calculate housing rate correctly');
        });
        
        it('should maintain maximum data points limit', () => {
            // Record more than the limit
            for (let i = 0; i < 150; i++) {
                history.recordSnapshot({
                    currentYear: 2025 + i,
                    tickCount: i + 1,
                    totalPeople: 100,
                    housedPeople: 80,
                    houselessPeople: 20,
                    occupancyRate: 0.8,
                    giniCoefficient: 0.6,
                    averageHouseValue: 300000,
                    averageWealth: 250000
                });
            }
            
            assert.strictEqual(history.getDataPointCount(), 100, 'Should maintain max data points limit');
            
            // Should have the most recent data
            const latest = history.getLatestSnapshot();
            assert.strictEqual(latest.year, 2025 + 149, 'Should keep most recent data');
        });
    });
    
    describe('Time Series Data', () => {
        it('should return time series data for specific metrics', () => {
            // Record multiple data points
            for (let i = 0; i < 5; i++) {
                history.recordSnapshot({
                    currentYear: 2025 + i,
                    tickCount: i + 1,
                    totalPeople: 100,
                    housedPeople: 80 + i,
                    houselessPeople: 20 - i,
                    occupancyRate: 0.8 + (i * 0.02),
                    giniCoefficient: 0.6 + (i * 0.01),
                    averageHouseValue: 300000 + (i * 10000),
                    averageWealth: 250000 + (i * 5000)
                });
            }
            
            const housingRateData = history.getTimeSeriesData('housingRate');
            assert.strictEqual(housingRateData.length, 5, 'Should return correct number of data points');
            
            // Check first and last data points
            assert.strictEqual(housingRateData[0].x, 1, 'First tick should be 1');
            assert.strictEqual(housingRateData[0].y, 0.8, 'First housing rate should be 0.8');
            
            assert.strictEqual(housingRateData[4].x, 5, 'Last tick should be 5');
            assert.strictEqual(housingRateData[4].y, 0.84, 'Last housing rate should be 0.84');
        });
        
        it('should return empty array for non-existent metrics', () => {
            history.recordSnapshot({
                currentYear: 2025,
                tickCount: 1,
                totalPeople: 100,
                housedPeople: 80
            });
            
            const nonExistentData = history.getTimeSeriesData('nonExistentMetric');
            assert.strictEqual(nonExistentData.length, 1, 'Should still return data points');
            assert.strictEqual(nonExistentData[0].y, 0, 'Should return 0 for missing metrics');
        });
    });
    
    describe('Data Range and Summary', () => {
        it('should return snapshots within tick range', () => {
            // Record 10 data points
            for (let i = 0; i < 10; i++) {
                history.recordSnapshot({
                    currentYear: 2025 + i,
                    tickCount: i + 1,
                    totalPeople: 100,
                    housedPeople: 80,
                    houselessPeople: 20
                });
            }
            
            const rangeSnapshots = history.getSnapshotsInRange(3, 7);
            assert.strictEqual(rangeSnapshots.length, 5, 'Should return correct range of snapshots');
            assert.strictEqual(rangeSnapshots[0].tick, 3, 'Should start at correct tick');
            assert.strictEqual(rangeSnapshots[4].tick, 7, 'Should end at correct tick');
        });
        
        it('should calculate metric summaries correctly', () => {
            // Record data with known pattern
            const values = [10, 20, 30, 40, 50];
            values.forEach((value, i) => {
                history.recordSnapshot({
                    currentYear: 2025 + i,
                    tickCount: i + 1,
                    totalPeople: 100,
                    housedPeople: value,
                    houselessPeople: 100 - value
                });
            });
            
            const summary = history.getMetricSummary('housedPeople');
            assert.strictEqual(summary.min, 10, 'Should calculate min correctly');
            assert.strictEqual(summary.max, 50, 'Should calculate max correctly');
            assert.strictEqual(summary.avg, 30, 'Should calculate average correctly');
            assert.strictEqual(summary.trend, 40, 'Should calculate trend correctly');
            assert.strictEqual(summary.count, 5, 'Should count data points correctly');
        });
    });
    
    describe('Data Export and Import', () => {
        it('should export and import data correctly', () => {
            // Record some test data
            for (let i = 0; i < 3; i++) {
                history.recordSnapshot({
                    currentYear: 2025 + i,
                    tickCount: i + 1,
                    totalPeople: 100,
                    housedPeople: 80 + i,
                    houselessPeople: 20 - i
                });
            }
            
            const exportedData = history.exportData();
            assert(typeof exportedData === 'string', 'Exported data should be a string');
            
            // Create new history and import
            const newHistory = new AnalyticsHistory();
            newHistory.importData(exportedData);
            
            assert.strictEqual(newHistory.getDataPointCount(), 3, 'Should import correct number of data points');
            
            const originalLatest = history.getLatestSnapshot();
            const importedLatest = newHistory.getLatestSnapshot();
            assert.strictEqual(importedLatest.year, originalLatest.year, 'Should import data correctly');
        });
        
        it('should handle invalid import data gracefully', () => {
            const originalCount = history.getDataPointCount();
            
            // Try to import invalid data
            history.importData('invalid json');
            history.importData('{"invalid": "structure"}');
            
            assert.strictEqual(history.getDataPointCount(), originalCount, 'Should not change data on invalid import');
        });
    });
    
    describe('Metrics Organization', () => {
        it('should provide metrics grouped by category', () => {
            const metricsByCategory = history.getMetricsByCategory();
            
            assert(metricsByCategory.population, 'Should have population category');
            assert(metricsByCategory.housing, 'Should have housing category');
            assert(metricsByCategory.wealth, 'Should have wealth category');
            assert(metricsByCategory.market, 'Should have market category');
            
            assert(Array.isArray(metricsByCategory.population), 'Population should be an array');
            assert(metricsByCategory.population.length > 0, 'Population should have metrics');
            
            // Check that metrics have required properties
            const firstMetric = metricsByCategory.population[0];
            assert(firstMetric.key, 'Metric should have key');
            assert(firstMetric.label, 'Metric should have label');
        });
        
        it('should return available metrics after data recording', () => {
            history.recordSnapshot({
                currentYear: 2025,
                tickCount: 1,
                totalPeople: 100,
                housedPeople: 80
            });
            
            const availableMetrics = history.getAvailableMetrics();
            assert(Array.isArray(availableMetrics), 'Should return array of metrics');
            assert(availableMetrics.includes('totalPeople'), 'Should include totalPeople');
            assert(availableMetrics.includes('housedPeople'), 'Should include housedPeople');
            assert(!availableMetrics.includes('timestamp'), 'Should exclude timestamp');
            assert(!availableMetrics.includes('tick'), 'Should exclude tick');
        });
    });
});

if (require.main === module) {
    console.log('Running Analytics History tests...');
}