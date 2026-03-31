// ── Audio engine (shared with Sunrise) ────────────────────
let audioCtx = null;
let currentNodes = [];
let gainNode = null;

function getCtx() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        gainNode = audioCtx.createGain();
        gainNode.connect(audioCtx.destination);
    }
    return audioCtx;
}

function stopAllNodes() {
    currentNodes.forEach(n => { try { n.stop(); } catch(e) {} });
    currentNodes = [];
}

function setVol(v) { if (gainNode) gainNode.gain.linearRampToValueAtTime(v, getCtx().currentTime + 0.1); }

// ── Noise generators ─────────────────────────────────────
function genBuf(fn) {
    const ctx = getCtx();
    const size = ctx.sampleRate * 4;
    const buf = ctx.createBuffer(1, size, ctx.sampleRate);
    fn(buf.getChannelData(0));
    return buf;
}

function playNoise(fn) {
    const ctx = getCtx();
    const buf = genBuf(fn);
    const src = ctx.createBufferSource();
    src.buffer = buf; src.loop = true;
    src.connect(gainNode);
    src.start();
    currentNodes.push(src);
    return src;
}

// Brown noise
function brownNoise() {
    return playNoise(data => {
        let last = 0;
        for (let i=0; i<data.length; i++) {
            data[i] = (last + 0.02*(Math.random()*2-1)) / 1.02;
            last = data[i]; data[i] *= 3.5;
        }
    });
}

// Pink noise
function pinkNoise() {
    return playNoise(data => {
        let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;
        for (let i=0; i<data.length; i++) {
            const w = Math.random()*2-1;
            b0=0.99886*b0+w*0.0555179; b1=0.99332*b1+w*0.0750759;
            b2=0.96900*b2+w*0.1538520; b3=0.86650*b3+w*0.3104856;
            b4=0.55000*b4+w*0.5329522; b5=-0.7616*b5-w*0.0168980;
            data[i]=(b0+b1+b2+b3+b4+b5+b6+w*0.5362)*0.11;
            b6=w*0.115926;
        }
    });
}

// White noise
function whiteNoise() {
    return playNoise(data => {
        for (let i=0; i<data.length; i++) data[i] = Math.random()*2-1;
    });
}

// Rain
function rainNoise() {
    return playNoise(data => {
        let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;
        for (let i=0; i<data.length; i++) {
            const w = Math.random()*2-1;
            b0=0.99886*b0+w*0.0555179; b1=0.99332*b1+w*0.0750759;
            b2=0.96900*b2+w*0.1538520; b3=0.86650*b3+w*0.3104856;
            b4=0.55000*b4+w*0.5329522; b5=-0.7616*b5-w*0.0168980;
            let v=(b0+b1+b2+b3+b4+b5+b6+w*0.5362)*0.08;
            if (Math.random()<0.005) v *= 3;
            data[i] = v; b6=w*0.115926;
        }
    });
}

// Ocean
function oceanNoise() {
    return playNoise(data => {
        let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;
        const sw = getCtx().sampleRate * 12;
        for (let i=0; i<data.length; i++) {
            const w = Math.random()*2-1;
            b0=0.99886*b0+w*0.0555179; b1=0.99332*b1+w*0.0750759;
            b2=0.96900*b2+w*0.1538520; b3=0.86650*b3+w*0.3104856;
            b4=0.55000*b4+w*0.5329522; b5=-0.7616*b5-w*0.0168980;
            let v=(b0+b1+b2+b3+b4+b5+b6+w*0.5362)*0.08;
            const phase = (i % sw) / sw * Math.PI * 2;
            v *= 0.3 + 0.7*(0.5+0.5*Math.sin(phase));
            data[i] = v; b6=w*0.115926;
        }
    });
}

// Birds — randomized chirps
function birdsNoise() {
    const ctx = getCtx();
    function chirp() {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = 1200 + Math.random()*800;
        g.gain.setValueAtTime(0.15, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+0.25);
        osc.connect(g); g.connect(gainNode);
        osc.start(ctx.currentTime); osc.stop(ctx.currentTime+0.25);
        if (running) setTimeout(chirp, 300+Math.random()*600);
    }
    chirp();
}

