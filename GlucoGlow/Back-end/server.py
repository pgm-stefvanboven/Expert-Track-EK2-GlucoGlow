# Import necessary libraries
from flask import Flask, jsonify
from flask_cors import CORS

# Initialize Flask app and enable CORS
app = Flask(__name__)
CORS(app)

# Initialize last_button variable to track the last button pressed
last_button = -1

# Initialize game_state dictionary to store current event and glucose level
game_state = {
    "currentEvent": 0,
    "glucose": -1
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
@app.route("/set_glucose/<int:value>")
def set_glucose(value):

    print("Nieuwe glucose:", value)

    game_state["glucose"] = value

    return jsonify({
        "success": True,
        "glucose": value
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

# Run the Flask app if this script is executed directly
if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )