<div align="center">
  <img src="public/app-icon.png" width="120" height="120" alt="quickOS App Icon" style="border-radius: 24px; box-shadow: 0 8px 24px rgba(197,69,62,0.25);" />
  <h1>quickOS</h1>
  <h3>⚡ Universal Local OS Virtualization & Multi-Platform App Runner</h3>
  <p><strong>Run Real macOS, Windows, Linux, Android, and iOS Apps Locally Across Platforms</strong></p>
  <p><strong>Developed by Uchit Chakma • Owned & Published by UCDREAMS TECHNOLOGIES LLP</strong></p>
  <p>
    <a href="https://github.com/uchitchakma/quickOS/releases/latest"><img src="https://img.shields.io/badge/Download-Latest%20Release%20(.dmg)-C5453E?style=for-the-badge&logo=apple" alt="Download Latest Release" /></a>
    <a href="https://github.com/uchitchakma/quickOS/releases"><img src="https://img.shields.io/github/v/release/uchitchakma/quickOS?style=for-the-badge&color=10B981" alt="Release Version" /></a>
  </p>
  <p>
    <a href="https://ucdreams.com"><img src="https://img.shields.io/badge/Company-UCDREAMS%20TECHNOLOGIES%20LLP-14171D?style=for-the-badge" alt="Company" /></a>
    <a href="https://uchitchakma.com"><img src="https://img.shields.io/badge/Developer-Uchit%20Chakma-14171D?style=for-the-badge&logo=code" alt="Developer" /></a>
    <a href="#license"><img src="https://img.shields.io/badge/License-Proprietary%20%2F%20Safe-10B981?style=for-the-badge" alt="License" /></a>
  </p>
</div>

---

## 🌟 What is quickOS?

**quickOS** is a powerful local operating system virtualization suite, hypervisor, and multi-platform application runner engineered for developers, QA testers, and power users.

With **quickOS**, users on **Mac, Windows, or Ubuntu/Linux** can run and test applications from any other operating system—including **Desktop OSes (macOS, Windows, Linux)** and **Mobile OSes (Android APKs, iOS IPAs)**—all from a single machine without bulky commercial setups.

Built with **Tauri 2.0 (Rust) + Swift Native Hypervisor (`Virtualization.framework`) + TypeScript**, quickOS delivers bare-metal paravirtualized performance, Metal 3 GPU acceleration (60 FPS), instant startup (<200 ms), and minimal host memory footprint.

---

## 🎨 Theme & Brand Identity

