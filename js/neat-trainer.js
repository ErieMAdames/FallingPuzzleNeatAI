// NEAT Trainer - Manages NEAT algorithm and evolution
class NEATTrainer {
    constructor() {
        const { Neat, methods, architect } = neataptic;
        
        this.neat = new Neat(
            88,  // inputs (8×11 board)
            26,  // outputs (8 source col + 10 source row + 8 target col)
            null,
            {
                mutation: methods.mutation.ALL,
                popsize: 50,
                mutationRate: 0.3,
                elitism: 5
                // No initial network - NEAT will create minimal topology and evolve it
            }
        );
        
        // Apply initial random mutations to create diversity in starting population
        for (let i = 0; i < this.neat.population.length; i++) {
            // Give each network some initial random mutations
            const numMutations = 2 + Math.floor(Math.random() * 3); // 2-4 mutations
            for (let m = 0; m < numMutations; m++) {
                const rand = Math.random();
                if (rand < 0.5) {
                    this.neat.population[i].mutate(methods.mutation.MOD_WEIGHT);
                } else if (rand < 0.75) {
                    this.neat.population[i].mutate(methods.mutation.MOD_BIAS);
                } else {
                    this.neat.population[i].mutate(methods.mutation.ADD_CONN);
                }
            }
        }
        
        this.generation = 0;
        this.bestFitness = 0;
        this.avgFitness = 0;
        this.bestGenome = null;
    }
    
    // Evaluate entire population (assign fitness scores)
    evaluatePopulation(fitnessScores) {
        if (fitnessScores.length !== this.neat.population.length) {
            console.error('Fitness scores length mismatch');
            return;
        }
        
        // Assign fitness to each genome
        for (let i = 0; i < this.neat.population.length; i++) {
            this.neat.population[i].score = fitnessScores[i];
        }
        
        // Sort by fitness
        this.neat.sort();
        
        // Update stats
        this.bestGenome = this.neat.population[0];
        this.bestFitness = this.bestGenome.score;
        
        const sum = fitnessScores.reduce((a, b) => a + b, 0);
        this.avgFitness = Math.round(sum / fitnessScores.length);
    }
    
    // Evolve to next generation with improved mutations
    evolve() {
        const { Network, methods } = neataptic;
        
        const newPopulation = [];
        
        // Keep elite performers
        for (let i = 0; i < this.neat.elitism; i++) {
            newPopulation.push(this.neat.population[i]);
        }
        
        // Breed and mutate the rest
        for (let i = this.neat.elitism; i < this.neat.popsize; i++) {
            // Select parents using fitness-proportionate selection
            const parent1 = this.neat.getParent();
            const parent2 = this.neat.getParent();
            
            // Crossover
            const offspring = Network.crossOver(parent1, parent2);
            
            // Apply multiple mutations per offspring for faster evolution
            const numMutations = 1 + Math.floor(Math.random() * 3); // 1-3 mutations
            
            for (let m = 0; m < numMutations; m++) {
                const rand = Math.random();
                
                if (rand < 0.15) {
                    // 15% chance to add a node
                    offspring.mutate(methods.mutation.ADD_NODE);
                } else if (rand < 0.30) {
                    // 15% chance to add a connection
                    offspring.mutate(methods.mutation.ADD_CONN);
                } else if (rand < 0.40) {
                    // 10% chance to remove connection
                    offspring.mutate(methods.mutation.SUB_CONN);
                } else if (rand < 0.70) {
                    // 30% modify weights (most common)
                    offspring.mutate(methods.mutation.MOD_WEIGHT);
                } else if (rand < 0.85) {
                    // 15% modify bias
                    offspring.mutate(methods.mutation.MOD_BIAS);
                } else {
                    // 15% modify activation function
                    offspring.mutate(methods.mutation.MOD_ACTIVATION);
                }
            }
            
            newPopulation.push(offspring);
        }
        
        // Replace population
        this.neat.population = newPopulation;
        this.neat.populationSize = this.neat.popsize;
        
        this.generation++;
    }
    
    // Get best performing genome
    getBest() {
        return this.bestGenome || this.neat.population[0];
    }
    
    // Get population for parallel evaluation
    getPopulation() {
        return this.neat.population;
    }
    
    // Export best network
    exportBest() {
        return this.getBest().toJSON();
    }
    
    // Import network
    importNetwork(json) {
        const { Network } = neataptic;
        const network = Network.fromJSON(json);
        this.neat.population[0] = network;
        this.bestGenome = network;
    }
    
    // Reset trainer
    reset() {
        this.constructor();
    }
}