// Singing bowl
function bowlSound() {
    const ctx = getCtx();
    function strike() {
        [220, 440, 880, 1320].forEach((f,i) => {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = 'sine'; osc.frequency.value = f;
            const vol = 0.2/(i+1);
            g.gain.setValueAtTime(vol, ctx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime+4);
            osc.connect(g); g.connect(gainNode);
            osc.start(ctx.currentTime); osc.stop(ctx.currentTime+4);
        });
    }
    strike();
    setTimeout(strike, 8000);
}

// Wind
function windNoise() {
    return playNoise(data => {
        let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;
        for (let i=0; i<data.length; i++) {
            const w = Math.random()*2-1;
            b0=0.99886*b0+w*0.0555179; b1=0.99332*b1+w*0.0750759;
            b2=0.96900*b2+w*0.1538520; b3=0.86650*b3+w*0.3104856;
            b4=0.55000*b4+w*0.5329522; b5=-0.7616*b5-w*0.0168980;
            let v=(b0+b1+b2+b3+b4+b5+b6+w*0.5362)*0.06;
            const wind = Math.sin(i/getCtx().sampleRate * Math.PI * 0.3);
            v *= 0.2 + 0.8*Math.abs(wind);
            data[i] = v; b6=w*0.115926;
        }
    });
}

// ── Sound mapper ──────────────────────────────────────────
const SOUND_MAP = {
    silence: ()=>{}, ocean: oceanNoise, rain: rainNoise, birds: birdsNoise,
    bowl: bowlSound, wind: windNoise,
    brown: brownNoise, pink: pinkNoise, white: whiteNoise,
};

// ── Meditation ────────────────────────────────────────────
let timerInt = null;
let running = false;
let selectedMin = 10;
let selectedSound = 'silence';
let medStart = null;

// Stats from localStorage
function getStats() {
    try { return JSON.parse(localStorage.getItem('mindful_stats')) || {sessions:0,minutes:0,streak:0,lastDate:null}; }
    catch(e){ return {sessions:0,minutes:0,streak:0,lastDate:null}; }
}
function saveStats(s) { localStorage.setItem('mindful_stats', JSON.stringify(s)); }

function showStats() {
    const st = getStats();
    $('statSessions').textContent = st.sessions;
    $('statMinutes').textContent = st.minutes;
    $('statStreak').textContent = st.streak;
}

const $ = id => document.getElementById(id);

function fmtTime(sec) {
    const m = Math.floor(sec/60);
    const s = sec%60;
    return String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0');
}

function updateRing(pct) {
    const circ = 2 * Math.PI * 90;
    const offset = circ * (1-pct);
    $('ringProgress').style.strokeDashoffset = offset;
}

function startMeditation() {
    getCtx();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    setVol($('medVolume').value / 100);
    stopAllNodes();
    SOUND_MAP[selectedSound]();

    running = true;
    medStart = Date.now();
    const totalSec = selectedMin * 60;
    let elapsed = 0;
    $('medStartBtn').textContent = 'Stop';
    $('medStartBtn').classList.add('running');
    $('timerLabel').textContent = 'Breathe…';

    function tick() {
        elapsed++;
        const remaining = totalSec - elapsed;
        $('timerDisplay').textContent = fmtTime(Math.max(0, remaining));
        updateRing(1 - remaining/totalSec);
        if (remaining <= 0) {
            endMeditation(totalSec);
        }
    }
    timerInt = setInterval(tick, 1000);
}

function stopMeditation() {
    if (timerInt) clearInterval(timerInt);
    timerInt = null;
    running = false;
    stopAllNodes();
    const elapsed = Math.floor((Date.now() - medStart) / 1000);
    medStart = null;
    $('medStartBtn').textContent = 'Start Meditation';
    $('medStartBtn').classList.remove('running');
    $('timerDisplay').textContent = fmtTime(selectedMin * 60);
    $('timerLabel').textContent = 'Set duration';
    $('ringProgress').style.strokeDashoffset = 0;
    updateRing(0);

    if (elapsed > 10) {
        const st = getStats();
        const mins = Math.round(elapsed / 60);
        st.sessions++;
        st.minutes += mins;
        // Streak: consecutive days
        const today = new Date().toISOString().slice(0,10);
        if (st.lastDate !== today) {
            const yesterday = new Date(Date.now()-86400000).toISOString().slice(0,10);
            st.streak = st.lastDate === yesterday ? st.streak+1 : 1;
            st.lastDate = today;
        }
        saveStats(st);
        showStats();
    }
}

