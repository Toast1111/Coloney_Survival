// Colony Survival Game
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
        this.buildingTypes = {
            house: { name: 'House', cost: { wood: 10 }, emoji: '🏠', produces: 'population', productionRate: 0.1 },
            farm: { name: 'Farm', cost: { wood: 5, stone: 3 }, emoji: '🌾', produces: 'food', productionRate: 0.5 },
            lumberyard: { name: 'Lumberyard', cost: { wood: 8, stone: 5 }, emoji: '🪓', produces: 'wood', productionRate: 0.3 },
            quarry: { name: 'Quarry', cost: { wood: 10, stone: 8 }, emoji: '⛏️', produces: 'stone', productionRate: 0.2 },
            tower: { name: 'Tower', cost: { wood: 15, stone: 10 }, emoji: '🗼', produces: 'defense', productionRate: 1 }
        };
        
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
        
        // Prevent default touch behaviors
        document.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
        document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
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

// Initialize game when page loads
window.addEventListener('load', () => {
    new Game();
});