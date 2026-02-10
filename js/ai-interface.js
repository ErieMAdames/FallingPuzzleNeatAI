// AI Interface - Bridge between game and neural network
class AIInterface {
    // Convert board state to neural network inputs (88 values)
    static getBoardState(board) {
        const inputs = [];
        
        // Encode each cell: 0 = empty, 0.25/0.5/0.75/1.0 = block widths 1/2/3/4
        for (let row = 0; row < 11; row++) {
            for (let col = 0; col < 8; col++) {
                const block = board.getBlockAt(col, row);
                
                if (!block) {
                    inputs.push(0);
                } else {
                    // Encode block width as value
                    inputs.push(block.width * 0.25);
                }
            }
        }
        
        return inputs;
    }
    
    // Convert neural net outputs (27 values) to game action
    static parseAction(outputs) {
        // Source position (which block to select)
        const sourceCol = this.argmax(outputs.slice(0, 8));
        const sourceRow = this.argmax(outputs.slice(8, 18));
        
        // Target position (where to move it)
        const targetCol = this.argmax(outputs.slice(18, 26));
        
        return {
            selectPos: { col: sourceCol, row: sourceRow },
            targetCol: targetCol
        };
    }
    
    // Helper: Find index of maximum value
    static argmax(array) {
        if (array.length === 0) return 0;
        let maxIdx = 0;
        let maxVal = array[0];
        
        for (let i = 1; i < array.length; i++) {
            if (array[i] > maxVal) {
                maxVal = array[i];
                maxIdx = i;
            }
        }
        
        return maxIdx;
    }
    
    // Calculate fitness (multi-factor)
    static getFitness(game) {
        // Primary reward: score from clearing lines
        let fitness = game.score;
        
        // Survival bonus: reward for making moves (even if score is 0)
        // This helps early generations that can't clear lines yet
        fitness += 1;  // Base fitness for completing a game
        
        // Penalize early death severely
        const movesMade = game.moveCount || 0;
        if (movesMade < 5) {
            fitness *= 0.1;  // Heavy penalty for dying too quickly
        }
        
        return Math.max(0, fitness);
    }
}
