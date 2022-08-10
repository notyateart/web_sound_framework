"use strict";
// Prerequisites
// Audio Context
// const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioContext = new AudioContext();
function startAudioContext() {
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
}
// Gain Nodes
const gainNodeMaster = audioContext.createGain();
gainNodeMaster.gain.value = 0.8;
const gainNodeDefault = audioContext.createGain();
gainNodeDefault.gain.value = 0.8;
const gainNodeImportant = audioContext.createGain();
gainNodeImportant.gain.value = 0.8;
const gainNodeHover = audioContext.createGain();
gainNodeHover.gain.value = 0.8;
const gainNodeHold = audioContext.createGain();
gainNodeHold.gain.value = 0.8;
var gainNodeFadeInOut = audioContext.createGain();
// Hold Sample
var holdSampleSource = undefined;
var holdSampleIsPlaying = false;
var holdSampleRampTime = 0.1;
class SettingsGroup {
    constructor() {
        this.slider = undefined;
        this.sliderValue = undefined;
        this.mute = undefined;
    }
    get Slider() { return this.slider; }
    get SliderValue() { return this.sliderValue; }
    get Mute() { return this.mute; }
    set Slider(v) { this.slider = v; }
    set SliderValue(v) { this.sliderValue = v; }
    set Mute(v) { this.mute = v; }
}
// VolumeGroup Class
class VolumeGroup {
    constructor(volume, muted, type) {
        this.volume = volume;
        this.muted = muted;
        this.type = type;
    }
    get Volume() { return this.volume; }
    set Volume(v) { this.volume = v; }
    get Muted() { return this.muted; }
    set Muted(v) { this.muted = v; }
    getCurrentVol() { return this.volume * Number(!this.muted); }
    updateLocalStorage() {
        switch (this.type) {
            case "master":
                localStorage.volMaster = this.volume;
                localStorage.volMasterMuted = this.muted;
                gainNodeMaster.gain.setTargetAtTime(this.volume * Number(!this.muted), 0, 0);
                break;
            case "default":
                localStorage.volDefault = this.volume;
                localStorage.volDefaultMuted = this.muted;
                gainNodeDefault.gain.setTargetAtTime(this.volume * Number(!this.muted), 0, 0);
                break;
            case "important":
                localStorage.volImportant = this.volume;
                localStorage.volImportantMuted = this.muted;
                gainNodeImportant.gain.setTargetAtTime(this.volume * Number(!this.muted), 0, 0);
                break;
            case "hover":
                localStorage.volHover = this.volume;
                localStorage.volHoverMuted = this.muted;
                gainNodeHover.gain.setTargetAtTime(this.volume * Number(!this.muted), 0, 0);
                break;
            case "hold":
                localStorage.volHold = this.volume;
                localStorage.volHoldMuted = this.muted;
                gainNodeHold.gain.setTargetAtTime(this.volume * Number(!this.muted), 0, 0);
                break;
        }
    }
}
// Sample loading and playing
async function singleAudioFileToBuffer(url) {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    return audioBuffer;
}
async function audioFilesToBuffers(urls) {
    const audioBuffers = [];
    for (let url of urls) {
        const sample = await singleAudioFileToBuffer(url);
        audioBuffers.push(sample);
    }
    return audioBuffers;
}
function playSimpleSample(audioBuffer, gainChannel) {
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(gainChannel).connect(gainNodeMaster).connect(audioContext.destination);
    source.start(0);
}
function playHoldSample(audioBuffer, gainChannel, rampTime, delayTime) {
    holdSampleRampTime = rampTime;
    if (holdSampleSource != undefined) {
        stopHoldSample();
    }
    holdSampleSource = audioContext.createBufferSource();
    holdSampleSource.buffer = audioBuffer;
    holdSampleSource.connect(gainNodeFadeInOut).connect(gainChannel).connect(gainNodeMaster).connect(audioContext.destination);
    gainNodeFadeInOut.gain.setTargetAtTime(1, 0, delayTime + rampTime);
    holdSampleSource.start(delayTime);
    holdSampleSource.loop = true;
    holdSampleIsPlaying = true;
}
function stopHoldSample() {
    if (holdSampleSource != undefined) {
        if (holdSampleIsPlaying) {
            gainNodeFadeInOut.gain.setTargetAtTime(0, 0, holdSampleRampTime);
            holdSampleSource.stop(holdSampleRampTime + 0.1);
            holdSampleIsPlaying = false;
        }
        else {
            holdSampleSource.stop(0);
            holdSampleIsPlaying = false;
        }
    }
}
// Optional Volume Settings
function addVolumeSettingsEventListeners(settingsGroup, volumeGroup) {
    if (!!settingsGroup.Slider) {
        settingsGroup.Slider.addEventListener('input', function () {
            if (!!settingsGroup.Slider)
                volumeGroup.Volume = Number(settingsGroup.Slider.value);
            if (!!settingsGroup.SliderValue)
                settingsGroup.SliderValue.innerHTML = String(volumeGroup.Volume);
            volumeGroup.updateLocalStorage();
        });
    }
    if (!!settingsGroup.Mute) {
        settingsGroup.Mute.addEventListener('change', function () {
            if (this.checked)
                volumeGroup.Muted = true;
            else
                volumeGroup.Muted = false;
            volumeGroup.updateLocalStorage();
        });
    }
}
function clickMuteButtons(s) {
    for (let x of s) {
        if (x != undefined && x.Mute != undefined) {
            x.Mute.click();
            x.Mute.click();
        }
    }
}
function parseStringToBoolean(s) {
    if (s === "false") {
        return false;
    }
    else {
        return true;
    }
}
