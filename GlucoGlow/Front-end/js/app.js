console.log("APPJS GELADEN");
alert("APPJS GELADEN");

const SERVER = "http://10.45.239.212:5000";

fetch(`${SERVER}/set_glucose/-1`);

// GAME VARIABLES
let glucose = 75;
let timer = 90;
let score = 0;

// TEAM NAME
let teamName = "";

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

const teamOverlay = document.getElementById("team-overlay");
const teamNameInput = document.getElementById("teamNameInput");
const teamOkBtn = document.getElementById("teamOkBtn");

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
        highscoreElement.textContent = data.highscore;
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

// UPDATE GLUCOSE KLEUR EN WAARDE
function updateGlucoseDisplay() {
    glucoseElement.textContent = glucose;

    if (glucose <= 75) {
        glucoseElement.style.color = "#ef4444"; // Rood (Hypo gevaar)
        glucoseElement.style.textShadow = "0 0 15px rgba(239, 68, 68, 0.8)";
    } else if (glucose >= 160) {
        glucoseElement.style.color = "#f59e0b"; // Oranje (Hyper gevaar)
        glucoseElement.style.textShadow = "0 0 15px rgba(245, 158, 11, 0.8)";
    } else {
        glucoseElement.style.color = "#10b981"; // Groen (Veilig)
        glucoseElement.style.textShadow = "0 0 15px rgba(16, 185, 129, 0.8)";
    }
}

