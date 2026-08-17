## GlucoGlow

A interactive game about diabetes.

## Installation

### Requirements
- Python 3.9+
- Lokale webserver (bijv. Live Server in VS Code of `python -m http.server`)
- Raspberry Pi/computer voor de Flask back-end en fysieke knoppen
- ESP32 met LED-strip voor visuele feedback
- Smartphone of touchscreen voor de Zorgverlener Monitor

### 1. Back-end opstarten

1. Navigeer naar de map waarin `server.py` staat:

   ```bash
   cd Back-end
   ```

2. Installeer de benodigde Python-packages:

   ```bash
   pip install flask flask-cors pygame requests
   ```

3. Start de Flask API:

   ```bash
   python server.py
   ```

   *De server draait standaard op poort* `5000` *(bv. `http://localhost:5000` of het lokale IP-adres van de computer/Pi).*

### 2. Front-end opstarten

1. Host de `Front-end/` map via een lokale webserver:

   ```bash
   cd Front-end
   python -m http.server 8080
   ```

2. Open de gewenste interfaces in de browser:
   - **Hoofdscherm (Speler 1):** `http://localhost:8080/index.html`
   - **Zorgverlener Monitor (Speler 2):** `http://<IP-ADRES>:8080/phone.html`
   - **Spectator Dashboard:** `http://<IP-ADRES>:8080/spectator.html`

Alle apparaten moeten verbonden zijn met hetzelfde lokale netwerk.

Het huidige server-IP-adres staat rechtstreeks in de JavaScript- en Python-bestanden. Wanneer de installatie op een ander netwerk wordt gebruikt, moet dit IP-adres worden aangepast.

## Front-end

De front-end is gebouwd met **Vanilla HTML5, CSS3 en JavaScript (ES6+)** zonder externe frameworks. Dit houdt de installatie licht en beperkt het aantal afhankelijkheden.

### Structuur & Interfaces

- **`index.html`** **&** **`js/app.js`** **(Hoofdscherm / Speler 1):**
  - Beheert de game state (`START`, `READING`, `DISCUSSING`, `PLAYING`, `QUEST`, `FEEDBACK`, `END`) en de spellus.
  - Verwerkt de fysieke drukknoppen via de Flask-server.
  - Ondersteunt toetsenbord-simulatie met `1`, `2`, `3` en `4`/`S`.
  - Stuurt audio-effecten aan en toont visuele feedback bij verschillende glucosewaarden.
- **`phone.html`** **&** **`js/phone.js`** **(Zorgverlener Monitor / Speler 2):**
  - Mobiele webinterface in chat-stijl, geoptimaliseerd voor touchscreens.
  - Vereist handmatige invoer van de afgelezen glucosewaarde voordat medische context en co-op acties worden ontgrendeld.
  - Biedt verschillende co-op handelingen via `tap_hold`, `confirm_only` en `quiz_prompt`.
- **`spectator.html`** **&** **`js/spectator.js`** **(Toeschouwers Dashboard):**
  - Toont realtime de vitale status, missievoortgang en teamstatus.
  - Gebruikt anti-spoiler logica waardoor glucose verborgen blijft totdat de speler de sensor scant.
- **`data/events.json`**: Bevat alle scenario's, educatieve feedback, keuzes, thema's en sidequests.
- **`data/bannedWords.json`**: Woordenlijst voor runtime filtering en validatie van teamnamen.

### Technische keuzes

- **HTTP Polling:** Gekozen voor continue polling via `fetch()` in plaats van WebSockets. Hierdoor kunnen de verschillende interfaces automatisch opnieuw synchroniseren na korte verbindingsproblemen binnen het lokale netwerk.
- **Data-driven architectuur:** De scenario's, keuzes, effecten en quests worden ingeladen vanuit `events.json`. Hierdoor kan de spelinhoud aangepast of uitgebreid worden zonder de algemene game-logica te wijzigen.
- **Gedeelde server state:** De verschillende interfaces communiceren niet rechtstreeks met elkaar, maar gebruiken de Flask-server als centrale state layer. Hierdoor werken het hoofdscherm, de GSM en het spectator dashboard met dezelfde spelstatus.

## Back-end

De back-end fungeert als centrale orchestrator tussen de fysieke hardware en de verschillende webclients.

### Technologie & Endpoints

Gebouwd met **Python en Flask** (`flask-cors`) als centrale API voor de installatie:

