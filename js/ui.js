// UI Manager
class UIManager {
    constructor(game) {
        this.game = game;
        this.elements = {
            pauseScreen: document.getElementById('pause-screen'),
            gameoverScreen: document.getElementById('gameover-screen'),
            currentScore: document.getElementById('current-score'),
            highScore: document.getElementById('high-score'),
            finalScore: document.getElementById('final-score-value'),
            newHighscore: document.getElementById('new-highscore'),
            comboDisplay: document.getElementById('combo-display'),
            comboText: document.getElementById('combo-text'),
            pauseBtn: document.getElementById('pause-btn'),
            resumeBtn: document.getElementById('resume-btn'),
            restartBtn: document.getElementById('restart-btn'),
            playAgainBtn: document.getElementById('play-again-btn'),
        };
        
        this.setupListeners();
        this.loadHighScore();
    }
    
    setupListeners() {
        this.elements.pauseBtn.addEventListener('click', () => this.game.pauseGame());
        this.elements.resumeBtn.addEventListener('click', () => this.game.resumeGame());
        this.elements.restartBtn.addEventListener('click', () => this.game.startGame());
        this.elements.playAgainBtn.addEventListener('click', () => this.game.startGame());
    }
    
    showScreen(screenName) {
        for (const key in this.elements) {
            if (key.endsWith('Screen')) {
                this.elements[key].classList.add('hidden');
            }
        }
        
        if (screenName && this.elements[screenName + 'Screen']) {
            this.elements[screenName + 'Screen'].classList.remove('hidden');
        }
    }
    
    updateScore(score) {
        this.elements.currentScore.textContent = score;
        this.elements.currentScore.style.transform = 'scale(1.2)';
        setTimeout(() => {
            this.elements.currentScore.style.transform = 'scale(1)';
        }, 200);
    }
    
    showCombo(linesCleared, score) {
        if (linesCleared <= 1) return;
        
        const multipliers = ['', '2X', '4X', '8X', '16X'];
        const text = multipliers[linesCleared - 1] || `${Math.pow(2, linesCleared - 1)}X`;
        
        this.elements.comboText.textContent = `${text} COMBO! +${score}`;
        this.elements.comboDisplay.classList.remove('hidden');
        
        setTimeout(() => {
            this.elements.comboDisplay.classList.add('hidden');
        }, 1500);
    }
    
    updateHighScore(score) {
        this.elements.highScore.textContent = score;
    }
    
    showGameOver(finalScore, isNewHighScore) {
        this.elements.finalScore.textContent = finalScore;
        
        if (isNewHighScore) {
            this.elements.newHighscore.classList.remove('hidden');
        } else {
            this.elements.newHighscore.classList.add('hidden');
        }
        
        this.showScreen('gameover');
    }
    
    loadHighScore() {
        const saved = localStorage.getItem('fallingPuzzleHighScore');
        if (saved) {
            this.game.highScore = parseInt(saved);
            this.updateHighScore(this.game.highScore);
        }
    }
    
    saveHighScore(score) {
        localStorage.setItem('fallingPuzzleHighScore', score);
    }
}
