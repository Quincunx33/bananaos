import { AppConfig } from '../models/app.model';

export const APPS_CONFIG: AppConfig[] = [
  // --- System ---
  { 
    id: 'banana-copilot', title: 'Banana Copilot', icon: 'fas fa-robot text-cyan-400',
    category: 'System', description: 'Your AI assistant for Banana OS.',
    isCore: true, defaultSize: { width: 450, height: 600 } 
  },
  { 
    id: 'file-explorer', title: 'File Explorer', icon: 'fas fa-folder text-yellow-400',
    category: 'System', description: 'Browse and manage your files.',
    isCore: true, defaultSize: { width: 700, height: 500 } 
  },
  { 
    id: 'terminal', title: 'Terminal', icon: 'fas fa-terminal text-green-400',
    category: 'System', description: 'Command-line interface for power users.',
    isCore: true, defaultSize: { width: 600, height: 400 } 
  },
  { 
    id: 'settings', title: 'Settings', icon: 'fas fa-cog text-gray-400',
    category: 'System', description: 'Customize your system settings.',
    isCore: true, defaultSize: { width: 650, height: 550 } 
  },
  {
    id: 'store', title: 'App Store', icon: 'fas fa-store text-indigo-400',
    category: 'System', description: 'Discover and install new apps.',
    isCore: true, defaultSize: { width: 750, height: 550 }
  },

  // --- Creative ---
  { 
    id: 'photo-viewer', title: 'Photos', icon: 'fas fa-images text-teal-400',
    category: 'Creative', description: 'View your favorite images.',
    defaultSize: { width: 800, height: 600 } 
  },
  { 
    id: 'camera', title: 'Camera', icon: 'fas fa-camera text-pink-400',
    category: 'Creative', description: 'Use your device camera to take photos.',
    defaultSize: { width: 640, height: 480 } 
  },
  { id: 'creative-music', title: 'Music Player', icon: 'fas fa-music text-pink-500', category: 'Creative', description: 'Listen to your favorite tunes.', defaultSize: { width: 800, height: 500 } },
  { id: 'creative-markdown', title: 'Markdown Editor', icon: 'fab fa-markdown text-gray-400', category: 'Creative', description: 'Write in Markdown with live preview.', defaultSize: { width: 900, height: 600 } },
  { id: 'creative-podcast', title: 'Podcasts', icon: 'fas fa-podcast text-orange-500', category: 'Creative', description: 'Discover and listen to podcasts.', defaultSize: { width: 750, height: 550 } },
  { id: 'creative-audio-editor', title: 'AudioLab', icon: 'fas fa-wave-square text-blue-400', category: 'Creative', description: 'Record and edit audio files.' },
  { id: 'creative-animation', title: 'Animator', icon: 'fas fa-film text-purple-500', category: 'Creative', description: 'Create 2D animations.' },
  { id: 'creative-dj-mixer', title: 'DJ Mixer', icon: 'fas fa-headphones text-pink-500', category: 'Creative', description: 'Mix your favorite tracks.' },
  { id: 'creative-storyboard', title: 'Storyboarder', icon: 'fas fa-book-open text-yellow-600', category: 'Creative', description: 'Plan your visual stories.' },
  { id: 'creative-font-manager', title: 'Font Manager', icon: 'fas fa-font text-green-400', category: 'Creative', description: 'Organize and preview fonts.' },
  { id: 'creative-ecard-maker', title: 'Card Maker', icon: 'fas fa-birthday-cake text-pink-400', category: 'Creative', description: 'Design digital greeting cards.' },
  { id: 'creative-photo-collage', title: 'Photo Collage', icon: 'fas fa-th text-teal-400', category: 'Creative', description: 'Combine photos into collages.' },
  
  // --- Productivity ---
  { 
    id: 'app-builder', title: 'App Builder', icon: 'fas fa-drafting-compass text-cyan-400',
    category: 'Productivity', description: 'Create and install your own apps.',
    defaultSize: { width: 900, height: 700 } 
  },
  { 
    id: 'browser', title: 'Browser', icon: 'fas fa-globe text-blue-400',
    category: 'Productivity', description: 'Surf the web.',
    isCore: true, defaultSize: { width: 800, height: 600 } 
  },
  { 
    id: 'text-editor', title: 'Text Editor', icon: 'fas fa-file-alt text-red-400',
    category: 'Productivity', description: 'A simple editor for text files.',
    defaultSize: { width: 600, height: 500 } 
  },
  { 
    id: 'prod-notes', title: 'Notes', icon: 'fas fa-sticky-note text-yellow-300',
    category: 'Productivity', description: 'Jot down your thoughts.',
    defaultSize: { width: 600, height: 450 }
  },
  { 
    id: 'prod-calendar', title: 'Calendar', icon: 'fas fa-calendar-alt text-blue-500',
    category: 'Productivity', description: 'Organize your schedule.',
    defaultSize: { width: 700, height: 500 }
  },
  { 
    id: 'prod-clock', title: 'Clock', icon: 'fas fa-clock text-white',
    category: 'Productivity', description: 'Alarms, timer, and stopwatch.',
    defaultSize: { width: 500, height: 400 }
  },
  { 
    id: 'prod-maps', title: 'Maps', icon: 'fas fa-map-marked-alt text-teal-400',
    category: 'Productivity', description: 'Find your way around the world.',
    defaultSize: { width: 700, height: 550 }
  },
  { id: 'prod-email', title: 'Mail', icon: 'fas fa-envelope text-red-400', category: 'Productivity', description: 'Manage your emails.' },
  { id: 'prod-todo', title: 'To-Do', icon: 'fas fa-check-square text-gray-400', category: 'Productivity', description: 'Track your tasks.' },
  { id: 'prod-voice-memos', title: 'Voice Memos', icon: 'fas fa-microphone-alt text-red-500', category: 'Productivity', description: 'Record quick audio notes.' },
  { id: 'prod-code-editor', title: 'CodePad', icon: 'fas fa-code text-purple-400', category: 'Productivity', description: 'A lightweight code editor.' },
  { id: 'prod-compressor', title: 'Zipper', icon: 'fas fa-file-archive text-yellow-600', category: 'Productivity', description: 'Compress and extract files.' },
  { id: 'prod-mindmap', title: 'Mind Map', icon: 'fas fa-project-diagram text-indigo-400', category: 'Productivity', description: 'Visualize your ideas.' },
  
  // --- Utilities ---
  { 
    id: 'calculator', title: 'Calculator', icon: 'fas fa-calculator text-purple-400',
    category: 'Utilities', description: 'Perform basic calculations.',
    defaultSize: { width: 320, height: 480 } 
  },
  { 
    id: 'weather', title: 'Weather', icon: 'fas fa-cloud-sun text-cyan-400',
    category: 'Utilities', description: 'Get the latest weather forecast.',
    defaultSize: { width: 400, height: 550 } 
  },
  { 
    id: 'util-system-monitor', title: 'System Monitor', icon: 'fas fa-chart-line text-red-500',
    category: 'Utilities', description: 'Monitor system resource usage.',
    defaultSize: { width: 500, height: 450 }
  },
  { 
    id: 'util-pdf-reader', title: 'PDF Reader', icon: 'fas fa-file-pdf text-red-500',
    category: 'Utilities', description: 'View and manage PDF documents.',
    defaultSize: { width: 800, height: 600 }
  },
  { 
    id: 'app-translator', title: 'Translator', icon: 'fas fa-language text-blue-500',
    category: 'Utilities', description: 'Translate text between languages.',
    defaultSize: { width: 700, height: 500 }
  },
  { id: 'util-password-manager', title: 'Password Safe', icon: 'fas fa-key text-yellow-400', category: 'Utilities', description: 'Securely store passwords.' },
  { id: 'util-unit-converter', title: 'Converter', icon: 'fas fa-exchange-alt text-blue-400', category: 'Utilities', description: 'Convert various units.' },
  { id: 'util-world-clock', title: 'World Clock', icon: 'fas fa-globe text-green-400', category: 'Utilities', description: 'View time across the globe.' },
  { id: 'util-authenticator', title: 'Authenticator', icon: 'fas fa-shield-alt text-purple-400', category: 'Utilities', description: 'Generate 2FA codes.' },
  { id: 'util-disk-analyzer', title: 'Disk Analyzer', icon: 'fas fa-chart-pie text-orange-400', category: 'Utilities', description: 'Visualize disk space usage.' },
  { id: 'util-qr-scanner', title: 'QR Scanner', icon: 'fas fa-qrcode text-gray-400', category: 'Utilities', description: 'Scan and generate QR codes.' },
  { id: 'util-remote-desktop', title: 'Remote Desktop', icon: 'fas fa-desktop text-indigo-400', category: 'Utilities', description: 'Access other computers remotely.' },
  { id: 'util-clipboard-manager', title: 'Clipboard History', icon: 'fas fa-clipboard-list text-gray-500', category: 'Utilities', description: 'Manage your clipboard history.' },
  
  // --- Games ---
  { id: 'game-chess', title: 'Chess', icon: 'fas fa-chess text-gray-200', category: 'Games', description: 'Classic strategy board game.', defaultSize: { width: 700, height: 750 } },
  { id: 'game-solitaire', title: 'Solitaire', icon: 'fas fa-heart text-red-500', category: 'Games', description: 'Classic card game.', defaultSize: { width: 800, height: 600 } },
  { id: 'game-minesweeper', title: 'Minesweeper', icon: 'fas fa-bomb text-gray-400', category: 'Games', description: 'Find all the mines.', defaultSize: { width: 400, height: 500 } },
  { id: 'game-sudoku', title: 'Sudoku', icon: 'fas fa-border-all text-blue-300', category: 'Games', description: 'Logic-based number puzzle.', defaultSize: { width: 500, height: 600 } },
  { id: 'game-puzzle-blocks', title: 'Puzzle Blocks', icon: 'fas fa-cubes text-purple-400', category: 'Games', description: 'A block-dropping puzzle game.', defaultSize: { width: 550, height: 750 } },
  { id: 'game-2048', title: '2048', icon: 'fas fa-th text-orange-400', category: 'Games', description: 'Slide tiles to get to 2048.', defaultSize: { width: 500, height: 650 } },
  { id: 'game-word-finder', title: 'Word Finder', icon: 'fas fa-search text-teal-300', category: 'Games', description: 'Find hidden words in a grid.', defaultSize: { width: 700, height: 500 } },
  { id: 'game-pacman', title: 'Pac-Man', icon: 'fas fa-ghost text-yellow-400', category: 'Games', description: 'Classic arcade game.' },
  { id: 'game-space-invaders', title: 'Space Invaders', icon: 'fas fa-space-shuttle text-gray-400', category: 'Games', description: 'Defend against alien hordes.' },
  { id: 'game-asteroids', title: 'Asteroids', icon: 'fas fa-meteor text-gray-500', category: 'Games', description: 'Blast asteroids and survive.' },
  { id: 'game-snake', title: 'Snake', icon: 'fas fa-plus text-green-400', category: 'Games', description: 'Grow your snake by eating.' },
  { id: 'game-checkers', title: 'Checkers', icon: 'fas fa-square text-red-500', category: 'Games', description: 'Classic board game of strategy.' },
  { id: 'game-reversi', title: 'Reversi', icon: 'fas fa-circle text-white', category: 'Games', description: 'Flip discs to dominate the board.' },
  { id: 'game-go', title: 'Go', icon: 'fas fa-border-all text-black', category: 'Games', description: 'Ancient game of territory.' },
  { id: 'game-mahjong', title: 'Mahjong Solitaire', icon: 'fas fa-dragon text-green-600', category: 'Games', description: 'Match tiles to clear the board.' },
  { id: 'game-crossword', title: 'Crossword', icon: 'fas fa-puzzle-piece text-blue-400', category: 'Games', description: 'Solve crossword puzzles.' },
  { id: 'game-wordsearch', title: 'Word Search', icon: 'fas fa-search text-purple-400', category: 'Games', description: 'Find hidden words in a grid.' },
  { id: 'game-trivia', title: 'Trivia Quiz', icon: 'fas fa-question-circle text-yellow-500', category: 'Games', description: 'Test your knowledge.' },
  { id: 'game-hangman', title: 'Hangman', icon: 'fas fa-user-ninja text-gray-600', category: 'Games', description: 'Guess the word before it\'s too late.' },
  { id: 'game-blackjack', title: 'Blackjack', icon: 'fas fa-heart text-red-600', category: 'Games', description: 'Card game to get 21.' },
  { id: 'game-poker', title: 'Poker', icon: 'fas fa-trophy text-yellow-400', category: 'Games', description: 'Texas Hold\'em poker.' },
  { id: 'game-flappy', title: 'Flappy Banana', icon: 'fas fa-lemon text-yellow-300', category: 'Games', description: 'A fun and challenging game.' },

  // --- Social ---
  { id: 'social-forums', title: 'Forums', icon: 'fas fa-id-card text-cyan-400', category: 'Social', description: 'My social and contact information.' },
  { id: 'social-events', title: 'Events', icon: 'fas fa-calendar-check text-purple-400', category: 'Social', description: 'Plan and attend social events.' },

  // --- Other ---
  { id: 'app-recipes', title: 'Recipe Book', icon: 'fas fa-utensils text-orange-600', category: 'Other', description: 'Find and save delicious recipes.', defaultSize: { width: 800, height: 600 } },
  { id: 'app-stocks', title: 'Stocks', icon: 'fas fa-chart-line text-green-600', category: 'Other', description: 'Track the stock market.', defaultSize: { width: 400, height: 550 } },
  { id: 'app-news', title: 'News Feed', icon: 'fas fa-newspaper text-gray-300', category: 'Other', description: 'Get the latest news headlines.', defaultSize: { width: 850, height: 600 } },
  { id: 'other-ide', title: 'Banana IDE', icon: 'fas fa-laptop-code text-indigo-500', category: 'Other', description: 'Integrated Development Environment.', defaultSize: { width: 900, height: 600 } },
  { id: 'other-language', title: 'Lingo Learn', icon: 'fas fa-language text-green-500', category: 'Other', description: 'Learn new languages.' },
  { id: 'other-dictionary', title: 'Dictionary', icon: 'fas fa-book text-yellow-700', category: 'Other', description: 'Look up word definitions.' },
  { id: 'other-encyclopedia', title: 'Encyclopedia', icon: 'fas fa-globe-americas text-blue-600', category: 'Other', description: 'Browse a world of knowledge.' },
  { id: 'other-stargazing', title: 'Stargazer', icon: 'fas fa-star text-yellow-300', category: 'Other', description: 'Explore the night sky.' },
  { id: 'other-inventory', title: 'Home Inventory', icon: 'fas fa-box-open text-orange-600', category: 'Other', description: 'Keep track of your belongings.' },
  { id: 'other-petcare', title: 'Pet Care', icon: 'fas fa-paw text-yellow-900', category: 'Other', description: 'Manage your pet\'s health.' },
];