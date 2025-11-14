// elements that need specific selection
const mainClock = document.getElementById('main-clock');
const scheduleWidgetContent = document.querySelector('#schedule-clock .widget-content');
const scheduleOverlay = document.getElementById('schedule-overlay');
const blocksContainer = document.getElementById('blocks-container');
const setButton = document.getElementById('set-button');
const getButton = document.getElementById('get-button');

// all "displays": items with classes that allow it to be updated purely because of its class without extra code
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
const blockRemainingTimeDisplays = document.querySelectorAll('.block-remaining');
const scheduleRemainingTimeDisplays = document.querySelectorAll('.schedule-remaining');
const analogSvgDisplays = document.querySelectorAll('.analog-svg');
const localAnalogSvgDisplays = document.querySelectorAll('.local-analog-svg');
const utcAnalogSvgDisplays = document.querySelectorAll('.utc-analog-svg');
const daysOffDisplays = document.querySelectorAll('.days-off');

// index days of the week & months of the year
const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// blocks for the schedule widget
let blocks = [
    {
        name: "Homeroom",
        start: 9 * 60 + 15,
        end: 9 * 60 + 55,
    },
    {
        name: "Period 1",
        start: 10 * 60 + 0,
        end: 10 * 60 + 30,
    },
    {
        name: "Period 2",
        start: 10 * 60 + 35,
        end: 11 * 60 + 5,
    },
    {
        name: "Period 3",
        start: 11 * 60 + 10,
        end: 11 * 60 + 40,
    },
    {
        name: "Lunch",
        start: 11 * 60 + 43,
        end: 12 * 60 + 47,
    },
    {
        name: "Period 4",
        start: 12 * 60 + 50,
        end: (1 + 12) * 60 + 20,
    },
    {
        name: "Period 5",
        start: (1 + 12) * 60 + 25,
        end: (1 + 12) * 60 + 55,
    },
    {
        name: "Period 6",
        start: (2 + 12) * 60 + 0,
        end: (2 + 12) * 60 + 30,
    }
];

const ENUM = {
    DAYOFF: 't-day-off',
    HALFDAY: 't-half-day',
}

let daysOff = [];

/**
 * parse the time into a string with h:mm; ex: 540 -> 9:00
 * 
 * uses 12h clock, not 24
 * @param {number} mins 
 * @returns parsed time as a string
 */
function parseTimeToHM(mins) {
    return `${Math.floor(mins / 60 + 11) % 12 + 1}:${(mins % 60).toString().padStart(2, '0')}`;
}

/**
 * parse the time into a string with mm:ss; ex: 5 -> 5:00
 * 
 * @param {number} mins 
 * @returns parsed time as a string
 */
function parseTimeToMS(mins) {
    return `${Math.floor(mins % 60)}:${Math.floor(mins % 1 * 60).toString().padStart(2, '0')}`;
}

/**
 * parse the time into a string with h:mm:ss; ex: 540.00 -> 9:00:00
 * 
 * @param {number} mins 
 * @returns parsed time as a string
 */
function parseTimeToHMS(mins) {
    mins = Math.max(mins, 0);
    return `${Math.floor(mins / 60)}:${Math.floor(mins % 60).toString().padStart(2, '0')}:${Math.floor(mins % 1 * 60).toString().padStart(2, '0')}`;
}

/**
 * create a block in the schedule widget
 * @param {boolean} isPeriod 
 * @param {number} start 
 * @param {number} end 
 * @param {string} name 
 */
function createBlock(isPeriod, start, end, name) {
    let len = end - start;
    
    const block = document.createElement('div');
    const inner = document.createElement('div');
    
    block.classList.add('block');
    block.setAttribute('style', `--flex-weight: ${len};`)
    
    inner.classList.add('block-inner');
    
    if (isPeriod) {
        const times = document.createElement('div');
        const _name = document.createElement('span');
        const _start = document.createElement('span');
        const _end = document.createElement('span');
        const sep = document.createElement('span');
        
        times.classList.add('block-times');
        block.classList.add('period-block');

        _name.classList.add('block-name');
        _name.innerText = name;
        
        _start.classList.add('block-start-time');
        _start.innerText = parseTimeToHM(start);
        
        _end.classList.add('block-end-time');
        _end.innerText = parseTimeToHM(end);

        sep.innerText = ' - '
        
        times.append(_start, sep, _end);
        inner.append(_name, times);
        block.appendChild(inner);
    } else { // dont have to do all the stuff above
        block.classList.add('break-block');
    }

    blocksContainer.appendChild(block);
}

function createDayOff(d, c) {
    const day = document.createElement('div');
    day.innerText = d.name;
    day.classList.add('day-off');
    day.classList.add(d.type);

    const date = document.createElement('span');
    date.classList.add('day-off-date');
    
    if (d.date)
        date.innerText = d.date.toLocaleDateString();
    else if (d.startDate && d.endDate)
        date.innerText = d.startDate.toLocaleDateString() + ' - ' + d.endDate.toLocaleDateString();

    day.appendChild(date);
    c.appendChild(day);
}

/**
 * update an analog clock
 * @param {HTMLDivElement} clock the analog clock to update
 * @param {number} time the time in seconds
 */
function updateAnalog(clock, time) {
    let hourHand = clock.querySelector('.hand.hour');
    let minuteHand = clock.querySelector('.hand.minute');
    let secondHand = clock.querySelector('.hand.second');

    let hourHandLength = 60;
    let minuteHandLength = 90;
    let secondHandLength = 100;

    let hourHandExtLength = hourHandLength * 1/3;
    let minuteHandExtLength = minuteHandLength * 1/3;
    let secondHandExtLength = secondHandLength * 1/3;

    let hours = (time / (60 * 60) + 11) % 12 + 1;
    let minutes = time / 60;
    let seconds = time % 60;

    let hourAngle = (hours / 12) * Math.PI * 2 - Math.PI / 2;
    let minutesAngle = (minutes / 60) * Math.PI * 2 - Math.PI / 2;
    let secondsAngle = (seconds / 60) * Math.PI * 2 - Math.PI / 2;

    hourHand.setAttribute('x1', Math.cos(hourAngle - Math.PI) * hourHandExtLength + 150);
    hourHand.setAttribute('y1', Math.sin(hourAngle - Math.PI) * hourHandExtLength + 150);
    hourHand.setAttribute('x2', Math.cos(hourAngle) * hourHandLength + 150);
    hourHand.setAttribute('y2', Math.sin(hourAngle) * hourHandLength + 150);
    minuteHand.setAttribute('x1', Math.cos(minutesAngle - Math.PI) * minuteHandExtLength + 150);
    minuteHand.setAttribute('y1', Math.sin(minutesAngle - Math.PI) * minuteHandExtLength + 150);
    minuteHand.setAttribute('x2', Math.cos(minutesAngle) * minuteHandLength + 150);
    minuteHand.setAttribute('y2', Math.sin(minutesAngle) * minuteHandLength + 150);
    secondHand.setAttribute('x1', Math.cos(secondsAngle - Math.PI) * secondHandExtLength + 150);
    secondHand.setAttribute('y1', Math.sin(secondsAngle - Math.PI) * secondHandExtLength + 150);
    secondHand.setAttribute('x2', Math.cos(secondsAngle) * secondHandLength + 150);
    secondHand.setAttribute('y2', Math.sin(secondsAngle) * secondHandLength + 150);
}

/**
 * update the dashboard
 */
