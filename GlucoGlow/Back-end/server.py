from flask import Flask, jsonify

app = Flask(__name__)

game_state = {
    "currentEvent": 0
}


@app.route("/get_event")
def get_event():
    return jsonify(game_state)


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )