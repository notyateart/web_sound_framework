// TODO: Different UI for testing, maybe with sound designs for themes








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
var indexDef = 0;
var indexImp = 1;
var indexHov = 2;
var indexHold = 3;

// Change these values to CSS selectors (usually classes) provided by your CSS framework
// or use the default ones and apply them manually
// separate multiple selectors by comma
var soundSelectDefault = ".btn-close, .btn-primary, .btn-secondary, .nav-item";
var soundSelectImportant = ".btn-warning, .btn-success, .btn-danger";
var soundSelectHover = ".bsoundHover";
var soundSelectHold = "input[type='range']";

audioContext.createMediaElementSource();



// TODO: Connect Different Mixer Channels
// TODO: Find out why clicking mute buttons via script is necessary
// TODO: Hide prompt if user muted Hover Sounds 


// Setup Prerequisites
// AudioContext, GainNode, Volume


const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioContext = new AudioContext();

const gainNodeMaster = audioContext.createGain();
gainNodeMaster.gain = 0.8;
const gainNodeDefault = audioContext.createGain();
gainNodeDefault.gain = 0.8;
const gainNodeImportant = audioContext.createGain();
gainNodeImportant.gain = 0.8;
const gainNodeHover = audioContext.createGain();
gainNodeHover.gain = 0.8;
const gainNodeHold = audioContext.createGain();
gainNodeHold.gain = 0.8;

const gainNodeFadeInOut = audioContext.createGain();

class VolumeGroup {
    volume = 0.8;
    muted = false;
    type;

    constructor(volume, muted, type) {
        this.volume = volume
        this.muted = muted;
        this.type = type;
    }

    setVolume(volume) {
        this.volume = volume;
        this.updateLocalStorage();
    }

    setVolumeMuted(muted) {
        this.muted = muted;
        this.updateLocalStorage();
    }

    getVolume() { return this.volume }
    getVolumeMuted() { return this.muted }
    getCurrentVol() { return this.volume * this.muted }

    updateLocalStorage() {
        switch (this.type) {
            case "master":
                localStorage.volMaster = this.volume;
                localStorage.volMasterMuted = this.muted;
                gainNodeMaster.gain.setTargetAtTime(this.volume * !this.muted, 0, 0);
                break;
            case "default":
                localStorage.volDefault = this.volume;
                localStorage.volDefaultMuted = this.muted;
                gainNodeDefault.gain.setTargetAtTime(this.volume * !this.muted, 0, 0);
                break;
            case "important":
                localStorage.volImportant = this.volume;
                localStorage.volImportantMuted = this.muted;
                gainNodeImportant.gain.setTargetAtTime(this.volume * !this.muted, 0, 0);
                break;
            case "hover":
                localStorage.volHover = this.volume;
                localStorage.volHoverMuted = this.muted;
                gainNodeHover.gain.setTargetAtTime(this.volume * !this.muted, 0, 0);
                break;
            case "hold":
                localStorage.volHold = this.volume;
                localStorage.volHoldMuted = this.muted;
                gainNodeHold.gain.setTargetAtTime(this.volume * !this.muted, 0, 0);
                break;
        }
    }
}


var volMaster = new VolumeGroup(0.8, false, "master");
var volDefault = new VolumeGroup(0.8, false, "default");
var volImportant = new VolumeGroup(0.8, false, "important");
var volHover = new VolumeGroup(0.8, false, "hover");
var volHold = new VolumeGroup(0.8, false, "hold");


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
    source.connect(gainNodeDefault).connect(gainNodeMaster).connect(audioContext.destination);
    source.start(0);
}

function playImportantSample(audioBuffer) {
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(gainNodeImportant).connect(gainNodeMaster).connect(audioContext.destination);
    source.start(0);
}

function playHoverSample(audioBuffer) {
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(gainNodeHover).connect(gainNodeMaster).connect(audioContext.destination);
    source.start(0);
}

var loopSampleSource = undefined;

function playHoldSample(audioBuffer, time) {
    if (loopSampleSource != undefined) {
        loopSampleSource.stop(0);
        loopSampleSource = undefined;
        gainNodeFadeInOut.gain.setTargetAtTime(0, 0, 0);
    }
    loopSampleSource = audioContext.createBufferSource();
    loopSampleSource.buffer = audioBuffer;
    loopSampleSource.connect(gainNodeFadeInOut).connect(gainNodeMaster).connect(audioContext.destination);
    gainNodeFadeInOut.gain.setTargetAtTime(1, 0, time + 0.1);
    loopSampleSource.start(time);
    loopSampleSource.loop = true;
}

