// Renderer - handles all canvas drawing
class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.cellSize = 60;
        this.padding = 20;
        
        this.setupCanvas();
    }
    
    setupCanvas() {
        const width = this.cellSize * 8 + this.padding * 2;
        const height = this.cellSize * 11 + this.padding * 2;
        
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = width * dpr;
        this.canvas.height = height * dpr;
        this.canvas.style.width = width + 'px';
        this.canvas.style.height = height + 'px';
        this.ctx.scale(dpr, dpr);
    }
    
    draw(board, selectedBlock) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid
        this.drawGrid();
        
        // Draw preview row overlay
        this.drawPreviewOverlay();
        
        // Draw all blocks
        for (const block of board.blocks) {
            const isSelected = selectedBlock && block.id === selectedBlock.id;
            this.drawBlock(block, isSelected);
        }
        
        // Draw move arrows for selected block
        if (selectedBlock) {
            this.drawMoveArrows(selectedBlock, board);
        }
    }
    
    drawGrid() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;
        
        // Vertical lines
        for (let col = 0; col <= 8; col++) {
            const x = this.padding + col * this.cellSize;
            this.ctx.beginPath();
            this.ctx.moveTo(x, this.padding);
            this.ctx.lineTo(x, this.padding + this.cellSize * 11);
            this.ctx.stroke();
        }
        
        // Horizontal lines
        for (let row = 0; row <= 11; row++) {
            const y = this.padding + row * this.cellSize;
            this.ctx.beginPath();
            this.ctx.moveTo(this.padding, y);
            this.ctx.lineTo(this.padding + this.cellSize * 8, y);
            this.ctx.stroke();
        }
    }
    
    drawPreviewOverlay() {
        const y = this.padding + this.cellSize * 10;
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        this.ctx.fillRect(
            this.padding,
            y,
            this.cellSize * 8,
            this.cellSize
        );
        
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(
            'NEXT',
            this.padding + this.cellSize * 4,
            y + this.cellSize / 2 + 5
        );
    }
    
    drawBlock(block, isSelected) {
        const x = this.padding + block.x * this.cellSize;
        const y = this.padding + block.y * this.cellSize;
        const width = block.width * this.cellSize;
        const height = this.cellSize;
        
        const colors = Block.getColor(block.width);
        
        // Shadow
        this.ctx.fillStyle = colors.dark;
        this.ctx.fillRect(x + 4, y + 4, width - 8, height - 8);
        
        // Main block
        const gradient = this.ctx.createLinearGradient(x, y, x, y + height);
        gradient.addColorStop(0, colors.light);
        gradient.addColorStop(1, colors.bg);
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(x + 3, y + 3, width - 6, height - 6);
        
        // Border
        this.ctx.strokeStyle = isSelected ? '#ffffff' : colors.dark;
        this.ctx.lineWidth = isSelected ? 3 : 2;
        this.ctx.strokeRect(x + 3, y + 3, width - 6, height - 6);
        
        // Highlight
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x + 5, y + 5, width - 10, 8);
    }
    
    drawMoveArrows(block, board) {
        const y = this.padding + block.y * this.cellSize + this.cellSize / 2;
        const arrowSize = 12;
        
        // Left arrow
        if (board.canMoveBlock(block, block.x - 1)) {
            const x = this.padding + block.x * this.cellSize - arrowSize - 8;
            this.drawArrow(x, y, -1, arrowSize);
        }
        
        // Right arrow
        if (board.canMoveBlock(block, block.x + 1)) {
            const x = this.padding + (block.x + block.width) * this.cellSize + arrowSize + 8;
            this.drawArrow(x, y, 1, arrowSize);
        }
    }
    
    drawArrow(x, y, direction, size) {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        this.ctx.shadowBlur = 4;
        
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(x - direction * size, y - size / 2);
        this.ctx.lineTo(x - direction * size, y + size / 2);
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.shadowBlur = 0;
    }
    
    drawFallingAnimation(board, blockPositions, progress) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawGrid();
        this.drawPreviewOverlay();
        
        // Draw blocks with animated positions
        for (const block of board.blocks) {
            const pos = blockPositions.get(block.id);
            
            if (pos && pos.startY !== pos.endY) {
                // Animate this block
                const animatedY = pos.startY + (pos.endY - pos.startY) * progress;
                const animatedBlock = { ...block, y: animatedY };
                this.drawBlock(animatedBlock, false);
            } else {
                // Draw normally
                this.drawBlock(block, false);
            }
        }
    }
    
    drawRaiseAnimation(board, blockPositions, progress) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawGrid();
        this.drawPreviewOverlay();
        
        // Draw blocks with animated positions (moving up)
        for (const block of board.blocks) {
            const startY = blockPositions.get(block.id);
            
            if (startY !== undefined) {
                // Animate from startY to current position (which is startY - 1)
                const animatedY = startY - progress;
                const animatedBlock = { ...block, y: animatedY };
                this.drawBlock(animatedBlock, false);
            } else {
                this.drawBlock(block, false);
            }
        }
    }
    
    screenToGrid(screenX, screenY) {
        const rect = this.canvas.getBoundingClientRect();
        const x = screenX - rect.left;
        const y = screenY - rect.top;
        
        const col = Math.floor((x - this.padding) / this.cellSize);
        const row = Math.floor((y - this.padding) / this.cellSize);
        
        return { col, row };
    }
}