function update() {
    requestAnimationFrame(update);

    let now = new Date();

    // get and format a bunch of data from the date obj
    let formattedMinutes = `${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    let formattedTime24h = `${now.getHours()}:${formattedMinutes}`;
    let formattedTime12h = `${(now.getHours() + 11) % 12 + 1}:${formattedMinutes}`;
    let formattedUTCMinutes = `${now.getUTCMinutes().toString().padStart(2, '0')}:${now.getUTCSeconds().toString().padStart(2, '0')}`;
    let formattedUTCTime24h = `${now.getUTCHours()}:${formattedUTCMinutes}`;
    let formattedUTCTime12h = `${(now.getUTCHours() + 11) % 12 + 1}:${formattedUTCMinutes}`;
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
        e.innerText = `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()}`;
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

    localAnalogSvgDisplays.forEach(e => {
        updateAnalog(e, now.getHours() * 60 * 60 + now.getMinutes() * 60 + now.getSeconds() + now.getMilliseconds() / 1000);
    });

    utcAnalogSvgDisplays.forEach(e => {
        updateAnalog(e, now.getUTCHours() * 60 * 60 + now.getUTCMinutes() * 60 + now.getUTCSeconds() + now.getUTCMilliseconds() / 1000);
    });
    
    document.title = `${formattedTime12h} ${AmPm} • Clock App`;
    
    if (blocks.length < 1) return;
    
    let scheduleStart = blocks[0].start;
    let scheduleEnd = blocks[blocks.length - 1].end;
    
    // parent box height
    let boxHeight = scheduleWidgetContent.getBoundingClientRect().height;
    let boxPadding = parseFloat(getComputedStyle(scheduleWidgetContent).paddingTop);
    let percentPadding = boxPadding / boxHeight; // percent of parent box height taken up by one side of padding (0-1)
    
    // get time since 12:00AM in minutes
    let timeInMinutes = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60 + now.getMilliseconds() / (60 * 1000);
    let timeSinceScheduleStart = timeInMinutes - scheduleStart;
    let percentThroughSchedule = timeSinceScheduleStart / (scheduleEnd - scheduleStart); // percent way through the schedule (0-1)
    
    // calc the 
    let overlayTotalPercent = ((1 - percentPadding * 2) * percentThroughSchedule * 100) + percentPadding * 100;
    
    if (overlayTotalPercent < 0) {
        scheduleOverlay.style.display = "none";
    } else {
        scheduleOverlay.style.display = "";
    }
    
    scheduleOverlay.style.height = overlayTotalPercent + "%";
    
    blockRemainingTimeDisplays.forEach((e) => {
        let endTime = Math.max(timeInMinutes, scheduleEnd);

        for (const block of blocks) {
            if (block.end < timeInMinutes) continue;
            if (block.start > endTime) continue;

            if (block.start > timeInMinutes) {
                endTime = block.start;
            }
            
            if (block.end > timeInMinutes && block.end < endTime) {
                endTime = block.end;
            }
        }
        
        e.innerText = parseTimeToMS(endTime - timeInMinutes);
    });
    
    scheduleRemainingTimeDisplays.forEach((e) => {
        e.innerText = parseTimeToHMS(scheduleEnd - timeInMinutes);
    });
}

function getCookie(name) { // chatgpt; should work
    const match = document.cookie.match(
        new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1') + '=([^;]*)')
    );
    return match ? decodeURIComponent(match[1]) : null;
}

let rawJsonScheduleData = getCookie("json");

// apply from cookie if readable
if (document.cookie && rawJsonScheduleData) {
    try {
        let data = JSON.parse(rawJsonScheduleData);

        for (const block of data.blocks) {
            if (typeof(block.name) != "string") throw new Error("Couldn't access critical attribute.");
            if (typeof(block.start) != "number") throw new Error("Couldn't access critical attribute.");
            if (typeof(block.end) != "number") throw new Error("Couldn't access critical attribute.");
        }

        for (const dayOff of data.days_off) {
            if (typeof(dayOff.type) != "string") throw new Error("Couldn't access critical attribute.");
            if (typeof(dayOff.name) != "string") throw new Error("Couldn't access critical attribute.");

            if (dayOff.date) {
                dayOff.date = new Date(dayOff.date);
            } else if (dayOff.startDate && dayOff.endDate) {
                dayOff.startDate = new Date(dayOff.startDate);
                dayOff.endDate = new Date(dayOff.endDate);
            } else {
                throw new Error("Couldn't access critical attribute.");
            }
        }

        blocks = data.blocks;
        daysOff = data.days_off;

        console.log(blocks, daysOff);
    } catch (e) {
        alert("Invalid JSON in cookie:\n" + e);
    }
}

for (let i = 0; i < blocks.length; i++) {
    let {name, start, end} = blocks[i];
    
    if (i > 0) {
        let lastEnd = blocks[i - 1].end;
        if (lastEnd < start) {
            createBlock(false, lastEnd, start, name);
        }
    }

    createBlock(true, start, end, name);
}

daysOffDisplays.forEach(e => {
    daysOff.forEach(d => {
        createDayOff(d, e);
    });
});

analogSvgDisplays.forEach(e => {
    const marksGroup = e.querySelector('.marks');
    const totalMarks = 12 * 5; // use 60 for minute ticks
    const step = 360 / totalMarks; // 30° for 12, 6° for 60

    for (let i = 0; i < totalMarks; i++) {
        const tick = document.createElementNS('http://www.w3.org/2000/svg', 'use');
        tick.setAttribute('transform', `rotate(${i * step},150,150)`);
        marksGroup.appendChild(tick);

        if (i % 5 == 0) {
            tick.setAttribute('href', '#large-tick');
        } else {
            tick.setAttribute('href', '#small-tick');
        }
    }
});

requestAnimationFrame(update);


setButton.addEventListener("click", () => {
    const response = prompt("JSON");

    if (response) {
        document.cookie = "json=" + encodeURIComponent(response) + ";";
        document.location.reload();
    }
});

getButton.addEventListener("click", () => {
    const json = {
        blocks,
        days_off: daysOff,
        timestamp: Date.now()
    };

    alert(JSON.stringify(json));
});


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