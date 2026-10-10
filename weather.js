async function getWeather(){

let city=document.getElementById("city").value;

let api="YOUR_API_KEY";

let url=`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${api}&units=metric`;

let response=await fetch(url);

let data=await response.json();

document.getElementById("result").innerHTML=`

<h2>${data.name}</h2>

<p>🌡 Temperature : ${data.main.temp} °C</p>

<p>💧 Humidity : ${data.main.humidity}%</p>

<p>☁ Weather : ${data.weather[0].description}</p>

`;

}