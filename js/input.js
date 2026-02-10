// Input handler
class InputHandler {
    constructor(canvas, game) {
        this.canvas = canvas;
        this.game = game;
        this.setupListeners();
    }
    
    setupListeners() {
        // Mouse
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        
        // Touch
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleClick(e.touches[0]);
        });
        
        // Keyboard
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    }
    
    handleClick(e) {
        if (this.game.state !== 'playing' || this.game.isAnimating) return;
        
        const pos = this.game.renderer.screenToGrid(e.clientX, e.clientY);
        
        // Ignore clicks outside playable area
        if (pos.row < 0 || pos.row >= 10 || pos.col < 0 || pos.col >= 8) {
            return;
        }
        
        const clickedBlock = this.game.board.getBlockAt(pos.col, pos.row);
        
        if (!this.game.selectedBlock) {
            // Select block if clicked
            if (clickedBlock) {
                this.game.selectBlock(clickedBlock);
            }
        } else {
            // If clicking same block, confirm move
            if (clickedBlock && clickedBlock.id === this.game.selectedBlock.id) {
                this.game.confirmMove();
            }
            // If clicking different block, select it
            else if (clickedBlock) {
                this.game.selectBlock(clickedBlock);
            }
        }
    }
    
    handleKeyDown(e) {
        if (this.game.state !== 'playing' || this.game.isAnimating) return;
        if (!this.game.selectedBlock) return;
        
        switch(e.key) {
            case 'ArrowLeft':
            case 'a':
            case 'A':
                e.preventDefault();
                this.game.moveSelectedBlock(-1);
                break;
                
            case 'ArrowRight':
            case 'd':
            case 'D':
                e.preventDefault();
                this.game.moveSelectedBlock(1);
                break;
                
            case 'Enter':
            case ' ':
                e.preventDefault();
                this.game.confirmMove();
                break;
                
            case 'Escape':
                e.preventDefault();
                this.game.selectedBlock = null;
                this.game.selectedBlockOriginalX = null;
                break;
        }
    }
}