* **Primary Accent Color:** `#C5453E`
* **Theme Styling:** Obsidian Dark Glassmorphism with live micro-telemetry gauges
* **Company:** [UCDREAMS TECHNOLOGIES LLP](https://ucdreams.com)
* **Lead Developer:** [Uchit Chakma](https://uchitchakma.com)

---

## 🚀 5-Way Universal OS & App Runner Matrix

Run applications seamlessly across platforms:

```
                          ┌───────────────────────────┐
                          │   "Run with quickOS"      │
                          │ Universal Binary Runner   │
                          └─────────────┬─────────────┘
                                        │
      ┌───────────────┬─────────────────┼─────────────────┬───────────────┐
      ▼               ▼                 ▼                 ▼               ▼
   🍎 macOS       🪟 Windows        🐧 Linux         🤖 Android        📱 iOS
(.app / .dmg)   (.exe / .msi)   (.AppImage/.deb)   (.apk / .aab)       (.ipa)
```

| Application Format | On macOS Host | On Windows Host | On Ubuntu / Linux Host |
| :--- | :--- | :--- | :--- |
| **🍎 macOS Apps (`.app`/`.dmg`)** | **Native:** Instant execution with zero overhead. | **MicroVM / Darling:** Routed via quickOS macOS Micro-Hypervisor. | **Darling / KVM:** High-performance Mach-O translation. |
| **🪟 Windows Apps (`.exe`/`.msi`)** | **Wine / Hypervisor:** Translated via quickOS Windows Layer or Win11 VM. | **Native:** Instant Win32 / UWP launch. | **Wine / Proton:** Native translation layer. |
| **🐧 Linux Apps (`.AppImage`/`.deb`)** | **Linux Engine:** Run via native `Virtualization.framework` kernel. | **WSL2 Bridge:** Routed via WSL2 / Linux VM Subsystem. | **Native:** Instant POSIX ELF launch. |
| **🤖 Android Apps (`.apk`/`.aab`)** | **Android Engine:** ADB Bridge / QEMU Android AVD. | **WSA / AVD:** Windows Subsystem for Android / AVD. | **Waydroid:** Native Bare-Metal GPU Android Container. |
| **📱 iOS / iPadOS Apps (`.ipa`)** | **Apple Silicon:** Native ARM64 iOS Runtime / Xcode Simulator. | **touchHLE MicroVM:** quickOS iOS Simulation Engine. | **touchHLE Bridge:** iOS high-level translation. |

---

## 🔥 Key Virtualization Capabilities

### 🪟 1. Genuine Windows 11 Native VM
* **Real Hardware-Accelerated VM:** Boots genuine Windows 11 ARM64 directly on Apple Silicon M-Series Macs using Apple's native `Virtualization.framework` (`VZVirtualMachine`).
* **Metal 3 Graphics Acceleration:** 60 FPS smooth native graphics rendering inside dedicated Cocoa windows.
* **Paravirtualized NVMe Storage:** Ultra-fast disk I/O over APFS sparse disks.
* **Full Peripherals & Network:** Shared clipboard, host audio streaming directly to Mac speakers, USB keyboard/mouse pass-through, and NAT bridged internet networking.
* **Direct Official Download Access:** Built-in 1-click links to download official Microsoft Windows 11 ARM64 ISOs (via UUP dump with zero login required or Microsoft Software Download Center).

### 🐧 2. Genuine Ubuntu Linux 24.04 LTS VM
* **Native Linux Kernel Execution:** Direct kernel boot with hardware virtualization, live GUI framebuffer, and interactive terminal.
* **Development & Docker Ready:** Full `apt` package repository access for compiling, testing Linux binaries, and running containerized server environments.

### 💽 3. Custom Storage Target (External SSD / HDD Support)
* **Install on External SSDs or HDDs:** Install and store large virtual hard disks (`.img` / `.raw`) and ISOs on external storage (Samsung T7, SanDisk, Crucial, external HDDs) to keep your internal Mac drive free.
* **APFS Sparse Allocation:** Creates 32GB or 20GB virtual hard disks in seconds that only consume ~10MB initially and grow dynamically as you install apps.

### 🔄 4. Smart Path Persistence & Live Reconnection Watcher
* **Persistent Configuration:** Automatically saves and restores all your custom installation paths, disk images, ISO paths, vCPUs, and RAM configurations across app reboots.
* **Automatic Disconnect / Reconnect Detection:** Background telemetry monitors drive mount status every 4 seconds. If an external SSD is disconnected, quickOS protects the VM and displays a warning (`⚠️ External Drive Disconnected`); as soon as you plug it back in, quickOS detects it and re-enables controls without losing your settings.

### 📊 5. Integrated System & Hardware Diagnostics Suite
* **Real-time Telemetry:** Live CPU multi-core load, RAM usage, swap space, and battery charge status.
* **Wi-Fi & Airwaves Scanner:** Discovers surrounding 2.4GHz & 5GHz Wi-Fi access points with RSSI signal meters, BSSID, and security protocols.
* **Bluetooth Accessories:** Inventory of connected/paired Bluetooth devices (keyboards, mice, AirPods, headsets).
* **Hardware Benchmarks:** Safe in-memory CPU floating-point benchmarking, RAM bus throughput, and storage sector I/O validation.
* **ICMP Ping Tester:** Live DNS resolution and low-latency round-trip response timing.

---

## 📖 How to Use quickOS

### How to Run Any App with quickOS:
1. Open **quickOS** and navigate to the **Virtual OS Lab** -> **Universal Multi-OS App Runner** tab.
2. Click **Browse App...** or drag and drop any `.exe`, `.app`, `.apk`, `.ipa`, `.dmg`, `.AppImage`, or `.deb` file.
3. quickOS instantly analyzes the binary format headers and displays the auto-detected platform and execution route.
4. Click **Run with quickOS** to launch the software immediately!

### How to Run Real Windows 11 on Mac:
1. Under **Windows 11 Native VM**, select your **Storage Target Drive** (Internal or External SSD/HDD).
2. Click **Create 32GB Disk** to instantly generate an APFS sparse disk image.
3. Select your **Windows 11 ARM64 ISO** (or click the *UUP dump* download link to fetch the genuine Microsoft build).
4. Choose your desired **Virtual CPUs** (e.g. 4 vCPUs) and **Dedicated RAM** (e.g. 4096 MB).
5. Click **Boot Real Native Windows 11 VM** — Windows boots up immediately in a native display window with full keyboard, mouse, audio, and network support!

---

## 🛠️ Getting Started & Build Instructions

### Prerequisites
* [Node.js](https://nodejs.org) (v20+ recommended) or [Bun](https://bun.sh)
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

### Production Release Build
```bash
# Compiles optimized release desktop app (.dmg on macOS, .msi on Windows, .deb/.AppImage on Linux)
npm run tauri build
```

---

## ⚖️ Legal & Safe Policies

* **License:** [LICENSE.md](LICENSE.md) — Copyright © 2026 UCDREAMS TECHNOLOGIES LLP.
* **Privacy Charter:** [PRIVACY.md](PRIVACY.md) — 100% Local-first, zero telemetry tracking.
* **Terms of Service:** [TERMS.md](TERMS.md) — Safe hypervisor execution & limitation of liability.
* **Security:** [SECURITY.md](SECURITY.md) — Responsible disclosure protocol.

---

## 🤝 Corporate & Developer Attribution

* **Company:** [UCDREAMS TECHNOLOGIES LLP](https://ucdreams.com)
* **Lead Developer:** [Uchit Chakma](https://uchitchakma.com)
* **Official Repository:** [github.com/uchitchakma/quickOS](https://github.com/uchitchakma/quickOS)
