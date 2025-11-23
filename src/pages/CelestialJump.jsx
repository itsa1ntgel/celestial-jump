import React, { useEffect, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ASCII 背景素材（可追加更多）
const ASCII_BACKGROUNDS = [
  [
    '                                                  ',
    '                                                  ',
    '           @                       @              ',
    '           @                       @              ',
    '           @                       @              ',
    '           @                       @              ',
    '          @@                       @@             ',
    '          @@@                     @@@             ',
    '          @@@                     @@@             ',
    '       @  @@@  @               @  @@@  @          ',
    '        :@@@@@#-                *@@@@@            ',
    '       @@@@@@@@@               %@@@@@@@@          ',
    '       @@@   @@@               @@@   @@@          ',
    '        @@   @@-                @@   @@           ',
    '        @@*  @@*                @@   @@           ',
    '        @@#  @@*                @@   @@           ',
    '        @@#  @@*       @        @@   @@           ',
    '        @@#  @@*       @        @@   @@           ',
    '        @@   @@+       @        @@   @@           ',
    '        @@@@@@@       :@+       @@@@@@@           ',
    '       @@@@@@@@@   @*.@@@..@   @@@@@@@@@:         ',
    '     +@@@@@@@@@@@   @  @  @   @@@@@@@@@@@         ',
    '      @@@@@@@@@@@+@@@@.@.@@@@+@@@@@@@@@@@         ',
    '      @@@@@@@@@@@=  %  @  -  @@@@@@@@@@@@         ',
    '      @@@@@@@@@@@   #  @  :  @@@@@@@@@@@@         ',
    '    *@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@       ',
    '     @@@@@@@@@@@@@  :.@@    @@@@@@@@@@@@@         ',
    '     @@@ %     @@@    @@@    @@@::     %@@        ',
    '     @@@@  @#  @@@@   @@@   @@@@@  @@  @@@        ',
    '     @@@@@@@@@@@@@@   @@@   @@@@@@@@@@@@@@        ',
    '   @@@@@@@@  %@@@@@   @@@   @@@@@@@  @@@@@@@      ',
    '   @@@@@@@%  @@@@@@  *@@@@  @@@@@@#  @@@@@@@      ',
    '  #@@@@@@@@  @@@@@@@@@@@@@@@@@@@@@@  @@@@@@@@     ',
    '  @@@@@@@@@  @@@@@@@@@@@@@@@@@@@@@@  @@@@@@@@     ',
    '  @@@@@@@@+  @@@@@@@@@@@@@@@@@@@@@=  @@@@@@@@     ',
    '  @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@     ',
    '  @@@@@@@@@@@@@@@@@@@@...*@@@@@@@@@@@@@@@@@@@     ',
    ' @@@@@@@@@@@@@@@@@@@=......@@@@@@@@@@@@@@@@@@@    ',
    ' @@@@@@@@@+..*@@@@@@#......@@@@@@@...@@@@@@@@@    ',
    ' @@@@@@@@@....@@@@@@.......@@@@@@@...#@@@@@@@@    ',
    ' @@@@@@@@@@@@@@@@@@@.......@@@@@@@@@*@@@@@@@@@    ',
    ' @@@@@@@@@@@@@@@@@@@.......%@@@@@@@@@@@@@@@@@@    ',
    '#@#################@%.-@=:.@%################@#   '
  ],
  [
    '                             ⣴⣆                       ',
    '              ⢀⡠⠄    ⢀⡲⢷⠷⢧⣄                 ',
    '           ⢠⠜⠁      ⢠⣣⡓⡉⣧⠎⠋⢖             ',
    '          ⣰⠃          ⠈⠉⢰⣻⣷⡦⠉⠁             ',
    '   ⢀⣔⠦⣤⣇         ⡆    ⠸⣙⣯⣡    ⡀          ',
    '   ⠈    ⢹⣧⣢        ⡇   ⣤⠂⡟⡟⣈⡳⡀  ⡀       ',
    '      ⠛⠸⣻⡘  ⡀⡀⣜⣇⡄   ⣧⡧⣿⣿⣿⣻⣇  ⠄       ',
    '⠐⠂⠐⢓⣶⢾⡿⣵⣖⡓⣒⢈⠛⣁⣞⣭⣏⣿⣿⣿⣦⣿⡕⣘⣥⡀⢠⡀  ',
    '      ⠸⠂⠑⠋⠉⣳⣭⣿⡋⡹⠉⠠⠷⣿⣿⣶⣲⠓⣿⡟⠛⠛⠋        ',
    '         ⠘⠿  ⠟⣞⡌⠗  ⢺⣞⢯⡇   ⠁            ',
    '      ⢰⣋⣂⣀ ⠰⢷⠿⠁   ⣤⢺⢋⣁      ⡄       ',
    '    ⣠⠛⠉  ⣔⠛⣶⡟⡲    ⢈⠸⣿⠃      ⡇       ',
    '   ⢰⠂    ⡨⢭⢿⠋⡱⣀⡀  ⢸ ⡿       ⡆       ',
    '   ⠸      ⠉ ⢳⣧⡛⠉⠉⠳⡘ ⡽⠈⡄ ⡀ ⢀⣇       ',
    '        ⢀⠐⠜⢼⡤ ⣠⠰⠳⠠⣸⢀⠃     ⢏⣗⡑    ',
    '      ⢀⣀ ⢸   ⢸⠔⢄⡀   ⡇⡻⠋   ⠉⠉⢹⣋⠇⢀⢀  ',
    '⠐⠂⠒⠒⠒⠒⠒⠛⠓⢫⠛⢻⡱⠛⠫⣺⢽⣧⡧⢾⠈⡈⠈⠉⢻⢸⢵⣈⠺⠋    ',
    '      ⠈  ⠰⡄   ⠸⣲⡌⢿⣾⡰⡃⢀⡤⠼⣽⣮⢣⠅⠤⠄⢀⠆  ',
    '        ⠈⠉⠁ ⠘⠥⡍⣿⠟⠱⣒⣬⣤⡃⠼⣥⡤⠄⠊⠁   ',
    '             ⠃⡿⠁  ⠚    ⠈⢻⠂      ',
    '             ⠃⣻           ⢸         ',
    '             ⠂⡟           ⢸         ',
    '             ⡧⣾⠄          ⠘         ',
    '             ⡇⡟                      ',
    '             ⣷⠇                      ',
    '             ⣷⡅                      ',
    '             ⣯⣗                      ',
    '             ⣗⡗                      ',
    '             ⡷⡇                      ',
    '             ⣯⡇                      ',
    '             ⣿⡇                      ',
    '             ⣵⡅                      ',
    '             ⣿⠂                      ',
    '             ⢻                        ',
    '             ⢸                        ',
    '             ⢸                        ',
    '             ⢨                        ',
    '             ⢸                        ',
    '             ⢸                        ',
    '             ⢸                        ',
    '             ⠸                        '
  ]
];

const ASCII_PARALLAX = 0.65;

export default function CelestialJump() {
  const canvasRef = useRef(null);
  const snowCanvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [shakeActive, setShakeActive] = useState(false);
  const [musicEnabled, setMusicEnabled] = useState(true);

  const gameStateRef = useRef(null);
  const isGameOverRef = useRef(false);
  const deathAnimationRef = useRef({
    active: false,
    startTime: 0,
    duration: 500,
    pendingGameOver: false,
    cause: null
  });

  // ---- 只保留这两个音效：BGM + 踩怪 ----
  const BGM_VOLUME = 0.4;
  const bgmRef = useRef(null);
  const bgmStartedRef = useRef(false);
  const bgmFadeIntervalRef = useRef(null);
  const startBgmIfNeededRef = useRef(() => {});
  const stompPoolRef = useRef(null);
  const lastMonsterSoundRef = useRef(0);
  const lastStompIndexRef = useRef(-1);
  const shakeTimeoutRef = useRef(null);
  const warmStompedRef = useRef(false);
  const musicEnabledRef = useRef(true);
  const asciiBgRef = useRef(null);
  const asciiPendingRef = useRef(false);
  const asciiCacheRef = useRef(new Map());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const snowCanvas = snowCanvasRef.current;
    const snowCtx = snowCanvas?.getContext('2d');

    // ========= 工具函数：音效池 =========
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
          const p = audio.play();
          if (p && p.catch) p.catch(() => { });
        } catch (e) { }
      };

      const warm = () => {
        pool.forEach((audio) => {
          try {
            audio.pause();
            audio.currentTime = 0;
            audio.load(); // 仅预加载，不播放，避免首次卡顿/误触发
          } catch (e) { }
        });
      };

      return { pool, play, warm };
    };

    // ========= ASCII 预渲染 =========
    const bakeAscii = (lines) => {
      const cacheKey = lines.join('\n');
      if (asciiCacheRef.current.has(cacheKey)) {
        return asciiCacheRef.current.get(cacheKey);
      }

      const measureCanvas = document.createElement('canvas');
      const measureCtx = measureCanvas.getContext('2d');
      const padding = 12;
      let fontSize = 14;

      measureCtx.font = `${fontSize}px monospace`;
      const lineWidths = lines.map((l) => measureCtx.measureText(l).width);
      const maxLineWidth = Math.max(...lineWidths, 1);

      const available = canvas.width / dpr - padding * 2;
      if (maxLineWidth > available) {
        const scale = available / maxLineWidth;
        fontSize = Math.max(10, Math.floor(fontSize * scale));
      }

      measureCtx.font = `${fontSize}px monospace`;
      const lineHeight = Math.round(fontSize * 1.25);
      const widths = lines.map((l) => measureCtx.measureText(l).width);
      const w = Math.min(
        canvas.width / dpr - padding * 2,
        Math.max(...widths, 1)
      ) + padding * 2;
      const h = lineHeight * lines.length + padding * 2;

      const off =
        typeof OffscreenCanvas !== 'undefined'
          ? new OffscreenCanvas(Math.ceil(w), Math.ceil(h))
          : (() => {
              const c = document.createElement('canvas');
              c.width = Math.ceil(w);
              c.height = Math.ceil(h);
              return c;
            })();

      const ctxOff = off.getContext('2d');
      ctxOff.fillStyle = 'rgba(24, 38, 70, 0.28)';
      ctxOff.font = `${fontSize}px monospace`;
      ctxOff.textBaseline = 'top';
      lines.forEach((line, i) => {
        ctxOff.fillText(line, padding, padding + i * lineHeight);
      });

      const baked = { bitmap: off, width: Math.ceil(w), height: Math.ceil(h) };
      asciiCacheRef.current.set(cacheKey, baked);
      return baked;
    };

    // ========= BGM：只创建，不自动播放 =========
    const bgm = new Audio('/sounds/backgroundmusic_iceice.mp3');
    bgm.loop = true;
    bgm.volume = BGM_VOLUME;
    bgm.preload = 'auto';
    bgmRef.current = bgm;

    // ========= 踩怪音效：多音色轮播 =========
    const stompSounds = [
      '/sounds/jump_on_monsters_sound_808.mp3',
      '/sounds/jump_on_monsters_sound_snare.mp3',
      '/sounds/jump_on_monsters_sound_CHH.mp3',
      '/sounds/jump_on_monsters_sound_OHH.mp3',
      '/sounds/jump_on_monsters_sound_laser.mp3'
    ];
    stompPoolRef.current = stompSounds.map((path) => createAudioPool(path, 0.55, 3));

    // 用户第一次按键 / 触摸时启动 BGM
    const startBgmIfNeeded = () => {
      if (!musicEnabledRef.current) return;
      const audio = bgmRef.current;
      if (!audio || bgmStartedRef.current) return;

      audio.currentTime = 0;
      audio.volume = BGM_VOLUME;

      const playPromise = audio.play();
      if (playPromise && playPromise.then) {
        playPromise
          .then(() => {
            bgmStartedRef.current = true;
          })
          .catch(() => {
            // 如果被浏览器拦截，下次再试
            bgmStartedRef.current = false;
          });
      } else {
        bgmStartedRef.current = true;
      }
    };

    startBgmIfNeededRef.current = startBgmIfNeeded;

    // game over 时 0.5s 渐隐 BGM
    const fadeOutBgm = (durationMs = 500) => {
      const audio = bgmRef.current;
      if (!audio || !bgmStartedRef.current) return;

      if (bgmFadeIntervalRef.current) {
        clearInterval(bgmFadeIntervalRef.current);
      }

      const steps = 10;
      const stepDuration = durationMs / steps;
      let currentStep = 0;

      bgmFadeIntervalRef.current = setInterval(() => {
        currentStep += 1;
        const factor = 1 - currentStep / steps;
        audio.volume = Math.max(BGM_VOLUME * factor, 0);

        if (currentStep >= steps) {
          clearInterval(bgmFadeIntervalRef.current);
          bgmFadeIntervalRef.current = null;
          audio.pause();
          audio.currentTime = 0;
          audio.volume = BGM_VOLUME;
          bgmStartedRef.current = false;
        }
      }, stepDuration);
    };

    const warmStompSounds = () => {
      if (warmStompedRef.current) return;
      warmStompedRef.current = true;
      const pools = stompPoolRef.current;
      if (!pools) return;
      pools.forEach((p) => p?.warm?.());
    };

    const playStompSound = () => {
      warmStompSounds();
      const pools = stompPoolRef.current;
      if (!pools || pools.length === 0) return;

      const now = performance.now();
      if (now - lastMonsterSoundRef.current < 140) return; // 更长冷却避免双触发
      lastMonsterSoundRef.current = now;

      let idx = Math.floor(Math.random() * pools.length);
      if (pools.length > 1 && idx === lastStompIndexRef.current) {
        idx = (idx + 1) % pools.length; // 避免连续同一个音效
      }
      lastStompIndexRef.current = idx;
      pools[idx].play();
    };

    const triggerScreenShake = () => {
      if (shakeTimeoutRef.current) {
        clearTimeout(shakeTimeoutRef.current);
      }
      setShakeActive(true);
      shakeTimeoutRef.current = setTimeout(() => {
        setShakeActive(false);
        shakeTimeoutRef.current = null;
      }, 160);
    };

    // ========= Canvas / 游戏逻辑 =========
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 1.8);

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (snowCanvas && snowCtx) {
        snowCanvas.width = window.innerWidth * dpr;
        snowCanvas.height = window.innerHeight * dpr;
        snowCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const GRAVITY = 0.2;
    const JUMP_FORCE = -10.5;
    const PLAYER_SIZE = 30;
    const PLATFORM_WIDTH = 80;
    const PLATFORM_HEIGHT = 12;
    const FINAL_SCORE = 50000;
    const MIN_HORIZONTAL_GAP = 12;
    const MIN_VERTICAL_GAP = 35;
    const SPAWN_BUFFER_Y = -200;

    const player = {
      x: canvas.width / (2 * dpr) - PLAYER_SIZE / 2,
      y: (canvas.height / dpr) * 0.7,
      width: PLAYER_SIZE,
      height: PLAYER_SIZE,
      velocityY: 0,
      velocityX: 0,
      rotation: 0,
      rotationSpeed: 0.05
    };

    const platforms = [];
    const icePlatforms = new Set();
    let cameraY = 0;
    let finalPlateauReached = false;

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

      // 初始平台
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
      monsterShakes.clear();
    };

    const clearAsciiBg = () => {
      asciiBgRef.current = null;
      asciiPendingRef.current = false;
    };

    initPlatforms();
    initMonsters();
    clearAsciiBg();

    const keys = {};
    let touchStartX = 0;
    let touchX = 0;

    const handleKeyDown = (e) => {
      startBgmIfNeeded();
      warmStompSounds();
      keys[e.key] = true;
    };

    const handleKeyUp = (e) => {
      keys[e.key] = false;
    };

    const handleTouchStart = (e) => {
      startBgmIfNeeded();
      warmStompSounds();
      touchStartX = e.touches[0].clientX;
      touchX = e.touches[0].clientX;
    };

    const handleTouchMove = (e) => {
      touchX = e.touches[0].clientX;
    };

    const handleTouchEnd = () => {
      touchX = 0;
    };

    const handleGlobalInteraction = () => {
      startBgmIfNeeded();
      warmStompSounds();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('pointerdown', handleGlobalInteraction, { once: false });
    window.addEventListener('pointerup', handleGlobalInteraction, { once: false });
    window.addEventListener('click', handleGlobalInteraction, { once: false });
    window.addEventListener('touchstart', handleGlobalInteraction, { once: false });
    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchmove', handleTouchMove);
    canvas.addEventListener('touchend', handleTouchEnd);

    // ========= 绘制 =========
    const drawStar = (x, y, size, rotation) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);

      const gradient = ctx.createRadialGradient(
        0,
        0,
        size * 0.3,
        0,
        0,
        size * 1.5
      );
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
      ctx.roundRect(platform.x, platform.y, platform.width, platform.height, 6);
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

    // ========= 主循环 =========
    let animationId = null;
    let currentScore = 0;
    let lastTime = 0;
    const FIXED_TIMESTEP = 1000 / 60;
    let accumulator = 0;

    const finalizeGameOver = () => {
      if (isGameOverRef.current) return;

      isGameOverRef.current = true;
      deathAnimationRef.current.active = false;
      deathAnimationRef.current.pendingGameOver = false;
      setGameOver(true);
      fadeOutBgm(500);
      if (currentScore > highScore) {
        setHighScore(Math.floor(currentScore));
      }
      if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
    };

    const startMonsterDeath = (time) => {
      if (deathAnimationRef.current.active || isGameOverRef.current) return;

      deathAnimationRef.current = {
        active: true,
        startTime: time,
        pauseDuration: 300,
        fallDuration: 700,
        fallStartTime: null,
        pendingGameOver: false,
        cause: 'monster'
      };
      player.velocityY = 0;
      player.velocityX = 0;
      player.rotationSpeed = 0.18;
    };

    const updateGame = (time) => {
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;

      if (deathAnimationRef.current.active) {
        const anim = deathAnimationRef.current;
        const elapsed = time - anim.startTime;

        if (elapsed < anim.pauseDuration) {
          player.rotation += player.rotationSpeed * 0.6;
          return;
        }

        if (!anim.fallStartTime) {
          anim.fallStartTime = time;
          player.velocityY = Math.max(player.velocityY, 10);
        }

        player.velocityY += GRAVITY * 2.4;
        player.y += player.velocityY;
        player.rotation += player.rotationSpeed;

        const fallElapsed = time - anim.fallStartTime;
        if (fallElapsed >= anim.fallDuration || player.y > height + 80) {
          anim.active = false;
          anim.pendingGameOver = true;
        }
        return;
      }

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
      player.rotation += player.rotationSpeed;

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

      // 相机 / 计分
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

    let maxMonsters = 0;
    if (currentScore >= 20000) maxMonsters = 4;
    else if (currentScore >= 10000) maxMonsters = 3;
    else if (currentScore >= 5000) maxMonsters = 2;

      if (
        currentScore >= 5000 &&
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

              if (
                longFluffyChars.includes(selectedChar) &&
                currentLongCount >= 2
              ) {
                const shortFluffyChars = fluffyChars.slice(0, 2);
                selectedChar =
                  shortFluffyChars[
                  Math.floor(Math.random() * shortFluffyChars.length)
                  ];
              }
            }

            monsters.push({
              x: newX,
              y: spawnY,
              width: 50,
              height: 50,
              type: isChinese ? 'chinese' : 'fluffy',
              char: selectedChar,
              color: isChinese
                ? '#fff'
                : Math.random() > 0.5
                  ? '#e0f2fe'
                  : '#fff',
              bobOffset: Math.random() * Math.PI * 2,
              rotation: Math.random() * Math.PI * 2,
              hit: false
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

      let stompedThisFrame = false;

      for (let i = monsters.length - 1; i >= 0; i--) {
        const monster = monsters[i];
        if (monster.hit) continue;

        if (
          player.x + player.width > monster.x &&
          player.x < monster.x + monster.width &&
          player.y + player.height > monster.y &&
          player.y < monster.y + monster.height
        ) {
          if (player.y + player.height <= monster.y + monster.height) {
            // 从上方踩中怪物：跳起来 + 播放 stomp 音效
            if (stompedThisFrame) continue;
            stompedThisFrame = true;
            player.velocityY = JUMP_FORCE;
            playStompSound();
            monster.hit = true;
            monsterShakes.set(monster, { startTime: time, duration: 200 });

            setTimeout(() => {
              const idx = monsters.indexOf(monster);
              if (idx > -1) {
                monsters.splice(idx, 1);
                monsterShakes.delete(monster);
              }
            }, 100);
          } else {
            // 被怪物撞死：播放下落动画，稍后再结束
            startMonsterDeath(time);
            triggerScreenShake();
            return;
          }
        }
      }

      if (player.y > height + 50) {
        finalizeGameOver();
      }

      // ASCII 背景触发：达到阈值时若无背景则直接生成
      const asciiThreshold = 1000;
      if (
        !asciiBgRef.current &&
        !asciiPendingRef.current &&
        currentScore >= asciiThreshold
      ) {
        const pick = Math.floor(Math.random() * ASCII_BACKGROUNDS.length);
        const lines = ASCII_BACKGROUNDS[pick];
        const baked = bakeAscii(lines);
        // 保证生成时在屏幕顶外：随着 cameraY 增长，自然从顶部滚入
        const spawnWorldY = -(cameraY * ASCII_PARALLAX) - baked.height - 160;
        asciiBgRef.current = { ...baked, worldY: spawnWorldY };
        asciiPendingRef.current = true;
      }
    };

    const renderGame = (time) => {
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;
      const snowWidth = snowCanvas ? snowCanvas.width / dpr : width;
      const snowHeight = snowCanvas ? snowCanvas.height / dpr : height;

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

        const r2 = Math.round(
          bottomStart.r + (bottomEnd.r - bottomStart.r) * progress
        );
        const g2 = Math.round(
          bottomStart.g + (bottomEnd.g - bottomStart.g) * progress
        );
        const b2 = Math.round(
          bottomStart.b + (bottomEnd.b - bottomStart.b) * progress
        );

        bgGradient.addColorStop(0, `rgb(${r1}, ${g1}, ${b1})`);
        bgGradient.addColorStop(1, `rgb(${r2}, ${g2}, ${b2})`);
      } else {
        bgGradient.addColorStop(0, '#4a1a1a');
        bgGradient.addColorStop(1, '#5c1a1a');
      }

      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      if (snowCtx && snowCanvas) {
        snowCtx.clearRect(0, 0, snowWidth, snowHeight);

        const baseSnowChance = currentScore >= 10000 ? 0.035 : 0;
        if (baseSnowChance > 0 && Math.random() < baseSnowChance) {
          snowflakes.push({
            x: Math.random() * snowWidth,
            y: -snowHeight * 0.02 - Math.random() * 40,
            speed: 0.5 + Math.random() * 1.2,
            size: 2 + Math.random() * 2.4,
            opacity: 0.3 + Math.random() * 0.45
          });
        }

        snowCtx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        for (let i = snowflakes.length - 1; i >= 0; i--) {
          const flake = snowflakes[i];
          flake.y += flake.speed;

          snowCtx.globalAlpha = flake.opacity;
          snowCtx.beginPath();
          snowCtx.arc(flake.x, flake.y, flake.size, 0, Math.PI * 2);
          snowCtx.fill();

          if (flake.y > snowHeight + 10) {
            snowflakes.splice(i, 1);
          }
        }
        snowCtx.globalAlpha = 1;
      }

      // ASCII 背景：居中，随 cameraY 被动滚动
      if (asciiBgRef.current) {
        const { bitmap, width: bw, height: bh, worldY } = asciiBgRef.current;
        const screenY = worldY + cameraY * ASCII_PARALLAX;
        const screenX = (width - bw) / 2;

        if (screenY > height) {
          asciiBgRef.current = null;
          asciiPendingRef.current = false;
        } else if (screenY + bh >= 0) {
          ctx.drawImage(bitmap, screenX, screenY);
        }
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

      if (accumulator > 200) accumulator = FIXED_TIMESTEP;

      while (accumulator >= FIXED_TIMESTEP && !isGameOverRef.current) {
        updateGame(time);
        accumulator -= FIXED_TIMESTEP;
      }

      if (!isGameOverRef.current) {
        renderGame(time);

        if (deathAnimationRef.current.pendingGameOver && !isGameOverRef.current) {
          deathAnimationRef.current.pendingGameOver = false;
          finalizeGameOver();
          return;
        }

        animationId = requestAnimationFrame(gameLoop);
      }
    };

    gameStateRef.current = {
      restart: () => {
        if (animationId) {
          cancelAnimationFrame(animationId);
          animationId = null;
        }

        // 重置 BGM（下次按键 / 触摸会重新开始）
        if (bgmFadeIntervalRef.current) {
          clearInterval(bgmFadeIntervalRef.current);
          bgmFadeIntervalRef.current = null;
        }
        if (bgmRef.current) {
          bgmRef.current.pause();
          bgmRef.current.currentTime = 0;
          bgmRef.current.volume = BGM_VOLUME;
        }
        bgmStartedRef.current = false;
        musicEnabledRef.current = true;
        setMusicEnabled(true);

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
      player.rotationSpeed = 0.05;
      deathAnimationRef.current = {
        active: false,
        startTime: 0,
        duration: 500,
        pendingGameOver: false,
        cause: null
      };
      setShakeActive(false);
      if (shakeTimeoutRef.current) {
        clearTimeout(shakeTimeoutRef.current);
        shakeTimeoutRef.current = null;
      }
      clearAsciiBg();

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
      window.removeEventListener('pointerdown', handleGlobalInteraction);
      window.removeEventListener('pointerup', handleGlobalInteraction);
      window.removeEventListener('click', handleGlobalInteraction);
      window.removeEventListener('touchstart', handleGlobalInteraction);
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
      if (animationId) cancelAnimationFrame(animationId);

      if (bgmFadeIntervalRef.current) {
        clearInterval(bgmFadeIntervalRef.current);
        bgmFadeIntervalRef.current = null;
      }
      if (bgmRef.current) {
        bgmRef.current.pause();
        bgmRef.current.currentTime = 0;
      }
      if (shakeTimeoutRef.current) {
        clearTimeout(shakeTimeoutRef.current);
        shakeTimeoutRef.current = null;
      }

      startBgmIfNeededRef.current = () => {};
    };
  }, [highScore]);

  const handleRestart = () => {
    startBgmIfNeededRef.current?.();
    if (gameStateRef.current) {
      gameStateRef.current.restart();
    }
  };

  return (
    <div
      className={`w-full bg-gradient-to-b from-[#f7f9fc] via-[#f1f4fb] to-[#e6ebf5] flex flex-col items-center justify-start overflow-hidden select-none relative ${shakeActive ? 'screen-shake' : ''
        }`}
      style={{
        minHeight: '100dvh',
        paddingTop: 'max(12px, calc(env(safe-area-inset-top, 0px) + 12px))',
        paddingBottom: 'max(44px, calc(env(safe-area-inset-bottom, 0px) + 36px))'
      }}
    >
      <canvas
        ref={snowCanvasRef}
        className="pointer-events-none fixed inset-0 w-full h-full z-40"
        aria-hidden
      />

      <div className="max-w-md w-full px-4 relative z-20">
        {/* 顶部标题：上下两行 + 左右大星星 */}
        <div className="mt-1 mb-3 flex items-center justify-center gap-5">
          <button
            type="button"
            onClick={() => {
              const next = !musicEnabledRef.current;
              musicEnabledRef.current = next;
              setMusicEnabled(next);
              if (!next) {
                if (bgmRef.current) {
                  bgmRef.current.pause();
                  bgmRef.current.currentTime = 0;
                  bgmStartedRef.current = false;
                }
              } else {
                startBgmIfNeededRef.current?.();
              }
            }}
            className="transition-transform duration-200 focus:outline-none"
            style={{ transform: 'rotate(-12deg)' }}
            aria-label="Toggle music"
          >
            <span
              className={`text-[2.3rem] md:text-[2.6rem] leading-none inline-block ${musicEnabled ? 'text-slate-800' : 'text-slate-400'}`}
            >
              𝄞
            </span>
          </button>
          <h1 className="font-henny-penny text-[2.2rem] md:text-[2.6rem] leading-[1.05] tracking-[0.28em] text-slate-900 text-center drop-shadow-sm">
            CELESTIAL
            <br />
            JUMP
          </h1>
          <button
            type="button"
            onClick={() => {
              const next = !musicEnabledRef.current;
              musicEnabledRef.current = next;
              setMusicEnabled(next);
              if (!next) {
                if (bgmRef.current) {
                  bgmRef.current.pause();
                  bgmRef.current.currentTime = 0;
                  bgmStartedRef.current = false;
                }
              } else {
                startBgmIfNeededRef.current?.();
              }
            }}
            className="transition-transform duration-200 focus:outline-none"
            style={{ transform: 'rotate(12deg)' }}
            aria-label="Toggle music"
          >
            <span
              className={`text-[2.3rem] md:text-[2.6rem] leading-none inline-block ${musicEnabled ? 'text-slate-800' : 'text-slate-400'}`}
            >
              𝄞
            </span>
          </button>
        </div>

        {/* 分数栏 */}
        <div className="flex justify-between items-center mb-3 px-6 text-slate-700">
          <div className="text-center">
            <p className="text-[11px] font-semibold text-slate-500 tracking-[0.24em] uppercase mb-1">
              Score
            </p>
            <p
              className="text-3xl font-normal text-slate-800 tabular-nums"
              style={{ fontFamily: 'Arial, sans-serif' }}
            >
              {score}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[11px] font-semibold text-slate-500 tracking-[0.24em] uppercase mb-1">
              Best
            </p>
            <p
              className="text-3xl font-normal text-slate-800 tabular-nums"
              style={{ fontFamily: 'Arial, sans-serif' }}
            >
              {highScore}
            </p>
          </div>
        </div>

        {/* 游戏画布 */}
        <div className="relative overflow-hidden rounded-[28px] border border-white/80 shadow-[0_22px_50px_rgba(15,23,42,0.18)] bg-gradient-to-b from-white via-white/95 to-[#eef3fb] backdrop-blur-xl mb-4">
          <canvas
            ref={canvasRef}
            className="w-full block"
            style={{ height: 'clamp(520px, 68vh, 680px)' }}
          />

          {gameOver && (
            <div className="absolute inset-0 bg-white/95 backdrop-blur-md flex flex-col items-center justify-center">
              <div className="text-center space-y-6 px-8">
                <h2 className="text-3xl font-normal text-gray-800 tracking-wide font-henny-penny">
                  {score < 500
                    ? 'are you retarded or sum?'
                    : score < 2000
                      ? "you can't be real"
                      : score < 5000
                        ? 'not so smart gng'
                        : score >= 40000
                          ? 'lets die in a beautiful winter'
                          : score >= 20000
                            ? 'Well done. Now go get some rest gang'
                            : score >= 10000
                              ? 'Have you seen the snow?'
                              : 'not so smart gng'}
            </h2>

            <div className="space-y-2">
              <p className="text-sm text-gray-500 tracking-wider uppercase">Final Score</p>
              <p
                className="text-6xl font-normal text-gray-900 tabular-nums"
                style={{ fontFamily: 'Arial, sans-serif' }}
              >
                {score}
              </p>
            </div>
            <Button
              onClick={handleRestart}
              className="bg-white/18 text-gray-900 px-8 py-6 rounded-full text-lg font-semibold shadow-[0_8px_22px_rgba(0,0,0,0.08)] border border-white/50 hover:bg-white/30 hover:shadow-[0_10px_28px_rgba(0,0,0,0.12)] backdrop-blur-xl transition-all duration-300"
              style={{ fontFamily: '"Arial Rounded MT Bold","Arial Rounded MT","Arial",sans-serif' }}
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
