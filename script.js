var mic, fft, first, iterator, waveformLength, analyzer, loaded,
    vh = 1024,
    measurePoints = 1024; //1024 is the max!
var songs = [
    "Electric Tribe - unreleased demo 'Running Electric/Euh' (2018)",
    "Electric Tribe - unreleased demo 'So long' (2018)",
    "Electric Tribe - 'Met de Sterren Meebewegen'"];

var avg = function (arr) {
    var sum = 0;
    for (var i = 0; i < arr.length; i++) {
        sum += arr[i];
    }
    return (sum / arr.length);
};

var osc = function (arr, avg) {
    var osc = 0;
    var dir = 0;
    for (var i = 0; i < arr.length; i++) {
        var pDir = dir;
        if (arr[i] > avg) {
            dir = 1;
        } else if (arr[i] < avg) {
            dir = -1;
        }
        if (pDir != dir) {
            osc++;
        }
    }
    return osc;
};

var Analyzer = function () {
    this.analyze = function (arr) {
        var avgVal = avg(arr);
        return {
            max: Math.max.apply(null, arr),
            avg: avgVal,
            osc: osc(arr, avgVal)
        };
    };
    this.measureY = function (y) {
        y = y - vh / 2;
        if (y < 0) {
            y = -y;
        }
        return y;
    };

};

var song;
var songIndex = 0;
var currentSong = songs[0];
function loadSong(onstart, onend) {
    song = loadSound("/assets/test" + songIndex + ".mp3", function() {
        song.play();
        song.onended(function(event){
            songIndex ++;
            if (songIndex > 2) songIndex = 0;
            onend(songs[songIndex]);
            setTimeout(function() {
                loadSong(onstart, onend)
            }, 2000)
        });
        fft.setInput(song);
        onstart();

        song.rate(20);
    });
}

window.setupAudio = function (type) {
    analyzer = new Analyzer();
    fft = new p5.FFT();
    if (type === "mp3") {
        loadSong(function() {
            loaded = true;
            songReturned = false;
        }, function (song) {
            currentSong = song;
            loaded = false;
        })
    } else {
        mic = new p5.AudioIn();
        mic.start();
        fft.setInput(mic);
        loaded = true;
    }
};

var songReturned = false;
window.drawAudio = function () {
    if (loaded !== true && songReturned !== true) {
        songReturned = true;
        return {song: currentSong};
    }
    var waveform = fft.waveform();

    if (!first) {
        waveformLength = waveform.length;
        iterator = parseInt(waveformLength / measurePoints);
        first = true;
    }
    var mappedValues = [];
    for (var i = 0; i < waveformLength; i += iterator) {
        var y = map(waveform[i], -1, 1, 0, vh);
        mappedValues.push(analyzer.measureY(y));
    }

    return analyzer.analyze(mappedValues);
};


var canvasSize;
var calibrated = {min: 0, max: 500, avg: 100, osc: 200};
var calibrating = false;
var average = {};
var audioMax;
var audioOsc;
var audioAvgMax;
var halfAvgMax;
var audioAvgOsc;
var halfAvgOsc;
var quarterAvgOsc;
var audio = {};
var circleCount = 7;
var drawCount = 0;
var drawCountMax = 1;
var lineCount = 0;
var loopCount;
var reverse = false;
var delay = 500;

function setText(text) {
    document.getElementById("song").innerHTML = text;
}

var texts = [
    {t: " ", d: 500, c: clearLogo},
    {t: "'Klankbord'", d: 2500, c: logoKlankbord},
    {t: "", d: 500, c: clearLogo},
    {t: "Audio visualisation by Marius Linders and Atelier Marjolein Linders", d: 2500, c: logoMarjo},
    {t: "", d: 500, c: clearLogo},
    {t: "", d: 2500, c: logoPlay},
    {t: "", d: 0, c: clearLogo}
];

function intro(cb, i) {
    if (i === undefined) i = 0;
    if (texts[i] === undefined) {
        cb();
        return;
    } else {
        if (texts[i].t !== undefined) setText(texts[i].t);
        if (texts[i].c !== undefined) texts[i].c();
    }

    setTimeout(function () {
        intro(cb, i + 1);
    }, texts[i].d);
}

window.setupVisual = function () {
    canvasSize = (window.innerHeight > window.innerWidth ? window.innerWidth : window.innerHeight);
    createCanvas(window.innerWidth, window.innerHeight);

    for (var i = 0; i < circleCount; i++) {
        window["c" + i] = {points: undefined, angle: undefined, radius: undefined, coordinates: undefined, direction: 1};
        window["c" + i].coordinates = new Coordinates({
            canvas: canvas,
            radius: window["c" + i].radius,
            angle: window["c" + i].angle
        });
    }
    c6.direction = -1;
    // strokeCap(PROJECT);
    strokeJoin(MITER);
    noSmooth()
};

var drawEnabled = false;
window.drawVisual = function (audioData) {
    if (audioData.song !== undefined) {
        drawEnabled = false;
        texts[5].t = audioData.song;
        intro(function () {
            drawEnabled = true;
        });
        return;
    }
    audio = audioData;
    if (calibrating !== false) {
        calibrating.listen(audioData);
    } else {
        analyzeAudioData(audioData);
    }
    if (drawEnabled) drawVisuals();
};

function pause(multiplier) {
    if (multiplier === undefined) {
        multiplier = 1;
    }
    if (drawCount >= drawCountMax * multiplier) {
        drawCount = 0;
        drawCountMax = map(audio.avgMax, 250, 20, -10, 500);
        console.log(drawCountMax);
        if (drawCountMax > 10) drawCountMax = 10;
        else if (drawCountMax < 1) drawCountMax = 1;
        return false;
    } else {
        drawCount++;
        return true;
    }
}

function logoKlankbord() {
    background(0, 0, 0);
    c0.points = 12;
    c0.coordinates.radius = canvasSize / 7.5;
    c0.angle = Math.PI * 2 / c0.points;
    c0.coordinates.setOptions({radius: c0.radius, angle: c0.angle});
    var lines = calculateLineArray(11);
    stroke("white");
    strokeWeight(1);
    line(lines[0][0].x, lines[0][0].y, lines[2][0].x, lines[2][0].y);
    line(lines[2][0].x, lines[2][0].y, lines[4][0].x, lines[4][0].y);
    line(lines[4][0].x, lines[4][0].y, lines[6][0].x, lines[6][0].y);
    line(lines[6][0].x, lines[6][0].y, lines[8][0].x, lines[8][0].y);
    line(lines[8][0].x, lines[8][0].y, lines[10][0].x, lines[10][0].y);
    line(lines[10][0].x, lines[10][0].y, lines[0][0].x, lines[0][0].y);
}

function logoMarjo() {
    background(0, 0, 0);
    c0.points = 12;
    c1.points = 12;
    c2.points = 1;
    c0.coordinates.radius = canvasSize / 7.5;
    c1.coordinates.radius = canvasSize / 15;
    c2.coordinates.radius = 0;
    c0.angle = Math.PI * 2 / c0.points;
    c1.angle = Math.PI * 2 / c1.points;
    c2.angle = Math.PI * 2 / c2.points;
    c0.coordinates.setOptions({radius: c0.radius, angle: c0.angle});
    c1.coordinates.setOptions({radius: c1.radius, angle: c1.angle});
    c2.coordinates.setOptions({radius: c2.radius, angle: c2.angle});
    var lines = calculateLineArray(11);
    stroke("white");
    strokeWeight(1);
    line(lines[0][0].x, lines[0][0].y, lines[4][0].x, lines[4][0].y);
    line(lines[4][0].x, lines[4][0].y, lines[0][2].x, lines[0][2].y);
    line(lines[4][0].x, lines[4][0].y, lines[8][0].x, lines[8][0].y);
    line(lines[6][0].x, lines[6][0].y, lines[10][0].x, lines[10][0].y);
    line(lines[6][0].x, lines[6][0].y, lines[0][1].x, lines[0][1].y);
    line(lines[10][0].x, lines[10][0].y, lines[0][1].x, lines[0][1].y);
    line(lines[0][0].x, lines[0][0].y, lines[2][0].x, lines[2][0].y);
    line(lines[2][0].x, lines[2][0].y, lines[4][0].x, lines[4][0].y);
    line(lines[4][0].x, lines[4][0].y, lines[6][0].x, lines[6][0].y);
    line(lines[6][0].x, lines[6][0].y, lines[8][0].x, lines[8][0].y);
    line(lines[8][0].x, lines[8][0].y, lines[10][0].x, lines[10][0].y);
    line(lines[10][0].x, lines[10][0].y, lines[0][0].x, lines[0][0].y);
}

function logoPlay() {
    background(0, 0, 0);
    c0.points = 12;
    c1.points = 12;
    c0.coordinates.radius = canvasSize / 7.5;
    c1.coordinates.radius = canvasSize / 10;
    c0.angle = Math.PI * 2 / c0.points;
    c1.angle = Math.PI * 2 / c1.points;
    c0.coordinates.setOptions({radius: c0.radius, angle: c0.angle});
    c1.coordinates.setOptions({radius: c1.radius, angle: c1.angle});
    var lines = calculateLineArray(18);
    stroke("white");
    strokeWeight(1);
    line(lines[0][0].x, lines[0][0].y, lines[2][0].x, lines[2][0].y);
    line(lines[2][0].x, lines[2][0].y, lines[4][0].x, lines[4][0].y);
    line(lines[4][0].x, lines[4][0].y, lines[6][0].x, lines[6][0].y);
    line(lines[6][0].x, lines[6][0].y, lines[8][0].x, lines[8][0].y);
    line(lines[8][0].x, lines[8][0].y, lines[10][0].x, lines[10][0].y);
    line(lines[10][0].x, lines[10][0].y, lines[0][0].x, lines[0][0].y);
    line(lines[0][0].x, lines[0][0].y, lines[2][0].x, lines[2][0].y);
    line(lines[2][0].x, lines[2][0].y, lines[4][0].x, lines[4][0].y);
    line(lines[4][0].x, lines[4][0].y, lines[6][0].x, lines[6][0].y);
    line(lines[6][0].x, lines[6][0].y, lines[8][0].x, lines[8][0].y);
    line(lines[8][0].x, lines[8][0].y, lines[10][0].x, lines[10][0].y);
    line(lines[10][0].x, lines[10][0].y, lines[0][0].x, lines[0][0].y);
    line(lines[0][1].x, lines[0][1].y, lines[4][1].x, lines[4][1].y);
    line(lines[4][1].x, lines[4][1].y, lines[8][1].x, lines[8][1].y);
    line(lines[8][1].x, lines[8][1].y, lines[0][1].x, lines[0][1].y);
}

function clearLogo() {
    background(0, 0, 0);
}

