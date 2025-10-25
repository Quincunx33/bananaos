import { ChangeDetectionStrategy, Component, signal, viewChild, ElementRef, computed, OnDestroy, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { OsInteractionService } from '../../../services/os-interaction.service';

interface Track {
  title: string;
  artist: string;
  albumArt: string;
  src: string;
  isLocal: boolean;
}

@Component({
  selector: 'app-music-player',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './music-player.component.html',
  styleUrls: ['./music-player.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MusicPlayerComponent implements OnDestroy {
  audioEl = viewChild.required<ElementRef<HTMLAudioElement>>('audioEl');
  fileInputEl = viewChild.required<ElementRef<HTMLInputElement>>('fileInputEl');
  private osInteraction = inject(OsInteractionService);
  private destroyRef = inject(DestroyRef);

  playlist = signal<Track[]>([
    { title: 'Cosmic Dream', artist: 'Stellar Drone', albumArt: 'https://picsum.photos/id/1015/200', src: 'https://assets.mixkit.co/music/preview/mixkit-dreaming-big-135.mp3', isLocal: false },
    { title: 'Sunset Serenade', artist: 'Horizon Glow', albumArt: 'https://picsum.photos/id/1039/200', src: 'https://assets.mixkit.co/music/preview/mixkit-a-very-happy-christmas-897.mp3', isLocal: false },
    { title: 'Night Ride', artist: 'Urban Voyager', albumArt: 'https://picsum.photos/id/1043/200', src: 'https://assets.mixkit.co/music/preview/mixkit-cat-walk-371.mp3', isLocal: false },
    { title: 'Oceanic Pulse', artist: 'Deep Current', albumArt: 'https://picsum.photos/id/1053/200', src: 'https://assets.mixkit.co/music/preview/mixkit-hollidays-690.mp3', isLocal: false },
  ]);

  currentTrackIndex = signal(0);
  isPlaying = signal(false);
  currentTime = signal(0);
  duration = signal(0);
  volume = signal(0.75);

  currentTrack = computed(() => this.playlist()[this.currentTrackIndex()]);

  constructor() {
      this.osInteraction.inAppActionRequest
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(action => {
        if (action.appId === 'creative-music' && action.action === 'playMusicTrack') {
          this.playTrackByTitle(action.payload.trackTitle);
        }
      });
  }

  ngOnDestroy() {
    this.playlist().forEach(track => {
      if (track.isLocal && track.src.startsWith('blob:')) {
        URL.revokeObjectURL(track.src);
      }
    });
  }

  playPause() {
    const audio = this.audioEl().nativeElement;
    if (this.isPlaying()) {
      audio.pause();
    } else {
      if (!audio.src) {
        this.playCurrentTrack();
      } else {
        audio.play().catch(e => console.error("Audio playback error:", e));
      }
    }
  }

  nextTrack() {
    this.currentTrackIndex.update(i => (i + 1) % this.playlist().length);
    this.playCurrentTrack();
  }

  prevTrack() {
    this.currentTrackIndex.update(i => (i - 1 + this.playlist().length) % this.playlist().length);
    this.playCurrentTrack();
  }
  
  selectTrack(index: number) {
    this.currentTrackIndex.set(index);
    this.playCurrentTrack();
  }

  private playTrackByTitle(title: string) {
    const titleLower = title.toLowerCase();
    const trackIndex = this.playlist().findIndex(
      track => track.title.toLowerCase().includes(titleLower)
    );

    if (trackIndex > -1) {
      this.selectTrack(trackIndex);
    }
  }

  private playCurrentTrack() {
    const audio = this.audioEl().nativeElement;
    const track = this.currentTrack();
    if (track) {
      audio.src = track.src;
      audio.load();
      audio.play().catch(e => console.error("Audio playback error:", e));
    }
  }
  
  updateTime() {
    this.currentTime.set(this.audioEl().nativeElement.currentTime);
  }

  updateDuration() {
    this.duration.set(this.audioEl().nativeElement.duration);
  }

  seek(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.audioEl().nativeElement.currentTime = +value;
  }

  setVolume(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.volume.set(+value);
    this.audioEl().nativeElement.volume = +value;
  }

  triggerFileUpload() {
    this.fileInputEl().nativeElement.click();
  }

  handleFileUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    const files = Array.from(input.files);
    const newTracks: Track[] = files.map(file => ({
      title: file.name.replace(/\.[^/.]+$/, ""),
      artist: 'Local Upload',
      albumArt: 'https://picsum.photos/seed/music/200',
      src: URL.createObjectURL(file),
      isLocal: true,
    }));

    this.playlist.update(current => [...current, ...newTracks]);
    
    if (newTracks.length > 0) {
        this.selectTrack(this.playlist().length - newTracks.length);
    }

    input.value = '';
  }
}
