# Web-Audio-API-Record

Javascript application that can play music and record a user using a microphone. This application has been tested on Firefox and Chrome. It doesn't use any libraries.

* The application should show two buttons
* The first button will be labeled "Play" and when clicked, will play the attached example file ('Reference.mp3')
* The second button will be labeled "Record". It cannot be clicked until the playback of the first file has finished.
* When clicked, the record button should start and show a 4 beat countdown (4.. 3.. 2.. 1..) at 85 BPM (the tempo of the example file).
* Record the user for the duration of the example file.
* When the recording has finished, show a third button "Submit".
* When the submit button is clicked, perform a POST query to a server endpoint with the recording encoded as a wave file.
* The endpoint has not been implemented.