function drawVisuals() {
    var weightA = [2];
    var weightB = [audioAvgOsc / 4];
    var weightC = [8];
    var weightD = [audioOsc];

    var colorA = [200, 120, 30]; //paars naar geel
    var colorB = [255, map(audioOsc || 0, 200, 0, 255, 175), map(audioOsc || 0, 200, 0, 255, 0)];

    var colorC = [0, 150, 150]; //lichtblauw
    var colorD = [0, 0, 0, 40];
    var colorE = [0, 0, 0];
    var colorF = [0, 80, 120]; //donkerblauw


    if (audioOsc > 100) {
        colorD = [map(audioMax || 0, 200, 0, 120, 0), 0, map(audioMax || 0, 200, 0, 60, 0), 40];
    } else {
        colorD = [0, 0, 0, 40];
    }

    if (lineCount === 0) {
        calculatePoints();
        var lcm1 = lcm(c0.points, c1.points);
        var lcm2 = lcm(c2.points, c3.points);

        if (lcm1 > lcm2) {
            loopCount = lcm1;
        } else {
            loopCount = lcm2;
        }
    }
    var lines = calculateLineArray(lineCount);

    background.apply(null, colorD);

    // shapeC
    stroke.apply(null, colorF);
    strokeWeight.apply(null, weightD);
    for (var j = 0; j < lines.length; j++) {
        var p1 = j;
        var p2 = p1 - 1;
        p2 = lines[p2] === undefined ? 0 : p2;
        if (j > 0) {
            line(lines[p1][6].x, lines[p1][6].y, lines[p2][6].x, lines[p2][6].y);
        }
    }

    // shapeC
    stroke.apply(null, colorC);
    strokeWeight.apply(null, weightA);
    for (var k = 0; k < lines.length; k++) {
        var p1 = k;
        var p2 = p1 - 1;
        p2 = lines[p2] === undefined ? 0 : p2;
        if (k > 0) {
            line(lines[p1][4].x, lines[p1][4].y, lines[p2][4].x, lines[p2][4].y);
            line(lines[p1][5].x, lines[p1][5].y, lines[p2][5].x, lines[p2][5].y);
            line(lines[p2][4].x, lines[p2][4].y, lines[p1][5].x, lines[p1][5].y);
        }
    }

    // shapeA
    stroke.apply(null, colorA);
    strokeWeight.apply(null, weightA);
    for (var i = 0; i < lines.length; i += 2) {
        var p1 = i;
        var p2 = p1 - 1;
        var p3 = p1 - 2;
        p2 = lines[p2] === undefined ? 0 : p2;
        p3 = lines[p3] === undefined ? 0 : p3;
        if (i > 0) {
            line(lines[p1][1].x, lines[p1][1].y, lines[p2][1].x, lines[p2][1].y);
            line(lines[p1][0].x, lines[p1][0].y, lines[p2][0].x, lines[p2][0].y);
            line(lines[p1][0].x, lines[p1][0].y, lines[p1][1].x, lines[p1][1].y);

            line(lines[p2][1].x, lines[p2][1].y, lines[p3][1].x, lines[p3][1].y);
            line(lines[p2][0].x, lines[p2][0].y, lines[p3][0].x, lines[p3][0].y);
            line(lines[p2][0].x, lines[p2][0].y, lines[p2][1].x, lines[p2][1].y);
        }
    }

    // shapeB
    stroke.apply(null, colorB);
    strokeWeight.apply(null, weightB);
    for (var j = 0; j < lines.length; j++) {
        var p1 = j;
        var p2 = p1 - 1;
        p2 = lines[p2] === undefined ? 0 : p2;
        if (j > 0) {
            line(lines[p1][2].x, lines[p1][2].y, lines[p2][2].x, lines[p2][2].y);
            line(lines[p1][3].x, lines[p1][3].y, lines[p2][3].x, lines[p2][3].y);
            line(lines[p1][2].x, lines[p1][2].y, lines[p1][3].x, lines[p1][3].y);
        }
    }

    if (reverse === true) {
        if (pause(0.01) === false) lineCount--;
    } else {
        if (pause() === false) lineCount += 1;
    }

    if (lineCount < 1) {
        lineCount = 0;
        reverse = false;
    }
    else if (lineCount > loopCount) {
        reverse = true;
    }
}

function calculatePoints() {
    // c0.points = Math.round(map(audioMax, 250, 0, 12,3));
    // if(c0.points > 12) {c0.points  = 12};
    // c1.points = c0.points * (c0.points + 1 );
    // c2.points = getRandom(3,12);
    // c3.points = c0.points ;
    // c4.points = c2.points;
    // c5.points = c2.points;
    // c6.points = c2.points;

    c0.points = Math.round(getRandom(3, 24) * audioAvgOsc / 50);// c2.points * z;
    c1.points = Math.round(getRandom(3, 15));// c3.points * z;
    c2.points = Math.round(getRandom(3, 12));// x*(y+1);
    c3.points = c2.points * (c2.points + 1);
    c4.points = c1.points;
    c5.points = c1.points;
    c6.points = c1.points;


    var obj = {};
    for (var i = 0; i < circleCount; i++) {
        var circle = window["c" + i];
        circle.angle = Math.PI * 2 / circle.points;
        circle.coordinates.setOptions({radius: circle.radius, angle: circle.angle});
        obj["c" + 1] = circle;
    }
    return obj;
}

