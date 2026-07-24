console.log("APPJS GELADEN");
alert("APPJS GELADEN");

const SERVER = "http://10.91.88.212:5000";

fetch(`${SERVER}/set_glucose/-1`);

// GAME VARIABLES
let glucose = 75;
let timer = 90;
let score = 0;
let targetPin = "";
let teamName = "";
let isGlucoseVisible = false; // NIEUW: Houdt bij of de waarde zichtbaar is

// SIDEQUEST & CO-OP VARIABELEN
let isSidequestActive = false;
let sidequestCode = [];
let enteredCode = [];

// BANNED WORDS
const bannedWords = [
    "fuck", "fck", "shit", "bitch", "porno", "sex", "seks", "kut", "lul",
    "kanker", "kkr", "homo", "hoer", "slet", "wijf", "seksueel",
    "sexywijf", "gay", "nigger", "nigga", "hitler", "nazi", "kaka"
];

// EVENTS
let events = [];
let currentEventIndex = 0;
let gameState = "START"; // Expected: "START", "PLAYING", "FEEDBACK", "END", "QUEST"
let timerInterval;

// NIEUWE CO-OP STATUSSEN
let waitingForPhone = false;
let currentChoiceIndex = -1;
let phoneCheckInterval;

// SCHERM ELEMENTEN
const startScreen = document.getElementById("start-screen");
const startBtn = document.getElementById("startBtn");
const highscoreElement = document.getElementById("highscore");

const teamOverlay = document.getElementById("team-overlay");
const teamNameInput = document.getElementById("teamNameInput");
const teamOkBtn = document.getElementById("teamOkBtn");
const teamDisplay = document.getElementById("teamDisplay");
const keyboard = document.getElementById("keyboard");
const backspaceBtn = document.getElementById("backspaceBtn");
const spaceBtn = document.getElementById("spaceBtn");
const charCounter = document.getElementById("charCounter");
const teamFeedback = document.getElementById("teamFeedback");

const gameContainer = document.getElementById("game-container");
const glucoseElement = document.getElementById("glucose");
const timerElement = document.getElementById("timer");
const trendElement = document.getElementById("trend");
const situationElement = document.getElementById("situation");
const choicesContainer = document.getElementById("choices");
const redBtn = document.getElementById("redBtn");
const yellowBtn = document.getElementById("yellowBtn");
const greenBtn = document.getElementById("greenBtn");

const questOverlay = document.getElementById("quest-overlay");
const pinInput = document.getElementById("pinInput");
const pinSubmitBtn = document.getElementById("pinSubmitBtn");
const pinFeedback = document.getElementById("pinFeedback");
const questTimerDisplay = document.getElementById("quest-timer-display");

const feedbackCard = document.getElementById("feedback-card");
const feedbackStatusElement = document.getElementById("feedback-status");
const feedbackTextElement = document.getElementById("feedback-text");
const nextBtn = document.getElementById("nextBtn");

const endScreen = document.getElementById("end-screen");
const endTitle = document.getElementById("end-title");
const endMessage = document.getElementById("end-message");
const endScore = document.getElementById("end-score");

// LOADING DATA
fetch("data/events.json")
    .then(response => response.json())
    .then(data => { events = data; });

fetch(`${SERVER}/get_highscore`)
    .then(response => response.json())
    .then(data => {
        highscoreElement.textContent = `${data.team} - ${data.highscore}`;
    });

// TEAM NAAM LOGICA
const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
letters.split("").forEach(letter => {
    const button = document.createElement("button");
    button.className = "key";
    button.textContent = letter;
    button.addEventListener("click", () => {
        if (teamName.length >= 15) return;
        teamName += letter;
        teamFeedback.textContent = "";
        updateTeamDisplay();
    });
    keyboard.appendChild(button);
});

backspaceBtn.addEventListener("click", () => {
    teamName = teamName.slice(0, -1);
    teamFeedback.textContent = "";
    updateTeamDisplay();
});

spaceBtn.addEventListener("click", () => {
    if (teamName.length >= 15) return;
    teamName += " ";
    teamFeedback.textContent = "";
    updateTeamDisplay();
});

function isValidTeamName(name) {
    const lower = name.toLowerCase();
    if (bannedWords.some(word => lower.includes(word))) return false;
    const letters = (name.match(/[a-z]/gi) || []).length;
    if (letters < 3) return false;
    if (!/[aeiou]/i.test(name)) return false;
    return true;
}

function updateTeamDisplay() {
    teamDisplay.textContent = teamName;
    charCounter.textContent = `${teamName.length}/15`;
}

function formatTeamName(name) {
    return name.trim().replace(/\s+/g, " ").split(" ")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ");
}

// --- NIEUW: GLUCOSE VERBERGEN OF TONEN ---
function updateGlucoseDisplay() {
    if (isGlucoseVisible) {
        glucoseElement.textContent = glucose;
        if (glucose <= 75) {
            glucoseElement.style.color = "#ef4444";
            glucoseElement.style.textShadow = "0 0 15px rgba(239, 68, 68, 0.8)";
        } else if (glucose >= 160) {
            glucoseElement.style.color = "#f59e0b";
            glucoseElement.style.textShadow = "0 0 15px rgba(245, 158, 11, 0.8)";
        } else {
            glucoseElement.style.color = "#10b981";
            glucoseElement.style.textShadow = "0 0 15px rgba(16, 185, 129, 0.8)";
        }
    } else {
        glucoseElement.textContent = "SCAN";
        glucoseElement.style.color = "#00a884";
        glucoseElement.style.textShadow = "0 0 15px rgba(0, 168, 132, 0.6)";
    }
}

// --- NIEUW: SCAN FUNCTIE (2 SECONDEN ZICHTBAAR) ---
function triggerGlucoseScan() {
    if (isGlucoseVisible || gameState !== "PLAYING" || waitingForPhone) return;

    isGlucoseVisible = true;
    updateGlucoseDisplay();

    setTimeout(() => {
        isGlucoseVisible = false;
        updateGlucoseDisplay();
    }, 2000);
}

function getValidEvent() {
    const validEvents = events.filter(event => {
        if (event.type === "sidequest") return false;
        const pastBijGlucose = glucose >= event.minGlucose && glucose <= event.maxGlucose;
        const isNietGespeeld = !event.played;
        return pastBijGlucose && isNietGespeeld;
    });

    if (validEvents.length > 0) {
        const randomIndex = Math.floor(Math.random() * validEvents.length);
        const selectedEvent = validEvents[randomIndex];
        selectedEvent.played = true;
        return selectedEvent;
    }
    return null;
}

function triggerNextEvent() {
    const nextEvent = getValidEvent();
    if (nextEvent) {
        currentEventIndex = events.indexOf(nextEvent);
        fetch(`${SERVER}/set_event/${currentEventIndex}`)
            .then(response => response.json())
            .catch(error => console.error("Flask Event Fout:", error));

        fetch(`${SERVER}/set_quest/none`);
        loadEvent(nextEvent);
    } else {
        endGame("THOMAS KWAM VEILIG THUIS");
    }
}

function triggerSensorCalibration() {
    isSidequestActive = true;
    enteredCode = [];

    let sidequestIndexes = [];
    for (let i = 0; i < events.length; i++) {
        if (events[i].type === "sidequest") sidequestIndexes.push(i);
    }

    if (sidequestIndexes.length === 0) {
        triggerNextEvent();
        return;
    }

    let randomSqIndex = sidequestIndexes[Math.floor(Math.random() * sidequestIndexes.length)];
    currentEventIndex = randomSqIndex;
    sidequestCode = events[randomSqIndex].code;

    fetch(`${SERVER}/set_event/${currentEventIndex}`);
    fetch(`${SERVER}/set_quest/none`);

    gameState = "PLAYING";

    situationElement.textContent = "⚠ SENSOR OFFLINE ⚠";
    trendElement.textContent = "";
    redBtn.textContent = "WACHTEN";
    yellowBtn.textContent = "OP";
    greenBtn.textContent = "CODE";

    choicesContainer.style.display = "flex";
}

