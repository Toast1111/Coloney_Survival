// Colony Survival Game - Main Game Class
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.isRunning = false;
        this.isPaused = false;
        this.gameSpeed = 1;
        
        // Game state
        this.resources = { food: 100, wood: 50, stone: 25, population: 3 };
        this.lastResources = { ...this.resources }; // Track previous values for animations
        this.maxPopulation = 3;
        this.currentWave = 1;
        this.waveTimer = 60;
        this.gameTime = 0;
        
        // Game entities
        this.buildings = [];
        this.colonists = [];
        this.enemies = [];
        this.particles = [];
        
        // Grid system
        this.gridSize = 32;
        this.gridWidth = 0;
        this.gridHeight = 0;
        
        // Input handling
        this.selectedBuilding = null;
        this.buildingPreview = null;
        this.mousePos = { x: 0, y: 0 };
        this.lastTouchTime = 0;
        
        // Building definitions
        this.buildingTypes = BUILDING_TYPES;
        
        this.init();
    }
    
    init() {
        this.resizeCanvas();
        this.setupEventListeners();
        this.spawnInitialColonists();
        this.start();
        
        // Update UI
        setInterval(() => this.updateUI(), 100);
    }
    
    resizeCanvas() {
        const container = document.getElementById('gameContainer');
        const hud = document.getElementById('hud');
        const gameInfo = document.getElementById('gameInfo');
        
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight - hud.offsetHeight - gameInfo.offsetHeight;
        
        this.gridWidth = Math.floor(this.canvas.width / this.gridSize);
        this.gridHeight = Math.floor(this.canvas.height / this.gridSize);
    }
    
    setupEventListeners() {
        // Window resize
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Building selection
        document.querySelectorAll('.build-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.build-btn').forEach(b => b.classList.remove('selected'));
                
                if (this.selectedBuilding === e.target.dataset.building) {
                    this.selectedBuilding = null;
                    this.buildingPreview = null;
                } else {
                    this.selectedBuilding = e.target.dataset.building;
                    e.target.classList.add('selected');
                }
            });
        });
        
        // Canvas mouse/touch events
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e));
        
        // Mobile controls
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('speedBtn').addEventListener('click', () => this.toggleSpeed());
        document.getElementById('menuBtn').addEventListener('click', () => this.toggleBuildMenu());
        
        // Prevent default touch behaviors only on canvas
        this.canvas.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
        this.canvas.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
    }
    
    spawnInitialColonists() {
        for (let i = 0; i < this.resources.population; i++) {
            this.colonists.push(new Colonist(
                Math.random() * this.canvas.width,
                Math.random() * this.canvas.height
            ));
        }
    }
    
    start() {
        this.isRunning = true;
        this.gameLoop();
    }
    
    gameLoop() {
        if (this.isRunning) {
            if (!this.isPaused) {
                this.update();
            }
            this.render();
            requestAnimationFrame(() => this.gameLoop());
        }
    }
    
    update() {
        const deltaTime = 1 / 60 * this.gameSpeed;
        this.gameTime += deltaTime;
        
        // Update wave timer
        this.waveTimer -= deltaTime;
        if (this.waveTimer <= 0) {
            this.startWave();
            this.waveTimer = 60 + (this.currentWave * 10);
        }
        
        // Update buildings
        this.buildings.forEach(building => building.update(deltaTime, this));
        
        // Update colonists
        this.colonists.forEach(colonist => colonist.update(deltaTime, this));
        
        // Update enemies
        this.enemies.forEach(enemy => enemy.update(deltaTime, this));
        this.enemies = this.enemies.filter(enemy => enemy.health > 0);
        
        // Update particles
        this.particles.forEach(particle => particle.update(deltaTime));
        this.particles = this.particles.filter(particle => particle.life > 0);
        
        // Check win/lose conditions
        this.checkGameState();
    }
    
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid
        this.drawGrid();
        
        // Draw buildings
        this.buildings.forEach(building => building.render(this.ctx));
        
        // Draw colonists
        this.colonists.forEach(colonist => colonist.render(this.ctx));
        
        // Draw enemies
        this.enemies.forEach(enemy => enemy.render(this.ctx));
        
        // Draw particles
        this.particles.forEach(particle => particle.render(this.ctx));
        
        // Draw building preview
        if (this.buildingPreview) {
            this.drawBuildingPreview();
        }
    }
    
    drawGrid() {
        // Enhanced grid with subtle animation
        const pulseIntensity = 0.05 + 0.02 * Math.sin(this.gameTime * 0.5);
        this.ctx.strokeStyle = `rgba(255, 255, 255, ${0.08 + pulseIntensity})`;
        this.ctx.lineWidth = 0.5;
        
        // Major grid lines every 4th line
        const majorLineInterval = this.gridSize * 4;
        
        for (let x = 0; x <= this.canvas.width; x += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            
            // Make every 4th line slightly more prominent
            if (x % majorLineInterval === 0) {
                this.ctx.strokeStyle = `rgba(255, 255, 255, ${0.15 + pulseIntensity})`;
                this.ctx.lineWidth = 1;
            } else {
                this.ctx.strokeStyle = `rgba(255, 255, 255, ${0.08 + pulseIntensity})`;
                this.ctx.lineWidth = 0.5;
            }
            
            this.ctx.stroke();
        }
        
        for (let y = 0; y <= this.canvas.height; y += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            
            // Make every 4th line slightly more prominent
            if (y % majorLineInterval === 0) {
                this.ctx.strokeStyle = `rgba(255, 255, 255, ${0.15 + pulseIntensity})`;
                this.ctx.lineWidth = 1;
            } else {
                this.ctx.strokeStyle = `rgba(255, 255, 255, ${0.08 + pulseIntensity})`;
                this.ctx.lineWidth = 0.5;
            }
            
            this.ctx.stroke();
        }
    }
    
    drawBuildingPreview() {
        if (!this.selectedBuilding || !this.buildingPreview) return;
        
        const type = this.buildingTypes[this.selectedBuilding];
        const gridX = Math.floor(this.buildingPreview.x / this.gridSize) * this.gridSize;
        const gridY = Math.floor(this.buildingPreview.y / this.gridSize) * this.gridSize;
        
        const canPlace = this.canPlaceBuilding(gridX, gridY);
        
        this.ctx.save();
        
        // Enhanced preview with pulse animation
        const pulseIntensity = 0.1 + 0.05 * Math.sin(this.gameTime * 4);
        this.ctx.globalAlpha = 0.6 + pulseIntensity;
        
        // Better background with border
        if (canPlace) {
            this.ctx.fillStyle = 'rgba(34, 197, 94, 0.4)'; // Nice green
            this.ctx.strokeStyle = 'rgba(34, 197, 94, 0.8)';
        } else {
            this.ctx.fillStyle = 'rgba(239, 68, 68, 0.4)'; // Nice red
            this.ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
        }
        
        this.ctx.fillRect(gridX, gridY, this.gridSize, this.gridSize);
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(gridX, gridY, this.gridSize, this.gridSize);
        
        // Building emoji with subtle animation
        const emojiScale = 1 + pulseIntensity * 0.1;
        this.ctx.font = `${this.gridSize * 0.6 * emojiScale}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = canPlace ? '#ffffff' : '#ffeeee';
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.lineWidth = 1;
        this.ctx.strokeText(
            type.emoji,
            gridX + this.gridSize / 2,
            gridY + this.gridSize / 2
        );
        this.ctx.fillText(
            type.emoji,
            gridX + this.gridSize / 2,
            gridY + this.gridSize / 2
        );
        
        this.ctx.restore();
    }
    
    canPlaceBuilding(x, y) {
        if (x < 0 || y < 0 || x + this.gridSize > this.canvas.width || y + this.gridSize > this.canvas.height) {
            return false;
        }
        
        return !this.buildings.some(building => 
            building.x === x && building.y === y
        );
    }
    
    placeBuilding(x, y) {
        if (!this.selectedBuilding) return false;
        
        const type = this.buildingTypes[this.selectedBuilding];
        const gridX = Math.floor(x / this.gridSize) * this.gridSize;
        const gridY = Math.floor(y / this.gridSize) * this.gridSize;
        
        if (!this.canPlaceBuilding(gridX, gridY)) return false;
        
        // Check resources
        for (const [resource, cost] of Object.entries(type.cost)) {
            if (this.resources[resource] < cost) return false;
        }
        
        // Deduct resources
        for (const [resource, cost] of Object.entries(type.cost)) {
            this.resources[resource] -= cost;
        }
        
        // Create building
        this.buildings.push(new Building(gridX, gridY, this.selectedBuilding, type));
        
        // Add building placement particles
        for (let i = 0; i < 5; i++) {
            this.particles.push(new Particle(
                gridX + this.gridSize / 2 + (Math.random() - 0.5) * this.gridSize,
                gridY + this.gridSize / 2 + (Math.random() - 0.5) * this.gridSize,
                '✨', 1.5, '#22c55e', 'explosion'
            ));
        }
        
        // Clear selection
        this.selectedBuilding = null;
        this.buildingPreview = null;
        document.querySelectorAll('.build-btn').forEach(b => b.classList.remove('selected'));
        
        return true;
    }
    
    startWave() {
        const enemyCount = this.currentWave * 2 + 3;
        
        for (let i = 0; i < enemyCount; i++) {
            setTimeout(() => {
                const side = Math.floor(Math.random() * 4);
                let x, y;
                
                switch (side) {
                    case 0: x = Math.random() * this.canvas.width; y = -32; break;
                    case 1: x = this.canvas.width + 32; y = Math.random() * this.canvas.height; break;
                    case 2: x = Math.random() * this.canvas.width; y = this.canvas.height + 32; break;
                    case 3: x = -32; y = Math.random() * this.canvas.height; break;
                }
                
                this.enemies.push(new Enemy(x, y, this.currentWave));
            }, i * 1000);
        }
        
        this.currentWave++;
    }
    
    checkGameState() {
        // Update population based on houses
        const houses = this.buildings.filter(b => b.type === 'house').length;
        this.maxPopulation = 3 + houses * 2;
        
        // Game over if no colonists
        if (this.colonists.length === 0) {
            this.gameOver('No colonists remaining!');
        }
    }
    
    gameOver(reason) {
        this.isPaused = true;
        document.getElementById('gameStatus').textContent = `Game Over: ${reason}`;
        setTimeout(() => {
            if (confirm(`Game Over: ${reason}\nRestart?`)) {
                location.reload();
            }
        }, 1000);
    }
    
    updateUI() {
        // Animate resource changes
        this.animateResourceChange('food', Math.floor(this.resources.food));
        this.animateResourceChange('wood', Math.floor(this.resources.wood));
        this.animateResourceChange('stone', Math.floor(this.resources.stone));
        
        document.getElementById('population').textContent = `${this.colonists.length}/${this.maxPopulation}`;
        document.getElementById('currentWave').textContent = this.currentWave;
        document.getElementById('waveTimer').textContent = Math.ceil(this.waveTimer);
        
        // Update lastResources for next frame
        this.lastResources = { ...this.resources };
        
        // Update build button states with enhanced visual feedback
        document.querySelectorAll('.build-btn').forEach(btn => {
            const buildingType = btn.dataset.building;
            const type = this.buildingTypes[buildingType];
            let canAfford = true;
            
            for (const [resource, cost] of Object.entries(type.cost)) {
                if (this.resources[resource] < cost) {
                    canAfford = false;
                    break;
                }
            }
            
            const wasDisabled = btn.disabled;
            btn.disabled = !canAfford;
            
            // Add visual feedback when affordability changes
            if (wasDisabled && !btn.disabled) {
                btn.classList.add('newly-affordable');
                setTimeout(() => btn.classList.remove('newly-affordable'), 500);
            }
        });
    }
    
    animateResourceChange(resourceType, newValue) {
        const element = document.getElementById(resourceType);
        const currentValue = parseInt(element.textContent) || 0;
        
        if (currentValue !== newValue) {
            element.classList.add('updating');
            
            // Animate the number change
            this.animateNumber(element, currentValue, newValue, 300);
            
            setTimeout(() => {
                element.classList.remove('updating');
            }, 500);
        }
    }
    
    animateNumber(element, start, end, duration) {
        const startTime = performance.now();
        const difference = end - start;
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Use easing function for smooth animation
            const easedProgress = this.easeOutCubic(progress);
            const currentValue = Math.floor(start + (difference * easedProgress));
            
            element.textContent = currentValue;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                element.textContent = end;
            }
        };
        
        requestAnimationFrame(animate);
    }
    
    easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }
    
    // Input handling methods
    handleCanvasClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.placeBuilding(x, y);
    }
    
    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mousePos.x = e.clientX - rect.left;
        this.mousePos.y = e.clientY - rect.top;
        
        if (this.selectedBuilding) {
            this.buildingPreview = { x: this.mousePos.x, y: this.mousePos.y };
        }
    }
    
    handleTouchStart(e) {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const touch = e.touches[0];
        this.mousePos.x = touch.clientX - rect.left;
        this.mousePos.y = touch.clientY - rect.top;
        
        // Handle double tap for building placement
        const now = Date.now();
        if (now - this.lastTouchTime < 300) {
            this.placeBuilding(this.mousePos.x, this.mousePos.y);
        }
        this.lastTouchTime = now;
    }
    
    handleTouchMove(e) {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const touch = e.touches[0];
        this.mousePos.x = touch.clientX - rect.left;
        this.mousePos.y = touch.clientY - rect.top;
        
        if (this.selectedBuilding) {
            this.buildingPreview = { x: this.mousePos.x, y: this.mousePos.y };
        }
    }
    
    handleTouchEnd(e) {
        e.preventDefault();
        if (this.selectedBuilding) {
            this.placeBuilding(this.mousePos.x, this.mousePos.y);
        }
    }
    
    togglePause() {
        this.isPaused = !this.isPaused;
        document.getElementById('pauseBtn').textContent = this.isPaused ? '▶️' : '⏸️';
    }
    
    toggleSpeed() {
        this.gameSpeed = this.gameSpeed === 1 ? 2 : this.gameSpeed === 2 ? 3 : 1;
        document.getElementById('speedBtn').textContent = this.gameSpeed === 1 ? '⏩' : this.gameSpeed === 2 ? '⏩⏩' : '⏩⏩⏩';
    }
    
    toggleBuildMenu() {
        const menu = document.getElementById('buildMenu');
        menu.style.display = menu.style.display === 'none' ? 'flex' : 'none';
    }
}