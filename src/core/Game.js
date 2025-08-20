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
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;
        
        for (let x = 0; x <= this.canvas.width; x += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        for (let y = 0; y <= this.canvas.height; y += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
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
        this.ctx.globalAlpha = 0.7;
        this.ctx.fillStyle = canPlace ? 'rgba(0, 255, 0, 0.3)' : 'rgba(255, 0, 0, 0.3)';
        this.ctx.fillRect(gridX, gridY, this.gridSize, this.gridSize);
        
        this.ctx.font = `${this.gridSize * 0.6}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = 'white';
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
        document.getElementById('food').textContent = Math.floor(this.resources.food);
        document.getElementById('wood').textContent = Math.floor(this.resources.wood);
        document.getElementById('stone').textContent = Math.floor(this.resources.stone);
        document.getElementById('population').textContent = `${this.colonists.length}/${this.maxPopulation}`;
        document.getElementById('currentWave').textContent = this.currentWave;
        document.getElementById('waveTimer').textContent = Math.ceil(this.waveTimer);
        
        // Update build button states
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
            
            btn.disabled = !canAfford;
        });
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