function startGame() {
    startScreen.style.display = "none";
    fetch(`${SERVER}/reset_game`).catch(e => console.log(e));
    gameContainer.style.display = "flex";

    events.forEach(e => e.played = false);
    const minGlucose = 80;
    const maxGlucose = 130;
    glucose = Math.floor(Math.random() * (maxGlucose - minGlucose + 1)) + minGlucose;
    timer = 90;
    score = 0;
    isSidequestActive = false;

    fetch(`${SERVER}/set_glucose/${glucose}`);
    gameState = "PLAYING";
    timerElement.textContent = timer;

    isGlucoseVisible = false; // Reset scan status
    updateGlucoseDisplay();
    triggerNextEvent();
    startTimer();
}

startBtn.addEventListener("click", () => {
    teamFeedback.textContent = "";
    teamName = "";
    updateTeamDisplay();
    teamOverlay.style.display = "flex";
});

teamOkBtn.addEventListener("click", () => {
    if (teamName.trim() === "") teamName = "Anoniem";
    teamName = formatTeamName(teamName);

    if (!isValidTeamName(teamName)) {
        teamFeedback.textContent = "Teamnaam niet geldig.";
        setTimeout(() => { teamFeedback.textContent = ""; }, 5000);
        teamName = "";
        updateTeamDisplay();
        return;
    }
    teamFeedback.textContent = "";
    teamOverlay.style.display = "none";
    startGame();
});

// --- FYSIEKE ARCADE KNOPPEN (RASPBERRY PI) ---
let previousHeldButton = -1;
let lastButtonPressTime = 0;
let holdGraceTimer = null;

setInterval(() => {
    fetch(`${SERVER}/get_event`)
        .then(response => response.json())
        .then(data => {
            const currentHeldButton = data.held_button;
            const now = Date.now();

            // 1. IS ER EEN KNOP NIEUW INGEDRUKT?
            if (currentHeldButton !== -1 && previousHeldButton === -1) {

                clearTimeout(holdGraceTimer);

                if (now - lastButtonPressTime < 300) {
                    previousHeldButton = currentHeldButton;
                    return;
                }
                lastButtonPressTime = now;

                // --- DE NIEUWE SCAN KNOP (Knop index 3) ---
                if (currentHeldButton === 3) {
                    triggerGlucoseScan();
                }
                // -- A) SIDEQUEST LOGICA: CODE KRAKEN --
                else if (isSidequestActive) {
                    enteredCode.push(currentHeldButton);

                    if (enteredCode.length === 3) {
                        if (JSON.stringify(enteredCode) === JSON.stringify(sidequestCode)) {
                            isSidequestActive = false;
                            score += 100;
                            alert("KALIBRATIE SUCCESVOL! Sensor is weer online.");
                            triggerNextEvent();
                        } else {
                            enteredCode = [];
                            timer -= 5;
                            timerElement.textContent = timer;
                            alert("FOUTIEVE CODE! Probeer opnieuw. (-5s)");
                        }
                    }
                }
                // -- B) NORMALE GAMEPLAY: START DE CO-OP HOLD --
                else if (gameState === "PLAYING") {
                    onButtonPress(currentHeldButton);
                }
            }

            // 2. IS DE KNOP LOSGELATEN?
            if (currentHeldButton === -1 && previousHeldButton !== -1) {
                if (gameState === "PLAYING" && !isSidequestActive) {
                    holdGraceTimer = setTimeout(() => {
                        onButtonRelease();
                    }, 300);
                }
            }

            previousHeldButton = currentHeldButton;
        })
        .catch(error => { });
}, 100);

function startTimer() {
    timerInterval = setInterval(() => {
        if (gameState === "QUEST") {
            timer -= 2;
        } else {
            timer -= 1;
        }

        if (timer <= 0) {
            timer = 0;
            timerElement.textContent = timer;
            if (questTimerDisplay) questTimerDisplay.textContent = timer;
            endGame("DE TIJD IS OP");
            return;
        }

        timerElement.textContent = timer;
        if (questTimerDisplay) questTimerDisplay.textContent = timer;

        fetch(`${SERVER}/set_timer/${timer}`).catch(e => console.log(e));
    }, 1000);
}

