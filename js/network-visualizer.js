// Network Visualizer - Displays neural network structure
class NetworkVisualizer {
    constructor(containerId) {
        this.container = document.querySelector(containerId);
        this.currentNetwork = null;
        this.activations = new Map();  // Store node activations
        this.svg = null;  // Store SVG element for updates
        this.nodeElements = new Map();  // Map nodes to their SVG elements
    }
    
    // Update visualization with new network
    updateNetwork(network) {
        if (!network) return;
        
        this.currentNetwork = network;
        
        try {
            // Generate graph data (width, height) - use taller dimensions
            const graphData = network.graph(800, 1000);
            
            // Use Neataptic's built-in drawGraph function
            if (typeof drawGraph !== 'undefined') {
                this.container.innerHTML = '';
                drawGraph(graphData, this.container);
            } else {
                // Fallback: render our own visualization
                this.drawCustomGraph(network);
            }
        } catch (error) {
            console.error('Error visualizing network:', error);
            this.drawCustomGraph(network);
        }
    }
    
    // Update with real-time activation data
    updateActivations(network) {
        if (!network || !network.nodes) return;
        
        // Store activation values from all nodes
        this.activations.clear();
        for (const node of network.nodes) {
            if (node.activation !== undefined) {
                this.activations.set(node, node.activation);
            }
        }
        
        // Update visual representation
        this.updateNodeColors();
    }
    
    // Update node colors based on activation values
    updateNodeColors() {
        for (const [node, element] of this.nodeElements) {
            const activation = this.activations.get(node) || 0;
            const color = this.getActivationColor(node, activation);
            element.setAttribute('fill', color);
            
            // Add glow effect for highly active nodes
            if (activation > 0.7) {
                element.setAttribute('filter', 'url(#glow)');
            } else {
                element.removeAttribute('filter');
            }
        }
    }
    
    // Get color based on node type and activation level
    getActivationColor(node, activation) {
        // Clamp activation between 0 and 1
        const clamped = Math.max(0, Math.min(1, activation));
        
        if (node.type === 'input') {
            // Blue gradient: dark blue -> bright cyan
            const r = Math.floor(33 + clamped * 100);
            const g = Math.floor(150 + clamped * 105);
            const b = Math.floor(243);
            return `rgb(${r}, ${g}, ${b})`;
        } else if (node.type === 'output') {
            // Orange gradient: dark orange -> bright orange
            const r = Math.floor(180 + clamped * 75);
            const g = Math.floor(100 + clamped * 120);
            const b = Math.floor(clamped * 50);
            return `rgb(${r}, ${g}, ${b})`;
        } else {
            // Hidden nodes: gray -> yellow/white
            const r = Math.floor(158 + clamped * 97);
            const g = Math.floor(158 + clamped * 97);
            const b = Math.floor(158 - clamped * 158);
            return `rgb(${r}, ${g}, ${b})`;
        }
    }
    
