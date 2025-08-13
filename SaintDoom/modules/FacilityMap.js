/**
 * FacilityMap - Visual representation of the facility layout
 * Shows zones, connections, and player location
 */
export class FacilityMap {
    constructor(zoneManager) {
        this.zoneManager = zoneManager;
        this.mapContainer = null;
        this.canvas = null;
        this.ctx = null;
        this.isVisible = false;
        
        // Map configuration
        this.mapSize = { width: 400, height: 300 };
        this.nodeRadius = 20;
        this.nodeSpacing = 100;
        
        // Visual styles
        this.styles = {
            background: 'rgba(0, 0, 0, 0.8)',
            border: '2px solid #444',
            
            zones: {
                unloaded: { fill: '#222', stroke: '#444', text: '#666' },
                loading: { fill: '#442', stroke: '#664', text: '#aa6' },
                proxy: { fill: '#242', stroke: '#464', text: '#6a6' },
                simplified: { fill: '#244', stroke: '#466', text: '#6aa' },
                full: { fill: '#424', stroke: '#646', text: '#aaa' },
                current: { fill: '#442', stroke: '#ff4', text: '#fff' }
            },
            
            connections: {
                open: { stroke: '#4a4', width: 2 },
                locked: { stroke: '#a44', width: 2, dash: [5, 5] },
                transition: { stroke: '#aa4', width: 3 }
            }
        };
        
        // Zone positions for visualization (manually laid out)
        this.zonePositions = new Map([
            ['chapel', { x: 200, y: 50 }],      // Chapel at top
            ['armory', { x: 200, y: 150 }],     // Armory in middle
            ['laboratory', { x: 200, y: 250 }],   // Laboratory below
            ['containment', { x: 100, y: 250 }],  // Containment to the left
            ['sanctum', { x: 300, y: 250 }]       // Sanctum to the right
        ]);
        
        this.initialize();
    }
    
    /**
     * Initialize the map UI
     */
    initialize() {
        // Create map container
        this.mapContainer = document.createElement('div');
        this.mapContainer.id = 'facility-map';
        this.mapContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: ${this.mapSize.width}px;
            height: ${this.mapSize.height}px;
            background: ${this.styles.background};
            border: ${this.styles.border};
            border-radius: 5px;
            display: none;
            z-index: 1000;
            font-family: monospace;
        `;
        
        // Create canvas for drawing
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.mapSize.width;
        this.canvas.height = this.mapSize.height;
        this.ctx = this.canvas.getContext('2d');
        
        // Add title
        const title = document.createElement('div');
        title.style.cssText = `
            position: absolute;
            top: 5px;
            left: 10px;
            color: #aaa;
            font-size: 14px;
            font-weight: bold;
        `;
        title.textContent = 'FACILITY MAP';
        
        // Add legend
        const legend = document.createElement('div');
        legend.style.cssText = `
            position: absolute;
            bottom: 5px;
            left: 10px;
            color: #666;
            font-size: 10px;
        `;
        legend.innerHTML = `
            <div>[TAB] Toggle Map</div>
            <div style="color: #ff4">● Current Zone</div>
            <div style="color: #4a4">— Connected</div>
            <div style="color: #a44">- - Locked</div>
        `;
        
        this.mapContainer.appendChild(this.canvas);
        this.mapContainer.appendChild(title);
        this.mapContainer.appendChild(legend);
        document.body.appendChild(this.mapContainer);
        
        // Set up keyboard controls
        this.setupControls();
    }
    
    /**
     * Set up keyboard controls for the map
     */
    setupControls() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                this.toggle();
            }
        });
    }
    
    /**
     * Toggle map visibility
     */
    toggle() {
        this.isVisible = !this.isVisible;
        this.mapContainer.style.display = this.isVisible ? 'block' : 'none';
        
        if (this.isVisible) {
            this.update();
        }
    }
    
    /**
     * Show the map
     */
    show() {
        this.isVisible = true;
        this.mapContainer.style.display = 'block';
        this.update();
    }
    
    /**
     * Hide the map
     */
    hide() {
        this.isVisible = false;
        this.mapContainer.style.display = 'none';
    }
    
    /**
     * Update the map display
     */
    update() {
        if (!this.isVisible) return;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.mapSize.width, this.mapSize.height);
        
        // Draw connections first (so they appear behind nodes)
        this.drawConnections();
        
        // Draw zones
        this.drawZones();
        
        // Draw player indicator
        this.drawPlayerLocation();
    }
    
    /**
     * Draw connections between zones
     */
    drawConnections() {
        this.zoneManager.connections.forEach((connection, key) => {
            const [zoneA, zoneB] = key.split('<->');
            const posA = this.zonePositions.get(zoneA);
            const posB = this.zonePositions.get(zoneB);
            
            if (!posA || !posB) return;
            
            // Determine connection style
            let style = this.styles.connections.open;
            if (connection.locked) {
                style = this.styles.connections.locked;
            }
            
            // Check if this is the active transition
            if (this.zoneManager.activeTransition) {
                const transition = this.zoneManager.activeTransition;
                if ((transition.from === zoneA && transition.to === zoneB) ||
                    (transition.from === zoneB && transition.to === zoneA)) {
                    style = this.styles.connections.transition;
                }
            }
            
            // Draw connection line
            this.ctx.strokeStyle = style.stroke;
            this.ctx.lineWidth = style.width;
            
            if (style.dash) {
                this.ctx.setLineDash(style.dash);
            } else {
                this.ctx.setLineDash([]);
            }
            
            this.ctx.beginPath();
            this.ctx.moveTo(posA.x, posA.y);
            this.ctx.lineTo(posB.x, posB.y);
            this.ctx.stroke();
        });
        
        // Reset line dash
        this.ctx.setLineDash([]);
    }
    
    /**
     * Draw zone nodes
     */
    drawZones() {
        this.zoneManager.zones.forEach((zone, zoneId) => {
            const pos = this.zonePositions.get(zoneId);
            if (!pos) return;
            
            // Determine zone style based on state
            let style = this.styles.zones[zone.state] || this.styles.zones.unloaded;
            
            // Override style for current zone
            if (zoneId === this.zoneManager.currentZone) {
                style = this.styles.zones.current;
            }
            
            // Draw zone circle
            this.ctx.fillStyle = style.fill;
            this.ctx.strokeStyle = style.stroke;
            this.ctx.lineWidth = 2;
            
            this.ctx.beginPath();
            this.ctx.arc(pos.x, pos.y, this.nodeRadius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.stroke();
            
            // Draw zone name
            this.ctx.fillStyle = style.text;
            this.ctx.font = '10px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            // Shorten zone names for display
            const displayName = this.getZoneDisplayName(zone.name);
            this.ctx.fillText(displayName, pos.x, pos.y);
            
            // Draw zone state indicator
            if (zone.state === 'loading') {
                // Animated loading indicator
                const time = Date.now() / 500;
                const loadingAngle = (time % (Math.PI * 2));
                
                this.ctx.strokeStyle = '#ff4';
                this.ctx.lineWidth = 3;
                this.ctx.beginPath();
                this.ctx.arc(pos.x, pos.y, this.nodeRadius + 5, loadingAngle, loadingAngle + Math.PI / 2);
                this.ctx.stroke();
            }
            
            // Draw lock icon if zone requires key
            if (zone.locked) {
                this.ctx.fillStyle = '#a44';
                this.ctx.font = '16px monospace';
                this.ctx.fillText('🔒', pos.x + this.nodeRadius, pos.y - this.nodeRadius);
            }
        });
    }
    
    /**
     * Draw player location indicator
     */
    drawPlayerLocation() {
        const currentZone = this.zoneManager.currentZone;
        if (!currentZone) return;
        
        const pos = this.zonePositions.get(currentZone);
        if (!pos) return;
        
        // Draw pulsing ring around current zone
        const time = Date.now() / 1000;
        const pulse = Math.sin(time * 3) * 0.5 + 0.5;
        
        this.ctx.strokeStyle = `rgba(255, 255, 100, ${pulse})`;
        this.ctx.lineWidth = 3;
        
        this.ctx.beginPath();
        this.ctx.arc(pos.x, pos.y, this.nodeRadius + 10, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // Draw player icon
        this.ctx.fillStyle = '#ff4';
        this.ctx.font = '20px monospace';
        this.ctx.fillText('▲', pos.x, pos.y - this.nodeRadius - 15);
    }
    
    /**
     * Get shortened display name for a zone
     */
    getZoneDisplayName(name) {
        const shortNames = {
            'Chapel': 'CHPL',
            'Armory': 'ARMY',
            'Laboratory Complex': 'LAB',
            'Containment': 'CONT',
            'Inner Sanctum': 'SNCT'
        };
        
        return shortNames[name] || name.substring(0, 4).toUpperCase();
    }
    
    /**
     * Auto-generate zone positions based on connections
     */
    generateZoneLayout() {
        // This could use a force-directed graph layout algorithm
        // For now, we use manual positions defined in constructor
    }
    
    /**
     * Clean up the map
     */
    destroy() {
        if (this.mapContainer) {
            this.mapContainer.remove();
        }
    }
}
