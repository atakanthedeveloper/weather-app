
let apiKey = "09f747bd16e5050cff0d00ffe652d363";
let daysOfTheWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
let debounceTimer;
let selectedCityText;
let selectedCity;

function createCityAndWeatherInfoAfterSearch(selectedCityInfo) {
    const cityAndApiHeaderInfo = {
        cityName : selectedCityInfo.name,
        units : "metric"
    };

    return cityAndApiHeaderInfo;
}

function loadCitySectionData (temp, tempMin, tempMax, description, cityName) {
    let citySection = document.getElementById("city-info-section");
    let tempFixed = temp.toFixed(0);
    if(tempFixed == "-0")
        tempFixed = 0;
    citySection.innerHTML = 
        `<h1>${cityName}</h1>
        <p class="temp">${tempFixed}°C</p>
        <p class="description">${description}</p>
        <p class="min-max-temp">Low: ${tempMin}°C | High: ${tempMax}°C</p>`;
}

function loadFiveDaysSectionData(data) {
  const hourlySectionContainer = document.getElementById("hourly-forecast-section");
  hourlySectionContainer.innerHTML = "";

  for (let hour of data.list) {
    const temp = hour.main.temp;
    const icon = hour.weather[0].icon;
    const dt_txt = hour.dt_txt;
    const time = dt_txt.split(" ")[1].slice(0, 5);
    let tempFixed = temp.toFixed(0);
    if(tempFixed == "-0")
        tempFixed = 0;
    hourlySectionContainer.innerHTML += 
      `<div class="hourly-cards">
          <h3>${time}</h3>
          <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="">
          <p>${tempFixed}°C</p>
       </div>`;
  }
}


function loadFeelsAndHumidity (data) {
    let feelSection = document.getElementById("feel-temp");
    let humiditySection = document.getElementById("humidity-percentage-value");
    feelSection.textContent = `${data.main.feels_like.toFixed(1)}°C`;
    humiditySection.textContent = `${data.main.humidity}%`;

}

let loadFiveDays = (data)=> {
    let dayWiseForecast = calculateDayWiseForecast(data.list);
    let fiveDaysCards = document.getElementById("five-day-fourcast-card-container");
    fiveDaysCards.innerHTML = "";
    for (let [day, info] of dayWiseForecast) {
    fiveDaysCards.innerHTML += `
      <div class="five-days-cards">
        <h3>${day}</h3>
        <img src="https://openweathermap.org/img/wn/${info.icon}@2x.png" alt="">
        <p class="low"><b>${info.temp_min.toFixed(1)}°C</b></p>
        <p class="high"><b>${info.temp_max.toFixed(1)}°C</b></p>
      </div>
    `;
  }
    

}

function calculateDayWiseForecast(data) {
  let foreCastDays = new Map();

  for (let foreCast of data) {
    let dayOfTheForeCast = daysOfTheWeek[new Date(foreCast.dt * 1000).getDay()];

    if (foreCastDays.has(dayOfTheForeCast)) {
      let valueOfTheDay = foreCastDays.get(dayOfTheForeCast);
      valueOfTheDay.push(foreCast);
      foreCastDays.set(dayOfTheForeCast, valueOfTheDay);
    } else {
      foreCastDays.set(dayOfTheForeCast, [foreCast]);
    }
  }

  for (let [key, value] of foreCastDays) {
    let temp_min = Math.min(...value.map(v => v.main.temp_min));
    let temp_max = Math.max(...value.map(v => v.main.temp_max));
    let icon = value.find(v => v.weather && v.weather[0])?.weather[0].icon;
    foreCastDays.set(key, { temp_min, temp_max, icon, day: key });
  }

  return foreCastDays;
}