// first we check if loopSampleSource even exists, there probably are a few cases where it doesn't
// to prevent clicks we first fade out the sound
// I have tried to manully set the loopSampleSource variable to undefined with a timeout
// but source.stop() deletes the object anyways therefore it has to be the last command
function stopHoldSample() {
    if (loopSampleSource != undefined) {
        gainNodeFadeInOut.gain.setTargetAtTime(0, 0, 0.1);
        loopSampleSource.stop(0.3);
    }
}


// Get Elements From DOM

var buttonsDefault = document.querySelectorAll(soundSelectDefault);
var buttonsImportant = document.querySelectorAll(soundSelectImportant);
var buttonsHover = document.querySelectorAll(soundSelectHover);
var buttonsHold = document.querySelectorAll(soundSelectHold);


function getVolumeSettingsDOM (sliderID, sliderValueID, muteID) {
    var slider = document.getElementById(sliderID);
    var sliderV = document.getElementById(sliderValueID);
    var mute = document.getElementById(muteID);
    return {"slider": slider, "sliderValue":sliderV, "mute":mute};
}


var settingsMaster = getVolumeSettingsDOM('volSliderMaster', 'volSliderMasterValue', 'volMuterMaster');

var settingsDefault = getVolumeSettingsDOM('volSliderDefault', 'volSliderValueDefault', 'volMuteDefault');
var settingsImportant = getVolumeSettingsDOM('volSliderImportant', 'volSliderValueImportant', 'volMuteImportant');
var settingsHover = getVolumeSettingsDOM('volSliderHover', 'volSliderValueHover', 'volMuteHover');
var settingsHold = getVolumeSettingsDOM('volSliderHold', 'volSliderValueHold', 'volMuteHold');

if (!!settingsMaster["mute"]) settingsMaster["mute"].checked = volMaster.getVolumeMuted();
if (!!settingsDefault["mute"]) settingsDefault["mute"].checked = volDefault.getVolumeMuted();
if (!!settingsImportant["mute"]) settingsImportant["mute"].checked = volImportant.getVolumeMuted();
if (!!settingsHover["mute"]) settingsHover["mute"].checked = volHover.getVolumeMuted();
if (!!settingsHold["mute"]) settingsHold["mute"].checked = volHold.getVolumeMuted();


var modalButton = document.getElementById('openModal');




// Execution

function addSettingsEventListeners(settingsGroup, volumeGroup) {
    if (!!settingsGroup['slider']) {
        settingsGroup['slider'].addEventListener('input', function () {
            volumeGroup.setVolume(settingsGroup['slider'].value);
            if (!!settingsGroup['sliderValue']) {
                settingsGroup['sliderValue'].innerHTML = volumeGroup.getVolume();
            }
        });
    }

    if (!!settingsGroup['mute']) {
        settingsGroup['mute'].addEventListener('change', function () {
            if (this.checked) volumeGroup.setVolumeMuted(true);
            else volumeGroup.setVolumeMuted(false);
        });
    }
}

addSettingsEventListeners(settingsMaster, volMaster);
addSettingsEventListeners(settingsDefault, volDefault);
addSettingsEventListeners(settingsImportant, volImportant);
addSettingsEventListeners(settingsHover, volHover);
addSettingsEventListeners(settingsHold, volHold);

// if (!!settingsMaster['slider']) {
//     settingsMaster['slider'].addEventListener('input', function () {
//         volMaster.setVolume(settingsMaster[slider].value);
//         if (settingsMaster['sliderValue']) {
//             settingsMaster['sliderValue'].innerHTML = volMaster.getVolume();
//         }
//     });
// }

// if (!!settingsDefault['slider']) {
//     settingsDefault['slider'].addEventListener('input', function () {
//         volDefault.setVolume(settingsDefault['slider'].value);
//         if (!!settingsDefault['sliderValue']) {
//             settingsDefault['sliderValue'].innerHTML = volDefault.getVolume();
//         }
//     });
// }

// if (!!settingsImportant['slider']) {
//     settingsImportant['slider'].addEventListener('input', function () {
//         volImportant.setVolume(settingsImportant['slider'].value);
//         if (!!settingsImportant['sliderValue']) {
//             settingsImportant['sliderValue'].innerHTML = volImportant.getVolume();
//         }
//     });
// }

