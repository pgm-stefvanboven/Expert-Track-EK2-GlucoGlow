const SERVER = "http://172.31.149.212:5000";

let events = [];
let currentEvent = 0;
let wasPlaying = false;
let isTransitioning = false;
let waitingForPi = false;

// DOM ELEMENTEN
const waitingScreen = document.getElementById("waiting-screen");
const chatContainer = document.getElementById("chat-container");
const questScreen = document.getElementById("quest-screen");

const waitingSpinner = document.getElementById("waiting-spinner");
const waitingTitle = document.getElementById("waiting-title");
const waitingText = document.getElementById("waiting-text");

const glucoseElement = document.getElementById("phone-glucose");
const statusElement = document.getElementById("phone-status");
const situationElement = document.getElementById("phone-situation");
const normalChatBubble = document.getElementById("normal-chat-bubble");
const chatHistoryBox = document.getElementById("chat-history-box");
const actionHintText = document.getElementById("action-hint-text");

const chatInputArea = document.getElementById("chat-input-area");
const glucoseInput = document.getElementById("glucose-input");
const sendGlucoseBtn = document.getElementById("send-glucose-btn");
const earlyHoldWarning = document.getElementById("early-hold-warning");

// AUDIO ELEMENTEN
const soundMessageSend = new Audio('assets/sounds/message-send.mp3');
const soundMessageReceived = new Audio('assets/sounds/message-received.mp3');

let currentSecretGlucose = 0;
let diagnosisCompleted = false;

// ACTION WIDGET ELEMENTEN
const actionWidget = document.getElementById("action-widget");
const actionProgress = document.getElementById("action-progress");
const tapBtn = document.getElementById("tapBtn");
const actionTitle = document.getElementById("action-title");
const actionText = document.getElementById("action-text");
const progressContainer = document.getElementById("progress-container");

let isActionActive = false;
let taps = 0;
let requiredTaps = 10;

// Laad de events uit de JSON
fetch("data/events.json")
    .then(response => response.json())
    .then(data => {
        events = data;
        setInterval(updateFromServer, 500);
    });

// Update GSM status vanuit server
function updateFromServer() {
    if (isTransitioning) return;

    fetch(`${SERVER}/get_event`)
        .then(response => response.json())
        .then(data => {

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

            // RESET bij nieuw event
            if (data.currentEvent !== currentEvent) {
                currentEvent = data.currentEvent;
                diagnosisCompleted = false;
                isActionActive = false;
                waitingForPi = false;

                actionWidget.style.display = "none";
                earlyHoldWarning.style.display = "none";
                chatInputArea.style.display = "flex";
                document.querySelectorAll(".dynamic-bubble").forEach(el => el.remove());
            }

            if (waitingForPi) return;

            // QUEST OF NORMAL CHAT SCHERM
            if (data.activeQuest === "pincode" || (events[currentEvent] && events[currentEvent].type === "pincode")) {
                chatContainer.style.display = "none";
                questScreen.style.display = "flex";
            } else if (events[currentEvent] && events[currentEvent].type === "sidequest") {
                questScreen.style.display = "none";
                chatContainer.style.display = "flex";
            } else {
                questScreen.style.display = "none";
                chatContainer.style.display = "flex";
            }

            currentSecretGlucose = data.glucose;

            // SENSOR WEERGAVE
            if (diagnosisCompleted) {
                glucoseElement.textContent = currentSecretGlucose;
                statusElement.textContent = currentSecretGlucose <= 75 ? "LAAG" : (currentSecretGlucose >= 160 ? "HOOG" : "STABIEL");

                if (currentSecretGlucose <= 75) {
                    glucoseElement.style.color = "#ef4444";
                    statusElement.style.color = "#ef4444";
                } else if (currentSecretGlucose >= 160) {
                    glucoseElement.style.color = "#f59e0b";
                    statusElement.style.color = "#f59e0b";
                } else {
                    glucoseElement.style.color = "#00a884";
                    statusElement.style.color = "#00a884";
                }
            } else {
                glucoseElement.textContent = "???";
                glucoseElement.style.color = "#e9edef";
                statusElement.textContent = "⚠ VRAAG DATA AAN PATIËNT";
                statusElement.style.color = "#f59e0b";
            }

            // CO-OP ACTIE TRIGGERING
            if (data.held_button !== -1 && !data.action_completed) {
                if (diagnosisCompleted) {
                    earlyHoldWarning.style.display = "none";

                    if (!isActionActive) {
                        setupActionType(events[currentEvent]);
                    }
                } else {
                    actionWidget.style.display = "none";
                    earlyHoldWarning.style.display = "block";
                    chatHistoryBox.scrollTop = chatHistoryBox.scrollHeight;
                }
            } else {
                earlyHoldWarning.style.display = "none";
                if (isActionActive) {
                    isActionActive = false;
                    actionWidget.style.display = "none";
                    normalChatBubble.style.opacity = "1";
                    actionHintText.style.display = "block";
                }
            }

            loadPhoneEvent();
        });
}

