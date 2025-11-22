import React, { useEffect, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CelestialJump() {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const gameStateRef = useRef(null);
  const isGameOverRef = useRef(false);

  // 现在只用：BGM + 踩怪物 + game over 音效
  const soundsRef = useRef({
    bgm: null,
    jumpOnMonster: [],
    gameOver: null
  });

  const lastMonsterSoundRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 1.8);

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // ========= 音效相关 =========
    const createAudioPool = (path, volume = 1, poolSize = 3) => {
      const pool = Array.from({ length: poolSize }, () => {
        const audio = new Audio(path);
        audio.volume = volume;
        audio.preload = 'auto';
        return audio;
      });

      let index = 0;

      const play = () => {
        const audio = pool[index];
        index = (index + 1) % pool.length;
        try {
          audio.currentTime = 0;
          audio.play().catch(() => {});
        } catch {
          // 忽略错误，防止卡顿
        }
      };

      return { pool, play };
    };

    // BGM
    const BGM_VOLUME = 0.45;
    let bgmFadeIntervalId = null;
    const bgmAudio = new Audio('/sounds/backgroundmusic_iceice.mp3');
    bgmAudio.loop = true;
    bgmAudio.volume = BGM_VOLUME;
    bgmAudio.preload = 'auto';

    const startBgm = () => {
      if (!bgmAudio) return;
      if (bgmFadeIntervalId) {
        clearInterval(bgmFadeIntervalId);
        bgmFadeIntervalId = null;
      }
      bgmAudio.volume = BGM_VOLUME;
      bgmAudio.play().catch(() => {});
    };

    const fadeOutBgm = () => {
      if (!bgmAudio) return;
      if (bgmFadeIntervalId) clearInterval(bgmFadeIntervalId);

      const duration = 500; // 0.5s
      const steps = 20;
      const stepTime = duration / steps;
      let currentStep = 0;
      const startVolume = bgmAudio.volume;

      bgmFadeIntervalId = window.setInterval(() => {
        currentStep += 1;
        const progress = currentStep / steps;
        const newVolume = startVolume * (1 - progress);

        if (newVolume <= 0) {
          bgmAudio.volume = 0;
          bgmAudio.pause();
          bgmAudio.currentTime = 0;
          clearInterval(bgmFadeIntervalId);
          bgmFadeIntervalId = null;
          bgmAudio.volume = BGM_VOLUME; // 为下次游戏重置音量
        } else {
          bgmAudio.volume = newVolume;
        }
      }, stepTime);
    };

    // 尝试自动开始 BGM（可能会被浏览器拦截），后面在按键 / 触摸时再补一刀
    bgmAudio.play().catch(() => {});
    soundsRef.current.bgm = bgmAudio;

    // 踩怪物音效（带权重：808 50%，其他平均 50%）
    const monsterPools = [
      { pool: createAudioPool('/sounds/jump_on_monsters_sound_808.mp3', 0.55, 3), weight: 0.5 },
      { pool: createAudioPool('/sounds/jump_on_monsters_sound_CHH.mp3', 0.4, 2), weight: 0.125 },
      { pool: createAudioPool('/sounds/jump_on_monsters_sound_OHH.mp3', 0.4, 2), weight: 0.125 },
      { pool: createAudioPool('/sounds/jump_on_monsters_sound_laser.mp3', 0.4, 2), weight: 0.125 },
      { pool: createAudioPool('/sounds/jump_on_monsters_sound_snare.mp3', 0.4, 2), weight: 0.125 },
    ];

    const gameOverPool = createAudioPool('/sounds/game_over_sound_kyu.mp3', 0.5, 2);

    soundsRef.current.jumpOnMonster = monsterPools;
    soundsRef.current.gameOver = gameOverPool;

    const now = () => performance.now();

    const playWeightedMonsterSound = () => {
      if (!monsterPools.length) return;

      const t = now();
      if (t - lastMonsterSoundRef.current < 80) return; // 80ms 冷却
      lastMonsterSoundRef.current = t;

      const r = Math.random();
      let acc = 0;
      for (const { pool, weight } of monsterPools) {
        acc += weight;
        if (r <= acc) {
          pool.play();
          return;
        }
      }
      monsterPools[0].pool.play();
    };

    const playGameOverSound = () => {
      gameOverPool.play();
    };

    // ========= 游戏常量 =========
    const GRAVITY = 0.2;
    const JUMP_FORCE = -10.5;
    const PLAYER_SIZE = 30;
    const PLATFORM_WIDTH = 80;
    const PLATFORM_HEIGHT = 12;
    const FINAL_SCORE = 50000;

    const player = {
      x: canvas.width / (2 * dpr) - PLAYER_SIZE / 2,
      y: (canvas.height / dpr) * 0.7,
      width: PLAYER_SIZE,
      height: PLAYER_SIZE,
      velocityY: 0,
      velocityX: 0,
      rotation: 0
    };

    const platforms = [];
    const icePlatforms = new Set();
    let cameraY = 0;
    let finalPlateauReached = false;

    const MIN_HORIZONTAL_GAP = 12;
    const MIN_VERTICAL_GAP = 35;
    const SPAWN_BUFFER_Y = -200;

    const isTooCloseToExistingPlatforms = (x, y) => {
      for (const p of platforms) {
        const leftA = x - MIN_HORIZONTAL_GAP;
        const rightA = x + PLATFORM_WIDTH + MIN_HORIZONTAL_GAP;
        const topA = y - MIN_VERTICAL_GAP;
        const bottomA = y + PLATFORM_HEIGHT + MIN_VERTICAL_GAP;

        const leftB = p.x;
        const rightB = p.x + p.width;
        const topB = p.y;
        const bottomB = p.y + p.height;

        const separated =
          rightA < leftB ||
          leftA > rightB ||
          bottomA < topB ||
          topA > bottomB;

        if (!separated) return true;
      }
      return false;
    };

    const snowflakes = [];
    const monsters = [];
    const chineseChars = ['天', '使', '棘', '雪', '血', '死', '亡'];
    const fluffyChars = ['´ཀ`', '𓉸ྀི', 'ᓚ₍ ^. .^₎🤍🔪', 'ᕦ⊙෴⊙ᕤ'];
    const longFluffyChars = ['ᓚ₍ ^. .^₎🤍🔪', 'ᕦ⊙෴⊙ᕤ'];
    const monsterShakes = new Map();

    const initPlatforms = () => {
      platforms.length = 0;
      icePlatforms.clear();
      const height = canvas.height / dpr;

      platforms.push({
        x: canvas.width / (2 * dpr) - PLATFORM_WIDTH / 2,
        y: height * 0.85,
        width: PLATFORM_WIDTH,
        height: PLATFORM_HEIGHT
      });

      let y = height * 0.85 - 80;

      while (y > -800) {
        let x;
        let attempts = 0;
        let tooClose = true;

        while (tooClose && attempts < 60) {
          x = Math.random() * (canvas.width / dpr - PLATFORM_WIDTH);
          tooClose = isTooCloseToExistingPlatforms(x, y);
          attempts++;
        }

        if (!tooClose) {
          const isIce = Math.random() > 0.75;
          const newPlatform = {
            x,
            y,
            width: PLATFORM_WIDTH,
            height: PLATFORM_HEIGHT
          };
          platforms.push(newPlatform);
          if (isIce) icePlatforms.add(newPlatform);
        }

        y -= 70 + Math.random() * 30;
      }
    };

    const initMonsters = () => {
      monsters.length = 0;
      const height = canvas.height / dpr;

      for (let i = 0; i < 1; i++) {
        const isChinese = Math.random() > 0.5;
        let x, y, attempts = 0;
        let tooClose = true;

        while (tooClose && attempts < 20) {
          x = Math.random() * (canvas.width / dpr - 40);
          y = Math.random() * height * 0.5;
          tooClose = false;

          for (const monster of monsters) {
            const dx = x - monster.x;
            const dy = y - monster.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < 120) {
              tooClose = true;
              break;
            }
          }
          attempts++;
        }

        if (!tooClose || attempts === 20) {
          let selectedChar;
          if (isChinese) {
            selectedChar =
              chineseChars[Math.floor(Math.random() * chineseChars.length)];
          } else {
            selectedChar = fluffyChars.slice(0, 2)[Math.floor(Math.random() * 2)];
          }

          monsters.push({
            x,
            y,
            width: 50,
            height: 50,
            type: isChinese ? 'chinese' : 'fluffy',
            char: selectedChar,
            color: isChinese ? '#fff' : Math.random() > 0.5 ? '#e0f2fe' : '#fff',
            bobOffset: Math.random() * Math.PI * 2,
            rotation: Math.random() * Math.PI * 2
          });
        }
      }
    };

    initPlatforms();
    initMonsters();

    // ========= 控制 =========
    const keys = {};
    let touchStartX = 0;
    let touchX = 0;

    const handleUserInteraction = () => {
      // 任意按键 / 触摸时补一次 BGM 启动，绕过浏览器静音限制
      startBgm();
    };

    const handleKeyDown = (e) => {
      keys[e.key] = true;
      handleUserInteraction();
    };

    const handleKeyUp = (e) => {
      keys[e.key] = false;
    };

    const handleTouchStart = (e) => {
      touchStartX = e.touches[0].clientX;
      touchX = e.touches[0].clientX;
      handleUserInteraction();
    };

    const handleTouchMove = (e) => {
      touchX = e.touches[0].clientX;
    };

    const handleTouchEnd = () => {
      touchX = 0;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchmove', handleTouchMove);
    canvas.addEventListener('touchend', handleTouchEnd);

    // ========= 绘制 =========
    const drawStar = (x, y, size, rotation) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);

      const gradient = ctx.createRadialGradient(0, 0, size * 0.3, 0, 0, size * 1.5);
      gradient.addColorStop(0, 'rgba(192, 192, 192, 0.3)');
      gradient.addColorStop(0.5, 'rgba(192, 192, 192, 0.1)');
      gradient.addColorStop(1, 'rgba(192, 192, 192, 0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(0, 0, size * 1.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#c0c0c0';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();

      for (let i = 0; i < 5; i++) {
        const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
        const px = Math.cos(angle) * size;
        const py = Math.sin(angle) * size;

        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);

        const innerAngle = angle + Math.PI / 5;
        const innerX = Math.cos(innerAngle) * (size * 0.4);
        const innerY = Math.sin(innerAngle) * (size * 0.4);
        ctx.lineTo(innerX, innerY);
      }

      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.beginPath();
      ctx.arc(0, -size * 0.3, size * 0.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    const drawPlatform = (platform, isIce) => {
      if (isIce) {
        const gradient = ctx.createLinearGradient(
          platform.x,
          platform.y,
          platform.x + platform.width,
          platform.y + platform.height
        );
        gradient.addColorStop(0, 'rgba(224, 242, 254, 0.9)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.95)');
        gradient.addColorStop(1, 'rgba(224, 242, 254, 0.9)');

        ctx.fillStyle = gradient;
        ctx.strokeStyle = 'rgba(186, 230, 253, 0.8)';
      } else {
        const gradient = ctx.createLinearGradient(
          platform.x,
          platform.y,
          platform.x + platform.width,
          platform.y + platform.height
        );
        gradient.addColorStop(0, '#e5e5e5');
        gradient.addColorStop(0.5, '#ffffff');
        gradient.addColorStop(1, '#d4d4d4');

        ctx.fillStyle = gradient;
        ctx.strokeStyle = '#a3a3a3';
      }

      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(
        platform.x,
        platform.y,
        platform.width,
        platform.height,
        6
      );
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(
        platform.x + 2,
        platform.y + 2,
        platform.width - 4,
        platform.height / 2,
        4
      );
      ctx.stroke();
    };

    const drawFluffyMonster = (monster, time) => {
      const bob = Math.sin(time * 0.003 + monster.bobOffset) * 3;
      const x = monster.x + monster.width / 2;
      const y = monster.y + monster.height / 2 + bob;

      ctx.save();
      ctx.translate(x, y);

      const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 30);
      glowGradient.addColorStop(0, 'rgba(200, 200, 200, 0.5)');
      glowGradient.addColorStop(1, 'rgba(200, 200, 200, 0)');
      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(0, 0, 30, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#2c2c2c';
      ctx.strokeStyle = '#666';
      ctx.lineWidth = 1;
      ctx.font = 'bold 28px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.strokeText(monster.char, 0, 0);
      ctx.fillText(monster.char, 0, 0);

      ctx.restore();
    };

    const drawChineseMonster = (monster, time) => {
      const bob = Math.sin(time * 0.003 + monster.bobOffset) * 3;
      const x = monster.x + monster.width / 2;
      const y = monster.y + monster.height / 2 + bob;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(monster.rotation);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 * i) / 8 + time * 0.001;
        const distance = 28 + Math.sin(time * 0.002 + i) * 4;
        const flakeX = Math.cos(angle) * distance;
        const flakeY = Math.sin(angle) * distance;

        ctx.beginPath();
        ctx.arc(flakeX, flakeY, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI * 2 * i) / 6;
        const offsetX = Math.cos(angle) * 18;
        const offsetY = Math.sin(angle) * 18;

        const fluffGradient = ctx.createRadialGradient(
          offsetX,
          offsetY,
          0,
          offsetX,
          offsetY,
          12
        );
        fluffGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        fluffGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.fillStyle = fluffGradient;
        ctx.beginPath();
        ctx.arc(offsetX, offsetY, 12, 0, Math.PI * 2);
        ctx.fill();
      }

      const centerGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 25);
      centerGradient.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      centerGradient.addColorStop(0.5, 'rgba(245, 245, 245, 0.7)');
      centerGradient.addColorStop(1, 'rgba(200, 200, 200, 0)');

      ctx.fillStyle = centerGradient;
      ctx.beginPath();
      ctx.arc(0, 0, 25, 0, Math.PI * 2);
      ctx.fill();

      const textGradient = ctx.createLinearGradient(0, -18, 0, 18);
      textGradient.addColorStop(0, '#ffffff');
      textGradient.addColorStop(0.5, '#f0f0f0');
      textGradient.addColorStop(1, '#d0d0d0');

      ctx.fillStyle = textGradient;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.lineWidth = 4;
      ctx.font =
        '900 32px "Comic Sans MS", "Arial Rounded MT Bold", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.strokeText(monster.char, 0, 0);
      ctx.fillText(monster.char, 0, 0);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillText(monster.char, -1, -1);

      ctx.restore();
      ctx.shadowColor = 'transparent';
    };

    // ========= 游戏循环 =========
    let animationId = null;
    let currentScore = 0;
    let lastTime = 0;
    const FIXED_TIMESTEP = 1000 / 60;
    let accumulator = 0;

    const handleGameOver = () => {
      if (isGameOverRef.current) return;
      isGameOverRef.current = true;
      setGameOver(true);
      setHighScore((prev) => Math.max(prev, Math.floor(currentScore)));
      fadeOutBgm();
      playGameOverSound();

      if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
    };

    const gameLoop = (time) => {
      if (isGameOverRef.current) {
        if (animationId) {
          cancelAnimationFrame(animationId);
          animationId = null;
        }
        return;
      }

      const deltaTime = time - lastTime;
      lastTime = time;
      accumulator += deltaTime;

      if (accumulator > 200) {
        accumulator = FIXED_TIMESTEP;
      }

      while (accumulator >= FIXED_TIMESTEP && !isGameOverRef.current) {
        updateGame(time);
        accumulator -= FIXED_TIMESTEP;
      }

      if (!isGameOverRef.current) {
        renderGame(time);
        animationId = requestAnimationFrame(gameLoop);
      }
    };

    const updateGame = (time) => {
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;

      if (keys['ArrowLeft'] || keys['a']) {
        player.velocityX = -3.5;
      } else if (keys['ArrowRight'] || keys['d']) {
        player.velocityX = 3.5;
      } else if (touchX !== 0) {
        const diff = touchX - touchStartX;
        player.velocityX = diff * 0.05;
      } else {
        player.velocityX *= 0.85;
      }

      player.x += player.velocityX;
      player.velocityY += GRAVITY;
      player.y += player.velocityY;
      player.rotation += 0.05;

      if (player.x < -player.width) player.x = width;
      if (player.x > width) player.x = -player.width;

      if (player.velocityY > 0) {
        for (let i = platforms.length - 1; i >= 0; i--) {
          const platform = platforms[i];
          if (
            player.x + player.width > platform.x &&
            player.x < platform.x + platform.width &&
            player.y + player.height > platform.y &&
            player.y < platform.y + 5 &&
            player.velocityY > 0
          ) {
            player.velocityY = JUMP_FORCE;

            if (icePlatforms.has(platform)) {
              icePlatforms.delete(platform);
              platforms.splice(i, 1);
            }
            break;
          }
        }
      }

      let justReachedFinal = false;

      if (
        player.y < height * 0.4 &&
        player.velocityY < 0 &&
        !isGameOverRef.current &&
        !finalPlateauReached
      ) {
        const scrollAmount = -player.velocityY;

        player.y += scrollAmount;
        cameraY += scrollAmount;
        platforms.forEach((p) => (p.y += scrollAmount));
        monsters.forEach((m) => (m.y += scrollAmount));

        currentScore += scrollAmount;
        if (currentScore >= FINAL_SCORE) {
          currentScore = FINAL_SCORE;
          finalPlateauReached = true;
          justReachedFinal = true;
        }
        setScore(Math.floor(currentScore));
      }

      if (justReachedFinal) {
        const finalPlatform = {
          x: width / 2 - PLATFORM_WIDTH / 2,
          y: height * 0.7,
          width: PLATFORM_WIDTH,
          height: PLATFORM_HEIGHT
        };
        platforms.push(finalPlatform);
      }

      const highestPlatformY = platforms.reduce(
        (min, p) => (p.y < min ? p.y : min),
        Infinity
      );

      if (highestPlatformY > SPAWN_BUFFER_Y && !finalPlateauReached) {
        let x;
        let attempts = 0;
        let tooClose = true;
        const newY = highestPlatformY - (70 + Math.random() * 30);

        while (tooClose && attempts < 60) {
          x = Math.random() * (width - PLATFORM_WIDTH);
          tooClose = isTooCloseToExistingPlatforms(x, newY);
          attempts++;
        }

        if (!tooClose) {
          const isIce = Math.random() > 0.75;
          const newPlatform = {
            x,
            y: newY,
            width: PLATFORM_WIDTH,
            height: PLATFORM_HEIGHT
          };
          platforms.push(newPlatform);
          if (isIce) icePlatforms.add(newPlatform);
        }
      }

      let maxMonsters = 1;
      if (currentScore >= 20000) {
        maxMonsters = 4;
      } else if (currentScore >= 10000) {
        maxMonsters = 3;
      } else if (currentScore >= 5000) {
        maxMonsters = 2;
      }

      if (
        Math.random() > 0.99 &&
        platforms.length > 0 &&
        monsters.length < maxMonsters &&
        !finalPlateauReached
      ) {
        const highestY = platforms.reduce(
          (min, p) => (p.y < min ? p.y : min),
          Infinity
        );

        const spawnY = highestY - 120;

        if (spawnY <= SPAWN_BUFFER_Y - 40) {
          const isChinese = Math.random() > 0.5;
          let newX;
          let attempts = 0;
          let tooClose = true;

          while (tooClose && attempts < 10) {
            newX = Math.random() * (width - 50);
            tooClose = false;

            for (const monster of monsters) {
              const dx = newX - monster.x;
              const dy = spawnY - monster.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              if (distance < 100) {
                tooClose = true;
                break;
              }
            }
            attempts++;
          }

          if (!tooClose || attempts === 10) {
            let selectedChar;
            if (isChinese) {
              selectedChar =
                chineseChars[Math.floor(Math.random() * chineseChars.length)];
            } else {
              const availableChars =
                currentScore >= 8000 ? fluffyChars : fluffyChars.slice(0, 2);
              selectedChar =
                availableChars[Math.floor(Math.random() * availableChars.length)];

              const currentLongCount = monsters.filter(
                (m) => m.type === 'fluffy' && longFluffyChars.includes(m.char)
              ).length;

              if (longFluffyChars.includes(selectedChar) && currentLongCount >= 2) {
                const shortFluffyChars = fluffyChars.slice(0, 2);
                selectedChar =
                  shortFluffyChars[Math.floor(Math.random() * shortFluffyChars.length)];
              }
            }

            monsters.push({
              x: newX,
              y: spawnY,
              width: 50,
              height: 50,
              type: isChinese ? 'chinese' : 'fluffy',
              char: selectedChar,
              color: isChinese ? '#fff' : Math.random() > 0.5 ? '#e0f2fe' : '#fff',
              bobOffset: Math.random() * Math.PI * 2,
              rotation: Math.random() * Math.PI * 2
            });
          }
        }
      }

      for (let i = platforms.length - 1; i >= 0; i--) {
        if (platforms[i].y > height + 50) {
          const removed = platforms.splice(i, 1)[0];
          icePlatforms.delete(removed);
        }
      }

      for (let i = monsters.length - 1; i >= 0; i--) {
        if (monsters[i].y > height + 100) {
          const removed = monsters.splice(i, 1)[0];
          monsterShakes.delete(removed);
        }
      }

      if (finalPlateauReached) {
        const topLimit = height * 0.25;
        if (player.y < topLimit) {
          player.y = topLimit;
          if (player.velocityY < 0) player.velocityY = 0;
        }
      }

      for (let i = monsters.length - 1; i >= 0; i--) {
        const monster = monsters[i];

        if (
          player.x + player.width > monster.x &&
          player.x < monster.x + monster.width &&
          player.y + player.height > monster.y &&
          player.y < monster.y + monster.height
        ) {
          if (player.y + player.height <= monster.y + monster.height) {
            // 从上方踩到怪物
            player.velocityY = JUMP_FORCE;
            playWeightedMonsterSound();

            monsterShakes.set(monster, {
              startTime: time,
              duration: 200
            });

            setTimeout(() => {
              const idx = monsters.indexOf(monster);
              if (idx > -1) {
                monsters.splice(idx, 1);
                monsterShakes.delete(monster);
              }
            }, 100);
          } else {
            handleGameOver();
            return;
          }
        }
      }

      if (player.y > height + 50) {
        handleGameOver();
      }
    };

    const renderGame = (time) => {
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;

      const bgGradient = ctx.createLinearGradient(0, 0, 0, height);

      if (currentScore < 15000) {
        bgGradient.addColorStop(0, '#f8fafc');
        bgGradient.addColorStop(1, '#e2e8f0');
      } else if (currentScore < 40000) {
        const progress = (currentScore - 15000) / 25000;

        const topStart = { r: 248, g: 250, b: 252 };
        const topEnd = { r: 74, g: 26, b: 26 };

        const bottomStart = { r: 226, g: 232, b: 240 };
        const bottomEnd = { r: 92, g: 26, b: 26 };

        const r1 = Math.round(topStart.r + (topEnd.r - topStart.r) * progress);
        const g1 = Math.round(topStart.g + (topEnd.g - topStart.g) * progress);
        const b1 = Math.round(topStart.b + (topEnd.b - topStart.b) * progress);

        const r2 = Math.round(bottomStart.r + (bottomEnd.r - bottomStart.r) * progress);
        const g2 = Math.round(bottomStart.g + (bottomEnd.g - bottomStart.g) * progress);
        const b2 = Math.round(bottomStart.b + (bottomEnd.b - bottomStart.b) * progress);

        bgGradient.addColorStop(0, `rgb(${r1}, ${g1}, ${b1})`);
        bgGradient.addColorStop(1, `rgb(${r2}, ${g2}, ${b2})`);
      } else {
        bgGradient.addColorStop(0, '#4a1a1a');
        bgGradient.addColorStop(1, '#5c1a1a');
      }

      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      if (currentScore >= 10000) {
        if (Math.random() < 0.03) {
          snowflakes.push({
            x: Math.random() * width,
            y: -10,
            speed: 0.5 + Math.random() * 1,
            size: 2 + Math.random() * 2,
            opacity: 0.3 + Math.random() * 0.4
          });
        }

        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        for (let i = snowflakes.length - 1; i >= 0; i--) {
          const flake = snowflakes[i];
          flake.y += flake.speed;

          ctx.globalAlpha = flake.opacity;
          ctx.beginPath();
          ctx.arc(flake.x, flake.y, flake.size, 0, Math.PI * 2);
          ctx.fill();

          if (flake.y > height) {
            snowflakes.splice(i, 1);
          }
        }
        ctx.globalAlpha = 1;
      }

      platforms.forEach((platform) => {
        if (platform.y > -50 && platform.y < height + 50) {
          drawPlatform(platform, icePlatforms.has(platform));
        }
      });

      ctx.shadowColor = 'transparent';
      monsters.forEach((monster) => {
        if (monster.y > -100 && monster.y < height + 100) {
          ctx.save();

          const shake = monsterShakes.get(monster);
          if (shake) {
            const elapsed = time - shake.startTime;
            if (elapsed < shake.duration) {
              const intensity = (1 - elapsed / shake.duration) * 3;
              const shakeX = (Math.random() - 0.5) * intensity;
              const shakeY = (Math.random() - 0.5) * intensity;
              ctx.translate(shakeX, shakeY);

              ctx.globalAlpha = 1 - elapsed / shake.duration;
            }
          }

          if (monster.type === 'fluffy') {
            drawFluffyMonster(monster, time);
          } else {
            drawChineseMonster(monster, time);
          }

          ctx.restore();
        }
      });
      ctx.shadowColor = 'transparent';

      drawStar(
        player.x + player.width / 2,
        player.y + player.height / 2,
        player.width / 2,
        player.rotation
      );
    };

    // ========= 暴露 restart =========
    gameStateRef.current = {
      restart: () => {
        if (animationId) {
          cancelAnimationFrame(animationId);
          animationId = null;
        }

        isGameOverRef.current = false;
        setGameOver(false);
        currentScore = 0;
        setScore(0);

        const width = canvas.width / dpr;
        const height = canvas.height / dpr;

        cameraY = 0;
        finalPlateauReached = false;

        player.x = width / 2 - PLAYER_SIZE / 2;
        player.y = height * 0.7;
        player.velocityY = 0;
        player.velocityX = 0;
        player.rotation = 0;

        lastTime = performance.now();
        accumulator = 0;

        initPlatforms();
        initMonsters();

        startBgm();

        setTimeout(() => {
          if (!isGameOverRef.current) {
            animationId = requestAnimationFrame(gameLoop);
          }
        }, 50);
      }
    };

    // 启动循环 + BGM
    lastTime = performance.now();
    startBgm();
    animationId = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      if (bgmFadeIntervalId) {
        clearInterval(bgmFadeIntervalId);
      }
      if (bgmAudio) {
        bgmAudio.pause();
      }
    };
  }, []);

  const handleRestart = () => {
    if (gameStateRef.current) {
      gameStateRef.current.restart();
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 flex flex-col items-center justify-start pt-4 pb-4 overflow-hidden select-none">
      <div className="max-w-md w-full px-4">
        <div className="mb-4 text-center">
          {/* Henny Penny 字体：记得在 <head> 里用 link 把字体引入 */}
          <h1 className="text-4xl md:text-5xl font-normal tracking-[0.3em] text-gray-900 mb-2 font-['Henny_Penny',system-ui,sans-serif]">
            ✦ CELESTIAL JUMP ✦
          </h1>
        </div>

        <div className="flex justify-between items-center mb-4 px-6">
          <div className="text-center">
            <p className="text-xs font-light text-gray-500 tracking-wider uppercase mb-1">
              Score
            </p>
            <p className="text-3xl font-light text-gray-800 tabular-nums">
              {score}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs font-light text-gray-500 tracking-wider uppercase mb-1">
              Best
            </p>
            <p className="text-3xl font-light text-gray-800 tabular-nums">
              {highScore}
            </p>
          </div>
        </div>

        <div className="relative bg-white/50 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden border border-white/60">
          <canvas
            ref={canvasRef}
            className="w-full h-[540px] md:h-[620px] block"
          />

          {gameOver && (
            <div className="absolute inset-0 bg-white/95 backdrop-blur-md flex flex-col items-center justify-center">
              <div className="text-center space-y-6 px-8">
                <div className="text-2xl mb-4 text-gray-600">
                  ─── ⋆⋅ ♱ ⋅⋆ ───
                </div>
                <h2 className="text-3xl font-light text-gray-800 tracking-wide">
                  {score < 500
                    ? 'what are you even doing'
                    : score < 2000
                    ? "you can't be real"
                    : score < 5000
                    ? 'not your smartest run'
                    : score >= 40000
                    ? 'lets die in a beautiful winter'
                    : score >= 20000
                    ? 'well done. now go get some rest gang'
                    : score >= 10000
                    ? 'have you seen the snow?'
                    : 'journey complete'}
                </h2>

                <div className="space-y-2">
                  <p className="text-sm text-gray-500 tracking-wider uppercase">
                    Final Score
                  </p>
                  <p className="text-5xl font-light text-gray-800 tabular-nums">
                    {score}
                  </p>
                </div>
                <Button
                  onClick={handleRestart}
                  className="bg-gradient-to-r from-gray-700 to-gray-900 hover:from-gray-800 hover:to-black text-white px-8 py-6 rounded-full text-lg font-light tracking-wide shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <RotateCcw className="w-5 h-5 mr-2" />
                  NOW IM MAD
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
