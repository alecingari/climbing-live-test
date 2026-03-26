const client = supabase.createClient(SB_URL, SB_KEY);
let syncData = null;
let lastSec = -1;

// Audio Assets
const beep1 = new Audio("./beep-1.mp3");
const beep5 = new Audio("./countdown.mp3");
const beepEnd = new Audio("./beep-09.mp3");

function updateResponsiveFont(text) {
    const display = document.getElementById("demo");
    const charCount = text.toString().length;
    
    // We use 150 instead of 170 to give a safety margin on the left/right
    let fontSizeVw = 150 / charCount;

    // Cap the size for short strings so they don't look ridiculous
    if (charCount <= 4) fontSizeVw = Math.min(fontSizeVw, 42); 
    if (charCount <= 2) fontSizeVw = Math.min(fontSizeVw, 55);

    display.style.fontSize = fontSizeVw + "vw";

    // HEIGHT SAFETY CHECK
    // If the font is too tall (overflowing top/bottom), we switch to VH
    if (display.offsetHeight > window.innerHeight * 0.75) {
        display.style.fontSize = "75vh";
    }
}

function format(s) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    const timeString = m + ":" + (sec < 10 ? '0' + sec : sec);
    return timeString;
}

function checkAudio(s) {
    if (s !== lastSec) {
        if (s === 60) beep1.play();
        if (s === 5) beep5.play();
        if (s === 0) beepEnd.play();
        lastSec = s;
    }
}

function tick() {
    if (!syncData) return;

    const display = document.getElementById("demo");
    const broadcast = document.getElementById("broadcast-overlay");
    const bar = document.getElementById("progress-done");
    const barContainer = document.getElementById("progress-bar");

    broadcast.innerText = syncData.broadcast_text || "";
    barContainer.style.visibility = syncData.show_progress ? "visible" : "hidden";

    if (syncData.timer_status !== 'running') {
        display.innerText = "0:00";
        display.style.color = "#333";
        updateResponsiveFont("0:00");
        return;
    }

    const now = Date.now();
    const master = new Date(syncData.timer_end).getTime();

    if (now < master) {
        const diff = Math.ceil((master - now) / 1000);
        display.innerText = diff;
        display.style.color = "#38bdf8";
        updateResponsiveFont(diff);
        bar.style.width = "100%";
    } else {
        const work = syncData.interval_mins * 60;
        const rest = parseInt(syncData.rest_secs);
        const elapsed = Math.floor((now - master) / 1000);

        if (syncData.final_mode) {
            const rem = Math.max(0, work - elapsed);
            const str = format(rem);
            display.innerText = str;
            display.style.color = rem <= 10 ? "#ef4444" : "#fff";
            updateResponsiveFont(str);
            bar.style.width = (rem / work) * 100 + "%";
            checkAudio(rem);
        } else {
            const cycle = work + rest;
            const time = elapsed % cycle;

            if (time < work) {
                const rem = work - time;
                const str = format(rem);
                display.innerText = str;
                display.style.color = "#fff";
                updateResponsiveFont(str);
                bar.style.width = (rem / work) * 100 + "%";
                bar.style.backgroundColor = "#38bdf8";
                checkAudio(rem);
            } else {
                const rem = rest - (time - work);
                display.innerText = rem;
                display.style.color = "#ef4444";
                updateResponsiveFont(rem);
                bar.style.width = (rem / rest) * 100 + "%";
                bar.style.backgroundColor = "#ef4444";
                checkAudio(rem);
            }
        }
    }
}

client.channel('master').on('postgres_changes', {event:'UPDATE', schema:'public', table:'live_scores'}, p => syncData = p.new).subscribe();

async function init() {
    const { data } = await client.from('live_scores').select('*').eq('id', 1).single();
    syncData = data;
    setInterval(tick, 100);
}

init();