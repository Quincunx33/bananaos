import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';

interface Stock {
  ticker: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  sparklineData: number[];
}

@Component({
  selector: 'app-stocks',
  standalone: true,
  imports: [CommonModule, DecimalPipe],
  templateUrl: './stocks.component.html',
  styleUrls: ['./stocks.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StocksComponent implements OnInit, OnDestroy {
  watchlist = signal<Stock[]>([
    { ticker: 'AAPL', name: 'Apple Inc.', price: 172.25, change: 1.5, changePercent: 0.88, sparklineData: this.generateRandomData(150, 200) },
    { ticker: 'GOOGL', name: 'Alphabet Inc.', price: 135.60, change: -0.75, changePercent: -0.55, sparklineData: this.generateRandomData(120, 150) },
    { ticker: 'MSFT', name: 'Microsoft Corp.', price: 340.10, change: 2.1, changePercent: 0.62, sparklineData: this.generateRandomData(320, 360) },
    { ticker: 'AMZN', name: 'Amazon.com, Inc.', price: 138.40, change: -1.2, changePercent: -0.86, sparklineData: this.generateRandomData(130, 150) },
    { ticker: 'TSLA', name: 'Tesla, Inc.', price: 250.70, change: 5.3, changePercent: 2.16, sparklineData: this.generateRandomData(230, 280) },
  ]);

  private updateInterval: any;

  ngOnInit() {
    this.updateInterval = setInterval(() => this.updateStockPrices(), 2000);
  }

  ngOnDestroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }

  private updateStockPrices() {
    this.watchlist.update(stocks => 
      stocks.map(stock => {
        const volatility = 0.02; // Max 2% change per tick
        const priceChange = (Math.random() - 0.5) * stock.price * volatility;
        const newPrice = Math.max(10, stock.price + priceChange);
        const newChange = newPrice - (stock.price - stock.change); // Change from start of session
        const newChangePercent = (newChange / (stock.price - stock.change)) * 100;
        
        const newSparklineData = [...stock.sparklineData.slice(1), newPrice];

        return {
          ...stock,
          price: newPrice,
          change: newChange,
          changePercent: newChangePercent,
          sparklineData: newSparklineData,
        };
      })
    );
  }

  generateSparklinePath(data: number[]): string {
    const width = 100;
    const height = 30;
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min === 0 ? 1 : max - min;
    const step = width / (data.length - 1);

    let path = `M 0,${height - ((data[0] - min) / range) * height}`;
    data.forEach((point, index) => {
      if (index > 0) {
        const x = index * step;
        const y = height - ((point - min) / range) * height;
        path += ` L ${x.toFixed(2)},${y.toFixed(2)}`;
      }
    });
    return path;
  }
  
  private generateRandomData(min: number, max: number, length = 30): number[] {
      const data = [];
      for(let i = 0; i < length; i++) {
          data.push(Math.random() * (max - min) + min);
      }
      return data;
  }
}
