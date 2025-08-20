// Particle class for visual effects
class Particle {
    constructor(x, y, emoji, life = 1, color = 'white', type = 'default') {
        this.x = x;
        this.y = y;
        this.emoji = emoji;
        this.life = life;
        this.maxLife = life;
        this.color = color;
        this.type = type;
        
        // Enhanced movement with particle type variations
        if (type === 'resource') {
            this.vx = (Math.random() - 0.5) * 30;
            this.vy = (Math.random() - 0.5) * 30 - 40;
            this.gravity = 30;
            this.size = 16;
        } else if (type === 'explosion') {
            this.vx = (Math.random() - 0.5) * 80;
            this.vy = (Math.random() - 0.5) * 80 - 20;
            this.gravity = 20;
            this.size = 20;
        } else {
            this.vx = (Math.random() - 0.5) * 50;
            this.vy = (Math.random() - 0.5) * 50 - 25;
            this.gravity = 50;
            this.size = 12;
        }
        
        this.rotation = 0;
        this.rotationSpeed = (Math.random() - 0.5) * 4;
        this.scale = 1;
    }
    
    update(deltaTime) {
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
        this.vy += this.gravity * deltaTime;
        this.life -= deltaTime;
        
        // Add rotation and scaling effects
        this.rotation += this.rotationSpeed * deltaTime;
        
        // Scale based on life remaining for fade effect
        const lifeRatio = this.life / this.maxLife;
        this.scale = 0.5 + (lifeRatio * 0.5);
    }
    
    render(ctx) {
        if (this.life <= 0) return;
        
        ctx.save();
        
        // Apply transformations
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.scale(this.scale, this.scale);
        
        // Alpha based on remaining life
        const alpha = Math.max(0, this.life / this.maxLife);
        ctx.globalAlpha = alpha;
        
        // Enhanced rendering with glow effect for certain types
        if (this.type === 'resource') {
            // Add glow effect
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 10;
        }
        
        ctx.fillStyle = this.color;
        ctx.font = `${this.size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.emoji, 0, 0);
        
        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        
        ctx.restore();
    }
}