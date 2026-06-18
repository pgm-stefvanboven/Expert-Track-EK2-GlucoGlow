console.log("PHONEJS GELADEN");
alert("PHONEJS GELADEN");

let events = [];
let currentEvent = 0;

const glucoseElement =
    document.getElementById("phone-glucose");

const trendElement =
    document.getElementById("phone-trend");

const statusElement =
    document.getElementById("phone-status");

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

function updateFromServer() {

    fetch("http://10.250.156.212:5000/get_event")
        .then(response => response.json())
        .then(data => {

            currentEvent =
                data.currentEvent;

            glucoseElement.textContent =
                data.glucose;

            loadPhoneEvent();

        });

}

function loadPhoneEvent() {

    const event =
        events[currentEvent];

    if (!event) {
        return;
    }

    glucoseElement.textContent =
        data.glucose;

    trendElement.textContent =
        event.trend;

    if (
        event.trend === "↓↓" ||
        event.trend === "↓"
    ) {

        statusElement.textContent =
            "RISICO OP HYPO";
    }

    else if (
        event.trend === "↑↑" ||
        event.trend === "↑"
    ) {

        statusElement.textContent =
            "RISICO OP HYPER";
    }

    else {

        statusElement.textContent =
            "STABIEL";
    }

}