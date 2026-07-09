const SERVER = "http://10.45.239.212:5000";

let events = [];
let currentEvent = 0;
let wasPlaying = false; // Houdt bij of we hiervoor aan het spelen waren

// SCHERMEN
const waitingScreen = document.getElementById("waiting-screen");
const chatContainer = document.getElementById("chat-container");

// WACHTSCHERM ELEMENTEN
const waitingSpinner = document.getElementById("waiting-spinner");
const waitingTitle = document.getElementById("waiting-title");
const waitingText = document.getElementById("waiting-text");

// CHAT ELEMENTEN
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
                chatContainer.style.display = "none";
                waitingScreen.style.display = "flex";

                // Als we hiervóór aan het spelen waren, is de missie zojuist geëindigd!
                if (wasPlaying) {
                    wasPlaying = false; // Reset de status

                    // Pas het scherm aan voor een mooiere afsluiting
                    waitingSpinner.style.display = "none"; // Verberg het laadwieltje even
                    waitingTitle.textContent = "MISSIE AFGELOPEN";
                    waitingText.textContent = "Kijk naar het grote scherm voor de uitslag!";

                    // Zet na 6 seconden het scherm weer terug naar de normale Stand-by stand
                    setTimeout(() => {
                        waitingSpinner.style.display = "block";
                        waitingTitle.textContent = "STAND-BY";
                        waitingText.textContent = "Wachten op connectie met spelsysteem...";
                    }, 6000);
                }
                return;
            }

            // --- Vanaf hier is het spel wél bezig ---

            // Markeer dat we aan het spelen zijn
            wasPlaying = true;

            // Zorg dat het wachtscherm altijd goed gereset is (voor het geval we snel herstarten)
            waitingSpinner.style.display = "block";
            waitingTitle.textContent = "STAND-BY";
            waitingText.textContent = "Wachten op connectie met spelsysteem...";

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

            // Roep de functie aan die de specifieke event-teksten inlaadt
            loadPhoneEvent();
        })
        .catch(error => console.error(error));
}

// DEZE FUNCTIE ONTBAK: Zorgt voor de juiste teksten en pijltjes per situatie
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