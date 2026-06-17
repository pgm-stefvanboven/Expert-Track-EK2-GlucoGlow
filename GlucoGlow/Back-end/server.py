from flask import Flask, jsonify

app = Flask(__name__)

game_state = {
    "currentEvent": 0
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


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )