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

        loadPhoneEvent();

    });

function loadPhoneEvent() {

    const event =
        events[currentEvent];

    glucoseElement.textContent =
        event.glucose;

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