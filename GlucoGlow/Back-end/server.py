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

# Initialize game_state dictionary to store current event and glucose level
game_state = {
    "currentEvent": 0,
    "glucose": -1,
    "activeQuest": "none",
    "timer": 90,
    "game_over": False,
    "win": False,
    "hiddenChoices": []
}

# Define route to get the current game state
@app.route("/get_event")
def get_event():
    return jsonify(game_state)

# Define route to set the current event based on event_id
@app.route("/set_event/<int:event_id>")
def set_event(event_id):
    
    # Update the current event in the game_state dictionary
    game_state["currentEvent"] = event_id

    # Return a JSON response indicating success and the current event
    return jsonify({
        "success": True,
        "currentEvent": event_id
    })

# Define route to set the glucose level based on value
@app.route("/set_glucose/<value>")
def set_glucose(value):
    # Zet de binnengekomen URL-tekst (inclusief mintekens) om naar een integer
    numeric_value = int(value)
    
    print("Nieuwe glucose:", numeric_value)
    game_state["glucose"] = numeric_value

    return jsonify({
        "success": True,
        "glucose": numeric_value
    })
    
@app.route("/set_hidden_choices/<choices>")
def set_hidden_choices(choices):

    print("Hidden choices ontvangen:", choices)

    if choices == "none":
        game_state["hiddenChoices"] = []
    else:
        game_state["hiddenChoices"] = [int(x) for x in choices.split(",")]

    print("Game state hiddenChoices:", game_state["hiddenChoices"])

    return jsonify({
        "success": True,
        "hiddenChoices": game_state["hiddenChoices"]
    })

# Define route to handle button presses based on button_id
@app.route("/button/<int:button_id>")
def button(button_id):
    
    # Update the last_button variable with the button_id
    global last_button

    last_button = button_id

    # Return a JSON response indicating success and the button pressed
    return jsonify({
        "success": True,
        "button": button_id
    })

# Define route to get the last button pressed
@app.route("/get_button")
def get_button():
    
    # Use the global last_button variable to retrieve the last button pressed
    global last_button

    # Return the last button pressed and reset last_button to -1
    button = last_button
    last_button = -1

    # Return a JSON response with the last button pressed
    return jsonify({
        "button": button
    })
    
    # Define route to trigger or end a quest
@app.route("/set_quest/<quest_name>")
def set_quest(quest_name):
    # Verander de actieve quest (gebruik "none" om hem te stoppen)
    game_state["activeQuest"] = quest_name
    
    print(f"Quest status geüpdatet naar: {quest_name}")
    
    return jsonify({
        "success": True,
        "activeQuest": quest_name
    })

# Define route to check the PIN code
@app.route("/check_pin/<pin>")
def check_pin(pin):
    # De juiste code voor onze eerste quest
    correct_pin = "6162"
    
    if pin == correct_pin:
        # Code is goed! Stop de quest.
        game_state["activeQuest"] = "none"
        return jsonify({"success": True, "message": "Toegang verleend!"})
    else:
        # Code is fout.
        return jsonify({"success": False, "message": "Foutieve code!"})
    
@app.route("/save_score/<team>/<int:score>")
def save_score(team, score):
    
    score = int(score)

    bestand = os.path.join(
    os.path.dirname(__file__),
    "..",
    "Front-end",
    "data",
    "highscores.json"
)

    # Bestaat het bestand nog niet?
    if not os.path.exists(bestand):
        with open(bestand, "w") as f:
            json.dump([], f)

    # Lees de huidige highscores
    with open(bestand, "r") as f:
        highscores = json.load(f)

    # Nieuwe score toevoegen
    highscores.append({
        "team": team,
        "score": score
    })

    # Sorteer van hoog naar laag
    highscores.sort(key=lambda x: x["score"], reverse=True)

    # Bewaar enkel de beste 5
    highscores = highscores[:5]

    # Opslaan
    with open(bestand, "w") as f:
        json.dump(highscores, f, indent=4)

    return jsonify({
        "success": True
    })
    
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
            # Als het bestand corrupt is of leeg
            return jsonify({"team": "Niemand", "highscore": 0})

    if len(highscores) == 0:
        return jsonify({"team": "Niemand", "highscore": 0})

    # Gebruik .get() in plaats van direct opvragen. 
    # Dit voorkomt een KeyError als "team" of "score" niet bestaat in oude data.
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
    return jsonify({"success": True})

# Run the Flask app if this script is executed directly
if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )