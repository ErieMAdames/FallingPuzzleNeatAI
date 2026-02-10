// Training Manager - Orchestrates NEAT training
class TrainingManager {
    constructor() {
        this.trainer = null;
        this.visualizer = null;
        this.trainingGame = null;
        this.trainingRenderer = null;
        
        this.running = false;
        this.paused = false;
        this.speed = 10;
        this.showVisualization = true;  // Toggle for showing best performer
        this.bestEverScore = 0;
        
        this.trainingData = [];  // For export
    }
    
    init() {
        // Create trainer
        this.trainer = new NEATTrainer();
        
        // Create visualizer
        this.visualizer = new NetworkVisualizer('#neural-net-container');
        
        // Create separate game instance for training
        const trainingCanvas = document.getElementById('training-canvas');
        this.trainingRenderer = new Renderer(trainingCanvas);
        
        // Initial visualization
        this.visualizer.updateNetwork(this.trainer.getBest());
    }
    
    async startTraining() {
        if (!this.trainer) this.init();
        
        this.running = true;
        this.updateControlStates();
        
        // Log console command for toggling visualization
        console.log('%c💡 Tip: Toggle visualization with:', 'color: #667eea; font-weight: bold');
        console.log('  trainingManager.showVisualization = false  // Hide for max speed');
        console.log('  trainingManager.showVisualization = true   // Show best performer');
        
        while (this.running) {
            if (this.paused) {
                await this.delay(100);
                continue;
            }
            
            // 1. Evaluate entire population in parallel (headless)
            const fitnessScores = await this.evaluatePopulationParallel();
            
            // 2. Assign fitness and sort
            this.trainer.evaluatePopulation(fitnessScores);
            
            // 3. Show best performer playing (with visuals) - optional
            if (this.showVisualization) {
                await this.showBestPerformer();
            } else {
                // Show disabled message on canvas
                this.clearTrainingCanvas();
            }
            
            // 4. Update neural net visualization (always update structure)
            this.visualizer.updateNetwork(this.trainer.getBest());
            
            // 5. Update stats display
            this.updateStatsDisplay();
            
            // 6. Save training data
            this.trainingData.push({
                generation: this.trainer.generation,
                bestFitness: this.trainer.bestFitness,
                avgFitness: this.trainer.avgFitness
            });
            
            // 7. Evolve to next generation
            this.trainer.evolve();
            
            // Speed control delay
            if (this.speed > 0) {
                await this.delay(1000 / this.speed);
            }
        }
    }
    
    async evaluatePopulationParallel() {
        const population = this.trainer.getPopulation();
        const fitnessScores = [];
        
        // Run all genomes (in sequence but fast, no animations)
        for (let i = 0; i < population.length; i++) {
            const genome = population[i];
            const fitness = await this.runGameInstance(genome, true);
            fitnessScores.push(fitness);
        }
        
        return fitnessScores;
    }
    
    async showBestPerformer() {
        const bestGenome = this.trainer.getBest();
        await this.runGameInstance(bestGenome, false);
    }
    
    clearTrainingCanvas() {
        const ctx = this.trainingRenderer.ctx;
        ctx.fillStyle = '#2a2a4a';
        ctx.fillRect(0, 0, this.trainingRenderer.canvas.width, this.trainingRenderer.canvas.height);
        
        // Show message
        ctx.fillStyle = '#ffffff';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Visualization Disabled', this.trainingRenderer.canvas.width / 2, this.trainingRenderer.canvas.height / 2);
        ctx.font = '14px Arial';
        ctx.fillStyle = '#999999';
        ctx.fillText('(Training at maximum speed)', this.trainingRenderer.canvas.width / 2, this.trainingRenderer.canvas.height / 2 + 30);
    }
    
