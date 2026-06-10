let glucose = 75;
let timer = 90;

let events = [];
let currentEventIndex = 0;
let timerInterval;

// STARTSCHERM

const startScreen =
    document.getElementById("start-screen");

const startBtn =
    document.getElementById("startBtn");

// SPEL

const gameContainer =
    document.getElementById("game-container");

const glucoseElement =
    document.getElementById("glucose");

const timerElement =
    document.getElementById("timer");

const statusElement =
    document.getElementById("status");

const situationElement =
    document.getElementById("situation");

const choicesContainer =
    document.getElementById("choices");

const redBtn =
    document.getElementById("redBtn");

const yellowBtn =
    document.getElementById("yellowBtn");

const greenBtn =
    document.getElementById("greenBtn");

// FEEDBACK

const feedbackCard =
    document.getElementById("feedback-card");

const feedbackStatusElement =
    document.getElementById("feedback-status");

const feedbackTextElement =
    document.getElementById("feedback-text");

const nextBtn =
    document.getElementById("nextBtn");

// EINDSCHERM

const endScreen =
    document.getElementById("end-screen");

const endTitle =
    document.getElementById("end-title");

const endMessage =
    document.getElementById("end-message");

const restartBtn =
    document.getElementById("restartBtn");

// DATA LADEN

fetch("data/events.json")
    .then(response => response.json())
    .then(data => {

        events = data;

    });

// START SPEL

startBtn.addEventListener("click", () => {

    startScreen.style.display =
        "none";

    gameContainer.style.display = "flex";
    gameContainer.style.flexDirection = "column";

    glucoseElement.textContent =
        glucose;

    timerElement.textContent =
        timer;

    updateStatus();

    loadEvent(events[0]);

    startTimer();

});

// TIMER

function startTimer() {

    timerInterval = setInterval(() => {

        if (timer <= 0) {

            endGame(
                "DE TIJD IS OPGELOPEN"
            );

            return;
        }

        timer--;

        timerElement.textContent =
            timer;

    }, 1000);
}

// EVENT LADEN

function loadEvent(event) {

    situationElement.textContent =
        event.title;

    redBtn.textContent =
        event.choices[0].text;

    yellowBtn.textContent =
        event.choices[1].text;

    greenBtn.textContent =
        event.choices[2].text;

    feedbackCard.style.display =
        "none";

    choicesContainer.style.display =
        "flex";
}

// STATUS

function updateStatus() {

    if (glucose < 60) {

        statusElement.textContent =
            "HYPO RISICO";

        statusElement.style.color =
            "#ff4444";

        glucoseElement.style.color =
            "#ff4444";
    }

    else if (glucose > 120) {

        statusElement.textContent =
            "HYPER RISICO";

        statusElement.style.color =
            "#ff8800";

        glucoseElement.style.color =
            "#ff8800";
    }

    else {

        statusElement.textContent =
            "STABIEL";

        statusElement.style.color =
            "#00ff99";

        glucoseElement.style.color =
            "#00ff99";
    }
}

// KEUZE

function choose(choiceIndex) {

    const currentEvent =
        events[currentEventIndex];

    const choice =
        currentEvent.choices[choiceIndex];

    glucose += choice.effect;

    if (glucose < 0) {
        glucose = 0;
    }

    glucoseElement.textContent =
        glucose;

    updateStatus();

    if (glucose <= 40) {

        endGame(
            "THOMAS KREEG EEN ERNSTIGE HYPO"
        );

        return;
    }

    if (glucose >= 180) {

        endGame(
            "THOMAS KREEG EEN ERNSTIGE HYPER"
        );

        return;
    }

    feedbackTextElement.textContent =
        currentEvent.feedback;

    if (choice.correct) {

        feedbackStatusElement.textContent =
            "✓ GOEDE KEUZE";

        feedbackStatusElement.style.color =
            "#10b981";
    }

    else {

        feedbackStatusElement.textContent =
            "✗ SLECHTE KEUZE";

        feedbackStatusElement.style.color =
            "#ef4444";
    }

    choicesContainer.style.display =
        "none";

    feedbackCard.style.display =
        "flex";
}

// VOLGENDE

nextBtn.addEventListener("click", () => {

    currentEventIndex++;

    if (currentEventIndex < events.length) {

        loadEvent(
            events[currentEventIndex]
        );
    }

    else {

        endGame(
            "THOMAS KWAM VEILIG THUIS"
        );
    }

});

// KNOPPEN

redBtn.addEventListener("click", () => choose(0));

yellowBtn.addEventListener("click", () => choose(1));

greenBtn.addEventListener("click", () => choose(2));

// EINDSCHERM

function endGame(message) {

    clearInterval(timerInterval);

    gameContainer.style.display =
        "none";

    endScreen.style.display = "flex";
    endScreen.style.flexDirection = "column";

    endMessage.textContent =
        message;

    if (message.includes("VEILIG")) {

        endTitle.textContent =
            "MISSIE GESLAAGD";

        endTitle.style.color =
            "#00ff99";
    }

    else {

        endTitle.textContent =
            "MISSIE MISLUKT";

        endTitle.style.color =
            "#ff4444";
    }
}

// HERSTART

restartBtn.addEventListener("click", () => {

    location.reload();

});