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
  const soundsRef = useRef({
    jump: [],
    jumpOnMonster: [],
    gameOver: null
  });
  const lastJumpSoundRef = useRef(0);     // 上一次跳跃音效时间
  const lastMonsterSoundRef = useRef(0);  // 上一次踩怪音效时间
 
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // ========= 音效初始化：使用音效池（Audio Pool），不在运行时 clone =========
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
        } catch (e) {
          // 忽略播放失败，避免卡顿
        }
      };

      return { pool, play };
    };

    // 跳跃音效（平台）—— 每种 3 个实例
    const jumpPools = [
      createAudioPool('/sounds/jump_sound_1.mp3', 0.35, 3),
      createAudioPool('/sounds/jump_sound_2.mp3', 0.35, 3),
      createAudioPool('/sounds/jump_sound_3.mp3', 0.35, 3),
      createAudioPool('/sounds/jump_sound_4.mp3', 0.35, 3),
      createAudioPool('/sounds/jump_sound_5.mp3', 0.35, 3),
      createAudioPool('/sounds/jump_sound_6.mp3', 0.35, 3),
    ];

    // 踩怪物音效（带权重：808 50%，其他平均 50%）
    const monsterPools = [
      { pool: createAudioPool('/sounds/jump_on_monsters_sound_808.mp3', 0.55, 3), weight: 0.5 },
      { pool: createAudioPool('/sounds/jump_on_monsters_sound_CHH.mp3', 0.4, 2), weight: 0.125 },
      { pool: createAudioPool('/sounds/jump_on_monsters_sound_OHH.mp3', 0.4, 2), weight: 0.125 },
      { pool: createAudioPool('/sounds/jump_on_monsters_sound_laser.mp3', 0.4, 2), weight: 0.125 },
      { pool: createAudioPool('/sounds/jump_on_monsters_sound_snare.mp3', 0.4, 2), weight: 0.125 },
    ];

    // Game Over 音效（2 个实例）
    const gameOverPool = createAudioPool('/sounds/game_over_sound_kyu.mp3', 0.5, 2);

    // 如果你之后想从外面访问，也可以继续挂在 ref 上
    soundsRef.current.jump = jumpPools;
    soundsRef.current.jumpOnMonster = monsterPools;
    soundsRef.current.gameOver = gameOverPool;

    const now = () => performance.now();

    // 跳跃音效：冷却 40ms，保证连续跳也基本都有声
    const playJumpSound = () => {
      if (!jumpPools.length) return;

      const t = now();
      if (t - lastJumpSoundRef.current < 40) return;
      lastJumpSoundRef.current = t;

      const pool = jumpPools[Math.floor(Math.random() * jumpPools.length)];
      pool.play();
    };

    // 踩怪物音效：808 50%，其他平均，80ms 冷却
    const playWeightedMonsterSound = () => {
      if (!monsterPools.length) return;

      const t = now();
      if (t - lastMonsterSoundRef.current < 80) return;
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

      // 浮点误差兜底
      monsterPools[0].pool.play();
    };

    // Game Over 音效
    const playGameOverSound = () => {
      gameOverPool.play();
    };



const ctx = canvas.getContext('2d');
// 限制最高像素比，避免 3x / 4x 这种把手机压趴
const dpr = Math.min(window.devicePixelRatio || 1, 1.8);

const resizeCanvas = () => {
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;

  // 用 setTransform 重置缩放，避免多次调用 scale 累积
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
};

    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Game constants
    const GRAVITY = 0.2;
    const JUMP_FORCE = -10.5;
    const PLAYER_SIZE = 30;
    const PLATFORM_WIDTH = 80;
    const PLATFORM_HEIGHT = 12;
    const FINAL_SCORE = 50000; // 5 万封顶


    // Player (Silver Star) - using screen coordinates
    const player = {
      x: canvas.width / (2 * dpr) - PLAYER_SIZE / 2,
      y: canvas.height / dpr * 0.7,
      width: PLAYER_SIZE,
      height: PLAYER_SIZE,
      velocityY: 0,
      velocityX: 0,
      rotation: 0
    };

    // Platforms - using screen coordinates
    const platforms = [];
    const icePlatforms = new Set();
    let cameraY = 0;
    let finalPlateauReached = false; // 是否已经到达最终休息区

        // 平台之间的最小间距（防止重叠 / 紧贴）
    const MIN_HORIZONTAL_GAP = 12; // 水平方向至少留 12px 缝
    const MIN_VERTICAL_GAP = 35;   // 竖直方向也要留一点距离

    // 所有新平台必须生成在屏幕顶部以上的缓冲区（负数，越小越远离屏幕）
    // 比如 -200 表示：最顶上的平台如果已经高于 -200，就继续往上生成新平台
    const SPAWN_BUFFER_Y = -200;

    // 检查一个新平台 (x, y) 是否离现有平台太近（包括重叠 + 紧紧贴着）
    const isTooCloseToExistingPlatforms = (x, y) => {
      for (const p of platforms) {
        // 把新平台的矩形扩展一点，形成“安全区”
        const leftA = x - MIN_HORIZONTAL_GAP;
        const rightA = x + PLATFORM_WIDTH + MIN_HORIZONTAL_GAP;
        const topA = y - MIN_VERTICAL_GAP;
        const bottomA = y + PLATFORM_HEIGHT + MIN_VERTICAL_GAP;

        const leftB = p.x;
        const rightB = p.x + p.width;
        const topB = p.y;
        const bottomB = p.y + p.height;

        // 如果两个扩展矩形有交集 => 太近了
        const separated =
          rightA < leftB ||
          leftA > rightB ||
          bottomA < topB ||
          topA > bottomB;

        if (!separated) {
          return true; // 有一个平台离得太近
        }
      }
      return false; // 和所有平台都保持了安全间距
    };

    
    // Snowflakes
    const snowflakes = [];
    
    // Monsters
    const monsters = [];
    const chineseChars = ['天', '使', '棘', '雪', '血', '死', '亡'];
    const fluffyChars = ['´ཀ`', '𓉸ྀི', 'ᓚ₍ ^. .^₎🤍🔪', 'ᕦ⊙෴⊙ᕤ'];
    const longFluffyChars = ['ᓚ₍ ^. .^₎🤍🔪', 'ᕦ⊙෴⊙ᕤ']; // 较长的两个表情
    const monsterShakes = new Map();


    // Initialize platforms
    const initPlatforms = () => {
      platforms.length = 0;
      icePlatforms.clear();
      const height = canvas.height / dpr;

      // 初始基准平台：玩家脚下那块
      platforms.push({
        x: canvas.width / (2 * dpr) - PLATFORM_WIDTH / 2,
        y: height * 0.85,
        width: PLATFORM_WIDTH,
        height: PLATFORM_HEIGHT,
      });

      // 从基准平台往上，一路预生成，到屏幕上方很高的位置
      let y = height * 0.85 - 80;

      // 比原来更高一点（例如 -800），这样上方世界更“提前做好”
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
            height: PLATFORM_HEIGHT,
          };
          platforms.push(newPlatform);

          if (isIce) {
            icePlatforms.add(newPlatform);
          }
        }

        y -= 70 + Math.random() * 30;
      }
    };



    // Initialize monsters
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
            selectedChar = chineseChars[Math.floor(Math.random() * chineseChars.length)];
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
            color: isChinese ? '#fff' : (Math.random() > 0.5 ? '#e0f2fe' : '#fff'),
            bobOffset: Math.random() * Math.PI * 2,
            rotation: Math.random() * Math.PI * 2
          });
        }
      }
    };

    initPlatforms();
    initMonsters();

    // Controls
    const keys = {};
    let touchStartX = 0;
    let touchX = 0;

    const handleKeyDown = (e) => {
      keys[e.key] = true;
    };

    const handleKeyUp = (e) => {
      keys[e.key] = false;
    };

    const handleTouchStart = (e) => {
      touchStartX = e.touches[0].clientX;
      touchX = e.touches[0].clientX;
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

    // Draw functions
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
        const x = Math.cos(angle) * size;
        const y = Math.sin(angle) * size;
        
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        
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
          platform.x, platform.y,
          platform.x + platform.width, platform.y + platform.height
        );
        gradient.addColorStop(0, 'rgba(224, 242, 254, 0.9)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.95)');
        gradient.addColorStop(1, 'rgba(224, 242, 254, 0.9)');
        
        ctx.fillStyle = gradient;
        ctx.strokeStyle = 'rgba(186, 230, 253, 0.8)';
      } else {
        const gradient = ctx.createLinearGradient(
          platform.x, platform.y,
          platform.x + platform.width, platform.y + platform.height
        );
        gradient.addColorStop(0, '#e5e5e5');
        gradient.addColorStop(0.5, '#ffffff');
        gradient.addColorStop(1, '#d4d4d4');
        
        ctx.fillStyle = gradient;
        ctx.strokeStyle = '#a3a3a3';
      }
      
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(platform.x, platform.y, platform.width, platform.height, 6);
      ctx.fill();
      ctx.stroke();
      
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(platform.x + 2, platform.y + 2, platform.width - 4, platform.height / 2, 4);
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
          offsetX, offsetY, 0,
          offsetX, offsetY, 12
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
      ctx.font = '900 32px "Comic Sans MS", "Arial Rounded MT Bold", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.strokeText(monster.char, 0, 0);
      ctx.fillText(monster.char, 0, 0);
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillText(monster.char, -1, -1);
      
      ctx.restore();
      ctx.shadowColor = 'transparent';
    };

    // Game loop
    let animationId = null;
    let currentScore = 0;
    let lastTime = 0;
    const FIXED_TIMESTEP = 1000 / 60;
    let accumulator = 0;
    
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

            //playJumpSound();


            if (icePlatforms.has(platform)) {
              icePlatforms.delete(platform);
              platforms.splice(i, 1);
            }
            break;
          }
        }
      }

