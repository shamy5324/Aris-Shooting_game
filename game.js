const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let player = {
    x: canvas.width / 2 - 15,
    y: canvas.height - 60,
    width: 50,
    height: 60,
    speed: 5,
    firingRate: 400,
    nextFire: 0,
    lasers: 1,
    roundLaserCount: 0,
    greenItems: 0,
    alive: true,
    lives: 3  // 플레이어 목숨 추가
};

let bullets = [];
let enemies = [];
let items = [];
let enemyBullets = [];
let score = 0;
let keys = {};
let bossSpawned = false;
let gameOver = false;
let playerImage = new Image();
playerImage.src = 'img/아리스도트.png';
let enemyImage = new Image();
enemyImage.src = 'img/네루도트.png';
let bossImage = new Image();
bossImage.src = 'img/유우카도트.png';
let laserType = 'thin';
let laserCount = 0;
let totalImages = 3;
let imagesLoaded = 0;
let lastShoot = 0;
let invincible = false;
let invincibleTime = 1500; // 무적 시간 1.5초
let lastHitTime = 0; // 마지막 플레이어 히트 시간 기록
let gameStartTime = Date.now();
let initialSpawnDelay = 0; // 5초
let waypoints = [
    { x: 100, y: 100 },
    { x: canvas.width - 100, y: 100 },
    { x: canvas.width - 100, y: canvas.height - 100 },
    { x: 100, y: canvas.height - 100 }
];
let bossMoveInterval = 2000;  // 2초마다 방향 변경
let lastBossMoveChange = Date.now();

document.addEventListener('keydown', function(event) {
    keys[event.keyCode] = true;
});

document.addEventListener('keyup', function(event) {
    keys[event.keyCode] = false;
});

function handlePlayerMovement() {
    if (keys[37] && player.x > 0) player.x -= player.speed; // Left
    if (keys[39] && player.x < canvas.width - 20) player.x += player.speed; // Right
    if (keys[38] && player.y > 0) player.y -= player.speed; // Up
    if (keys[40] && player.y < canvas.height - 20) player.y += player.speed; // Down
    if (keys[90] && Date.now() > player.nextFire) {
        fireLaser();
        lastShoot = Date.now();
    }
}

function fireLaser() {
    for (let i = 0; i < player.lasers; i++) {
        let offset = i - Math.floor(player.lasers / 2);
        
        if (laserType === 'round' && player.roundLaserCount < 50) {
            const dxValue = (Math.random() * 2 - 1) * 5;  // -5에서 5 사이의 임의의 값
    		bullets.push({
    		    x: player.x + player.width / 2 + offset * 15, 
    		    y: player.y, 
    		    dx: dxValue,
    		    dy: Math.sqrt(25 - dxValue * dxValue) * -1,  // 이로 인해 총 속도의 제곱은 25가 됩니다.
    		    speed: 5, 
        		width: 10, 
        		height: 10, 
        		type: 'round',
				lastX: player.x,
				stagnantTime: 0
    		});
    		player.roundLaserCount++;
        } else if (laserType === 'round' && player.roundLaserCount >= 50) { // 레이저가 50번 발사된 후에는 기본 레이저로 변경
            laserType = 'thin';
            player.roundLaserCount = 0;
        } else {
            bullets.push({ x: player.x + player.width / 2 + offset * 15, y: player.y, speed: -5, width: 5, height: 10, type: 'thin' });
        }
    }
    
    player.nextFire = Date.now() + player.firingRate;
}

