"use strict";

const player = document.getElementById('audioPlayer'); // audio
const play = document.getElementById('play'); // play button
const record = document.getElementById('record'); // record button
const submit = document.getElementById('submit'); // submit button
const submitDiv = document.getElementById('submitDiv');
const bpm = 85;
var recordedBlob;
var audioURL;

//disable buttons
record.disabled = true;
submit.disabled = true;

/*
When the play button is clicked, Reference.mp3 is played
When the music is finished, the record button is enabled
*/
play.onclick = () => {
  record.disabled = true;
  submit.disabled = true;
  player.play();
  player.addEventListener('ended', () => {record.disabled = false;});
};

/*
When the record button is clicked, it calls countdown() and recordUser().
Then the blob is created for submission.
Successful recording enables the submit button and shows the div.
*/
record.onclick = () => {
  play.disabled = true;
  submit.disabled = true;
  const REC_DURATION = Math.ceil(player.duration);
  const constraints = {audio: true, video: false};
  navigator.mediaDevices.getUserMedia(constraints)
  .then( (stream) => {
    countdown(bpm);
    record.addEventListener('countdownFinished',
      () => recordUser(stream, REC_DURATION));
    record.addEventListener('recordFinished',
      (data) => {
        //audioURL = URL.createObjectURL(data.detail);
        recordedBlob = data.detail;
        submitDiv.hidden = false;
        submit.disabled = false;
      });
  })
  .catch(
    (err) => { console.log('The following error occurred: ' + err); }
  );
};

/*
The submit button creates a formdata containing the recorded blob.
It then sends the file using post method.
The server side is not implemented here.
*/
submit.onclick = () => {
  //let pcmBuffer = convertToPCM();
  var oReq = new XMLHttpRequest();
  var url = "http://thiswebsiteisundefined.com/request";
  var formData = new FormData();
  formData.append('recordedSound', recordedBlob, 'output.ogg');
  oReq.open("POST", url, true);
  oReq.setRequestHeader("Content-Type", "multipart/form-data");
  oReq.send(formData);
  oReq.onload = (e) => {
    console.log("it won't be uploaded anyway.");
  };
  oReq.onerror = (e) => {
    console.log(e);
  };
  //URL.revokeObjectURL(audioURL);
};

/*
The recordUser() takes mediastream and duration as inputs.
Currently, there is no way to set specific framerates nor codecs.
Firefox and Chrome currently support opus codec only.
The framerate seems to be either 44100 or 44000 depending on platforms.
recordUser() fires an event to the record button when done
*/
function recordUser(stream, duration) {
  let recordedChunks = [];
  //webm container: chrome, ogg container: firefox
  let mimeTypes = ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus'];
  let options = {};
  for (let i=0; i<mimeTypes.length; i++) {
    if (MediaRecorder.isTypeSupported(mimeTypes[i])) {
      options.mimeType = mimeTypes[i];
      break;
    }
  }
  if (options.mimeType !== "undefined") {
    var mediaRecorder = new MediaRecorder(stream, options);
  } else {
    return Error("No mimeType is supported.");
  }
  mediaRecorder.start(1000);
  setTimeout( () => {
    mediaRecorder.stop();
  },
  duration*1000);
  mediaRecorder.onstop = () => {
    let blob = new Blob(recordedChunks, {'type' : options.mimeType });
    recordedChunks = [];
    document.getElementById('countdown').innerHTML = "Recording finished!";
    let evt = new CustomEvent('recordFinished', {detail: blob});
    record.dispatchEvent(evt);
  };
  mediaRecorder.ondataavailable = (event) => {
    document.getElementById('countdown').innerHTML = "Recording in process...";
    recordedChunks.push(event.data);
  };
}

/*
The countdonw() takes bpm value as an input.
It uses an oscillatorNode and a gainNode to beep like a metronome.
It also prints on HTML the number of counts.
It fires an event to the record button when it's done.
*/
function countdown(bpm) {
  const bpmToMS = 60/bpm*1000;
  let count = 4;
  //Currently, setting the sample rate is not working.
  let audioCtx = new AudioContext({sampleRate: 44100});
  let oscillatorNode = new OscillatorNode(audioCtx, {
    type: 'sine',
    frequency: 1500,
  });
  let gainNode = audioCtx.createGain();
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

/*
This function is not used in this demo, but implemented for the future.
Because modern browsers don't support custom framerates or pcm recording yet,
Opus codec has to be decoded for pcm data.
It returns a mono arraybuffer containing float32 PCM.
*/
function convertToPCM () {
  URL.revokeObjectURL(audioURL);
  const REC_DURATION = Math.ceil(player.duration);
  const NUM_CHANNEL = 1;
  const SAMPLERATE = 44100;
  let offlineCtxOptions = {
    numberOfChannels: NUM_CHANNEL,
    length: NUM_CHANNEL*SAMPLERATE*REC_DURATION,
    sampleRate: SAMPLERATE
  }
  const offlineCtx = new OfflineAudioContext(offlineCtxOptions);
  let reader = new FileReader();
  reader.readAsArrayBuffer(recordedBlob);
  reader.onload = () => {
    offlineCtx.decodeAudioData(reader.result)
    .then( (decodedData)=> {
      let source = offlineCtx.createBufferSource();
      source.buffer = decodedData;
      source.connect(offlineCtx.destination);
      source.start();
      offlineCtx.startRendering()
      .then( (renderedBuffer) => {
        return renderedBuffer.getChannelData(0);
      })
      .catch(
        (err) => { console.log('The following error occurred: ' + err); }
      );
    })
    .catch(
      (err) => { console.log('The following error occurred: ' + err); }
    );
  };
}
