/**
 * LOTTO LUXE 6/45 - Premium Interactive Web Application
 * Features:
 * - Realtime 2D Physics Lottery Drum Simulation (Canvas)
 * - Pure Web Audio API Sound Synthesizer (Zero external dependencies)
 * - Multiple AI & Statistical Recommendation Strategies
 * - Dream & Saju Fortune Analysis with deterministic hash mapping
 * - Interactive Fixed / Excluded Numbers Grid
 * - Smart Pattern Analysis (Sum, Odd/Even, High/Low, Sequences)
 * - Canvas Lottery Slip (Receipt) PNG Generator
 * - Virtual Winning Simulator with Realtime Match Highlighting
 * - LocalStorage Saved Tickets Drawer
 * - High Performance Confetti Celebration Particle Engine
 */

(function () {
    'use strict';

    // ==========================================
    // 1. CONFIG & STATISTICAL CONSTANTS
    // ==========================================
    
    // Donghaeng Lottery cumulative frequencies (historical weights approx 1~45)
    const LOTTO_WEIGHTS = {
        1: 178, 2: 168, 3: 172, 4: 173, 5: 160, 6: 170, 7: 173, 8: 161, 9: 142, 10: 165,
        11: 171, 12: 184, 13: 180, 14: 175, 15: 167, 16: 169, 17: 181, 18: 183, 19: 165, 20: 179,
        21: 171, 22: 146, 23: 148, 24: 171, 25: 159, 26: 174, 27: 186, 28: 149, 29: 150, 30: 163,
        31: 168, 32: 153, 33: 179, 34: 191, 35: 170, 36: 166, 37: 174, 38: 172, 39: 173, 40: 172,
        41: 152, 42: 164, 43: 188, 44: 167, 45: 175
    };

    // Hot & Cold Number arrays
    const HOT_NUMBERS = [34, 43, 27, 12, 18, 17, 13, 20, 33, 1, 14, 26, 37, 7, 4, 39, 45, 11, 21, 24];
    const COLD_NUMBERS = [9, 22, 23, 28, 29, 41, 32, 25, 5, 8, 30, 42, 10, 19, 36, 15, 44, 2, 31, 16];

    // Dream interpretations keywords
    const DREAM_KEYWORDS = [
        { key: '돼지', fortune: '재물운이 폭발하는 대길몽! 집안에 큰 재물과 뜻밖의 횡재가 들어오는 강력한 조합입니다.' },
        { key: '용', fortune: '권세와 최고의 명예를 상징하는 용꿈! 인생의 판도를 바꿀 엄청난 행운의 기운이 깃들어 있습니다.' },
        { key: '불', fortune: '모든 액운을 태우고 불길처럼 활활 타오르는 사업운과 번영의 에너지가 번호에 응축되었습니다.' },
        { key: '물', fortune: '막힘없이 유연하게 흘러들어오는 재물복과 청정한 기운이 복권을 밝혀줍니다.' },
        { key: '조상', fortune: '조상님의 보살핌과 은덕으로 예기치 못한 큰 은혜와 은총을 입게 될 조합입니다.' },
        { key: '똥', fortune: '전통적인 최상의 재물 징조! 만지는 것마다 황금으로 변하는 파격적인 금전운입니다.' },
        { key: '금', fortune: '순금처럼 단단하고 빛나는 재복의 에너지가 숫자 사이사이에 배치되었습니다.' },
        { key: '하늘', fortune: '천운이 닿는 날입니다. 소망하던 큰 뜻이 이루어지는 고귀한 조합입니다.' }
    ];

    // ==========================================
    // 2. STATE MANAGEMENT
    // ==========================================
    const state = {
        theme: localStorage.getItem('lotto_theme') || 'dark',
        mode: 'random', // 'random', 'hot', 'cold', 'balanced', 'dream', 'custom'
        gameCount: 5,
        isDynamic: true,
        soundEnabled: localStorage.getItem('lotto_sound') !== 'false',
        fixedNumbers: new Set(),
        excludedNumbers: new Set(),
        currentResults: [],
        savedTickets: JSON.parse(localStorage.getItem('lotto_saved_tickets') || '[]'),
        isGenerating: false,
        virtualWinning: null
    };

    // ==========================================
    // 3. SOUND SYNTHESIZER (WEB AUDIO API)
    // ==========================================
    class SoundEngine {
        constructor() {
            this.ctx = null;
        }

        initContext() {
            if (!this.ctx) {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                if (AudioCtx) {
                    this.ctx = new AudioCtx();
                }
            }
            if (this.ctx && this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
        }

        playTumble() {
            if (!state.soundEnabled || !this.ctx) return;
            try {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                const now = this.ctx.currentTime;
                
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(120 + Math.random() * 80, now);
                osc.frequency.exponentialRampToValueAtTime(50, now + 0.05);

                gain.gain.setValueAtTime(0.04, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

                osc.connect(gain);
                gain.connect(this.ctx.destination);

                osc.start(now);
                osc.stop(now + 0.05);
            } catch (e) {
                // Ignore audio errors
            }
        }

        playChime(index = 0) {
            if (!state.soundEnabled || !this.ctx) return;
            try {
                const pentatonic = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50, 1174.66];
                const freq = pentatonic[index % pentatonic.length];
                
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                const now = this.ctx.currentTime;

                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now);

                gain.gain.setValueAtTime(0.12, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

                osc.connect(gain);
                gain.connect(this.ctx.destination);

                osc.start(now);
                osc.stop(now + 0.35);
            } catch (e) {}
        }

        playFanfare() {
            if (!state.soundEnabled || !this.ctx) return;
            try {
                const notes = [523.25, 659.25, 783.99, 1046.50];
                notes.forEach((freq, i) => {
                    setTimeout(() => {
                        if (!this.ctx) return;
                        const osc = this.ctx.createOscillator();
                        const gain = this.ctx.createGain();
                        const now = this.ctx.currentTime;

                        osc.type = 'triangle';
                        osc.frequency.setValueAtTime(freq, now);

                        gain.gain.setValueAtTime(0.15, now);
                        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

                        osc.connect(gain);
                        gain.connect(this.ctx.destination);

                        osc.start(now);
                        osc.stop(now + 0.6);
                    }, i * 110);
                });
            } catch (e) {}
        }
    }

    const sound = new SoundEngine();

    // ==========================================
    // 4. LOTTERY DRUM PHYSICS SIMULATION (CANVAS)
    // ==========================================
    class LottoMachine {
        constructor(canvasId) {
            this.canvas = document.getElementById(canvasId);
            if (!this.canvas) return;
            this.ctx = this.canvas.getContext('2d');
            this.width = this.canvas.width;
            this.height = this.canvas.height;
            this.centerX = this.width / 2;
            this.centerY = this.height / 2;
            this.globeRadius = (this.width / 2) - 10;
            this.isSpinning = false;
            this.balls = [];

            this.initBalls();
            this.bindEvents();
            this.animate();
        }

        getBallColor(num) {
            if (num <= 10) return { base: '#f59e0b', light: '#fef08a' };
            if (num <= 20) return { base: '#0284c7', light: '#7dd3fc' };
            if (num <= 30) return { base: '#ef4444', light: '#fca5a5' };
            if (num <= 40) return { base: '#64748b', light: '#cbd5e1' };
            return { base: '#22c55e', light: '#86efac' };
        }

        initBalls() {
            this.balls = [];
            for (let i = 1; i <= 45; i++) {
                const angle = Math.random() * Math.PI * 2;
                const r = Math.random() * (this.globeRadius - 25);
                this.balls.push({
                    number: i,
                    x: this.centerX + Math.cos(angle) * r,
                    y: this.centerY + Math.sin(angle) * r,
                    vx: (Math.random() - 0.5) * 2,
                    vy: (Math.random() - 0.5) * 2,
                    radius: 8.5,
                    color: this.getBallColor(i)
                });
            }
        }

        bindEvents() {
            // Interactive mouse hover agitation
            const handlePerturb = (clientX, clientY) => {
                const rect = this.canvas.getBoundingClientRect();
                const mouseX = (clientX - rect.left) * (this.width / rect.width);
                const mouseY = (clientY - rect.top) * (this.height / rect.height);

                this.balls.forEach(ball => {
                    const dx = ball.x - mouseX;
                    const dy = ball.y - mouseY;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 55) {
                        const force = (55 - dist) / 55;
                        ball.vx += (dx / dist) * force * 5;
                        ball.vy += (dy / dist) * force * 5;
                    }
                });
            };

            this.canvas.addEventListener('mousemove', (e) => handlePerturb(e.clientX, e.clientY));
            this.canvas.addEventListener('touchmove', (e) => {
                if (e.touches.length > 0) {
                    handlePerturb(e.touches[0].clientX, e.touches[0].clientY);
                }
            }, { passive: true });
        }

        setSpinning(spinning) {
            this.isSpinning = spinning;
        }

        update() {
            const gravity = this.isSpinning ? 0.08 : 0.25;

            this.balls.forEach(ball => {
                if (this.isSpinning) {
                    // Wind turbulence swirling in the machine
                    const angle = Math.atan2(ball.y - this.centerY, ball.x - this.centerX);
                    const speed = 7 + Math.random() * 6;
                    ball.vx += -Math.sin(angle) * speed * 0.12 + (Math.random() - 0.5) * 3.5;
                    ball.vy += Math.cos(angle) * speed * 0.12 + (Math.random() - 0.5) * 3.5 - 0.4;
                } else {
                    ball.vy += gravity;
                }

                // Apply velocity
                ball.x += ball.vx;
                ball.y += ball.vy;

                // Air resistance damping
                ball.vx *= 0.985;
                ball.vy *= 0.985;

                // Circular Boundary Collision
                const dx = ball.x - this.centerX;
                const dy = ball.y - this.centerY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const maxDist = this.globeRadius - ball.radius;

                if (dist > maxDist) {
                    const nx = dx / dist;
                    const ny = dy / dist;
                    ball.x = this.centerX + nx * maxDist;
                    ball.y = this.centerY + ny * maxDist;

                    // Reflect velocity
                    const dot = ball.vx * nx + ball.vy * ny;
                    ball.vx = (ball.vx - 2 * dot * nx) * 0.75;
                    ball.vy = (ball.vy - 2 * dot * ny) * 0.75;

                    if (this.isSpinning && Math.random() < 0.15) {
                        sound.playTumble();
                    }
                }
            });
        }

        draw() {
            this.ctx.clearRect(0, 0, this.width, this.height);

            // Center air blower turbine glow effect
            if (this.isSpinning) {
                const glowGrad = this.ctx.createRadialGradient(
                    this.centerX, this.centerY + 50, 5,
                    this.centerX, this.centerY + 50, 70
                );
                glowGrad.addColorStop(0, 'rgba(251, 191, 36, 0.4)');
                glowGrad.addColorStop(1, 'rgba(251, 191, 36, 0)');
                this.ctx.fillStyle = glowGrad;
                this.ctx.beginPath();
                this.ctx.arc(this.centerX, this.centerY + 50, 70, 0, Math.PI * 2);
                this.ctx.fill();
            }

            // Draw balls
            this.balls.forEach(ball => {
                // Ball Shadow
                this.ctx.beginPath();
                this.ctx.arc(ball.x + 1.5, ball.y + 2, ball.radius, 0, Math.PI * 2);
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
                this.ctx.fill();

                // Ball 3D Gradient Sphere
                const grad = this.ctx.createRadialGradient(
                    ball.x - ball.radius * 0.3,
                    ball.y - ball.radius * 0.3,
                    ball.radius * 0.1,
                    ball.x,
                    ball.y,
                    ball.radius
                );
                grad.addColorStop(0, ball.color.light);
                grad.addColorStop(0.6, ball.color.base);
                grad.addColorStop(1, '#0f172a');

                this.ctx.beginPath();
                this.ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
                this.ctx.fillStyle = grad;
                this.ctx.fill();

                // Specular glint
                this.ctx.beginPath();
                this.ctx.arc(ball.x - ball.radius * 0.35, ball.y - ball.radius * 0.35, ball.radius * 0.28, 0, Math.PI * 2);
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                this.ctx.fill();
            });
        }

        animate() {
            this.update();
            this.draw();
            requestAnimationFrame(() => this.animate());
        }
    }

    // ==========================================
    // 5. CONFETTI CELEBRATION ENGINE (CANVAS)
    // ==========================================
    class ConfettiEngine {
        constructor(canvasId) {
            this.canvas = document.getElementById(canvasId);
            if (!this.canvas) return;
            this.ctx = this.canvas.getContext('2d');
            this.particles = [];
            this.resize();
            window.addEventListener('resize', () => this.resize());
            this.loop();
        }

        resize() {
            this.width = this.canvas.width = window.innerWidth;
            this.height = this.canvas.height = window.innerHeight;
        }

        burst(count = 70) {
            const colors = ['#f59e0b', '#fbbf24', '#38bdf8', '#ef4444', '#10b981', '#c084fc', '#ffffff'];
            for (let i = 0; i < count; i++) {
                this.particles.push({
                    x: this.width * (0.35 + Math.random() * 0.3),
                    y: this.height * 0.5,
                    vx: (Math.random() - 0.5) * 22,
                    vy: -Math.random() * 18 - 6,
                    size: Math.random() * 8 + 4,
                    color: colors[Math.floor(Math.random() * colors.length)],
                    rot: Math.random() * 360,
                    vRot: (Math.random() - 0.5) * 15,
                    alpha: 1,
                    decay: Math.random() * 0.015 + 0.008
                });
            }
        }

        loop() {
            this.ctx.clearRect(0, 0, this.width, this.height);

            for (let i = this.particles.length - 1; i >= 0; i--) {
                const p = this.particles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.45; // gravity
                p.vx *= 0.98;
                p.rot += p.vRot;
                p.alpha -= p.decay;

                if (p.alpha <= 0 || p.y > this.height) {
                    this.particles.splice(i, 1);
                    continue;
                }

                this.ctx.save();
                this.ctx.translate(p.x, p.y);
                this.ctx.rotate((p.rot * Math.PI) / 180);
                this.ctx.globalAlpha = p.alpha;
                this.ctx.fillStyle = p.color;
                this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
                this.ctx.restore();
            }

            requestAnimationFrame(() => this.loop());
        }
    }

    // ==========================================
    // 6. LOTTO GENERATION ALGORITHMS
    // ==========================================

    // Helper: secure or standard random
    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // Algorithm 1: Pure Random
    function generatePureRandom() {
        const set = new Set();
        while (set.size < 6) {
            set.add(getRandomInt(1, 45));
        }
        return Array.from(set).sort((a, b) => a - b);
    }

    // Algorithm 2: Hot Numbers (Weighted by cumulative historical counts)
    function generateHotWeighted() {
        const pool = [];
        for (let num = 1; num <= 45; num++) {
            const weight = Math.round((LOTTO_WEIGHTS[num] || 150) / 10);
            for (let w = 0; w < weight; w++) {
                pool.push(num);
            }
        }
        // Extra boost for top hot numbers
        HOT_NUMBERS.slice(0, 10).forEach(num => {
            for (let i = 0; i < 8; i++) pool.push(num);
        });

        const set = new Set();
        let guard = 0;
        while (set.size < 6 && guard < 1000) {
            guard++;
            const randIdx = Math.floor(Math.random() * pool.length);
            set.add(pool[randIdx]);
        }
        while (set.size < 6) {
            set.add(getRandomInt(1, 45));
        }
        return Array.from(set).sort((a, b) => a - b);
    }

    // Algorithm 3: Cold Numbers (Reverse statistics)
    function generateColdWeighted() {
        const pool = [];
        for (let num = 1; num <= 45; num++) {
            const rawWeight = LOTTO_WEIGHTS[num] || 150;
            // Inverted weight: lower freq gets higher weight
            const invertedWeight = Math.max(5, Math.round((205 - rawWeight) / 5));
            for (let w = 0; w < invertedWeight; w++) {
                pool.push(num);
            }
        }
        COLD_NUMBERS.slice(0, 10).forEach(num => {
            for (let i = 0; i < 8; i++) pool.push(num);
        });

        const set = new Set();
        let guard = 0;
        while (set.size < 6 && guard < 1000) {
            guard++;
            const randIdx = Math.floor(Math.random() * pool.length);
            set.add(pool[randIdx]);
        }
        while (set.size < 6) {
            set.add(getRandomInt(1, 45));
        }
        return Array.from(set).sort((a, b) => a - b);
    }

    // Algorithm 4: Golden Balanced (Statistical Rejection Sampling)
    function generateGoldenBalanced() {
        let attempts = 0;
        while (attempts < 1500) {
            attempts++;
            const nums = generatePureRandom();
            const sum = nums.reduce((a, b) => a + b, 0);

            // Standard jackpot winning sum distribution is heavily 100 ~ 175
            if (sum < 100 || sum > 175) continue;

            // Odd : Even ratio: 2:4, 3:3, 4:2
            const odds = nums.filter(n => n % 2 !== 0).length;
            if (odds < 2 || odds > 4) continue;

            // High : Low (1~22 vs 23~45): 2:4, 3:3, 4:2
            const lows = nums.filter(n => n <= 22).length;
            if (lows < 2 || lows > 4) continue;

            // Consecutive pairs: at most 1 pair (e.g. 14, 15 is fine, but not 14, 15, 16)
            let consecutivePairs = 0;
            for (let i = 0; i < nums.length - 1; i++) {
                if (nums[i + 1] === nums[i] + 1) {
                    consecutivePairs++;
                }
            }
            if (consecutivePairs > 1) continue;

            return nums;
        }
        return generatePureRandom();
    }

    // Algorithm 5: Dream & Saju Hash Mapping
    function generateFromDream(keyword) {
        const text = (keyword || '행운 대박 로또').trim();

        // 32-bit FNV-1a Hash
        let hash = 2166136261;
        for (let i = 0; i < text.length; i++) {
            hash ^= text.charCodeAt(i);
            hash = Math.imul(hash, 16777619);
        }

        // PRNG (Mulberry32)
        function mulberry32(a) {
            return function () {
                let t = (a += 0x6D2B79F5);
                t = Math.imul(t ^ (t >>> 15), t | 1);
                t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
                return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
            };
        }

        const rng = mulberry32(hash >>> 0);
        const set = new Set();
        while (set.size < 6) {
            const n = Math.floor(rng() * 45) + 1;
            set.add(n);
        }

        // Match keyword for customized fortune message
        let matchedMsg = null;
        for (const item of DREAM_KEYWORDS) {
            if (text.includes(item.key)) {
                matchedMsg = item.fortune;
                break;
            }
        }
        if (!matchedMsg) {
            matchedMsg = `입력하신 '${text}'의 고유한 영적 파동을 분석하여 황금 기운의 6개 번호 조합을 도출했습니다. 긍정적인 직관을 믿고 도전해보세요!`;
        }

        return {
            numbers: Array.from(set).sort((a, b) => a - b),
            reading: matchedMsg
        };
    }

    // Algorithm 6: Custom Fixed / Excluded
    function generateCustomSet(fixedSet, excludedSet) {
        const result = new Set(fixedSet);
        const available = [];
        for (let i = 1; i <= 45; i++) {
            if (!excludedSet.has(i) && !result.has(i)) {
                available.push(i);
            }
        }

        // Shuffle available
        for (let i = available.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [available[i], available[j]] = [available[j], available[i]];
        }

        let idx = 0;
        while (result.size < 6 && idx < available.length) {
            result.add(available[idx++]);
        }

        // Fallback if available was exhausted
        while (result.size < 6) {
            const fallback = getRandomInt(1, 45);
            if (!excludedSet.has(fallback)) {
                result.add(fallback);
            }
        }

        return Array.from(result).sort((a, b) => a - b);
    }

    // ==========================================
    // 7. STATS & EVALUATION HELPERS
    // ==========================================
    function analyzeGameStats(nums) {
        const sum = nums.reduce((a, b) => a + b, 0);
        const odds = nums.filter(n => n % 2 !== 0).length;
        const evens = 6 - odds;
        const lows = nums.filter(n => n <= 22).length;
        const highs = 6 - lows;

        let consecutive = 0;
        for (let i = 0; i < nums.length - 1; i++) {
            if (nums[i + 1] === nums[i] + 1) consecutive++;
        }

        return {
            sum,
            oddEven: `${odds}:${evens}`,
            highLow: `${lows}:${highs}`,
            consecutive: consecutive > 0 ? `${consecutive}쌍` : '없음'
        };
    }

    function getBallRangeClass(num) {
        if (num <= 10) return 'ball-range-1';
        if (num <= 20) return 'ball-range-2';
        if (num <= 30) return 'ball-range-3';
        if (num <= 40) return 'ball-range-4';
        return 'ball-range-5';
    }

    // Format single game string
    function formatNumbers(nums) {
        return nums.map(n => n.toString().padStart(2, '0')).join(', ');
    }

    // Toast message trigger
    function showToast(message) {
        const toast = document.getElementById('toast');
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 2600);
    }

    // ==========================================
    // 8. UI CONTROLLER & EVENT LISTENERS
    // ==========================================
    document.addEventListener('DOMContentLoaded', () => {
        const machine = new LottoMachine('machine-canvas');
        const confetti = new ConfettiEngine('confetti-canvas');

        // Cache DOM elements
        const themeToggleBtn = document.getElementById('theme-toggle-btn');
        const themeIcon = document.getElementById('theme-icon');
        const soundToggleBtn = document.getElementById('sound-toggle-btn');
        const soundIcon = document.getElementById('sound-icon');
        const historyToggleBtn = document.getElementById('history-toggle-btn');
        const savedCountBadge = document.getElementById('saved-count-badge');
        const generateBtn = document.getElementById('generate-btn');
        const machineStatusText = document.getElementById('machine-status-text');
        const strategyTabs = document.querySelectorAll('.strategy-tab');
        const strategyInfoBox = document.getElementById('strategy-info-box');
        const dreamPanel = document.getElementById('dream-panel');
        const customPanel = document.getElementById('custom-panel');
        const dreamInput = document.getElementById('dream-input');
        const dreamRandomBtn = document.getElementById('dream-random-btn');
        const numberPickerGrid = document.getElementById('number-picker-grid');
        const fixedCountEl = document.getElementById('fixed-count');
        const fixedListEl = document.getElementById('fixed-list');
        const excludedCountEl = document.getElementById('excluded-count');
        const excludedListEl = document.getElementById('excluded-list');
        const resetFilterBtn = document.getElementById('reset-filter-btn');
        const gameCountBtns = document.querySelectorAll('#game-count-selector .segment-btn');
        const speedToggle = document.getElementById('speed-toggle');
        const speedLabel = document.getElementById('speed-label');
        const resultsContainer = document.getElementById('results-container');
        const resultsActions = document.getElementById('results-actions');
        const resultsTimestamp = document.getElementById('results-timestamp');
        const dreamResultCard = document.getElementById('dream-result-card');
        const dreamAnalysisText = document.getElementById('dream-analysis-text');
        const copyAllBtn = document.getElementById('copy-all-btn');
        const saveCurrentBtn = document.getElementById('save-current-btn');
        const downloadTicketBtn = document.getElementById('download-ticket-btn');
        const simulatorBox = document.getElementById('simulator-box');
        const simDrawBtn = document.getElementById('sim-draw-btn');
        const simWinningDisplay = document.getElementById('sim-winning-display');
        const simWinBalls = document.getElementById('sim-win-balls');
        const simBonusBall = document.getElementById('sim-bonus-ball');
        const simReportList = document.getElementById('sim-report-list');
        const historyModal = document.getElementById('history-modal');
        const closeHistoryBtn = document.getElementById('close-history-btn');
        const closeHistoryBottomBtn = document.getElementById('close-history-bottom-btn');
        const clearAllHistoryBtn = document.getElementById('clear-all-history-btn');
        const historyListContainer = document.getElementById('history-list-container');

        // Theme controller
        function applyTheme(theme) {
            document.body.dataset.theme = theme;
            if (themeIcon) {
                themeIcon.textContent = theme === 'dark' ? '🌙' : '☀️';
            }
            if (themeToggleBtn) {
                themeToggleBtn.title = theme === 'dark' ? '화이트 모드로 전환' : '다크 모드로 전환';
            }
            localStorage.setItem('lotto_theme', theme);
        }
        applyTheme(state.theme);

        if (themeToggleBtn) {
            themeToggleBtn.addEventListener('click', () => {
                sound.initContext();
                state.theme = state.theme === 'dark' ? 'light' : 'dark';
                applyTheme(state.theme);
                showToast(state.theme === 'dark' ? '다크 모드가 적용되었습니다 🌙' : '화이트 모드가 적용되었습니다 ☀️');

                // Reload Disqus with matching theme if active
                if (typeof DISQUS !== 'undefined') {
                    try {
                        DISQUS.reset({
                            reload: true,
                            config: function () {
                                this.page.identifier = 'lotto-luxe-645-main';
                                this.page.url = window.location.href.split('#')[0];
                            }
                        });
                    } catch (e) {}
                }
            });
        }

        // Sound state update
        function updateSoundUI() {
            soundIcon.textContent = state.soundEnabled ? '🔊' : '🔇';
            localStorage.setItem('lotto_sound', state.soundEnabled);
        }
        updateSoundUI();

        soundToggleBtn.addEventListener('click', () => {
            sound.initContext();
            state.soundEnabled = !state.soundEnabled;
            updateSoundUI();
            showToast(state.soundEnabled ? '사운드가 켜졌습니다 🔊' : '사운드가 음소거되었습니다 🔇');
        });

        // Initialize User Audio on any first touch/click
        document.body.addEventListener('click', () => {
            sound.initContext();
        }, { once: true });

        // Update Saved Count Badge
        function updateSavedBadge() {
            savedCountBadge.textContent = state.savedTickets.length;
        }
        updateSavedBadge();

        // 1-45 Custom Number Picker Grid Initialization
        function buildNumberPicker() {
            numberPickerGrid.innerHTML = '';
            for (let i = 1; i <= 45; i++) {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'pick-ball-btn';
                btn.textContent = i;
                btn.dataset.num = i;

                btn.addEventListener('click', () => {
                    sound.initContext();
                    const num = parseInt(btn.dataset.num, 10);
                    // Cycle: normal -> fixed (max 5) -> excluded -> normal
                    if (!state.fixedNumbers.has(num) && !state.excludedNumbers.has(num)) {
                        if (state.fixedNumbers.size >= 5) {
                            // Already 5 fixed, switch straight to excluded
                            state.excludedNumbers.add(num);
                            btn.className = 'pick-ball-btn state-excluded';
                        } else {
                            state.fixedNumbers.add(num);
                            btn.className = 'pick-ball-btn state-fixed';
                        }
                    } else if (state.fixedNumbers.has(num)) {
                        state.fixedNumbers.delete(num);
                        state.excludedNumbers.add(num);
                        btn.className = 'pick-ball-btn state-excluded';
                    } else if (state.excludedNumbers.has(num)) {
                        state.excludedNumbers.delete(num);
                        btn.className = 'pick-ball-btn';
                    }
                    updateFilterSummary();
                });

                numberPickerGrid.appendChild(btn);
            }
        }
        buildNumberPicker();

        function updateFilterSummary() {
            fixedCountEl.textContent = state.fixedNumbers.size;
            fixedListEl.textContent = state.fixedNumbers.size > 0 
                ? Array.from(state.fixedNumbers).sort((a,b)=>a-b).join(', ') 
                : '없음';

            excludedCountEl.textContent = state.excludedNumbers.size;
            excludedListEl.textContent = state.excludedNumbers.size > 0 
                ? Array.from(state.excludedNumbers).sort((a,b)=>a-b).join(', ') 
                : '없음';
        }

        resetFilterBtn.addEventListener('click', () => {
            state.fixedNumbers.clear();
            state.excludedNumbers.clear();
            document.querySelectorAll('.pick-ball-btn').forEach(btn => {
                btn.className = 'pick-ball-btn';
            });
            updateFilterSummary();
            showToast('고정수 및 제외수 필터가 초기화되었습니다.');
        });

        // Strategy Descriptions Map
        const STRATEGY_DESCRIPTIONS = {
            random: '<span class="info-tag">🎲 완전 랜덤</span> 1부터 45까지 무작위 확률로 균등하게 6개 번호를 추첨합니다.',
            hot: '<span class="info-tag">🔥 최다 빈출</span> 동행복권 역대 누적 당첨 빈도가 가장 높은 상위 번호들에 통계적 가중치를 부여합니다.',
            cold: '<span class="info-tag">❄️ 미출현 반등</span> 최근 및 역대 출현 빈도가 적었던 번호들의 반등 출현을 노리는 역발상 조합입니다.',
            balanced: '<span class="info-tag">⚖️ 황금 밸런스</span> 1등 당첨 통계의 80% 이상을 차지하는 총합계(100~175)와 홀짝 균형 조합만을 필터링 추출합니다.',
            dream: '<span class="info-tag">🔮 꿈·소원 사주</span> 입력하신 꿈이나 소원, 생년월일의 에너지 파동을 수학적 알고리즘으로 분석하여 고유 조합을 생성합니다.',
            custom: '<span class="info-tag">🎯 고정/제외수</span> 반드시 포함할 고정수(최대 5개)와 제외할 번호를 직접 선택하여 맞춤 번호를 추출합니다.'
        };

        // Strategy Tabs Change
        strategyTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                sound.initContext();
                strategyTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                state.mode = tab.dataset.mode;

                strategyInfoBox.innerHTML = STRATEGY_DESCRIPTIONS[state.mode] || '';

                // Show/hide sub-panels
                dreamPanel.style.display = state.mode === 'dream' ? 'flex' : 'none';
                customPanel.style.display = state.mode === 'custom' ? 'flex' : 'none';
            });
        });

        // Dream Random Keyword Button
        dreamRandomBtn.addEventListener('click', () => {
            const sampleKeywords = ['황금 돼지꿈', '하늘을 나는 청룡', '불타는 용광로', '바다 한가운데서 보물상자', '조상님이 복권 번호 알려주심', '거대한 똥더미를 밟음', '금괴가 가득 찬 금고'];
            const picked = sampleKeywords[Math.floor(Math.random() * sampleKeywords.length)];
            dreamInput.value = picked;
            showToast(`추천 꿈 키워드: '${picked}' 적용!`);
        });

        // Game Count Selector
        gameCountBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                gameCountBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                state.gameCount = parseInt(btn.dataset.count, 10);
            });
        });

        // Speed / Dynamic Toggle
        speedToggle.addEventListener('change', () => {
            state.isDynamic = speedToggle.checked;
            speedLabel.textContent = state.isDynamic ? '다이나믹 롤링 연출' : '초고속 즉시 생성';
        });

        // ==========================================
        // 9. CORE GENERATE CONTROLLER
        // ==========================================
        generateBtn.addEventListener('click', async () => {
            if (state.isGenerating) return;
            sound.initContext();

            state.isGenerating = true;
            generateBtn.disabled = true;
            generateBtn.querySelector('.btn-text').textContent = '번호 추출 중...';
            machineStatusText.textContent = '⚡ 터보 스핀 가동 중... 번호 추출';
            machine.setSpinning(true);

            // Reset Simulator State
            simulatorBox.style.display = 'none';
            simWinningDisplay.style.display = 'none';
            state.virtualWinning = null;

            // Generate raw number sets
            const games = [];
            let dreamReading = null;

            for (let i = 0; i < state.gameCount; i++) {
                let nums;
                if (state.mode === 'random') {
                    nums = generatePureRandom();
                } else if (state.mode === 'hot') {
                    nums = generateHotWeighted();
                } else if (state.mode === 'cold') {
                    nums = generateColdWeighted();
                } else if (state.mode === 'balanced') {
                    nums = generateGoldenBalanced();
                } else if (state.mode === 'dream') {
                    const dreamResult = generateFromDream(dreamInput.value);
                    nums = dreamResult.numbers;
                    if (!dreamReading) dreamReading = dreamResult.reading;
                } else if (state.mode === 'custom') {
                    nums = generateCustomSet(state.fixedNumbers, state.excludedNumbers);
                }
                games.push(nums);
            }

            state.currentResults = games;

            // Display Results
            resultsContainer.innerHTML = '';
            const labels = ['A', 'B', 'C', 'D', 'E'];

            // Prepare Rows
            const rowElements = [];
            games.forEach((nums, gIdx) => {
                const card = document.createElement('div');
                card.className = 'game-row-card';
                card.id = `game-row-${gIdx}`;

                const topBar = document.createElement('div');
                topBar.className = 'game-row-top';
                topBar.innerHTML = `
                    <div class="game-label-badge">
                        <span>[${labels[gIdx]}]</span> 제 ${gIdx + 1}게임
                    </div>
                    <button class="game-copy-btn" data-game="${gIdx}" title="이 줄 번호만 복사">
                        복사 📋
                    </button>
                `;

                const ballsContainer = document.createElement('div');
                ballsContainer.className = 'game-balls-container';
                ballsContainer.id = `balls-container-${gIdx}`;

                const stats = analyzeGameStats(nums);
                const statsBar = document.createElement('div');
                statsBar.className = 'game-stats-bar';
                statsBar.innerHTML = `
                    <span class="stat-pill">총합 <strong>${stats.sum}</strong></span>
                    <span class="stat-pill ${stats.oddEven === '3:3' ? 'balanced' : ''}">홀짝 <strong>${stats.oddEven}</strong></span>
                    <span class="stat-pill">고저 <strong>${stats.highLow}</strong></span>
                    <span class="stat-pill">연속 <strong>${stats.consecutive}</strong></span>
                `;

                card.appendChild(topBar);
                card.appendChild(ballsContainer);
                card.appendChild(statsBar);
                resultsContainer.appendChild(card);

                rowElements.push({ card, ballsContainer, nums, gIdx });
            });

            // Single Row Copy Button Event Binding
            document.querySelectorAll('.game-copy-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const gIdx = parseInt(e.target.dataset.game, 10);
                    const line = `${labels[gIdx]}게임: ${formatNumbers(games[gIdx])}`;
                    navigator.clipboard.writeText(line).then(() => {
                        showToast(`${labels[gIdx]}게임 번호가 복사되었습니다!`);
                    });
                });
            });

            // Handle Dynamic Animation vs Instant
            if (state.isDynamic) {
                for (let r = 0; r < rowElements.length; r++) {
                    const { ballsContainer, nums } = rowElements[r];
                    for (let b = 0; b < nums.length; b++) {
                        const targetNum = nums[b];
                        const ballEl = document.createElement('div');
                        ballEl.className = `lotto-ball-3d ${getBallRangeClass(targetNum)} ball-pop-anim`;
                        ballEl.textContent = targetNum;
                        ballsContainer.appendChild(ballEl);

                        sound.playChime(b);
                        if (navigator.vibrate) {
                            try { navigator.vibrate(25); } catch (e) {}
                        }

                        // Delay between ball reveals
                        await new Promise(resolve => setTimeout(resolve, 140));
                    }
                }
            } else {
                // Instant render
                rowElements.forEach(({ ballsContainer, nums }) => {
                    nums.forEach(n => {
                        const ballEl = document.createElement('div');
                        ballEl.className = `lotto-ball-3d ${getBallRangeClass(n)}`;
                        ballEl.textContent = n;
                        ballsContainer.appendChild(ballEl);
                    });
                });
            }

            // Finish Generation
            machine.setSpinning(false);
            machineStatusText.textContent = '✅ 추첨 완료! 대박을 기원합니다';
            generateBtn.disabled = false;
            generateBtn.querySelector('.btn-text').textContent = '행운의 로또 번호 다시 추첨하기';
            state.isGenerating = false;

            // Timestamp
            const now = new Date();
            resultsTimestamp.textContent = `${now.toLocaleTimeString()} 생성 완료`;
            resultsActions.style.display = 'flex';
            simulatorBox.style.display = 'flex';

            // Show dream reading if mode is dream
            if (state.mode === 'dream' && dreamReading) {
                dreamResultCard.style.display = 'flex';
                dreamAnalysisText.textContent = dreamReading;
            } else {
                dreamResultCard.style.display = 'none';
            }

            // Confetti Burst & Fanfare!
            confetti.burst(85);
            sound.playFanfare();
        });

        // ==========================================
        // 10. COPY, SAVE & RECEIPT GENERATOR
        // ==========================================

        // Copy All Games
        copyAllBtn.addEventListener('click', () => {
            if (!state.currentResults.length) return;
            const labels = ['A', 'B', 'C', 'D', 'E'];
            const lines = [
                '🍀 [LOTTO LUXE 6/45 행운의 추천 번호]',
                ...state.currentResults.map((nums, i) => `${labels[i]}게임: ${formatNumbers(nums)}`),
                '✨ 이번 회차 1등 대박의 주인공은 바로 당신입니다! ✨'
            ];
            navigator.clipboard.writeText(lines.join('\n')).then(() => {
                showToast('모든 게임 번호가 클립보드에 복사되었습니다! 📋');
            });
        });

        // Save Current to History
        saveCurrentBtn.addEventListener('click', () => {
            if (!state.currentResults.length) return;
            const ticket = {
                id: Date.now(),
                date: new Date().toLocaleString(),
                mode: state.mode,
                games: state.currentResults
            };
            state.savedTickets.unshift(ticket);
            localStorage.setItem('lotto_saved_tickets', JSON.stringify(state.savedTickets));
            updateSavedBadge();
            showToast('내 번호 보관함에 저장되었습니다! ⭐');
        });

        // Saved History Drawer Open/Close
        function renderHistoryList() {
            historyListContainer.innerHTML = '';
            if (state.savedTickets.length === 0) {
                historyListContainer.innerHTML = `
                    <div style="text-align: center; color: var(--text-muted); padding: 30px;">
                        보관된 번호가 없습니다.<br>마음에 드는 추천 번호를 보관해보세요!
                    </div>
                `;
                return;
            }

            const labels = ['A', 'B', 'C', 'D', 'E'];
            state.savedTickets.forEach((ticket, idx) => {
                const item = document.createElement('div');
                item.className = 'history-item-card';

                const meta = document.createElement('div');
                meta.className = 'history-meta';
                meta.innerHTML = `
                    <span>📅 ${ticket.date} (${ticket.mode.toUpperCase()})</span>
                    <button class="history-delete-btn" data-id="${ticket.id}">삭제 ✕</button>
                `;

                const gamesDiv = document.createElement('div');
                gamesDiv.style.display = 'flex';
                gamesDiv.style.flexDirection = 'column';
                gamesDiv.style.gap = '6px';

                ticket.games.forEach((nums, gIdx) => {
                    const row = document.createElement('div');
                    row.style.display = 'flex';
                    row.style.alignItems = 'center';
                    row.style.gap = '6px';
                    row.style.fontSize = '0.82rem';

                    const lbl = document.createElement('span');
                    lbl.style.fontWeight = '700';
                    lbl.style.color = 'var(--gold-bright)';
                    lbl.textContent = `[${labels[gIdx]}]`;
                    row.appendChild(lbl);

                    nums.forEach(n => {
                        const mini = document.createElement('span');
                        mini.className = `lotto-ball-3d ${getBallRangeClass(n)}`;
                        mini.style.width = '26px';
                        mini.style.height = '26px';
                        mini.style.fontSize = '0.72rem';
                        mini.textContent = n;
                        row.appendChild(mini);
                    });

                    gamesDiv.appendChild(row);
                });

                item.appendChild(meta);
                item.appendChild(gamesDiv);
                historyListContainer.appendChild(item);
            });

            // Bind delete single
            document.querySelectorAll('.history-delete-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const targetId = parseInt(e.target.dataset.id, 10);
                    state.savedTickets = state.savedTickets.filter(t => t.id !== targetId);
                    localStorage.setItem('lotto_saved_tickets', JSON.stringify(state.savedTickets));
                    updateSavedBadge();
                    renderHistoryList();
                    showToast('해당 번호가 삭제되었습니다.');
                });
            });
        }

        historyToggleBtn.addEventListener('click', () => {
            renderHistoryList();
            historyModal.style.display = 'flex';
        });

        const closeHistory = () => { historyModal.style.display = 'none'; };
        closeHistoryBtn.addEventListener('click', closeHistory);
        closeHistoryBottomBtn.addEventListener('click', closeHistory);
        historyModal.addEventListener('click', (e) => {
            if (e.target === historyModal) closeHistory();
        });

        clearAllHistoryBtn.addEventListener('click', () => {
            if (confirm('보관함의 모든 번호를 비우시겠습니까?')) {
                state.savedTickets = [];
                localStorage.setItem('lotto_saved_tickets', JSON.stringify([]));
                updateSavedBadge();
                renderHistoryList();
                showToast('보관함이 모두 비워졌습니다.');
            }
        });

        // Download Realistic Lotto Slip (Receipt) as PNG
        downloadTicketBtn.addEventListener('click', () => {
            if (!state.currentResults.length) return;

            const rCanvas = document.getElementById('receipt-canvas');
            const ctx = rCanvas.getContext('2d');
            rCanvas.width = 600;
            rCanvas.height = 780;

            // Background Paper Gradient (Clean premium thermal receipt look)
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, rCanvas.width, rCanvas.height);

            // Receipt Top Bar
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, 0, rCanvas.width, 95);

            ctx.fillStyle = '#f59e0b';
            ctx.font = 'bold 28px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('LOTTO 6/45 행운 복권 영수증', rCanvas.width / 2, 45);

            ctx.fillStyle = '#94a3b8';
            ctx.font = '14px sans-serif';
            ctx.fillText('PREMIUM LUCKY TICKET • LOTTO LUXE', rCanvas.width / 2, 75);

            // Issue Date & Serial
            ctx.textAlign = 'left';
            ctx.fillStyle = '#334155';
            ctx.font = 'bold 15px monospace';
            const now = new Date();
            ctx.fillText(`발행일시: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`, 30, 130);
            ctx.fillText(`일련번호: ${Date.now()}-LUXE-645`, 30, 155);

            // Divider line
            ctx.strokeStyle = '#cbd5e1';
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(30, 175);
            ctx.lineTo(570, 175);
            ctx.stroke();
            ctx.setLineDash([]);

            // Draw Games
            const labels = ['A', 'B', 'C', 'D', 'E'];
            let startY = 220;

            state.currentResults.forEach((nums, idx) => {
                ctx.fillStyle = '#1e293b';
                ctx.font = 'bold 22px sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText(`[${labels[idx]}] 자동/추천`, 35, startY);

                // Draw 6 colored lottery ball circles
                nums.forEach((n, bIdx) => {
                    const ballX = 175 + bIdx * 66;
                    const ballY = startY - 8;
                    const radius = 24;

                    // Color selection
                    let fill = '#f59e0b';
                    if (n > 10 && n <= 20) fill = '#0284c7';
                    else if (n > 20 && n <= 30) fill = '#ef4444';
                    else if (n > 30 && n <= 40) fill = '#64748b';
                    else if (n > 40) fill = '#16a34a';

                    // Circle
                    ctx.beginPath();
                    ctx.arc(ballX, ballY, radius, 0, Math.PI * 2);
                    ctx.fillStyle = fill;
                    ctx.fill();

                    // Text number
                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 20px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(n.toString(), ballX, ballY);
                });

                startY += 68;
            });

            // Barcode Graphic Simulation
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(30, startY + 15);
            ctx.lineTo(570, startY + 15);
            ctx.stroke();
            ctx.setLineDash([]);

            const barcodeY = startY + 35;
            ctx.fillStyle = '#000000';
            for (let bx = 50; bx < 550; bx += Math.random() * 8 + 3) {
                const w = Math.random() > 0.5 ? 2 : 4;
                ctx.fillRect(bx, barcodeY, w, 50);
            }

            // Lucky message footer
            ctx.fillStyle = '#0f172a';
            ctx.font = 'bold 18px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('🍀 이번 주 1등 대박의 주인공은 바로 당신입니다! 🍀', rCanvas.width / 2, barcodeY + 90);

            // Export to PNG & download
            const dataURL = rCanvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = `lotto_lucky_ticket_${Date.now()}.png`;
            link.href = dataURL;
            link.click();
            showToast('로또 영수증 이미지가 다운로드되었습니다! 🧾');
        });

        // ==========================================
        // 11. VIRTUAL WINNING SIMULATOR
        // ==========================================
        simDrawBtn.addEventListener('click', () => {
            if (!state.currentResults.length) {
                showToast('먼저 번호를 추첨해주세요!');
                return;
            }
            sound.initContext();

            // Draw 6 distinct winning numbers + 1 bonus ball
            const winSet = new Set();
            while (winSet.size < 6) {
                winSet.add(getRandomInt(1, 45));
            }
            const winNumbers = Array.from(winSet).sort((a, b) => a - b);

            let bonus = getRandomInt(1, 45);
            while (winNumbers.includes(bonus)) {
                bonus = getRandomInt(1, 45);
            }

            state.virtualWinning = { winNumbers, bonus };

            // Render Winning Balls
            simWinBalls.innerHTML = '';
            winNumbers.forEach(n => {
                const ball = document.createElement('div');
                ball.className = `lotto-ball-3d ${getBallRangeClass(n)}`;
                ball.style.width = '34px';
                ball.style.height = '34px';
                ball.style.fontSize = '0.85rem';
                ball.textContent = n;
                simWinBalls.appendChild(ball);
            });

            simBonusBall.innerHTML = '';
            const bBall = document.createElement('div');
            bBall.className = `lotto-ball-3d ${getBallRangeClass(bonus)}`;
            bBall.style.width = '34px';
            bBall.style.height = '34px';
            bBall.style.fontSize = '0.85rem';
            bBall.textContent = bonus;
            simBonusBall.appendChild(bBall);

            // Evaluate Match for each user game
            simReportList.innerHTML = '';
            const labels = ['A', 'B', 'C', 'D', 'E'];

            // Clear previous highlight classes in main view
            document.querySelectorAll('.lotto-ball-3d').forEach(el => {
                el.classList.remove('ball-matched-highlight');
            });
            document.querySelectorAll('.game-row-card').forEach(el => {
                el.classList.remove('highlight-winner');
            });

            state.currentResults.forEach((userNums, gIdx) => {
                const matchCount = userNums.filter(n => winNumbers.includes(n)).length;
                const bonusMatch = userNums.includes(bonus);

                let rankText = '낙첨';
                let rankClass = 'rank-none';
                let prizeAmount = '0원';

                if (matchCount === 6) {
                    rankText = '1등 당첨! 🎉🎉🎉';
                    rankClass = 'rank-1';
                    prizeAmount = '약 20억원';
                } else if (matchCount === 5 && bonusMatch) {
                    rankText = '2등 당첨! 🥈';
                    rankClass = 'rank-2';
                    prizeAmount = '약 5,000만원';
                } else if (matchCount === 5) {
                    rankText = '3등 당첨! 🥉';
                    rankClass = 'rank-3';
                    prizeAmount = '약 150만원';
                } else if (matchCount === 4) {
                    rankText = '4등 당첨! 🍀';
                    rankClass = 'rank-4';
                    prizeAmount = '50,000원';
                } else if (matchCount === 3) {
                    rankText = '5등 당첨! ☕';
                    rankClass = 'rank-5';
                    prizeAmount = '5,000원';
                }

                // Highlight matching balls in the main card
                const ballsContainer = document.getElementById(`balls-container-${gIdx}`);
                if (ballsContainer) {
                    const ballNodes = ballsContainer.querySelectorAll('.lotto-ball-3d');
                    userNums.forEach((n, idx) => {
                        if (winNumbers.includes(n)) {
                            ballNodes[idx].classList.add('ball-matched-highlight');
                        }
                    });
                }

                if (matchCount >= 3) {
                    const rowCard = document.getElementById(`game-row-${gIdx}`);
                    if (rowCard) rowCard.classList.add('highlight-winner');
                }

                // Add report item
                const repItem = document.createElement('div');
                repItem.className = 'sim-report-item';
                repItem.innerHTML = `
                    <span><strong>[${labels[gIdx]}게임]</strong> ${matchCount}개 일치 ${bonusMatch ? '(+보너스)' : ''}</span>
                    <span class="sim-rank-tag ${rankClass}">${rankText} (${prizeAmount})</span>
                `;
                simReportList.appendChild(repItem);
            });

            simWinningDisplay.style.display = 'flex';
            sound.playChime(3);
            showToast('가상 당첨 대조가 완료되었습니다! 🏆');
        });

        // ==========================================
        // 12. PARTNERSHIP INQUIRY FORM (FORMSPREE)
        // ==========================================
        const contactForm = document.getElementById('contact-form');
        const contactSubmitBtn = document.getElementById('contact-submit-btn');
        const contactStatus = document.getElementById('contact-status');
        const partnerNavBtn = document.getElementById('partner-nav-btn');
        const footerTopBtn = document.getElementById('footer-top-btn');

        // Escape HTML helper for safe interpolation
        function escapeHtml(str) {
            if (!str) return '';
            return String(str).replace(/[&<>"']/g, (m) => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            }[m]));
        }

        // Smooth scroll to partnership section
        if (partnerNavBtn) {
            partnerNavBtn.addEventListener('click', (e) => {
                e.preventDefault();
                sound.initContext();
                const target = document.getElementById('partnership-section');
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                    setTimeout(() => {
                        const nameInput = document.getElementById('contact-name');
                        if (nameInput) nameInput.focus();
                    }, 500);
                }
            });
        }

        // Smooth scroll to top from footer
        if (footerTopBtn) {
            footerTopBtn.addEventListener('click', (e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }

        // Formspree AJAX Submission
        if (contactForm && contactSubmitBtn && contactStatus) {
            contactForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                sound.initContext();

                const btnText = contactSubmitBtn.querySelector('.btn-text');
                const btnIcon = contactSubmitBtn.querySelector('.btn-icon');
                const originalText = btnText ? btnText.textContent : '제휴 문의 전송하기';
                const originalIcon = btnIcon ? btnIcon.textContent : '📨';

                // Set loading state
                contactSubmitBtn.disabled = true;
                if (btnText) btnText.textContent = '문의 전송 중...';
                if (btnIcon) btnIcon.textContent = '⏳';
                contactStatus.style.display = 'none';

                const formData = new FormData(contactForm);
                const data = Object.fromEntries(formData.entries());

                try {
                    const response = await fetch(contactForm.action, {
                        method: 'POST',
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(data)
                    });

                    if (response.ok) {
                        const submittedEmail = data.email || '';
                        contactForm.reset();
                        contactStatus.className = 'contact-status-card success';
                        contactStatus.innerHTML = `
                            <div class="status-icon">🎉</div>
                            <div class="status-text">
                                <h4>제휴 문의가 성공적으로 접수되었습니다!</h4>
                                <p>입력하신 회신 이메일(<strong>${escapeHtml(submittedEmail)}</strong>)로 담당자가 확인 후 빠른 시일 내에 연락드리겠습니다.</p>
                                <button type="button" class="secondary-btn" id="write-again-btn" style="margin-top: 10px;">추가 문의 작성하기</button>
                            </div>
                        `;
                        contactStatus.style.display = 'flex';

                        // Bind write again button
                        const writeAgainBtn = document.getElementById('write-again-btn');
                        if (writeAgainBtn) {
                            writeAgainBtn.addEventListener('click', () => {
                                contactStatus.style.display = 'none';
                                const nameInput = document.getElementById('contact-name');
                                if (nameInput) nameInput.focus();
                            });
                        }

                        // Celebration sound & confetti
                        sound.playFanfare();
                        confetti.burst(80);
                        showToast('제휴 문의가 성공적으로 전송되었습니다! 💌');
                    } else {
                        let errMsg = '문의 전송에 실패했습니다. 입력값을 확인해주세요.';
                        try {
                            const errData = await response.json();
                            if (errData && errData.errors && Array.isArray(errData.errors)) {
                                errMsg = errData.errors.map(err => err.message).join(', ');
                            }
                        } catch (parseErr) {}

                        contactStatus.className = 'contact-status-card error';
                        contactStatus.innerHTML = `
                            <div class="status-icon">⚠️</div>
                            <div class="status-text">
                                <h4>전송 실패</h4>
                                <p>${escapeHtml(errMsg)}</p>
                            </div>
                        `;
                        contactStatus.style.display = 'flex';
                        showToast('문의 전송 실패: 다시 시도해주세요.');
                    }
                } catch (networkErr) {
                    contactStatus.className = 'contact-status-card error';
                    contactStatus.innerHTML = `
                        <div class="status-icon">⚠️</div>
                        <div class="status-text">
                            <h4>네트워크 오류가 발생했습니다.</h4>
                            <p>인터넷 연결 상태를 확인하시거나 잠시 후 다시 시도해주세요.</p>
                        </div>
                    `;
                    contactStatus.style.display = 'flex';
                    showToast('네트워크 오류가 발생했습니다.');
                } finally {
                    contactSubmitBtn.disabled = false;
                    if (btnText) btnText.textContent = originalText;
                    if (btnIcon) btnIcon.textContent = originalIcon;
                }
            });
        }

        // ==========================================
        // 13. COMMUNITY & DISQUS COMMENTS LOADER
        // ==========================================
        const commentsNavBtn = document.getElementById('comments-nav-btn');

        // Verified active Disqus forum shortname ('product-builder-lecture')
        const DISQUS_SHORTNAME = 'product-builder-lecture';

        window.disqus_config = function () {
            // Provide canonical production URL if running on local environment
            const isLocal = window.location.hostname === 'localhost' ||
                            window.location.hostname === '127.0.0.1' ||
                            window.location.protocol === 'file:';
            this.page.url = isLocal
                ? 'https://qkrguwh123-ops.github.io/product-bulider-lecture/'
                : window.location.href.split('#')[0];
            this.page.identifier = 'lotto-luxe-645-main';
        };

        function loadDisqus() {
            if (document.getElementById('disqus-embed-script')) return;
            const d = document;
            const s = d.createElement('script');
            s.id = 'disqus-embed-script';
            s.src = `https://${DISQUS_SHORTNAME}.disqus.com/embed.js`;
            s.setAttribute('data-timestamp', +new Date());
            s.async = true;
            (d.head || d.body).appendChild(s);
        }

        // Smooth scroll to comments section
        if (commentsNavBtn) {
            commentsNavBtn.addEventListener('click', (e) => {
                e.preventDefault();
                sound.initContext();
                const target = document.getElementById('comments-section');
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
                loadDisqus();
            });
        }

        // Load Disqus immediately on page ready
        loadDisqus();

    });
})();
