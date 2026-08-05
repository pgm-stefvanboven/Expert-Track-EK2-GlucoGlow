const SERVER_URL = "http://10.178.148.212:5000";

// Retrieve the HTML elements
const glucoseValue = document.getElementById("glucose-value");
const glucoseStatus = document.getElementById("glucose-status");
const teamStatusText = document.getElementById("team-status-text");
const missionCount = document.getElementById("mission-count");
const progressBar = document.getElementById("mission-progress-bar");
const patientMessage = document.getElementById("patient-message");
const lastEventText = document.getElementById("last-event");

let eventsData = [];

// Load the events so that viewers can follow along with the story
fetch("data/events.json?v=" + new Date().getTime())
    .then(response => response.json())
    .then(data => { eventsData = data; })
    .catch(error => console.error("Kan events niet laden:", error));

async function fetchGameState() {
    try {
        const response = await fetch(`${SERVER_URL}/get_event`);
        const data = await response.json();
        updateDashboard(data);
    } catch (error) {
        console.error("Fout bij het ophalen van serverdata:", error);
    }
}

function updateDashboard(data) {
    // First, delete all the old color classes
    glucoseStatus.classList.remove("stable", "warning", "danger", "standby", "hidden-state");
    glucoseValue.classList.remove("blur-text");

    // --- 1. START SCREEN ---
    if (data.game_state === "START") {
        glucoseValue.innerText = "STAND-BY";
        glucoseStatus.innerText = "WACHTEN OP TEAM";
        glucoseStatus.classList.add("standby");
        patientMessage.innerText = "Het systeem is klaar voor een nieuwe simulatie.";
        teamStatusText.innerText = "Geen actieve missie.";
        lastEventText.innerText = "Vorig team is afgerond.";
        document.getElementById("game-timer").innerText = `⏱ 00:00`;
        progressBar.style.width = `0%`;
        document.getElementById("game-over-screen").classList.add("hidden");
        return; // Stop met het updaten van de rest
    }

    // --- 2. UPDATE GLUCOSE (USING ANTI-SPOILER LOGIC) ---
    if (!data.is_scanned && data.activeQuest === "none") {
        // The player hasn't scanned yet! Build up the suspense.
        glucoseValue.innerText = "???";
        glucoseValue.classList.add("blur-text");
        glucoseStatus.innerText = "WACHTEN OP SCAN";
        glucoseStatus.classList.add("hidden-state");
        patientMessage.innerText = "Patiëntdata is momenteel verborgen. Speler moet de sensor scannen.";
    }
    else if (data.glucose !== -1) {
        // The value may be displayed
        glucoseValue.innerText = `${data.glucose} mg/dL`;

        if (data.glucose <= 75) {
            glucoseStatus.innerText = "🚨 HYPO (TE LAAG)";
            glucoseStatus.classList.add("danger");
            patientMessage.innerText = "Patiënt vertoont symptomen van een hypo (trillen, zweten, wazig zien).";
        } else if (data.glucose >= 160) {
            glucoseStatus.innerText = "⚠ HYPER (TE HOOG)";
            glucoseStatus.classList.add("warning");
            patientMessage.innerText = "Glucosewaarde is verhoogd. Kans op verzuring.";
        } else {
            glucoseStatus.innerText = "🟢 STABIEL";
            glucoseStatus.classList.add("stable");
            patientMessage.innerText = "Alles is stabiel. Patiënt voelt zich goed.";
        }
    }

    // --- 3. SHOW CURRENT STORY (EVENT) ---
    if (eventsData.length > 0 && data.currentEvent < eventsData.length) {
        const currentStory = eventsData[data.currentEvent];
        lastEventText.innerText = `${currentStory.icon || '💬'} ${currentStory.title}`;
    }

    // --- 4. QUEST / UPDATE TEAM STATUS ---
    if (data.activeQuest === "pincode") {
        teamStatusText.innerText = "🔒 POMP GEBLOKKEERD: Het team zoekt de pincode.";
        glucoseValue.innerText = "ERR";
        glucoseStatus.innerText = "SYSTEEMFOUT";
        glucoseStatus.classList.add("danger");
    } else if (data.held_button !== -1) {
        teamStatusText.innerText = "ACTIE GESELECTEERD: Zorgverlener voert de handeling uit op de GSM!";
    } else {
        teamStatusText.innerText = "Team overlegt over de juiste medische handeling...";
    }

    // --- 5. MISSIE VOORTGANG & TIMER ---
    const totalEvents = 10;
    let current = data.currentEvent + 1; // +1 for visual display
    if (current > totalEvents) current = totalEvents;

    missionCount.innerText = `${current} / ${totalEvents}`;
    progressBar.style.width = `${(current / totalEvents) * 100}%`;

    const minutes = Math.floor(data.timer / 60);
    const seconds = data.timer % 60;
    const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    document.getElementById("game-timer").innerText = `⏱ ${formattedTime}`;

    // --- 6. GAME OVER SCHERM ---
    const gameOverScreen = document.getElementById("game-over-screen");
    if (data.game_over) {
        gameOverScreen.classList.remove("hidden");
        if (data.win) {
            document.getElementById("game-over-icon").innerText = "🎉";
            document.getElementById("game-over-title").innerText = "MISSIE GESLAAGD";
            document.getElementById("game-over-subtitle").innerText = "Thomas is veilig thuisgekomen.";
        } else {
            document.getElementById("game-over-icon").innerText = "💔";
            document.getElementById("game-over-title").innerText = "MISSIE MISLUKT";
            document.getElementById("game-over-subtitle").innerText = "De patiënt kon niet worden gestabiliseerd.";
        }
    } else {
        gameOverScreen.classList.add("hidden");
    }
}

setInterval(fetchGameState, 1000);
fetchGameState();