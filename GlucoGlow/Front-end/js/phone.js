const SERVER = "http://10.45.239.212:5000";

let events = [];
let currentEvent = 0;

// SCHERMEN
const waitingScreen = document.getElementById("waiting-screen");
const chatContainer = document.getElementById("chat-container");

// ELEMENTEN
const glucoseElement = document.getElementById("phone-glucose");
const trendElement = document.getElementById("phone-trend");
const statusElement = document.getElementById("phone-status");
const situationElement = document.getElementById("phone-situation");

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
                waitingScreen.style.display = "flex";
                chatContainer.style.display = "none";
                return;
            }

            // Het spel is wél bezig: toon de chat!
            waitingScreen.style.display = "none";
            chatContainer.style.display = "flex";

            currentEvent = data.currentEvent;
            glucoseElement.textContent = data.glucose;

            if (data.glucose <= 75) {
                glucoseElement.style.color = "#ef4444";
                statusElement.style.color = "#ef4444";
            } else if (data.glucose >= 160) {
                glucoseElement.style.color = "#f59e0b";
                statusElement.style.color = "#f59e0b";
            } else {
                glucoseElement.style.color = "#00a884"; // WhatsApp Groen
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

    if (event.trend === "↓↓" || event.trend === "↓") {
        statusElement.textContent = "⚠ RISICO OP HYPO";
    } else if (event.trend === "↑↑" || event.trend === "↑") {
        statusElement.textContent = "⚠ RISICO OP HYPER";
    } else {
        statusElement.textContent = "STABIEL";
    }
}