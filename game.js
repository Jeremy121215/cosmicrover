// CosmicRover 游戏逻辑
class RoverGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gameState = {
            running: false,
            paused: false,
            currentLevel: 1,
            score: 0,
            time: 0,
            missionComplete: false
        };
        
        this.rover = {
            x: 100,
            y: 300,
            width: 80,
            height: 40,
            wheelRadius: 15,
            velocityX: 0,
            velocityY: 0,
            health: 100,
            fuel: 100,
            maxSpeed: 8,
            acceleration: 0.5,
            deceleration: 0.9,
            jumpForce: 15,
            onGround: false,
            facingRight: true,
            suspensionOffset: 0
        };
        
        this.terrain = [];
        this.obstacles = [];
        this.collectibles = [];
        this.checkpoint = null;
        
        this.keys = {};
        this.gravity = 0.5;
        this.friction = 0.9;
        this.camera = { x: 0, y: 0 };
        
        this.init();
    }
    
    init() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            this.keys[e.code] = true;
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
            this.keys[e.code] = false;
        });
        
        document.getElementById('leftBtn').addEventListener('touchstart', () => this.keys['arrowleft'] = true);
        document.getElementById('leftBtn').addEventListener('touchend', () => this.keys['arrowleft'] = false);
        document.getElementById('rightBtn').addEventListener('touchstart', () => this.keys['arrowright'] = true);
        document.getElementById('rightBtn').addEventListener('touchend', () => this.keys['arrowright'] = false);
        document.getElementById('jumpBtn').addEventListener('touchstart', () => this.keys[' '] = true);
        document.getElementById('jumpBtn').addEventListener('touchend', () => this.keys[' '] = false);
        
        document.getElementById('startBtn').addEventListener('click', () => this.start());
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('resetBtn').addEventListener('click', () => this.reset());
        
        this.loadLevel(1);
        this.updateUI();
        this.gameLoop();
    }
    
    resizeCanvas() {
        const container = document.querySelector('.game-canvas-container');
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
    }
    
    loadLevel(level) {
        this.gameState.currentLevel = level;
        this.gameState.missionComplete = false;
        
        document.querySelectorAll('.level-item').forEach(item => item.classList.remove('active'));
        document.querySelector(`.level-item[data-level="${level}"]`).classList.add('active');
        
        document.getElementById('missionText').textContent = '到达关卡终点';
        document.getElementById('missionProgress').textContent = '进度: 0%';
        
        this.resetRover();
        this.generateTerrain(level);
        this.generateObstacles(level);
        this.generateCollectibles(level);
        this.generateCheckpoint(level);
        
        this.updateUI();
    }
    
    resetRover() {
        this.rover = {
            x: 100,
            y: 300,
            width: 80,
            height: 40,
            wheelRadius: 15,
            velocityX: 0,
            velocityY: 0,
            health: 100,
            fuel: 100,
            maxSpeed: 8,
            acceleration: 0.5,
            deceleration: 0.9,
            jumpForce: 15,
            onGround: false,
            facingRight: true,
            suspensionOffset: 0
        };
    }
    
    generateTerrain(level) {
        this.terrain = [];
        const groundY = this.canvas.height - 100;
        const segmentWidth = 200;
        
        for (let i = 0; i < 20; i++) {
            const x = i * segmentWidth;
            let heightVariation = 0;
            
            if (level === 1) {
                heightVariation = Math.sin(i * 0.5) * 30;
            } else if (level === 2) {
                heightVariation = Math.sin(i * 0.8) * 50;
            } else {
                heightVariation = Math.sin(i * 1.2) * 70;
            }
            
            this.terrain.push({
                x: x,
                y: groundY + heightVariation,
                width: segmentWidth,
                height: 100 - heightVariation,
                type: 'ground'
            });
        }
        
        if (level >= 2) {
            this.terrain.push({
                x: 1200,
                y: groundY - 150,
                width: 300,
                height: 50,
                type: 'platform'
            });
            
            this.terrain.push({
                x: 1800,
                y: groundY - 200,
                width: 200,
                height: 50,
                type: 'platform'
            });
        }
    }
    
    generateObstacles(level) {
        this.obstacles = [];
        
        if (level === 1) {
            this.obstacles.push({
                x: 600,
                y: this.canvas.height - 150,
                width: 40,
                height: 50,
                type: 'rock'
            });
            
            this.obstacles.push({
                x: 1000,
                y: this.canvas.height - 180,
                width: 60,
                height: 80,
                type: 'boulder'
            });
        }
        
        if (level >= 2) {
            this.obstacles.push({
                x: 1500,
                y: this.canvas.height - 250,
                width: 100,
                height: 20,
                type: 'spike'
            });
        }
    }
    
    generateCollectibles(level) {
        this.collectibles = [];
        
        for (let i = 0; i < 10; i++) {
            this.collectibles.push({
                x: 300 + i * 200,
                y: this.canvas.height - 200 - Math.sin(i) * 50,
                radius: 10,
                type: 'crystal',
                collected: false
            });
        }
    }
    
    generateCheckpoint(level) {
        const checkpointX = level === 1 ? 2500 : 
                          level === 2 ? 3000 : 
                          3500;
        
        this.checkpoint = {
            x: checkpointX,
            y: this.canvas.height - 200,
            width: 50,
            height: 100,
            reached: false
        };
    }
    
    start() {
        this.gameState.running = true;
        this.gameState.paused = false;
        document.getElementById('startBtn').textContent = '游戏中...';
        document.getElementById('startBtn').disabled = true;
    }
    
    togglePause() {
        if (!this.gameState.running) return;
        
        this.gameState.paused = !this.gameState.paused;
        document.getElementById('pauseBtn').textContent = 
            this.gameState.paused ? '继续' : '暂停';
    }
    
    reset() {
        this.gameState.running = false;
        this.gameState.paused = false;
        this.gameState.time = 0;
        this.gameState.missionComplete = false;
        
        this.resetRover();
        this.camera = { x: 0, y: 0 };
        
        document.getElementById('startBtn').textContent = '开始游戏';
        document.getElementById('startBtn').disabled = false;
        document.getElementById('pauseBtn').textContent = '暂停';
        document.getElementById('missionProgress').textContent = '进度: 0%';
        
        this.updateUI();
        this.render();
    }
    
    gameLoop() {
        if (this.gameState.running && !this.gameState.paused) {
            this.update();
            this.updateUI();
        }
        
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
    
    update() {
        this.gameState.time += 1/60;
        
        this.applyGravity();
        this.handleInput();
        this.updatePhysics();
        this.checkCollisions();
        this.checkCollectibles();
        this.checkCheckpoint();
        this.updateCamera();
    }
    
    applyGravity() {
        this.rover.velocityY += this.gravity;
    }
    
    handleInput() {
        if (this.keys['arrowleft'] || this.keys['a']) {
            this.rover.velocityX = Math.max(this.rover.velocityX - this.rover.acceleration, -this.rover.maxSpeed);
            this.rover.facingRight = false;
        }
        
        if (this.keys['arrowright'] || this.keys['d']) {
            this.rover.velocityX = Math.min(this.rover.velocityX + this.rover.acceleration, this.rover.maxSpeed);
            this.rover.facingRight = true;
        }
        
        if ((this.keys[' '] || this.keys['arrowup'] || this.keys['w']) && this.rover.onGround && this.rover.fuel > 0) {
            this.rover.velocityY = -this.rover.jumpForce;
            this.rover.onGround = false;
            this.rover.fuel -= 5;
        }
        
        if (!this.keys['arrowleft'] && !this.keys['a'] && !this.keys['arrowright'] && !this.keys['d']) {
            this.rover.velocityX *= this.rover.deceleration;
        }
    }
    
    updatePhysics() {
        this.rover.x += this.rover.velocityX;
        this.rover.y += this.rover.velocityY;
        
        if (this.rover.x < 0) this.rover.x = 0;
        if (this.rover.x > 4000) this.rover.x = 4000;
        
        if (this.rover.y > this.canvas.height - 100) {
            this.rover.y = this.canvas.height - 100;
            this.rover.velocityY = 0;
            this.rover.onGround = true;
        }
        
        if (this.rover.fuel < 100) {
            this.rover.fuel += 0.1;
        }
    }
    
    checkCollisions() {
        this.rover.onGround = false;
        
        for (const terrain of this.terrain) {
            if (this.circleRectCollision(
                this.rover.x + this.rover.width/2,
                this.rover.y + this.rover.height + this.rover.wheelRadius - 5,
                this.rover.wheelRadius,
                terrain
            )) {
                this.rover.onGround = true;
                this.rover.velocityY = 0;
                this.rover.y = terrain.y - (this.rover.height + this.rover.wheelRadius * 2);
                break;
            }
        }
        
        for (const obstacle of this.obstacles) {
            if (this.rectRectCollision(this.rover, obstacle)) {
                this.rover.health -= 5;
                this.rover.velocityX *= -0.5;
                
                if (this.rover.health < 0) this.rover.health = 0;
                
                if (obstacle.type === 'spike') {
                    this.rover.health -= 10;
                }
            }
        }
    }
    
    checkCollectibles() {
        for (const collectible of this.collectibles) {
            if (!collectible.collected && 
                this.circleCircleCollision(
                    this.rover.x + this.rover.width/2,
                    this.rover.y + this.rover.height/2,
                    20,
                    collectible.x,
                    collectible.y,
                    collectible.radius
                )) {
                collectible.collected = true;
                this.gameState.score += 100;
                
                const gameData = this.getUserGameData();
                if (gameData) {
                    gameData.crystals += 50;
                    this.saveUserGameData(gameData);
                    document.getElementById('crystalsCount').textContent = gameData.crystals;
                }
            }
        }
    }
    
    checkCheckpoint() {
        if (this.checkpoint && !this.checkpoint.reached &&
            this.rectRectCollision(this.rover, this.checkpoint)) {
            this.checkpoint.reached = true;
            this.gameState.missionComplete = true;
            this.gameState.score += 1000;
            
            const progress = Math.min(100, Math.floor((this.rover.x / this.checkpoint.x) * 100));
            document.getElementById('missionProgress').textContent = `进度: ${progress}%`;
            document.getElementById('missionText').textContent = '任务完成！';
            
            alert(`恭喜！关卡${this.gameState.currentLevel}完成！得分: ${this.gameState.score}`);
            
            this.saveProgress();
        } else if (this.checkpoint && !this.checkpoint.reached) {
            const progress = Math.min(100, Math.floor((this.rover.x / this.checkpoint.x) * 100));
            document.getElementById('missionProgress').textContent = `进度: ${progress}%`;
        }
    }
    
    updateCamera() {
        this.camera.x = this.rover.x - this.canvas.width / 2;
        this.camera.y = this.rover.y - this.canvas.height / 2;
        
        this.camera.x = Math.max(0, Math.min(this.camera.x, 4000 - this.canvas.width));
        this.camera.y = Math.max(0, Math.min(this.camera.y, 1000 - this.canvas.height));
    }
    
    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.save();
        this.ctx.translate(-this.camera.x, -this.camera.y);
        
        this.drawBackground();
        this.drawTerrain();
        this.drawObstacles();
        this.drawCollectibles();
        this.drawCheckpoint();
        this.drawRover();
        
        this.ctx.restore();
        
        this.drawHUD();
    }
    
    drawBackground() {
        this.ctx.fillStyle = '#0a0a1a';
        this.ctx.fillRect(0, 0, 4000, this.canvas.height);
        
        this.ctx.fillStyle = 'rgba(79, 195, 247, 0.1)';
        for (let i = 0; i < 100; i++) {
            const x = (i * 73) % 4000;
            const y = (i * 37) % this.canvas.height;
            const size = Math.random() * 3;
            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    drawTerrain() {
        for (const terrain of this.terrain) {
            this.ctx.fillStyle = terrain.type === 'platform' ? '#8B7355' : '#5D4037';
            this.ctx.fillRect(terrain.x, terrain.y, terrain.width, terrain.height);
            
            this.ctx.strokeStyle = '#3E2723';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(terrain.x, terrain.y, terrain.width, terrain.height);
        }
    }
    
    drawObstacles() {
        for (const obstacle of this.obstacles) {
            if (obstacle.type === 'rock') {
                this.ctx.fillStyle = '#795548';
                this.ctx.beginPath();
                this.ctx.ellipse(
                    obstacle.x + obstacle.width/2,
                    obstacle.y + obstacle.height/2,
                    obstacle.width/2,
                    obstacle.height/2,
                    0, 0, Math.PI * 2
                );
                this.ctx.fill();
            } else if (obstacle.type === 'boulder') {
                this.ctx.fillStyle = '#6D4C41';
                this.ctx.beginPath();
                this.ctx.arc(
                    obstacle.x + obstacle.width/2,
                    obstacle.y + obstacle.height/2,
                    obstacle.width/2,
                    0, Math.PI * 2
                );
                this.ctx.fill();
            } else if (obstacle.type === 'spike') {
                this.ctx.fillStyle = '#D32F2F';
                this.ctx.beginPath();
                this.ctx.moveTo(obstacle.x, obstacle.y + obstacle.height);
                this.ctx.lineTo(obstacle.x + obstacle.width/2, obstacle.y);
                this.ctx.lineTo(obstacle.x + obstacle.width, obstacle.y + obstacle.height);
                this.ctx.closePath();
                this.ctx.fill();
            }
        }
    }
    
    drawCollectibles() {
        for (const collectible of this.collectibles) {
            if (!collectible.collected) {
                this.ctx.fillStyle = '#FFD700';
                this.ctx.shadowColor = '#FFD700';
                this.ctx.shadowBlur = 10;
                this.ctx.beginPath();
                this.ctx.arc(collectible.x, collectible.y, collectible.radius, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.shadowBlur = 0;
            }
        }
    }
    
    drawCheckpoint() {
        if (this.checkpoint) {
            this.ctx.fillStyle = this.checkpoint.reached ? '#4CAF50' : '#2196F3';
            this.ctx.fillRect(this.checkpoint.x, this.checkpoint.y, this.checkpoint.width, this.checkpoint.height);
            
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 20px Arial';
            this.ctx.fillText('终点', this.checkpoint.x + 5, this.checkpoint.y + 60);
        }
    }
    
    drawRover() {
        const rover = this.rover;
        const suspensionOffset = Math.sin(Date.now() / 100) * 3;
        
        this.ctx.save();
        this.ctx.translate(rover.x + rover.width/2, rover.y + rover.height/2);
        
        if (!rover.facingRight) {
            this.ctx.scale(-1, 1);
        }
        
        this.drawRoverBody();
        this.drawRoverWheels(suspensionOffset);
        this.drawRoverCabin();
        
        this.ctx.restore();
    }
    
    drawRoverBody() {
        this.ctx.fillStyle = '#2196F3';
        this.ctx.fillRect(-this.rover.width/2, -this.rover.height/2, this.rover.width, this.rover.height);
        
        this.ctx.strokeStyle = '#1976D2';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(-this.rover.width/2, -this.rover.height/2, this.rover.width, this.rover.height);
        
        this.ctx.fillStyle = '#1565C0';
        this.ctx.fillRect(-this.rover.width/2 + 5, -this.rover.height/2 + 5, this.rover.width - 10, 10);
    }
    
    drawRoverWheels(suspensionOffset) {
        const wheelY = this.rover.height/2 + this.rover.wheelRadius - 5;
        
        this.ctx.fillStyle = '#212121';
        
        const leftWheelX = -this.rover.width/3;
        const rightWheelX = this.rover.width/3;
        
        this.drawWheel(leftWheelX, wheelY + suspensionOffset);
        this.drawWheel(rightWheelX, wheelY - suspensionOffset);
        
        this.ctx.fillStyle = '#424242';
        this.ctx.beginPath();
        this.ctx.arc(leftWheelX, wheelY + suspensionOffset, this.rover.wheelRadius * 0.5, 0, Math.PI * 2);
        this.ctx.arc(rightWheelX, wheelY - suspensionOffset, this.rover.wheelRadius * 0.5, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawWheel(x, y) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, this.rover.wheelRadius, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.strokeStyle = '#616161';
        this.ctx.lineWidth = 2;
        
        for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI) / 4 + Date.now() / 100;
            const innerX = x + Math.cos(angle) * this.rover.wheelRadius * 0.7;
            const innerY = y + Math.sin(angle) * this.rover.wheelRadius * 0.7;
            this.ctx.beginPath();
            this.ctx.moveTo(x, y);
            this.ctx.lineTo(innerX, innerY);
            this.ctx.stroke();
        }
    }
    
    drawRoverCabin() {
        this.ctx.fillStyle = '#4FC3F7';
        this.ctx.beginPath();
        this.ctx.moveTo(-this.rover.width/4, -this.rover.height/2);
        this.ctx.lineTo(this.rover.width/4, -this.rover.height/2);
        this.ctx.lineTo(this.rover.width/8, -this.rover.height/2 - 20);
        this.ctx.lineTo(-this.rover.width/8, -this.rover.height/2 - 20);
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.strokeStyle = '#29B6F6';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        this.ctx.fillStyle = '#E3F2FD';
        this.ctx.fillRect(-this.rover.width/8, -this.rover.height/2 - 15, this.rover.width/4, 10);
    }
    
    drawHUD() {
        const speed = Math.abs(this.rover.velocityX).toFixed(1);
        const healthPercent = Math.max(0, this.rover.health);
        const fuelPercent = Math.max(0, this.rover.fuel);
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        this.ctx.fillRect(10, 10, 200, 80);
        
        this.ctx.fillStyle = '#4FC3F7';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.fillText(`速度: ${speed} km/h`, 20, 35);
        this.ctx.fillText(`燃料: ${fuelPercent.toFixed(0)}%`, 20, 60);
        this.ctx.fillText(`健康: ${healthPercent.toFixed(0)}%`, 20, 85);
        
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fillText(`得分: ${this.gameState.score}`, this.canvas.width - 150, 35);
        this.ctx.fillText(`矿晶: ${this.getUserGameData()?.crystals || 1000}`, this.canvas.width - 150, 60);
    }
    
    updateUI() {
        const healthPercent = Math.max(0, this.rover.health);
        const fuelPercent = Math.max(0, this.rover.fuel);
        const speed = Math.abs(this.rover.velocityX);
        const speedPercent = Math.min(100, (speed / this.rover.maxSpeed) * 100);
        
        document.getElementById('healthValue').textContent = `${healthPercent.toFixed(0)}%`;
        document.getElementById('fuelValue').textContent = `${fuelPercent.toFixed(0)}%`;
        document.getElementById('speedValue').textContent = `${speed.toFixed(1)} km/h`;
        
        document.querySelector('.health-bar').style.width = `${healthPercent}%`;
        document.querySelector('.fuel-bar').style.width = `${fuelPercent}%`;
        document.querySelector('.speed-bar').style.width = `${speedPercent}%`;
        
        const user = this.getCurrentUser();
        if (user) {
            document.getElementById('currentUserName').textContent = user.username;
        }
    }
    
    getUserGameData() {
        try {
            const user = this.getCurrentUser();
            if (user) {
                const data = localStorage.getItem(`cosmicRover_gameData_${user.username}`);
                return data ? JSON.parse(data) : null;
            }
        } catch (error) {
            return null;
        }
    }
    
    saveUserGameData(data) {
        try {
            const user = this.getCurrentUser();
            if (user) {
                localStorage.setItem(`cosmicRover_gameData_${user.username}`, JSON.stringify(data));
            }
        } catch (error) {}
    }
    
    getCurrentUser() {
        try {
            const data = localStorage.getItem('cosmicRover_currentUser');
            return data ? JSON.parse(data) : null;
        } catch (error) {
            return null;
        }
    }
    
    saveProgress() {
        const gameData = this.getUserGameData();
        if (gameData) {
            gameData.level = Math.max(gameData.level, this.gameState.currentLevel + 1);
            gameData.score += this.gameState.score;
            this.saveUserGameData(gameData);
        }
    }
    
    // 碰撞检测函数
    circleRectCollision(cx, cy, radius, rect) {
        const closestX = Math.max(rect.x, Math.min(cx, rect.x + rect.width));
        const closestY = Math.max(rect.y, Math.min(cy, rect.y + rect.height));
        const distanceX = cx - closestX;
        const distanceY = cy - closestY;
        return (distanceX * distanceX + distanceY * distanceY) < (radius * radius);
    }
    
    rectRectCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    circleCircleCollision(x1, y1, r1, x2, y2, r2) {
        const dx = x1 - x2;
        const dy = y1 - y2;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < r1 + r2;
    }
}

// 游戏初始化
document.addEventListener('DOMContentLoaded', function() {
    checkLoginStatus();
    
    const game = new RoverGame();
    window.game = game;
    
    document.getElementById('upgradeBtn').addEventListener('click', showUpgrades);
    
    if (window.innerWidth <= 768) {
        document.getElementById('gameHint').style.display = 'flex';
    }
});

function checkLoginStatus() {
    try {
        const userData = localStorage.getItem('cosmicRover_currentUser');
        if (!userData) {
            window.location.href = 'login.html';
        } else {
            const user = JSON.parse(userData);
            document.getElementById('currentUserName').textContent = user.username;
            
            const gameData = localStorage.getItem(`cosmicRover_gameData_${user.username}`);
            if (gameData) {
                const data = JSON.parse(gameData);
                document.getElementById('crystalsCount').textContent = data.crystals || 1000;
            }
        }
    } catch (error) {
        window.location.href = 'login.html';
    }
}

function logout() {
    if (confirm('确定要退出登录吗？')) {
        localStorage.removeItem('cosmicRover_currentUser');
        window.location.href = 'login.html';
    }
}

function loadLevel(level) {
    if (window.game) {
        window.game.loadLevel(level);
    }
}

function showUpgrades() {
    document.getElementById('upgradeModal').style.display = 'flex';
}

function hideModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function buyUpgrade(upgradeType) {
    const gameData = window.game.getUserGameData();
    if (!gameData) return;
    
    const cost = {
        engine: 500,
        suspension: 300,
        fuel: 400
    }[upgradeType];
    
    if (gameData.crystals >= cost) {
        gameData.crystals -= cost;
        
        if (!gameData.rover.upgrades) gameData.rover.upgrades = [];
        gameData.rover.upgrades.push(upgradeType);
        
        switch (upgradeType) {
            case 'engine':
                window.game.rover.maxSpeed *= 1.2;
                break;
            case 'suspension':
                window.game.rover.jumpForce *= 1.15;
                break;
            case 'fuel':
                window.game.rover.fuel = 150;
                break;
        }
        
        window.game.saveUserGameData(gameData);
        document.getElementById('crystalsCount').textContent = gameData.crystals;
        alert('升级成功！');
    } else {
        alert('矿晶不足！');
    }
}

function hideHint() {
    document.getElementById('gameHint').style.display = 'none';
}