// ONSCREEN NUMPAD LOGICA
let currentPin = "";
const pinDisplay = document.getElementById("pinDisplay");

function addPin(num) {
    if (currentPin.length < 4) {
        currentPin += num;
        pinDisplay.textContent = currentPin;
    }
}

function clearPin() {
    currentPin = "";
    pinDisplay.textContent = "";
    document.getElementById("pinFeedback").textContent = "";
}

function submitPin() {
    if (currentPin.length !== 4) return;

    if (currentPin === targetPin) {
        questOverlay.style.display = "none";
        timer += 10;
        timerElement.textContent = timer;
        clearPin();
        fetch(`${SERVER}/set_quest/none`);
        triggerNextEvent();
    } else {
        document.getElementById("pinFeedback").textContent = "FOUT! -5 SEC!";
        timer -= 5;
        timerElement.textContent = timer;
        clearPin();
    }
}

function triggerPincodeQuest() {
    gameState = "QUEST";
    clearPin();

    let pinIndexes = [];
    for (let i = 0; i < events.length; i++) {
        if (events[i].type === "pincode") pinIndexes.push(i);
    }

    if (pinIndexes.length > 0) {
        let randomPinIndex = pinIndexes[Math.floor(Math.random() * pinIndexes.length)];
        currentEventIndex = randomPinIndex;
        targetPin = events[randomPinIndex].pin;
        fetch(`${SERVER}/set_event/${currentEventIndex}`);
    } else {
        targetPin = "6162";
    }

    feedbackCard.style.display = "none";
    questOverlay.style.display = "flex";
}

function loadEvent(event) {
    situationElement.textContent = event.title;
    trendElement.textContent = event.trend;

    redBtn.textContent = event.choices[0].text;
    yellowBtn.textContent = event.choices[1].text;
    greenBtn.textContent = event.choices[2].text;

    feedbackCard.style.display = "none";
    choicesContainer.style.display = "flex";

    // Verberg glucose aan het begin van elk nieuw event
    isGlucoseVisible = false;
    updateGlucoseDisplay();

    gameState = "PLAYING";
}

// --- DE NIEUWE CO-OP 3-FASEN LOGICA ---

function onButtonPress(choiceIndex) {
    if (gameState !== "PLAYING" || waitingForPhone) return;

    currentChoiceIndex = choiceIndex;
    waitingForPhone = true;

    fetch(`${SERVER}/button_down/${choiceIndex}`).catch(e => console.log(e));

    choicesContainer.style.display = "none";
    situationElement.innerHTML = `
        <span style="color: #00ff99; font-size: 1.5rem; text-shadow: 0 0 10px rgba(0,255,153,0.8);">
            ⚡ ACTIE GESELECTEERD ⚡<br>
            HOUD DE KNOP VAST!<br>
            <span style="color: #e9edef; font-size: 1.1rem;">Zorgverlener: Voer de toediening uit op de GSM!</span>
        </span>`;

    phoneCheckInterval = setInterval(() => {
        fetch(`${SERVER}/get_event`)
            .then(res => res.json())
            .then(data => {
                if (data.action_completed && waitingForPhone) {
                    clearInterval(phoneCheckInterval);
                    waitingForPhone = false;

                    fetch(`${SERVER}/reset_action`);
                    processChoiceResult(currentChoiceIndex);
                }
            }).catch(e => console.log(e));
    }, 300);
}

function onButtonRelease() {
    if (gameState !== "PLAYING" || !waitingForPhone) return;

    fetch(`${SERVER}/button_up`).catch(e => console.log(e));

    clearInterval(phoneCheckInterval);
    waitingForPhone = false;

    const currentEvent = events[currentEventIndex];
    situationElement.textContent = currentEvent.title;
    choicesContainer.style.display = "flex";
}

