

import { ChangeDetectionStrategy, Component, ElementRef, ViewChild, OnDestroy, AfterViewInit, inject } from '@angular/core';
import { signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../services/notification.service';

@Component({
  selector: 'app-camera',
  templateUrl: './camera.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Fix: Added imports to make this component standalone, as required by its usage in app.component.
  imports: [CommonModule],
})
export class CameraComponent implements AfterViewInit, OnDestroy {
  @ViewChild('video') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvas') canvasElement!: ElementRef<HTMLCanvasElement>;
  
  private notificationService = inject(NotificationService);
  error = signal<string | null>(null);
  stream: MediaStream | null = null;
  photoPreview = signal<string | null>(null);

  ngAfterViewInit() {
    this.startCamera();
  }

  async startCamera() {
    try {
      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
      }
      this.stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      this.videoElement.nativeElement.srcObject = this.stream;
      this.videoElement.nativeElement.play();
      this.error.set(null);
    } catch (err) {
      console.error("Camera error:", err);
      this.error.set('Could not access camera. Please grant permission.');
    }
  }

  capture() {
    const video = this.videoElement.nativeElement;
    const canvas = this.canvasElement.nativeElement;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (context) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/png');
      this.photoPreview.set(dataUrl);
    }
  }
  
  retake() {
    this.photoPreview.set(null);
  }

  save() {
    const dataUrl = this.photoPreview();
    if (dataUrl) {
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `banana-os-capture-${Date.now()}.png`;
      link.click();
      this.notificationService.show({ appId: 'camera', title: 'Camera', body: 'Photo saved successfully!', type: 'success' });
      this.retake();
    }
  }

  ngOnDestroy() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
  }
}
