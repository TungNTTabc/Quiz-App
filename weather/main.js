const apiKey = "48ccd4b3751898cec3318bc75a64a819";
const apiUrl = "https://api.openweathermap.org/data/2.5/weather?units=metric&q=";
const searchBox = document.querySelector(".search input");
const searchBnt = document.querySelector(".search button");
const weatherIcon = document.querySelector(".weather-icon")
async function checkWeather(city) {
    const response = await fetch(apiUrl + city + `&appid=${apiKey}`);
    if (response.status == 404) {
        document.querySelector(".error").style.display = "block";
        document.querySelector(".weather").style.display = "none";
    } else {
        var data = await response.json();
        console.log(data);
        document.querySelector(".city").innerHTML = data.name;
        document.querySelector(".temp").innerHTML = Math.round(data.main.temp) + '°C';
        document.querySelector(".humidity").innerHTML = data.main.humidity + '%';
        document.querySelector(".wind").innerHTML = data.wind.speed + 'km/h';
        if (data.weather[0].main == "Clouds") {
            weatherIcon.className = "fa-solid fa-cloud weather-icon";
        } else if (data.weather[0].main == "Clear") {
            weatherIcon.className = "fa-solid fa-sun weather-icon";
        } else if (data.weather[0].main == "Rain") {
            weatherIcon.className = "fa-solid fa-cloud-rain weather-icon";
        } else if (data.weather[0].main == "Mist") {
            weatherIcon.className = "fa-solid fa-cloud-sun weather-icon";
        } else if (data.weather[0].main == "Snow") {
            weatherIcon.className = "fa-solid fa-snowflake weather-icon";
        } else {weatherIcon.className = "fa-solid fa-cloud-sun-rain weather-icon";}
        document.querySelector(".weather").style.display = "block";
        document.querySelector(".error").style.display = "none";
    }
}
searchBnt.addEventListener("click", ()=>{
    checkWeather(searchBox.value);
})