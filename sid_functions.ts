// Prerequisites

// Audio Context
// const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioContext = new AudioContext();

function startAudioContext(): void {
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
var holdSampleSource = undefined as AudioBufferSourceNode | undefined;
var holdSampleIsPlaying = false as boolean;
var holdSampleRampTime = 0.1 as number;


class SettingsGroup {
    private slider: HTMLInputElement | undefined
    private sliderValue: HTMLElement | undefined
    private mute: HTMLInputElement | undefined

    constructor() {
        this.slider = undefined;
        this.sliderValue = undefined;
        this.mute = undefined;
    }

    public get Slider(): HTMLInputElement | undefined { return this.slider; }
    public get SliderValue(): HTMLElement | undefined { return this.sliderValue; }
    public get Mute(): HTMLInputElement | undefined { return this.mute; }
    public set Slider(v: HTMLInputElement | undefined) { this.slider = v; }
    public set SliderValue(v: HTMLElement | undefined) { this.sliderValue = v; }
    public set Mute(v: HTMLInputElement | undefined) { this.mute = v; }
}

type VolumeType = "master" | "default" | "important" | "hover" | "hold";

// VolumeGroup Class

class VolumeGroup {
    private volume: number;
    private muted: boolean;
    private type: VolumeType;

    constructor(volume: number, muted: boolean, type: VolumeType) {
        this.volume = volume;
        this.muted = muted;
        this.type = type;
    }


    public get Volume(): number { return this.volume; }
    public set Volume(v: number) { this.volume = v; }
    public get Muted(): boolean { return this.muted; }
    public set Muted(v: boolean) { this.muted = v; }

    public getCurrentVol() { return this.volume * Number(!this.muted) }

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

async function singleAudioFileToBuffer(url: string): Promise<AudioBuffer> {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    return audioBuffer;
}

async function audioFilesToBuffers(urls: string[]): Promise<AudioBuffer[]> {
    const audioBuffers = [] as AudioBuffer[];

    for (let url of urls) {
        const sample = await singleAudioFileToBuffer(url) as AudioBuffer;
        audioBuffers.push(sample);
    }

    return audioBuffers;
}

function playSimpleSample(audioBuffer: AudioBuffer, gainChannel: GainNode) {
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(gainChannel).connect(gainNodeMaster).connect(audioContext.destination);
    source.start(0);
}

function playHoldSample(audioBuffer: AudioBuffer, gainChannel: GainNode, rampTime: number, delayTime: number) {
    holdSampleRampTime = rampTime;
    if (holdSampleSource != undefined) {
        stopHoldSample();
    }
    holdSampleSource = audioContext.createBufferSource() as AudioBufferSourceNode;
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
        } else {
            holdSampleSource.stop(0);
            holdSampleIsPlaying = false;
        }
    }
}



// Optional Volume Settings


function addVolumeSettingsEventListeners(settingsGroup: SettingsGroup, volumeGroup: VolumeGroup) {
    if (!!settingsGroup.Slider) {
        settingsGroup.Slider.addEventListener('input', function () {
            if (!!settingsGroup.Slider) volumeGroup.Volume = Number(settingsGroup.Slider.value);
            if (!!settingsGroup.SliderValue) settingsGroup.SliderValue.innerHTML = String(volumeGroup.Volume);
            volumeGroup.updateLocalStorage();
        });
    }

    if (!!settingsGroup.Mute) {
        settingsGroup.Mute.addEventListener('change', function () {
            if (this.checked) volumeGroup.Muted = true;
            else volumeGroup.Muted = false;
            volumeGroup.updateLocalStorage();
        });
    }
}


function clickMuteButtons(s: SettingsGroup[]) {
    for (let x of s) {
        if (x != undefined && x.Mute != undefined) {
            x.Mute.click();
            x.Mute.click();
        }
    }
}

type BooleanString = "true" | "false";

function parseStringToBoolean(s: BooleanString): boolean {
    if (s === "false") {
        return false;
    } else {
        return true;
    }
}