function spawnEnemy() {
    const enemy = {
        x: Math.random() * (canvas.width - 20),
        y: 0,
        speed: 2,
        width: 50,
        height: 60,
        dir: Math.random() < 0.5 ? -1 : 1,
        lastShot: 0,
        isSpecial: score >= 10 && Math.random() < 0.2,
        isBoss: false
    };

    if (score !== 0 && score % 30 === 0 && !bossSpawned) {
        enemy.isBoss = true;
        enemy.health = 25;
        enemy.speed = 1.5;
        bossSpawned = true;
    }

    if (enemy.isSpecial) {
        enemy.speed = 1.8;
    }

    enemies.push(enemy);
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = "20px Arial";
    ctx.fillStyle = "white";
    ctx.textAlign = "left";
    ctx.fillText("Lives: " + '♥'.repeat(player.lives), 10, canvas.height - 10); // 목숨 표시
    ctx.textAlign = "right";
    ctx.fillText("Score: " + score, canvas.width - 10, 30);

    if (!player.alive) {
        alert("Game Over! Your score: " + score);
        document.location.reload();
        return;
    }

    if (invincible) {
        if (Date.now() > lastHitTime + invincibleTime) {
            invincible = false; // 무적 시간이 지나면 무적 해제
        }
    }

    handlePlayerMovement();

    // Player
    if (player.alive) {
        if (invincible) {
            ctx.globalAlpha = 0.5; // 무적 시간 동안 투명도 조절
        } else {
            ctx.globalAlpha = 1.0;
        }
        ctx.drawImage(playerImage, player.x - 15, player.y - 25, player.width, player.height);
        ctx.globalAlpha = 1.0; // 원래 투명도로 복원
    }

    // Bullets
    bullets.forEach((bullet, index) => {
		if (bullet.type === 'round') {
        	bullet.x += bullet.dx;
        	bullet.y += bullet.dy;

        // y축의 변화가 없는지 확인
        	if (bullet.x === bullet.lastX) {
        	    bullet.stagnantTime += 1;
        	} else {
        	    bullet.stagnantTime = 0;
        	}
        	bullet.lastX = bullet.x;

        // stagnantTime이 일정 값 이상이면 대각선 방향으로 튀어올라오게 변경
        	if (bullet.stagnantTime >= 60) {  // 예: 60 프레임 동안 변화 없을 시
            	bullet.dx = 5 * (Math.random() > 0.5 ? 1 : -1);
            	bullet.dy = -5;
            	bullet.stagnantTime = 0;
        	}
			
    		if (bullet.type === 'round') {
        		bullet.x += bullet.dx;
        		bullet.y += bullet.dy;

        // 상단 및 하단 벽에 부딪히면 반사
        		if (bullet.y - bullet.height/2 <= 0) {
        		    bullet.y = bullet.height/2;
        		    bullet.dy *= -1;
        		}
        		if (bullet.y + bullet.height/2 >= canvas.height) {
        		    bullet.y = canvas.height - bullet.height/2;
        		    bullet.dy *= -1;
        		}
        
        // 좌우 벽에 부딪히면 반사
        		if (bullet.x - bullet.width/2 <= 0) {
        	    	bullet.x = bullet.width/2;
        	    	bullet.dx *= -1;
        		}
        		if (bullet.x + bullet.width/2 >= canvas.width) {
        		    bullet.x = canvas.width - bullet.width/2;
        	    	bullet.dx *= -1;
        		}
			}
		}
		
		if (bullet.y < 0 || bullet.y > canvas.height) bullets.splice(index, 1); // 레이저가 화면 밖으로 나가면 삭제
			
        bullet.y += bullet.speed;
    	if (bullet.type === 'round') {
    	    ctx.fillStyle = '#27f0cc';
    	    ctx.beginPath();
    	    ctx.arc(bullet.x, bullet.y, bullet.width / 2, 0, Math.PI * 2);
    	    ctx.fill();
    	} else {
    	    ctx.fillStyle = '#27f0cc';
    	    ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    	}

    	if (bullet.y < 0) bullets.splice(index, 1);
	});

    // Enemies
    if (Date.now() > gameStartTime + initialSpawnDelay) {
        if (Math.random() < 0.03 || (score !== 0 && score % 30 === 0 && !bossSpawned)) {
            spawnEnemy();
        }
    }

    enemies.forEach((enemy, index) => {
        if (enemy.isBoss) {
            ctx.drawImage(bossImage, enemy.x - 15, enemy.y - 25, enemy.width, enemy.height);

            if (Date.now() > lastBossMoveChange + bossMoveInterval) {
                enemy.dir = Math.random() < 0.5 ? -1 : 1;
                enemy.speed = (Math.random() * 3 - 1.5);
                lastBossMoveChange = Date.now();
            }

            enemy.x += enemy.speed;
            enemy.y += enemy.speed;

            if (enemy.x <= 0) {
                enemy.x = 0;
                enemy.dir = 1;
            }
            if (enemy.x >= canvas.width - enemy.width) {
                enemy.x = canvas.width - enemy.width;
                enemy.dir = -1;
            }
            if (enemy.y <= 0) {
                enemy.y = 0;
                enemy.speed = 1.5;
            }
            if (enemy.y >= canvas.height - enemy.height) {
                enemy.y = canvas.height - enemy.height;
                enemy.speed = -1.5;
            }

            if (Date.now() > enemy.lastShot + 3000) {
                for (let i = 0; i < 360; i += 15) {
                    enemyBullets.push({
                        x: enemy.x + 12.5,
                        y: enemy.y + 12.5,
                        speed: 3,
                        angle: i
                    });
                }
                enemy.lastShot = Date.now();
            }
        } else if (enemy.isSpecial) {
            ctx.drawImage(enemyImage, enemy.x - 15, enemy.y - 25, enemy.width, enemy.height);
            enemy.x += enemy.speed * enemy.dir;

            if (enemy.x <= 0 || enemy.x >= canvas.width - 20) enemy.dir *= -1;

            if (Date.now() > enemy.lastShot + 20000) {
                enemyBullets.push({ x: enemy.x + 10, y: enemy.y + 10, speed: 4, angle: 90, color: '#eb816b' });
                enemy.lastShot = Date.now();
            }
        } else {
            ctx.drawImage(enemyImage, enemy.x - 15, enemy.y - 25, enemy.width, enemy.height);
            enemy.x += enemy.speed * enemy.dir;

            if (enemy.x <= 0 || enemy.x >= canvas.width - 20) enemy.dir *= -1;
        }

        enemy.y += enemy.speed;

        if (enemy.y > canvas.height) enemies.splice(index, 1);

        // Bullet collision
        bullets.forEach((bullet, bIndex) => {
            if (collide(bullet, enemy)) {
                bullets.splice(bIndex, 1);

                if (enemy.isBoss) {
                    enemy.health--;
                    if (enemy.health === 0) {
                        enemies.splice(index, 1);
                        score += 5;
                        bossSpawned = false;
                        player.lives += 1;  // 목숨을 증가
                    }
                } else {
                    enemies.splice(index, 1);
                    score++;

                    // Item spawn
                    if (Math.random() < 0.01) items.push({ x: enemy.x, y: enemy.y, type: '#ff79c7', speed: 2 });
                    if (Math.random() < 0.01) items.push({ x: enemy.x, y: enemy.y, type: '#54df63', speed: 2 });
                    if (Math.random() < 0.01) items.push({ x: enemy.x, y: enemy.y, type: '#a23843', speed: 2 });
                }
            }
        });

        // Player collision
        if (collide(player, enemy) && !invincible) {
            player.lives -= 1;
            invincible = true;
            lastHitTime = Date.now(); // 마지막 충돌 시간 기록

            if (player.lives <= 0) {
                player.alive = false;
                alert("Game Over! Your score: " + score);
                document.location.reload();
            } else {
                // 적을 제거하지 않도록 수정
                // 목숨이 남아 있을 경우 게임 계속
            }
        }
    });

    // Items
    items.forEach((item, index) => {
        ctx.fillStyle = item.type;
        ctx.beginPath();
        ctx.arc(item.x, item.y, 7, 0, Math.PI * 2);
        ctx.fill();

        item.y += item.speed;

        if (item.y > canvas.height) items.splice(index, 1);

        if (collide(item, player)) {
            items.splice(index, 1);

            if (item.type === '#ff79c7' && player.lasers < 5) player.lasers++;
            if (item.type === '#54df63' && player.greenItems < 10) {
                player.firingRate -= 50;
                player.greenItems += 1;
            }
            if (item.type === '#a23843') {
                laserType = 'round';
                player.roundLaserCount = 0;  // 아이템을 먹을 때마다 레이저 발사 횟수 초기화
            }
        }
    });

    // Enemy bullets
    enemyBullets.forEach((bullet, index) => {
        bullet.x += bullet.speed * Math.cos(bullet.angle * Math.PI / 180);
        bullet.y += bullet.speed * Math.sin(bullet.angle * Math.PI / 180);

        ctx.fillStyle = bullet.color || '#2677ce';
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, 8, 0, Math.PI * 2);  // Increased bullet size for correct hit detection
        ctx.fill();

        if (collide(player, bullet) && !invincible) {
            player.lives -= 1;
            invincible = true;
            lastHitTime = Date.now(); // 마지막 충돌 시간 기록

            if (player.lives <= 0) {
                player.alive = false;
                gameOver = true; // Set the game over status to true.
                alert("Game Over! Your score: " + score);
                document.location.reload();
            } else {
                enemyBullets.splice(index, 1); // 충돌한 투사체 제거
            }
        }

        if (bullet.y > canvas.height || bullet.y < 0 || bullet.x < 0 || bullet.x > canvas.width) enemyBullets.splice(index, 1);
    });

    if (!gameOver) {
        requestAnimationFrame(gameLoop);
    }
}

