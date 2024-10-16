const weatherDescriptions = {
    "0": ["Unknown", "Unknown"],
    "1000": ["Images/Weather_Symbols_for_Weather_Codes/clear_day.svg", "Clear"],
    "1100": ["Images/Weather_Symbols_for_Weather_Codes/mostly_clear_day.svg", "Mostly Clear"],
    "1101": ["Images/Weather_Symbols_for_Weather_Codes/partly_cloudy_day.svg", "Partly Cloudy"],
    "1102": ["Images/Weather_Symbols_for_Weather_Codes/mostly_cloudy.svg", "Mostly Cloudy"],
    "1001": ["Images/Weather_Symbols_for_Weather_Codes/cloudy.svg", "Cloudy"],
    "2000": ["Images/Weather_Symbols_for_Weather_Codes/fog.svg", "Fog"],
    "2100": ["Images/Weather_Symbols_for_Weather_Codes/fog_light.svg", "Light Fog"],
    "4000": ["Images/Weather_Symbols_for_Weather_Codes/drizzle.svg", "Drizzle"],
    "4001": ["Images/Weather_Symbols_for_Weather_Codes/rain.svg", "Rain"],
    "4200": ["Images/Weather_Symbols_for_Weather_Codes/rain_light.svg", "Light Rain"],
    "4201": ["Images/Weather_Symbols_for_Weather_Codes/rain_heavy.svg", "Heavy Rain"],
    "5000": ["Images/Weather_Symbols_for_Weather_Codes/snow.svg", "Snow"],
    "5001": ["Images/Weather_Symbols_for_Weather_Codes/flurries.svg", "Flurries"],
    "5100": ["Images/Weather_Symbols_for_Weather_Codes/snow_light.svg", "Light Snow"],
    "5101": ["Images/Weather_Symbols_for_Weather_Codes/snow_heavy.svg", "Heavy Snow"],
    "6000": ["Images/Weather_Symbols_for_Weather_Codes/freezing_drizzle.svg", "Freezing Drizzle"],
    "6001": ["Images/Weather_Symbols_for_Weather_Codes/freezing_rain.svg", "Freezing Rain"],
    "6200": ["Images/Weather_Symbols_for_Weather_Codes/freezing_rain_light.svg", "Light Freezing Rain"],
    "6201": ["Images/Weather_Symbols_for_Weather_Codes/freezing_rain_heavy.svg", "Heavy Freezing Rain"],
    "7000": ["Images/Weather_Symbols_for_Weather_Codes/ice_pellets.svg", "Ice Pellets"],
    "7101": ["Images/Weather_Symbols_for_Weather_Codes/ice_pellets_heavy.svg", "Heavy Ice Pellets"],
    "7102": ["Images/Weather_Symbols_for_Weather_Codes/ice_pellets_light.svg", "Light Ice Pellets"],
    "8000": ["Images/Weather_Symbols_for_Weather_Codes/tstorm.svg", "Thunderstorm"]
}

const precipitationType = {
    "0" : "N/A",
    "1" : "Rain",
    "2" : "Snow",
    "3" : "Freezing Rain",
    "4" : "Ice Pellets / Sleet"
}

// Get the checkbox and the required fields
const useIpLocationCheckbox = document.getElementById('useIpLocation');
const streetInput = document.getElementById('street');
const cityInput = document.getElementById('city');
const stateSelect = document.getElementById('state');

useIpLocationCheckbox.checked = false;
// Toggle required attributes based on checkbox state
useIpLocationCheckbox.addEventListener('change', () => {
    if (useIpLocationCheckbox.checked) {
        streetInput.removeAttribute('required');
        cityInput.removeAttribute('required');
        stateSelect.removeAttribute('required');
    } else {
        streetInput.setAttribute('required', true);
        cityInput.setAttribute('required', true);
        stateSelect.setAttribute('required', true);
    }
});

document.getElementById('searchForm').addEventListener('reset', () => {
    document.getElementById('weather-results').style.display = 'none';
    document.getElementById('daily-weather-details').style.display = 'none';
    document.getElementById('chart-container').style.display = 'none';
    document.getElementById('error-page').style.display = 'none';
})

document.getElementById('searchForm').addEventListener('submit', async function(event) {
    event.preventDefault(); // Prevent the default form submission

    console.log("Form submitted"); // DEBUG

    const street = document.getElementById('street').value;
    const city = document.getElementById('city').value;
    const state = document.getElementById('state').value;
    console.log({street, city, state}); // DEBUG

    const fullAddress = `${street}, ${city}, ${state}`;
    const cityAddress = `${city}, ${state}`;
    const googleApiKey = 'AIzaSyDbasOcZDCiDeWHUM0BjwaiyY-fLK3OQg8';

    const useIpLocation = document.getElementById('useIpLocation').checked; // Check if the checkbox is checked
    let lat, lng, formatted_address;

    if (useIpLocation) {
        console.log("Fetching location from IP...");  // DEBUG

        // Fetch IP information from IPInfo.io
        const ipInfoResponse = await fetch('https://ipinfo.io/?token=47a62836d8882a');
        const ipInfoData = await ipInfoResponse.json();

        if (ipInfoData.loc) {
            const [userLat, userLng] = ipInfoData.loc.split(',');
            lat = userLat;
            lng = userLng;
            formatted_address = `${ipInfoData.city}, ${ipInfoData.region}`;
            console.log(`IP Info Location - Latitude: ${lat}, Longitude: ${lng}`);
        } 
        else {
            console.error('Location information not found in IP data');
        }
    }
    else {
        console.log("Fetching location from address...");  // DEBUG
        let geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${googleApiKey}`;
        let geocodeResponse = await fetch(geocodeUrl);
        let geocodeData = await geocodeResponse.json();
        let partialMatch = geocodeData.results[0].partial_match || false;

        if (partialMatch) {
            console.log("Fetching location from state...");  // DEBUG
            const components = `administrative_area:${state}`;
            geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(state)}&components=${components}&key=${googleApiKey}`;
            geocodeResponse = await fetch(geocodeUrl);
            geocodeData = await geocodeResponse.json();
        }
        
        const location = geocodeData.results[0].geometry.location;
        formatted_address = geocodeData.results[0].formatted_address;
        console.log({formatted_address});
        lat = location.lat;
        lng = location.lng;
        console.log(`Latitude: ${lat}, Longitude: ${lng}`);

    }
    
    // Make a fetch request to the backend to get weather data
    const response = await fetch('http://127.0.0.1:5000/get_weather', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({lat, lng}),
    });

    // Parse the JSON response
    const data = await response.json();

    console.log(response);

    if (!data.data) {
        console.error("HTTP error", response.status);
        showErrorPage();
        return;
    }

    populateTodaysWeather(data.data.timelines[0].intervals[0].values, formatted_address);
    populateWeeksWeather(data.data.timelines[0].intervals, lat, lng);
});




