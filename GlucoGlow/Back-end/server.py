# Import necessary libraries
from flask import Flask, jsonify
from flask_cors import CORS

import json
import os

# Initialize Flask app and enable CORS
app = Flask(__name__)
CORS(app)

# Initialize last_button variable to track the last button pressed
last_button = -1

# Initialize game_state dictionary
game_state = {
    "currentEvent": 0,
    "glucose": -1,
    "activeQuest": "none",
    "timer": 90,
    "game_over": False,
    "win": False,
    "held_button": -1,
    "action_completed": False,
    # --- NIEUW VOOR DE LEDSTRIP ---
    "game_state": "START",
    "is_scanned": False
}

# Define route to get the current game state
@app.route("/get_event")
def get_event():
    # We maken een kopie zodat we dynamisch 'quest_active' kunnen toevoegen voor de ESP32
    response_data = game_state.copy()
    response_data["quest_active"] = (game_state["activeQuest"] != "none")
    return jsonify(response_data)

# --- NIEUWE ROUTES VOOR DE LEDSTRIP ---
@app.route("/set_state/<state>")
def set_state(state):
    game_state["game_state"] = state
    return jsonify({"success": True, "state": state})

@app.route("/set_scanned/<int:is_scanned>")
def set_scanned(is_scanned):
    game_state["is_scanned"] = bool(is_scanned)
    return jsonify({"success": True, "is_scanned": bool(is_scanned)})
# --- EINDE NIEUWE ROUTES VOOR DE LEDSTRIP ---

# Define route to set the current event based on event_id
@app.route("/set_event/<int:event_id>")
def set_event(event_id):
    game_state["currentEvent"] = event_id
    return jsonify({
        "success": True,
        "currentEvent": event_id
    })

# Define route to set the glucose level based on value
@app.route("/set_glucose/<value>")
def set_glucose(value):
    numeric_value = int(value)
    print("Nieuwe glucose:", numeric_value)
    game_state["glucose"] = numeric_value
    return jsonify({
        "success": True,
        "glucose": numeric_value
    })

# Define route to handle button presses based on button_id
@app.route("/button/<int:button_id>")
def button(button_id):
    global last_button
    last_button = button_id
    return jsonify({
        "success": True,
        "button": button_id
    })

# Define route to get the last button pressed
@app.route("/get_button")
def get_button():
    global last_button
    button = last_button
    last_button = -1
    return jsonify({
        "button": button
    })

# --- NIEUWE CO-OP ROUTES (VASTHOUDEN & ACTIE) ---

@app.route("/button_down/<int:button_id>")
def button_down(button_id):
    game_state["held_button"] = button_id
    return jsonify({"success": True, "held": button_id})

@app.route("/button_up")
def button_up():
    game_state["held_button"] = -1
    return jsonify({"success": True})

@app.route("/complete_action")
def complete_action():
    game_state["action_completed"] = True
    game_state["held_button"] = -1 # Reset de hold automatisch
    return jsonify({"success": True})

@app.route("/reset_action")
def reset_action():
    game_state["action_completed"] = False
    return jsonify({"success": True})

# --- EINDE CO-OP ROUTES ---

# Define route to trigger or end a quest
@app.route("/set_quest/<quest_name>")
def set_quest(quest_name):
    game_state["activeQuest"] = quest_name
    print(f"Quest status geüpdatet naar: {quest_name}")
    return jsonify({
        "success": True,
        "activeQuest": quest_name
    })

# Define route to check the PIN code
@app.route("/check_pin/<pin>")
def check_pin(pin):
    correct_pin = "6162"
    if pin == correct_pin:
        game_state["activeQuest"] = "none"
        return jsonify({"success": True, "message": "Toegang verleend!"})
    else:
        return jsonify({"success": False, "message": "Foutieve code!"})

@app.route("/save_score/<team>/<score>")
def save_score(team, score):
    score = int(score)
    bestand = os.path.join(
        os.path.dirname(__file__),
        "..",
        "Front-end",
        "data",
        "highscores.json"
    )

    if not os.path.exists(bestand):
        with open(bestand, "w") as f:
            json.dump([], f)

    with open(bestand, "r") as f:
        highscores = json.load(f)

    highscores.append({
        "team": team,
        "score": score
    })

    highscores.sort(key=lambda x: x["score"], reverse=True)
    highscores = highscores[:5]

    with open(bestand, "w") as f:
        json.dump(highscores, f, indent=4)

    return jsonify({"success": True})

@app.route("/get_highscore")
def get_highscore():
    bestand = os.path.join(
        os.path.dirname(__file__),
        "..",
        "Front-end",
        "data",
        "highscores.json"
    )

    if not os.path.exists(bestand):
        return jsonify({"team": "Niemand", "highscore": 0})

    with open(bestand, "r") as f:
        try:
            highscores = json.load(f)
        except json.JSONDecodeError:
            return jsonify({"team": "Niemand", "highscore": 0})

    if len(highscores) == 0:
        return jsonify({"team": "Niemand", "highscore": 0})

    return jsonify({
        "team": highscores[0].get("team", "Onbekend"),
        "highscore": highscores[0].get("score", 0)
    })

@app.route("/set_timer/<int:time>")
def set_timer(time):
    game_state["timer"] = time
    return jsonify({"success": True})

@app.route("/set_game_over/<int:is_win>")
def set_game_over(is_win):
    game_state["game_over"] = True
    game_state["win"] = bool(is_win)
    return jsonify({"success": True})

@app.route("/reset_game")
def reset_game():
    game_state["game_over"] = False
    game_state["timer"] = 90
    game_state["action_completed"] = False
    game_state["held_button"] = -1
    game_state["game_state"] = "START"  # Ledstrip reset
    game_state["is_scanned"] = False    # Ledstrip reset
    return jsonify({"success": True})

# Run the Flask app if this script is executed directly
if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )