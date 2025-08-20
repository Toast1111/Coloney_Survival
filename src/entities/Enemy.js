// Enemy class
class Enemy {
    constructor(x, y, wave) {
        this.x = x;
        this.y = y;
        this.health = 30 + (wave * 10);
        this.maxHealth = this.health;
        this.speed = 20 + (wave * 2);
        this.damage = 5 + wave;
        this.target = null;
        this.attackTimer = 0;
        this.size = 16;
        this.wave = wave;
    }
    
    update(deltaTime, game) {
        this.attackTimer += deltaTime;
        
        // Find nearest target (colonist or building)
        this.findTarget(game);
        
        if (this.target) {
            this.moveToTarget(deltaTime);
            this.attackTarget(game);
        }
    }
    
    findTarget(game) {
        let nearestTarget = null;
        let nearestDistance = Infinity;
        
        // Check colonists
        for (const colonist of game.colonists) {
            const distance = this.distanceTo(colonist);
            if (distance < nearestDistance) {
                nearestTarget = colonist;
                nearestDistance = distance;
            }
        }
        
        // Check buildings
        for (const building of game.buildings) {
            const distance = this.distanceTo({
                x: building.x + game.gridSize / 2,
                y: building.y + game.gridSize / 2
            });
            if (distance < nearestDistance) {
                nearestTarget = building;
                nearestDistance = distance;
            }
        }
        
        this.target = nearestTarget;
    }
    
    distanceTo(target) {
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    moveToTarget(deltaTime) {
        if (!this.target) return;
        
        const targetX = this.target.x + (this.target.constructor.name === 'Building' ? 16 : 0);
        const targetY = this.target.y + (this.target.constructor.name === 'Building' ? 16 : 0);
        
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > this.size + 5) {
            const moveX = (dx / distance) * this.speed * deltaTime;
            const moveY = (dy / distance) * this.speed * deltaTime;
            
            this.x += moveX;
            this.y += moveY;
        }
    }
    
    attackTarget(game) {
        if (!this.target || this.attackTimer < 1) return;
        
        const distance = this.distanceTo(this.target);
        if (distance <= this.size + 20) {
            this.target.takeDamage(this.damage);
            this.attackTimer = 0;
            
            game.particles.push(new Particle(
                this.target.x, this.target.y, '💥', 0.8, 'red'
            ));
            
            // Remove dead targets
            if (this.target.health <= 0) {
                if (this.target.constructor.name === 'Colonist') {
                    const index = game.colonists.indexOf(this.target);
                    if (index > -1) game.colonists.splice(index, 1);
                } else if (this.target.constructor.name === 'Building') {
                    const index = game.buildings.indexOf(this.target);
                    if (index > -1) game.buildings.splice(index, 1);
                }
                this.target = null;
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
        // Enemy body
        ctx.fillStyle = '#e53e3e';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Enemy face
        ctx.fillStyle = 'white';
        ctx.font = `${this.size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('👹', this.x, this.y);
        
        // Health bar
        if (this.health < this.maxHealth) {
            const barWidth = this.size * 1.5;
            const barHeight = 3;
            const barX = this.x - barWidth / 2;
            const barY = this.y - this.size - 8;
            
            ctx.fillStyle = 'darkred';
            ctx.fillRect(barX, barY, barWidth, barHeight);
            
            ctx.fillStyle = 'red';
            const healthWidth = (this.health / this.maxHealth) * barWidth;
            ctx.fillRect(barX, barY, healthWidth, barHeight);
        }
    }
}