function populateTodaysWeather(todaysWeatherData, formatted_address) {

    document.getElementById('weather-results').style.display = 'block';
    document.getElementById('address').innerHTML = `<p><span style="font-size: 28px; font-weight: light;">${formatted_address}</span></p>`;
    document.getElementById('todays-weather-code-temperature').innerHTML = `
        <div id="todays-weather-code">
            <img src="${getWeatherCodeImg(todaysWeatherData.weatherCode)}" alt="Cloud Cover" style="width: 100px; height: 100px;">
            <p style="text-align: center; font-size: 40px; color: #3d4146;">${weatherDescriptions[todaysWeatherData.weatherCode][1]}</p>
        </div>
        <p style="font-size: 140px; color: gray;">${Math.round(todaysWeatherData.temperature)}°</p>
    `;

    const weatherFields = [
        {label: "Humidity", value: `${todaysWeatherData.humidity}%`, imgSrc: "Images/humidity.png"},
        {label: "Pressure", value: `${todaysWeatherData.pressureSeaLevel}inHg`, imgSrc: "Images/Pressure.png"},
        {label: "Wind Speed", value: `${todaysWeatherData.windSpeed}mph`, imgSrc: "Images/Wind_Speed.png"},
        {label: "Visibility", value: `${todaysWeatherData.visibility}mi`, imgSrc: "Images/Visibility.png"},
        {label: "Cloud Cover", value: `${todaysWeatherData.cloudCover}%`, imgSrc: "Images/Cloud_Cover.png"},
        {label: "UV Level", value: todaysWeatherData.uvIndex, imgSrc: "Images/UV_Level.png"}
    ];

    const container = document.getElementById('todays-other-fields');
    container.innerHTML = '';
    weatherFields.forEach(field => {
        const fieldDiv = document.createElement('div');
        fieldDiv.className = 'todays-field';
        fieldDiv.innerHTML = `
            <span class="field-label">${field.label}</span>
            <img src="${field.imgSrc}" alt="${field.label}" style="width: 50px; height: 50px">
            <span class="todays-${field.label.toLowerCase().replace(' ', '-')}" >${field.value}</span>
        `;
        container.appendChild(fieldDiv);
    });
}

