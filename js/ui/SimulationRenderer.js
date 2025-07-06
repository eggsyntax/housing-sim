class SimulationRenderer {
    constructor(canvasElement, consoleElement, analyticsContainer) {
        this.canvas = canvasElement;
        this.ctx = canvasElement.getContext('2d');
        this.consoleDiv = consoleElement;
        this.analyticsContainer = analyticsContainer;
        
        // Layout configuration
        this.gridCols = 10;
        this.gridRows = 10;
        this.houseSize = 50;
        this.personSize = 12;
        this.margin = 10;
        
        // Colors for different states - lighter/pastel versions for better text contrast
        this.colors = {
            available: '#ffcccb',           // Light red - available house
            'just-available': '#ffe4b5',    // Light orange - just became available  
            occupied: '#90ee90',            // Light green - occupied house
            'just-occupied': '#add8e6',     // Light blue - just became occupied
            background: '#ecf0f1',          // Light gray background
            person: '#2c3e50',              // Dark blue for people
            personHomeless: '#e67e22',      // Orange for homeless people
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
        
        // Note: Console capture removed to reduce clutter
    }

    setupCanvas() {
        // Calculate canvas size based on grid and house size
        const canvasWidth = this.gridCols * (this.houseSize + this.margin) + this.margin + 200; // Extra space for homeless area
        const canvasHeight = this.gridRows * (this.houseSize + this.margin) + this.margin + 100; // Extra space for info
        
        this.canvas.width = canvasWidth;
        this.canvas.height = canvasHeight;
        
        // Set CSS size for responsive design
        this.canvas.style.maxWidth = '100%';
        this.canvas.style.height = 'auto';
        
        // Improve text rendering quality
        this.ctx.imageSmoothingEnabled = false; // For crisp pixel-perfect rendering
        this.ctx.textRenderingOptimization = 'optimizeQuality';
        
        // Setup font with better rendering
        this.ctx.font = 'bold 11px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
    }

    // Console capture methods removed - users can check browser console directly

    renderMarket(market) {
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
        
        // Draw homeless area
        this.renderHomelessArea(market.people);
        
        // Re-render tooltip if we have a hovered house
        if (this.hoveredHouse && this.mouseX !== undefined && this.mouseY !== undefined) {
            this.renderTooltip(this.mouseX, this.mouseY, this.hoveredHouse);
        }
    }

    renderHouses(houses) {
        houses.forEach((house, index) => {
            const row = Math.floor(index / this.gridCols);
            const col = index % this.gridCols;
            
            const x = col * (this.houseSize + this.margin) + this.margin;
            const y = row * (this.houseSize + this.margin) + this.margin + 40; // Offset for title
            
            this.renderHouse(house, x, y);
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
        
        // Draw house ID with better contrast
        this.ctx.fillStyle = this.colors.text;
        this.ctx.font = 'bold 11px Arial';
        this.ctx.textAlign = 'center';
        
        // Add text shadow for better readability
        this.ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
        this.ctx.shadowBlur = 1;
        this.ctx.shadowOffsetX = 1;
        this.ctx.shadowOffsetY = 1;
        
        this.ctx.fillText(house.id.replace('house_', 'H'), x + this.houseSize/2, y + 12);
        
        // Draw value
        this.ctx.font = 'bold 9px Arial';
        const value = Math.round(info.currentValue / 1000) + 'k';
        this.ctx.fillText(value, x + this.houseSize/2, y + 25);
        
        // Draw last price if different from value
        if (Math.abs(info.currentValue - info.lastSellingPrice) > 1000) {
            this.ctx.font = '8px Arial';
            const price = Math.round(info.lastSellingPrice / 1000) + 'k';
            this.ctx.fillText(`($${price})`, x + this.houseSize/2, y + 35);
        }
        
        // Draw ownership years if owned
        if (!info.isAvailable && info.yearsSinceOwnership > 0) {
            this.ctx.font = '8px Arial';
            this.ctx.fillText(`${info.yearsSinceOwnership}y`, x + this.houseSize/2, y + this.houseSize - 8);
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

    renderPersonInHouse(person) {
        const house = person.house;
        const houseIndex = this.getHouseIndex(house);
        
        if (houseIndex === -1) return;
        
        const row = Math.floor(houseIndex / this.gridCols);
        const col = houseIndex % this.gridCols;
        
        const houseX = col * (this.houseSize + this.margin) + this.margin;
        const houseY = row * (this.houseSize + this.margin) + this.margin + 40;
        
        // Draw person as a circle in the house
        const personX = houseX + this.houseSize - this.personSize - 3;
        const personY = houseY + 3;
        
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

    renderHomelessArea(people) {
        const homelessPeople = people.filter(p => !p.house);
        
        if (homelessPeople.length === 0) return;
        
        // Draw homeless area
        const areaX = this.gridCols * (this.houseSize + this.margin) + 20;
        const areaY = 50;
        const areaWidth = 150;
        const areaHeight = Math.max(200, homelessPeople.length * 25 + 40);
        
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
        this.ctx.fillText('Unhoused', areaX + areaWidth/2, areaY + 20);
        
        // Draw homeless people
        homelessPeople.forEach((person, index) => {
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
        
        // Update statistics display
        this.analyticsContainer.innerHTML = `
            <div class="stats-grid">
                <div class="stat-item">
                    <span class="stat-label">Year:</span>
                    <span class="stat-value">${stats.currentYear}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Tick:</span>
                    <span class="stat-value">${stats.tickCount}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Population:</span>
                    <span class="stat-value">${stats.totalPeople}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Housed:</span>
                    <span class="stat-value">${stats.housedPeople}/${stats.totalPeople}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Available Houses:</span>
                    <span class="stat-value">${stats.availableHouses}/${stats.totalHouses}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Avg Wealth:</span>
                    <span class="stat-value">${this.formatCurrency(stats.averageWealth)}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Avg House Value:</span>
                    <span class="stat-value">${this.formatCurrency(stats.averageHouseValue)}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Market Activity:</span>
                    <span class="stat-value">${stats.occupiedHouses > 0 ? 'Active' : 'Quiet'}</span>
                </div>
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
                
                // Add auction feedback with current animation frame
                if (this.lastAuctionResults) {
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
                    if (this.lastAuctionResults) {
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
                if (this.lastAuctionResults) {
                    this.renderAuctionFeedback(this.lastAuctionResults);
                }
                // Only render tooltip if we have a hovered house
                if (this.hoveredHouse) {
                    this.renderTooltip(x, y, this.hoveredHouse);
                }
            }
        }
    }

    getHouseAtPosition(x, y, market) {
        if (!market || !market.houses) return null;
        
        // Check each house position
        for (let index = 0; index < market.houses.length; index++) {
            const row = Math.floor(index / this.gridCols);
            const col = index % this.gridCols;
            
            const houseX = col * (this.houseSize + this.margin) + this.margin;
            const houseY = row * (this.houseSize + this.margin) + this.margin + 40;
            
            if (x >= houseX && x <= houseX + this.houseSize &&
                y >= houseY && y <= houseY + this.houseSize) {
                return market.houses[index];
            }
        }
        
        return null;
    }

    renderTooltip(x, y, house) {
        if (!house) return;
        
        const info = house.getDisplayInfo();
        
        // Calculate tooltip size based on content
        const isOccupied = info.ownerId;
        const tooltipWidth = 220;
        const tooltipHeight = isOccupied ? 120 : 100;
        const tooltipX = Math.min(x + 10, this.canvas.width - tooltipWidth - 10);
        const tooltipY = Math.max(y - tooltipHeight - 10, 10);
        
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
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = SimulationRenderer;
}