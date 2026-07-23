const SERVER = "http://10.91.88.212:5000";

let events = [];
let currentEvent = 0;
let wasPlaying = false;

// SCHERMEN
const waitingScreen = document.getElementById("waiting-screen");
const chatContainer = document.getElementById("chat-container");
const questScreen = document.getElementById("quest-screen");

// WACHTSCHERM ELEMENTEN
const waitingSpinner = document.getElementById("waiting-spinner");
const waitingTitle = document.getElementById("waiting-title");
const waitingText = document.getElementById("waiting-text");

// CHAT ELEMENTEN
const glucoseElement = document.getElementById("phone-glucose");
const trendElement = document.getElementById("phone-trend");
const statusElement = document.getElementById("phone-status");
const situationElement = document.getElementById("phone-situation");
const normalChatBubble = document.getElementById("normal-chat-bubble");

// ACTIE WIDGET ELEMENTEN (Tap Minigame)
const actionWidget = document.getElementById("action-widget");
const actionProgress = document.getElementById("action-progress");
const tapBtn = document.getElementById("tapBtn");

let isActionActive = false;
let taps = 0;
const requiredTaps = 10; // Pas dit aan om het makkelijker of moeilijker te maken

fetch("data/events.json")
    .then(response => response.json())
    .then(data => {
        events = data;
        setInterval(updateFromServer, 500);
    });

function updateFromServer() {
    fetch(`${SERVER}/get_event`)
        .then(response => response.json())
        .then(data => {

            // Controle: Is het spel niet bezig? (-1)
            if (data.glucose === -1) {
                chatContainer.style.display = "none";
                questScreen.style.display = "none";
                waitingScreen.style.display = "flex";

                if (wasPlaying) {
                    wasPlaying = false;
                    waitingSpinner.style.display = "none";
                    waitingTitle.textContent = "MISSIE AFGELOPEN";
                    waitingText.textContent = "Kijk naar het grote scherm voor de uitslag!";

                    setTimeout(() => {
                        waitingSpinner.style.display = "block";
                        waitingTitle.textContent = "STAND-BY";
                        waitingText.textContent = "Wachten op connectie met spelsysteem...";
                    }, 6000);
                }
                return;
            }

            wasPlaying = true;
            waitingSpinner.style.display = "block";
            waitingTitle.textContent = "STAND-BY";
            waitingText.textContent = "Wachten op connectie met spelsysteem...";
            waitingScreen.style.display = "none";

            // QUEST MAGIC
            if (data.activeQuest === "pincode") {
                chatContainer.style.display = "none";
                questScreen.style.display = "flex";
            } else {
                questScreen.style.display = "none";
                chatContainer.style.display = "flex";
            }

            // Update waarden
            currentEvent = data.currentEvent;
            glucoseElement.textContent = data.glucose;

            if (data.glucose <= 75) {
                glucoseElement.style.color = "#ef4444";
                statusElement.style.color = "#ef4444";
            } else if (data.glucose >= 160) {
                glucoseElement.style.color = "#f59e0b";
                statusElement.style.color = "#f59e0b";
            } else {
                glucoseElement.style.color = "#00a884";
                statusElement.style.color = "#00a884";
            }

            // --- NIEUWE CO-OP ACTIE LOGICA ---
            if (data.held_button !== -1 && !data.action_completed) {
                // Speler 1 houdt de knop vast! Start de minigame!
                if (!isActionActive) {
                    isActionActive = true;
                    taps = 0;
                    actionProgress.style.width = "0%";
                    tapBtn.textContent = `TAP (0/${requiredTaps})`;
                    tapBtn.style.background = "#00a884";

                    normalChatBubble.style.opacity = "0.5"; // Dim de normale tekst
                    actionWidget.style.display = "block";
                }
            } else {
                // Speler 1 heeft losgelaten, of de actie is al klaar
                if (isActionActive) {
                    isActionActive = false;
                    actionWidget.style.display = "none";
                    normalChatBubble.style.opacity = "1"; // Tekst weer normaal
                }
            }

            loadPhoneEvent();
        })
        .catch(error => console.error(error));
}

function loadPhoneEvent() {
    const event = events[currentEvent];
    if (!event) return;

    situationElement.textContent = event.title;
    trendElement.textContent = event.trend;

    if (event.type === "pincode") {
        chatContainer.style.display = "none";
        questScreen.style.display = "flex";

        document.getElementById("quest-title").textContent = event.questTitle;
        const cluesList = document.getElementById("phone-clues");
        cluesList.innerHTML = "";

        event.clues.forEach(clue => {
            let li = document.createElement("li");
            li.textContent = clue;
            cluesList.appendChild(li);
        });
        return;
    }

    if (event.type === "sidequest") {
        questScreen.style.display = "none";
        chatContainer.style.display = "flex";

        document.body.style.backgroundColor = "#7f1d1d";
        statusElement.textContent = "⚠ KALIBRATIE VEREIST";
        statusElement.style.color = "#ffffff";
        glucoseElement.textContent = "ERR";
        return;
    }

    // NORMALE GAMEPLAY UI
    questScreen.style.display = "none";
    chatContainer.style.display = "flex";
    document.body.style.backgroundColor = "#0b141a";

    if (event.trend === "↓↓" || event.trend === "↓") {
        statusElement.textContent = "⚠ RISICO OP HYPO";
    } else if (event.trend === "↑↑" || event.trend === "↑") {
        statusElement.textContent = "⚠ RISICO OP HYPER";
    } else {
        statusElement.textContent = "STABIEL";
    }
}

// --- DE TAP-GAME FUNCTIES ---

function handleTap() {
    // Taps tellen alleen als de arcade-knop fysiek wordt ingehouden!
    if (!isActionActive) return;

    taps++;
    let percentage = (taps / requiredTaps) * 100;
    actionProgress.style.width = percentage + "%";
    tapBtn.textContent = `TAP (${taps}/${requiredTaps})`;

    if (taps >= requiredTaps) {
        // ACTIE VOLTOOID!
        isActionActive = false;
        tapBtn.style.background = "#10b981";
        tapBtn.textContent = "SUCCES!";

        // Vertel de server dat de GSM de taak heeft volbracht
        fetch(`${SERVER}/complete_action`);

        setTimeout(() => {
            actionWidget.style.display = "none";
            normalChatBubble.style.opacity = "1";
        }, 1500);
    }
}

// Werkt voor mobiel én laptop browsers
tapBtn.addEventListener("touchstart", (e) => {
    e.preventDefault();
    handleTap();
});
tapBtn.addEventListener("mousedown", handleTap);