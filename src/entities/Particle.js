// Particle class for visual effects
class Particle {
    constructor(x, y, emoji, life = 1, color = 'white') {
        this.x = x;
        this.y = y;
        this.emoji = emoji;
        this.life = life;
        this.maxLife = life;
        this.color = color;
        this.vx = (Math.random() - 0.5) * 50;
        this.vy = (Math.random() - 0.5) * 50 - 25;
        this.size = 12;
    }
    
    update(deltaTime) {
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
        this.vy += 50 * deltaTime; // gravity
        this.life -= deltaTime;
    }
    
    render(ctx) {
        if (this.life <= 0) return;
        
        ctx.save();
        ctx.globalAlpha = this.life / this.maxLife;
        ctx.fillStyle = this.color;
        ctx.font = `${this.size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.emoji, this.x, this.y);
        ctx.restore();
    }
}