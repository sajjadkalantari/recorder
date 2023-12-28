import {
  Component,
  VERSION,
  ViewChild,
  OnInit,
  ElementRef} from '@angular/core';
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
  @ViewChild('recordedVideo') recordVideoElementRef: ElementRef;
  @ViewChild('video') videoElementRef: ElementRef;
  @ViewChild('timer', { static: true }) timer: ElementRef;


  videoElement: HTMLVideoElement;
  recordVideoElement: HTMLVideoElement;
  mediaRecorder: any;
  recordedBlobs: Blob[];
  downloadUrl: string;
  stream: MediaStream;

  countdown: number = 60; // 1 minute in seconds
  countdownSubscription: Subscription;
  currentState: RecordingState = RecordingState.None;

  recordingState = RecordingState;
  constructor() {}

  async ngOnInit() {
    navigator.mediaDevices
      .getUserMedia({
        video: {
          width: 360
        },
        audio: true
      })
      .then(stream => {
        this.videoElement = this.videoElementRef.nativeElement;
        this.recordVideoElement = this.recordVideoElementRef.nativeElement;

        this.stream = stream;
        this.videoElement.srcObject = this.stream;
      });
  }

  startRecording() {
  
    this.recordedBlobs = [];
    this.countdown = 60; // Reset countdown to 60 seconds
    this.updateCountdown(); // Start countdown
    let options: any = { mimeType: 'video/webm' };

    try {
      this.mediaRecorder = new MediaRecorder(this.stream, options);
    } catch (err) {
      console.log(err);
    }

    this.mediaRecorder.start(); // collect 100ms of data
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
      console.log(this.countdown);
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
    this.recordVideoElement.play();
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
          type: 'video/mp4'
        });
        this.downloadUrl = window.URL.createObjectURL(videoBuffer);
        this.recordVideoElement.src = this.downloadUrl;
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
    this.recordedBlobs = null;
    if (this.countdownSubscription) {
      this.countdownSubscription.unsubscribe();
    }
  }

  private changeRecordingStateTo(state :RecordingState) {
    this.currentState = state;
  }
}
