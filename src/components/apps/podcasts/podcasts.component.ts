import { ChangeDetectionStrategy, Component, signal, viewChild, ElementRef, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs';

interface Episode {
  title: string;
  pubDate: string;
  duration: string;
  src: string;
}

interface PodcastInfo {
  title: string;
  author: string;
  coverArt: string;
  description: string;
}

@Component({
  selector: 'app-podcasts',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './podcasts.component.html',
  styleUrls: ['./podcasts.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PodcastsComponent implements OnInit {
  private http = inject(HttpClient);
  audioEl = viewChild.required<ElementRef<HTMLAudioElement>>('audioEl');

  podcastInfo = signal<PodcastInfo | null>(null);
  episodes = signal<Episode[]>([]);
  
  status = signal<'loading' | 'loaded' | 'error'>('loading');
  errorMsg = signal('');

  currentEpisode = signal<Episode | null>(null);
  isPlaying = signal(false);

  ngOnInit() {
    this.fetchPodcastFeed();
  }
  
  private fetchPodcastFeed() {
    this.status.set('loading');
    const CORS_PROXY = 'https://corsproxy.io/?';
    const RSS_URL = 'https://lexfridman.com/feed/podcast/';

    this.http.get(CORS_PROXY + RSS_URL, { responseType: 'text' })
      .pipe(finalize(() => {
        if (this.status() === 'loading') {
          this.status.set('loaded');
        }
      }))
      .subscribe({
        next: (xmlText) => {
          this.parseRssFeed(xmlText);
        },
        error: (err) => {
          console.error("Error fetching podcast feed. This might be a CORS issue with the proxy or a network problem.", err);
          this.status.set('error');
          this.errorMsg.set('Could not load podcast feed. The external service may be temporarily unavailable.');
        }
      });
  }

  private parseRssFeed(xmlText: string) {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, "application/xml");
      
      const channel = xmlDoc.querySelector("channel");
      if (!channel) throw new Error("Invalid RSS feed: <channel> not found.");

      const info: PodcastInfo = {
        title: channel.querySelector("title")?.textContent || 'Unknown Podcast',
        author: channel.querySelector("itunes\\:author")?.textContent || 'Unknown Author',
        coverArt: channel.querySelector("image > url")?.textContent || 'https://picsum.photos/id/10/400',
        description: channel.querySelector("description")?.textContent || ''
      };
      this.podcastInfo.set(info);

      const items = Array.from(xmlDoc.querySelectorAll("item"));
      const episodesList: Episode[] = items.map(item => ({
        title: item.querySelector("title")?.textContent || 'Untitled Episode',
        pubDate: item.querySelector("pubDate")?.textContent || '',
        duration: item.querySelector("itunes\\:duration")?.textContent || 'N/A',
        src: item.querySelector("enclosure")?.getAttribute('url') || ''
      })).filter(ep => ep.src); // Only include episodes with a valid audio source

      this.episodes.set(episodesList);
      this.status.set('loaded');
    } catch (e) {
      console.error("Error parsing RSS feed:", e);
      this.status.set('error');
      this.errorMsg.set('Failed to parse the podcast feed data.');
    }
  }

  playEpisode(episode: Episode) {
    const audio = this.audioEl().nativeElement;
    if (this.currentEpisode()?.src === episode.src && this.isPlaying()) {
        audio.pause();
    } else {
        this.currentEpisode.set(episode);
        audio.src = episode.src;
        audio.load();
        audio.play().catch(e => console.error("Audio playback error:", e));
    }
  }

  togglePlayPause() {
    if (!this.currentEpisode()) return;
    const audio = this.audioEl().nativeElement;
    if (this.isPlaying()) {
      audio.pause();
    } else {
      audio.play().catch(e => console.error("Audio playback error:", e));
    }
  }
}