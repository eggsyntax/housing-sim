/**
 * Handles rendering of the housing market simulation on HTML5 Canvas.
 * Provides visual representation of houses, people, market stats, and interactive tooltips.
 */
class SimulationRenderer {
    /**
     * Creates a new SimulationRenderer instance.
     * @param {HTMLCanvasElement} canvasElement - Canvas element for rendering
     * @param {HTMLElement} consoleElement - Console element (deprecated, pass null)
     * @param {HTMLElement} analyticsContainer - Container for market statistics
     */
    constructor(canvasElement, consoleElement, analyticsContainer) {
        this.canvas = canvasElement;
        this.ctx = canvasElement.getContext('2d');
        this.consoleDiv = consoleElement;
        this.analyticsContainer = analyticsContainer;
        
        // View mode state
        this.viewMode = 'market'; // 'market' or 'analytics'
        this.percentageMetrics = ['housingRate', 'occupancyRate', 'giniCoefficient'];
        this.currencyMetrics = ['averageHouseValue', 'averageWealth'];
        this.chartRenderer = null;
        
        // Layout configuration (optimized for 100 houses)
        this.gridCols = 10;
        this.gridRows = 10;
        this.houseSize = 40; // Reduced for better fit with 100 houses
        this.personSize = 10; // Proportionally reduced
        this.margin = 8; // Reduced margin for better space utilization
        
        // Colors for different states - lighter/pastel versions for better text contrast
        this.colors = {
            available: '#ffcccb',           // Light red - available house
            'just-available': '#ffe4b5',    // Light orange - just became available  
            occupied: '#90ee90',            // Light green - occupied house
            'just-occupied': '#add8e6',     // Light blue - just became occupied
            background: '#ecf0f1',          // Light gray background
            person: '#2c3e50',              // Dark blue for people
            personHomeless: '#e67e22',      // Orange for people looking for houses
            border: '#34495e',              // Dark gray for borders
            text: '#2c3e50'                 // Dark text
        };
        
        // Animation state
        this.animationFrame = null;
        this.isAnimating = false;
        this.animationTime = 0;
        this.lastAuctionResults = null;
        this.auctionHighlightTime = 0;
        
        // Setup canvas
        this.setupCanvas();
        
        // Initialize chart renderer
        this.chartRenderer = new ChartRenderer(this.canvas);
        
        // Console output is handled separately through browser console
    }

    /**
     * Configures canvas dimensions and rendering settings.
     */
    setupCanvas() {
        // Calculate canvas size based on grid and house size
        const canvasWidth = this.gridCols * (this.houseSize + this.margin) + this.margin + 200; // Extra space for looking area
        const canvasHeight = this.gridRows * (this.houseSize + this.margin) + this.margin + 100; // Extra space for info
        
        this.canvas.width = canvasWidth;
        this.canvas.height = canvasHeight;
        
        // Set CSS size for responsive design
        this.canvas.style.maxWidth = '100%';
        this.canvas.style.height = 'auto';
        
        // Configure text rendering quality
        this.ctx.imageSmoothingEnabled = false; // For crisp pixel-perfect rendering
        this.ctx.textRenderingOptimization = 'optimizeQuality';
        
        // Setup default font
        this.ctx.font = 'bold 11px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
    }

    /**
     * Renders the complete market visualization including houses, people, and stats.
     * @param {Market} market - The market instance to render
     */

    renderMarket(market) {
        if (this.viewMode === 'analytics') {
            this.renderAnalytics(market);
        } else {
            this.renderMarketView(market);
        }
    }

    /**
     * Renders the market visualization view.
     * @param {Market} market - The market instance to render
     */
    renderMarketView(market) {
        // Clear canvas
        this.ctx.fillStyle = this.colors.background;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw title
        this.ctx.fillStyle = this.colors.text;
        this.ctx.font = 'bold 18px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Housing Market - Year ${market.currentYear}`, 10, 25);
        
        // Draw houses
        this.renderHouses(market.houses);
        
        // Draw people
        this.renderPeople(market.people);
        
        // Draw legend
        this.renderLegend();
        
        // Draw looking area
        this.renderLookingArea(market.people);
        
        // Re-render tooltip if we have a hovered house
        if (this.hoveredHouse && this.mouseX !== undefined && this.mouseY !== undefined) {
            this.renderTooltip(this.mouseX, this.mouseY, this.hoveredHouse);
        }
    }

