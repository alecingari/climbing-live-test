const client = supabase.createClient(SB_URL, SB_KEY);
let syncData = null;

// Audio Assets
const beep1 = new Audio("./file/beep-1.mp3");
const beep5 = new Audio("./file/countdown.mp3");
const beep15 = new Audio("./file/beep-09.mp3");

/**
 * AUTO-SCALING FONT LOGIC
 * Calculates font size based on character count to ensure 
 * long strings like mmmmmm:ss always fit.
 */
function updateResponsiveFont(text) {
    const display = document.getElementById("demo");
    const charCount = text.toString().length;
    let fontSizeVw;

    if (charCount <= 4) {
        fontSizeVw = 45; // e.g., 0:00
    } else if (charCount <= 5) {
        fontSizeVw = 38; // e.g., 00:00
    } else {
        // Dynamic shrink: 170/charCount keeps text at ~90% width
        fontSizeVw = 170 / charCount;
    }

    display.style.fontSize = fontSizeVw + "vw";

    // Safety check for vertical height overflow
    if (display.offsetHeight > window.innerHeight * 0.8) {
        display.style.fontSize = "70vh";
    }
}

function format(s) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    const timeString = `${m}:${sec < 10 ? '0' + sec : sec}`;
    updateResponsiveFont(timeString);
    return timeString;
}

function tick() {
    if (!syncData) return;

    const display = document.getElementById("demo");
    const broadcast = document.getElementById("broadcast-overlay");
    const progress = document.getElementById("progress-bar");
    const bar = document.getElementById("progress-done");

    // Update Broadcast Text
    broadcast.innerText = syncData.broadcast_text || "";

    // Handle Stopped State
    if (syncData.timer_status !== 'running') {
        display.innerText = "START";
        display.style.color = "#fff";
        updateResponsiveFont("START");
        progress.style.visibility = "hidden";
        return;
    }

    // Timer Logic
    const now = Date.now();
    const master = new Date(syncData.timer_end).getTime();
    progress.style.visibility = syncData.show_progress ? "visible" : "hidden";

    if (now < master) {
        // COUNTDOWN TO START
        const diff = Math.ceil((master - now) / 1000);
        display.innerText = diff;
        display.style.color = "#38bdf8";
        updateResponsiveFont(diff);
        
        // Progress Bar for countdown
        bar.style.width = "100%";
        
        if(diff === 5) beep5.play();
    } else {
        // LIVE SESSIONS
        const work = syncData.interval_mins * 60;
        const rest = parseInt(syncData.rest_secs);
        const elapsed = Math.floor((now - master) / 1000);

        if (syncData.final_mode) {
            // FINAL MODE: Simple Countdown
            const remaining = Math.max(0, work - elapsed);
            display.innerText = format(remaining);
            display.style.color = remaining <= 10 ? "#ef4444" : "#fff";
            bar.style.width = (remaining / work) * 100 + "%";
            
            if(remaining === 60) beep1.play();
            if(remaining === 5) beep5.play();
        } else {
            // INTERVAL MODE: Work/Rest Cycles
            const cycle = work + rest;
            const timeInCycle = elapsed % cycle;

            if (timeInCycle < work) {
                // WORK PERIOD
                const remaining = work - timeInCycle;
                display.innerText = format(remaining);
                display.style.color = "#fff";
                bar.style.width = (remaining / work) * 100 + "%";
                bar.style.background = "#38bdf8";
                
                if(remaining === 60) beep1.play();
                if(remaining === 5) beep5.play();
            } else {
                // REST PERIOD
                const remaining = rest - (timeInCycle - work);
                display.innerText = remaining;
                display.style.color = "#ef4444";
                updateResponsiveFont(remaining);
                bar.style.width = (remaining / rest) * 100 + "%";
                bar.style.background = "#ef4444";
                
                if(remaining === 5) beep15.play();
            }
        }
    }
}

// Supabase Realtime Subscription
client.channel('public:live_scores')
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'live_scores' }, payload => {
        syncData = payload.new;
    })
    .subscribe();

async function init() {
    const { data } = await client.from('live_scores').select('*').eq('id', 1).single();
    syncData = data;
    setInterval(tick, 200); // High frequency for smooth progress bar
}

init();