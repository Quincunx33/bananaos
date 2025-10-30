# Banana OS 🍌

> A fully functional, web-based desktop environment simulator built with modern Angular, featuring a complete windowing system, taskbar, core applications, and a powerful, integrated AI assistant.

Welcome to Banana OS! This project is a demonstration of what's possible on the modern web, creating a familiar, fast, and feature-rich desktop experience that runs entirely in your browser.

## ✨ Key Features

- **Complete Desktop Environment:** A familiar UI with a taskbar, start menu, desktop icons, and system clock.
- **Advanced Windowing System:** Open, close, minimize, maximize, and drag multiple application windows, just like a real OS.
- **Multitasking:** Run multiple applications simultaneously and switch between them using the taskbar or an Alt+Tab style app switcher.
- **State Persistence:** Your open windows, their positions, and system settings are saved to `localStorage`, so your session is restored when you return.
- **AI-Powered Copilot:** Banana Copilot, powered by the Google Gemini API, can understand natural language commands to control the OS, manage apps, and even fix its own bugs.
- **Rich Application Suite:** Includes a range of core apps like a File Explorer, Terminal, Web Browser, Settings, Weather, Notes, and more.
- **App Store:** A simulated App Store to "install" and "uninstall" applications.
- **Customization:** Personalize your experience by changing the wallpaper and accent color.

## 🛠️ Tech Stack

- **Framework:** Angular (v20+, Zoneless)
- **State Management:** Angular Signals
- **Styling:** Tailwind CSS
- **AI Integration:** Google Gemini API (`@google/genai`)
- **Icons:** Font Awesome

## 🚀 Getting Started

Banana OS is designed to run directly in a web environment with no build step required. However, to enable the AI and Weather features, you must provide your own API keys.

### API Key Configuration (Important!)

The AI features (like Banana Copilot) and the Weather app require API keys to function. The application provides a secure and easy way to configure them.

1.  **Open the Settings App:** Double-click the "Settings" icon on the desktop or open it from the Start Menu.
2.  **Navigate to API Keys:** Click on the "API Keys" tab in the sidebar.
3.  **Enter Your Keys:**
    *   **Google Gemini API:** Paste your Gemini API key into the first input field. You can get a free key from [Google AI Studio](https://aistudio.google.com/app/apikey).
    *   **OpenWeatherMap API:** Paste your OpenWeatherMap API key into the second input field. You can get a free key from [OpenWeatherMap](https://home.openweathermap.org/api_keys).
4.  **Save Each Key:** Click the "Save" button next to each input field.

The keys are saved securely in your browser's `localStorage` and will be remembered for future sessions. Once saved, all AI and weather-related features will be enabled immediately.

## 🖥️ Core Applications

Banana OS comes with a suite of essential applications:

-   **Banana Copilot:** Your powerful AI assistant. Ask it to open apps, change settings, create files, or even fix bugs.
-   **File Explorer:** A virtual file system to browse folders and preview files. You can create, rename, delete, and upload files.
-   **Terminal:** A command-line interface with common commands (`ls`, `echo`, `date`) and an `ai` command to chat with the Gemini API directly.
-   **Browser:** A functional web browser (using an `<iframe>`) to navigate the internet.
-   **Settings:** Customize your OS wallpaper and accent color, and manage your API keys.
-   **Weather:** Get the current weather for any city or your current location.
-   **Notes:** A simple and persistent note-taking application.
-   **Calculator, Camera, Photo Viewer, Music Player, etc.:** A variety of other useful utilities and creative apps.

## 🧠 AI Integration: The Power of Banana Copilot

Banana Copilot is more than just a chatbot. It's deeply integrated into the OS and can perform actions on your behalf.

-   **OS Control:** "Open the terminal" or "Change the wallpaper to aurora."
-   **In-App Actions:** "Create a new note with the title 'Shopping List'" or "Execute the 'neofetch' command in the terminal."
-   **Information Retrieval:** "What's the weather like in London?"

### Self-Healing & Bug Fixing

Copilot has a unique ability to debug and repair itself. If you find a bug (e.g., "The browser's forward button isn't working"), you can report it to Copilot. It will:
1.  Analyze the bug report and request the relevant source code from the virtual file system.
2.  Analyze the code and generate a patch to fix the issue.
3.  Ask for your permission to apply the fix.
4.  If you approve, it will overwrite the buggy code and restart the OS to apply the changes.
5.  An **Emergency Restore** button appears on the taskbar after a patch, allowing you to undo the change if it causes problems.

## 🐛 Debugging Your Banana OS Instance

If you encounter issues or want to see how the OS works under the hood, you can use your browser's built-in Developer Tools. Press `F12` or `Ctrl+Shift+I` (`Cmd+Option+I` on Mac) to open them.

### 1. The Console

The **Console** tab is your first stop for debugging.
-   **Errors:** Any application errors (e.g., problems with an API call, rendering issues) will be printed here in red.
-   **Logs:** The application may log informational messages about its state.

### 2. Application Storage

Banana OS uses `localStorage` to save your session and settings.
-   Go to the **Application** tab (in Chrome/Edge) or **Storage** tab (in Firefox).
-   On the left, find **Local Storage** and select the current domain.
-   Here you can see all saved data, including:
    -   `banana-os-windows-state`: The state of all open windows.
    *   `banana-os-installed-apps`: A list of installed app IDs.
    -   `banana-os-gemini-api-key`: Your saved Gemini API key.
    -   `banana-os-notes`: All the notes you've created in the Notes app.
-   You can manually edit or delete these entries to reset parts of the application's state. For example, deleting `banana-os-windows-state` will give you a fresh session on the next reload.

### 3. Network Requests

The **Network** tab shows all outgoing requests. This is useful for debugging API calls.
-   Filter by "Fetch/XHR" to see API requests.
-   When you ask the Weather app for data or use an AI feature, you will see the request being made here.
-   You can inspect the request headers and the response from the server, which is crucial for diagnosing API key problems or network errors.

## 🎨 Customization

Easily make Banana OS your own:
-   **Wallpaper:** Go to `Settings > Personalization` to choose from built-in wallpapers or upload your own image.
-   **Accent Color:** Choose your favorite color from the palette in `Settings > Personalization` to change the UI highlights throughout the OS.

---

Thank you for exploring Banana OS!
