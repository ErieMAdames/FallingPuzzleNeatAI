// Main entry point
window.addEventListener('DOMContentLoaded', () => {
    // Initialize play mode
    game = new Game();
    game.init();
    
    // Initialize training manager
    trainingManager = new TrainingManager();
    
    // Wire up mode toggle
    const toggleBtn = document.getElementById('toggle-mode');
    const gameContainer = document.getElementById('game-container');
    const trainingContainer = document.getElementById('training-container');
    
    toggleBtn.addEventListener('click', () => {
        const isTraining = !trainingContainer.classList.contains('hidden');
        
        if (isTraining) {
            // Switch to play mode
            trainingManager.stopTraining();
            trainingContainer.classList.add('hidden');
            gameContainer.classList.remove('hidden');
            toggleBtn.textContent = 'Switch to Training Mode';
        } else {
            // Switch to training mode
            if (game.state === 'playing') {
                game.state = 'paused';
            }
            gameContainer.classList.add('hidden');
            trainingContainer.classList.remove('hidden');
            toggleBtn.textContent = 'Switch to Play Mode';
            
            // Initialize if first time
            if (!trainingManager.trainer) {
                trainingManager.init();
            }
        }
    });
    
    // Wire up training controls
    document.getElementById('start-training').addEventListener('click', () => {
        trainingManager.startTraining();
    });
    
    document.getElementById('pause-training').addEventListener('click', () => {
        if (trainingManager.paused) {
            trainingManager.resumeTraining();
        } else {
            trainingManager.pauseTraining();
        }
    });
    
    document.getElementById('stop-training').addEventListener('click', () => {
        trainingManager.stopTraining();
    });
    
    document.getElementById('training-speed').addEventListener('change', (e) => {
        trainingManager.setSpeed(e.target.value);
    });
    
    document.getElementById('skip-generation').addEventListener('click', () => {
        trainingManager.skipGenerations(10);
    });
    
    document.getElementById('save-best').addEventListener('click', () => {
        const json = trainingManager.trainer.exportBest();
        const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `best-network-gen${trainingManager.trainer.generation}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        alert('Best network saved!');
    });
    
    document.getElementById('load-network').addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            const reader = new FileReader();
            
            reader.onload = (event) => {
                try {
                    const json = JSON.parse(event.target.result);
                    trainingManager.trainer.importNetwork(json);
                    trainingManager.visualizer.updateNetwork(trainingManager.trainer.getBest());
                    alert('Network loaded successfully!');
                } catch (error) {
                    alert('Error loading network: ' + error.message);
                }
            };
            
            reader.readAsText(file);
        };
        
        input.click();
    });
    
    document.getElementById('export-data').addEventListener('click', () => {
        // Create CSV
        let csv = 'Generation,Best Fitness,Avg Fitness\n';
        
        for (const data of trainingManager.trainingData) {
            csv += `${data.generation},${data.bestFitness},${data.avgFitness}\n`;
        }
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'training-data.csv';
        a.click();
        URL.revokeObjectURL(url);
        
        alert('Training data exported!');
    });
});

// Prevent zoom on mobile
document.addEventListener('gesturestart', (e) => e.preventDefault());
document.addEventListener('gesturechange', (e) => e.preventDefault());
document.addEventListener('gestureend', (e) => e.preventDefault());
