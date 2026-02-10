// Main Game controller
class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.renderer = new Renderer(this.canvas);
        this.board = null;
        this.ui = new UIManager(this);
        this.input = null;
        
        this.state = 'menu';
        this.score = 0;
        this.highScore = 0;
        this.selectedBlock = null;
        this.selectedBlockOriginalX = null;  // Track if block was moved
        this.isAnimating = false;
        this.skipAnimations = false;  // For AI training (no animations)
        this.fastMode = false;  // For training visualization (very fast animations)
        
        this.BASE_SCORE = 100;
    }
    
    init() {
        // Setup
        this.input = new InputHandler(this.canvas, this);
        
        // Start game immediately
        this.startGame();
    }
    
    startGame() {
        this.board = new Board();
        this.score = 0;
        this.selectedBlock = null;
        this.selectedBlockOriginalX = null;
        this.isAnimating = false;
        
        this.ui.updateScore(0);
        this.ui.showScreen(null);
        this.state = 'playing';
        
        this.gameLoop();
    }
    
    pauseGame() {
        if (this.state !== 'playing') return;
        this.state = 'paused';
        this.ui.showScreen('pause');
    }
    
    resumeGame() {
        if (this.state !== 'paused') return;
        this.state = 'playing';
        this.ui.showScreen(null);
        this.gameLoop();
    }
    
    gameOver() {
        this.state = 'gameover';
        
        // Only show game over screen if not in training mode
        if (!this.skipAnimations) {
            const isNewHighScore = this.score > this.highScore;
            
            if (isNewHighScore) {
                this.highScore = this.score;
                this.ui.updateHighScore(this.highScore);
                this.ui.saveHighScore(this.highScore);
            }
            
            this.ui.showGameOver(this.score, isNewHighScore);
        }
    }
    
    selectBlock(block) {
        this.selectedBlock = block;
        // Track original position to ensure block must be moved
        this.selectedBlockOriginalX = block.x;
    }
    
    moveSelectedBlock(direction) {
        if (!this.selectedBlock || this.isAnimating) return;
        
        const newX = this.selectedBlock.x + direction;
        
        if (this.board.canMoveBlock(this.selectedBlock, newX)) {
            this.board.moveBlock(this.selectedBlock, newX);
        }
    }
    
    async confirmMove() {
        if (!this.selectedBlock || this.isAnimating) return;
        
        // For manual play (not AI training), require that block was actually moved
        if (!this.skipAnimations && this.selectedBlockOriginalX === this.selectedBlock.x) {
            // Block wasn't moved horizontally - cancel the selection
            this.selectedBlock = null;
            this.selectedBlockOriginalX = null;
            return;
        }
        
        this.isAnimating = true;
        const block = this.selectedBlock;
        this.selectedBlock = null;
        this.selectedBlockOriginalX = null;
        
        // Animate block falling with gravity (or skip if training)
        if (this.skipAnimations) {
            this.board.applyGravity();
        } else {
            await this.animateFallingBlocks();
        }
        
        // Check for complete lines
        const completeLines = this.board.checkCompleteLines();
        
        if (completeLines.length > 0) {
            // Calculate score
            const lineScore = this.calculateScore(completeLines.length);
            this.score += lineScore;
            
            if (!this.skipAnimations) {
                this.ui.updateScore(this.score);
                this.ui.showCombo(completeLines.length, lineScore);
            }
            
            // Clear the lines
            this.board.clearLines(completeLines);
            
            if (!this.skipAnimations) await this.delay(this.fastMode ? 1 : 300);
        }
        
        // Animate raising blocks from preview row (or instant if training)
        const canRaise = this.skipAnimations ? 
            await this.instantRaiseBlocks() : 
            await this.animateRaiseBlocks();
        
        if (!canRaise) {
            this.gameOver();
            return;
        }
        
        // Animate gravity after raising (or instant if training)
        if (this.skipAnimations) {
            this.board.applyGravity();
        } else {
            await this.animateFallingBlocks();
        }
        
        // Check for cleared lines after gravity (could create new combos!)
        const postRaiseLines = this.board.checkCompleteLines();
        
        if (postRaiseLines.length > 0) {
            const lineScore = this.calculateScore(postRaiseLines.length);
            this.score += lineScore;
            
            if (!this.skipAnimations) {
                this.ui.updateScore(this.score);
                this.ui.showCombo(postRaiseLines.length, lineScore);
            }
            
            // Clear the lines
            this.board.clearLines(postRaiseLines);
            
            // Animate gravity again after clearing (or instant)
            if (this.skipAnimations) {
                this.board.applyGravity();
            } else {
                await this.animateFallingBlocks();
                await this.delay(this.fastMode ? 1 : 300);
            }
        }
        
        if (!this.skipAnimations) await this.delay(this.fastMode ? 1 : 100);
        
        this.isAnimating = false;
    }
    
    async animateFallingBlocks() {
        // Collect blocks that need to fall
        const blockPositions = new Map();
        
        // Store starting positions
        for (const block of this.board.blocks) {
            if (block.y < 10) {
                blockPositions.set(block.id, { startY: block.y, endY: block.y });
            }
        }
        
        // Apply gravity to get end positions
        this.board.applyGravity();
        
        // Update end positions
        for (const block of this.board.blocks) {
            if (blockPositions.has(block.id)) {
                blockPositions.get(block.id).endY = block.y;
            }
        }
        
        // Check if anything actually moved
        let anyMoved = false;
        for (const pos of blockPositions.values()) {
            if (pos.startY !== pos.endY) {
                anyMoved = true;
                break;
            }
        }
        
        if (!anyMoved) return;
        
        // Animate the fall (fast during training visualization)
        const duration = this.fastMode ? 1 : 300;
        const startTime = Date.now();
        
        return new Promise(resolve => {
            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const eased = progress * progress; // Ease-in
                
                this.renderer.drawFallingAnimation(this.board, blockPositions, eased);
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    resolve();
                }
            };
            animate();
        });
    }
    
    async animateRaiseBlocks() {
        // Check if we can raise
        const hasBlockAtTop = this.board.blocks.some(b => b.y === 0 && b.y < 10);
        if (hasBlockAtTop) {
            return false;
        }
        
        // Store starting positions
        const blockPositions = new Map();
        for (const block of this.board.blocks) {
            blockPositions.set(block.id, block.y);
        }
        
        // Perform the raise (update positions)
        for (const block of this.board.blocks) {
            if (block.y < 10) {
                block.y--;
            } else if (block.y === 10) {
                block.y = 9;
            }
        }
        
        // Animate the raise (fast during training visualization)
        const duration = this.fastMode ? 1 : 300;
        const startTime = Date.now();
        
        await new Promise(resolve => {
            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3); // Ease-out
                
                this.renderer.drawRaiseAnimation(this.board, blockPositions, eased);
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    resolve();
                }
            };
            animate();
        });
        
        // Generate new preview blocks after animation
        this.board.generatePreviewBlocks();
        
        return true;
    }
    
    calculateScore(linesCleared) {
        // 1 line = 100, 2 lines = 300 (100 + 200), 3 lines = 700 (100 + 200 + 400)
        let total = 0;
        for (let i = 0; i < linesCleared; i++) {
            total += this.BASE_SCORE * Math.pow(2, i);
        }
        return total;
    }
    
    // Instant raise without animation (for training)
    async instantRaiseBlocks() {
        // Check if any block is at row 0 (game over)
        const hasBlockAtTop = this.board.blocks.some(b => b.y === 0 && b.y < 10);
        if (hasBlockAtTop) {
            return false;
        }
        
        // Shift all blocks up
        for (const block of this.board.blocks) {
            if (block.y < 10) {
                block.y--;
            } else if (block.y === 10) {
                block.y = 9;
            }
        }
        
        // Apply gravity
        this.board.applyGravity();
        
        // Generate new preview
        this.board.generatePreviewBlocks();
        
        return true;
    }
    
    // AI action method - execute one complete turn
    async performAIAction(action) {
        if (this.state !== 'playing' || this.isAnimating) {
            return false;
        }
        
        // Get all playable blocks
        const playableBlocks = this.board.getPlayableBlocks();
        if (playableBlocks.length === 0) {
            return false;
        }
        
        // Try to select block at specified position
        let selectedBlock = null;
        if (action.selectPos.row < 10) {
            selectedBlock = this.board.getBlockAt(action.selectPos.col, action.selectPos.row);
        }
        
        // If no block at that position, use a random playable block for variety
        if (!selectedBlock) {
            const randomIndex = Math.floor(Math.random() * playableBlocks.length);
            selectedBlock = playableBlocks[randomIndex];
        }
        
        this.selectedBlock = selectedBlock;
        this.selectedBlockOriginalX = selectedBlock.x;  // Track original position
        
        let blockWasMoved = false;
        
        // Try to move to target column if valid
        if (action.targetCol >= 0 && 
            action.targetCol < 8 && 
            action.targetCol !== this.selectedBlock.x &&
            action.targetCol + this.selectedBlock.width <= 8) {
            
            const canReach = this.board.canMoveBlock(this.selectedBlock, action.targetCol);
            if (canReach) {
                this.board.moveBlock(this.selectedBlock, action.targetCol);
                blockWasMoved = true;
            }
        }
        
        // If no move was made, try moving in any valid direction as fallback
        if (!blockWasMoved) {
            // Try left
            if (this.selectedBlock.x > 0 && this.board.canMoveBlock(this.selectedBlock, this.selectedBlock.x - 1)) {
                this.board.moveBlock(this.selectedBlock, this.selectedBlock.x - 1);
                blockWasMoved = true;
            }
            // Try right
            else if (this.selectedBlock.x + this.selectedBlock.width < 8 && 
                     this.board.canMoveBlock(this.selectedBlock, this.selectedBlock.x + 1)) {
                this.board.moveBlock(this.selectedBlock, this.selectedBlock.x + 1);
                blockWasMoved = true;
            }
        }
        
        // Only complete turn if block was actually moved
        if (blockWasMoved) {
            await this.confirmMove();
            return true;
        } else {
            // Move failed - clear selection and return false
            this.selectedBlock = null;
            this.selectedBlockOriginalX = null;
            return false;
        }
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    gameLoop() {
        if (this.state !== 'playing') return;
        
        this.renderer.draw(this.board, this.selectedBlock);
        
        requestAnimationFrame(() => this.gameLoop());
    }
}

let game;