- `GET /get_event`: Haalt de actuele game status, timer, glucose, actieve quest en hardwarestatus op.
- `GET /set_glucose/<waarde>`: Werkt de glucosewaarde bij.
- `GET /button_down/<id>` & `GET /button_up`: Registreert wanneer een fysieke knop wordt ingedrukt en losgelaten.
- `GET /complete_action` & `GET /reset_action`: Synchroniseert voltooide co-op handelingen tussen GSM en hoofdscherm.
- `GET /set_event/<id>`: Stelt het actieve event in.
- `GET /set_quest/<naam>`: Stelt een actieve sidequest in.
- `GET /get_highscore` & `GET /save_score/<team>/<score>`: Beheert de vijf hoogste teamscores in `highscores.json`.
- `GET /set_timer/<tijd>`: Synchroniseert de resterende speeltijd.
- `GET /set_game_over/<waarde>`: Registreert het einde en resultaat van de missie.

### Fysieke knoppen

`knoppen_glucoglow.py` gebruikt **Pygame** om de fysieke USB-knoppen te detecteren. Button down- en button up-events worden via HTTP doorgestuurd naar de Flask-server.

Hierdoor kan het spel onderscheid maken tussen een knop indrukken en een knop vasthouden. Dit is belangrijk voor de co-op interactie waarbij Speler 1 de fysieke knop vasthoudt terwijl Speler 2 de actie uitvoert op de GSM.

### LED-strip

De ESP32 gebruikt de gedeelde serverstatus om de LED-strip aan te sturen. De verlichting geeft visuele feedback over onder andere de glucose-status, actieve quests en het einde van de missie.

## Used files for banned words

the banned words are stored in the `bannedWords.json` file located in the `Front-end/data/` directory. This JSON file contains an array of words that are considered inappropriate or offensive. The application fetches this list at runtime to filter user input and ensure that any banned words are not accepted. I wrote and added some of the banned words myself, but I was looking for a list of both Dutch and English banned words, so I’d like to link to the GitHub repository where I got these two lists.

[Dutch words](https://github.com/Hesham-Elbadawi/list-of-banned-words/blob/master/nl)

[English words](https://github.com/Hesham-Elbadawi/list-of-banned-words/blob/master/en)

## Used sound effects

[Sound effect 1: Start game - mokasza](https://freesound.org/people/mokasza/sounds/810178/) - This sound effect is used for starting the game.

[Sound effect 2: Scan-sound - CogFireStudios](https://freesound.org/people/CogFireStudios/sounds/531512/) - This sound effect is used for scanning glucose levels.

[Sound effect 3: Good choice sound - KoiRoylers](https://pixabay.com/sound-effects/film-special-effects-correct-356013/) - This sound effect is used when the user makes a good choice.

[Sound effect 4: Bad choice sound - u_8g40a9z0la](https://pixabay.com/sound-effects/film-special-effects-fail-234710/) - This sound effect is used when the user makes a bad choice.

[Sound effect 5: Sidequest start - KoiRoylers](https://pixabay.com/sound-effects/film-special-effects-uplifting-sound-356041/) - This sound effect is used for starting sidequests.

[Sound effect 6: Heartbeat sound - THE FOUNDATION](https://motionarray.com/browse/producer/thefoundation/) - This sound effect is used when glucose levels are low.

[Sound effect 7: Time runs out sound - @TimersAndMore](https://youtube.com/shorts/z75hOoKbO3A?si=GnExwYITalC-krkM) - This sound effect is used when the time is run out.

[Sound effect 8: Game win sound - Tuudurt (Freesound)](https://pixabay.com/sound-effects/musical-level-win-6416/) - This sound effect is used when the game is won.

[Sound effect 9: Game over sound - Alphix](https://pixabay.com/sound-effects/musical-game-over-417465/) - This sound effect is used when the game is over.

[Sound effect 10: Message sent sound - Son_duquotidient](https://pixabay.com/sound-effects/film-special-effects-message-envoy%C3%A9-iphone-apple-391098/) - This sound effect is used when a message is sent on the phone.

[Sound effect 11: Message received sound - u_yvnlj1gu1b](https://pixabay.com/sound-effects/technology-whatsapp-460912/) - This sound effect is used when a message is received on the phone.

## Made by:
- **Stef Van Boven** - [GitHub](https://github.com/pgm-stefvanboven) als opdracht voor de opleiding **Expert Track: Interactive Media Development** aan **Arteveldehogeschool**.