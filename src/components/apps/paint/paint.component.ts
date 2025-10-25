import { ChangeDetectionStrategy, Component, ElementRef, ViewChild, AfterViewInit, signal, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../services/notification.service';

@Component({
  selector: 'app-paint',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './paint.component.html',
  styleUrls: ['./paint.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaintComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('colorPicker') colorPickerRef!: ElementRef<HTMLInputElement>;

  private notificationService = inject(NotificationService);

  colors = ['#000000', '#ef4444', '#22c55e', '#3b82f6', '#eab308', '#ffffff'];
  color = signal('#000000');
  brushSize = signal(5);
  tool = signal('brush'); // 'brush' or 'eraser'

  private ctx!: CanvasRenderingContext2D;
  private isDrawing = false;
  private parentObserver!: ResizeObserver;

  ngAfterViewInit() {
    const canvas = this.canvasRef.nativeElement;
    const parent = canvas.parentElement!;
    const context = canvas.getContext('2d');
    if (!context) return;
    this.ctx = context;

    // Set initial background to white
    const setWhiteBackground = () => {
      this.ctx.fillStyle = '#ffffff';
      this.ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    const resizeCanvas = () => {
      // Save current drawing
      const imageData = this.ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
      
      // Restore drawing
      setWhiteBackground();
      this.ctx.putImageData(imageData, 0, 0);

      this.ctx.lineCap = 'round';
    };
    
    // Set initial canvas size and background
    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight;
    setWhiteBackground();
    this.ctx.lineCap = 'round';

    this.parentObserver = new ResizeObserver(resizeCanvas);
    this.parentObserver.observe(parent);

    canvas.addEventListener('mousedown', this.startDrawing.bind(this));
    canvas.addEventListener('mousemove', this.draw.bind(this));
    canvas.addEventListener('mouseup', this.stopDrawing.bind(this));
    canvas.addEventListener('mouseleave', this.stopDrawing.bind(this));
  }
  
  ngOnDestroy(): void {
      if (this.parentObserver) {
          this.parentObserver.disconnect();
      }
  }

  private startDrawing(event: MouseEvent) {
    this.isDrawing = true;
    this.ctx.beginPath();
    this.ctx.moveTo(event.offsetX, event.offsetY);
  }

  private draw(event: MouseEvent) {
    if (!this.isDrawing) return;

    this.ctx.lineWidth = this.brushSize();
    if(this.tool() === 'brush') {
        this.ctx.strokeStyle = this.color();
    } else { // Eraser
        this.ctx.strokeStyle = '#ffffff'; // Erase to white
    }
    
    this.ctx.lineTo(event.offsetX, event.offsetY);
    this.ctx.stroke();
  }

  private stopDrawing() {
    this.isDrawing = false;
    this.ctx.closePath();
  }

  setColor(newColor: string) {
    this.color.set(newColor);
    this.tool.set('brush');
    if (this.colorPickerRef) {
        this.colorPickerRef.nativeElement.value = newColor;
    }
  }

  selectCustomColor(event: Event) {
    const newColor = (event.target as HTMLInputElement).value;
    this.color.set(newColor);
    this.tool.set('brush');
  }

  setBrushSize(size: string) {
    this.brushSize.set(Number(size));
  }
  
  setTool(tool: 'brush' | 'eraser') {
      this.tool.set(tool);
  }

  clearCanvas() {
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(0, 0, this.canvasRef.nativeElement.width, this.canvasRef.nativeElement.height);
  }

  saveCanvas() {
    const canvas = this.canvasRef.nativeElement;
    const link = document.createElement('a');
    link.download = `banana-os-paint-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    this.notificationService.show({ appId: 'paint', title: 'Paint', body: 'Image saved successfully!', type: 'success' });
  }
}
