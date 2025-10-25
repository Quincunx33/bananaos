import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { NewsArticle, NewsService } from '../../../services/news.service';

@Component({
  selector: 'app-news-feed',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './news-feed.component.html',
  styleUrls: ['./news-feed.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewsFeedComponent implements OnInit {
  private newsService = inject(NewsService);

  articles = signal<NewsArticle[]>([]);
  status = signal<'loading' | 'loaded' | 'error'>('loading');
  errorMsg = signal('');
  source = signal('');

  ngOnInit(): void {
    this.newsService.getNewsForCurrentUser().subscribe({
      next: (data) => {
        // Filter out articles that have been removed by the source
        this.articles.set(data.articles.filter(a => a.title && a.title !== '[Removed]'));
        this.source.set(data.source);
        this.status.set('loaded');
      },
      error: (err: Error) => {
        this.status.set('error');
        this.errorMsg.set(err.message || 'Could not fetch news. The service may be unavailable.');
        console.error(err);
      }
    });
  }
}
