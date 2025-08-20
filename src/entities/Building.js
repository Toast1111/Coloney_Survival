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
        
        // Construction animation properties
        this.constructionTime = 0;
        this.constructionDuration = 1.0; // 1 second construction animation
        this.isConstructed = false;
        this.constructionScale = 0;
    }
    
    update(deltaTime, game) {
        // Handle construction animation
        if (!this.isConstructed) {
            this.constructionTime += deltaTime;
            const progress = Math.min(this.constructionTime / this.constructionDuration, 1);
            
            // Bounce-in effect for construction
            this.constructionScale = this.easeOutBounce(progress);
            
            if (progress >= 1) {
                this.isConstructed = true;
                this.constructionScale = 1;
                // Add construction completion particle effect
                game.particles.push(new Particle(
                    this.x + 16, this.y + 16, '✨', 1.5, '#22c55e', 'explosion'
                ));
            }
            return; // Don't produce resources while constructing
        }
        
        this.productionTimer += deltaTime;
        
        if (this.productionTimer >= this.productionInterval) {
            this.produce(game);
            this.productionTimer = 0;
        }
    }
    
    easeOutBounce(t) {
        const n1 = 7.5625;
        const d1 = 2.75;
        
        if (t < 1 / d1) {
            return n1 * t * t;
        } else if (t < 2 / d1) {
            return n1 * (t -= 1.5 / d1) * t + 0.75;
        } else if (t < 2.5 / d1) {
            return n1 * (t -= 2.25 / d1) * t + 0.9375;
        } else {
            return n1 * (t -= 2.625 / d1) * t + 0.984375;
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
                    // Add population spawn particle
                    game.particles.push(new Particle(
                        this.x + game.gridSize / 2, this.y + game.gridSize / 2, '👶', 1.5, '#22c55e', 'resource'
                    ));
                }
            }
        } else if (produces === 'defense') {
            // Tower defense - damage nearby enemies
            const range = 100;
            let hitAnyEnemy = false;
            game.enemies.forEach(enemy => {
                const dx = enemy.x - (this.x + game.gridSize / 2);
                const dy = enemy.y - (this.y + game.gridSize / 2);
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance <= range) {
                    enemy.takeDamage(rate * 10);
                    hitAnyEnemy = true;
                    game.particles.push(new Particle(
                        enemy.x, enemy.y, '💥', 1, 'orange', 'explosion'
                    ));
                }
            });
            
            // Add muzzle flash if tower fired
            if (hitAnyEnemy) {
                game.particles.push(new Particle(
                    this.x + game.gridSize / 2, this.y + game.gridSize / 2, '⚡', 0.3, '#fbbf24', 'explosion'
                ));
            }
        } else if (game.resources[produces] !== undefined) {
            game.resources[produces] += rate;
            
            // Add resource generation particle effect
            const resourceEmojis = {
                'food': '🍖',
                'wood': '🪵', 
                'stone': '🪨'
            };
            
            if (resourceEmojis[produces]) {
                game.particles.push(new Particle(
                    this.x + game.gridSize / 2, this.y + game.gridSize / 2,
                    resourceEmojis[produces], 1.2, '#22c55e', 'resource'
                ));
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
        const gridSize = 32;
        
        ctx.save();
        
        // Apply construction scaling
        if (!this.isConstructed) {
            const centerX = this.x + gridSize / 2;
            const centerY = this.y + gridSize / 2;
            ctx.translate(centerX, centerY);
            ctx.scale(this.constructionScale, this.constructionScale);
            ctx.translate(-centerX, -centerY);
            
            // Add construction opacity
            ctx.globalAlpha = 0.7 + (this.constructionScale * 0.3);
        }
        
        // Enhanced building background with gradient effect
        const gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + gridSize);
        if (this.health > 50) {
            gradient.addColorStop(0, '#5a6478');
            gradient.addColorStop(1, '#3a4252');
        } else {
            gradient.addColorStop(0, '#ef5350');
            gradient.addColorStop(1, '#c62828');
        }
        
        ctx.fillStyle = gradient;
        ctx.fillRect(this.x, this.y, gridSize, gridSize);
        
        // Enhanced building border with shadow effect
        if (this.isConstructed) {
            ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
            ctx.shadowBlur = 4;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
        }
        
        ctx.strokeStyle = this.health > 50 ? '#2d3748' : '#8b1538';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, gridSize, gridSize);
        
        // Reset shadow for emoji
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // Building emoji with text shadow
        ctx.font = `${gridSize * 0.6}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Text shadow for emoji
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillText(
            this.typeData.emoji,
            this.x + gridSize / 2 + 1,
            this.y + gridSize / 2 + 1
        );
        
        ctx.fillStyle = 'white';
        ctx.fillText(
            this.typeData.emoji,
            this.x + gridSize / 2,
            this.y + gridSize / 2
        );
        
        // Enhanced health bar with rounded corners
        if (this.health < this.maxHealth && this.isConstructed) {
            const barWidth = gridSize * 0.8;
            const barHeight = 4;
            const barX = this.x + (gridSize - barWidth) / 2;
            const barY = this.y - 8;
            const borderRadius = 2;
            
            // Background bar with rounded corners
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            this.roundedRect(ctx, barX - 1, barY - 1, barWidth + 2, barHeight + 2, borderRadius);
            ctx.fill();
            
            // Red background
            ctx.fillStyle = '#ef4444';
            this.roundedRect(ctx, barX, barY, barWidth, barHeight, borderRadius);
            ctx.fill();
            
            // Green health portion
            const healthWidth = (this.health / this.maxHealth) * barWidth;
            if (healthWidth > 0) {
                ctx.fillStyle = '#22c55e';
                this.roundedRect(ctx, barX, barY, healthWidth, barHeight, borderRadius);
                ctx.fill();
            }
        }
        
        ctx.restore();
    }
    
    roundedRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }
}