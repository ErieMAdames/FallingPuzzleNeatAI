// Block class - represents a single block piece
class Block {
    constructor(x, y, width) {
        this.x = x;          // Column position (0-7)
        this.y = y;          // Row position (0-10)
        this.width = width;  // Block width in cells (1-4)
        this.id = Block.nextId++;
    }
    
    // Check if this block occupies a specific grid cell
    occupies(col, row) {
        return this.y === row && col >= this.x && col < this.x + this.width;
    }
}

Block.nextId = 1;

// Color schemes for each block width
Block.COLORS = [
    { bg: '#4CAF50', light: '#81C784', dark: '#388E3C' },  // 1-wide: Green
    { bg: '#FF9800', light: '#FFB74D', dark: '#F57C00' },  // 2-wide: Orange
    { bg: '#F44336', light: '#E57373', dark: '#D32F2F' },  // 3-wide: Red
    { bg: '#2196F3', light: '#64B5F6', dark: '#1976D2' },  // 4-wide: Blue
];

Block.getColor = function(width) {
    return Block.COLORS[width - 1] || Block.COLORS[0];
};