    /**
     * Renders the analytics view with historical charts.
     * @param {Market} market - The market instance to render
     */
    renderAnalytics(market) {
        const analyticsHistory = market.getAnalyticsHistory();
        
        // Clear canvas
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw title
        this.ctx.fillStyle = this.colors.text;
        this.ctx.font = 'bold 18px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Market Analytics - Year ${market.currentYear}`, 10, 25);
        
        if (analyticsHistory.getDataPointCount() === 0) {
            // No data available message
            this.ctx.fillStyle = '#6b7280';
            this.ctx.font = '16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('No historical data available yet', this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.fillText('Run the simulation to collect data', this.canvas.width / 2, this.canvas.height / 2 + 25);
            return;
        }
        
        // Create two separate chart renderers for top and bottom charts
        const topChartHeight = Math.floor((this.canvas.height - 80) * 0.6); // 60% for percentage chart
        const bottomChartHeight = Math.floor((this.canvas.height - 80) * 0.4); // 40% for currency chart
        
        // Render percentage metrics chart (top)
        this.renderPercentageChart(analyticsHistory, topChartHeight);
        
        // Render currency metrics chart (bottom)
        this.renderCurrencyChart(analyticsHistory, bottomChartHeight, topChartHeight + 60);
    }

    /**
     * Renders all houses in the grid layout.
     * @param {Array} houses - Array of house instances to render
     */
    renderHouses(houses) {
        houses.forEach((house, index) => {
            const position = this.getHousePosition(index);
            this.renderHouse(house, position.x, position.y);
        });
    }

    renderHouse(house, x, y) {
        const info = house.getDisplayInfo();
        
        // Get color based on state
        const fillColor = this.colors[info.colorState] || this.colors.available;
        
        // Draw house rectangle
        this.ctx.fillStyle = fillColor;
        this.ctx.fillRect(x, y, this.houseSize, this.houseSize);
        
        // Draw border
        this.ctx.strokeStyle = this.colors.border;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, this.houseSize, this.houseSize);
        
        // Draw house ID (optimized for smaller houses)
        this.ctx.fillStyle = this.colors.text;
        this.ctx.font = 'bold 9px Arial';
        this.ctx.textAlign = 'center';
        
        // Add text shadow for readability
        this.ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
        this.ctx.shadowBlur = 1;
        this.ctx.shadowOffsetX = 1;
        this.ctx.shadowOffsetY = 1;
        
        this.ctx.fillText(house.id.replace('house_', 'H'), x + this.houseSize/2, y + 10);
        
        // Draw value (simplified for performance)
        this.ctx.font = 'bold 7px Arial';
        const value = Math.round(info.currentValue / 1000) + 'k';
        this.ctx.fillText(value, x + this.houseSize/2, y + 20);
        
        // Draw ownership years if owned (simplified)
        if (!info.isAvailable && info.yearsSinceOwnership > 0) {
            this.ctx.font = '6px Arial';
            this.ctx.fillText(`${info.yearsSinceOwnership}y`, x + this.houseSize/2, y + this.houseSize - 6);
        }
        
