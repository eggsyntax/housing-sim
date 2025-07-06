/**
 * Lightweight chart rendering utility for displaying historical analytics data.
 * Uses HTML5 Canvas for efficient rendering without external dependencies.
 */
class ChartRenderer {
    /**
     * Creates a new ChartRenderer instance.
     * @param {HTMLCanvasElement} canvas - The canvas element to render on
     */
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.margin = { top: 20, right: 20, bottom: 40, left: 80 };
        this.colors = [
            '#2563eb', '#dc2626', '#16a34a', '#ca8a04', '#7c3aed',
            '#c2410c', '#0d9488', '#be123c', '#4338f5', '#059669'
        ];
        this.MathUtils = typeof MathUtils !== 'undefined' ? MathUtils : require('./MathUtils.js');
    }

    /**
     * Renders a line chart with multiple data series.
     * @param {Array} datasets - Array of datasets, each with {label, data, color?}
     * @param {Object} options - Chart options {title, xLabel, yLabel, formatY}
     */
    renderLineChart(datasets, options = {}) {
        const { title = '', xLabel = '', yLabel = '', formatY = 'number' } = options;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (!datasets || datasets.length === 0) {
            this.renderNoDataMessage();
            return;
        }
        
        // Calculate chart dimensions
        const chartWidth = this.canvas.width - this.margin.left - this.margin.right;
        const chartHeight = this.canvas.height - this.margin.top - this.margin.bottom;
        
        // Find data bounds
        const allData = datasets.flatMap(dataset => dataset.data || []);
        if (allData.length === 0) {
            this.renderNoDataMessage();
            return;
        }
        
        const xValues = allData.map(d => d.x);
        const yValues = allData.map(d => d.y);
        
        const xMin = Math.min(...xValues);
        const xMax = Math.max(...xValues);
        const yMin = Math.min(0, Math.min(...yValues));
        const yMax = Math.max(...yValues);
        
        // Add padding to y-axis
        const yPadding = (yMax - yMin) * 0.1;
        const yMinPadded = yMin - yPadding;
        const yMaxPadded = yMax + yPadding;
        
        // Render title
        if (title) {
            this.renderTitle(title);
        }
        
        // Render axes
        this.renderAxes(chartWidth, chartHeight, xMin, xMax, yMinPadded, yMaxPadded, xLabel, yLabel, formatY);
        
        // Render data series
        datasets.forEach((dataset, index) => {
            const color = dataset.color || this.colors[index % this.colors.length];
            this.renderLineSeries(dataset.data, chartWidth, chartHeight, xMin, xMax, yMinPadded, yMaxPadded, color);
        });
        
        // Render legend
        this.renderLegend(datasets);
    }

    /**
     * Renders a line chart with a fixed Y-axis scale.
     * @param {Array} datasets - Array of datasets, each with {label, data, color?}
     * @param {Object} options - Chart options {title, xLabel, yLabel, formatY, yMin, yMax}
     */
    renderLineChartWithFixedScale(datasets, options = {}) {
        const { title = '', xLabel = '', yLabel = '', formatY = 'number', yMin = 0, yMax = 100 } = options;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (!datasets || datasets.length === 0) {
            this.renderNoDataMessage();
            return;
        }
        
        // Calculate chart dimensions
        const chartWidth = this.canvas.width - this.margin.left - this.margin.right;
        const chartHeight = this.canvas.height - this.margin.top - this.margin.bottom;
        
        // Find data bounds for X-axis only
        const allData = datasets.flatMap(dataset => dataset.data || []);
        if (allData.length === 0) {
            this.renderNoDataMessage();
            return;
        }
        
        const xValues = allData.map(d => d.x);
        const xMin = Math.min(...xValues);
        const xMax = Math.max(...xValues);
        
        // Use fixed Y-axis bounds
        const yMinPadded = yMin;
        const yMaxPadded = yMax;
        
        // Render title
        if (title) {
            this.renderTitle(title);
        }
        
        // Render axes with fixed Y scale
        this.renderAxes(chartWidth, chartHeight, xMin, xMax, yMinPadded, yMaxPadded, xLabel, yLabel, formatY);
        
        // Render data series
        datasets.forEach((dataset, index) => {
            const color = dataset.color || this.colors[index % this.colors.length];
            this.renderLineSeries(dataset.data, chartWidth, chartHeight, xMin, xMax, yMinPadded, yMaxPadded, color);
        });
        
        // Render legend
        this.renderLegend(datasets);
    }

    /**
     * Renders axes with labels and tick marks.
     */
    renderAxes(chartWidth, chartHeight, xMin, xMax, yMin, yMax, xLabel, yLabel, formatY) {
        this.ctx.strokeStyle = '#374151';
        this.ctx.lineWidth = 1;
        this.ctx.font = '12px Arial';
        this.ctx.fillStyle = '#374151';
        
        // Y-axis
        this.ctx.beginPath();
        this.ctx.moveTo(this.margin.left, this.margin.top);
        this.ctx.lineTo(this.margin.left, this.margin.top + chartHeight);
        this.ctx.stroke();
        
        // X-axis
        this.ctx.beginPath();
        this.ctx.moveTo(this.margin.left, this.margin.top + chartHeight);
        this.ctx.lineTo(this.margin.left + chartWidth, this.margin.top + chartHeight);
        this.ctx.stroke();
        
        // Y-axis ticks and labels
        const yTicks = this.generateTicks(yMin, yMax, 5);
        yTicks.forEach(tick => {
            const y = this.margin.top + chartHeight - ((tick - yMin) / (yMax - yMin)) * chartHeight;
            
            // Tick mark
            this.ctx.beginPath();
            this.ctx.moveTo(this.margin.left - 5, y);
            this.ctx.lineTo(this.margin.left, y);
            this.ctx.stroke();
            
            // Grid line
            this.ctx.strokeStyle = '#e5e7eb';
            this.ctx.beginPath();
            this.ctx.moveTo(this.margin.left, y);
            this.ctx.lineTo(this.margin.left + chartWidth, y);
            this.ctx.stroke();
            this.ctx.strokeStyle = '#374151';
            
            // Label
            const label = this.formatValue(tick, formatY);
            this.ctx.textAlign = 'right';
            this.ctx.fillText(label, this.margin.left - 10, y + 4);
        });
        
        // X-axis ticks and labels
        const xTicks = this.generateTicks(xMin, xMax, 8);
        xTicks.forEach(tick => {
            const x = this.margin.left + ((tick - xMin) / (xMax - xMin)) * chartWidth;
            
            // Tick mark
            this.ctx.beginPath();
            this.ctx.moveTo(x, this.margin.top + chartHeight);
            this.ctx.lineTo(x, this.margin.top + chartHeight + 5);
            this.ctx.stroke();
            
            // Grid line
            this.ctx.strokeStyle = '#e5e7eb';
            this.ctx.beginPath();
            this.ctx.moveTo(x, this.margin.top);
            this.ctx.lineTo(x, this.margin.top + chartHeight);
            this.ctx.stroke();
            this.ctx.strokeStyle = '#374151';
            
            // Label
            this.ctx.textAlign = 'center';
            this.ctx.fillText(tick.toString(), x, this.margin.top + chartHeight + 20);
        });
        
        // Axis labels
        if (yLabel) {
            this.ctx.save();
            this.ctx.translate(15, this.margin.top + chartHeight / 2);
            this.ctx.rotate(-Math.PI / 2);
            this.ctx.textAlign = 'center';
            this.ctx.font = '14px Arial';
            this.ctx.fillText(yLabel, 0, 0);
            this.ctx.restore();
        }
        
        if (xLabel) {
            this.ctx.textAlign = 'center';
            this.ctx.font = '14px Arial';
            this.ctx.fillText(xLabel, this.margin.left + chartWidth / 2, this.canvas.height - 5);
        }
    }

    /**
     * Renders a line series on the chart.
     */
    renderLineSeries(data, chartWidth, chartHeight, xMin, xMax, yMin, yMax, color) {
        if (!data || data.length === 0) return;
        
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        
        let firstPoint = true;
        data.forEach(point => {
            const x = this.margin.left + ((point.x - xMin) / (xMax - xMin)) * chartWidth;
            const y = this.margin.top + chartHeight - ((point.y - yMin) / (yMax - yMin)) * chartHeight;
            
            if (firstPoint) {
                this.ctx.moveTo(x, y);
                firstPoint = false;
            } else {
                this.ctx.lineTo(x, y);
            }
        });
        
        this.ctx.stroke();
        
        // Draw data points
        this.ctx.fillStyle = color;
        data.forEach(point => {
            const x = this.margin.left + ((point.x - xMin) / (xMax - xMin)) * chartWidth;
            const y = this.margin.top + chartHeight - ((point.y - yMin) / (yMax - yMin)) * chartHeight;
            
            this.ctx.beginPath();
            this.ctx.arc(x, y, 3, 0, 2 * Math.PI);
            this.ctx.fill();
        });
    }

    /**
     * Renders the chart title.
     */
    renderTitle(title) {
        this.ctx.font = '16px Arial';
        this.ctx.fillStyle = '#1f2937';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(title, this.canvas.width / 2, 15);
    }

    /**
     * Renders the chart legend.
     */
    renderLegend(datasets) {
        const legendX = this.canvas.width - this.margin.right - 120;
        const legendY = this.margin.top + 20;
        
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'left';
        
        datasets.forEach((dataset, index) => {
            const color = dataset.color || this.colors[index % this.colors.length];
            const y = legendY + index * 20;
            
            // Color box
            this.ctx.fillStyle = color;
            this.ctx.fillRect(legendX, y - 8, 12, 12);
            
            // Label
            this.ctx.fillStyle = '#374151';
            this.ctx.fillText(dataset.label || `Series ${index + 1}`, legendX + 18, y);
        });
    }

    /**
     * Renders a "no data" message.
     */
    renderNoDataMessage() {
        this.ctx.font = '16px Arial';
        this.ctx.fillStyle = '#6b7280';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('No data available', this.canvas.width / 2, this.canvas.height / 2);
    }

    /**
     * Generates nice tick values for an axis.
     */
    generateTicks(min, max, targetCount) {
        const range = max - min;
        if (range === 0) return [min];
        
        const roughStep = range / targetCount;
        const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
        const normalizedStep = roughStep / magnitude;
        
        let step;
        if (normalizedStep <= 1) step = magnitude;
        else if (normalizedStep <= 2) step = 2 * magnitude;
        else if (normalizedStep <= 5) step = 5 * magnitude;
        else step = 10 * magnitude;
        
        const ticks = [];
        const start = Math.ceil(min / step) * step;
        
        for (let tick = start; tick <= max; tick += step) {
            ticks.push(Math.round(tick * 1000) / 1000); // Round to avoid floating point issues
        }
        
        return ticks;
    }

    /**
     * Formats a value based on the specified format type.
     */
    formatValue(value, formatType) {
        switch (formatType) {
            case 'currency':
                return this.MathUtils.formatCurrency(value);
            case 'percentage':
                return `${value.toFixed(1)}%`;
            case 'decimal':
                return value.toFixed(2);
            default:
                return value.toString();
        }
    }

    /**
     * Renders a simple bar chart.
     * @param {Array} data - Array of {label, value} objects
     * @param {Object} options - Chart options {title, yLabel, formatY}
     */
    renderBarChart(data, options = {}) {
        const { title = '', yLabel = '', formatY = 'number' } = options;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (!data || data.length === 0) {
            this.renderNoDataMessage();
            return;
        }
        
        // Calculate chart dimensions
        const chartWidth = this.canvas.width - this.margin.left - this.margin.right;
        const chartHeight = this.canvas.height - this.margin.top - this.margin.bottom;
        
        // Find data bounds
        const values = data.map(d => d.value);
        const yMin = Math.min(0, Math.min(...values));
        const yMax = Math.max(...values);
        
        // Add padding to y-axis
        const yPadding = (yMax - yMin) * 0.1;
        const yMinPadded = yMin - yPadding;
        const yMaxPadded = yMax + yPadding;
        
        // Render title
        if (title) {
            this.renderTitle(title);
        }
        
        // Render Y-axis
        this.renderYAxis(chartHeight, yMinPadded, yMaxPadded, yLabel, formatY);
        
        // Render bars
        const barWidth = chartWidth / data.length * 0.8;
        const barSpacing = chartWidth / data.length;
        
        data.forEach((item, index) => {
            const x = this.margin.left + index * barSpacing + barSpacing * 0.1;
            const barHeight = Math.abs(item.value - yMin) / (yMaxPadded - yMinPadded) * chartHeight;
            const y = this.margin.top + chartHeight - barHeight;
            
            // Bar
            this.ctx.fillStyle = this.colors[index % this.colors.length];
            this.ctx.fillRect(x, y, barWidth, barHeight);
            
            // Label
            this.ctx.fillStyle = '#374151';
            this.ctx.font = '10px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(item.label, x + barWidth / 2, this.margin.top + chartHeight + 15);
        });
        
        // X-axis line
        this.ctx.strokeStyle = '#374151';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(this.margin.left, this.margin.top + chartHeight);
        this.ctx.lineTo(this.margin.left + chartWidth, this.margin.top + chartHeight);
        this.ctx.stroke();
    }

    /**
     * Renders just the Y-axis (helper for bar chart).
     */
    renderYAxis(chartHeight, yMin, yMax, yLabel, formatY) {
        this.ctx.strokeStyle = '#374151';
        this.ctx.lineWidth = 1;
        this.ctx.font = '12px Arial';
        this.ctx.fillStyle = '#374151';
        
        // Y-axis line
        this.ctx.beginPath();
        this.ctx.moveTo(this.margin.left, this.margin.top);
        this.ctx.lineTo(this.margin.left, this.margin.top + chartHeight);
        this.ctx.stroke();
        
        // Y-axis ticks and labels
        const yTicks = this.generateTicks(yMin, yMax, 5);
        yTicks.forEach(tick => {
            const y = this.margin.top + chartHeight - ((tick - yMin) / (yMax - yMin)) * chartHeight;
            
            // Tick mark
            this.ctx.beginPath();
            this.ctx.moveTo(this.margin.left - 5, y);
            this.ctx.lineTo(this.margin.left, y);
            this.ctx.stroke();
            
            // Label
            const label = this.formatValue(tick, formatY);
            this.ctx.textAlign = 'right';
            this.ctx.fillText(label, this.margin.left - 10, y + 4);
        });
        
        // Y-axis label
        if (yLabel) {
            this.ctx.save();
            this.ctx.translate(15, this.margin.top + chartHeight / 2);
            this.ctx.rotate(-Math.PI / 2);
            this.ctx.textAlign = 'center';
            this.ctx.font = '14px Arial';
            this.ctx.fillText(yLabel, 0, 0);
            this.ctx.restore();
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChartRenderer;
}