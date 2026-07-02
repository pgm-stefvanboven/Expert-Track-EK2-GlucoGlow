console.log("APPJS GELADEN");
alert("APPJS GELADEN");

// GAME VARIABLES
let glucose = 75;
let timer = 90;

// EVENTS
let events = [];
let currentEventIndex = 0;

// We keep track of the exact state of the game to prevent unwanted input during feedback or end screens
let gameState = "START"; // Expected: "START", "PLAYING", "FEEDBACK", "END"

// SET GLUCOSE
fetch("http://10.31.194.212:5000/set_glucose/75");

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

// START GAME
startBtn.addEventListener("click", () => {
    startScreen.style.display = "none";
    gameContainer.style.display = "flex";

    glucose = 75;
    timer = 90;
    currentEventIndex = 0;
    
    // Status changes to PLAYING
    gameState = "PLAYING";

    fetch("http://10.31.194.212:5000/set_event/0")
        .then(response => response.json())
        .then(data => {
            console.log("START EVENT:", data);
        })
        .catch(error => {
            console.error("FOUT:", error);
        });

    glucoseElement.textContent = glucose;
    timerElement.textContent = timer;

    loadEvent(events[0]);
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

    glucose += choice.effect;

    // Update the Flask server with the new glucose value
    fetch(`http://10.31.194.212:5000/set_glucose/${glucose}`)
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

    // Update the glucose display
    glucoseElement.textContent = glucose;

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
    // Ready for the next event
    currentEventIndex++;

    // Check if there are more events to load
    if (currentEventIndex < events.length) {
        // Update the Flask server with the new event index
        fetch(`http://10.31.194.212:5000/set_event/${currentEventIndex}`)

        // Convert the response to JSON
            .then(response => response.json())

            // Log the response data to the console
            .then(data => {
                console.log("SET EVENT:", data);
            })
            // Handle any errors
            .catch(error => {
                console.error("FOUT:", error);
            });

        // Load the next event
        loadEvent(events[currentEventIndex]);
    } else {
        // No more events, end the game
        endGame("THOMAS KWAM VEILIG THUIS");
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
    fetch("http://10.31.194.212:5000/get_button")
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
    location.reload();
});