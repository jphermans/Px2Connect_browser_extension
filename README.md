# 🔌 Px2 Connect Browser Extension

<div align="center">
  <img src="PF8-removebg-preview.png" alt="Px2 Connect Logo" width="200"/>
</div>

## 🌟 Features

- 🚀 Quick access to your PX2 device
- 🎯 Default IP (169.254.1.1) connection
- ✨ Custom IP or hostname support
- 🎨 Theme selection (Flat Dark or White)
- 🔄 Automatic update notifications
- 💼 Easy-to-use options page

## 📥 Installation

Since this extension isn't distributed through the Chrome Web Store, you can install it in two ways:

### Manual Installation
1. Download the latest release from the [Releases](../../releases) page
2. Open your Chrome-based browser (Chrome, Edge, Brave, etc.)
3. Go to the extensions page:
   - Chrome: `chrome://extensions`
   - Edge: `edge://extensions`
   - Brave: `brave://extensions`
4. Enable "Developer mode" (top right corner)
5. Drag and drop the downloaded `.zip` file into the browser window

### Build from Source
1. Clone this repository:
   ```bash
   git clone https://github.com/YourUsername/px2-connect.git
   ```
2. Open your browser's extension page
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the extension directory

## 🛠️ Usage

1. Click the extension icon in your browser toolbar
2. Choose between:
   - Default IP (169.254.1.1)
   - Custom IP or hostname

### Configuration
1. Right-click the extension icon
2. Select "Options"
3. Configure your preferences:
   - Connection Method
     - Default IP
     - Custom IP address
     - Custom hostname
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

### Automatic Updates
The extension checks for new versions:
- When first installed
- Every 6 hours automatically
- Each time you open the popup
- Manually through the options page

When a new version is available:
1. A blue notification banner will appear at the top of the popup
2. A desktop notification will be shown
3. Click the banner to go to the download page
4. Download and install the new version following the installation steps

You can also check for updates manually:
1. Open the options page
2. Click the "Check for Updates" button
3. The status will show if you're up to date or if a new version is available

## 🔄 Updates

New versions will be available through the [Releases](../../releases) page. To update:
1. Download the latest version
2. Remove the existing extension
3. Install the new version following the installation steps

## 🤝 Contributing

Feel free to:
- Open issues
- Submit pull requests
- Suggest improvements

## 📄 License

[MIT License](LICENSE)

---

<div align="center">
  <i>Built with ❤️ for easy device access</i><br>
  <i>Developed by JPHsystems</i>
</div>