// Building class
class Building {
    constructor(x, y, type, typeData) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.typeData = typeData;
        this.health = 100;
        this.maxHealth = 100;
        this.productionTimer = 0;
        this.productionInterval = 3; // seconds
    }
    
    update(deltaTime, game) {
        this.productionTimer += deltaTime;
        
        if (this.productionTimer >= this.productionInterval) {
            this.produce(game);
            this.productionTimer = 0;
        }
    }
    
    produce(game) {
        const produces = this.typeData.produces;
        const rate = this.typeData.productionRate;
        
        if (produces === 'population') {
            if (game.colonists.length < game.maxPopulation) {
                const chance = rate * (1 / 60) * this.productionInterval;
                if (Math.random() < chance) {
                    game.colonists.push(new Colonist(
                        this.x + game.gridSize / 2,
                        this.y + game.gridSize / 2
                    ));
                }
            }
        } else if (produces === 'defense') {
            // Tower defense - damage nearby enemies
            const range = 100;
            game.enemies.forEach(enemy => {
                const dx = enemy.x - (this.x + game.gridSize / 2);
                const dy = enemy.y - (this.y + game.gridSize / 2);
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance <= range) {
                    enemy.takeDamage(rate * 10);
                    game.particles.push(new Particle(
                        enemy.x, enemy.y, '💥', 1, 'orange'
                    ));
                }
            });
        } else if (game.resources[produces] !== undefined) {
            game.resources[produces] += rate;
        }
    }
    
    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.health = 0;
        }
    }
    
    render(ctx) {
        const gridSize = 32;
        
        // Building background
        ctx.fillStyle = this.health > 50 ? '#4a5568' : '#e53e3e';
        ctx.fillRect(this.x, this.y, gridSize, gridSize);
        
        // Building border
        ctx.strokeStyle = '#2d3748';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, gridSize, gridSize);
        
        // Building emoji
        ctx.font = `${gridSize * 0.6}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'white';
        ctx.fillText(
            this.typeData.emoji,
            this.x + gridSize / 2,
            this.y + gridSize / 2
        );
        
        // Health bar
        if (this.health < this.maxHealth) {
            const barWidth = gridSize * 0.8;
            const barHeight = 4;
            const barX = this.x + (gridSize - barWidth) / 2;
            const barY = this.y - 8;
            
            ctx.fillStyle = 'red';
            ctx.fillRect(barX, barY, barWidth, barHeight);
            
            ctx.fillStyle = 'green';
            const healthWidth = (this.health / this.maxHealth) * barWidth;
            ctx.fillRect(barX, barY, healthWidth, barHeight);
        }
    }
}