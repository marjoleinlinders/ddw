var mic, fft, first, prevMillis, iterator, waveformLength, analyzer, count,
    vh = 1024,
    vw = 1920,
    measurePoints = 1024, //1024 is the max!
    measureFreq = 1, //ms
    analyzeFreq = 1; //every n measures

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
            min: Math.min.apply(null, arr),
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

//var song;
//function preload() {
//    song = loadSound("test.mp3");
//}

window.setupAudio = function () {
    analyzer = new Analyzer();
    //song.loop();
     mic = new p5.AudioIn();
     mic.start();
    fft = new p5.FFT();
    //fft.setInput(song);
    fft.setInput(mic);
};

window.drawAudio = function () {
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



var lineCount = 0;
var lineCountMax;
var reverse = false;
var canvasSize;
// var c0 = {
//     angle: undefined,
//     points: undefined,
//     coordinates: undefined
// };
// var c1 = {
//     angle: undefined,
//     points: undefined,
//     coordinates: undefined
// };
// var c2 = {
//     angle: undefined,
//     points: undefined,
//     coordinates: undefined
// };
// var c3 = {
//     angle: undefined,
//     points: undefined,
//     coordinates: undefined
// };
// var c4 = {
//     angle: undefined,
//     points: undefined,
//     coordinates: undefined
// };
var abs_min_points = 3;
var abs_max_points = 44;
var calibrated = {
    silence: {min: 0, max: 100, avg: 20, osc: 20},
    loudness: {min: 50, max: 300, avg: 100, osc: 200}
};
var calibrating = false;
var average = {};
var audioAvgMax;
var audioMax;
var audioAvgMin;
var audioMin;
var audioAvgOsc;
var audioOsc;
var audio = {};
var circleCount = 5;

window.setupVisual = function () {
    canvasSize = (window.innerHeight > window.innerWidth ? window.innerWidth : window.innerHeight);
    createCanvas(window.innerWidth, window.innerHeight);

    for (var i = 0; i < circleCount; i++) {
        window["c" + i] = {points: undefined, angle: undefined, radius: undefined, coordinates: undefined}
        window["c" + i].coordinates = new Coordinates({
            canvas: canvas,
            radius: window["c" + i].radius,
            angle: window["c" + i].angle
        });
    }
};

window.drawVisual = function (audioData) {
    audio = audioData;
    if (calibrating !== false) {
        calibrating.listen(audioData);
    } else {
        analyzeAudioData(audioData);
    }
    if (pause() === false) drawLines();
};

var drawCount = 0;
var drawCountMax = 1;

function pause() {
    // drawCount++;
    // if (drawCount > drawCountMax) {
    //     drawCount = 0;
    //     drawCountMax = map(audio.avgMax || 0, calibrated.loudness.max, calibrated.silence.max, 1, 10);
    //     if (drawCountMax > 10) drawCountMax = 10;
    //     else if (drawCountMax < 0) drawCountMax = 0;
        return false;
    // }
    // return true;
}

function drawLines() {
    if (lineCount === 0) {
        calculateCoordinates();
        lineCountMax = getMaxLineCount();
        lineCount = 1;
    }

    var lines = generateLineArray(lineCount);

    //background(0, 0, 0, Math.abs(map(audio.osc, calibrated.loudness.osc, calibrated.silence.osc, 25, 50)));
    background(0, 0, 0, 50);

    // stroke("grey"); strokeWeight(0.25)
    // for (var i = 0; i < c1.points; i++) {
    //     var p1 = i;
    //     var p2 = i + 5;
    //     p2 = lines[p2] === undefined ? 0 : p2;
    //     if (lines.length > c1.points) {
    //         line(lines[p1][1].x, lines[p1][1].y, lines[p2][1].x, lines[p2][1].y);
    //     }
    // }
    stroke("grey");
    strokeWeight(1 + (audioOsc * 5));
    for (var i = 0; i < lines.length; i++) {
        var p1 = i;
        var p2 = p1 - 1;
        p2 = lines[p2] === undefined ? 0 : p2;
        if (i > 0) {
            line(lines[p1][1].x, lines[p1][1].y, lines[p2][1].x, lines[p2][1].y);
            line(lines[p1][0].x, lines[p1][0].y, lines[p2][0].x, lines[p2][0].y);
            line(lines[p1][0].x, lines[p1][0].y, lines[p1][1].x, lines[p1][1].y);
        }
    }
    stroke("white");
    strokeWeight(1 + (audioOsc * 5));
    for (var i = 0; i < lines.length; i++) {
        var p1 = i;
        var p2 = p1 - 1;
        p2 = lines[p2] === undefined ? 0 : p2;
        if (i > 0) {
            line(lines[p1][2].x, lines[p1][2].y, lines[p2][2].x, lines[p2][2].y);
            line(lines[p1][3].x, lines[p1][3].y, lines[p2][3].x, lines[p2][3].y);
            line(lines[p1][2].x, lines[p1][2].y, lines[p1][3].x, lines[p1][3].y);
        }
    }
    stroke("red");
    strokeWeight(1);
    for (var i = 0; i < lines.length; i++) {
        var p1 = i;
        var p2 = p1 - 1;
        p2 = lines[p2] === undefined ? 0 : p2;
        if (i > 0) {
            console.log(lines[p1])
            line(lines[p1][1].x, lines[p1][1].y, lines[p1][3].x, lines[p1][3].y);
        }
    }

    if (reverse === true) lineCount--;
    else lineCount++;

    if (lineCount < 1) {
        lineCount = 0;
        reverse = false;
    }
    else if (lineCount > lineCountMax) {
        reverse = true;
    }
}

function getMaxLineCount() {
    return lcm(c0.points, c1.points) + lcm(c2.points, c3.points) + c0.points + c1.points + c2.points + c3.points + c4.points;
}


function calculateCoordinates() {
    c0.points = 60;//getRandomBetweenMinAndMax();
    c1.points = 12;//getRandomBetweenMinAndMax();
    c2.points = 20; //getRandomBetweenMinAndMax();
    c3.points = 4; //getRandomBetweenMinAndMax();
    c4.points = 8; //getRandomBetweenMinAndMax();

    // if (c0.points < abs_min_points) c0.points = abs_min_points;
    // if (c0.points > abs_max_points) c0.points = abs_max_points;
    // if (c1.points < abs_min_points) c1.points = abs_min_points;
    // if (c1.points > abs_max_points) c1.points = abs_max_points;
    // if (c2.points < abs_min_points) c2.points = abs_min_points;
    // if (c2.points > abs_max_points) c2.points = abs_max_points;

    var obj = {};
    for (var i = 0; i < circleCount; i++) {
        var circle = window["c" + i];
        circle.angle = Math.PI * 2 / circle.points;
        circle.coordinates.setOptions({radius: circle.radius, angle: circle.angle});
        obj["c" + 1] = circle;
    }
    return obj;
}

function generateLineArray(lineCount) {
    for (var i = 0; i < circleCount; i++) {
        window["c"+i].coordinates.init();
    }

    var lines = [];

    for (var i = 0; i < lineCount; i++) {
        var circles = [];
        for (var j = 0; j < circleCount; j++) {
            window["c" + j].coordinates.move();
            circles.push({x: window["c" + j].coordinates.pos.x, y: window["c" + j].coordinates.pos.y});
        }

        lines.push(circles);
    }

    return lines;
}

function getRandomBetweenMinAndMax() {
    var max_points = Math.round(audioAvgOsc * (abs_max_points - abs_min_points) + abs_min_points);
    var min_points = Math.round((audioAvgOsc - audioAvgOsc / 3) * (abs_max_points / 3 - abs_min_points) + abs_min_points);
    return Math.floor((Math.random() * (max_points - min_points + 1) + abs_min_points));
}

function analyzeAudioData(data) {
    audio.avgMax = getAvg(average, "max", data.max, 50);
    audio.avgMin = getAvg(average, "min", data.min, 50);
    audio.avgOsc = getAvg(average, "osc", data.osc, 50);
    audio.avgOsc5 = getAvg(average, "osc", data.osc, 5);

    audioAvgMax = Math.round(map(audio.avgMax, calibrated.loudness.max, calibrated.silence.max, 300, 1));
    audioMax = map(data.max, calibrated.loudness.max, calibrated.silence.max, 300, 1);
    audioAvgMin = Math.round(map(audio.avgMin, calibrated.loudness.min, calibrated.loudness.min, 300, 1));
    audioMin = map(data.min, calibrated.loudness.min, calibrated.silence.min, 300, 1);
    audioAvgOsc = map(audio.avgOsc, calibrated.loudness.osc, calibrated.silence.osc, 0.5, 0.001);
    audioOsc = map(audio.avgOsc5, calibrated.loudness.osc, calibrated.silence.osc, 0.25, 0);

    c0.coordinates.radius = canvasSize * (0.45 + audioOsc);
    c1.coordinates.radius = canvasSize * (0.45);// - audioOsc);
    c2.coordinates.radius = canvasSize * 0.5;
    c3.coordinates.radius = canvasSize * 0.4;
    c4.coordinates.radius = canvasSize * 0.2;
}

var Coordinates = function (options) {
    this.calculate_coordinates = function (pos) {
        pos = pos || {
            x: this.canvas.width / 2,
            y: this.canvas.height / 2
        };
        pos.x -= Math.sin(this.i += this.angle) * this.radius;
        pos.y += Math.sin(this.j += this.angle) * this.radius;
        return pos;
    };

    this.move = function () {
        this.pos = this.calculate_coordinates();
        return this;
    };

    this.init = function () {
        this.i = 0;
        this.j = Math.PI / 2;
        // this.pos = this.calculate_coordinates();
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

var Calibration = function (options) {
    this.$alert = document.getElementById("alert");
    this.seconds = 5;
    this.silence = {};
    this.loudness = {};
    this.calibrationData = {};

    this.resetCalData = function () {
        this.calibrationData = {};
        for (var i = 0; i < options.length; i++) {
            this.calibrationData[options[i]] = [];
        }
    };

    this.calibrateMin = function (callback) {
        for (var i = 0; i < options.length; i++) {
            this.silence[options[i]] = avg(this.calibrationData[options[i]]);
        }
        callback();
    };

    this.calibrateMax = function (callback) {
        for (var i = 0; i < options.length; i++) {
            this.loudness[options[i]] = max(this.calibrationData[options[i]]);
            if (this.silence[options[i]] > this.loudness[options[i]]) {
                this.loudness[options[i]] = this.silence[options[i]] + 20;
            }
        }
        callback();
    };

    this.showInfo = function (message) {
        this.$alert.innerHTML = "<h2>Kalibratie</h2><p>" + message + "</p>";
    };

    this.calibrateSilence = function (finalCallback) {
        this.resetCalData();
        var silenceInterval = window.setInterval(function (self) {
            if (self.seconds > 0) {
                self.seconds--;
                self.showInfo("Wees stil... " + self.seconds);
            } else {
                window.clearInterval(silenceInterval);
                self.seconds = 5;
                self.calibrateMin(function () {
                    self.calibrateLoudness(finalCallback);
                });
            }
        }, 500, this);
        this.showInfo("Wees stil... " + this.seconds);
    };

    this.calibrateLoudness = function (finalCallback) {
        this.resetCalData();
        var loudInterval = window.setInterval(function (self) {
            if (self.seconds > 0) {
                self.seconds--;
                self.showInfo("Maak lawaai... " + self.seconds);
            } else {
                window.clearInterval(loudInterval);
                self.calibrateMax(function () {
                    self.$alert.innerHTML = "";
                    finalCallback({silence: self.silence, loudness: self.loudness});
                });
            }
        }, 500, this);
        this.showInfo("Wees stil... " + this.seconds);
    };

    this.start = function (finalCallback) {
        this.resetCalData();
        this.calibrateSilence(finalCallback);
    };

    this.listen = function (data) {
        for (var i = 0; i < options.length; i++) {
            this.calibrationData[options[i]].push(data[options[i]]);
        }
    }
};

function map(source, actualMin, actualMax, targetMin, targetMax) {
    return actualMin > actualMax ? actualMin > source ? (source - actualMin) * (targetMax - targetMin) / (actualMax - actualMin) + targetMin : targetMin : actualMax > actualMin ? actualMax > source ? (source - actualMin) * (targetMax - targetMin) / (actualMax - actualMin) + targetMin : targetMax : void 0
}

function avg(arr) {
    var tmp = 0;
    for (var i = 0; i < arr.length; i++) {
        tmp += arr[i];
    }
    return Math.round(tmp / arr.length);
}

function max(arr) {
    return Math.max.apply(null, arr);
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

function greatestCommonDivider(op, ip) {
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
    return (Math.abs((op * ip) / greatestCommonDivider(op, ip)));
}

function windowResized() {
    canvasSize = (window.innerHeight > window.innerWidth ? window.innerWidth : window.innerHeight);
    createCanvas(window.innerWidth, window.innerHeight);
}

function keyReleased(value) {
    if (value.key === "k") {
        console.log("calibrating");
        calibrating = new Calibration(["min", "max", "osc"]);
        calibrating.start(function (response) {
            console.log(response);
            calibrated = response;
            calibrating = false;
        });
    }
}
