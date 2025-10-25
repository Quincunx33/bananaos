import { Component, input, output, effect, viewChild, ElementRef, Renderer2, inject, signal } from '@angular/core';
import { AppWindow } from '../../models/window.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-window',
  templateUrl: './window.component.html',
  imports: [CommonModule],
  host: {
    '[style.width.px]': 'window().size.width',
    '[style.height.px]': 'window().size.height',
    '[style.transform]': "'translate(' + window().position.x + 'px, ' + window().position.y + 'px)'",
    '[style.zIndex]': 'window().zIndex',
    '[class.transition-all]': '!isDragging()',
    '[class.duration-200]': '!isDragging()',
    '[class.opacity-0]': 'window().state === "minimized"',
    '[class.scale-95]': 'window().state === "minimized"',
    '[class.shadow-2xl]': 'isActive()',
    '[class.shadow-lg]': '!isActive()',
    '(mousedown)': 'onFocus.emit()',
    'class': 'absolute top-0 left-0 bg-gray-800 border border-gray-700/50 rounded-lg shadow-lg overflow-hidden flex flex-col',
  }
})
export class WindowComponent {
  window = input.required<AppWindow>();
  isActive = input.required<boolean>();
  
  close = output<void>();
  minimize = output<void>();
  maximize = output<void>();
  onFocus = output<void>();
  drag = output<{ x: number, y: number }>();

  isDragging = signal(false);
  private renderer = inject(Renderer2);
  private dragUnlistenMouseMove!: () => void;
  private dragUnlistenMouseUp!: () => void;
  
  headerEl = viewChild.required<ElementRef<HTMLDivElement>>('headerEl');

  constructor() {
    effect(() => {
        const header = this.headerEl().nativeElement;
        header.addEventListener('mousedown', this.dragMouseDown);
    });
  }
  
  dragMouseDown = (e: MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return; // Don't drag on buttons
    e.preventDefault();
    this.isDragging.set(true);

    const initialX = e.clientX;
    const initialY = e.clientY;
    const initialWinX = this.window().position.x;
    const initialWinY = this.window().position.y;
    
    this.dragUnlistenMouseMove = this.renderer.listen('document', 'mousemove', (event: MouseEvent) => {
      event.preventDefault();
      const dx = event.clientX - initialX;
      const dy = event.clientY - initialY;
      this.drag.emit({ x: initialWinX + dx, y: initialWinY + dy });
    });

    this.dragUnlistenMouseUp = this.renderer.listen('document', 'mouseup', () => {
      this.isDragging.set(false);
      this.dragUnlistenMouseMove();
      this.dragUnlistenMouseUp();
    });
  };
}