function loadPhoneEvent() {
    const event = events[currentEvent];
    if (!event) return;

    const headerName = document.getElementById("header-name");
    const headerAvatar = document.getElementById("header-avatar");
    const dynamicHeader = document.getElementById("dynamic-header");
    const headerStatusText = document.getElementById("header-status-text");

    if (event.source === "mama") {
        headerName.textContent = "Mama";
        headerAvatar.textContent = "👩";
        headerStatusText.textContent = "Online";
    } else if (event.source === "school") {
        headerName.textContent = "School";
        headerAvatar.textContent = "🏫";
        headerStatusText.textContent = "Melding";
    } else if (event.source === "sensor") {
        headerName.textContent = "Sensor Systeem";
        headerAvatar.textContent = "📱";
        headerStatusText.textContent = "Live Data";
    } else {
        headerName.textContent = "Thomas";
        headerAvatar.textContent = "💬";
        headerStatusText.textContent = "Online";
    }

    const themeColors = {
        "sport": "#15803d",
        "school": "#0369a1",
        "party": "#7e22ce",
        "emergency": "#b91c1c",
        "travel": "#ca8a04",
        "home": "#0f766e",
        "sick": "#c2410c",
        "system": "#374151",
        "error": "#ef4444"
    };

    dynamicHeader.style.backgroundColor = themeColors[event.theme] || "#202c33";
    const eventIcon = event.icon ? `${event.icon} ` : "";
    situationElement.innerHTML = `<b>${eventIcon}</b> ${event.title}`;

    if (event.type === "pincode") {
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
        document.body.style.backgroundColor = "#7f1d1d";
        statusElement.textContent = "⚠ KALIBRATIE VEREIST";
        statusElement.style.color = "#ffffff";
        glucoseElement.textContent = "ERR";
        return;
    }

    document.body.style.backgroundColor = "#0b141a";
}

// AFHANDELING GLUCOSE INVOER (Geen antwoord meer, enkel informatie!)
function handleGlucoseSubmit() {
    if (diagnosisCompleted || !wasPlaying) return;

    const ingevoerdeWaarde = parseInt(glucoseInput.value);
    glucoseInput.value = "";

    if (isNaN(ingevoerdeWaarde)) return;

    soundMessageSend.play();

    const gestuurdBericht = document.createElement("div");
    gestuurdBericht.className = "message sent dynamic-bubble";
    gestuurdBericht.style.alignSelf = "flex-end";
    gestuurdBericht.style.backgroundColor = "#005c4b";
    gestuurdBericht.style.padding = "8px 15px";
    gestuurdBericht.style.borderRadius = "15px 15px 0 15px";
    gestuurdBericht.style.marginBottom = "10px";
    gestuurdBericht.innerHTML = `<div class="bubble-text" style="color: white;">Ingevoerde waarde: <b>${ingevoerdeWaarde} mg/dL</b></div>`;

    chatHistoryBox.insertBefore(gestuurdBericht, actionWidget);
    chatHistoryBox.scrollTop = chatHistoryBox.scrollHeight;

    if (ingevoerdeWaarde === currentSecretGlucose) {
        diagnosisCompleted = true;
        setTimeout(() => soundMessageReceived.play(), 500);

        const event = events[currentEvent];
        let statusText = ingevoerdeWaarde <= 75 ? "LAAG" : (ingevoerdeWaarde >= 160 ? "HOOG" : "NORMAAL");

        // Informatieve repons op de GSM (GEEN direct antwoord!)
        const assistentAntwoord = document.createElement("div");
        assistentAntwoord.className = "message system dynamic-bubble";
        assistentAntwoord.innerHTML = `
            <div class="bubble-widget" style="background: #1f2c34; border: 1px solid #3b82f6; padding: 15px; border-radius: 10px; margin-bottom: 15px; text-align: left;">
                <span style="color: #60a5fa; font-weight: bold; font-size: 1.1rem;">📊 WAARDE: ${ingevoerdeWaarde} mg/dL — ${statusText}</span><br><br>
                <span style="color: #cbd5e1; font-size: 0.95rem; line-height: 1.4; display: block;">${event.contextInfo || "Overleg samen met Speler 1 welke behandeling nu het beste past."}</span>
            </div>`;

        chatHistoryBox.insertBefore(assistentAntwoord, actionWidget);
        chatHistoryBox.scrollTop = chatHistoryBox.scrollHeight;
        chatInputArea.style.display = "none";

    } else {
        const assistentFout = document.createElement("div");
        assistentFout.className = "message system dynamic-bubble";
        assistentFout.innerHTML = `
            <div class="bubble-widget" style="background: #3b2c00; border: 1px solid #ef4444; padding: 10px; border-radius: 10px; margin-bottom: 15px;">
                <span style="color: #ef4444;">⚠️ Foutieve waarde! Vraag Speler 1 om de glucose opnieuw te scannen.</span>
            </div>`;

        setTimeout(() => soundMessageReceived.play(), 500);
        chatHistoryBox.insertBefore(assistentFout, actionWidget);
        chatHistoryBox.scrollTop = chatHistoryBox.scrollHeight;
    }
}

