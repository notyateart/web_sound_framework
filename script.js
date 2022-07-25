// Options for Site Owners

//If activated displays a prompt before site entry to enable the audio context
hoverSoundsAcitvated = true;

// Fill this with sounds which can be assigned to different button types
// Order for plug & play use: 
//  1. Default Click Sound,
//  2. Important Click Sound,
//  3. Hover Sound,
//  4. Hold Sound
// Make sure the hold sound is loopable (do not cut between periods) and is in wav format (to avoid silence in the beginning/end). 
const audioUrls = [
    "audio/click.mp3",
    "audio/click2.mp3",
    "audio/woosh.mp3",
    "audio/loop.wav"
];


// Change these values to CSS selectors (usually classes) provided by your CSS framework
// or use the default ones and apply them manually
// separate multiple selectors by comma
var defaultSoundSelector = ".btn-close, .btn-primary, .btn-secondary, .nav-item";
var importantSoundSelector = ".btn-warning, .btn-success, .btn-danger";
var hoverSoundSelector = ".bsoundHover";
var holdSoundSelector = "input[type='range']";



// TODO: Connect Different Mixer Channels
// TODO: Find out why clicking mute buttons via script is necessary
// TODO: Hide prompt if user muted Hover Sounds 


// Setup Prerequisites
// AudioContext, GainNode, Volume


const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioContext = new AudioContext();

const masterGainNode = audioContext.createGain();
masterGainNode.gain = 0.8;
const mixerDefGain = audioContext.createGain();
mixerDefGain.gain = 0.8;
const mixerImpGain = audioContext.createGain();
mixerImpGain.gain = 0.8;
const mixerHoverGain = audioContext.createGain();
mixerHoverGain.gain = 0.8;
const mixerHoldGain = audioContext.createGain();
mixerHoldGain.gain = 0.8;

const fadeInOutGainNode = audioContext.createGain();

class VolumeGroup {
    volume = 0.8;
    volumeMuted = false;
    type;

    constructor(volume, volumeMuted, type) {
        this.volume = volume
        this.volumeMuted = volumeMuted;
        this.type = type;
    }

    setVolume(volume) {
        this.volume = volume;
        this.updateLocalStorage();
    }

    setVolumeMuted(volumeMuted) {
        this.volumeMuted = volumeMuted;
        this.updateLocalStorage();
    }

    getVolume() { return this.volume }
    getVolumeMuted() { return this.volumeMuted }
    getCurrentVol() { return this.volume * this.volumeMuted }

    updateLocalStorage() {
        switch (this.type) {
            case "master":
                localStorage.masterVol = this.volume;
                localStorage.masterVolMuted = this.volumeMuted;
                masterGainNode.gain.setTargetAtTime(this.volume * !this.volumeMuted, 0, 0);
                break;
            case "mixerDefault":
                localStorage.mixerDefault = this.volume;
                localStorage.mixerDefaultMuted = this.volumeMuted;
                mixerDefGain.gain.setTargetAtTime(this.volume * !this.volumeMuted, 0, 0);
                break;
            case "mixerImportant":
                localStorage.mixerImportant = this.volume;
                localStorage.mixerImportantMuted = this.volumeMuted;
                mixerImpGain.gain.setTargetAtTime(this.volume * !this.volumeMuted, 0, 0);
                break;
            case "mixerHover":
                localStorage.mixerHover = this.volume;
                localStorage.mixerHoverMuted = this.volumeMuted;
                mixerHoverGain.gain.setTargetAtTime(this.volume * !this.volumeMuted, 0, 0);
                break;
            case "mixerHold":
                localStorage.mixerHold = this.volume;
                localStorage.mixerHoldMuted = this.volumeMuted;
                mixerHoldGain.gain.setTargetAtTime(this.volume * !this.volumeMuted, 0, 0);
                break;
        }
    }
}


var masterVol = new VolumeGroup(0.8, false, "master");
var mixerVolDef = new VolumeGroup(0.8, false, "mixerDefault");
var mixerVolImp = new VolumeGroup(0.8, false, "mixerImportant");
var mixerVolHov = new VolumeGroup(0.8, false, "mixerHover");
var mixerVolHold = new VolumeGroup(0.8, false, "mixerHold");


let samples;



// Setup Functions

async function singleAudioFileToBuffer(url) {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    return audioBuffer;
}

async function audioFilesToBuffers(urls) {
    const audioBuffers = [];

    for (const url of urls) {
        const sample = await singleAudioFileToBuffer(url);
        audioBuffers.push(sample);
    }

    return audioBuffers;
}

function playDefaultSample(audioBuffer) {
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(mixerDefGain).connect(masterGainNode).connect(audioContext.destination);
    source.start(0);
}

function playImportantSample(audioBuffer) {
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(mixerImpGain).connect(masterGainNode).connect(audioContext.destination);
    source.start(0);
}

function playHoverSample(audioBuffer) {
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(mixerHoverGain).connect(masterGainNode).connect(audioContext.destination);
    source.start(0);
}

var loopSampleSource = undefined;