function processChoiceResult(choiceIndex) {
    gameState = "FEEDBACK";

    const currentEvent = events[currentEventIndex];
    const choice = currentEvent.choices[choiceIndex];

    glucose += choice.effect;

    fetch(`${SERVER}/set_glucose/${glucose}`)
        .then(response => response.json())
        .catch(error => console.error("FOUT:", error));

    if (glucose < 0) glucose = 0;

    // Laat de glucose altijd zien in het feedbackscherm
    isGlucoseVisible = true;
    updateGlucoseDisplay();

    if (glucose <= 45) {
        endGame("THOMAS KREEG EEN ERNSTIGE HYPO");
        return;
    }

    if (glucose >= 280) {
        endGame("THOMAS KREEG EEN ERNSTIGE HYPER");
        return;
    }

    feedbackTextElement.textContent = currentEvent.feedback;

    if (choice.correct) {
        score += 100;
        feedbackStatusElement.textContent = "✓ GOEDE KEUZE";
        feedbackStatusElement.style.color = "#10b981";
    } else {
        score -= 25;
        feedbackStatusElement.textContent = "✗ SLECHTE KEUZE";
        feedbackStatusElement.style.color = "#ef4444";
    }

    choicesContainer.style.display = "none";
    feedbackCard.style.display = "flex";
}

// LOKAAL TESTEN: KEYBOARD SUPPORT
document.addEventListener("keydown", (event) => {
    if (gameState === "PLAYING" && !isSidequestActive) {
        if (event.repeat) return;

        if (event.key === "1") onButtonPress(0);
        if (event.key === "2") onButtonPress(1);
        if (event.key === "3") onButtonPress(2);

        // Druk op 4 of S om de SCAN te simuleren
        if (event.key === "4" || event.key.toLowerCase() === "s") triggerGlucoseScan();
    }
    if (gameState === "FEEDBACK" && event.key === " ") {
        nextBtn.click();
    }
});

document.addEventListener("keyup", (event) => {
    if (gameState === "PLAYING" && !isSidequestActive) {
        if (event.key === "1" || event.key === "2" || event.key === "3") {
            onButtonRelease();
        }
    }
});

nextBtn.addEventListener("click", () => {
    feedbackCard.style.display = "none";
    let randomKans = Math.random();

    if (randomKans < 0.20) {
        triggerSensorCalibration();
    } else if (randomKans < 0.40) {
        triggerPincodeQuest();
    } else {
        triggerNextEvent();
    }
});

// EINDE SPEL LOGICA
function endGame(message) {
    gameState = "END";
    clearInterval(timerInterval);

    questOverlay.style.display = "none";
    feedbackCard.style.display = "none";

    fetch(`${SERVER}/set_glucose/-1`);
    fetch(`${SERVER}/set_quest/none`);

    gameContainer.style.display = "none";
    endScreen.style.display = "flex";
    endMessage.textContent = message;

    const isWin = message.includes("VEILIG") ? 1 : 0;
    fetch(`${SERVER}/set_game_over/${isWin}`).catch(e => console.log(e));

    if (message.includes("VEILIG")) {
        score += 300;
        endTitle.textContent = "MISSIE GESLAAGD";
        endTitle.style.color = "#00ff99";
    } else {
        endTitle.textContent = "MISSIE MISLUKT";
        endTitle.style.color = "#ff4444";
    }

    endScore.textContent = `Score: ${score} punten`;
    fetch(`${SERVER}/save_score/${encodeURIComponent(teamName)}/${score}`);

    let countdown = 5;
    const countdownElement = document.getElementById("countdown");
    countdownElement.textContent = countdown;

    const countdownInterval = setInterval(() => {
        countdown--;
        countdownElement.textContent = countdown;

        if (countdown <= 0) {
            clearInterval(countdownInterval);
            fetch(`${SERVER}/set_glucose/-1`);
            fetch(`${SERVER}/set_event/0`);

            fetch(`${SERVER}/reset_game`)
                .then(() => location.reload())
                .catch(() => location.reload());
        }
    }, 1000);
}