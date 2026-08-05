console.log("APPJS GELADEN");
// alert("APPJS GELADEN");

const SERVER = "http://10.178.148.212:5000";

fetch(`${SERVER}/set_glucose/-1`);

// GAME VARIABLES
let glucose = 75;
let timer = 90;
let score = 0;
let targetPin = "";
let teamName = "";
let isGlucoseVisible = false;
let bannedWords = [];

// De geschuffelde keuzes van deze ronde
let currentShuffledChoices = [];

// SIDEQUEST & CO-OP VARIABELEN
let isSidequestActive = false;
let sidequestCode = [];
let enteredCode = [];
let events = [];
let currentEventIndex = 0;
let gameState = "START";
let timerInterval;
let waitingForPhone = false;
let currentChoiceIndex = -1;
let phoneCheckInterval;

// SCHERM ELEMENTEN
const startScreen = document.getElementById("start-screen");
const startBtn = document.getElementById("startBtn");
const highscoreNameElement = document.getElementById("highscoreName");
const highscorePointsElement = document.getElementById("highscorePoints");

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
const situationElement = document.getElementById("pi-situation-text");
const piHeader = document.getElementById("pi-header");
const piIcon = document.getElementById("pi-icon");
const piThemeText = document.getElementById("pi-theme-text");
const piSourceLabel = document.getElementById("pi-source-label");
const choicesContainer = document.getElementById("choices");
const redBtn = document.getElementById("redBtn");
const yellowBtn = document.getElementById("yellowBtn");
const greenBtn = document.getElementById("greenBtn");

// Maak de scan-knop aanklikbaar met de muis/touch (én de fysieke knop blijft werken!)
glucoseElement.style.cursor = "pointer";
glucoseElement.addEventListener("click", triggerGlucoseScan);

const questOverlay = document.getElementById("quest-overlay");
const pinInput = document.getElementById("pinInput");
const pinSubmitBtn = document.getElementById("pinSubmitBtn");
const pinFeedback = document.getElementById("pinFeedback");
const questTimerDisplay = document.getElementById("quest-timer-display");

// AUDIO VARIABLES
const soundStart = new Audio('assets/sounds/game-start.mp3');
const soundScan = new Audio('assets/sounds/scan.mp3');
const soundCorrect = new Audio('assets/sounds/correct.mp3');
const soundWrong = new Audio('assets/sounds/wrong.mp3');
const soundSidequest = new Audio('assets/sounds/sidequest-start.mp3');
const soundHeartbeat = new Audio('assets/sounds/heartbeat.mp3');
soundHeartbeat.loop = true; // Zorgt dat de hartslag blijft kloppen
const soundCountdown = new Audio('assets/sounds/countdown.mp3');
const soundWin = new Audio('assets/sounds/game-win.mp3');
const soundGameOver = new Audio('assets/sounds/game-over.mp3');

const feedbackCard = document.getElementById("feedback-card");
const feedbackStatusElement = document.getElementById("feedback-status");
const feedbackTextElement = document.getElementById("feedback-text");
const nextBtn = document.getElementById("nextBtn");

const endScreen = document.getElementById("end-screen");
const endTitle = document.getElementById("end-title");
const endMessage = document.getElementById("end-message");
const endScore = document.getElementById("end-score");

// LOADING DATA

// Laad de verboden woorden in vanuit het JSON bestand
fetch("data/bannedWords.json?v=" + new Date().getTime())
    .then(response => response.json())
    .then(data => {
        bannedWords = data;
        console.log("Verboden woorden geladen:", bannedWords.length);
    })
    .catch(error => console.error("Fout bij het laden van verboden woorden:", error));

fetch("data/events.json?v=" + new Date().getTime())
    .then(response => response.json())
    .then(data => { events = data; });