function playHoldSample(audioBuffer, time) {
    if (loopSampleSource != undefined) {
        loopSampleSource = undefined;
        fadeInOutGainNode.gain.setTargetAtTime(0, 0, 0);
    }
    loopSampleSource = audioContext.createBufferSource();
    loopSampleSource.buffer = audioBuffer;
    loopSampleSource.connect(fadeInOutGainNode).connect(masterGainNode).connect(audioContext.destination);
    fadeInOutGainNode.gain.setTargetAtTime(1, 0, time + 0.1);
    loopSampleSource.start(time);
    loopSampleSource.loop = true;
}

// first we check if loopSampleSource even exists, there probably are a few cases where it doesn't
// to prevent clicks we first fade out the sound
// I have tried to manully set the loopSampleSource variable to undefined with a timeout
// but source.stop() deletes the object anyways therefore it has to be the last command
function stopHoldSample() {
    if (loopSampleSource != undefined) {
        fadeInOutGainNode.gain.setTargetAtTime(0, 0, 0.1);
        loopSampleSource.stop(0.3);
    }
}


// Get Elements From DOM

var bsoundDefaultButtons = document.querySelectorAll(defaultSoundSelector);
var bsoundImportantButtons = document.querySelectorAll(importantSoundSelector);
var bsoundHoverButtons = document.querySelectorAll(hoverSoundSelector);
var bsoundHoldButtons = document.querySelectorAll(holdSoundSelector);


var masterVolSlider = document.querySelector('#masterVolSlider');
var masterVolSliderExists = !!document.querySelector('#masterVolSlider');
var masterVolSliderValue = document.querySelector('#masterVolSliderValue');
var masterVolSliderValueExists = !!document.querySelector('#masterVolSliderValue');

var masterMuteSwitch = document.getElementById('muteMasterVol');
masterMuteSwitch.checked = masterVol.getVolumeMuted();


var mixerVolDefaultSlider = document.querySelector('#mixerVolDefaultSlider');
var mixerVolDefaultSliderExists = !!document.querySelector('#mixerVolDefaultSlider');
var mixerVolDefaultSliderValue = document.querySelector('#mixerVolDefaultSliderValue');
var mixerVolDefaultSliderValueExists = !!document.querySelector('#mixerVolDefaultSliderValue');

var mixerMuteSwitchDefault = document.getElementById('muteMixerVolDef');
mixerMuteSwitchDefault.checked = mixerVolDef.getVolumeMuted();


var mixerVolImportantSlider = document.querySelector('#mixerVolImportantSlider');
var mixerVolImportantSliderExists = !!document.querySelector('#mixerVolImportantSlider');
var mixerVolImportantSliderValue = document.querySelector('#mixerVolImportantSliderValue');
var mixerVolImportantSliderValueExists = !!document.querySelector('#mixerVolImportantSliderValue');

var mixerMuteSwitchImportant = document.getElementById('muteMixerVolImp');
mixerMuteSwitchImportant.checked = mixerVolImp.getVolumeMuted();


var mixerVolHoverSlider = document.querySelector('#mixerVolHoverSlider');
var mixerVolHoverSliderExists = !!document.querySelector('#mixerVolHoverSlider');
var mixerVolHoverSliderValue = document.querySelector('#mixerVolHoverSliderValue');
var mixerVolHoverSliderValueExists = !!document.querySelector('#mixerVolHoverSliderValue');

var mixerMuteSwitchHover = document.getElementById('muteMixerVolHov');
mixerMuteSwitchHover.checked = mixerVolHov.getVolumeMuted();


var mixerVolHoldSlider = document.querySelector('#mixerVolHoldSlider');
var mixerVolHoldSliderExists = !!document.querySelector('#mixerVolHoldSlider');
var mixerVolHoldSliderValue = document.querySelector('#mixerVolHoldSliderValue');
var mixerVolHoldSliderValueExists = !!document.querySelector('#mixerVolHoldSliderValue');

var mixerMuteSwitchHold = document.getElementById('muteMixerVolHold');
mixerMuteSwitchHold.checked = mixerVolHold.getVolumeMuted();


var modalButton = document.getElementById('openModal');




// Execution

if (masterVolSliderExists) {
    masterVolSlider.addEventListener('input', function () {
        masterVol.setVolume(masterVolSlider.value);
        if (masterVolSliderValueExists) {
            masterVolSliderValue.innerHTML = masterVol.getVolume();
        }
    });
}

if (mixerVolDefaultSliderExists) {
    mixerVolDefaultSlider.addEventListener('input', function () {
        mixerVolDef.setVolume(mixerVolDefaultSlider.value);
        if (mixerVolDefaultSliderValueExists) {
            mixerVolDefaultSliderValue.innerHTML = mixerVolDef.getVolume();
        }
    });
}

if (mixerVolImportantSliderExists) {
    mixerVolImportantSlider.addEventListener('input', function () {
        mixerVolImp.setVolume(mixerVolImportantSlider.value);
        if (mixerVolImportantSliderValueExists) {
            mixerVolImportantSliderValue.innerHTML = mixerVolImp.getVolume();
        }
    });
}