    // Custom graph drawing (fallback if drawGraph not available)
    drawCustomGraph(network) {
        this.container.innerHTML = '';
        this.nodeElements.clear();
        
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        svg.setAttribute('viewBox', '0 0 800 1000');
        this.svg = svg;
        
        // Add glow filter definition
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
        filter.setAttribute('id', 'glow');
        filter.innerHTML = `
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
            </feMerge>
        `;
        defs.appendChild(filter);
        svg.appendChild(defs);
        
        const nodes = network.nodes || [];
        const connections = network.connections || [];
        
        // Simple layout: input nodes on left, hidden in middle, output on right
        const layers = this.organizeIntoLayers(nodes);
        const positions = this.calculatePositions(layers, 800, 1000);
        
        // Draw connections
        for (const conn of connections) {
            if (conn.from && conn.to && positions.has(conn.from) && positions.has(conn.to)) {
                const from = positions.get(conn.from);
                const to = positions.get(conn.to);
                
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', from.x);
                line.setAttribute('y1', from.y);
                line.setAttribute('x2', to.x);
                line.setAttribute('y2', to.y);
                line.setAttribute('stroke', conn.weight > 0 ? '#4CAF50' : '#F44336');
                // Cap max thickness and scale down for clearer visualization
                const thickness = Math.min(Math.abs(conn.weight) * 0.3, 2);
                line.setAttribute('stroke-width', thickness);
                line.setAttribute('opacity', '0.2');
                svg.appendChild(line);
            }
        }
        
        // Draw nodes
        for (const [node, pos] of positions) {
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', pos.x);
            circle.setAttribute('cy', pos.y);
            circle.setAttribute('r', '8');
            
            // Use activation color if available, otherwise use default
            const activation = this.activations.get(node) || 0;
            const color = this.activations.has(node) ? 
                this.getActivationColor(node, activation) :
                (pos.type === 'input' ? '#2196F3' : 
                 pos.type === 'output' ? '#FF9800' : '#9E9E9E');
            
            circle.setAttribute('fill', color);
            circle.setAttribute('stroke', '#fff');
            circle.setAttribute('stroke-width', '2');
            
            // Store reference for later updates
            this.nodeElements.set(node, circle);
            
            svg.appendChild(circle);
        }
        
        this.container.appendChild(svg);
        
        // Add legend on first draw
        this.addLegend();
    }
    
    organizeIntoLayers(nodes) {
        // Simple organization: inputs, hidden, outputs
        return {
            input: nodes.filter(n => n.type === 'input'),
            hidden: nodes.filter(n => n.type === 'hidden'),
            output: nodes.filter(n => n.type === 'output')
        };
    }
    
    calculatePositions(layers, width, height) {
        const positions = new Map();
        const marginTop = 40;
        const marginBottom = 40;
        const marginSides = 50;
        const usableHeight = height - marginTop - marginBottom;
        
        // Input nodes on left - spread vertically
        layers.input.forEach((node, i) => {
            const yPos = layers.input.length > 1 
                ? marginTop + (i / (layers.input.length - 1)) * usableHeight
                : height / 2;
            positions.set(node, {
                x: marginSides,
                y: yPos,
                type: 'input'
            });
        });
        
        // Hidden nodes in middle - spread vertically
        layers.hidden.forEach((node, i) => {
            const yPos = layers.hidden.length > 1
                ? marginTop + (i / (layers.hidden.length - 1)) * usableHeight
                : height / 2;
            positions.set(node, {
                x: width / 2,
                y: yPos,
                type: 'hidden'
            });
        });
        
        // Output nodes on right - spread vertically
        layers.output.forEach((node, i) => {
            const yPos = layers.output.length > 1
                ? marginTop + (i / (layers.output.length - 1)) * usableHeight
                : height / 2;
            positions.set(node, {
                x: width - marginSides,
                y: yPos,
                type: 'output'
            });
        });
        
        return positions;
    }
    
    // Clear visualization
    clear() {
        this.container.innerHTML = '<div style="text-align:center;padding:50px;color:#999;">No network to display</div>';
    }
    
    // Add legend to explain visualization
    addLegend() {
        const legendDiv = document.createElement('div');
        legendDiv.className = 'network-legend';
        legendDiv.innerHTML = `
            <div class="legend-title">Network Visualization</div>
            <div class="legend-item">
                <div class="legend-node legend-node-input"></div>
                <span>Input Nodes (Board State)</span>
            </div>
            <div class="legend-item">
                <div class="legend-node legend-node-hidden"></div>
                <span>Hidden Nodes</span>
            </div>
            <div class="legend-item">
                <div class="legend-node legend-node-output"></div>
                <span>Output Nodes (Actions)</span>
            </div>
            <div class="legend-item">
                <div class="legend-line legend-line-positive"></div>
                <span>Positive Weights</span>
            </div>
            <div class="legend-item">
                <div class="legend-line legend-line-negative"></div>
                <span>Negative Weights</span>
            </div>
            <div class="legend-note">Brighter nodes = Higher activation</div>
        `;
        
        // Insert legend after container
        if (this.container.parentNode && !document.querySelector('.network-legend')) {
            this.container.parentNode.appendChild(legendDiv);
        }
    }
}
