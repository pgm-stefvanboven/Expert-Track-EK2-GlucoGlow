const SERVER = "http://10.91.88.212:5000";

let events = [];
let currentEvent = 0;
let hiddenChoices = [];
let wasPlaying = false; // Houdt bij of we hiervoor aan het spelen waren

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

// QUEST ELEMENTEN
const hiddenMessage = document.getElementById("hidden-message");
const hiddenAnswers = document.getElementById("hidden-answers");

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
                questScreen.style.display = "none"; // Zorg dat de quest ook verborgen is
                waitingScreen.style.display = "flex";

                // Als we hiervóór aan het spelen waren, is de missie zojuist geëindigd!
                if (wasPlaying) {
                    wasPlaying = false; // Reset de status

                    // Pas het scherm aan voor een mooiere afsluiting
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

            // --- Vanaf hier is het spel wél bezig ---
            wasPlaying = true;

            waitingSpinner.style.display = "block";
            waitingTitle.textContent = "STAND-BY";
            waitingText.textContent = "Wachten op connectie met spelsysteem...";
            waitingScreen.style.display = "none";

            // HIER GEBEURT DE QUEST MAGIC: Check of er een quest actief is
            if (data.activeQuest === "pincode") {
                // Verberg de chat, toon het medisch dossier!
                chatContainer.style.display = "none";
                questScreen.style.display = "flex";
            } else {
                // Geen quest? Dan gewoon de normale chat tonen.
                questScreen.style.display = "none";
                chatContainer.style.display = "flex";
            }

            // Update glucose waarden
            currentEvent = data.currentEvent;
            hiddenChoices = data.hiddenChoices || [];

            console.log("Volledige serverdata:", data);
            console.log("Hidden choices:", hiddenChoices);

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

            loadPhoneEvent();
        })
        .catch(error => console.error(error));
}

function loadPhoneEvent() {
    const event = events[currentEvent];
    if (!event) return;

    situationElement.textContent = event.title;
    trendElement.textContent = event.trend;

    // Is het een pincode quest?
    if (event.type === "pincode") {
        chatContainer.style.display = "none";
        questScreen.style.display = "flex"; // Toon het medisch dossier

        // Vul de hints in!
        document.getElementById("quest-title").textContent = event.questTitle;
        const cluesList = document.getElementById("phone-clues");
        cluesList.innerHTML = ""; // Maak oude hints leeg

        event.clues.forEach(clue => {
            let li = document.createElement("li");
            li.textContent = clue;
            cluesList.appendChild(li);
        });
        return;
    }

    // Is het de kleuren-kalibratie missie?
    if (event.type === "sidequest") {
        questScreen.style.display = "none";
        chatContainer.style.display = "flex";

        document.body.style.backgroundColor = "#7f1d1d"; // Alarm Rood!
        statusElement.textContent = "⚠ KALIBRATIE VEREIST";
        statusElement.style.color = "#ffffff";
        glucoseElement.textContent = "ERR";
        return;
    }

    // NORMALE GAMEPLAY
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

    hiddenAnswers.innerHTML = "";

    if (hiddenChoices.length === 0) {
        hiddenMessage.style.display = "none";
    } else {

        hiddenMessage.style.display = "flex";

        hiddenChoices.forEach(index => {

            const kleur =
                index === 0 ? "🔴" :
                    index === 1 ? "🟡" :
                        "🟢";

            hiddenAnswers.innerHTML +=
                `${kleur} ${event.choices[index].text}<br>`;
        });
    }
}