async function getCitySectionWeatherInfoWithSearch(selectedCityInfo) {

    try{
        let requestData = createCityAndWeatherInfoAfterSearch(selectedCityInfo);
        let citySectionResponse = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${requestData.cityName}&appid=${apiKey}&units=${requestData.units}`);
        let citySectionData = await citySectionResponse.json();
        return citySectionData;
    }
    catch(error) {
        return error;
    }
    
}

async function getFiveDaysWeatherInfoWithSearch(optionData) {

    try {
        let requestData = createCityAndWeatherInfoAfterSearch(optionData);
        let fiveDaysSectionResponse = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${requestData.cityName}&appid=${apiKey}&units=${requestData.units}`);
        let fiveDaysSectionData = await fiveDaysSectionResponse.json();
        return fiveDaysSectionData;
    }
    catch(error) {
        return error;
    }
    
}

async function getCitiesForSearch(searchText){
    if (searchText.trim().length < 2) return [];
    let response = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${searchText}&limit=5&appid=${apiKey}`);
    let data = await response.json();
    return data;

}

function loadFirstForecastInfoWithGeoLocation() {
   navigator.geolocation.getCurrentPosition(async (coordinates)=>{
   let lat = coordinates.coords.latitude;
   let lon = coordinates.coords.longitude;
   try {
        let response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}`);
        let optionData = await response.json();
        const currentWeatherData = await getCitySectionWeatherInfoWithSearch(optionData);
        const { temp, temp_min, temp_max } = currentWeatherData.main;
        const { description } = currentWeatherData.weather[0];
        const cityName = currentWeatherData.name;

        const fiveDaysWeatherData = await getFiveDaysWeatherInfoWithSearch(optionData);
        loadCitySectionData(temp, temp_min, temp_max, description, cityName);
        loadFiveDaysSectionData(fiveDaysWeatherData);
        loadFeelsAndHumidity(currentWeatherData);
        loadFiveDays(fiveDaysWeatherData);
   }
   catch(error) {
        return error;
   }
   
   }, error=>console.log(error));
}

async function onSearchChange(eventInfo) {
        clearTimeout(debounceTimer);
        let city = eventInfo.target.value;

        debounceTimer = setTimeout(async ()=>{
            let searchResult = await getCitiesForSearch(city);
            let option = document.getElementById("city-list");
            let options = "";
            let cityInfo; 
            for (let optionContent of searchResult) {
                const cityInfo = {
                    lat: optionContent.lat,
                    lon: optionContent.lon,
                    name: optionContent.name,
                    state: optionContent.state,
                    country: optionContent.country,
                };

                const displayText =
                    `${optionContent.name}` +
                    (optionContent.state ? `, ${optionContent.state}` : "") +
                    `, ${optionContent.country}`;

                options += `<option class="datalistOptions"
                                    data-city-info='${JSON.stringify(cityInfo)}'
                                    value="${displayText}"></option>`;
                }

            option.innerHTML = options;
        }, 700);
    }

async function handleCitySelection(eventInfo) {
  const selectedText = eventInfo.target.value;
  const datalist = document.getElementById("city-list");

  const matched = Array.from(datalist.options).find(o => o.value === selectedText);
  if (!matched) return;

  const optionData = JSON.parse(matched.getAttribute("data-city-info"));

  const currentWeatherData = await getCitySectionWeatherInfoWithSearch(optionData);
  const { temp, temp_min, temp_max } = currentWeatherData.main;
  const { description } = currentWeatherData.weather[0];
  const cityName = currentWeatherData.name;

  const fiveDaysWeatherData = await getFiveDaysWeatherInfoWithSearch(optionData);
  loadCitySectionData(temp, temp_min, temp_max, description, cityName);
  loadFiveDaysSectionData(fiveDaysWeatherData);
  loadFeelsAndHumidity(currentWeatherData);
  loadFiveDays(fiveDaysWeatherData);
}

document.addEventListener("DOMContentLoaded", async () => {
    let searchInput = document.getElementById("search-bar-input");
    searchInput.addEventListener("input", onSearchChange);
    searchInput.addEventListener("change", handleCitySelection);
    loadFirstForecastInfoWithGeoLocation();

});