fetch(`${SERVER}/get_highscore`)
    .then(response => response.json())
    .then(data => {
        if (!highscoreNameElement || !highscorePointsElement) {
            console.warn("Highscore elements niet gevonden in de HTML (highscoreName / highscorePoints).");
            return;
        }
        highscoreNameElement.textContent = data.team;
        highscorePointsElement.textContent = data.highscore;
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

function updateGlucoseDisplay() {
    if (isGlucoseVisible) {
        glucoseElement.classList.remove('scan-active');
        glucoseElement.textContent = glucose;

        if (glucose <= 75) {
            glucoseElement.style.color = "#dc4b52";
            glucoseElement.style.textShadow = "0 0 15px rgba(220, 75, 82, 0.6)";
            if (soundHeartbeat.paused) soundHeartbeat.play();
            document.body.style.filter = "blur(3px)";
            document.body.style.transition = "filter 1s ease";
        } else if (glucose >= 160) {
            glucoseElement.style.color = "#eab308";
            glucoseElement.style.textShadow = "0 0 15px rgba(234, 179, 8, 0.6)";
            soundHeartbeat.pause();
            document.body.style.filter = "none";
        } else {
            glucoseElement.style.color = "#16c784";
            glucoseElement.style.textShadow = "0 0 15px rgba(22, 199, 132, 0.6)";
            soundHeartbeat.pause();
            document.body.style.filter = "none";
        }
    } else {
        glucoseElement.textContent = "SCAN";
        glucoseElement.style.color = "";
        glucoseElement.style.textShadow = "";
        glucoseElement.classList.add('scan-active'); // Voegt de pulserende glow toe
    }
}

function triggerGlucoseScan() {
    if (isGlucoseVisible || gameState !== "PLAYING" || waitingForPhone) return;
    soundScan.play(); // Speel scangeluid
    isGlucoseVisible = true;

    fetch(`${SERVER}/set_scanned/1`);

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
    redBtn.textContent = "WACHTEN";
    yellowBtn.textContent = "OP";
    greenBtn.textContent = "CODE";

    choicesContainer.style.display = "flex";
}

function startGame() {
    soundStart.play(); // Speel startgeluid
    soundHeartbeat.pause(); // Reset hartslag voor de zekerheid
    document.body.style.filter = "none"; // Reset wazig scherm

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

    fetch(`${SERVER}/set_state/PLAYING`);

    timerElement.textContent = timer;

    isGlucoseVisible = false;
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

            if (currentHeldButton !== -1 && previousHeldButton === -1) {

                clearTimeout(holdGraceTimer);

                if (now - lastButtonPressTime < 300) {
                    previousHeldButton = currentHeldButton;
                    return;
                }
                lastButtonPressTime = now;

                if (currentHeldButton === 3) {
                    triggerGlucoseScan();
                }
                else if (isSidequestActive) {
                    enteredCode.push(currentHeldButton);

                    if (enteredCode.length === 3) {
                        if (JSON.stringify(enteredCode) === JSON.stringify(sidequestCode)) {
                            // GEEN ALERT MEER, MAAR IN-GAME FEEDBACK
                            isSidequestActive = false;
                            gameState = "TRANSITION"; // Blokkeer andere knoppen
                            score += 100;
                            situationElement.innerHTML = `<span style="color: #10b981; font-weight: bold; font-size: 1.5rem;">✓ KALIBRATIE SUCCESVOL!<br>Sensor is weer online.</span>`;
                            setTimeout(triggerNextEvent, 2000);
                        } else {
                            // GEEN ALERT MEER
                            enteredCode = [];
                            timer -= 5;
                            timerElement.textContent = timer;
                            situationElement.innerHTML = `<span style="color: #ef4444; font-weight: bold; font-size: 1.5rem;">❌ FOUTIEVE CODE! (-5 sec)</span>`;
                            setTimeout(() => {
                                if (isSidequestActive) situationElement.textContent = "⚠ SENSOR OFFLINE ⚠";
                            }, 1500);
                        }
                    }
                }
                else if (gameState === "PLAYING") {
                    onButtonPress(currentHeldButton);
                }
            }

            if (currentHeldButton === -1 && previousHeldButton !== -1) {
                if (gameState === "PLAYING" && !isSidequestActive) {
                    holdGraceTimer = setTimeout(() => {
                        onButtonRelease();
                    }, 300);
                }
            }
            previousHeldButton = currentHeldButton;
        }).catch(error => { });
}, 100);

