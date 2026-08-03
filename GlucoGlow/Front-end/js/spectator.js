const SERVER_URL = "http://10.178.148.212:5000";

// Haal de HTML-elementen op
const glucoseValue = document.getElementById("glucose-value");
const glucoseStatus = document.getElementById("glucose-status");
const teamStatusText = document.getElementById("team-status-text");
const missionCount = document.getElementById("mission-count");
const progressBar = document.getElementById("mission-progress-bar");
const patientMessage = document.getElementById("patient-message");

// Deze functie haalt de nieuwste status op van de Flask server
async function fetchGameState() {
    try {
        const response = await fetch(`${SERVER_URL}/get_event`);
        const data = await response.json();

        updateDashboard(data);
    } catch (error) {
        console.error("Fout bij het ophalen van serverdata:", error);
    }
}

// Deze functie past de HTML aan op basis van de Python dictionary
function updateDashboard(data) {

    // --- 1. GLUCOSE UPDATEN ---
    if (data.glucose !== -1) {
        glucoseValue.innerText = `${data.glucose} mg/dL`;

        // Verwijder oude kleurklassen
        glucoseStatus.classList.remove("stable", "warning", "danger");

        // Bepaal de statuskleur en tekst
        if (data.glucose < 55) {
            glucoseStatus.innerText = "🚨 LEVENSGEVAAR";
            glucoseStatus.classList.add("danger");
            patientMessage.innerText = "Patiënt vertoont symptomen van een zware hypo (buiten bewustzijn).";
        } else if (data.glucose >= 55 && data.glucose < 70) {
            glucoseStatus.innerText = "⚠ LAGE SUIKER";
            glucoseStatus.classList.add("warning");
            patientMessage.innerText = "Patiënt is duizelig en trilt.";
        } else if (data.glucose >= 70 && data.glucose <= 140) {
            glucoseStatus.innerText = "🟢 STABIEL";
            glucoseStatus.classList.add("stable");
            patientMessage.innerText = "Alles is stabiel. Patiënt voelt zich goed.";
        } else if (data.glucose > 140 && data.glucose <= 180) {
            glucoseStatus.innerText = "⚠ STIJGEND";
            glucoseStatus.classList.add("warning");
            patientMessage.innerText = "Glucosewaarde is verhoogd. Let op.";
        } else {
            glucoseStatus.innerText = "🚨 TE HOOG";
            glucoseStatus.classList.add("danger");
            patientMessage.innerText = "Gevaarlijke hyperglycemie gemeten.";
        }
    } else {
        glucoseValue.innerText = "-- mg/dL";
        glucoseStatus.innerText = "Geen meting";
    }

    // --- 2. QUEST / TEAM STATUS UPDATEN ---
    if (data.activeQuest === "pincode") {
        teamStatusText.innerText = "🧩 Het team is bezig met het kraken van de code.";
    } else if (data.activeQuest === "none") {
        teamStatusText.innerText = "✅ Wachten op de volgende missie...";
    } else {
        teamStatusText.innerText = `🧩 Huidige missie: ${data.activeQuest}`;
    }

    // --- 3. MISSIE VOORTGANG (Event ID) ---
    // Stel dat je 10 events/vragen hebt in totaal
    const totalEvents = 10;
    const current = data.currentEvent;

    missionCount.innerText = `${current} / ${totalEvents}`;

    // Reken het percentage uit voor de blauwe balk
    const percentage = (current / totalEvents) * 100;
    progressBar.style.width = `${percentage}%`;

    // --- 4. TIMER UPDATEN ---
    // Zet seconden (bijv 90) om naar MM:SS (01:30)
    const minutes = Math.floor(data.timer / 60);
    const seconds = data.timer % 60;
    const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    document.getElementById("game-timer").innerText = `⏱ ${formattedTime}`;

    // --- 5. GAME OVER SCHERM ---
    const gameOverScreen = document.getElementById("game-over-screen");

    if (data.game_over) {
        gameOverScreen.classList.remove("hidden");
        if (data.win) {
            document.getElementById("game-over-icon").innerText = "🎉";
            document.getElementById("game-over-title").innerText = "De patiënt is gered!";
            document.getElementById("game-over-subtitle").innerText = `Team behaalde missie ${current} / ${totalEvents}`;
        } else {
            document.getElementById("game-over-icon").innerText = "💔";
            document.getElementById("game-over-title").innerText = "Missie Mislukt";
            document.getElementById("game-over-subtitle").innerText = "De patiënt kon niet worden gestabiliseerd.";
        }
    } else {
        // Verberg het scherm als de game draait of gereset wordt
        gameOverScreen.classList.add("hidden");
    }
}

// Start de "Polling": haal elke 1000 milliseconden (1 seconde) de data op
setInterval(fetchGameState, 1000);

// Voer hem ook direct 1 keer uit bij het laden van de pagina
fetchGameState();