console.log("APPJS GELADEN");
alert("APPJS GELADEN");

const SERVER = "http://10.45.239.212:5000";

fetch(`${SERVER}/set_glucose/-1`);

// GAME VARIABLES
let glucose = 75;
let timer = 90;

// EVENTS
let events = [];
let currentEventIndex = 0;

// We keep track of the exact state of the game to prevent unwanted input during feedback or end screens
let gameState = "START"; // Expected: "START", "PLAYING", "FEEDBACK", "END"

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

// FEEDBACK
const feedbackCard = document.getElementById("feedback-card");
const feedbackStatusElement = document.getElementById("feedback-status");
const feedbackTextElement = document.getElementById("feedback-text");
const nextBtn = document.getElementById("nextBtn");

// ENDSCREEN
const endScreen = document.getElementById("end-screen");
const endTitle = document.getElementById("end-title");
const endMessage = document.getElementById("end-message");
const restartBtn = document.getElementById("restartBtn");

// LOADING DATA
fetch("data/events.json")
    .then(response => response.json())
    .then(data => {
        events = data;
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

// START GAME
startBtn.addEventListener("click", () => {
    startScreen.style.display = "none";
    gameContainer.style.display = "flex";

    // Reset alle events zodat we met een schone lei beginnen
    events.forEach(e => e.played = false);

    // Genereer een random glucose tussen de 80 en 130
    const minGlucose = 80;
    const maxGlucose = 130;
    glucose = Math.floor(Math.random() * (maxGlucose - minGlucose + 1)) + minGlucose;

    timer = 90;

    // Stuur de start-glucose naar de Flask server
    fetch(`${SERVER}/set_glucose/${glucose}`)
        .then(response => response.json())
        .catch(error => console.error("FOUT BIJ START GLUCOSE:", error));

    // Status verandert naar PLAYING
    gameState = "PLAYING";
    timerElement.textContent = timer;

    // HIER GEBEURT DE MAGIC: Update de kleur direct en laad een passend event
    updateGlucoseDisplay();
    triggerNextEvent();

    startTimer();
});

// TIMER
function startTimer() {
    timerInterval = setInterval(() => {
        if (timer <= 0) {
            endGame("DE TIJD IS OPGELOPEN");
            return;
        }
        timer--;
        timerElement.textContent = timer;
    }, 1000);
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

    // Check for game-ending conditions based on glucose levels
    if (glucose <= 55) {
        endGame("THOMAS KREEG EEN ERNSTIGE HYPO");
        return;
    }

    // Check for game-ending conditions based on glucose levels
    if (glucose >= 250) {
        endGame("THOMAS KREEG EEN ERNSTIGE HYPER");
        return;
    }

    // Display feedback based on the choice made
    feedbackTextElement.textContent = currentEvent.feedback;

    // Update feedback status based on the correctness of the choices
    if (choice.correct) {
        feedbackStatusElement.textContent = "✓ GOEDE KEUZE";
        feedbackStatusElement.style.color = "#10b981";

        // Update feedback status based on the incorrectness of the choices
    } else {
        feedbackStatusElement.textContent = "✗ SLECHTE KEUZE";
        feedbackStatusElement.style.color = "#ef4444";
    }

    // Hide the choices and show the feedback card
    choicesContainer.style.display = "none";
    feedbackCard.style.display = "flex";
}

// NEXT EVENT
nextBtn.addEventListener("click", () => {
    // Dit roept nu onze slimme functie aan in plaats van gewoon +1 te doen
    triggerNextEvent();
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

    // Zet de telefoon weer op wachtstand!
    fetch(`${SERVER}/set_glucose/-1`);

    gameContainer.style.display = "none";
    endScreen.style.display = "flex";
    endMessage.textContent = message;

    if (message.includes("VEILIG")) {
        endTitle.textContent = "MISSIE GESLAAGD";
        endTitle.style.color = "#00ff99";
    } else {
        endTitle.textContent = "MISSIE MISLUKT";
        endTitle.style.color = "#ff4444";
    }
}

// RESTART
restartBtn.addEventListener("click", () => {

    fetch(`${SERVER}/set_glucose/-1`);
    fetch(`${SERVER}/set_event/0`);

    setTimeout(() => {
        location.reload();
    }, 200);

});