// INSTELLEN VAN DE DYNAMISCHE CO-OP ACTIES (STAP 4)
function setupActionType(event) {
    isActionActive = true;
    taps = 0;
    const actionType = (event && event.actionType) ? event.actionType : "tap_hold";

    normalChatBubble.style.opacity = "0.5";
    actionWidget.style.display = "block";
    actionHintText.style.display = "none";

    if (actionType === "confirm_only") {
        requiredTaps = 1;
        actionTitle.textContent = "⚡ ACTIE BEVESTIGEN";
        actionText.textContent = "Overlegd met Speler 1? Tik hieronder om de gekozen behandeling uit te voeren.";
        progressContainer.style.display = "none";
        tapBtn.textContent = "BEVESTIG BEHANDELING";
    }
    else if (actionType === "quiz_prompt") {
        requiredTaps = 1;
        actionTitle.textContent = "❓ CONTROLE VRAAG";
        actionText.textContent = event.quizQuestion || "Beantwoord de medische vraag om de actie af te ronden:";
        progressContainer.style.display = "none";

        let quizHtml = "";
        if (event.quizOptions) {
            quizHtml = event.quizOptions.map((opt, idx) => `
                <button onclick="handleQuizAnswer(${idx})" style="padding: 12px; width: 100%; margin-bottom: 8px; background: #2a3942; color: white; border: 1px solid #3b82f6; border-radius: 8px; font-weight: bold; font-size: 1rem; cursor: pointer;">
                    ${opt}
                </button>
            `).join("");
        }

        tapBtn.style.display = "none";
        let container = document.getElementById("action-content-container");
        let existingQuiz = document.getElementById("quiz-buttons");
        if (existingQuiz) existingQuiz.remove();

        let quizDiv = document.createElement("div");
        quizDiv.id = "quiz-buttons";
        quizDiv.innerHTML = quizHtml;
        container.appendChild(quizDiv);
    }
    else {
        // Standaard tap_hold (10x tappen)
        requiredTaps = 10;
        actionTitle.textContent = "⚡ ACTIE UITVOEREN";
        actionText.textContent = "Speler 1 houdt de knop vast! Tap razendsnel om de toediening te voltooien!";
        progressContainer.style.display = "block";
        actionProgress.style.width = "0%";
        tapBtn.style.display = "block";
        tapBtn.textContent = `TAP (0/${requiredTaps})`;

        let existingQuiz = document.getElementById("quiz-buttons");
        if (existingQuiz) existingQuiz.remove();
    }

    chatHistoryBox.scrollTop = chatHistoryBox.scrollHeight;
}

function handleQuizAnswer(index) {
    const event = events[currentEvent];
    if (index === event.correctQuizIndex) {
        completeActionSuccess();
    } else {
        alert("Fout antwoord! Overleg goed met Speler 1.");
    }
}

function handleTap() {
    if (!isActionActive) return;

    const event = events[currentEvent];
    const actionType = (event && event.actionType) ? event.actionType : "tap_hold";

    if (actionType === "quiz_prompt") return;

    taps++;
    let percentage = (taps / requiredTaps) * 100;
    actionProgress.style.width = percentage + "%";

    if (actionType === "confirm_only") {
        tapBtn.textContent = "BEVESTIGD!";
    } else {
        tapBtn.textContent = `TAP (${taps}/${requiredTaps})`;
    }

    if (taps >= requiredTaps) {
        completeActionSuccess();
    }
}

function completeActionSuccess() {
    isActionActive = false;
    isTransitioning = true;
    waitingForPi = true;

    tapBtn.style.display = "block";
    tapBtn.style.background = "#10b981";
    tapBtn.textContent = "SUCCES!";

    fetch(`${SERVER}/complete_action`);

    setTimeout(() => {
        actionWidget.style.display = "none";
        normalChatBubble.style.opacity = "1";
        actionHintText.style.display = "block";
        isTransitioning = false;
    }, 1500);
}

sendGlucoseBtn.addEventListener("click", handleGlucoseSubmit);
glucoseInput.addEventListener("keypress", function (e) {
    if (e.key === 'Enter') handleGlucoseSubmit();
});

glucoseInput.addEventListener('blur', function () {
    window.scrollTo(0, 0);
});

tapBtn.addEventListener("touchstart", (e) => {
    e.preventDefault();
    handleTap();
});
tapBtn.addEventListener("mousedown", handleTap);