if (mixerVolHoverSliderExists) {
    mixerVolHoverSlider.addEventListener('input', function () {
        mixerVolHov.setVolume(mixerVolHoverSlider.value);
        if (mixerVolHoverSliderValueExists) {
            mixerVolHoverSliderValue.innerHTML = mixerVolHov.getVolume();
        }
    });
}

if (mixerVolHoldSliderExists) {
    mixerVolHoldSlider.addEventListener('input', function () {
        mixerVolHold.setVolume(mixerVolHoldSlider.value);
        if (mixerVolHoldSliderValueExists) {
            mixerVolHoldSliderValue.innerHTML = mixerVolHold.getVolume();
        }
    });
}


// MUTE SWITCHES

masterMuteSwitch.addEventListener('change', function () {
    if (this.checked) { masterVol.setVolumeMuted(true) }
    else { masterVol.setVolumeMuted(false) }
});

mixerMuteSwitchDefault.addEventListener('change', function () {
    if (this.checked) { mixerVolDef.setVolumeMuted(true) }
    else { mixerVolDef.setVolumeMuted(false) }
});

mixerMuteSwitchImportant.addEventListener('change', function () {
    if (this.checked) { mixerVolImp.setVolumeMuted(true) }
    else { mixerVolImp.setVolumeMuted(false) }
});

mixerMuteSwitchHover.addEventListener('change', function () {
    if (this.checked) { mixerVolHov.setVolumeMuted(true) }
    else { mixerVolHov.setVolumeMuted(false) }
});

mixerMuteSwitchHold.addEventListener('change', function () {
    if (this.checked) { mixerVolHold.setVolumeMuted(true) }
    else { mixerVolHold.setVolumeMuted(false) }
});




// Sounds

audioBuffers = audioFilesToBuffers(audioUrls).then((response) => {
    samples = response;
    for (var i = 0; i < bsoundDefaultButtons.length; i++) {
        bsoundDefaultButtons.item(i).addEventListener('click', function () {
            if (audioContext.state === 'suspended') {
                audioContext.resume();
            }
            playDefaultSample(samples[0], 0);
        }, false)
    }
    for (var i = 0; i < bsoundImportantButtons.length; i++) {
        bsoundImportantButtons.item(i).addEventListener('click', function () {
            if (audioContext.state === 'suspended') {
                audioContext.resume();
            }
            playImportantSample(samples[1], 0);
        }, false)
    }
    if (hoverSoundsAcitvated) {
        for (var i = 0; i < bsoundHoverButtons.length; i++) {
            bsoundHoverButtons.item(i).addEventListener('mouseover', function () {
                if (audioContext.state === 'suspended') {
                    audioContext.resume();
                }
                playHoverSample(samples[2], 0);
            }, false)
        }
    }

    for (var i = 0; i < bsoundHoldButtons.length; i++) {
        bsoundHoldButtons.item(i).addEventListener('mousedown', function () {
            if (audioContext.state === 'suspended') {
                audioContext.resume();
            }
            playHoldSample(samples[3], 0);
        })
    }

    document.body.addEventListener('mouseup', () => stopHoldSample());
    // document.body.addEventListener('mouseover', (e) => {
    //   if (e.target !== button) stopSampleLoop();
    // });
});





// Load values from localStorage if they exist, 
// otherwise set to default

masterVol.setVolume(parseFloat(localStorage.masterVol == null ? 0.8 : localStorage.masterVol));
masterVol.setVolumeMuted(localStorage.masterVolMuted == null ? false : localStorage.masterVolMuted);

mixerVolDef.setVolume(parseFloat(localStorage.mixerVolDef == null ? 0.8 : localStorage.mixerVolDef));
mixerVolDef.setVolumeMuted(localStorage.mixerVolDefMuted == null ? false : localStorage.mixerVolDefMuted);

mixerVolImp.setVolume(parseFloat(localStorage.mixerVolImp == null ? 0.8 : localStorage.mixerVolImp));
mixerVolImp.setVolumeMuted(localStorage.mixerVolImpMuted == null ? false : localStorage.mixerVolImpMuted);

mixerVolHov.setVolume(parseFloat(localStorage.mixerVolHov == null ? 0.8 : localStorage.mixerVolHov));
mixerVolHov.setVolumeMuted(localStorage.mixerVolHovMuted == null ? false : localStorage.mixerVolHovMuted);

mixerVolHold.setVolume(parseFloat(localStorage.mixerVolHold == null ? 0.8 : localStorage.mixerVolHold));
mixerVolHold.setVolumeMuted(localStorage.mixerVolHoldMuted == null ? false : localStorage.mixerVolHoldMuted);





// setVolSliderVal(volume);

// if (volumeSliderExists) {
//     volumeSlider.value = volume;
// }

if (hoverSoundsAcitvated) {
    if (!mixerVolHov.getVolumeMuted()) {
        modalButton.click();
    }
}

masterMuteSwitch.click();
masterMuteSwitch.click();


