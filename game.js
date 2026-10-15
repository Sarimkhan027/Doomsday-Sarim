(() => {
  const modal = document.getElementById('login-modal');
  const gamePanel = document.getElementById('game-panel');
  const usernameInput = document.getElementById('username');
  const canvas = document.getElementById('arena');
  const context = canvas.getContext('2d');
  const keys = new Set();
  const weaponSelect = document.getElementById('weapon-select');
  const driveButton = document.getElementById('drive-button');
  const weapons = {
    awm: {
      name: 'AWM sniper',
      damage: 78,
      rate: 0.82,
      speed: 720,
      pellets: 1,
      spread: 0,
      color: 'accent'
    },
    ump: {
      name: 'UMP',
      damage: 22,
      rate: 0.12,
      speed: 520,
      pellets: 1,
      spread: 0.045,
      color: 'success'
    },
    shotgun: {
      name: 'Shotgun',
      damage: 15,
      rate: 0.62,
      speed: 430,
      pellets: 6,
      spread: 0.25,
      color: 'accent'
    },
    desert: {
      name: 'Desert Eagle',
      damage: 42,
      rate: 0.38,
      speed: 600,
      pellets: 1,
      spread: 0.025,
      color: 'primary'
    },
    machine: {
      name: 'Machine gun',
      damage: 14,
      rate: 0.075,
      speed: 540,
      pellets: 1,
      spread: 0.09,
      color: 'danger'
    }
  };
  let provider = '';
  let playerName = 'Player';
  let player;
  let allies = [];
  let enemies = [];
  let bullets = [];
  let enemyBullets = [];
  let score = 0;
  let gameOver = false;
  let running = false;
  let lastFrame = 0;
  let spawnTimer = 0;
  let elapsed = 0;
  let inCar = false;
  let pointer = {
    x: 0,
    y: 0,
    active: false
  };
  let animationFrame;
  let car;
  const mapDetails = [{
      x: 0.16,
      y: 0.19,
      w: 0.12,
      h: 0.1
    },
    {
      x: 0.73,
      y: 0.2,
      w: 0.15,
      h: 0.1
    },
    {
      x: 0.15,
      y: 0.69,
      w: 0.13,
      h: 0.13
    },
    {
      x: 0.72,
      y: 0.68,
      w: 0.15,
      h: 0.12
    },
    {
      x: 0.42,
      y: 0.13,
      w: 0.1,
      h: 0.07
    },
    {
      x: 0.39,
      y: 0.79,
      w: 0.12,
      h: 0.08
    }
  ];

  function openLogin() {
    modal.hidden = false;
    usernameInput.focus();
  }

  function closeLogin() {
    modal.hidden = true;
  }

  document.querySelectorAll('[data-open-login]').forEach((button) => button.addEventListener('click', openLogin));
  document.querySelectorAll('[data-close-login]').forEach((button) => button.addEventListener('click', closeLogin));
  modal.addEventListener('click', (event) => {
    if (event.target === modal) closeLogin();
  });

  document.querySelectorAll('[data-provider]').forEach((button) => {
    button.addEventListener('click', () => {
      provider = button.dataset.provider;
      document.querySelectorAll('[data-provider]').forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
      document.getElementById('provider-note').textContent = `${provider} selected for this demo. No external account is contacted; choose a callsign below to continue.`;
      usernameInput.focus();
    });
  });

  document.getElementById('username-form').addEventListener('submit', (event) => {
    event.preventDefault();
    playerName = usernameInput.value.trim().slice(0, 18) || 'Player';
    document.getElementById('player-label').textContent = playerName;
    closeLogin();
    gamePanel.hidden = false;
    document.body.style.overflow = 'hidden';
    startGame();
  });

  document.getElementById('exit-game').addEventListener('click', () => {
    gamePanel.hidden = true;
    document.body.style.overflow = '';
    running = false;
    cancelAnimationFrame(animationFrame);
  });

  document.getElementById('restart-game').addEventListener('click', startGame);
  driveButton.addEventListener('click', () => {
    if (!player || gameOver) return;
    inCar = !inCar;
    driveButton.textContent = inCar ? 'Exit vehicle' : 'Enter nearby car';
    document.getElementById('game-message').textContent = inCar ?
      'Vehicle engaged · WASD / arrows to drive · Space or hold mouse to fire' :
      'On foot · WASD / arrows to move · Mouse or space to fire';
  });

  document.querySelectorAll('[data-share]').forEach((button) => {
    button.addEventListener('click', async () => {
      const shareData = {
        title: 'Doomsday',
        text: 'Squad up and try the Doomsday browser arena demo.',
        url: window.location.href
      };
      try {
        if (navigator.share) {
          await navigator.share(shareData);
        } else if (navigator.clipboard) {
          await navigator.clipboard.writeText(window.location.href);
          button.textContent = 'Link copied!';
          setTimeout(() => {
            button.textContent = 'Share game';
          }, 1800);
        } else {
          window.prompt('Copy this page link to share the game:', window.location.href);
        }
      } catch (error) {
        if (error.name !== 'AbortError') window.prompt('Copy this page link to share the game:', window.location.href);
      }
    });
  });

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.round(rect.width * ratio);
    canvas.height = Math.round(rect.height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    if (player) {
      player.x = Math.min(player.x, rect.width - player.radius);
      player.y = Math.min(player.y, rect.height - player.radius);
      if (car) {
        car.x = Math.min(car.x, rect.width - 30);
        car.y = Math.min(car.y, rect.height - 20);
      }
    }
  }

  function startGame() {
    cancelAnimationFrame(animationFrame);
    resizeCanvas();
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    player = {
      x: width / 2,
      y: height / 2,
      radius: 12,
      speed: 205,
      health: 100,
      cooldown: 0,
      angle: -Math.PI / 2
    };
    allies = [{
        x: width / 2 - 45,
        y: height / 2 + 35,
        radius: 10,
        angle: 0,
        cooldown: 0,
        color: 'accent',
        follow: 0
      },
      {
        x: width / 2 + 45,
        y: height / 2 + 35,
        radius: 10,
        angle: 0,
        cooldown: 0,
        color: 'success',
        follow: 1
      },
      {
        x: width / 2,
        y: height / 2 + 62,
        radius: 10,
        angle: 0,
        cooldown: 0,
        color: 'muted',
        follow: 2
      }
    ];
    car = {
      x: width * 0.58,
      y: height * 0.55,
      angle: -0.3
    };
    enemies = [];
    bullets = [];
    enemyBullets = [];
    score = 0;
    elapsed = 0;
    gameOver = false;
    running = true;
    inCar = false;
    spawnTimer = 0.5;
    lastFrame = performance.now();
    driveButton.textContent = 'Enter nearby car';
    document.getElementById('game-message').textContent = 'WASD / arrows to move · Mouse or space to fire · Choose a weapon';
    updateHud();
    animationFrame = requestAnimationFrame(frame);
  }

  function color(variable) {
    return getComputedStyle(document.documentElement).getPropertyValue(`--color-${variable}`).trim();
  }

  function safeRadius() {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const progress = Math.min(1, elapsed / 90);
    return Math.min(width, height) * (0.43 - progress * 0.3);
  }

  function randomEnemy() {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const side = Math.floor(Math.random() * 4);
    let x = Math.random() * width;
    let y = Math.random() * height;
    if (side === 0) y = -24;
    if (side === 1) x = width + 24;
    if (side === 2) y = height + 24;
    if (side === 3) x = -24;
    enemies.push({
      x,
      y,
      radius: 11,
      health: 100,
      speed: 38 + Math.random() * 22,
      shot: 0.8 + Math.random() * 1.8,
      cooldown: 0,
      angle: 0
    });
  }

  function nearestEnemy(from) {
    return enemies.reduce((nearest, enemy) => {
      const distance = Math.hypot(enemy.x - from.x, enemy.y - from.y);
      return !nearest || distance < nearest.distance ? {
        enemy,
        distance
      } : nearest;
    }, null);
  }

  function shoot(from, target, list, speed, friendly, weapon = null) {
    if (!target) return;
    const config = weapon || {
      damage: 12,
      rate: 0.9,
      pellets: 1,
      spread: 0,
      color: 'danger'
    };
    const baseAngle = Math.atan2(target.y - from.y, target.x - from.x);
    for (let pellet = 0; pellet < config.pellets; pellet += 1) {
      const angle = baseAngle + (Math.random() - 0.5) * config.spread;
      list.push({
        x: from.x + Math.cos(angle) * 14,
        y: from.y + Math.sin(angle) * 14,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: friendly ? 3 : 4,
        life: 1.8,
        damage: config.damage,
        friendly,
        headshot: config.name === 'AWM sniper'
      });
    }
    from.angle = baseAngle;
  }

  function firePlayer(target) {
    if (!target || player.cooldown > 0) return;
    const weapon = weapons[weaponSelect.value] || weapons.awm;
    shoot(player, target, bullets, weapon.speed, true, weapon);
    player.cooldown = weapon.rate;
  }

  function update(delta) {
    if (gameOver) return;
    elapsed += delta;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    let dx = 0;
    let dy = 0;
    if (keys.has('w') || keys.has('arrowup') || keys.has('up')) dy -= 1;
    if (keys.has('s') || keys.has('arrowdown') || keys.has('down')) dy += 1;
    if (keys.has('a') || keys.has('arrowleft') || keys.has('left')) dx -= 1;
    if (keys.has('d') || keys.has('arrowright') || keys.has('right')) dx += 1;
    const magnitude = Math.hypot(dx, dy) || 1;
    const movementSpeed = inCar ? 360 : player.speed;
    player.x = Math.max(player.radius, Math.min(width - player.radius, player.x + (dx / magnitude) * movementSpeed * delta));
    player.y = Math.max(player.radius, Math.min(height - player.radius, player.y + (dy / magnitude) * movementSpeed * delta));
    if (inCar && (dx || dy)) car.angle = Math.atan2(dy, dx);
    if (inCar) {
      car.x += (player.x - car.x) * Math.min(1, delta * 9);
      car.y += (player.y - car.y) * Math.min(1, delta * 9);
    }

    const target = nearestEnemy(player);
    if (pointer.active) player.angle = Math.atan2(pointer.y - player.y, pointer.x - player.x);
    else if (target) player.angle = Math.atan2(target.enemy.y - player.y, target.enemy.x - player.x);
    player.cooldown -= delta;
    if (keys.has(' ') && target) firePlayer(target.enemy);
    if (pointer.active) firePlayer({
      x: pointer.x,
      y: pointer.y
    });

    allies.forEach((ally, index) => {
      const angle = performance.now() / 1000 * 0.55 + index * 2.1;
      const wantedX = player.x + Math.cos(angle) * (38 + index * 7);
      const wantedY = player.y + Math.sin(angle) * (38 + index * 7);
      ally.x += (wantedX - ally.x) * Math.min(1, delta * 2.2);
      ally.y += (wantedY - ally.y) * Math.min(1, delta * 2.2);
      const allyTarget = nearestEnemy(ally);
      ally.cooldown -= delta;
      if (allyTarget && ally.cooldown <= 0) {
        shoot(ally, allyTarget.enemy, bullets, 350, true, {
          name: 'Squad rifle',
          damage: 16,
          pellets: 1,
          spread: 0.03
        });
        ally.cooldown = 0.68 + index * 0.12;
      }
    });

    spawnTimer -= delta;
    if (spawnTimer <= 0 && enemies.length < 12) {
      randomEnemy();
      spawnTimer = Math.max(0.65, 1.5 - score * 0.02);
    }

    const zone = safeRadius();
    enemies.forEach((enemy) => {
      const dxToPlayer = player.x - enemy.x;
      const dyToPlayer = player.y - enemy.y;
      const distance = Math.hypot(dxToPlayer, dyToPlayer) || 1;
      enemy.angle = Math.atan2(dyToPlayer, dxToPlayer);
      enemy.x += (dxToPlayer / distance) * enemy.speed * delta;
      enemy.y += (dyToPlayer / distance) * enemy.speed * delta;
      enemy.shot -= delta;
      if (enemy.shot <= 0 && distance < 330) {
        shoot(enemy, player, enemyBullets, 180, false);
        enemy.shot = 1.6 + Math.random();
      }
      if (distance < enemy.radius + player.radius + (inCar ? 7 : 0)) enemy.health = 0;
      if (Math.hypot(enemy.x - width / 2, enemy.y - height / 2) > zone) enemy.health -= 8 * delta;
    });

    bullets.forEach((bullet) => {
      bullet.x += bullet.vx * delta;
      bullet.y += bullet.vy * delta;
      bullet.life -= delta;
      const hitIndex = bullet.life > 0 ? enemies.findIndex((enemy) => {
        const headX = enemy.x + Math.cos(enemy.angle) * 5;
        const headY = enemy.y + Math.sin(enemy.angle) * 5;
        const headHit = Math.hypot(headX - bullet.x, headY - bullet.y) < 8 + bullet.radius;
        const bodyHit = Math.hypot(enemy.x - bullet.x, enemy.y - bullet.y) < enemy.radius + bullet.radius + 4;
        if (!headHit && !bodyHit) return false;
        enemy.health -= bullet.damage * (headHit ? 1.7 : 1);
        bullet.life = 0;
        if (headHit) document.getElementById('game-message').textContent = 'HEADSHOT! Keep moving and watch the zone.';
        return enemy.health <= 0;
      }) : -1;
      if (hitIndex !== -1) {
        enemies.splice(hitIndex, 1);
        score += 1;
      }
    });

    enemyBullets.forEach((bullet) => {
      bullet.x += bullet.vx * delta;
      bullet.y += bullet.vy * delta;
      bullet.life -= delta;
      if (Math.hypot(player.x - bullet.x, player.y - bullet.y) < player.radius + bullet.radius + (inCar ? 7 : 0)) {
        player.health -= inCar ? 3 : 10;
        bullet.life = 0;
      }
    });
    bullets = bullets.filter((bullet) => bullet.life > 0 && bullet.x > -20 && bullet.x < width + 20 && bullet.y > -20 && bullet.y < height + 20);
    enemyBullets = enemyBullets.filter((bullet) => bullet.life > 0);

    if (Math.hypot(player.x - width / 2, player.y - height / 2) > zone) player.health -= 9 * delta;
    player.health = Math.max(0, player.health);
    if (player.health <= 0) {
      gameOver = true;
      document.getElementById('game-message').textContent = `Run over, ${playerName}. ${score} opponents eliminated. Restart to deploy again.`;
    }
    updateHud();
  }

  function drawHuman(unit, fill, angle, isPlayer = false) {
    context.save();
    context.translate(unit.x, unit.y);
    context.rotate(angle || 0);
    context.fillStyle = fill;
    context.beginPath();
    context.ellipse(0, 3, unit.radius * 0.78, unit.radius * 0.95, 0, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = color('text');
    context.beginPath();
    context.arc(5, -unit.radius * 0.72, unit.radius * 0.43, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = fill;
    context.fillRect(4, -2, unit.radius + 12, 4);
    if (isPlayer) {
      context.strokeStyle = color('text');
      context.lineWidth = 2;
      context.beginPath();
      context.arc(0, 0, unit.radius + 5, 0, Math.PI * 2);
      context.stroke();
    }
    context.restore();
  }

  function drawCar() {
    context.save();
    context.translate(car.x, car.y);
    context.rotate(car.angle);
    context.fillStyle = color('accent');
    context.beginPath();
    context.roundRect(-25, -13, 50, 26, 6);
    context.fill();
    context.fillStyle = color('surface');
    context.fillRect(-8, -10, 17, 20);
    context.fillStyle = color('text');
    context.fillRect(-19, -15, 10, 4);
    context.fillRect(10, -15, 10, 4);
    context.fillRect(-19, 11, 10, 4);
    context.fillRect(10, 11, 10, 4);
    context.restore();
  }

  function render() {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    context.clearRect(0, 0, width, height);
    context.fillStyle = color('bg-alt');
    context.fillRect(0, 0, width, height);
    context.strokeStyle = color('grid-line');
    context.lineWidth = 1;
    for (let x = 0; x < width; x += 40) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, height);
      context.stroke();
    }
    for (let y = 0; y < height; y += 40) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(width, y);
      context.stroke();
    }
    context.fillStyle = color('surface');
    mapDetails.forEach((building) => {
      context.globalAlpha = 0.82;
      context.fillRect(building.x * width, building.y * height, building.w * width, building.h * height);
      context.globalAlpha = 1;
      context.strokeStyle = color('border');
      context.strokeRect(building.x * width, building.y * height, building.w * width, building.h * height);
    });
    context.strokeStyle = color('accent');
    context.globalAlpha = 0.82;
    context.lineWidth = 3;
    context.beginPath();
    context.arc(width / 2, height / 2, safeRadius(), 0, Math.PI * 2);
    context.stroke();
    context.globalAlpha = 1;
    context.fillStyle = color('danger');
    context.globalAlpha = 0.12;
    context.fillRect(0, 0, width, height);
    context.globalCompositeOperation = 'destination-out';
    context.beginPath();
    context.arc(width / 2, height / 2, safeRadius(), 0, Math.PI * 2);
    context.fill();
    context.globalCompositeOperation = 'source-over';
    context.globalAlpha = 1;
    drawCar();
    allies.forEach((ally) => drawHuman(ally, color(ally.color), ally.angle));
    enemies.forEach((enemy) => drawHuman(enemy, color('danger'), enemy.angle));
    bullets.forEach((bullet) => {
      context.fillStyle = color(bullet.headshot ? 'accent' : 'success');
      context.beginPath();
      context.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
      context.fill();
    });
    enemyBullets.forEach((bullet) => {
      context.fillStyle = color('danger');
      context.beginPath();
      context.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
      context.fill();
    });
    drawHuman(player, inCar ? color('accent') : color('primary'), player.angle, true);
  }

  function updateHud() {
    document.getElementById('health-value').textContent = `${Math.ceil(player.health)}%`;
    document.getElementById('health-bar').style.width = `${player.health}%`;
    document.getElementById('health-bar').style.backgroundColor = player.health < 35 ? color('danger') : color('success');
    document.getElementById('score-value').textContent = score;
    const remaining = Math.max(0, 90 - Math.floor(elapsed));
    document.getElementById('zone-value').textContent = `${String(Math.floor(remaining / 60)).padStart(2, '0')}:${String(remaining % 60).padStart(2, '0')}`;
  }

  function frame(timestamp) {
    if (!running) return;
    const delta = Math.min((timestamp - lastFrame) / 1000, 0.04);
    lastFrame = timestamp;
    update(delta);
    render();
    animationFrame = requestAnimationFrame(frame);
  }

  window.addEventListener('resize', resizeCanvas);
  window.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) event.preventDefault();
    keys.add(key);
  });
  window.addEventListener('keyup', (event) => keys.delete(event.key.toLowerCase()));
  canvas.addEventListener('pointermove', (event) => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
  });
  canvas.addEventListener('pointerdown', (event) => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
    pointer.active = true;
  });
  window.addEventListener('pointerup', () => {
    pointer.active = false;
  });
  document.querySelectorAll('[data-move]').forEach((button) => {
    const direction = button.dataset.move;
    const press = (event) => {
        event.preventDefault ();
        keys.add(direction);
        if (direction === 'fire') keys.delete('');
    };
    const release = (event) => {
        event.preventDefault();
        keys.delete(direction);
        if (direction === 'fire') keys.delete('');
    };
    button.addEventListener('pointerdown', press);
    button.addEventListener('pointerup', release);
    button.addEventListener('pointerleave', release);
    button.addEventListener('pointercancel', release);
  });
})();