function startTimer() {
    timerInterval = setInterval(() => {

        if (gameState === "FEEDBACK") {
            return;
        }

        if (gameState === "QUEST" || gameState === "TRANSITION") {
            timer -= 2;
        } else {
            timer -= 1;
        }

        if (timer === 5) {
            soundCountdown.play();
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

        // VOEG DEZE REGEL TOE:
        fetch(`${SERVER}/set_quest/pincode`);
    } else {
        targetPin = "6162";

        // VOEG HEM HIER OOK TOE ALS FALLBACK:
        fetch(`${SERVER}/set_quest/pincode`);
    }

    feedbackCard.style.display = "none";
    questOverlay.style.display = "flex";
}

function loadEvent(event) {
    situationElement.textContent = event.title;
    piIcon.textContent = event.icon || "⚠";

    // 1. Bepaal de afzender tekst
    let afzenderTekst = "";
    if (event.source === "mama") {
        afzenderTekst = "👩 MAMA";
    } else if (event.source === "school") {
        afzenderTekst = "🏫 SCHOOL";
    } else if (event.source === "sensor") {
        afzenderTekst = "📱 SENSOR";
    } else {
        afzenderTekst = "💬 THOMAS";
    }

    // 2. Bepaal de thema tekst
    let themaTekst = (event.theme || "MELDING").toUpperCase();

    // 3. Update de UI elementen
    // Thema
    piThemeText.textContent = themaTekst;

    // Afzender
    piSourceLabel.textContent = afzenderTekst;

    // Thema kleur nu op de linker border (border-left)
    const themeColors = {
        "sport": "#16c784",
        "school": "#3b82f6",
        "party": "#9333ea",
        "emergency": "#dc4b52",
        "travel": "#eab308",
        "home": "#06b6d4",
        "sick": "#ea580c",
        "system": "#8b5cf6",
        "error": "#dc4b52"
    };

    const eventHeader = document.getElementById("event-header");
    eventHeader.style.display = "flex";
    eventHeader.style.borderLeftColor = themeColors[event.theme] || "#ffffff";

    currentShuffledChoices = [...event.choices];
    currentShuffledChoices.sort(() => Math.random() - 0.5);

    redBtn.textContent = currentShuffledChoices[0].text;
    yellowBtn.textContent = currentShuffledChoices[1].text;
    greenBtn.textContent = currentShuffledChoices[2].text;

    feedbackCard.style.display = "none";
    choicesContainer.style.display = "flex";

    const choiceButtons = [redBtn, yellowBtn, greenBtn];
    choiceButtons.forEach(btn => {
        btn.classList.remove("selected-choice", "dimmed-choice");
    });

    isGlucoseVisible = false;
    updateGlucoseDisplay();
    gameState = "PLAYING";
}

function onButtonPress(choiceIndex) {
    if (gameState !== "PLAYING" || waitingForPhone) return;

    currentChoiceIndex = choiceIndex;
    waitingForPhone = true;

    fetch(`${SERVER}/button_down/${choiceIndex}`).catch(e => console.log(e));

    document.getElementById("event-header").style.display = "none";

    const choiceButtons = [redBtn, yellowBtn, greenBtn];
    choiceButtons.forEach((btn, idx) => {
        if (idx === choiceIndex) {
            btn.classList.add("selected-choice");
            btn.classList.remove("dimmed-choice");
        } else {
            btn.classList.add("dimmed-choice");
            btn.classList.remove("selected-choice");
        }
    });

    situationElement.innerHTML = `
        <span style="color: #00ff99; font-size: 1.4rem; text-shadow: 0 0 10px rgba(0,255,153,0.8);">
            HOUD DE KNOP VAST <br>
            <span style="color: #e9edef; font-size: 1.1rem;">Zorgverlener: Voer toediening uit op de GSM!</span>
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

    // Reset de visuele weergave van de knoppen
    const choiceButtons = [redBtn, yellowBtn, greenBtn];
    choiceButtons.forEach(btn => {
        btn.classList.remove("selected-choice", "dimmed-choice");
    });

    document.getElementById("event-header").style.display = "flex";

    const currentEvent = events[currentEventIndex];
    situationElement.textContent = currentEvent.title;
}

function processChoiceResult(choiceIndex) {
    gameState = "FEEDBACK";

    const currentEvent = events[currentEventIndex];
    // Gebruik de actuele geschuffelde keuze!
    const choice = currentShuffledChoices[choiceIndex];

    glucose += choice.effect;
    fetch(`${SERVER}/set_glucose/${glucose}`).catch(e => console.log(e));

    if (glucose < 0) glucose = 0;
    isGlucoseVisible = true;

    fetch(`${SERVER}/set_scanned/1`);

    updateGlucoseDisplay();

    if (glucose <= 45) { endGame("THOMAS KREEG EEN ERNSTIGE HYPO"); return; }
    if (glucose >= 280) { endGame("THOMAS KREEG EEN ERNSTIGE HYPER"); return; }

    feedbackTextElement.textContent = currentEvent.feedback;

    if (choice.correct) {
        soundCorrect.play();
        score += 100;
        feedbackStatusElement.textContent = "✓ GOEDE KEUZE";
        feedbackStatusElement.style.color = "#10b981";
    } else {
        soundWrong.play();
        score -= 25;

        if (score < 0) score = 0;

        feedbackStatusElement.textContent = "✗ SLECHTE KEUZE";
        feedbackStatusElement.style.color = "#ef4444";
    }

    choicesContainer.style.display = "none";
    feedbackCard.style.display = "flex";
}

document.addEventListener("keydown", (event) => {
    if (gameState === "PLAYING" && !isSidequestActive) {
        if (event.repeat) return;
        if (event.key === "1") onButtonPress(0);
        if (event.key === "2") onButtonPress(1);
        if (event.key === "3") onButtonPress(2);
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
    if (randomKans < 0.20) triggerSensorCalibration();
    else if (randomKans < 0.40) triggerPincodeQuest();
    else triggerNextEvent();
});

function endGame(message) {
    gameState = "END";
    clearInterval(timerInterval);

    // Stop paniek-effecten
    soundHeartbeat.pause();
    document.body.style.filter = "none";

    questOverlay.style.display = "none";
    feedbackCard.style.display = "none";
    fetch(`${SERVER}/set_glucose/-1`);
    fetch(`${SERVER}/set_quest/none`);
    gameContainer.style.display = "none";
    endScreen.style.display = "flex";
    endMessage.textContent = message;

    fetch(`${SERVER}/set_state/END`);

    const isWin = message.includes("VEILIG") ? 1 : 0;
    fetch(`${SERVER}/set_game_over/${isWin}`).catch(e => console.log(e));

    if (message.includes("VEILIG")) {
        soundWin.play();
        score += 300;
        endTitle.textContent = "MISSIE GESLAAGD";
        endTitle.style.color = "#00ff99";
    } else {
        soundGameOver.play();
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
            fetch(`${SERVER}/reset_game`).then(() => location.reload()).catch(() => location.reload());
        }
    }, 1000);
}