function populateWeeksWeather(weatherData, lat, lng) {

    const weeksWeatherBody = document.getElementById('weeks-weather-body');
    weeksWeatherBody.innerHTML = ''; // Clear existing content

    const weeksWeather = weatherData;
    weeksWeather.forEach(interval => {
        const intervalValues = interval.values;
        const weatherStatus = getWeatherCodeImg(intervalValues.weatherCode);
        const dateObject = new Date(interval.startTime.substring(0, 10));
        
        // Format date per spec
        const weekday = dateObject.toLocaleDateString('en-US', { weekday: 'long' });
        const day = dateObject.toLocaleDateString('en-US', { day: 'numeric' });
        const month = dateObject.toLocaleDateString('en-US', { month: 'short' });
        const year = dateObject.toLocaleDateString('en-US', { year: 'numeric' });
        const date = `${weekday}, ${day} ${month} ${year}`;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${date}</td>
            <td><img src="${getWeatherCodeImg(intervalValues.weatherCode)}" alt="${weatherStatus.status}"> ${weatherDescriptions[intervalValues.weatherCode][1]}</td>
            <td>${intervalValues.temperatureMax.toFixed(1)}</td>
            <td>${intervalValues.temperatureMin.toFixed(1)}</td>
            <td>${intervalValues.windSpeed.toFixed(1)}</td>
        `;

        row.addEventListener('click', () => populateDailyWeather(interval, weatherData, lat, lng));
        weeksWeatherBody.appendChild(row);
    });
}

function populateDailyWeather(interval, weatherData, lat, lng) {

    document.getElementById('weather-results').style.display = 'none';

    // Format date per spec
    const dateObject = new Date(interval.startTime.substring(0, 10));    
    const weekday = dateObject.toLocaleDateString('en-US', { weekday: 'long' });
    const day = dateObject.toLocaleDateString('en-US', { day: 'numeric' });
    const month = dateObject.toLocaleDateString('en-US', { month: 'short' });
    const year = dateObject.toLocaleDateString('en-US', { year: 'numeric' });
    const date = `${weekday}, ${day} ${month} ${year}`;
    const sunriseTime = new Date(interval.values.sunriseTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }).replace(/\s([AP]M)$/, '$1');
    const sunsetTime = new Date(interval.values.sunsetTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }).replace(/\s([AP]M)$/, '$1');


    const dailyWeatherDetails = document.getElementById('daily-weather-details');
    dailyWeatherDetails.style.display = 'block';
    dailyWeatherDetails.innerHTML = `
    <div class="daily-weather-details">
        <p><span style="font-size: 36px; font-weight: light;">Daily Weather Details</span></p>
        <hr class="daily-weather-details-hr">
    </div>
    <div class="weather-card" style="display: block;">
        <div class="weather-header">
            <div class="weather-header-left">
                <p>${date}</p>
                <p>${weatherDescriptions[interval.values.weatherCode][1]}</p>
                <p>${interval.values.temperatureMax}°F / ${interval.values.temperatureMin}°F</p>
            </div>
            <img src="${getWeatherCodeImg(interval.values.weatherCode)}" alt="Weather Icon">
        </div>
        <div class="weather-details">
            <div class="weather-details-left">
                <p>Precipitation:</p>
                <p>Chance of Rain:</p>
                <p>Wind Speed:</p>
                <p>Humidity:</p>
                <p>Visibility:</p>
                <p>Sunrise/Sunset:</p>
            </div>
            <div class="weather-details-right">
                <p>${precipitationType[interval.values.precipitationType]}</p>
                <p>${interval.values.precipitationProbability}%</p>
                <p>${interval.values.windSpeed} mph</p>
                <p>${interval.values.humidity}%</p>
                <p>${interval.values.visibility} mi</p>
                <p>${sunriseTime}/${sunsetTime}</p>
            </div>
        </div>
    </div>
    <div class="weather-charts-header">
        <p><span style="font-size: 36px; font-weight: light;">Weather Charts</span></p>
        <hr class="weather-charts-hr">
        <div id="weather-charts-caret" class="caret" style="font-weight: bold; font-size: 24px; cursor: pointer;">&or;</div>
    </div>
    `;

    const caret = document.getElementById('weather-charts-caret');
    const chartContainer = document.getElementById('chart-container');
    caret.addEventListener('click', () => {
        if (chartContainer.style.display === 'none' || chartContainer.style.display === '') {
            console.log('Showing weather charts');
            // Show charts and change caret to downward
            chartContainer.style.display = 'flex';
            caret.innerHTML = '&and;';
            generateWeatherCharts(weatherData, lat, lng);
        } else {
            console.log('Hiding weather charts');
            // Hide charts and change caret to upward
            chartContainer.style.display = 'none';
            caret.innerHTML = '&or;';
        }
    });
}

function generateWeatherCharts(weatherData, lat, lng) {

    document.getElementById('weather-charts-caret').innerHTML = '&and;';
    document.getElementById('chart-container').style.display = 'flex';
    const dates = [];
    const temperatureRanges = [];

    // Extract data from weatherData
    weatherData.forEach(interval => {
        const date = new Date(interval.startTime).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
        dates.push(date);

        const maxTemp = interval.values.temperatureMax || null;
        const minTemp = interval.values.temperatureMin || null;

        temperatureRanges.push([minTemp, maxTemp]);
    });

    // Generate Highcharts plot
    Highcharts.chart('temperature-chart', {
        chart: {
            type: 'arearange'
        },
        title: {
            text: 'Temperature Ranges (Min, Max)'
        },
        xAxis: {
            categories: dates,
            title: {
                text: null
            },
            min: 0.5,               // Change these two to get proper edge margin
            max: dates.length-1.5,  // Change these two to get proper edge margin
            startOnTick: false,
            endOnTick: false,
            tickWidth: 1,
            tickLength: 8,
            tickmarkPlacement: 'on'
        },
        yAxis: {
            title: {
                text: null
            }
        },
        tooltip: {
            shared: true,
            crosshairs: true,
            valueSuffix: '°F',
            formatter: function () {
                const pointIndex = this.points[0].point.index;

                // Format dates per spec
                const currentDate = new Date(weatherData[pointIndex].startTime);
                const formattedDate = currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    
                return `${formattedDate}<br/><span style="color:${this.points[0].series.color}">\u25CF</span> Temperatures: <b>${this.points[0].point.low}°F - ${this.points[0].point.high}°F</b>`;
            }
        },
        legend: {
            enabled: false
        },
        series: [{
            data: temperatureRanges,
            fillColor: {
                linearGradient: {
                    x1: 0,
                    y1: 0,
                    x2: 0,
                    y2: 1
                },
                stops: [
                    [0, '#ffa500'],
                    [0.75, '#add8e6']  // Starting blue graident at 75%
                ]
            },
            color: '#ffa500', // Line color
            lineWidth: 2,
            marker: {
                fillColor: '#2ba5f9', // Marker color
                lineWidth: 2,
                lineColor: '#2ba5f9'
            }
        }]
    });

    generateHourlyWeather(lat, lng);
}

async function generateHourlyWeather(lat, lng) {

    const hourlyResponse = await fetch('http://127.0.0.1:5000/get_hourly_weather', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({lat, lng}),
    });

    // Parse the JSON response
    const hourlyWeatherData = await hourlyResponse.json();

    if (!hourlyWeatherData.data) {
        console.error("HTTP error", response.status);
        showErrorPage();
        return;
    }

    // Extract data from hourlyWeatherData
    const intervals = hourlyWeatherData.data.timelines[0].intervals;

    // Initialize arrays
    const temperature = [];
    const humidity = [];
    const pressure = [];
    const windBarbs = [];
    const timeCategories = []; // Time for the bottom x-axis
    const dateLabels = []; // Dates for the top x-axis

    // Populate the arrays with data from each interval
    intervals.forEach((interval, index) => {
        const time = new Date(interval.startTime);
        const hours = time.getUTCHours();  // Converting time into UTC
    
        // Extract formatted date and time
        const formattedDate = Highcharts.dateFormat('%a %b %e', time);
        const formattedTime = Highcharts.dateFormat('%H', time);
    
        // Starting data collection at next day (00:00)
        if (hours === 0 || timeCategories.length > 0) {
            timeCategories.push(formattedTime);
            dateLabels.push(formattedDate);
            temperature.push(Math.round(interval.values.temperature));
            humidity.push(Math.round(interval.values.humidity));
            pressure.push(Math.round(interval.values.pressureSeaLevel));
    
            // Only showing every other wind barb to reduce clutter
            if (index % 2 === 0) {
                windBarbs.push({
                    value: interval.values.windSpeed,
                    direction: interval.values.windDirection
                });
            } else {
                windBarbs.push(null);
            }
        }
    });

    // Generate Highcharts chart
    Highcharts.chart('hourly-weather', {
        chart: {
            zoomType: 'x',
            alignTicks: false
        },
        title: {
            text: 'Hourly Weather (For Next 5 Days)'
        },
        xAxis: [{
            categories: timeCategories,
            crosshair: true,
            offset: 22,
            tickInterval: 6,
            tickWidth: 1,
            tickLength: 5,
            tickPosition: 'inside',
            gridLineWidth: 0,
            minorGridLineWidth: 0.5,
            minorGridLineColor: '#d0d0d0',
            minorTickInterval: 0.5,
            minorTicks: true,
            plotLines: intervals.slice(0, -1).map((interval, index) => ({
                color: '#e0e0e0',
                width: 1,
                value: index + 0.5,
                zIndex: -1 // Place the lines behind other elements
            }))
        }, {
            linkedTo: 0,
            categories: dateLabels,
            tickInterval: 24,
            tickWidth: 1,
            tickLength: 10,
            opposite: true,
            labels: {
                x: 34, // Offset date labels
            },
        }],
        
        yAxis: [{
            labels: {
                format: '{value}°',
                style: {
                    color: '#000000'
                },
                x: -2  // Changes temperature y-axis horizontal position
            },
            title: null,
            tickInterval: 7,
            gridLineWidth: 1,
            gridLineColor: '#e0e0e0'
        }, {
            gridLineWidth: 0,
            title: {
                text: 'inHg',
                align: 'high', // Align to the top
                offset: 0,
                rotation: 0, // No rotation (horizontal)
                x: 2,
                y: 0, // Adjusts air pressure label vertical position
                style: {
                    color: '#f1ba68',
                }
            },
            labels: {
                format: '{value}',
                style: {
                    color: '#f1ba68',
                    fontSize: '10px'
                },
                x: 2    // Adjusts air pressure y-axis horizontal position
            },
            opposite: true,
            tickInterval: 0.5,
            endOnTick: false,
            startOnTick: false
        }],
        tooltip: {
            shared: true,
            useHTML: true,
            formatter: function () {
                const pointIndex = this.points[0].point.index;
        
                // Format date per spec
                const time = new Date(hourlyWeatherData.data.timelines[0].intervals[pointIndex].startTime);
                const pointDate = Highcharts.dateFormat('%A', time);
                const pointDay = Highcharts.dateFormat('%e', time);
                const pointMonth = Highcharts.dateFormat('%b', time);
                const pointTime = Highcharts.dateFormat('%H:%M', time);

        
                let tooltipText = `${pointDate}, ${pointDay} ${pointMonth}, ${pointTime}<br/>`;
        
                this.points.forEach(point => {
                    // Wind data needs to be handled separately
                    if (point.series.name === 'Wind') {
                        const windData = point.point;
                        tooltipText += `<span style="color:${point.series.color}">\u25CF</span> Wind: <b>${windData.value} mph</b> (${getWindDescriptor(windData.value)})<br/>`;
                    } else {
                        tooltipText += `<span style="color:${point.series.color}">\u25CF</span> ${point.series.name}: <b>${point.y} ${point.series.tooltipOptions.valueSuffix || ''}</b><br/>`;
                    }
                });
                return tooltipText;
            }
        },
        legend: {
            enabled: false
        },
        series: [{
            name: 'Humidity',
            type: 'column',
            pointWidth: 5,
            data: humidity,
            tooltip: {
                valueSuffix: '%'
            },
            dataLabels: {
                enabled: true,
                inside: false,
                formatter: function() {
                    return this.point.index % 2 === 0 ? this.y : null;   // Only display every other value to reduce clutter
                },
                style: {
                    fontSize: '7px',
                    color: '#000000',
                    fontWeight: 'bold'
                },
                align: 'center',
            }
        }, {
            name: 'Air Pressure',
            type: 'spline',
            yAxis: 1,
            data: pressure,
            color: '#f1ba68',
            marker: {
                enabled: false
            },
            dashStyle: 'shortdot',
            tooltip: {
                valueSuffix: ' inHg'
            },
        }, {
            name: 'Temperature',
            type: 'spline',
            data: temperature,
            color: 'red',
            tooltip: {
                valueSuffix: ' °F'
            }
        }, {
            name: 'Wind',
            type: 'windbarb',
            data: windBarbs,
            yOffset: -12, // Positioning wind barbs above the x-axis
            vectorLength: 8, // Reduce wind barb size to reduce clutter
            color: 'blue',
            tooltip: {
                valueSuffix: ' mph'
            }
        }]
    });
}




function getWeatherCodeImg(weatherCode) {
    if (weatherDescriptions.hasOwnProperty(weatherCode)) {
        return weatherDescriptions[weatherCode][0];
    } else {
        return "Weather code not found";
    }
}

function getWindDescriptor(speed) {
    if (speed < 4) return "Calm";
    if (speed < 8) return "Light breeze";
    if (speed < 12) return "Moderate breeze";
    if (speed < 20) return "Fresh breeze";
    if (speed < 28) return "Strong breeze";
    if (speed < 38) return "Near gale";
    if (speed < 50) return "Gale";
    return "Strong gale";
}

function showErrorPage() {
    document.getElementById('error-page').style.display = 'flex';
    document.getElementById('weather-results').style.display = 'none';
    document.getElementById('daily-weather-details').style.display = 'none';
    document.getElementById('chart-container').style.display = 'none';
}