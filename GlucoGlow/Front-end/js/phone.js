// CHECK IF PHONE.JS IS LOADED (Only for debugging purposes)
console.log("PHONEJS GELADEN");
alert("PHONEJS GELADEN");

const SERVER = "http://10.45.239.212:5000";

// GAME VARIABLES
let events = [];
let currentEvent = 0;

// PHONE ELEMENTS
const glucoseElement =
    document.getElementById("phone-glucose");

const trendElement =
    document.getElementById("phone-trend");

const statusElement =
    document.getElementById("phone-status");

// LOADING DATA
fetch("data/events.json")
    .then(response => response.json())
    .then(data => {

        events = data;

        updateFromServer();

        setInterval(
            updateFromServer,
            1000
        );

    });

    // UPDATE FROM SERVER
    function updateFromServer() {

    // Fetch the current event and glucose level from the server
    fetch(`${SERVER}/get_event`)
        .then(response => response.json())
        .then(data => {

            // Update the current event index and glucose level based on the server response
            currentEvent = data.currentEvent;

            // Update the glucose level on the phone display
            glucoseElement.textContent =
                data.glucose;

            // Load the current event details on the phone display
            loadPhoneEvent();

        })
        .catch(error => {
            // Handle any errors that occur during the fetch request
            console.error(error);
        });

}

// LOAD PHONE EVENT
function loadPhoneEvent() {

    // Get the current event based on the currentEvent index
    const event =
        events[currentEvent];

    // If the event is not found, return early
    if (!event) {
        return;
    }

    // Update the trend element on the phone display with the event's trend
    trendElement.textContent =
        event.trend;

    // Update the status element on the phone display based on the event's trend
    if (
        event.trend === "↓↓" ||
        event.trend === "↓"
    ) {

        // Update the status element to indicate a risk of hypoglycemia
        statusElement.textContent =
            "RISICO OP HYPO";
    }

    // Update the status element to indicate a risk of hyperglycemia
    else if (
        event.trend === "↑↑" ||
        event.trend === "↑"
    ) {

        statusElement.textContent =
            "RISICO OP HYPER";
    }

    // Update the status element to indicate stable glucose levels
    else {

        statusElement.textContent =
            "STABIEL";
    }

}