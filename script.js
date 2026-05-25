(function(){
    const canvas = document.getElementById('winterCanvas');
    const ctx = canvas.getContext('2d');
    
    let width, height;
    let snowflakes = [];
    let audioContext = null;
    let isPlaying = false;
    let audioSource = null;
    let gainNode = null;
    let windGain = null;
    
    // Настройки снега
    const SNOW_COUNT = 280;
    
    // Деревья (координаты, размер)
    let trees = [];
    
    function resizeCanvas() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
        generateTrees();
    }
    
    // Генерация деревьев пропорционально размеру экрана (реалистично)
    function generateTrees() {
        trees = [];
        const treeCount = Math.floor(width / 180) + 4;
        for (let i = 0; i < treeCount; i++) {
            let x = (i / treeCount) * width + (Math.random() * 60 - 30);
            x = Math.min(width - 40, Math.max(30, x));
            let trunkHeight = 70 + Math.random() * 50;
            let crownSize = 35 + Math.random() * 25;
            trees.push({
                x: x,
                trunkHeight: trunkHeight,
                crownSize: crownSize,
                snowOnTop: Math.random() * 12,
                type: Math.random() > 0.7 ? 'pine' : 'spruce'
            });
        }
        // добавим пару дальних деревьев (полутоном)
        for (let i = 0; i < 5; i++) {
            trees.push({
                x: Math.random() * width,
                trunkHeight: 50 + Math.random() * 40,
                crownSize: 28 + Math.random() * 20,
                snowOnTop: 6,
                type: 'far',
                far: true
            });
        }
    }
    
    // Инициализация снежинок
    function initSnow() {
        snowflakes = [];
        for (let i = 0; i < SNOW_COUNT; i++) {
            snowflakes.push({
                x: Math.random() * width,
                y: Math.random() * height,
                radius: 2 + Math.random() * 4,
                speedY: 0.5 + Math.random() * 2.2,
                speedX: (Math.random() - 0.5) * 0.5,
                opacity: 0.5 + Math.random() * 0.4,
                swing: Math.random() * Math.PI * 2,
                swingSpeed: 0.01 + Math.random() * 0.02
            });
        }
    }
    
    // Отрисовка деревьев (зимний стиль, иней, тени)
    function drawTrees() {
        for (let tree of trees) {
            ctx.save();
            if (tree.far) {
                ctx.globalAlpha = 0.55;
                ctx.shadowBlur = 2;
            } else {
                ctx.shadowBlur = 8;
                ctx.shadowColor = "rgba(0,0,0,0.3)";
            }
            const x = tree.x;
            const groundY = height - 40;
            const trunkTop = groundY - tree.trunkHeight;
            
            // Ствол
            ctx.fillStyle = "#5d3a1a";
            ctx.fillRect(x - 12, trunkTop, 24, tree.trunkHeight);
            // Крона (ёлочка)
            ctx.fillStyle = tree.far ? "#3f6a4a" : "#2c5e3a";
            let layers = 4;
            let startY = trunkTop - 8;
            for (let i = 0; i < layers; i++) {
                let w = tree.crownSize - i * 6;
                let h = 28;
                ctx.beginPath();
                ctx.moveTo(x - w/2, startY - i * 16);
                ctx.lineTo(x, startY - i * 16 - h);
                ctx.lineTo(x + w/2, startY - i * 16);
                ctx.fill();
            }
            // Снег на ветках
            ctx.fillStyle = "#f0f9ff";
            ctx.shadowBlur = 3;
            for (let i = 0; i < layers; i++) {
                let w = tree.crownSize - i * 6;
                ctx.beginPath();
                ctx.ellipse(x, startY - i * 14 - 4, w/3, 5, 0, 0, Math.PI*2);
                ctx.fill();
            }
            // снежная шапка
            ctx.beginPath();
            ctx.arc(x, trunkTop - 18, 14, 0, Math.PI*2);
            ctx.fillStyle = "#eef5ff";
            ctx.fill();
            ctx.restore();
        }
    }
    
    // Отрисовка сугробов и земли
    function drawGround() {
        const grad = ctx.createLinearGradient(0, height-150, 0, height);
        grad.addColorStop(0, "#cfe2f0");
        grad.addColorStop(1, "#eef5ff");
        ctx.fillStyle = grad;
        ctx.fillRect(0, height-70, width, 90);
        ctx.fillStyle = "#e0f0fc";
        for (let i = 0; i < 40; i++) {
            ctx.beginPath();
            ctx.ellipse((i * 70) % width, height - 45 + Math.sin(i) * 8, 40, 18, 0, 0, Math.PI*2);
            ctx.fill();
        }
        // тени под деревьями
        for (let tree of trees) {
            if (!tree.far) {
                ctx.fillStyle = "#b0c8db80";
                ctx.beginPath();
                ctx.ellipse(tree.x, height-38, 28, 12, 0, 0, Math.PI*2);
                ctx.fill();
            }
        }
    }
    
    // Обновление снежинок
    function updateSnow() {
        for (let s of snowflakes) {
            s.y += s.speedY;
            s.x += s.speedX + Math.sin(Date.now() * s.swingSpeed + s.swing) * 0.15;
            if (s.y > height + 20) {
                s.y = -20;
                s.x = Math.random() * width;
            }
            if (s.x < -30) s.x = width + 20;
            if (s.x > width + 30) s.x = -20;
        }
    }
    
    function drawSnow() {
        for (let s of snowflakes) {
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.radius, 0, Math.PI*2);
            ctx.fillStyle = `rgba(255, 255, 245, ${s.opacity})`;
            ctx.fill();
            ctx.shadowBlur = 3;
            ctx.shadowColor = "white";
        }
    }
    
    // Рисование неба и облаков
    function drawSky() {
        const gradSky = ctx.createLinearGradient(0, 0, 0, height*0.6);
        gradSky.addColorStop(0, "#a3c9e8");
        gradSky.addColorStop(1, "#d9e9f7");
        ctx.fillStyle = gradSky;
        ctx.fillRect(0, 0, width, height);
        // облака
        ctx.fillStyle = "#ffffffc9";
        for (let i = 0; i < 5; i++) {
            let cloudX = (Date.now() * 0.03 + i * 230) % (width + 400) - 200;
            let cloudY = 50 + i * 70;
            ctx.beginPath();
            ctx.ellipse(cloudX, cloudY, 55, 35, 0, 0, Math.PI*2);
            ctx.ellipse(cloudX+40, cloudY-10, 48, 32, 0, 0, Math.PI*2);
            ctx.ellipse(cloudX-30, cloudY-5, 45, 30, 0, 0, Math.PI*2);
            ctx.fill();
        }
    }
    
    // РАДИО (Web Audio API)
    function initAudio() {
        if (audioContext) return;
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        gainNode = audioContext.createGain();
        gainNode.gain.value = 0.45;
        gainNode.connect(audioContext.destination);
        
        // Создаём шум ветра + мягкий фон (синтезированный звук зимы)
        const bufferSize = 4096;
        const noiseNode = audioContext.createScriptProcessor(bufferSize, 1, 1);
        noiseNode.onaudioprocess = function(e) {
            const output = e.outputBuffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                output[i] = (Math.random() * 2 - 1) * 0.15;
            }
        };
        const windFilter = audioContext.createBiquadFilter();
        windFilter.type = "lowpass";
        windFilter.frequency.value = 680;
        windFilter.Q = 2.2;
        noiseNode.connect(windFilter);
        windFilter.connect(gainNode);
        
        // легкий тональный фон (тихий гул)
        const osc = audioContext.createOscillator();
        osc.type = "sine";
        osc.frequency.value = 125;
        const oscGain = audioContext.createGain();
        oscGain.gain.value = 0.09;
        osc.connect(oscGain);
        oscGain.connect(gainNode);
        osc.start();
        
        // сохраняем узлы
        audioContext.source = noiseNode;
        audioContext.osc = osc;
        audioContext.windFilter = windFilter;
    }
    
    function startAudio() {
        if (!audioContext) {
            initAudio();
        }
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
        if (gainNode) gainNode.gain.linearRampToValueAtTime(0.5, audioContext.currentTime + 0.2);
        isPlaying = true;
        document.getElementById('playPauseBtn').innerHTML = '⏸';
    }
    
    function stopAudio() {
        if (gainNode) gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.2);
        isPlaying = false;
        document.getElementById('playPauseBtn').innerHTML = '▶';
    }
    
    function toggleRadio() {
        if (!audioContext) {
            initAudio();
            startAudio();
            return;
        }
        if (isPlaying) {
            stopAudio();
        } else {
            startAudio();
        }
    }
    
    // добавить сугроб по клику (интерактив)
    function addSnowDrift(e) {
        const rect = canvas.getBoundingClientRect();
        const clickX = (e.clientX - rect.left) * (width/rect.width);
        const clickY = (e.clientY - rect.top) * (height/rect.height);
        // создаем временный эффект: много снежинок из точки
        for (let i = 0; i < 12; i++) {
            snowflakes.push({
                x: clickX + (Math.random() - 0.5) * 30,
                y: clickY,
                radius: 2 + Math.random() * 4,
                speedY: 0.7 + Math.random() * 2,
                speedX: (Math.random() - 0.5) * 1.2,
                opacity: 0.8,
                swing: Math.random() * Math.PI * 2,
                swingSpeed: 0.02
            });
        }
        // и небольшой сугроб на земле (эффект)
        ctx.fillStyle = "#fff5e8";
        ctx.beginPath();
        ctx.ellipse(clickX, height-45, 30, 12, 0, 0, Math.PI*2);
        ctx.fill();
    }
    
    // Анимационный цикл
    let animationId;
    function animate() {
        if (!width) return;
        drawSky();
        drawGround();
        drawTrees();
        updateSnow();
        drawSnow();
        // добавим мерцание далеких огоньков
        ctx.fillStyle = "#fffbc2";
        for (let i=0;i<30;i++) {
            if (Math.random()<0.05) {
                ctx.beginPath();
                ctx.arc( (i*97)%width, height-50, 2, 0, Math.PI*2);
                ctx.fill();
            }
        }
        animationId = requestAnimationFrame(animate);
    }
    
    window.addEventListener('resize', () => {
        resizeCanvas();
        initSnow();
    });
    canvas.addEventListener('click', addSnowDrift);
    document.getElementById('playPauseBtn').addEventListener('click', toggleRadio);
    
    resizeCanvas();
    initSnow();
    animate();
