const client = supabase.createClient(SB_URL, SB_KEY);
let syncData = null;
let lastBroadcastText = "";
let lastSec = -1; 
let lastPhase = ""; // Tracks the phase to catch the transitions

// --- AUDIO SETUP ---
var msgSound = new Audio("file/notification.mp3");
var beep1 = new Audio("file/beep-1.mp3");
var beep5 = new Audio("file/countdown.mp3");
var beepEnd = new Audio("file/beep-09.mp3");

// Force preload
msgSound.preload = "auto";
beep1.preload = "auto";
beep5.preload = "auto";
beepEnd.preload = "auto";

// --- AUDIO LOGIC ---
// Abbiamo aggiunto "elapsed" per capire se il timer è partito istantaneamente (secondo 0)
function checkAudio(s, phase, elapsed) {
    
    // Carica il suono del "VIA!" un secondo prima che finisca il conto alla rovescia
    if (phase === 'pre' && s === 1) {
        beepEnd.load();
    }

    // TRANSITION 1: "GO!" Beep all'inizio del timer.
    // Suona SE: ha appena finito la fase 'pre', OPPURE se è partito istantaneamente (elapsed === 0)
    if ((lastPhase === 'pre' && (phase === 'work' || phase === 'final')) || 
        (lastPhase === '' && (phase === 'work' || phase === 'final'))) {
        console.log("Transition: START! Playing Start beep");
        beepEnd.currentTime = 0;
        beepEnd.play().catch(e => console.log("Audio blocked"));
    }

    // TRANSITION 2: "GO!" per i round successivi (Da Rest a Work)
    if (lastPhase === 'rest' && phase === 'work') {
        console.log("Transition: Rest -> Work. Playing Rest End beep");
        beepEnd.currentTime = 0;
        beepEnd.play().catch(e => console.log("Audio blocked"));
    }

    if (s !== lastSec) {
        
        // WORK & COUNTDOWN TO START
        if (phase === 'work' || phase === 'pre') {
            if (s === 65) beep1.load();
            if (s === 60) {
                console.log("Playing 60s beep");
                beep1.currentTime = 0;
                beep1.play().catch(e => console.log("Audio blocked"));
            }
            
            if (s === 10) beep5.load();
            if (s === 5) {
                console.log("Playing 5s countdown");
                beep5.currentTime = 0;
                beep5.play().catch(e => console.log("Audio blocked"));
            }
        }
        
        // REST PERIOD
        if (phase === 'rest') {
            if (s === 5) beepEnd.load();
            if (s === 0) { 
                console.log("Playing Rest End beep at 0");
                beepEnd.currentTime = 0;
                beepEnd.play().catch(e => console.log("Audio blocked"));
            }
        }

        // FINAL MODE
        if (phase === 'final') {
            if (s === 65) beep1.load();
            if (s === 60) {
                beep1.currentTime = 0;
                beep1.play().catch(e => {});
            }
            
            if (s === 10) beep5.load();
            if (s === 5) {
                beep5.currentTime = 0;
                beep5.play().catch(e => {});
            }
            
        }
        
        lastSec = s;
    }
    
    lastPhase = phase; 
}

// --- UI UPDATES ---
function updateBroadcastUI(text) {
    const container = document.getElementById("broadcast-overlay");
    const target = document.getElementById("broadcast-text");
    
    if (text === lastBroadcastText) return; 
    lastBroadcastText = text;

    if (!text || text.trim() === "") {
        container.style.opacity = "0";
        return;
    }

    msgSound.currentTime = 0; 
    msgSound.play().catch(e => {});

    target.innerText = text;
    container.style.opacity = "1";

    let fontSize = 7; 
    target.style.fontSize = fontSize + "vw";

    let safety = 0;
    while (target.scrollHeight > container.clientHeight && fontSize > 2 && safety < 25) {
        fontSize -= 0.4;
        target.style.fontSize = fontSize + "vw";
        safety++;
    }
}

function updateTimerUI(text) {
    const display = document.getElementById("demo");
    const container = document.getElementById("timer");
    const charCount = text.toString().length;
    
    let currentShift = (lastBroadcastText !== "") ? 8 : 0; 
    container.style.transform = `translateY(${currentShift}vh)`;

    let fontSizeVw = 145 / charCount;
    if (charCount <= 4) fontSizeVw = Math.min(fontSizeVw, 40); 
    if (charCount <= 2) fontSizeVw = Math.min(fontSizeVw, 55);

    display.style.fontSize = fontSizeVw + "vw";

    if (display.offsetHeight > window.innerHeight * 0.65) {
        display.style.fontSize = "65vh";
    }
}

function format(s) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m + ":" + (sec < 10 ? '0' + sec : sec);
}

// --- MAIN LOOP ---
function tick() {
    if (!syncData) return;
    const display = document.getElementById("demo");
    const bar = document.getElementById("progress-done");
    const barContainer = document.getElementById("progress-bar");

    updateBroadcastUI(syncData.broadcast_text || "");
    
    let timeText = "0:00";
    let color = "#fff";

    if (syncData.timer_status === 'running') {
        const now = Date.now();
        const master = new Date(syncData.timer_end).getTime();

        if (now < master) {
            // PRE-START
            const diff = Math.ceil((master - now) / 1000);
            timeText = format(diff);
            color = "#38bdf8"; 
            bar.style.width = "100%";
            
            // Passiamo -1 come elapsed perché non è ancora iniziato
            checkAudio(diff, 'pre', -1); 

        } else {
            const work = syncData.interval_mins * 60;
            const rest = parseInt(syncData.rest_secs);
            const elapsed = Math.floor((now - master) / 1000);

            if (syncData.final_mode) {
                // FINAL 
                const rem = Math.max(0, work - elapsed);
                timeText = format(rem);
                color = "#fff"; // Rimane bianco come richiesto
                bar.style.width = (rem / work) * 100 + "%";
                
                // Passiamo "elapsed"
                checkAudio(rem, 'final', elapsed); 

            } else {
                const cycle = work + rest;
                const t = elapsed % cycle;
                if (t < work) {
                    // WORK
                    const rem = work - t;
                    timeText = format(rem);
                    bar.style.width = (rem / work) * 100 + "%";
                    bar.style.backgroundColor = "#38bdf8";
                    
                    // Passiamo "elapsed"
                    checkAudio(rem, 'work', elapsed); 

                } else {
                    // REST
                    const rem = rest - (t - work);
                    timeText = rem.toString();
                    color = "#ef4444";
                    bar.style.width = (rem / rest) * 100 + "%";
                    bar.style.backgroundColor = "#ef4444";
                    
                    // Passiamo "elapsed"
                    checkAudio(rem, 'rest', elapsed); 
                }
            }
        }
    } else {
        color = "#222"; 
        lastSec = -1;
        lastPhase = ""; // Reset phase when stopped
    }

    display.innerText = timeText;
    display.style.color = color;
    updateTimerUI(timeText);
    barContainer.style.visibility = syncData.show_progress ? "visible" : "hidden";
}

// --- DATABASE SYNC ---
client.channel('master').on('postgres_changes', {event:'UPDATE', schema:'public', table:'live_scores'}, p => {
    syncData = p.new;
}).subscribe();

async function init() {
    const { data } = await client.from('live_scores').select('*').eq('id', 1).single();
    syncData = data;
    setInterval(tick, 150); 
}
init();