const mainClock = document.getElementById('main-clock');

const timeDisplays = document.querySelectorAll('.twelve-hour-time');
const militaryTimeDisplays = document.querySelectorAll('.full-hour-time');
const utcTimeDisplays = document.querySelectorAll('.utc-twelve-hour-time');
const msDisplays = document.querySelectorAll('.ms');
const dateDisplays = document.querySelectorAll('.date');
const numericalDateDisplays = document.querySelectorAll('.numerical-date');
const timezoneDisplays = document.querySelectorAll('.timezone');
const ampmDisplays = document.querySelectorAll('.am-pm');
const utcAmpmDisplays = document.querySelectorAll('.utc-am-pm');
const unixDisplays = document.querySelectorAll('.unix');
const sunriseDisplays = document.querySelectorAll('.sunrise');
const sunsetDisplays = document.querySelectorAll('.sunset');
const solarNoonDisplays = document.querySelectorAll('.noon');
const dayLengthDisplays = document.querySelectorAll('.length');

const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function update() {
    requestAnimationFrame(update);

    let now = new Date();

    let formattedMinutes = `${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    let formattedTime24h = `${now.getHours()}:${formattedMinutes}`;
    let formattedTime12h = `${now.getHours() % 12}:${formattedMinutes}`;
    let formattedUTCMinutes = `${now.getUTCMinutes().toString().padStart(2, '0')}:${now.getUTCSeconds().toString().padStart(2, '0')}`;
    let formattedUTCTime24h = `${now.getUTCHours()}:${formattedUTCMinutes}`;
    let formattedUTCTime12h = `${now.getUTCHours() % 12}:${formattedUTCMinutes}`;
    let AmPm = now.getHours() < 12 ? "AM" : "PM";
    let UTCAmPm = now.getUTCHours() < 12 ? "AM" : "PM";
    let textDay = days[now.getDay()];
    let textMonth = months[now.getMonth()];

    timeDisplays.forEach((e) => {
        e.innerText = formattedTime12h;
    });

    utcTimeDisplays.forEach((e) => {
        e.innerText = formattedUTCTime12h;
    });

    militaryTimeDisplays.forEach((e) => {
        e.innerText = formattedTime24h;
    });

    msDisplays.forEach((e) => {
        e.innerText = `.${Math.floor(now.getMilliseconds() / 100)}`;
    });

    dateDisplays.forEach((e) => {
        e.innerText = `${textDay}, ${textMonth} ${now.getDate()}, ${now.getFullYear()}`;
    });

    numericalDateDisplays.forEach((e) => {
        e.innerText = `${now.getMonth()}/${now.getDate()}/${now.getFullYear()}`;
    });

    timezoneDisplays.forEach((e) => {
        e.innerText = Intl.DateTimeFormat().resolvedOptions().timeZone;
    });

    ampmDisplays.forEach((e) => {
        e.innerText = AmPm;
    });

    utcAmpmDisplays.forEach((e) => {
        e.innerText = UTCAmPm;
    });
    
    unixDisplays.forEach((e) => {
        e.innerText = Math.floor(Date.now() / 1000);
    });
    
    document.title = `${formattedTime12h} ${AmPm} • Clock App`;
}

requestAnimationFrame(update);


(async () => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // grab coordinates from IP for sunrise calculation
    const locate = await fetch("https://get.geojs.io/v1/ip/geo.json").then(r => r.json());
    const lat = parseFloat(locate.latitude);
    const lng = parseFloat(locate.longitude);

    const sun = await fetch(`https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lng}&formatted=0`).then(r => r.json());
    let sunrise = new Date(sun.results.sunrise);
    let sunset = new Date(sun.results.sunset);
    let noon = new Date(sun.results.solar_noon);
    let length = sun.results.day_length; // number of seconds
    let lengthHours = Math.floor(length / 3600);
    let lengthMinutes = Math.floor((length % 3600) / 60);
    let lengthSeconds = length % 60;
    let lengthString = `${lengthHours}:${lengthMinutes.toString().padStart(2, '0')}:${lengthSeconds.toString().padStart(2, '0')}`;

    sunriseDisplays.forEach((e) => {
        e.innerText = sunrise.toLocaleTimeString();
        e.classList.remove("loading");
    });
    
    sunsetDisplays.forEach((e) => {
        e.innerText = sunset.toLocaleTimeString();
        e.classList.remove("loading");
    });

    solarNoonDisplays.forEach((e) => {
        e.innerText = noon.toLocaleTimeString();
        e.classList.remove("loading");
    });
    
    dayLengthDisplays.forEach((e) => {
        e.innerText = lengthString;
        e.classList.remove("loading");
    });
})();