        // Reset shadow
        this.ctx.shadowColor = 'transparent';
        this.ctx.shadowBlur = 0;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;
    }

    renderPeople(people) {
        people.forEach(person => {
            if (person.house) {
                // Person is housed - draw them in their house
                this.renderPersonInHouse(person);
            }
        });
    }

    /**
     * Renders a person inside their house.
     * @param {Person} person - The person to render
     */
    renderPersonInHouse(person) {
        const house = person.house;
        const houseIndex = this.getHouseIndex(house);
        
        if (houseIndex === -1) return;
        
        const housePosition = this.getHousePosition(houseIndex);
        
        // Draw person as a circle in the house
        const personX = housePosition.x + this.houseSize - this.personSize - 3;
        const personY = housePosition.y + 3;
        
        this.ctx.fillStyle = this.colors.person;
        this.ctx.beginPath();
        this.ctx.arc(personX + this.personSize/2, personY + this.personSize/2, this.personSize/2, 0, 2 * Math.PI);
        this.ctx.fill();
        
        // Draw person ID
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 8px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(person.id.replace('person_', 'P'), personX + this.personSize/2, personY + this.personSize/2);
    }

    renderLookingArea(people) {
        const lookingPeople = people.filter(p => !p.house);
        
        if (lookingPeople.length === 0) return;
        
        // Draw looking area
        const areaX = this.gridCols * (this.houseSize + this.margin) + 20;
        const areaY = 50;
        const areaWidth = 150;
        const areaHeight = Math.max(200, lookingPeople.length * 25 + 40);
        
        // Draw background
        this.ctx.fillStyle = '#f8f9fa';
        this.ctx.fillRect(areaX, areaY, areaWidth, areaHeight);
        
        // Draw border
        this.ctx.strokeStyle = this.colors.border;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(areaX, areaY, areaWidth, areaHeight);
        
        // Draw title
        this.ctx.fillStyle = this.colors.text;
        this.ctx.font = 'bold 12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Looking', areaX + areaWidth/2, areaY + 20);
        
        // Draw looking people
        lookingPeople.forEach((person, index) => {
            const personY = areaY + 35 + index * 25;
            
            // Draw person circle
            this.ctx.fillStyle = this.colors.personHomeless;
            this.ctx.beginPath();
            this.ctx.arc(areaX + 20, personY, this.personSize/2, 0, 2 * Math.PI);
            this.ctx.fill();
            
            // Draw person info
            this.ctx.fillStyle = this.colors.text;
            this.ctx.font = '10px Arial';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(person.id.replace('person_', 'P'), areaX + 35, personY - 5);
            
            // Draw wealth
            this.ctx.font = '9px Arial';
            const wealth = Math.round(person.wealth / 1000) + 'k';
            this.ctx.fillText(`$${wealth}`, areaX + 35, personY + 8);
        });
    }

    renderLegend() {
        const legendX = 10;
        const legendY = this.canvas.height - 80;
        
        // Legend background
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.fillRect(legendX, legendY, 300, 70);
        this.ctx.strokeStyle = this.colors.border;
        this.ctx.strokeRect(legendX, legendY, 300, 70);
        
        // Legend title
        this.ctx.fillStyle = this.colors.text;
        this.ctx.font = 'bold 12px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('Legend:', legendX + 10, legendY + 15);
        
        // Legend items
        const items = [
            { color: this.colors.available, text: 'Available' },
            { color: this.colors['just-available'], text: 'Just Available' },
            { color: this.colors.occupied, text: 'Occupied' },
            { color: this.colors['just-occupied'], text: 'Just Bought' }
        ];
        
        this.ctx.font = '10px Arial';
        items.forEach((item, index) => {
            const itemX = legendX + 10 + (index % 2) * 140;
            const itemY = legendY + 35 + Math.floor(index / 2) * 20;
            
            // Color square
            this.ctx.fillStyle = item.color;
            this.ctx.fillRect(itemX, itemY - 5, 10, 10);
            
            // Text
            this.ctx.fillStyle = this.colors.text;
            this.ctx.fillText(item.text, itemX + 15, itemY);
        });
    }

    getHouseIndex(house) {
        // This is a simple approach - in a real implementation, 
        // we'd want to maintain a house->index mapping
        const houseNumber = parseInt(house.id.replace('house_', ''));
        return houseNumber - 1; // Convert to 0-based index
    }

    renderAuctionFeedback(auctionResults) {
        if (!auctionResults || auctionResults.length === 0) return;
        
        // Store auction results and start highlight timer
        if (this.lastAuctionResults !== auctionResults) {
            this.lastAuctionResults = auctionResults;
            this.auctionHighlightTime = performance.now();
            this.startAnimation();
        }
        
        // Calculate highlight intensity based on time since auction
        const timeSinceAuction = performance.now() - this.auctionHighlightTime;
        const highlightDuration = 3000; // 3 seconds
        
        if (timeSinceAuction < highlightDuration) {
            const intensity = 1 - (timeSinceAuction / highlightDuration);
            const pulseSpeed = 0.01;
            const pulse = (Math.sin(timeSinceAuction * pulseSpeed) + 1) * 0.5;
            
            // Highlight recently sold houses
            auctionResults.forEach(result => {
                if (result.winner) {
                    const houseIndex = this.getHouseIndex(result.house);
                    if (houseIndex >= 0) {
                        const row = Math.floor(houseIndex / this.gridCols);
                        const col = houseIndex % this.gridCols;
                        
                        const x = col * (this.houseSize + this.margin) + this.margin;
                        const y = row * (this.houseSize + this.margin) + this.margin + 40;
                        
                        // Draw pulsing border effect
                        this.ctx.strokeStyle = `rgba(241, 196, 15, ${intensity * pulse})`;
                        this.ctx.lineWidth = 4 * intensity;
                        this.ctx.strokeRect(x - 2, y - 2, this.houseSize + 4, this.houseSize + 4);
                        
                        // Draw "SOLD!" text
                        if (intensity > 0.5) {
                            this.ctx.fillStyle = `rgba(241, 196, 15, ${intensity})`;
                            this.ctx.font = 'bold 10px Arial';
                            this.ctx.textAlign = 'center';
                            this.ctx.fillText('SOLD!', x + this.houseSize/2, y - 8);
                        }
                    }
                }
            });
        } else {
            // Stop animation when highlight period is over
            this.stopAnimation();
        }
    }

    updateStats(market) {
        if (!this.analyticsContainer) return;
        
        const stats = market.getMarketStats();
        
        // Update statistics display with enhanced analytics
        this.analyticsContainer.innerHTML = `
            <div class="stats-grid">
                <div class="stat-item">
                    <span class="stat-label">Year:</span>
                    <span class="stat-value">${stats.currentYear}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Population:</span>
                    <span class="stat-value">${stats.totalPeople}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Housed:</span>
                    <span class="stat-value">${stats.housedPeople}/${stats.totalPeople} (${((stats.housedPeople / stats.totalPeople) * 100).toFixed(1)}%)</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Available:</span>
                    <span class="stat-value">${stats.availableHouses}/${stats.totalHouses}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Avg Wealth:</span>
                    <span class="stat-value">${this.formatCurrency(stats.averageWealth)}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Median Wealth:</span>
                    <span class="stat-value">${this.formatCurrency(stats.medianWealth)}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Wealth Inequality:</span>
                    <span class="stat-value">${(stats.giniCoefficient * 100).toFixed(1)}%</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Top 10% Wealth:</span>
                    <span class="stat-value">${(stats.wealthConcentration * 100).toFixed(1)}%</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Avg House Value:</span>
                    <span class="stat-value">${this.formatCurrency(stats.averageHouseValue)}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Market Velocity:</span>
                    <span class="stat-value">${stats.marketVelocity} recent trades</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Affordability:</span>
                    <span class="stat-value">${stats.affordabilityRatio.toFixed(2)}x</span>
                </div>
                ${stats.lastAuctionResults ? `
                <div class="stat-item">
                    <span class="stat-label">Last Auction:</span>
                    <span class="stat-value">${stats.lastAuctionResults.successfulSales}/${stats.lastAuctionResults.totalAuctioned} sold</span>
                </div>
                ` : ''}
            </div>
        `;
    }

    formatCurrency(amount) {
        if (amount >= 1000000) {
            return '$' + (amount / 1000000).toFixed(1) + 'M';
        } else if (amount >= 1000) {
            return '$' + (amount / 1000).toFixed(0) + 'K';
        } else {
            return '$' + amount.toFixed(0);
        }
    }

    // Animation helpers for future use
    startAnimation() {
        this.isAnimating = true;
        this.animate();
    }

    stopAnimation() {
        this.isAnimating = false;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
    }

    animate() {
        if (this.isAnimating) {
            // Re-render the market with updated animations
            if (this.market) {
                this.renderMarket(this.market);
                
                // Add auction feedback only in market view mode
                if (this.viewMode === 'market' && this.lastAuctionResults) {
                    this.renderAuctionFeedback(this.lastAuctionResults);
                }
            }
            
            this.animationFrame = requestAnimationFrame(() => this.animate());
        }
    }

    setMarket(market) {
        this.market = market;
    }

    // Mouse interaction setup for mouseover features
    setupMouseInteraction(market) {
        this.canvas.addEventListener('mousemove', (event) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            
            this.handleMouseMove(x, y, market);
        });
        
        this.canvas.addEventListener('mouseleave', () => {
            // Clear tooltip when mouse leaves canvas
            if (this.hoveredHouse) {
                this.hoveredHouse = null;
                if (this.market) {
                    this.renderMarket(this.market);
                    if (this.viewMode === 'market' && this.lastAuctionResults) {
                        this.renderAuctionFeedback(this.lastAuctionResults);
                    }
                }
            }
        });
        
        this.canvas.addEventListener('click', (event) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            
            this.handleClick(x, y, market);
        });
    }

    handleMouseMove(x, y, market) {
        // Store mouse position
        this.mouseX = x;
        this.mouseY = y;
        
        // Check if mouse is over a house
        const hoveredHouse = this.getHouseAtPosition(x, y, market);
        
        if (hoveredHouse !== this.hoveredHouse) {
            this.hoveredHouse = hoveredHouse;
            // Re-render to show/hide tooltip
            if (this.market) {
                this.renderMarket(this.market);
                if (this.viewMode === 'market' && this.lastAuctionResults) {
                    this.renderAuctionFeedback(this.lastAuctionResults);
                }
                // Only render tooltip if we have a hovered house and in market view
                if (this.viewMode === 'market' && this.hoveredHouse) {
                    this.renderTooltip(x, y, this.hoveredHouse);
                }
            }
        }
    }

    /**
     * Calculates the screen position for a house at the given grid index.
     * @param {number} index - Grid index of the house
     * @returns {Object} Object with x and y coordinates
     */
    getHousePosition(index) {
        const row = Math.floor(index / this.gridCols);
        const col = index % this.gridCols;
        
        return {
            x: col * (this.houseSize + this.margin) + this.margin,
            y: row * (this.houseSize + this.margin) + this.margin + 40
        };
    }

    /**
     * Finds the house at the given screen coordinates.
     * @param {number} x - Screen x coordinate
     * @param {number} y - Screen y coordinate
     * @param {Market} market - Market instance containing houses
     * @returns {House|null} The house at the position, or null if none found
     */
    getHouseAtPosition(x, y, market) {
        if (!market || !market.houses) return null;
        
        // Check each house position
        for (let index = 0; index < market.houses.length; index++) {
            const position = this.getHousePosition(index);
            
            if (x >= position.x && x <= position.x + this.houseSize &&
                y >= position.y && y <= position.y + this.houseSize) {
                return market.houses[index];
            }
        }
        
        return null;
    }

    /**
     * Calculates optimal tooltip position to stay within canvas bounds.
     * @param {number} x - Mouse x coordinate
     * @param {number} y - Mouse y coordinate
     * @param {number} width - Tooltip width
     * @param {number} height - Tooltip height
     * @returns {Object} Object with x and y coordinates for tooltip
     */
    calculateTooltipPosition(x, y, width, height) {
        return {
            x: Math.min(x + 10, this.canvas.width - width - 10),
            y: Math.max(y - height - 10, 10)
        };
    }

    /**
     * Renders a tooltip for the given house at the specified coordinates.
     * @param {number} x - Mouse x coordinate
     * @param {number} y - Mouse y coordinate
     * @param {House} house - House to display information for
     */
    renderTooltip(x, y, house) {
        if (!house) return;
        
        const info = house.getDisplayInfo();
        
        // Calculate tooltip size based on content
        const isOccupied = info.ownerId;
        const tooltipWidth = 220;
        const tooltipHeight = isOccupied ? 120 : 100;
        const position = this.calculateTooltipPosition(x, y, tooltipWidth, tooltipHeight);
        const tooltipX = position.x;
        const tooltipY = position.y;
        
        // Draw tooltip background with border
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        this.ctx.fillRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight);
        
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight);
        
        // Draw tooltip content
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 13px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`${house.id}`, tooltipX + 10, tooltipY + 20);
        
        this.ctx.font = '11px Arial';
        this.ctx.fillText(`Value: ${info.formattedCurrentValue}`, tooltipX + 10, tooltipY + 38);
        this.ctx.fillText(`Last Price: ${info.formattedLastPrice}`, tooltipX + 10, tooltipY + 54);
        
        if (isOccupied) {
            this.ctx.fillStyle = '#90ee90'; // Light green for owner info
            this.ctx.fillText(`Owner: ${info.ownerId}`, tooltipX + 10, tooltipY + 70);
            
            this.ctx.fillStyle = '#add8e6'; // Light blue for wealth
            this.ctx.fillText(`Wealth: ${this.formatCurrency(info.ownerWealth)}`, tooltipX + 10, tooltipY + 86);
            
            this.ctx.fillStyle = 'white';
            this.ctx.fillText(`Owned for: ${info.yearsSinceOwnership} years`, tooltipX + 10, tooltipY + 102);
        } else {
            this.ctx.fillStyle = '#ffcccb'; // Light red for available
            this.ctx.fillText('Status: Available', tooltipX + 10, tooltipY + 70);
            
            this.ctx.fillStyle = 'white';
            this.ctx.fillText(`State: ${info.colorState.replace('-', ' ')}`, tooltipX + 10, tooltipY + 86);
        }
    }

    handleClick(x, y, market) {
        // Future: Show detailed information panels
        console.log(`Click at (${x}, ${y})`);
    }

    /**
     * Renders the percentage metrics chart.
     * @param {AnalyticsHistory} analyticsHistory - The analytics history instance
     * @param {number} chartHeight - Height of the chart area
     */
    renderPercentageChart(analyticsHistory, chartHeight) {
        // Create datasets for percentage metrics
        const datasets = this.percentageMetrics.map((metric, index) => {
            const rawData = analyticsHistory.getTimeSeriesData(metric);
            const metricInfo = this.getMetricInfo(metric);
            
            // Convert to percentage scale (0-100)
            const data = rawData.map(d => ({
                x: d.x,
                y: metric === 'giniCoefficient' ? d.y * 100 : // Convert Gini to percentage
                   metric === 'housingRate' ? d.y * 100 :     // Convert housing rate to percentage  
                   metric === 'occupancyRate' ? d.y * 100 :   // Convert occupancy rate to percentage
                   d.y
            }));
            
            return {
                label: metricInfo.label,
                data: data,
                color: this.chartRenderer.colors[index % this.chartRenderer.colors.length]
            };
        }).filter(dataset => dataset.data.length > 0);
        
        if (datasets.length > 0) {
            // Create a temporary canvas for the percentage chart
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = this.canvas.width;
            tempCanvas.height = chartHeight;
            const tempRenderer = new ChartRenderer(tempCanvas);
            
            // Force Y-axis to 0-100%
            tempRenderer.renderLineChartWithFixedScale(datasets, {
                title: 'Market Trends (%)',
                xLabel: 'Simulation Year',
                yLabel: 'Percentage (%)',
                formatY: 'percentage',
                yMin: 0,
                yMax: 100
            });
            
            // Copy to main canvas
            this.ctx.drawImage(tempCanvas, 0, 40);
        }
    }

    /**
     * Renders the currency metrics chart.
     * @param {AnalyticsHistory} analyticsHistory - The analytics history instance
     * @param {number} chartHeight - Height of the chart area
     * @param {number} yOffset - Y offset for positioning
     */
    renderCurrencyChart(analyticsHistory, chartHeight, yOffset) {
        // Create datasets for currency metrics
        const datasets = this.currencyMetrics.map((metric, index) => {
            const data = analyticsHistory.getTimeSeriesData(metric);
            const metricInfo = this.getMetricInfo(metric);
            
            return {
                label: metricInfo.label,
                data: data,
                color: this.chartRenderer.colors[(index + 3) % this.chartRenderer.colors.length] // Offset colors
            };
        }).filter(dataset => dataset.data.length > 0);
        
        if (datasets.length > 0) {
            // Create a temporary canvas for the currency chart
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = this.canvas.width;
            tempCanvas.height = chartHeight;
            const tempRenderer = new ChartRenderer(tempCanvas);
            
            tempRenderer.renderLineChart(datasets, {
                title: 'Financial Metrics ($)',
                xLabel: 'Simulation Year',
                yLabel: 'Dollar Value ($)',
                formatY: 'currency'
            });
            
            // Copy to main canvas
            this.ctx.drawImage(tempCanvas, 0, yOffset);
        }
    }

    /**
     * Normalizes datasets to 0-100 scale for better multi-metric visualization.
     * @param {Array} datasets - Array of datasets with different scales
     * @returns {Array} Normalized datasets
     */
    normalizeDatasets(datasets) {
        return datasets.map(dataset => {
            if (dataset.data.length === 0) return dataset;
            
            const values = dataset.data.map(d => d.y);
            const min = Math.min(...values);
            const max = Math.max(...values);
            const range = max - min;
            
            // Avoid division by zero
            if (range === 0) {
                return {
                    ...dataset,
                    data: dataset.data.map(d => ({ x: d.x, y: 50 })) // Middle value if no variation
                };
            }
            
            // Normalize to 0-100 scale
            const normalizedData = dataset.data.map(d => ({
                x: d.x,
                y: ((d.y - min) / range) * 100
            }));
            
            return {
                ...dataset,
                data: normalizedData,
                originalRange: { min, max }, // Store original range for reference
                label: `${dataset.label} (${min.toFixed(1)}-${max.toFixed(1)})`
            };
        });
    }

    /**
     * Sets the view mode (market or analytics).
     * @param {string} mode - The view mode ('market' or 'analytics')
     */
    setViewMode(mode) {
        this.viewMode = mode;
    }

    /**
     * Gets the current view mode.
     * @returns {string} The current view mode
     */
    getViewMode() {
        return this.viewMode;
    }

    /**
     * Sets the selected metrics for analytics view.
     * @param {Array} metrics - Array of metric names to display
     */
    setSelectedMetrics(metrics) {
        this.selectedMetrics = metrics;
    }

    /**
     * Gets metric information for display.
     * @param {string} metric - The metric name
     * @returns {Object} Metric information with label and format
     */
    getMetricInfo(metric) {
        const metricInfoMap = {
            totalPeople: { label: 'Total People', format: 'number' },
            housedPeople: { label: 'Housed People', format: 'number' },
            houselessPeople: { label: 'Looking for Houses', format: 'number' },
            housingRate: { label: 'Housing Rate', format: 'percentage' },
            totalHouses: { label: 'Total Houses', format: 'number' },
            occupiedHouses: { label: 'Occupied Houses', format: 'number' },
            availableHouses: { label: 'Available Houses', format: 'number' },
            occupancyRate: { label: 'Occupancy Rate', format: 'percentage' },
            averageWealth: { label: 'Average Wealth', format: 'currency' },
            medianWealth: { label: 'Median Wealth', format: 'currency' },
            wealthRange: { label: 'Wealth Range', format: 'currency' },
            giniCoefficient: { label: 'Gini Coefficient', format: 'percentage' },
            wealthConcentration: { label: 'Top 10% Wealth', format: 'percentage' },
            averageHouseValue: { label: 'Average House Value', format: 'currency' },
            medianHouseValue: { label: 'Median House Value', format: 'currency' },
            houseValueRange: { label: 'House Value Range', format: 'currency' },
            affordabilityRatio: { label: 'Affordability Ratio', format: 'decimal' },
            marketVelocity: { label: 'Market Velocity', format: 'number' },
            auctionSuccessRate: { label: 'Auction Success Rate', format: 'percentage' },
            averageAuctionPrice: { label: 'Average Auction Price', format: 'currency' }
        };
        
        return metricInfoMap[metric] || { label: metric, format: 'number' };
    }

    /**
     * Gets available metrics grouped by category.
     * @returns {Object} Metrics grouped by category
     */
    getAvailableMetrics() {
        return {
            population: [
                { key: 'totalPeople', label: 'Total People' },
                { key: 'housedPeople', label: 'Housed People' },
                { key: 'houselessPeople', label: 'Looking for Houses' },
                { key: 'housingRate', label: 'Housing Rate' }
            ],
            housing: [
                { key: 'totalHouses', label: 'Total Houses' },
                { key: 'occupiedHouses', label: 'Occupied Houses' },
                { key: 'availableHouses', label: 'Available Houses' },
                { key: 'occupancyRate', label: 'Occupancy Rate' }
            ],
            wealth: [
                { key: 'averageWealth', label: 'Average Wealth' },
                { key: 'medianWealth', label: 'Median Wealth' },
                { key: 'giniCoefficient', label: 'Gini Coefficient' },
                { key: 'wealthConcentration', label: 'Top 10% Wealth Share' }
            ],
            market: [
                { key: 'averageHouseValue', label: 'Average House Value' },
                { key: 'medianHouseValue', label: 'Median House Value' },
                { key: 'affordabilityRatio', label: 'Affordability Ratio' },
                { key: 'marketVelocity', label: 'Market Velocity' }
            ],
            auctions: [
                { key: 'auctionSuccessRate', label: 'Auction Success Rate' },
                { key: 'averageAuctionPrice', label: 'Average Auction Price' }
            ]
        };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = SimulationRenderer;
}