// 相机上移 + 记分（到 5 万分就封顶）
    let justReachedFinal = false;

    if (
      player.y < height * 0.4 &&
      player.velocityY < 0 &&
      !isGameOverRef.current &&
      !finalPlateauReached
    ) {
      const scrollAmount = -player.velocityY;
    
      // 场景整体往下推（玩家看起来往上爬）
      player.y += scrollAmount;
      cameraY += scrollAmount;
      platforms.forEach((p) => (p.y += scrollAmount));
      monsters.forEach((m) => (m.y += scrollAmount));
    
      // 累加分数，并判断是否达到最终分数
      currentScore += scrollAmount;
      if (currentScore >= FINAL_SCORE) {
        currentScore = FINAL_SCORE;
        finalPlateauReached = true;
        justReachedFinal = true;
      }
      setScore(Math.floor(currentScore));
    }
    
    // 如果刚刚达到 5 万分，生成“最后一块方块”
    if (justReachedFinal) {
      const finalPlatform = {
        x: width / 2 - PLATFORM_WIDTH / 2,
        y: height * 0.7, // 大概在画面下半部，舒服一点
        width: PLATFORM_WIDTH,
        height: PLATFORM_HEIGHT,
      };
      platforms.push(finalPlatform);
    }

      
      // 找出当前“最高”的那块平台（y 最小，越小越靠上）
      const highestPlatformY = platforms.reduce(
        (min, p) => (p.y < min ? p.y : min),
        Infinity
      );

      // 如果最高的平台已经“离屏幕顶部太近”（> SPAWN_BUFFER_Y），
      // 就在它的更上方预生成一块新平台（仍然在屏幕外）
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
            height: PLATFORM_HEIGHT,
          };
          // 放到数组末尾就行，不依赖顺序
          platforms.push(newPlatform);

          if (isIce) {
            icePlatforms.add(newPlatform);
          }
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
        // 同样基于“最高平台”来决定怪物的生成高度
        const highestPlatformY = platforms.reduce(
          (min, p) => (p.y < min ? p.y : min),
          Infinity
        );

        // 怪物生成在最高平台再往上 120px 的地方
        const spawnY = highestPlatformY - 120;

        // 如果这个生成高度已经太接近屏幕顶部（> SPAWN_BUFFER_Y - 40），
        // 说明再生成就会在可见区附近了，这一帧就先不生成
        if (spawnY > SPAWN_BUFFER_Y - 40) {
          // 直接跳过这次生成
        } else {
          const isChinese = Math.random() > 0.5;
          let newX;
          let attempts = 0;
          let tooClose = true;

          // 只在水平方向做一点“不要太挤”的处理
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
              selectedChar = chineseChars[Math.floor(Math.random() * chineseChars.length)];
            } else {
              const availableChars =
                currentScore >= 8000 ? fluffyChars : fluffyChars.slice(0, 2);
              selectedChar = availableChars[Math.floor(Math.random() * availableChars.length)];

              // ★ 限制长表情怪最多 2 个
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
              y: spawnY, // 注意这里用的是 spawnY，而不是原来的 platforms[0].y - 100
              width: 50,
              height: 50,
              type: isChinese ? 'chinese' : 'fluffy',
              char: selectedChar,
              color: isChinese ? '#fff' : Math.random() > 0.5 ? '#e0f2fe' : '#fff',
              bobOffset: Math.random() * Math.PI * 2,
              rotation: Math.random() * Math.PI * 2,
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
        // 如果已经到达最终休息区，限制玩家最高高度，不让继续往上爬
        if (finalPlateauReached) {
          const topLimit = height * 0.25; // 玩家最高只能到画面 1/4 处
          if (player.y < topLimit) {
            player.y = topLimit;
            if (player.velocityY < 0) {
              player.velocityY = 0;
            }
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
            player.velocityY = JUMP_FORCE;

            //playWeightedMonsterSound();


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
            isGameOverRef.current = true;
            setGameOver(true);
           // playGameOverSound();
            if (currentScore > highScore) {
              setHighScore(Math.floor(currentScore));
            }
            if (animationId) {
              cancelAnimationFrame(animationId);
              animationId = null;
            }
            return;
          }
        }
      }

      if (player.y > height + 50) {
        isGameOverRef.current = true;
        setGameOver(true);
        //playGameOverSound();
        if (currentScore > highScore) {
          setHighScore(Math.floor(currentScore));
        }
        if (animationId) {
          cancelAnimationFrame(animationId);
          animationId = null;
        }
        return;
      }
    };
    
    const renderGame = (time) => {
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;
      
const bgGradient = ctx.createLinearGradient(0, 0, 0, height);

if (currentScore < 15000) {
  // 0–14999：纯蓝白
  bgGradient.addColorStop(0, '#f8fafc'); // 顶部
  bgGradient.addColorStop(1, '#e2e8f0'); // 底部
} else if (currentScore < 40000) {
  // 15000–39999：从蓝白渐变到深红
  const progress = (currentScore - 15000) / 25000; // 0 → 1

  // 顶部颜色：#f8fafc → #4a1a1a
  const topStart = { r: 248, g: 250, b: 252 };
  const topEnd   = { r: 74,  g: 26,  b: 26  };

  // 底部颜色：#e2e8f0 → #5c1a1a
  const bottomStart = { r: 226, g: 232, b: 240 };
  const bottomEnd   = { r: 92,  g: 26,  b: 26  };

  const r1 = Math.round(topStart.r + (topEnd.r - topStart.r) * progress);
  const g1 = Math.round(topStart.g + (topEnd.g - topStart.g) * progress);
  const b1 = Math.round(topStart.b + (topEnd.b - topStart.b) * progress);

  const r2 = Math.round(bottomStart.r + (bottomEnd.r - bottomStart.r) * progress);
  const g2 = Math.round(bottomStart.g + (bottomEnd.g - bottomStart.g) * progress);
  const b2 = Math.round(bottomStart.b + (bottomEnd.b - bottomStart.b) * progress);

  bgGradient.addColorStop(0, `rgb(${r1}, ${g1}, ${b1})`);
  bgGradient.addColorStop(1, `rgb(${r2}, ${g2}, ${b2})`);
} else {
  // ≥ 40000：完全进入深红世界
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

      platforms.forEach(platform => {
        if (platform.y > -50 && platform.y < height + 50) {
          drawPlatform(platform, icePlatforms.has(platform));
        }
      });

      ctx.shadowColor = 'transparent';
      monsters.forEach(monster => {
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
              
              ctx.globalAlpha = 1 - (elapsed / shake.duration);
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

        player.x = width / 2 - PLAYER_SIZE / 2;
        player.y = height * 0.7;
        player.velocityY = 0;
        player.velocityX = 0;
        player.rotation = 0;

        lastTime = performance.now();
        accumulator = 0;

        initPlatforms();
        initMonsters();

        setTimeout(() => {
          if (!isGameOverRef.current) {
            animationId = requestAnimationFrame(gameLoop);
          }
        }, 50);
      }
    };

    lastTime = performance.now();
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
    };
  }, [highScore]);

  const handleRestart = () => {
    if (gameStateRef.current) {
      gameStateRef.current.restart();
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 flex flex-col items-center justify-start pt-4 pb-4 overflow-hidden select-none">
      <div className="max-w-md w-full px-4">
        <div className="mb-4 text-center">
          <h1 className="text-4xl font-light tracking-wider text-gray-800 mb-2">
            ✦ CELESTIAL JUMP ✦
          </h1>
        </div>

        <div className="flex justify-between items-center mb-4 px-6">
          <div className="text-center">
            <p className="text-xs font-light text-gray-500 tracking-wider uppercase mb-1">Score</p>
            <p className="text-3xl font-light text-gray-800 tabular-nums">{score}</p>
          </div>
          <div className="text-center">
            <p className="text-xs font-light text-gray-500 tracking-wider uppercase mb-1">Best</p>
            <p className="text-3xl font-light text-gray-800 tabular-nums">{highScore}</p>
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
                <div className="text-2xl mb-4 text-gray-600">─── ⋆⋅ ♱ ⋅⋆ ───</div>
             <h2 className="text-3xl font-light text-gray-800 tracking-wide">
                {score < 500
                  ? 'are you retarded or sum?'
                  : score < 2000
                  ? "you can't be real"
                  : score < 5000
                  ? 'not so smart'
                  : score >= 40000
                  ? 'lets die in a beautiful winter'
                  : score >= 20000
                  ? 'Well done. Now go get some rest gang'
                  : score >= 10000
                  ? 'Have you seen the snow?'
                  : 'Journey Complete'}
              </h2>

                <div className="space-y-2">
                  <p className="text-sm text-gray-500 tracking-wider uppercase">Final Score</p>
                  <p className="text-5xl font-light text-gray-800 tabular-nums">{score}</p>
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
