// Board class - manages game grid and blocks
class Board {
    constructor() {
        this.cols = 8;
        this.rows = 11;  // 0-9 playable, 10 = preview
        this.blocks = [];
        this.init();
    }
    
    init() {
        this.blocks = [];
        Block.nextId = 1;
        
        // Generate initial blocks (scattered in bottom area)
        this.generateInitialBlocks();
        
        // Apply gravity to settle blocks
        this.applyGravity();
        
        // Generate preview blocks
        this.generatePreviewBlocks();
    }
    
    generateInitialBlocks() {
        // Create random blocks scattered in rows 5-9
        const numBlocks = 8 + Math.floor(Math.random() * 5); // 8-12 blocks
        
        for (let i = 0; i < numBlocks; i++) {
            const width = Math.floor(Math.random() * 4) + 1; // 1-4
            const x = Math.floor(Math.random() * (this.cols - width + 1));
            const y = 5 + Math.floor(Math.random() * 5); // rows 5-9
            
            // Check if position is free
            if (this.canPlaceBlock(x, y, width)) {
                this.blocks.push(new Block(x, y, width));
            }
        }
    }
    
    generatePreviewBlocks() {
        // Remove old preview blocks
        this.blocks = this.blocks.filter(b => b.y !== 10);
        
        // Generate 2-4 blocks for preview row
        const numBlocks = 2 + Math.floor(Math.random() * 3); // 2-4 blocks
        
        for (let i = 0; i < numBlocks; i++) {
            const width = Math.floor(Math.random() * 4) + 1;
            
            // Try to find a random position
            for (let attempt = 0; attempt < 20; attempt++) {
                const x = Math.floor(Math.random() * (this.cols - width + 1));
                
                if (this.canPlaceBlock(x, 10, width)) {
                    this.blocks.push(new Block(x, 10, width));
                    break;
                }
            }
        }
    }
    
    canPlaceBlock(x, y, width) {
        // Check boundaries
        if (x < 0 || x + width > this.cols || y < 0 || y > 10) {
            return false;
        }
        
        // Check collision with existing blocks
        for (let col = x; col < x + width; col++) {
            if (this.getBlockAt(col, y)) {
                return false;
            }
        }
        
        return true;
    }
    
    getBlockAt(col, row) {
        return this.blocks.find(b => b.occupies(col, row));
    }
    
    canMoveBlock(block, newX) {
        // Check boundaries
        if (newX < 0 || newX + block.width > this.cols) {
            return false;
        }
        
        // Check collision with other blocks (at same row)
        for (let col = newX; col < newX + block.width; col++) {
            const otherBlock = this.getBlockAt(col, block.y);
            if (otherBlock && otherBlock.id !== block.id) {
                return false;
            }
        }
        
        return true;
    }
    
    moveBlock(block, newX) {
        // Simply update x position (no need to check, caller already validated)
        block.x = newX;
    }
    
    dropBlock(block) {
        // Find lowest position this block can fall to (max row 9, not into preview row 10)
        let targetY = block.y;
        
        for (let y = block.y + 1; y < 10; y++) {  // Changed: stop at row 9
            let canFit = true;
            
            // Check if all cells are free
            for (let col = block.x; col < block.x + block.width; col++) {
                const otherBlock = this.getBlockAt(col, y);
                if (otherBlock && otherBlock.id !== block.id) {
                    canFit = false;
                    break;
                }
            }
            
            if (canFit) {
                targetY = y;
            } else {
                break;
            }
        }
        
        const moved = targetY !== block.y;
        block.y = targetY;
        return moved;
    }
    
    applyGravity() {
        // Keep dropping blocks until nothing moves
        let anyMoved = true;
        
        while (anyMoved) {
            anyMoved = false;
            
            // Process blocks from bottom to top (except preview row)
            const sortedBlocks = this.blocks
                .filter(b => b.y < 10)
                .sort((a, b) => b.y - a.y);
            
            for (const block of sortedBlocks) {
                if (this.dropBlock(block)) {
                    anyMoved = true;
                }
            }
        }
    }
    
    getPlayableBlocks() {
        // Return all blocks in the playable area (rows 0-9)
        return this.blocks.filter(b => b.y >= 0 && b.y < 10);
    }
    
    checkCompleteLines() {
        const completeRows = [];
        
        // Check rows 0-9 only (not preview row)
        for (let row = 0; row < 10; row++) {
            let filled = 0;
            
            // Count filled cells in this row
            for (let col = 0; col < this.cols; col++) {
                if (this.getBlockAt(col, row)) {
                    filled++;
                }
            }
            
            if (filled === this.cols) {
                completeRows.push(row);
            }
        }
        
        return completeRows;
    }
    
    clearLines(rows) {
        if (rows.length === 0) return;
        
        // Remove all blocks in these rows
        for (const row of rows) {
            this.blocks = this.blocks.filter(b => b.y !== row);
        }
        
        // Apply gravity after clearing
        this.applyGravity();
    }
    
    // Note: raiseBlocks logic moved to game.js for animation control
    // This method is no longer used but kept for reference
    
    getPlayableBlocks() {
        return this.blocks.filter(b => b.y < 10);
    }
}
