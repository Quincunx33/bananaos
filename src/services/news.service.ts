import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, map, catchError } from 'rxjs';

// Interface for NewsAPI article
export interface NewsArticle {
  source: { id: string | null; name: string };
  author: string | null;
  title: string;
  description: string | null;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  content: string | null;
}

// Interface for the RSS2JSON response
interface Rss2JsonItem {
  title: string;
  pubDate: string;
  link: string;
  thumbnail: string;
  description: string;
  author: string;
}

interface Rss2JsonResponse {
  status: string;
  feed: {
    title: string;
  };
  items: Rss2JsonItem[];
}

@Injectable({ providedIn: 'root' })
export class NewsService {
  private http = inject(HttpClient);
  // Using BBC World News RSS feed via a public converter. This does not require an API key.
  private rssToJsonUrl = 'https://api.rss2json.com/v1/api.json?rss_url=http%3A%2F%2Ffeeds.bbci.co.uk%2Fnews%2Fworld%2Frss.xml';

  getNewsForCurrentUser(): Observable<{ source: string; articles: NewsArticle[] }> {
    return this.http.get<Rss2JsonResponse>(this.rssToJsonUrl).pipe(
      map(response => {
        if (response.status !== 'ok') {
          throw new Error('Failed to fetch news from RSS feed.');
        }

        const articles: NewsArticle[] = response.items.map(item => ({
          source: { id: null, name: response.feed.title },
          author: item.author || null,
          title: item.title,
          description: this.stripHtml(item.description),
          url: item.link,
          urlToImage: item.thumbnail || null,
          publishedAt: item.pubDate,
          content: this.stripHtml(item.description)
        }));

        return {
          source: response.feed.title,
          articles: articles,
        };
      }),
      catchError(err => {
        console.error('Error fetching or parsing RSS news feed. Falling back to sample data.', err);
        return of({
          source: 'Worldwide (Sample)',
          articles: this.getSampleArticles()
        });
      })
    );
  }

  // Helper to strip HTML tags from description using DOMParser for safety.
  private stripHtml(html: string): string {
    if (typeof DOMParser === 'undefined') {
        // Fallback for non-browser environments if ever needed
        return html.replace(/<[^>]*>/g, '');
    }
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || "";
  }

  // Sample articles are kept as a last-resort fallback in case the public API fails.
  private getSampleArticles(): NewsArticle[] {
    return [
      {
        source: { id: null, name: 'Banana News' },
        author: 'AI Reporter',
        title: 'Angular v20+ Brings Zoneless Architecture to the Forefront',
        description: 'The latest version of Angular is making waves in the developer community with its new zoneless change detection strategy, promising better performance and simpler application logic.',
        url: '#',
        urlToImage: 'https://picsum.photos/seed/angular/400/200',
        publishedAt: new Date().toISOString(),
        content: null
      },
      {
        source: { id: null, name: 'TechCrunch (Sample)' },
        author: 'Jane Doe',
        title: 'Web-Based Operating Systems: The Future of Computing?',
        description: 'Projects like Banana OS are pushing the boundaries of what can be achieved in a web browser, simulating a full desktop experience with impressive fidelity and functionality.',
        url: '#',
        urlToImage: 'https://picsum.photos/seed/tech/400/200',
        publishedAt: new Date(Date.now() - 3600 * 1000 * 2).toISOString(), // 2 hours ago
        content: null
      },
      {
        source: { id: null, name: 'The Verge (Sample)' },
        author: 'John Smith',
        title: 'The Rise of AI Assistants: From Simple Chatbots to OS Co-pilots',
        description: 'Integrated AI assistants like Banana Copilot are changing how users interact with their devices, offering natural language control over complex operating system tasks.',
        url: '#',
        urlToImage: 'https://picsum.photos/seed/ai/400/200',
        publishedAt: new Date(Date.now() - 3600 * 1000 * 5).toISOString(), // 5 hours ago
        content: null
      },
      {
        source: { id: null, name: 'Gamer Weekly (Sample)' },
        author: 'Pixel Pete',
        title: 'Retro Gaming Makes a Comeback in Browser-Based Environments',
        description: 'Classic games like Minesweeper and Solitaire are finding new life within web-based OS simulators, attracting both nostalgic players and a new generation of gamers.',
        url: '#',
        urlToImage: 'https://picsum.photos/seed/gaming/400/200',
        publishedAt: new Date(Date.now() - 3600 * 1000 * 12).toISOString(), // 12 hours ago
        content: null
      }
    ];
  }
}
