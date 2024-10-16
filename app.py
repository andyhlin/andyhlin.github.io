from flask import Flask, request, jsonify, render_template
import requests
from flask_cors import CORS, cross_origin

app = Flask(__name__)

API_KEY = 'XcJTf6drywlTTJwqCvsb5fJsdwSHdkvq'
CORS(app, resources={r"/*": {"origins": "*"}})

@app.route('/')
def index():
    return "Welcome to the Weather App API!" # DEBUG

@app.route('/get_weather', methods=['POST'])
def get_weather():

    print("Received request for weather data")
    data = request.json
    lat = data.get('lat')
    lng = data.get('lng')

    if not lat or not lng:
        return jsonify({"error": "Latitude and Longitude are required"}), 400

    # Tomorrow.io API request
    oneDayParameters = "temperature,temperatureApparent,temperatureMin,temperatureMax,windSpeed,windDirection,humidity,pressureSeaLevel,uvIndex,weatherCode,precipitationProbability,precipitationType,sunriseTime,sunsetTime,visibility,moonPhase,cloudCover"
    url = f'https://api.tomorrow.io/v4/timelines?location={lat},{lng}&fields={oneDayParameters}&timesteps=1d&units=imperial&timezone=America/Los_Angeles&apikey={API_KEY}'


    weather_response = requests.get(url)
    weather_data = weather_response.json()

    # Return the raw JSON back to the client
    return jsonify(weather_data)

@app.route('/get_hourly_weather', methods=['POST'])
def get_hourly_weather():

    print("Received request for weather data")
    data = request.json
    lat = data.get('lat')
    lng = data.get('lng')

    if not lat or not lng:
        return jsonify({"error": "Latitude and Longitude are required"}), 400

    # Tomorrow.io API request
    oneDayParameters = "temperature,temperatureApparent,temperatureMin,temperatureMax,windSpeed,windDirection,humidity,pressureSeaLevel,uvIndex,weatherCode,visibility,cloudCover"
    url = f'https://api.tomorrow.io/v4/timelines?location={lat},{lng}&fields={oneDayParameters}&timesteps=1h&units=imperial&timezone=America/Los_Angeles&apikey={API_KEY}'


    weather_response = requests.get(url)
    weather_data = weather_response.json()
    print(weather_data)

    # Return the raw JSON back to the client
    return jsonify(weather_data)

if __name__ == '__main__':
    app.run(debug=True)
