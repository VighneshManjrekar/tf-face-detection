import {
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  viewChild,
} from '@angular/core';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import '@tensorflow/tfjs-backend-cpu';
import * as blazeface from '@tensorflow-models/blazeface';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  title = 'tf-fd';

  @ViewChild('video', { static: true })
  videoElement!: ElementRef<HTMLVideoElement>;
  isModelLoaded: boolean = false;
  isCameraOpen: boolean = false;
  detectedFaces: number = 0;

  private stream: MediaStream | null = null;
  private model: blazeface.BlazeFaceModel | null = null;
  private modelInterval: any;

  async ngOnInit() {
    try {
      await tf.setBackend('webgl');
      await tf.ready();
      console.log('Using WebGL backend');
    } catch (err) {
      console.warn('WebGL backend failed, falling back to CPU:', err);
      await tf.setBackend('cpu');
      await tf.ready();
      console.log('Using CPU backend');
    } finally {
      this.model = await blazeface.load();
      this.isModelLoaded = true;
      console.log('Model loaded');
    }
  }

  async startCamera() {
    if (this.isCameraOpen) {
      this.stopCamera();
    }
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      this.videoElement.nativeElement.srcObject = this.stream;
      this.isCameraOpen = true;
      this.videoElement.nativeElement.addEventListener(
        'playing',
        this.detectFaces.bind(this)
      );
    } catch (error) {
      console.error(error);
    }
  }

  async detectFaces() {
    if (this.modelInterval) {
      clearInterval(this.modelInterval);
    }

    try {
      this.modelInterval = setInterval(async () => {
        const faces = await this.model!.estimateFaces(
          this.videoElement.nativeElement,
          false
        );
        this.detectedFaces = faces.length;
      }, 100);
    } catch (error) {
      console.error(error);
    }
  }

  stopCamera() {
    if (this.stream) {
      clearInterval(this.modelInterval);
      this.stream.getTracks().forEach((track) => track.stop());
      this.videoElement.nativeElement.srcObject = null;
      this.isCameraOpen = false;
    }
    this.videoElement.nativeElement.removeEventListener(
      'playing',
      this.detectFaces.bind(this)
    );
  }
}
