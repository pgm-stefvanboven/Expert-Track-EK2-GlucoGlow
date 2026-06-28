from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

last_button = -1

game_state = {
    "currentEvent": 0,
    "glucose": 75
}

@app.route("/get_event")
def get_event():
    return jsonify(game_state)

@app.route("/set_event/<int:event_id>")
def set_event(event_id):

    game_state["currentEvent"] = event_id

    return jsonify({
        "success": True,
        "currentEvent": event_id
    })

@app.route("/set_glucose/<int:value>")
def set_glucose(value):

    game_state["glucose"] = value

    return jsonify({
        "success": True,
        "glucose": value
    })


@app.route("/button/<int:button_id>")
def button(button_id):

    global last_button

    last_button = button_id

    return jsonify({
        "success": True,
        "button": button_id
    })


@app.route("/get_button")
def get_button():

    global last_button

    button = last_button
    last_button = -1

    return jsonify({
        "button": button
    })

if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )