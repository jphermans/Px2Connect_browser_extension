# 🔌 Px2 Connect Browser Extension

<div align="center">
  <img src="src/images/PF8-removebg-preview.png" alt="Px2 Connect Logo" width="200"/>
</div>

## 🌟 Features

- 🚀 Quick access to your PX2 device
- 🎯 Default IP (169.254.1.1) connection
- ✨ Support for up to 5 custom IP addresses or hostnames
- 🛡️ Duplicate address prevention
- 🎨 Theme selection (Flat Dark or White)
- 🔄 Automatic update notifications
- 💼 Easy-to-use options page
- 👋 Interactive welcome page
- 🔐 Reliable settings migration
- 📱 Responsive design across all pages
- 🍎 Safari browser support
- 🔄 Enhanced update system with persistent notifications

## 🛠️ Usage

### First-Time Setup
When you first install the extension:
1. A welcome page introduces you to key features
2. Click "Get Started" to access the options page
3. Configure your preferred settings
4. Start using the extension with your configuration

### Basic Usage
1. Click the extension icon in your browser toolbar
2. Choose between:
   - Default IP (169.254.1.1)
   - Your configured custom IP addresses or hostnames

### Keyboard Shortcuts
The extension provides the following keyboard shortcuts:
- Ctrl+Shift+1 (Command+Shift+1 on Mac) - Open default IP address
- Ctrl+Shift+2 (Command+Shift+2 on Mac) - Open first custom address
- Ctrl+Shift+3 (Command+Shift+3 on Mac) - Open second custom address
- Ctrl+Shift+R (Command+Shift+R on Mac) - Toggle rescue mode

Note: Due to browser limitations, the extension supports a maximum of 4 keyboard shortcuts. Additional custom addresses can be accessed through the popup interface.

### Configuration
1. Right-click the extension icon
2. Select "Options"
3. Configure your preferences:
   - Connection Method
     - Default IP
     - Custom IP addresses/hostnames (up to 5)
       - Add/Remove addresses dynamically
       - Automatic duplicate detection
       - Real-time validation
   - Theme
     - Flat Dark (default)
     - White
   - Updates
     - Manual update check button
     - Update status feedback

### Themes
The extension supports two themes for the PX2 interface:
- **Flat Dark**: A modern dark theme (default)
- **White**: A clean light theme

The selected theme will be applied automatically when opening any PX2 interface.

### Rescue Mode
The extension includes a special rescue mode for device recovery:
- Only available when your PC is in the 169.254.1.x IP range
- Appears as a checkbox in the popup when available
- When enabled, connects to http://169.254.1.1/cgi-bin/upgrade.cgi
- Use this mode when you need to recover or upgrade a device in recovery state

## 📥 Installation

### Chrome/Edge/Brave Installation
1. Download the latest release from the [Releases](../../releases) page
2. Open your Chrome-based browser
3. Go to the extensions page:
   - Chrome: `chrome://extensions`
   - Edge: `edge://extensions`
   - Brave: `brave://extensions`
4. Enable "Developer mode" (top right corner)
5. Drag and drop the downloaded `.zip` file into the browser window

### Safari Installation
1. **Development Setup**:
   - Install Xcode from the Mac App Store
   - Install the latest version of Safari
   - Enable Safari Extension Development in Safari Preferences > Advanced

2. **Developer Requirements**:
   - Apple Developer Account
   - Safari Extension Certificate
   - Xcode with Safari Extension Builder

3. **Installation Steps**:
   a. For Development:
      1. Download the Safari version from the [Releases](../../releases) page
      2. Open Xcode
      3. Import the extension using Safari Extension Builder
      4. Build and run the extension

   b. For Production:
      1. Download the extension from the Mac App Store
      2. Open Safari and go to Safari > Settings > Extensions
      3. Enable the extension and grant necessary permissions
      4. The extension will be available in your Safari toolbar

4. **Packaging for App Store**:
   - The GitHub workflow creates the basic extension package
   - Final packaging requires:
     - Xcode for signing and building
     - Safari Extension Builder for final packaging
     - App Store Connect for submission

### Build from Source
1. Clone this repository:
   ```bash
   git clone https://github.com/jphermans/px2-connect.git
   ```
2. Open your browser's extension page
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the extension directory

## 🔄 Updates & Version Management

### Automatic Updates
The extension checks for new versions:
- When first installed
- Every 24 hours automatically
- Each time you open the popup
- Manually through the options page

When a new version is available:
1. A persistent notification banner will appear at the top of the popup
2. A desktop notification will be shown with clear update instructions
3. Click the banner to go to the download page
4. Download and install the new version following the installation steps

### Update Installation
New versions will be available through the [Releases](../../releases) page. To update:
1. Download the latest version
2. Remove the existing extension
3. Install the new version following the installation steps
4. Your settings will be automatically migrated to the new version

## Recent Improvements

### Multi-Browser Support
- Added full Safari browser compatibility
- Browser-specific optimizations for each platform
- Consistent experience across all supported browsers
- Automatic browser detection and feature adaptation

### Enhanced Update System
- Persistent update notifications
- Clear step-by-step update instructions
- Improved version comparison logic
- Automatic settings migration
- Backup and restore functionality
- Error handling and recovery

### Settings Management
- Enhanced settings migration between updates
- Automatic backup of user preferences
- Reliable settings restoration after updates
- Clear notifications about the update process
- Improved error handling and recovery

### Visual Consistency
- Unified color scheme across all pages
- Consistent styling for buttons and cards
- Professional SVG icons replacing emojis
- Improved typography and spacing
- Better contrast for readability

## Development

### Prerequisites
- Node.js
- TypeScript
- Chrome/Edge/Safari browser

### Building
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the extension:
   ```bash
   npm run build
   ```

### Packaging
The extension is automatically packaged for all supported browsers when:
- A new release is created on GitHub
- The package workflow is manually triggered

The package includes browser-specific versions:
- Chrome/Edge/Brave version
- Safari version with Info.plist
- Firefox version (coming soon)

## 🤝 Contributing

Feel free to:
- Open issues
- Submit pull requests
- Report browser-specific issues
- Suggest improvements for any supported browser

## 📄 License

[MIT License](LICENSE)

---

<div align="center">
  <i>Built with ❤️ for easy device access</i><br>
  <i>© 2025 JPHsystems</i>
</div>