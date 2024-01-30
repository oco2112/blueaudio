var audioCtx;
var sine_enabled = true;

//starting with sine wave
var currentWaveform = 'sine';

//setting ASDR values of gain node
const attackTime = 0.6;
const decayTime = 0.05;
const attackLevel = 0.2;
const sustainLevel = 0.5;
const releaseTime = 0.3;

//sphere
let sphere = document.querySelector('.sphere');
let activeNotesCount = 0;


//initialize audio context
document.addEventListener("DOMContentLoaded", function (event) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)

    //this will control the volume of all notes
    globalGain = audioCtx.createGain();
    globalGain.gain.setValueAtTime(0.8, audioCtx.currentTime);
    globalGain.connect(audioCtx.destination);

});

//map keyboard frequencies 
const keyboardFrequencyMap = {
    '90': 261.625565300598634,  //Z - C
    '83': 277.182630976872096, //S - C#
    '88': 293.664767917407560,  //X - D
    '68': 311.126983722080910, //D - D#
    '67': 329.627556912869929,  //C - E
    '86': 349.228231433003884,  //V - F
    '71': 369.994422711634398, //G - F#
    '66': 391.995435981749294,  //B - G
    '72': 415.304697579945138, //H - G#
    '78': 440.000000000000000,  //N - A
    '74': 466.163761518089916, //J - A#
    '77': 493.883301256124111,  //M - B
    '81': 523.251130601197269,  //Q - C
    '50': 554.365261953744192, //2 - C#
    '87': 587.329535834815120,  //W - D
    '51': 622.253967444161821, //3 - D#
    '69': 659.255113825739859,  //E - E
    '82': 698.456462866007768,  //R - F
    '53': 739.988845423268797, //5 - F#
    '84': 783.990871963498588,  //T - G
    '54': 830.609395159890277, //6 - G#
    '89': 880.000000000000000,  //Y - A
    '55': 932.327523036179832, //7 - A#
    '85': 987.766602512248223,  //U - B
}

//add listeners to keys
window.addEventListener('keydown', keyDown, false);
window.addEventListener('keyup', keyUp, false);

activeOscillators = {}

function keyDown(event) {
    const key = (event.detail || event.which).toString();
    if (keyboardFrequencyMap[key] && !activeOscillators[key]) {
        playNote(key);
    }
}

function keyUp(event) {
    const key = (event.detail || event.which).toString();
    if (keyboardFrequencyMap[key] && activeOscillators[key]) {
        releaseNote(activeOscillators[key]);
        delete activeOscillators[key];
    }


}

function releaseNote(note) {
    const { osc, gainNode } = note;

    // refining release phase using the releaseTime 
    const releaseStartTime = audioCtx.currentTime;
    const releaseEndTime = releaseStartTime + releaseTime;

    gainNode.gain.setValueAtTime(gainNode.gain.value, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + releaseTime);

    // stop oscillator after the release phase
    osc.stop(releaseEndTime);

    activeNotesCount--;
    updateSphere();
}



//playing note 
function playNote(key) {


    const osc = audioCtx.createOscillator();
    osc.frequency.setValueAtTime(keyboardFrequencyMap[key], audioCtx.currentTime);
    osc.type = currentWaveform;

    //you will need a new gain node for each node to control the adsr of that note
    const gainNode = audioCtx.createGain();

    //pass audio wave of osc into gain node
    osc.connect(gainNode).connect(globalGain);

    //apply ASDR values to gain node
    //attack
    gainNode.gain.exponentialRampToValueAtTime(attackLevel, audioCtx.currentTime + attackTime);
    //decay
    gainNode.gain.exponentialRampToValueAtTime(sustainLevel, audioCtx.currentTime + attackTime + decayTime);
    //no ramping for sustain
    //we set release in the releseNote method

    osc.start();

    //add both the osc and its respective gainNode to list
    activeOscillators[key] = { osc, gainNode };

    limitGain();

    activeNotesCount++;
    updateSphere();
}

function limitGain() {
    // add up the total gain from each individual gain node
    const totalGain = Object.values(activeOscillators)
        .reduce((acc, { gainNode }) => acc + gainNode.gain.value, 0);

    // adjust each gain to ensure the total gain doesn't exceed 0.8
    if (totalGain > 0.8) {
        for (const activeKey in activeOscillators) {
            const { gainNode } = activeOscillators[activeKey];
            // adjust each gain based on the total gain
            gainNode.gain.value *= 0.8 / totalGain;
        }
    }
}


// ref to dropdown
const waveformSelect = document.getElementById('waveform_select');

// adding listener to dropdown
waveformSelect.addEventListener('change', function () {
    // update  waveform variable when the selection changes
    currentWaveform = this.value;
    //log value
    console.log('Waveform value:', currentWaveform);
});


function updateSphere() {
    const scaleFactor = 1 + (activeNotesCount * 0.1); //adjusting scaling of notes
    sphere.style.transform = `scale3d(${scaleFactor}, ${scaleFactor}, ${scaleFactor})`; //transforming based on scale factor
    sphere.style.backgroundColor = `rgba(0, 0, 0, ${0.2 + activeNotesCount * 0.15})`; // adjusting color 
}


// //setup demo

// const playButton = document.querySelector('button');

// playButton.addEventListener('click', function () {
//     if (!audioCtx) {
//         audioCtx = new (window.AudioContext || window.webkitAudioContext)
//         let osc = audioCtx.createOscillator();
//         osc.connect(audioCtx.destination);
//         osc.start();
//     }
// })