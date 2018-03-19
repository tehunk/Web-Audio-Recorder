"use strict";

const player = document.getElementById('audioPlayer'); // audio
const play = document.getElementById('play'); // play button
const record = document.getElementById('record'); // record button
const recplay = document.getElementById('playRecorded');
const submitDiv = document.getElementById('submitDiv');
const submit = document.getElementById('submit'); // submit button
const bpm = 85;
var audioURL;

record.disabled = false; //disable buttons
submit.disabled = false;

recplay.onclick = () => {
  player.src = audioURL;
  player.play();
}

play.onclick = () => {
  record.disabled = true;
  submit.disabled = true;
  player.play();
  player.addEventListener('ended', () => {record.disabled = false;});
};

record.onclick = () => {
  play.disabled = true;
  submit.disabled = true;
  const recording_duration = Math.ceil(player.duration);
  let constraints = {audio: true, video: false};
  navigator.mediaDevices.getUserMedia(constraints)
  .then( (stream) => {
    countdown(bpm);
    //cowntdown() fires an event to the record button when it's done
    record.addEventListener('countdownFinished',
      () => recordUser(stream, recording_duration));
    //recordUser() also fires an event to the record button when done
    record.addEventListener('recordFinished',
      (data) => {
        audioURL = URL.createObjectURL(data.detail);
        submitDiv.hidden = false;
        console.log(data.detail);
      });
  })
  .catch(
    (err) => { console.log('The following error occurred: ' + err); }
  );
};

function recordUser(stream, duration) {
  let recordedChunks = [];
  let mimeTypes = ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus'];
  let options = {};
  var mediaRecorder;
  for (let i=0; i<mimeTypes.length; i++) {
    if (MediaRecorder.isTypeSupported(mimeTypes[i])) {
      options.mimeType = mimeTypes[i];
      break;
    }
  }
  if (options.mimeType !== "undefined") {
    mediaRecorder = new MediaRecorder(stream, options);
  } else {
    return Error("Recording is not supported on this browser.");
  }
  mediaRecorder.start(1000);
  console.log("mediaRecorder started!")
  setTimeout( () => {
    mediaRecorder.stop();
  },
  duration*1000);
  mediaRecorder.onstop = () => {
    var blob = new Blob(recordedChunks, {'type' : options.mimeType });
    recordedChunks = [];
    document.getElementById('countdown').innerHTML = "Recording finished!";
    let evt = new CustomEvent('recordFinished', {detail: blob});
    record.dispatchEvent(evt);
  };
  mediaRecorder.ondataavailable = (event) => {
    console.log('Recorded chunk of size ' + event.data.size + "B");
    console.log('type: ' + event.data.type);
    recordedChunks.push(event.data);
  };
}

function countdown(bpm) {
  var count = 4;
  var bpmToMS = 60/bpm*1000;
  //var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  var audioCtx = new AudioContext();
  console.log(audioCtx.sampleRate);
  var oscillatorNode = new OscillatorNode(audioCtx, {
    type: 'sine',
    frequency: 1500,
  });
  var gainNode = audioCtx.createGain();
  oscillatorNode.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
  oscillatorNode.start(0);
  var myInterval = setInterval( () => {
    document.getElementById('countdown').innerHTML = count;
    gainNode.gain.setValueAtTime(1, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime+0.1);
    count--;
    if (count < 0) {
      countAtZero();
    }
  }, bpmToMS);
  var countAtZero = () => {
    let evt = new Event('countdownFinished');
    record.dispatchEvent(evt);
    document.getElementById('countdown').innerHTML = "GO!";
    clearInterval(myInterval);
    oscillatorNode.stop();
    audioCtx.close();
  };
}