// if (!!settingsHover['slider']) {
//     settingsHover['slider'].addEventListener('input', function () {
//         volHover.setVolume(settingsHover['slider'].value);
//         if (!!settingsHover['sliderValue']) {
//             settingsHover['sliderValue'].innerHTML = volHover.getVolume();
//         }
//     });
// }

// if (!!settingsHold['slider']) {
//     settingsHold['slider'].addEventListener('input', function () {
//         volHold.setVolume(settingsHold['slider'].value);
//         if (!!settingsHold['sliderValue']) {
//             settingsHold['sliderValue'].innerHTML = volHold.getVolume();
//         }
//     });
// }

// volMasterMute.addEventListener('change', function () {
//     if (this.checked) { volMaster.setVolumeMuted(true) }
//     else { volMaster.setVolumeMuted(false) }
// });

// mixerVolMuteDefault.addEventListener('change', function () {
//     if (this.checked) { volDefault.setVolumeMuted(true) }
//     else { volDefault.setVolumeMuted(false) }
// });

// mixerVolMuteImportant.addEventListener('change', function () {
//     if (this.checked) { volImportant.setVolumeMuted(true) }
//     else { volImportant.setVolumeMuted(false) }
// });

// mixerVolMuteHover.addEventListener('change', function () {
//     if (this.checked) { volHover.setVolumeMuted(true) }
//     else { volHover.setVolumeMuted(false) }
// });

// mixerVolMuteHold.addEventListener('change', function () {
//     if (this.checked) { volHold.setVolumeMuted(true) }
//     else { volHold.setVolumeMuted(false) }
// });

function startAudioContext() {
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
}


// Sounds

audioBuffers = audioFilesToBuffers(audioUrls).then((response) => {
    samples = response;
    for (var i = 0; i < buttonsDefault.length; i++) {
        buttonsDefault.item(i).addEventListener('click', function () {
            startAudioContext();
            playDefaultSample(samples[indexDef]);
        }, false)
    }
    for (var i = 0; i < buttonsImportant.length; i++) {
        buttonsImportant.item(i).addEventListener('click', function () {
            startAudioContext();
            playImportantSample(samples[indexImp]);
        }, false)
    }
    if (hoverSoundsAcitvated) {
        for (var i = 0; i < buttonsHover.length; i++) {
            buttonsHover.item(i).addEventListener('mouseover', function () {
                startAudioContext();
                playHoverSample(samples[indexHov]);
            }, false)
        }
    }

    for (var i = 0; i < buttonsHold.length; i++) {
        buttonsHold.item(i).addEventListener('mousedown', function () {
            startAudioContext();
            playHoldSample(samples[indexHold], 0);
        })
    }

    document.body.addEventListener('mouseup', () => stopHoldSample());
});





// Load values from localStorage if they exist, 
// otherwise set to default

volMaster.setVolume(parseFloat(localStorage.volMaster == null ? 0.8 : localStorage.volMaster));
volMaster.setVolumeMuted(localStorage.volMasterMuted == null ? false : localStorage.volMasterMuted);

volDefault.setVolume(parseFloat(localStorage.volDefault == null ? 0.8 : localStorage.volDefault));
volDefault.setVolumeMuted(localStorage.volDefaultMuted == null ? false : localStorage.volDefaultMuted);

volImportant.setVolume(parseFloat(localStorage.volImportant == null ? 0.8 : localStorage.volImportant));
volImportant.setVolumeMuted(localStorage.volImportantMuted == null ? false : localStorage.volImportantMuted);

volHover.setVolume(parseFloat(localStorage.volHover == null ? 0.8 : localStorage.volHover));
volHover.setVolumeMuted(localStorage.volHoverMuted == null ? false : localStorage.volHoverMuted);

volHold.setVolume(parseFloat(localStorage.volHold == null ? 0.8 : localStorage.volHold));
volHold.setVolumeMuted(localStorage.volHoldMuted == null ? false : localStorage.volHoldMuted);





// setVolSliderVal(volume);

// if (volumeSliderExists) {
//     volumeSlider.value = volume;
// }

if (hoverSoundsAcitvated) {
    if (!volHover.getVolumeMuted()) {
        modalButton.click();
    }
}

settingsMaster['mute'].click();
settingsMaster['mute'].click();
settingsDefault['mute'].click();
settingsDefault['mute'].click();
settingsImportant['mute'].click();
settingsImportant['mute'].click();
settingsHover['mute'].click();
settingsHover['mute'].click();
settingsHold['mute'].click();
settingsHold['mute'].click();