function collide(obj1, obj2) {
    if (obj2.color && obj2.color === 'red') {
        return Math.sqrt((obj1.x - obj2.x) ** 2 + (obj1.y - obj2.y) ** 2) < 10;  // Circular hit detection for red bullets
    } else {
        return obj1.x < obj2.x + 20 && obj1.x + 20 > obj2.x && obj1.y < obj2.y + 20 && obj1.y + 20 > obj2.y;  // Rectangular hit detection for other objects
    }
}

function circleSquareCollision(circle, square) {
    let testX = circle.x;
    let testY = circle.y;

    if (circle.x < square.x) testX = square.x;
    else if (circle.x > square.x + 20) testX = square.x + 20;

    if (circle.y < square.y) testY = square.y;
    else if (circle.y > square.y + 20) testY = square.y + 20;

    const distance = Math.sqrt((circle.x - testX) ** 2 + (circle.y - testY) ** 2);

    return distance <= 8; // Considering the radius of the bullet to be 8.
}

playerImage.onload = checkAllImagesLoaded;
enemyImage.onload = checkAllImagesLoaded;
bossImage.onload = checkAllImagesLoaded;

function checkAllImagesLoaded() {
    imagesLoaded++;
    if (imagesLoaded === totalImages) {
        gameLoop(); // 모든 이미지가 로드된 후 게임 루프 시작
    }
}
