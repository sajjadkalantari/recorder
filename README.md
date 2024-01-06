# Recorder Angular Component

This Angular component allows users to record video with audio and provides features such as countdown, playback, submission, and deletion.

## Installation

1. Clone the repository or copy the code into your Angular project.
2. Make sure to have Angular and RxJS installed in your project.

```bash
npm install @angular/core
npm install rxjs
```
# Features
1. Start Recording: Begin capturing video with audio.
2. Stop Recording: End the recording session and generate a playable video.
3. Play Recording: Playback the recorded video.
4. Submit Recording: Log a successful recording submission.
5. Delete Recording: Discard the recorded video.
6. Countdown Display: Shows a countdown timer during the recording session.
7. Dynamic Timer Color: Changes the timer color based on the remaining time.

# Dependencies
- Angular Core (@angular/core)
- RxJS (rxjs)

# Configuration
- DEFAULT_COUNTDOWN: Default recording duration in seconds.
- AUDIO_BIT_RATE: Audio bitrate for recording.
- VIDEO_BIT_RATE: Video bitrate for recording.
