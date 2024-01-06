import {
  Component,
  ViewChild,
  OnInit,
  ElementRef,
  OnDestroy
} from '@angular/core';
import { interval, Subscription } from 'rxjs';

// Enum to represent different recording states
enum RecordingState {
  None = 'none',
  Recording = 'recording',
  Finished = 'finished'
}

const DEFAULT_COUNTDOWN = 60; // 1 minute
const AUDIO_BIT_RATE = 32000;
const VIDEO_BIT_RATE = 500000;

@Component({
  selector: 'my-app',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {

  @ViewChild('video') videoElementRef: ElementRef;
  @ViewChild('timer', { static: true }) timer: ElementRef;

  private videoElement: HTMLVideoElement;
  private mediaRecorder: MediaRecorder;
  private recordedBlobs: Blob[] = [];
  private downloadUrl: string;
  private stream: MediaStream;
  private countdownSubscription: Subscription;

  countdown: number = DEFAULT_COUNTDOWN;
  currentState: RecordingState = RecordingState.None;
  recordingState = RecordingState;

  constructor() { }

  ngOnInit() {
    this.initMediaStream();
  }

  ngOnDestroy() {
    this.stopMediaStream();
  }

  private initMediaStream() {
    navigator.mediaDevices
      .getUserMedia({
        video: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      })
      .then(stream => {
        this.videoElement = this.videoElementRef.nativeElement;
        this.stream = stream;
        this.videoElement.srcObject = stream;
        this.videoElement.muted = true;
      });
  }

  startRecording() {
    this.recordedBlobs = [];
    this.countdown = DEFAULT_COUNTDOWN;
    this.updateCountdown();

    const options: any = {
      mimeType: this.getValidMimeTypeForDevice(),
      audioBitsPerSecond: AUDIO_BIT_RATE,
      videoBitsPerSecond: VIDEO_BIT_RATE,
    };

    try {
      this.mediaRecorder = new MediaRecorder(this.stream, options);
    } catch (err) {
      console.error(err);
      alert(err);
    }

    this.mediaRecorder.start();
    this.changeRecordingStateTo(RecordingState.Recording);
    this.onDataAvailableEvent();
    this.onStopRecordingEvent();
  }

  stopRecording() {
    this.clearCountdown();
    this.mediaRecorder.stop();
    this.changeRecordingStateTo(RecordingState.Finished);
    console.log('Recorded Blobs: ', this.recordedBlobs);
  }

  updateCountdown() {
    this.countdownSubscription = interval(1000).subscribe(() => {
      this.countdown--;
      if (this.countdown <= 0)
        this.stopRecording();

      this.updateTimerDisplay();
    });
  }

  playRecording() {
    if (!this.recordedBlobs || !this.recordedBlobs.length) {
      console.log('Cannot play.');
      return;
    }
    this.videoElement.play();
  }

  onDataAvailableEvent() {
    try {
      this.mediaRecorder.ondataavailable = (event: any) => {
        if (event.data && event.data.size > 0) 
          this.recordedBlobs.push(event.data);
        
      };
    } catch (error) {
      console.error(error);
    }
  }

  onStopRecordingEvent() {
    try {
      this.mediaRecorder.onstop = (event: Event) => {
        this.handleRecordingStop();
      };
    } catch (error) {
      console.error(error);
    }
  }

  private handleRecordingStop() {
    const videoBuffer = new Blob(this.recordedBlobs, {
      type: this.getValidMimeTypeForDevice()
    });

    this.downloadUrl = window.URL.createObjectURL(videoBuffer);
    this.updateVideoElement();
    this.clearCountdown();
  }

  submitRecording() {
    console.log('Recording submitted!');
    this.calculateSizeOfVideo();
    this.resetRecordingState();
  }

  deleteRecording() {
    console.log('Recording deleted!');
    this.resetRecordingState();
  }

  resetRecordingState() {
    this.changeRecordingStateTo(RecordingState.None);
    this.resetVideoElement();
    this.clearCountdown();
    this.recordedBlobs = null;
    this.timer.nativeElement.innerText = "";
  }

  private changeRecordingStateTo(state: RecordingState) {
    this.currentState = state;
  }

  private getValidMimeTypeForDevice() {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    return isIOS ? 'video/mp4' : 'video/webm';
  }

  private calculateSizeOfVideo() {
    const totalSizeInBytes = this.recordedBlobs.reduce((acc, blob) => acc + blob.size, 0);
    const totalSizeInMegabytes = totalSizeInBytes / (1024 * 1024);
    alert("Size of the video is " + totalSizeInMegabytes.toFixed(2) + " MB");
  }

  private resetVideoElement() {
    this.videoElement.src = null;
    this.videoElement.srcObject = this.stream;
    this.videoElement.muted = true;
    this.videoElement.controls = false;
  }

  private updateVideoElement() {
    this.videoElement.srcObject = null;
    this.videoElement.src = this.downloadUrl;
    this.videoElement.muted = false;
    this.videoElement.controls = true;
  }

  private clearCountdown() {
    if (this.countdownSubscription)
      this.countdownSubscription.unsubscribe();
  }

  private stopMediaStream() {
    if (this.stream) 
      this.stream.getTracks().forEach(track => track.stop());
    
  }

  private updateTimerDisplay() {
    const timerElement = this.timer.nativeElement;
  
    if (this.countdown <= 10) {
      timerElement.innerText = this.formatTime(this.countdown);
      timerElement.style.color = 'red';
    } else if (this.countdown <= 30) {
      timerElement.innerText = this.formatTime(this.countdown);
      timerElement.style.color = 'orange';
    } else {
      timerElement.innerText = this.formatTime(this.countdown);
      timerElement.style.color = 'green';
    }
  }

  private formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    const formattedMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;
    const formattedSeconds = remainingSeconds < 10 ? `0${remainingSeconds}` : `${remainingSeconds}`;
    return `${formattedMinutes}:${formattedSeconds}`;
  }
}
