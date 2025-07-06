// Mock DOM elements for testing
const mockCanvas = {
    width: 800,
    height: 600,
    style: {},
    getContext: () => ({
        fillStyle: '',
        strokeStyle: '',
        lineWidth: 1,
        font: '',
        textAlign: '',
        textBaseline: '',
        shadowColor: '',
        shadowBlur: 0,
        shadowOffsetX: 0,
        shadowOffsetY: 0,
        imageSmoothingEnabled: false,
        textRenderingOptimization: '',
        fillRect: () => {},
        strokeRect: () => {},
        fillText: () => {},
        beginPath: () => {},
        arc: () => {},
        fill: () => {},
        clearRect: () => {}
    }),
    addEventListener: () => {}
};

const mockAnalyticsContainer = {
    innerHTML: ''
};

// Load the classes
const SimulationRenderer = require('../../js/ui/SimulationRenderer.js');
const Market = require('../../js/core/Market.js');
const Config = require('../../js/utils/Config.js');

describe('SimulationRenderer', () => {
    let renderer;
    let market;
    let config;

    beforeEach(() => {
        config = new Config();
        market = new Market(config);
        renderer = new SimulationRenderer(mockCanvas, null, mockAnalyticsContainer);
        renderer.setMarket(market);
    });

    describe('constructor', () => {
        test('should initialize with canvas and analytics container', () => {
            expect(renderer.canvas).toBe(mockCanvas);
            expect(renderer.analyticsContainer).toBe(mockAnalyticsContainer);
            expect(renderer.gridCols).toBe(10);
            expect(renderer.gridRows).toBe(10);
        });

        test('should initialize with proper colors', () => {
            expect(renderer.colors.available).toBe('#ffcccb');
            expect(renderer.colors['just-available']).toBe('#ffe4b5');
            expect(renderer.colors.occupied).toBe('#90ee90');
            expect(renderer.colors['just-occupied']).toBe('#add8e6');
        });
    });

    describe('getHouseAtPosition', () => {
        test('should return null for position outside grid', () => {
            const house = renderer.getHouseAtPosition(-10, -10, market);
            expect(house).toBeNull();
        });

        test('should return house for position within house bounds', () => {
            // Position within first house (top-left)
            const house = renderer.getHouseAtPosition(35, 75, market);
            expect(house).toBe(market.houses[0]);
        });

        test('should return correct house for different grid positions', () => {
            // Test position for second house (grid position 1)
            const house = renderer.getHouseAtPosition(95, 75, market);
            expect(house).toBe(market.houses[1]);
        });
    });

    describe('tooltip functionality', () => {
        test('should track hovered house when mouse moves over houses', () => {
            const testHouse = market.houses[0];
            
            // Simulate mouse move over first house
            renderer.handleMouseMove(35, 75, market);
            
            expect(renderer.hoveredHouse).toBe(testHouse);
            expect(renderer.mouseX).toBe(35);
            expect(renderer.mouseY).toBe(75);
        });

        test('should clear hovered house when mouse moves off houses', () => {
            // First hover over a house
            renderer.handleMouseMove(35, 75, market);
            expect(renderer.hoveredHouse).toBe(market.houses[0]);
            
            // Then move to empty space
            renderer.handleMouseMove(1000, 1000, market);
            expect(renderer.hoveredHouse).toBeNull();
        });
    });

    describe('formatCurrency', () => {
        test('should format large amounts in millions', () => {
            expect(renderer.formatCurrency(1500000)).toBe('$1.5M');
            expect(renderer.formatCurrency(2000000)).toBe('$2.0M');
        });

        test('should format medium amounts in thousands', () => {
            expect(renderer.formatCurrency(1500)).toBe('$2K');
            expect(renderer.formatCurrency(50000)).toBe('$50K');
        });

        test('should format small amounts in dollars', () => {
            expect(renderer.formatCurrency(500)).toBe('$500');
            expect(renderer.formatCurrency(100)).toBe('$100');
        });
    });

    describe('mouse interaction setup', () => {
        test('should setup mouse event listeners', () => {
            const addEventListener = jest.fn();
            const mockCanvasWithSpy = {
                ...mockCanvas,
                addEventListener
            };
            
            const testRenderer = new SimulationRenderer(mockCanvasWithSpy, null, mockAnalyticsContainer);
            testRenderer.setupMouseInteraction(market);
            
            expect(addEventListener).toHaveBeenCalledWith('mousemove', expect.any(Function));
            expect(addEventListener).toHaveBeenCalledWith('mouseleave', expect.any(Function));
            expect(addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
        });
    });
});