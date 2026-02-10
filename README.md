# Falling Puzzle

A browser-based puzzle game built with vanilla JavaScript and HTML5 Canvas.

## Game Rules

- **Board**: 8 columns × 11 rows (rows 0-9 playable, row 10 is preview at bottom)
- **Initial State**: Game starts with rows 5-9 (bottom half) populated with random blocks
- **Objective**: Clear lines to score points. Don't let the board fill up!
- **Blocks**: Come in 4 widths (1-4 cells), each with a unique color
- **Gameplay**: 
  1. Click a block to select it
  2. Move it left/right (use arrow keys or click)
  3. Click again to drop it
  4. Clear complete horizontal lines for points
  5. Combo multipliers: 2x, 4x, 8x, 16x for multiple lines cleared at once!

## How to Play

1. Open `index.html` in a modern web browser
2. Click "Start Game" to begin
3. Click blocks to select and move them
4. Clear lines and beat your high score!

## Controls

- **Mouse/Touch**: Click/tap blocks to select and move them
- **Keyboard**:
  - Arrow Left/Right or A/D: Move selected block
  - Enter or Space: Drop/confirm move
  - Escape: Deselect block

## Features

- Smooth animations
- Combo scoring system
- High score saving (localStorage)
- Responsive design
- Touch-friendly controls
- Pause/resume functionality

## Technical Details

- Pure vanilla JavaScript (no frameworks)
- HTML5 Canvas for rendering
- Modular code architecture
- Mobile-optimized

## File Structure

```
falling-puzzle-2-5-2/
├── index.html          # Main HTML file
├── css/
│   └── game.css       # All styling
├── js/
│   ├── main.js        # Entry point
│   ├── game.js        # Main game controller
│   ├── board.js       # Board and grid logic
│   ├── block.js       # Block class
│   ├── renderer.js    # Canvas rendering
│   ├── input.js       # Input handling
│   └── ui.js          # UI management
└── assets/            # Original game assets (unused in web version)
```

## Development

The game was converted from a Cocos2d-x Android APK to a browser-based JavaScript game. The original assets are preserved in the `assets/` folder but are not used in the web version.

## Browser Compatibility

Works on all modern browsers with HTML5 Canvas support:
- Chrome/Edge
- Firefox
- Safari
- Mobile browsers (iOS Safari, Chrome Mobile)

## License

Game mechanics and concept based on the original FallingPuzzle mobile game.
