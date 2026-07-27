const SERVER = "http://192.168.0.252:5000";

let events = [];
let currentEvent = 0;
let wasPlaying = false;
let isTransitioning = false;
let waitingForPi = false;

// DOM ELEMENTS
const waitingScreen = document.getElementById("waiting-screen");
const chatContainer = document.getElementById("chat-container");
const questScreen = document.getElementById("quest-screen");

// Waiting screen elements
const waitingSpinner = document.getElementById("waiting-spinner");
const waitingTitle = document.getElementById("waiting-title");
const waitingText = document.getElementById("waiting-text");

// Phone screen elements
const glucoseElement = document.getElementById("phone-glucose");
const statusElement = document.getElementById("phone-status");
const situationElement = document.getElementById("phone-situation");
const normalChatBubble = document.getElementById("normal-chat-bubble");
const chatHistoryBox = document.getElementById("chat-history-box");
const actionHintText = document.getElementById("action-hint-text");

// Chat input elements
const chatInputArea = document.getElementById("chat-input-area");
const glucoseInput = document.getElementById("glucose-input");
const sendGlucoseBtn = document.getElementById("send-glucose-btn");
const earlyHoldWarning = document.getElementById("early-hold-warning");

let currentSecretGlucose = 0;
let diagnosisCompleted = false;

// Action widget elements
const actionWidget = document.getElementById("action-widget");
const actionProgress = document.getElementById("action-progress");
const tapBtn = document.getElementById("tapBtn");

let isActionActive = false;
let taps = 0;
const requiredTaps = 10;

// Load events from JSON file
fetch("data/events.json")
    .then(response => response.json())
    .then(data => {
        events = data;
        setInterval(updateFromServer, 500);
    });

// Update the phone screen based on server data
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

            // 1. HARD RESET: Check right away to see if the PI screen has switched to a new event
            if (data.currentEvent !== currentEvent) {
                currentEvent = data.currentEvent;
                diagnosisCompleted = false;
                isActionActive = false;
                waitingForPi = true;

                actionWidget.style.display = "none";
                earlyHoldWarning.style.display = "none";
                chatInputArea.style.display = "flex";
                document.querySelectorAll(".dynamic-bubble").forEach(el => el.remove());
            }

            // 2. Wait for the PI screen to confirm that the action is complete
            if (waitingForPi) return;

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

            if (diagnosisCompleted) {
                glucoseElement.textContent = currentSecretGlucose;
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
            } else {
                glucoseElement.textContent = "???";
                glucoseElement.style.color = "#e9edef";
                statusElement.textContent = "⚠ VRAAG DATA AAN PATIËNT";
                statusElement.style.color = "#f59e0b";
            }

            // CO-OP WAARSCHUWING EN ACTIE
            if (data.held_button !== -1 && !data.action_completed) {
                if (diagnosisCompleted) {
                    earlyHoldWarning.style.display = "none";
                    if (!isActionActive) {
                        isActionActive = true;
                        taps = 0;
                        actionProgress.style.width = "0%";
                        tapBtn.textContent = `TAP (0/${requiredTaps})`;
                        tapBtn.style.background = "linear-gradient(180deg, #34d399 0%, #059669 100%)";

                        normalChatBubble.style.opacity = "0.5";
                        actionWidget.style.display = "block";
                        actionHintText.style.display = "none";
                        chatHistoryBox.scrollTop = chatHistoryBox.scrollHeight;
                    }
                } else {
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
        })
        .catch(error => console.error(error));
}

function loadPhoneEvent() {
    const event = events[currentEvent];
    if (!event) return;

    situationElement.textContent = event.title;

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

function handleGlucoseSubmit() {
    if (diagnosisCompleted || !wasPlaying) return;

    const ingevoerdeWaarde = parseInt(glucoseInput.value);
    glucoseInput.value = "";

    if (isNaN(ingevoerdeWaarde)) return;

    const gestuurdBericht = document.createElement("div");
    gestuurdBericht.className = "message sent dynamic-bubble";
    gestuurdBericht.style.alignSelf = "flex-end";
    gestuurdBericht.style.backgroundColor = "#005c4b";
    gestuurdBericht.style.padding = "8px 15px";
    gestuurdBericht.style.borderRadius = "15px 15px 0 15px";
    gestuurdBericht.style.marginBottom = "10px";
    gestuurdBericht.innerHTML = `<div class="bubble-text" style="color: white;">Patiënt meldt waarde: <b>${ingevoerdeWaarde}</b></div>`;

    chatHistoryBox.insertBefore(gestuurdBericht, actionWidget);
    chatHistoryBox.scrollTop = chatHistoryBox.scrollHeight;

    if (ingevoerdeWaarde === currentSecretGlucose) {
        diagnosisCompleted = true;
        glucoseElement.textContent = currentSecretGlucose;
        statusElement.textContent = "STABIEL";

        const event = events[currentEvent];
        // TOEGANKELIJKHEID FIX: We gebruiken de letterlijke tekst van de juiste keuze
        let correcteKeuze = event.choices.find(c => c.correct);
        let advies = correcteKeuze ? correcteKeuze.text : "Volg medisch protocol.";

        const assistentAntwoord = document.createElement("div");
        assistentAntwoord.className = "message system dynamic-bubble";
        assistentAntwoord.innerHTML = `
            <div class="bubble-widget" style="background: #1f2c34; border: 1px solid #00a884; padding: 15px; border-radius: 10px; margin-bottom: 15px; text-align: left; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">
                <span style="color: #00a884; font-weight: bold;">✓ Waarde geverifieerd.</span><br><br>
                <span style="color: #fde68a;">AANBEVOLEN ACTIE:</span><br>
                <b style="font-size: 1.1rem; color: #e9edef;">${advies}</b>
            </div>`;

        chatHistoryBox.insertBefore(assistentAntwoord, actionWidget);
        chatHistoryBox.scrollTop = chatHistoryBox.scrollHeight;
        chatInputArea.style.display = "none";

    } else {
        const assistentFout = document.createElement("div");
        assistentFout.className = "message system dynamic-bubble";
        assistentFout.innerHTML = `
            <div class="bubble-widget" style="background: #3b2c00; border: 1px solid #ef4444; padding: 10px; border-radius: 10px; margin-bottom: 15px;">
                <span style="color: #ef4444;">⚠️ Foutieve patiëntdata. Vraag de actuele waarde opnieuw op!</span>
            </div>`;

        chatHistoryBox.insertBefore(assistentFout, actionWidget);
        chatHistoryBox.scrollTop = chatHistoryBox.scrollHeight;
    }
}

sendGlucoseBtn.addEventListener("click", handleGlucoseSubmit);
glucoseInput.addEventListener("keypress", function (e) {
    if (e.key === 'Enter') handleGlucoseSubmit();
});

glucoseInput.addEventListener('blur', function () {
    window.scrollTo(0, 0);
});

function handleTap() {
    if (!isActionActive) return;

    taps++;
    let percentage = (taps / requiredTaps) * 100;
    actionProgress.style.width = percentage + "%";
    tapBtn.textContent = `TAP (${taps}/${requiredTaps})`;

    if (taps >= requiredTaps) {
        isActionActive = false;
        isTransitioning = true;
        waitingForPi = true;


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
}

tapBtn.addEventListener("touchstart", (e) => {
    e.preventDefault();
    handleTap();
});
tapBtn.addEventListener("mousedown", handleTap);