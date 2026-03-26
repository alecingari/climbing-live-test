const client = supabase.createClient(SB_URL, SB_KEY);
let syncData = null;
let lastBroadcastText = ""; 
let lastSec = -1; // Guard so it only beeps once per second

// 1. AUDIO FILES (Declared globally just like your old file)
var msgSound = new Audio("./file/notification.mp3");
var beep1 = new Audio("./file/beep-1.mp3");
var beep5 = new Audio("./file/countdown.mp3");
var beepEnd = new Audio("./file/beep-09.mp3");

// 2. AUDIO LOGIC (Replicating your old load/play logic)
function checkAudio(s, phase) {
    if (s !== lastSec) {
        
        // SOUNDS FOR WORK & COUNTDOWN TO START
        if (phase === 'work' || phase === 'pre') {
            if (s === 65) beep1.load();
            if (s === 60) beep1.play().catch(e => console.log("Click page to allow audio"));
            
            if (s === 10) beep5.load();
            if (s === 5) beep5.play().catch(e => console.log("Click page to allow audio"));
        }
        
        // SOUNDS FOR REST PERIOD
        if (phase === 'rest') {
            if (s === 5) beepEnd.load();
            if (s === 0) beepEnd.play().catch(e => console.log("Click page to allow audio"));
        }

        // FINAL MODE (Has work sounds, plus the end sound at 0)
        if (phase === 'final') {
            if (s === 65) beep1.load();
            if (s === 60) beep1.play().catch(e => console.log("Click page to allow audio"));
            
            if (s === 10) beep5.load();
            if (s === 5) beep5.play().catch(e => console.log("Click page to allow audio"));
            
            if (s === 5) beepEnd.load();
            if (s === 0) beepEnd.play().catch(e => console.log("Click page to allow audio"));
        }
        
        lastSec = s;
    }
}

// 3. BROADCAST UI & SOUND
function updateBroadcastUI(text) {
    const container = document.getElementById("broadcast-overlay");
    const target = document.getElementById("broadcast-text");
    
    if (text === lastBroadcastText) return; 
    lastBroadcastText = text;

    if (!text || text.trim() === "") {
        container.style.opacity = "0"; 
        return;
    }

    // Play notification sound when a new message pops up
    msgSound.currentTime = 0; 
    msgSound.play().catch(e => {});

    target.innerText = text;
    container.style.opacity = "1"; 

    let fontSize = 7.5; 
    target.style.fontSize = fontSize + "vw";

    let safety = 0;
    while (target.scrollHeight > container.clientHeight && fontSize > 2 && safety < 25) {
        fontSize -= 0.4;
        target.style.fontSize = fontSize + "vw";
        safety++;
    }
}

// 4. TIMER UI (Smooth Slide & Font Scale)
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

// 5. THE MAIN TICK LOOP
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
            // 1. PRE-START PHASE
            const diff = Math.ceil((master - now) / 1000);
            timeText = format(diff);
            color = "#38bdf8";
            bar.style.width = "100%";
            
            checkAudio(diff, 'pre'); // <--- Added 'pre'

        } else {
            const work = syncData.interval_mins * 60;
            const rest = parseInt(syncData.rest_secs);
            const elapsed = Math.floor((now - master) / 1000);

            if (syncData.final_mode) {
                // 2. FINAL PHASE
                const rem = Math.max(0, work - elapsed);
                timeText = format(rem);
                color = rem <= 10 ? "#ef4444" : "#fff";
                bar.style.width = (rem / work) * 100 + "%";
                
                checkAudio(rem, 'final'); // <--- Added 'final'

            } else {
                const cycle = work + rest;
                const t = elapsed % cycle;
                if (t < work) {
                    // 3. WORK PHASE
                    const rem = work - t;
                    timeText = format(rem);
                    bar.style.width = (rem / work) * 100 + "%";
                    bar.style.backgroundColor = "#38bdf8";
                    
                    checkAudio(rem, 'work'); // <--- Added 'work'

                } else {
                    // 4. REST PHASE
                    const rem = rest - (t - work);
                    timeText = rem.toString();
                    color = "#ef4444";
                    bar.style.width = (rem / rest) * 100 + "%";
                    bar.style.backgroundColor = "#ef4444";
                    
                    checkAudio(rem, 'rest'); // <--- Added 'rest'
                }
            }
        }
    } else {
        color = "#222"; 
        lastSec = -1;
    }

    display.innerText = timeText;
    display.style.color = color;
    updateTimerUI(timeText);
    barContainer.style.visibility = syncData.show_progress ? "visible" : "hidden";
}

client.channel('master').on('postgres_changes', {event:'UPDATE', schema:'public', table:'live_scores'}, p => syncData = p.new).subscribe();

async function init() {
    const { data } = await client.from('live_scores').select('*').eq('id', 1).single();
    syncData = data;
    setInterval(tick, 150); 
}
init();