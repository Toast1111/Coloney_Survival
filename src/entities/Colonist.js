// Colonist class
class Colonist {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.health = 50;
        this.maxHealth = 50;
        this.speed = 30;
        this.target = null;
        this.task = 'idle';
        this.taskTimer = 0;
        this.collectTimer = 0;
        this.size = 12;
    }
    
    update(deltaTime, game) {
        this.taskTimer += deltaTime;
        this.collectTimer += deltaTime;
        
        // Find nearby enemies and run away
        const nearbyEnemy = this.findNearbyEnemy(game.enemies, 50);
        if (nearbyEnemy) {
            this.fleeFrom(nearbyEnemy, deltaTime);
            this.task = 'fleeing';
            return;
        }
        
        // Assign tasks
        if (this.taskTimer >= 3) {
            this.assignTask(game);
            this.taskTimer = 0;
        }
        
        // Execute current task
        this.executeTask(deltaTime, game);
        
        // Auto-collect resources
        if (this.collectTimer >= 2) {
            this.collectNearbyResources(game);
            this.collectTimer = 0;
        }
        
        // Consume food
        if (Math.random() < 0.001) {
            if (game.resources.food > 0) {
                game.resources.food -= 0.1;
            } else {
                this.takeDamage(1);
            }
        }
    }
    
    findNearbyEnemy(enemies, range) {
        for (const enemy of enemies) {
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance <= range) {
                return enemy;
            }
        }
        return null;
    }
    
    fleeFrom(enemy, deltaTime) {
        const dx = this.x - enemy.x;
        const dy = this.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            const moveX = (dx / distance) * this.speed * deltaTime;
            const moveY = (dy / distance) * this.speed * deltaTime;
            
            this.x = Math.max(this.size, Math.min(800 - this.size, this.x + moveX));
            this.y = Math.max(this.size, Math.min(600 - this.size, this.y + moveY));
        }
    }
    
    assignTask(game) {
        // Priority: flee > build > collect > wander
        const tasks = ['collect', 'wander', 'patrol'];
        this.task = tasks[Math.floor(Math.random() * tasks.length)];
        
        if (this.task === 'collect') {
            this.target = this.findNearestResourceBuilding(game.buildings);
        } else if (this.task === 'patrol') {
            this.target = {
                x: Math.random() * 800,
                y: Math.random() * 600
            };
        }
    }
    
    findNearestResourceBuilding(buildings) {
        let nearest = null;
        let nearestDistance = Infinity;
        
        for (const building of buildings) {
            if (['farm', 'lumberyard', 'quarry'].includes(building.type)) {
                const dx = building.x - this.x;
                const dy = building.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < nearestDistance) {
                    nearest = building;
                    nearestDistance = distance;
                }
            }
        }
        
        return nearest;
    }
    
    executeTask(deltaTime, game) {
        if (this.target) {
            const dx = this.target.x - this.x;
            const dy = this.target.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 5) {
                const moveX = (dx / distance) * this.speed * deltaTime;
                const moveY = (dy / distance) * this.speed * deltaTime;
                
                this.x += moveX;
                this.y += moveY;
            } else {
                this.target = null;
            }
        } else if (this.task === 'wander') {
            // Random movement
            this.x += (Math.random() - 0.5) * this.speed * deltaTime;
            this.y += (Math.random() - 0.5) * this.speed * deltaTime;
            
            // Keep in bounds
            this.x = Math.max(this.size, Math.min(800 - this.size, this.x));
            this.y = Math.max(this.size, Math.min(600 - this.size, this.y));
        }
    }
    
    collectNearbyResources(game) {
        const buildings = game.buildings.filter(b => 
            ['farm', 'lumberyard', 'quarry'].includes(b.type)
        );
        
        for (const building of buildings) {
            const dx = building.x - this.x;
            const dy = building.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance <= 40) {
                const produces = building.typeData.produces;
                if (game.resources[produces] !== undefined) {
                    game.resources[produces] += 0.5;
                    game.particles.push(new Particle(
                        this.x, this.y, building.typeData.emoji, 0.5, 'green'
                    ));
                }
                break;
            }
        }
    }
    
    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.health = 0;
        }
    }
    
    render(ctx) {
        // Colonist body
        ctx.fillStyle = this.health > 25 ? '#4299e1' : '#e53e3e';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Colonist face
        ctx.fillStyle = 'white';
        ctx.font = `${this.size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('👤', this.x, this.y);
        
        // Health bar
        if (this.health < this.maxHealth) {
            const barWidth = this.size * 1.5;
            const barHeight = 3;
            const barX = this.x - barWidth / 2;
            const barY = this.y - this.size - 8;
            
            ctx.fillStyle = 'red';
            ctx.fillRect(barX, barY, barWidth, barHeight);
            
            ctx.fillStyle = 'green';
            const healthWidth = (this.health / this.maxHealth) * barWidth;
            ctx.fillRect(barX, barY, healthWidth, barHeight);
        }
        
        // Task indicator
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = '8px Arial';
        ctx.fillText(this.task, this.x, this.y + this.size + 12);
    }
}