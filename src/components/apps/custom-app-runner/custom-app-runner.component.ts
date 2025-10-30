import { ChangeDetectionStrategy, Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { WINDOW_CONTEXT } from '../../../injection-tokens';
import { AppManagementService, CustomApp } from '../../../services/app-management.service';

@Component({
    selector: 'app-custom-app-runner',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './custom-app-runner.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomAppRunnerComponent implements OnInit {
    private context = inject(WINDOW_CONTEXT, { optional: true });
    private appManagement = inject(AppManagementService);
    private sanitizer = inject(DomSanitizer);

    appData = signal<CustomApp | null>(null);
    error = signal<string | null>(null);

    appSrc = computed<SafeResourceUrl | null>(() => {
        const app = this.appData();
        if (!app) return null;

        let html = '';

        if (app.projectType === 'react') {
            html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { margin: 0; font-family: sans-serif; }
            ${app.code.css}
          </style>
          <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin><\/script>
          <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin><\/script>
        </head>
        <body>
          <div id="root"></div>
          <script type="text/babel">
            ${app.code.js}
            const container = document.getElementById('root');
            const root = ReactDOM.createRoot(container);
            root.render(<App />);
          <\/script>
        </body>
        </html>`;
        } else { // simple
            html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>${app.code.css}</style>
        </head>
        <body>
          ${app.code.html}
          <script>${app.code.js}<\/script>
        </body>
        </html>`;
        }
        return this.sanitizer.bypassSecurityTrustResourceUrl(`data:text/html,${encodeURIComponent(html)}`);
    });

    ngOnInit(): void {
        const appId = this.context?.appId;
        if (appId) {
            const app = this.appManagement.getCustomApp(appId);
            if (app) {
                this.appData.set(app);
            } else {
                this.error.set(`Could not find data for custom app with ID: ${appId}`);
            }
        } else {
            this.error.set('No app ID provided to the app runner.');
        }
    }
}