    async runGameInstance(genome, skipAnimations) {
        // Create fresh game instance
        const gameInstance = new Game();
        gameInstance.board = new Board();
        gameInstance.score = 0;
        gameInstance.moveCount = 0;  // Track moves for fitness calculation
        gameInstance.state = 'playing';
        gameInstance.skipAnimations = skipAnimations;
        gameInstance.fastMode = !skipAnimations;  // Use fast animations for visualized games
        gameInstance.selectedBlock = null;
        gameInstance.isAnimating = false;
        
        // Assign correct renderer
        if (skipAnimations) {
            gameInstance.renderer = { draw: () => {} };  // No-op renderer
        } else {
            gameInstance.renderer = this.trainingRenderer;
        }
        
        // Play game with AI until game over
        let moveCount = 0;
        const maxMoves = 500;  // Prevent infinite loops, give AI more chances
        let consecutiveFailures = 0;
        const maxConsecutiveFailures = 10;  // Kill net if it can't make valid moves
        
        while (gameInstance.state === 'playing' && moveCount < maxMoves && consecutiveFailures < maxConsecutiveFailures) {
            const blocksBefore = gameInstance.board.blocks.length;
            const scoreBefore = gameInstance.score;
            
            // Get board state
            const inputs = AIInterface.getBoardState(gameInstance.board);
            
            // Activate neural network
            const outputs = genome.activate(inputs);
            
            // Parse action
            const action = AIInterface.parseAction(outputs);
            
            // Execute action
            const success = await gameInstance.performAIAction(action);
            
            const blocksAfter = gameInstance.board.blocks.length;
            const scoreAfter = gameInstance.score;
            
            // Check if turn actually progressed (blocks raised means turn completed)
            const turnProgressed = blocksAfter > blocksBefore || scoreAfter > scoreBefore;
            
            if (!turnProgressed) {
                consecutiveFailures++;
            } else {
                consecutiveFailures = 0;  // Reset on successful turn
                gameInstance.moveCount++;  // Count successful moves for fitness
            }
            
            // Debug first few moves of visualized games
            if (!skipAnimations && moveCount < 5) {
                console.log(`Move ${moveCount}: blocks ${blocksBefore}→${blocksAfter}, score ${scoreBefore}→${scoreAfter}, failures ${consecutiveFailures}`, action);
            }
            
            // Draw if visualizing
            if (!skipAnimations) {
                this.trainingRenderer.draw(gameInstance.board, gameInstance.selectedBlock);
                this.updateAIScore(gameInstance.score);
                
                // Update neural network visualization with activations
                this.visualizer.updateActivations(genome);
                
                await this.delay(1);  // Max speed visualization
            }
            
            moveCount++;
        }
        
        // If killed due to consecutive failures, heavily penalize
        if (consecutiveFailures >= maxConsecutiveFailures) {
            if (!skipAnimations) {
                console.log('AI killed: too many consecutive illegal moves');
            }
        }
        
        // Update best score tracking
        if (gameInstance.score > this.bestEverScore) {
            this.bestEverScore = gameInstance.score;
        }
        
        return AIInterface.getFitness(gameInstance);
    }
    
    pauseTraining() {
        this.paused = true;
        this.updateControlStates();
    }
    
    resumeTraining() {
        this.paused = false;
        this.updateControlStates();
    }
    
    stopTraining() {
        this.running = false;
        this.paused = false;
        this.updateControlStates();
    }
    
    async skipGenerations(count) {
        const originalSpeed = this.speed;
        this.speed = 0;  // Max speed
        
        for (let i = 0; i < count && this.running; i++) {
            // Quick evaluation without visuals
            const fitnessScores = await this.evaluatePopulationParallel();
            this.trainer.evaluatePopulation(fitnessScores);
            this.updateStatsDisplay();
            this.trainer.evolve();
        }
        
        this.speed = originalSpeed;
        
        // Show best performer after skip
        await this.showBestPerformer();
        this.visualizer.updateNetwork(this.trainer.getBest());
    }
    
    updateStatsDisplay() {
        document.getElementById('gen-number').textContent = this.trainer.generation;
        document.getElementById('best-fitness').textContent = Math.round(this.trainer.bestFitness);
        document.getElementById('avg-fitness').textContent = Math.round(this.trainer.avgFitness * 10) / 10;
        document.getElementById('best-ever-score').textContent = Math.round(this.bestEverScore);
    }
    
    updateAIScore(score) {
        document.getElementById('ai-score').textContent = score;
    }
    
    updateControlStates() {
        const startBtn = document.getElementById('start-training');
        const pauseBtn = document.getElementById('pause-training');
        const stopBtn = document.getElementById('stop-training');
        
        startBtn.disabled = this.running;
        pauseBtn.disabled = !this.running || this.paused;
        stopBtn.disabled = !this.running;
        
        pauseBtn.textContent = this.paused ? 'Resume' : 'Pause';
    }
    
    setSpeed(speed) {
        this.speed = parseInt(speed);
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

let trainingManager;
