import {
  Component,
  VERSION,
  ViewChild,
  OnInit,
  ElementRef
} from '@angular/core';
import { interval, Subscription } from 'rxjs';

enum RecordingState {
  None = 'none',
  Recording = 'recording',
  Finished = 'finished'
}


declare var MediaRecorder: any;
@Component({
  selector: 'my-app',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  @ViewChild('video') videoElementRef: ElementRef;
  @ViewChild('timer', { static: true }) timer: ElementRef;


  videoElement: HTMLVideoElement;
  mediaRecorder: any;
  recordedBlobs: Blob[];
  downloadUrl: string;
  stream: MediaStream;
  countdown: number = 60; // 1 minute in seconds
  countdownSubscription: Subscription;
  currentState: RecordingState = RecordingState.None;
  recordedVideoSize: number;
  recordingState = RecordingState;

  constructor() { }

  async ngOnInit() {
    navigator.mediaDevices
      .getUserMedia({
        video: {
          // width: 200,
          // height: 100,
          // frameRate: 30,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          // frameRate: 120
        }
      })
      .then(stream => {
        this.videoElement = this.videoElementRef.nativeElement;
        this.stream = stream;
        this.videoElement.srcObject = this.stream;
      });
  }

  startRecording() {

    this.recordedBlobs = [];
    this.countdown = 60; // Reset countdown to 60 seconds
    this.updateCountdown(); // Start countdown
    let options: any = {
      mimeType: this.getValidMimeTypeForDevice(),
      audioBitsPerSecond: 32000, // Low bit rate for voice or simple audio
      videoBitsPerSecond: 500000, // Low bit rate for low-motion video
    };

    try {
      this.mediaRecorder = new MediaRecorder(this.stream, options);
    } catch (err) {
      console.log(err);
      alert(err);
    }

    this.mediaRecorder.start();
    this.changeRecordingStateTo(RecordingState.Recording);
    this.onDataAvailableEvent();
    this.onStopRecordingEvent();
  }

  stopRecording() {
    if (this.countdownSubscription) {
      this.countdownSubscription.unsubscribe(); // Stop the countdown
    }
    this.mediaRecorder.stop();
    this.changeRecordingStateTo(RecordingState.Finished);
    console.log('Recorded Blobs: ', this.recordedBlobs);
  }

  updateCountdown() {
    this.countdownSubscription = interval(1000).subscribe(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        this.stopRecording(); // Stop recording after 1 minute
      }
      this.timer.nativeElement.innerText = this.countdown;
    });
  }

  playRecording() {
    if (!this.recordedBlobs || !this.recordedBlobs.length) {
      console.log('cannot play.');
      return;
    }
    this.videoElement.play();
  }

  onDataAvailableEvent() {
    try {
      this.mediaRecorder.ondataavailable = (event: any) => {
        if (event.data && event.data.size > 0) {
          this.recordedBlobs.push(event.data);
        }
      };
    } catch (error) {
      console.log(error);
    }
  }

  onStopRecordingEvent() {
    try {
      this.mediaRecorder.onstop = (event: Event) => {
        const videoBuffer = new Blob(this.recordedBlobs, {
          type: this.getValidMimeTypeForDevice()
        });

        this.downloadUrl = window.URL.createObjectURL(videoBuffer);
        this.videoElement.srcObject = null;
        this.videoElement.src = this.downloadUrl;
        if (this.countdownSubscription) {
          this.countdownSubscription.unsubscribe(); // Stop the countdown
        }

      };
    } catch (error) {
      console.log(error);
    }
  }

  submitRecording() {
    // Handle the logic to submit the recording, e.g., send to server
    console.log('Recording submitted!');
    // Reset UI and state

    this.calculateSizeOfVideo();
    this.resetRecordingState();
  }

  deleteRecording() {
    // Handle the logic to delete the recorded video
    console.log('Recording deleted!');
    // Reset UI and state
    this.resetRecordingState();
  }

  resetRecordingState() {
    this.changeRecordingStateTo(RecordingState.None);
    this.videoElement.src = null;
    this.videoElement.srcObject = this.stream;
    this.countdown = 60;
    this.recordedBlobs = null;
    if (this.countdownSubscription) {
      this.countdownSubscription.unsubscribe();
    }
  }

  private changeRecordingStateTo(state: RecordingState) {
    this.currentState = state;
  }

  private getValidMimeTypeForDevice() {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const mimeType = isIOS ? 'video/mp4' : 'video/webm';
    return mimeType;
  }

  private calculateSizeOfVideo() {
    // Calculate total size of all Blobs in bytes
    const totalSizeInBytes = this.recordedBlobs.reduce((acc, blob) => acc + blob.size, 0);

    // Convert bytes to megabytes
    const totalSizeInMegabytes = totalSizeInBytes / (1024 * 1024);
    alert("size of the video is " + totalSizeInMegabytes.toFixed(2) + " MB")
  }
}
