console.log("APPJS GELADEN");
alert("APPJS GELADEN");

const SERVER = "http://10.45.239.212:5000";

fetch(`${SERVER}/set_glucose/-1`);

// GAME VARIABLES
let glucose = 75;
let timer = 90;
let score = 0;

let targetPin = "";

// TEAM NAME
let teamName = "";

// SIDEQUEST: SENSOR KALIBRATIE VARIABELEN
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

// We keep track of the exact state of the game
let gameState = "START"; // Expected: "START", "PLAYING", "FEEDBACK", "END", "QUEST"

// SET EVENT
let timerInterval;

// LOAD DATA
function saveGameState() {
    fetch("data/gameState.json")
        .then(response => response.json())
        .then(data => {
            data.currentEvent = currentEventIndex;
        });
}

// STARTSCREEN
const startScreen = document.getElementById("start-screen");
const startBtn = document.getElementById("startBtn");
const highscoreElement = document.getElementById("highscore");

// TEAM NAME
const teamOverlay = document.getElementById("team-overlay");
const teamNameInput = document.getElementById("teamNameInput");
const teamOkBtn = document.getElementById("teamOkBtn");
const teamDisplay = document.getElementById("teamDisplay");
const keyboard = document.getElementById("keyboard");
const backspaceBtn = document.getElementById("backspaceBtn");
const spaceBtn = document.getElementById("spaceBtn");
const charCounter = document.getElementById("charCounter");
const teamFeedback = document.getElementById("teamFeedback");

// GAME
const gameContainer = document.getElementById("game-container");
const glucoseElement = document.getElementById("glucose");
const timerElement = document.getElementById("timer");
const trendElement = document.getElementById("trend");
const situationElement = document.getElementById("situation");
const choicesContainer = document.getElementById("choices");
const redBtn = document.getElementById("redBtn");
const yellowBtn = document.getElementById("yellowBtn");
const greenBtn = document.getElementById("greenBtn");

// QUEST ELEMENTS
const questOverlay = document.getElementById("quest-overlay");
const pinInput = document.getElementById("pinInput");
const pinSubmitBtn = document.getElementById("pinSubmitBtn");
const pinFeedback = document.getElementById("pinFeedback");
const questTimerDisplay = document.getElementById("quest-timer-display");

// FEEDBACK
const feedbackCard = document.getElementById("feedback-card");
const feedbackStatusElement = document.getElementById("feedback-status");
const feedbackTextElement = document.getElementById("feedback-text");
const nextBtn = document.getElementById("nextBtn");

// ENDSCREEN
const endScreen = document.getElementById("end-screen");
const endTitle = document.getElementById("end-title");
const endMessage = document.getElementById("end-message");
const endScore = document.getElementById("end-score");

// LOADING DATA
fetch("data/events.json")
    .then(response => response.json())
    .then(data => {
        events = data;
    });

fetch(`${SERVER}/get_highscore`)
    .then(response => response.json())
    .then(data => {
        highscoreElement.textContent =
            `${data.team} - ${data.highscore}`;
    });

// Shuffle events (Fisher-Yates)
function shuffleEvents(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

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
    return name
        .trim()
        .replace(/\s+/g, " ")
        .split(" ")
        .map(word =>
            word.charAt(0).toUpperCase() +
            word.slice(1).toLowerCase()
        )
        .join(" ");
}

function updateGlucoseDisplay() {
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
}

function getValidEvent() {
    const validEvents = events.filter(event => {
        // Zorg dat we sidequests hier uitsluiten voor de normale rotatie
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
        loadEvent(nextEvent);
    } else {
        endGame("THOMAS KWAM VEILIG THUIS");
    }
}

// --- DE NIEUWE SENSOR KALIBRATIE FUNCTIE ---
function triggerSensorCalibration() {
    isSidequestActive = true;
    enteredCode = [];

    // Zoek alle sidequests in de ingeladen events
    let sidequestIndexes = [];
    for (let i = 0; i < events.length; i++) {
        if (events[i].type === "sidequest") sidequestIndexes.push(i);
    }

    // Als je nog geen sidequests in events.json hebt gezet, val dan veilig terug naar normaal
    if (sidequestIndexes.length === 0) {
        triggerNextEvent();
        return;
    }

    // Kies willekeurig één van de sidequest codes
    let randomSqIndex = sidequestIndexes[Math.floor(Math.random() * sidequestIndexes.length)];
    currentEventIndex = randomSqIndex;
    sidequestCode = events[randomSqIndex].code;

    // Stuur het naar de server (en dus de telefoon)
    fetch(`${SERVER}/set_event/${currentEventIndex}`);

    gameState = "PLAYING";

    // Verander het grote scherm om Speler 2 te instrueren
    situationElement.textContent = "⚠ SENSOR OFFLINE ⚠";
    trendElement.textContent = "";
    redBtn.textContent = "WACHTEN";
    yellowBtn.textContent = "OP";
    greenBtn.textContent = "CODE";

    choicesContainer.style.display = "flex";
}

function startGame() {
    startScreen.style.display = "none";

    // Reset het spectator dashboard
    fetch(`${SERVER}/reset_game`).catch(e => console.log(e));

    gameContainer.style.display = "flex";

    events.forEach(e => e.played = false);

    const minGlucose = 80;
    const maxGlucose = 130;
    glucose = Math.floor(Math.random() * (maxGlucose - minGlucose + 1)) + minGlucose;

    timer = 90;
    score = 0;
    isSidequestActive = false; // Zeker weten dat dit gereset is

    fetch(`${SERVER}/set_glucose/${glucose}`);

    gameState = "PLAYING";
    timerElement.textContent = timer;

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
    if (teamName.trim() === "") {
        teamName = "Anoniem";
    }
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

// TIMER FIX
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

    // Check lokaal in plaats van via de Flask server
    if (currentPin === targetPin) {
        questOverlay.style.display = "none";
        timer += 10;
        timerElement.textContent = timer;
        clearPin();
        triggerNextEvent();
    } else {
        document.getElementById("pinFeedback").textContent = "FOUT! -5 SEC!";
        timer -= 5;
        timerElement.textContent = timer;
        clearPin();
    }
}

// NIEUWE QUEST TRIGGER (Vervangt de oude triggerQuest)
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
        targetPin = "6162"; // Fallback voor het geval JSON leeg is
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
    gameState = "PLAYING";
}