function calculateLineArray(lineCount) {
    for (var i = 0; i < circleCount; i++) {
        window["c" + i].coordinates.init();
    }
    var lines = [];
    for (var i = 0; i < lineCount; i++) {
        var circles = [];
        for (var j = 0; j < circleCount; j++) {
            window["c" + j].coordinates.move(window["c" + j].direction);
            circles.push({x: window["c" + j].coordinates.pos.x, y: window["c" + j].coordinates.pos.y});
        }
        lines.push(circles);
    }
    return lines;
}

function analyzeAudioData(data) {
    audioMax = audio.avgMax = getAvg(average, "max", data.max, 3);
    audioOsc = audio.avgOsc = getAvg(average, "osc", data.osc, 3);
    audioAvgMax = audio.avgMax = getAvg(average, "max", data.max, 200);
    halfAvgMax = audioAvgMax / 2;
    quarterAvgMax = audioAvgMax / 4;
    audioAvgOsc = audio.avgOsc = getAvg(average, "osc", data.osc, 100);
    halfAvgOsc = audioAvgOsc / 4;
    quarterAvgOsc = audioAvgOsc / 4;

    var sizeC = canvasSize * 0.35 + audioAvgOsc / 4;

    // cirlce A
    c0.coordinates.radius = canvasSize * 0.25;
    c1.coordinates.radius = sizeC + quarterAvgMax;

    // cirlce B
    c2.coordinates.radius = sizeC;
    c3.coordinates.radius = canvasSize * 0.25 - audioAvgMax / 10;

    // cirlce C
    c4.coordinates.radius = sizeC - (audioOsc / 2 * audioOsc / 2);
    c5.coordinates.radius = sizeC + (audioAvgOsc / 4) * (audioAvgOsc / 4);
    c6.coordinates.radius = sizeC + 2 * audioAvgOsc;
}

var Coordinates = function (options) {

    this.calculate_coordinates = function (direction, pos) {
        pos = pos || {
                x: this.canvas.width / 2,
                y: this.canvas.height / 2
            };
        pos.x -= Math.sin(direction > 0 ? (this.i += this.angle) : (this.i -= this.angle)) * this.radius;
        pos.y += Math.sin(direction > 0 ? (this.j += this.angle) : (this.j -= this.angle)) * this.radius;
        return pos;
    };

    this.move = function (direction) {
        this.pos = this.calculate_coordinates(direction);
        return this;
    };

    this.init = function () {
        this.i = 0;
        this.j = Math.PI / 2;
    };

    this.setOptions = function (options) {
        var doInit = true;
        if (options.radius) {
            this.radius = options.radius;
        } else {
            doInit = false;
        }
        if (options.angle) {
            this.angle = options.angle;
        } else {
            doInit = false;
        }
        if (options.canvas) {
            this.canvas = canvas;
        }
        if (doInit) {
            this.init();
        }
    };

    this.setOptions(options);
    return this;
};

function map(source, actualMin, actualMax, targetMin, targetMax) {
    return actualMin > actualMax ? actualMin > source ? (source - actualMin) * (targetMax - targetMin) / (actualMax - actualMin) + targetMin : targetMin : actualMax > actualMin ? actualMax > source ? (source - actualMin) * (targetMax - targetMin) / (actualMax - actualMin) + targetMin : targetMax : void 0
}

function max(arr) {
    return Math.max.apply(null, arr);
}

function avg(arr) {
    var tmp = 0;
    for (var i = 0; i < arr.length; i++) {
        tmp += arr[i];
    }
    return Math.round(tmp / arr.length);
}

function getAvg(average, type, value, limit) {
    if (!Array.isArray(average[type])) {
        average[type] = [];
    }
    while (average[type].length > limit) {
        average[type].shift();
    }
    average[type].push(value);
    return avg(average[type]);
}

function getRandom(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

function gcd(op, ip) {
    while (ip) {
        var t = ip;
        ip = op % ip;
        op = t;
    }
    return op;
}

function lcm(op, ip) {
    op = Math.abs(op);
    ip = Math.abs(ip);
    if (!op || !ip) {
        return 0;
    }
    return (Math.abs((op * ip) / gcd(op, ip)));
}

function windowResized() {
    canvasSize = (window.innerHeight > window.innerWidth ? window.innerWidth : window.innerHeight);
    createCanvas(window.innerWidth, window.innerHeight);
}
