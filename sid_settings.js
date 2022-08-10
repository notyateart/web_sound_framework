"use strict";
// TODO: Different UI for testing, maybe with sound designs for themes
// Options for Site Owners
//If activated displays a prompt before site entry to enable the audio context
const hoverSoundsAcitvated = true;
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
// TODO: Connect Different Mixer Channels
// TODO: Find out why clicking mute buttons via script is necessary
// TODO: Hide prompt if user muted Hover Sounds 
var volMaster = new VolumeGroup(0.8, false, "master");
volMaster.updateLocalStorage();
var volDefault = new VolumeGroup(0.8, false, "default");
volDefault.updateLocalStorage();
var volImportant = new VolumeGroup(0.8, false, "important");
volImportant.updateLocalStorage();
var volHover = new VolumeGroup(0.8, false, "hover");
volHover.updateLocalStorage();
var volHold = new VolumeGroup(0.8, false, "hold");
volHold.updateLocalStorage();
let samples;
// Get Elements From DOM
var buttonsDefault = document.querySelectorAll(soundSelectDefault);
var buttonsImportant = document.querySelectorAll(soundSelectImportant);
var buttonsHover = document.querySelectorAll(soundSelectHover);
var buttonsHold = document.querySelectorAll(soundSelectHold);
var settingsMaster = new SettingsGroup();
settingsMaster.Slider = document.getElementById('volSliderMaster');
settingsMaster.SliderValue = document.getElementById('volSliderMasterValue');
settingsMaster.Mute = document.getElementById('volMuteMaster');
var settingsDefault = new SettingsGroup();
settingsDefault.Slider = document.getElementById('volSliderDefault');
settingsDefault.SliderValue = document.getElementById('volSliderDefaultValue');
settingsDefault.Mute = document.getElementById('volMuteDefault');
var settingsImportant = new SettingsGroup();
settingsImportant.Slider = document.getElementById('volSliderImportant');
settingsImportant.SliderValue = document.getElementById('volSliderImportantValue');
settingsImportant.Mute = document.getElementById('volMuteImportant');
var settingsHover = new SettingsGroup();
settingsHover.Slider = document.getElementById('volSliderHover');
settingsHover.SliderValue = document.getElementById('volSliderHoverValue');
settingsHover.Mute = document.getElementById('volMuteHover');
var settingsHold = new SettingsGroup();
settingsHold.Slider = document.getElementById('volSliderHold');
settingsHold.SliderValue = document.getElementById('volSliderHoldValue');
settingsHold.Mute = document.getElementById('volMuteHold');
if (!!settingsMaster.Mute)
    settingsMaster.Mute.checked = volMaster.Muted;
if (!!settingsDefault.Mute)
    settingsDefault.Mute.checked = volDefault.Muted;
if (!!settingsImportant.Mute)
    settingsImportant.Mute.checked = volImportant.Muted;
if (!!settingsHover.Mute)
    settingsHover.Mute.checked = volHover.Muted;
if (!!settingsHold.Mute)
    settingsHold.Mute.checked = volHold.Muted;
addVolumeSettingsEventListeners(settingsMaster, volMaster);
addVolumeSettingsEventListeners(settingsDefault, volDefault);
addVolumeSettingsEventListeners(settingsImportant, volImportant);
addVolumeSettingsEventListeners(settingsHover, volHover);
addVolumeSettingsEventListeners(settingsHold, volHold);
// Sounds
let audioBuffers = audioFilesToBuffers(audioUrls).then((response) => {
    samples = response;
    for (var i = 0; i < buttonsDefault.length; i++) {
        buttonsDefault.item(i).addEventListener('click', function () {
            startAudioContext();
            playSimpleSample(samples[indexDef], gainNodeDefault);
        }, false);
    }
    for (var i = 0; i < buttonsImportant.length; i++) {
        buttonsImportant.item(i).addEventListener('click', function () {
            startAudioContext();
            playSimpleSample(samples[indexImp], gainNodeImportant);
        }, false);
    }
    if (hoverSoundsAcitvated) {
        for (var i = 0; i < buttonsHover.length; i++) {
            buttonsHover.item(i).addEventListener('mouseover', function () {
                startAudioContext();
                playSimpleSample(samples[indexHov], gainNodeHover);
            }, false);
        }
    }
    for (var i = 0; i < buttonsHold.length; i++) {
        buttonsHold.item(i).addEventListener('mousedown', function () {
            startAudioContext();
            playHoldSample(samples[indexHold], gainNodeHold, 0.1, 0);
        });
    }
    document.body.addEventListener('mouseup', () => stopHoldSample());
});
// Load values from localStorage if they exist, 
// otherwise set to default
volMaster.Volume = parseFloat(localStorage.volMaster == undefined ? 0.8 : localStorage.volMaster);
volMaster.Muted = parseStringToBoolean(localStorage.volMasterMuted == undefined ? false : localStorage.volMasterMuted);
volDefault.Volume = parseFloat(localStorage.volDefault == undefined ? 0.8 : localStorage.volDefault);
volDefault.Muted = parseStringToBoolean(localStorage.volDefaultMuted == undefined ? false : localStorage.volDefaultMuted);
volImportant.Volume = parseFloat(localStorage.volImportant == undefined ? 0.8 : localStorage.volImportant);
volImportant.Muted = parseStringToBoolean(localStorage.volImportantMuted == undefined ? false : localStorage.volImportantMuted);
volHover.Volume = parseFloat(localStorage.volHover == undefined ? 0.8 : localStorage.volHover);
volHover.Muted = parseStringToBoolean(localStorage.volHoverMuted == undefined ? false : localStorage.volHoverMuted);
volHold.Volume = parseFloat(localStorage.volHold == undefined ? 0.8 : localStorage.volHold);
volHold.Muted = parseStringToBoolean(localStorage.volHoldMuted == undefined ? false : localStorage.volHoldMuted);
var modalButton = document.getElementById('openModal');
if (hoverSoundsAcitvated) {
    if (!volHover.Muted) {
        if (!!modalButton)
            modalButton.click();
    }
}
clickMuteButtons([settingsMaster, settingsDefault, settingsImportant, settingsHover, settingsHold]);