$('medStartBtn').addEventListener('click', () => {
    if (running) stopMeditation(); else startMeditation();
});

// Duration pills
document.querySelectorAll('.pill').forEach(p => p.addEventListener('click', () => {
    document.querySelectorAll('.pill').forEach(x=>x.classList.remove('selected'));
    p.classList.add('selected');
    selectedMin = parseInt(p.dataset.min);
    $('timerDisplay').textContent = fmtTime(selectedMin*60);
    if (!running) updateRing(0);
}));
$('timerDisplay').textContent = fmtTime(selectedMin*60);

// Sound pills
document.querySelectorAll('.sound-pill').forEach(p => p.addEventListener('click', () => {
    document.querySelectorAll('.sound-pill').forEach(x=>x.classList.remove('selected'));
    p.classList.add('selected');
    selectedSound = p.dataset.sound;
}));

$('medVolume').addEventListener('input', e => {
    $('medVolVal').textContent = e.target.value + '%';
    setVol(e.target.value/100);
});

// ── Breathing ─────────────────────────────────────────────
const PATTERNS = {
    box:    {inhale:4, holdIn:4, exhale:4, holdOut:4, label:'Box'},
    relax:  {inhale:4, holdIn:7, exhale:8, holdOut:0, label:'4-7-8 Relax'},
    balance:{inhale:4, holdIn:0, exhale:4, holdOut:0, label:'4-4 Balance'},
    energy: {inhale:4, holdIn:4, exhale:4, holdOut:0, label:'4-4-4 Energy'},
};

let breathRunning = false;
let breathInt = null;
let breathPattern = 'box';

function startBreathing() {
    if (!getCtx() || audioCtx.state === 'suspended') getCtx();
    breathRunning = true;
    const pat = PATTERNS[breathPattern];
    const rounds = parseInt($('breathRounds').value);
    let round = 0;
    const phases = [];
    if (pat.inhale) phases.push({text:'Breathe in', cls:'inhale', dur:pat.inhale});
    if (pat.holdIn) phases.push({text:'Hold', cls:'hold', dur:pat.holdIn});
    if (pat.exhale) phases.push({text:'Breathe out', cls:'exhale', dur:pat.exhale});
    if (pat.holdOut) phases.push({text:'Hold', cls:'hold', dur:pat.holdOut});

    let step = 0;
    function runPhase() {
        if (!breathRunning) return;
        const ph = phases[step % phases.length];
        if (step % phases.length === 0) round++;
        if (round > rounds) { endBreathing(); return; }
        $('breathText').textContent = ph.text;
        const circle = $('breathCircle');
        circle.className = 'breath-circle ' + ph.cls;
        const dur = ph.dur * 1000;
        breathInt = setTimeout(() => { step++; runPhase(); }, dur);
    }
    runPhase();
    $('breathStartBtn').textContent = 'Stop';
    $('breathStartBtn').classList.add('running');
}

function endBreathing() {
    breathRunning = false;
    if (breathInt) clearTimeout(breathInt);
    breathInt = null;
    $('breathText').textContent = 'Done';
    $('breathCircle').className = 'breath-circle';
    $('breathStartBtn').textContent = 'Start Breathing Session';
    $('breathStartBtn').classList.remove('running');
}

$('breathStartBtn').addEventListener('click', () => {
    if (breathRunning) endBreathing();
    else startBreathing();
});

$('breathRounds').addEventListener('input', e => { $('roundsVal').textContent = e.target.value; });

document.querySelectorAll('.pattern-chip').forEach(p => p.addEventListener('click', () => {
    document.querySelectorAll('.pattern-chip').forEach(x=>x.classList.remove('selected'));
    p.classList.add('selected');
    breathPattern = p.dataset.pattern;
}));

// ── Tab switching ─────────────────────────────────────────
document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(x=>x.classList.remove('selected'));
    t.classList.add('active');
    $('meditationPanel').classList.toggle('hidden', t.dataset.tab !== 'meditation');
    $('breathPanel').classList.toggle('hidden', t.dataset.tab !== 'breath');
}));

// Init
showStats();
