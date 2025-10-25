

import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DesktopStateService } from '../../../services/desktop-state.service';
import { AppWindow } from '../../../models/window.model';
import { WINDOW_CONTEXT } from '../../../injection-tokens';

interface GraphNode {
  id: string;
  label: string;
  icon: string;
  type: 'system' | 'app' | 'file';
  x: number;
  y: number;
}

interface GraphLink {
  source: string;
  target: string;
}

// Map apps without explicit file contexts to a virtual binary
const APP_FILE_ASSOCIATIONS: { [key: string]: string } = {
  'terminal': '/System/bin/terminal',
  'settings': '/System/apps/settings.app',
  'browser': '/System/apps/browser.app',
  'calculator': '/System/apps/calculator.app',
  'weather': '/System/apps/weather.app',
  'camera': '/System/drivers/camera.sys',
  'file-explorer': '/System/apps/explorer.app',
  'store': '/System/apps/store.app',
  'paint': '/System/apps/paint.app',
  'notes': '/System/apps/notes.app',
  'system-monitor': '/System/apps/sysmon.app',
  'calendar': '/System/apps/calendar.app',
  'clock': '/System/apps/clock.app',
  'kanban': '/System/apps/kanban.app',
  'maps': '/System/apps/maps.app',
  'pdf-reader': '/System/apps/pdfreader.app',
  'translator': '/System/apps/translator.app',
  'banana-copilot': '/System/core/copilot.service',
  'music-player': '/System/apps/music.app',
  'markdown-editor': '/System/apps/markdown.app',
  'podcasts': '/System/apps/podcasts.app',
  'chess': '/System/games/chess.app',
  'solitaire': '/System/games/solitaire.app',
  'minesweeper': '/System/games/minesweeper.app',
  'sudoku': '/System/games/sudoku.app',
  'puzzle-blocks': '/System/games/blocks.app',
  '2048': '/System/games/2048.app',
  'word-finder': '/System/games/wordfinder.app',
  'recipe-book': '/System/apps/recipes.app',
  'stocks': '/System/apps/stocks.app',
  'fitness-tracker': '/System/apps/fitness.app',
  'ebook-reader': '/System/apps/ebook.app',
  'news-feed': '/System/apps/news.app',
};


@Component({
  selector: 'app-system-monitor',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './system-monitor.component.html',
  styleUrls: ['./system-monitor.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SystemMonitorComponent {
  private desktopStateService = inject(DesktopStateService);
  
  private readonly viewWidth = 800;
  private readonly viewHeight = 500;

  systemGraph = computed(() => {
    const openWindows = this.desktopStateService.openWindows();
    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];

    // 1. Add System Root Node
    const systemNode: GraphNode = {
      id: 'system-kernel',
      label: 'Banana OS Kernel',
      icon: 'fas fa-microchip',
      type: 'system',
      x: this.viewWidth / 2,
      y: 50
    };
    nodes.push(systemNode);

    // 2. Add App Nodes
    const appCount = openWindows.length;
    const appSpacing = this.viewWidth / (appCount + 1);

    openWindows.forEach((win, index) => {
      const appNode: GraphNode = {
        id: win.id,
        label: win.title,
        icon: win.icon,
        type: 'app',
        x: appSpacing * (index + 1),
        y: 200
      };
      nodes.push(appNode);
      links.push({ source: systemNode.id, target: appNode.id });

      // 3. Add File Nodes
      let associatedFilePath: string | null = null;
      try {
        // The injector might not exist on window restore, so wrap in try-catch
        associatedFilePath = win.injector?.get(WINDOW_CONTEXT, null)?.filePath;
      } catch {}

      if (!associatedFilePath) {
        associatedFilePath = APP_FILE_ASSOCIATIONS[win.appId] || null;
      }

      if (associatedFilePath) {
        const fileName = associatedFilePath.split('/').pop() || 'unknown';
        const fileNode: GraphNode = {
          id: `${win.id}-file-${fileName}`,
          label: fileName,
          icon: this.getIconForFile(fileName),
          type: 'file',
          x: appNode.x,
          y: 350
        };
        nodes.push(fileNode);
        links.push({ source: appNode.id, target: fileNode.id });
      }
    });

    return { nodes, links };
  });

  graphLinksWithPositions = computed(() => {
    const { nodes, links } = this.systemGraph();
    // Fix: Explicitly type the Map to ensure correct type inference for its values.
    const nodeMap: Map<string, GraphNode> = new Map(nodes.map(n => [n.id, n]));

    return links.map(link => {
      const source = nodeMap.get(link.source);
      const target = nodeMap.get(link.target);
      if (!source || !target) return null;

      return {
        x1: source.x,
        y1: source.y,
        x2: target.x,
        y2: target.y
      };
    }).filter((l): l is { x1: number; y1: number; x2: number; y2: number } => l !== null);
  });

  private getIconForFile(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'txt': case 'md': return 'fas fa-file-alt';
      case 'png': case 'jpg': return 'fas fa-file-image';
      case 'app': return 'fas fa-cube';
      case 'sys': return 'fas fa-cog';
      case 'bin': case 'service': return 'fas fa-cogs';
      default: return 'fas fa-file';
    }
  }
}