function choose(choiceIndex) {
    if (gameState !== "PLAYING") return;

    gameState = "FEEDBACK";

    const currentEvent = events[currentEventIndex];
    const choice = currentEvent.choices[choiceIndex];

    glucose += choice.effect;

    fetch(`${SERVER}/set_glucose/${glucose}`)
        .then(response => response.json())
        .catch(error => console.error("FOUT:", error));

    if (glucose < 0) glucose = 0;

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

// NEXT EVENT LIGT AANGEPAST VOOR DE KALIBRATIE
nextBtn.addEventListener("click", () => {
    feedbackCard.style.display = "none";

    let randomKans = Math.random();

    if (randomKans < 0.20) {
        // 20% kans op Sensor Kalibratie (Kleurcode)
        triggerSensorCalibration();
    } else if (randomKans < 0.40) {
        // 20% kans op de Pincode (Dossier)
        triggerPincodeQuest();
    } else {
        // 60% kans op normaal spelverloop
        triggerNextEvent();
    }
});

// LIGHT BUTTONS (Keyboard debug)
document.addEventListener("keydown", (event) => {
    if (gameState === "PLAYING" && !isSidequestActive) {
        if (event.key === "1") choose(0);
        if (event.key === "2") choose(1);
        if (event.key === "3") choose(2);
    }
    if (gameState === "FEEDBACK") {
        if (event.key === " ") nextBtn.click();
    }
});

// ARCADE BUTTONS LIGT AANGEPAST VOOR DE KALIBRATIE
setInterval(() => {
    fetch(`${SERVER}/get_button`)
        .then(response => response.json())
        .then(data => {
            const btn = data.button;

            if (btn !== -1) {

                // --- KRAKEN WE EEN CODE? ---
                if (isSidequestActive) {
                    enteredCode.push(btn); // Voeg de ingedrukte knop toe aan de lijst

                    // We hebben 3 knoppen ingedrukt! Controleer ze.
                    if (enteredCode.length === 3) {
                        if (JSON.stringify(enteredCode) === JSON.stringify(sidequestCode)) {
                            // CODE IS GOED!
                            isSidequestActive = false;
                            score += 100; // Dikke bonus voor samenwerking

                            // Direct door naar een nieuwe echte missie
                            alert("KALIBRATIE SUCCESVOL! Sensor is weer online.");
                            triggerNextEvent();
                        } else {
                            // CODE IS FOUT!
                            enteredCode = []; // Reset lijst
                            timer -= 5; // Strafseconden
                            timerElement.textContent = timer;
                            alert("FOUTIEVE CODE! Probeer opnieuw. (-5s)");
                        }
                    }
                    return; // Blokkeer de normale logica!
                }

                // --- NORMALE GAME LOGICA ---
                if (gameState === "PLAYING") {
                    switch (btn) {
                        case 0: choose(0); break;
                        case 1: choose(1); break;
                        case 2: choose(2); break;
                    }
                }
            }
        })
        .catch(error => {
            // Fouten genegeerd
        });
}, 200);

// ENDSCREEN
function endGame(message) {
    gameState = "END";
    clearInterval(timerInterval);

    questOverlay.style.display = "none";
    feedbackCard.style.display = "none";

    fetch(`${SERVER}/set_glucose/-1`);

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

            // Stuur het reset-signaal naar de server en wacht op antwoord
            fetch(`${SERVER}/reset_game`)
                .then(() => {
                    // Herlaad pas als de server de reset succesvol heeft ontvangen
                    location.reload();
                })
                .catch(() => {
                    // Mocht er een netwerkfout zijn, herlaad dan alsnog als fallback
                    location.reload();
                });
        }
    }, 1000);
}