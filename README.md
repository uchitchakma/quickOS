<div align="center">
  <img src="public/app-icon.png" width="120" height="120" alt="quickOS App Icon" style="border-radius: 24px; box-shadow: 0 8px 24px rgba(197,69,62,0.25);" />
  <h1>quickOS</h1>
  <h3>⚡ Universal Cross-Platform System & Hardware Diagnostics Suite</h3>
  <p><strong>Developed by Uchit Chakma • Owned & Published by UCDREAMS TECHNOLOGIES LLP</strong></p>
  <p>
    <a href="https://ucdreams.com"><img src="https://img.shields.io/badge/Company-UCDREAMS%20TECHNOLOGIES%20LLP-C5453E?style=for-the-badge" alt="Company" /></a>
    <a href="https://uchitchakma.com"><img src="https://img.shields.io/badge/Developer-Uchit%20Chakma-14171D?style=for-the-badge&logo=code" alt="Developer" /></a>
    <a href="#license"><img src="https://img.shields.io/badge/License-Proprietary%20%2F%20Safe-10B981?style=for-the-badge" alt="License" /></a>
  </p>
</div>

---

## 🌟 Overview

**quickOS** is an ultra-lightweight, high-performance universal diagnostics and system interrogation application engineered to run seamlessly across **macOS, Windows 10/11, Ubuntu Linux, and Mobile OSes (Android/iOS)**.

Built with **Tauri 2.0 (Rust) + TypeScript**, quickOS does not bundle bloated Chromium binaries—yielding a tiny memory footprint (<25 MB RAM), rapid startup (<200 ms), and instant native hardware access.

---

## 🎨 Theme & Brand Identity

* **Primary Accent Color:** `#C5453E`
* **Theme Styling:** Obsidian Dark Glassmorphism with live micro-telemetry gauges
* **Company:** [UCDREAMS TECHNOLOGIES LLP](https://ucdreams.com)
* **Lead Developer:** [Uchit Chakma](https://uchitchakma.com)

---

## 🚀 Core Features

* 📊 **Live System Specs:** Real-time CPU multi-core frequency & load, physical memory (RAM) allocation, swap space, disk mounts (APFS / NTFS / ext4), and battery AC/charge state.
* 📶 **Wi-Fi & Radio Layer:** Dynamic SSID, BSSID, RSSI signal percentage, active channels, security protocols (WPA2/WPA3), and hardware interface details.
* 📡 **Bluetooth Controller & Peripherals:** Adapter power state, controller MAC address, discoverability mode, and inventory of connected/paired accessories (keyboards, headphones, mice).
* 🧪 **Automated Diagnostics Matrix:** Safe in-memory CPU floating-point benchmarking, 80MB RAM throughput test, storage sector I/O validation, and POSIX / Win32 architecture verification.
* 🌐 **Low-Latency ICMP Ping Tester:** Live DNS resolution, roundtrip latency calculation, and packet drop verification.
* 🔒 **100% Local-First & Private:** Zero tracking cookies, zero external telemetry data transmission, and local execution only.

---

## 💻 Zero-Hardware Multi-Platform Testing

Test all target operating systems without buying extra machines from a single host:

| Target Platform | Recommended Testing Setup | Hardware Cost |
| :--- | :--- | :--- |
| **macOS** | Native execution via `npm run tauri dev` | $0 |
| **iOS** | Xcode Simulator (`tauri ios dev`) | $0 |
| **Android** | Android Studio Emulator (`tauri android dev`) | $0 |
| **Ubuntu Linux** | UTM VM / Multipass / Docker | $0 |
| **Windows 11** | UTM / VMware Fusion / GitHub Actions CI | $0 |

> Read the detailed walkthrough in [docs/CROSS_PLATFORM_TESTING.md](docs/CROSS_PLATFORM_TESTING.md).

---

## 🛠️ Getting Started & Build Instructions

### Prerequisites
* [Node.js](https://nodejs.org) (v20+ recommended)
* [Rust](https://rustup.rs/) (1.80+)
* OS Build Essentials:
  * **macOS:** Xcode Command Line Tools (`xcode-select --install`)
  * **Linux (Ubuntu/Debian):** `sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget libssl-dev libayatana-appindicator3-dev librsvg2-dev`
  * **Windows:** Visual Studio C++ Build Tools & WebView2

### Local Development
```bash
# 1. Clone the repository
git clone https://github.com/uchitchakma/quickOS.git
cd quickOS

# 2. Install dependencies
bun install   # or npm install

# 3. Launch Development App
npm run tauri dev
```

### Production Build
```bash
# Compiles optimized release binary
npm run tauri build
```

---

## 🏛️ Project Structure

```
quickOS/
├── src/                      # High-efficiency Webview UI
│   ├── index.html            # Main dashboard markup
│   ├── styles.css            # #C5453E theme tokens & layout
│   └── main.ts               # IPC dispatchers & reactive charts
├── src-tauri/                # Rust Native Backend
│   ├── Cargo.toml            # Rust dependencies (tauri 2.0, sysinfo)
│   ├── tauri.conf.json       # App & window configurations
│   ├── capabilities/         # Security permission rules
│   └── src/
│       ├── main.rs           # Desktop runtime bootstrap
│       └── lib.rs            # Cross-platform hardware handlers
├── docs/                     # Guides & Specifications
│   ├── ARCHITECTURE.md       # Technical design document
│   └── CROSS_PLATFORM_TESTING.md # Zero-hardware testing guide
├── .github/workflows/        # Automated Multi-OS CI/CD
│   └── build-and-release.yml # Win / Mac / Ubuntu matrix builds
├── LICENSE.md                # Proprietary / Safe Commercial License
├── TERMS.md                  # Terms of Service
├── PRIVACY.md                # Local-First Privacy Policy
└── SECURITY.md               # Vulnerability Disclosure Policy
```

---

## ⚖️ Legal & Safe Policies

* **License:** [LICENSE.md](LICENSE.md) — Copyright © 2026 UCDREAMS TECHNOLOGIES LLP.
* **Privacy Charter:** [PRIVACY.md](PRIVACY.md) — 100% Local-first data processing.
* **Terms of Service:** [TERMS.md](TERMS.md) — Safe diagnostics & limitation of liability.
* **Security:** [SECURITY.md](SECURITY.md) — Responsible disclosure protocol.

---

## 🤝 Corporate & Developer Attribution

* **Company:** [UCDREAMS TECHNOLOGIES LLP](https://ucdreams.com)
* **Lead Developer:** [Uchit Chakma](https://uchitchakma.com)
* **Official Repository:** [github.com/uchitchakma/quickOS](https://github.com/uchitchakma/quickOS)