// KIES EEN LOGISCH EVENT
function getValidEvent() {
    const validEvents = events.filter(event => {
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

// LAAD HET VOLGENDE EVENT
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

function startGame() {

    startScreen.style.display = "none";
    gameContainer.style.display = "flex";

    // Reset alle events zodat we met een schone lei beginnen
    events.forEach(e => e.played = false);

    const minGlucose = 80;
    const maxGlucose = 130;
    glucose = Math.floor(Math.random() * (maxGlucose - minGlucose + 1)) + minGlucose;

    timer = 90;
    score = 0;

    fetch(`${SERVER}/set_glucose/${glucose}`);

    gameState = "PLAYING";
    timerElement.textContent = timer;

    updateGlucoseDisplay();
    triggerNextEvent();

    startTimer();
}

startBtn.addEventListener("click", () => {
    teamOverlay.style.display = "flex";
    teamNameInput.focus();
});

teamOkBtn.addEventListener("click", () => {

    teamName = teamNameInput.value.trim();

    if (teamName === "") {
        teamName = "Anoniem";
    }

    teamOverlay.style.display = "none";

    startGame();

});

// TIMER FIX
function startTimer() {
    timerInterval = setInterval(() => {
        // Trek eerst de juiste hoeveelheid tijd af
        if (gameState === "QUEST") {
            timer -= 2; // Straf!
        } else {
            timer -= 1; // Normaal
        }

        // Check dan pas of de timer 0 of lager is (voorkomt de -1 bug)
        if (timer <= 0) {
            timer = 0; // Klem hem vast op 0
            timerElement.textContent = timer;
            if (questTimerDisplay) questTimerDisplay.textContent = timer;
            endGame("DE TIJD IS OP");
            return;
        }

        // Update de schermen
        timerElement.textContent = timer;
        if (questTimerDisplay) questTimerDisplay.textContent = timer;

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
    if (currentPin.length !== 4) return; // Doe niets als het geen 4 cijfers zijn

    fetch(`${SERVER}/check_pin/${currentPin}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                questOverlay.style.display = "none";
                timer += 10; // Bonus
                timerElement.textContent = timer;
                clearPin(); // Reset voor de volgende keer
                triggerNextEvent();
            } else {
                document.getElementById("pinFeedback").textContent = "FOUT! -5 SEC!";
                timer -= 5;
                timerElement.textContent = timer;
                clearPin(); // Maak veld weer leeg
            }
        })
        .catch(error => console.error("Kluis Fout:", error));
}

// Aangepaste triggerQuest functie zodat hij het nieuwe display reset
function triggerQuest(questName) {
    gameState = "QUEST";
    fetch(`${SERVER}/set_quest/${questName}`);

    if (questName === "pincode") {
        feedbackCard.style.display = "none";
        questOverlay.style.display = "flex";
        clearPin(); // Zorg dat display leeg start
    }
}

// LOADING EVENT
function loadEvent(event) {
    situationElement.textContent = event.title;
    trendElement.textContent = event.trend;
    redBtn.textContent = event.choices[0].text;
    yellowBtn.textContent = event.choices[1].text;
    greenBtn.textContent = event.choices[2].text;

    feedbackCard.style.display = "none";
    choicesContainer.style.display = "flex";

    // Ready for input
    gameState = "PLAYING";
}

// Make CHOICE
function choose(choiceIndex) {
    // Block input if not in PLAYING state
    if (gameState !== "PLAYING") {
        return;
    }
    // Change state to FEEDBACK to prevent further input until next event
    gameState = "FEEDBACK";

    // Update glucose based on the choice made
    const currentEvent = events[currentEventIndex];
    const choice = currentEvent.choices[choiceIndex];

    console.log(
        "Event:", currentEvent.title,
        "| Knop:", choiceIndex,
        "| Effect:", choice.effect,
        "| Glucose voor:", glucose
    );

    glucose += choice.effect;

    console.log("Glucose na:", glucose);

    // Update the Flask server with the new glucose value
    fetch(`${SERVER}/set_glucose/${glucose}`)
        .then(response => response.json())
        .then(data => {
            console.log("SET GLUCOSE:", data);
        })
        .catch(error => {
            // Log the error to the console for debugging purposes
            console.error("FOUT:", error);
        });

    // Ensure glucose does not go below 0
    if (glucose < 0) {
        glucose = 0;
    }

    // Update the glucose display AND color
    updateGlucoseDisplay();

    // Check for game-ending conditions
    if (glucose <= 45) { // Maak dit lager (was 55)
        endGame("THOMAS KREEG EEN ERNSTIGE HYPO");
        return;
    }

    if (glucose >= 280) { // Maak dit hoger (was 250)
        endGame("THOMAS KREEG EEN ERNSTIGE HYPER");
        return;
    }

    // Display feedback based on the choice made
    feedbackTextElement.textContent = currentEvent.feedback;

    // Update feedback status based on the correctness of the choices
    if (choice.correct) {

        score += 100;

        feedbackStatusElement.textContent = "✓ GOEDE KEUZE";
        feedbackStatusElement.style.color = "#10b981";

    } else {

        score -= 25;

        feedbackStatusElement.textContent = "✗ SLECHTE KEUZE";
        feedbackStatusElement.style.color = "#ef4444";
    }

    // Hide the choices and show the feedback card
    choicesContainer.style.display = "none";
    feedbackCard.style.display = "flex";
}

// NEXT EVENT
nextBtn.addEventListener("click", () => {
    // Verberg altijd eerst het feedback scherm
    feedbackCard.style.display = "none";

    // 30% kans dat de pomp plots blokkeert (alleen tussen events door!)
    if (Math.random() < 0.30) {
        triggerQuest("pincode");
    } else {
        // Geen storing? Laad veilig de volgende situatie in
        triggerNextEvent();
    }
});

// LIGHT BUTTONS (Keyboard debug)
document.addEventListener("keydown", (event) => {
    if (gameState === "PLAYING") {
        if (event.key === "1") choose(0);
        if (event.key === "2") choose(1);
        if (event.key === "3") choose(2);
    }

    if (gameState === "FEEDBACK") {
        if (event.key === " ") nextBtn.click();
    }
});

// ARCADE BUTTONS
setInterval(() => {
    // 1. The button is always retrieved, regardless of which screen we're on.
    // This ensures that the Flask server is always properly reset to -1.
    fetch(`${SERVER}/get_button`)
        .then(response => response.json())
        .then(data => {

            // 2. A response is sent only when the status is set to "PLAYING"
            // Old clicks on the home screen now just disappear.
            if (gameState === "PLAYING" && data.button !== -1) {

                switch (data.button) {
                    case 0:
                        choose(0);
                        break;
                    case 1:
                        choose(1);
                        break;
                    case 2:
                        choose(2);
                        break;
                }
            }

        })
        .catch(error => {
            // Error messages ignored to keep the console clean
        });

}, 200);

// ENDSCREEN
function endGame(message) {
    gameState = "END";
    clearInterval(timerInterval);

    questOverlay.style.display = "none";
    feedbackCard.style.display = "none";

    // Zet de telefoon weer op wachtstand!
    fetch(`${SERVER}/set_glucose/-1`);

    gameContainer.style.display = "none";
    endScreen.style.display = "flex";
    endMessage.textContent = message;

    if (message.includes("VEILIG")) {
        score += 300;

        endTitle.textContent = "MISSIE GESLAAGD";
        endTitle.style.color = "#00ff99";
    } else {
        endTitle.textContent = "MISSIE MISLUKT";
        endTitle.style.color = "#ff4444";
    }

    // Toon de behaalde score
    endScore.textContent = `Score: ${score} punten`;

    fetch(`${SERVER}/save_score/${score}`);

    // Aftellen naar het startscherm
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

            location.reload();
        }

    }, 1000);
}