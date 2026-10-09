<div align="center">
  <img src="public/app-icon.png" width="120" height="120" alt="quickOS App Icon" style="border-radius: 24px; box-shadow: 0 8px 24px rgba(197,69,62,0.25);" />
  <h1>quickOS</h1>
  <h3>⚡ Universal Local OS Virtualization, Hypervisor & Cross-Platform App Runner</h3>
  <p><strong>Run Real Windows 11, Ubuntu Linux, macOS, and Windows .exe Apps Locally on Mac & Cross-Platform</strong></p>
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

**quickOS** is an ultra-fast, local operating system runner, hypervisor, and application testing suite engineered for developers, QA testers, and power users.

Instead of buying separate physical computers or dealing with bloated third-party software, **quickOS** enables you to boot and run **real, genuine local operating systems (Windows 11 ARM64, Ubuntu 24.04 LTS Linux, macOS)** and test **Windows `.exe` / `.msi` applications** directly on your Mac or PC with hardware-accelerated speed.

Built with **Tauri 2.0 (Rust) + Swift Native Hypervisor (`Virtualization.framework`) + TypeScript**, quickOS delivers bare-metal paravirtualized performance, Metal 3 GPU acceleration (60 FPS), instant startup (<200 ms), and minimal host memory footprint.

---

## 🎨 Theme & Brand Identity

* **Primary Accent Color:** `#C5453E`
* **Theme Styling:** Obsidian Dark Glassmorphism with live micro-telemetry gauges
* **Company:** [UCDREAMS TECHNOLOGIES LLP](https://ucdreams.com)
* **Lead Developer:** [Uchit Chakma](https://uchitchakma.com)

---

## 🚀 Core Capabilities

### 🪟 1. Genuine Windows 11 Native VM
* **Real Hardware-Accelerated VM:** Boots genuine Windows 11 ARM64 directly on Apple Silicon M-Series Macs using Apple's native `Virtualization.framework` (`VZVirtualMachine`).
* **Metal 3 Graphics Acceleration:** 60 FPS smooth native graphics rendering inside dedicated Cocoa windows.
* **Paravirtualized NVMe Storage:** Ultra-fast disk I/O over APFS sparse disks.
* **Full Peripherals & Network:** Shared clipboard, host audio streaming directly to Mac speakers, USB keyboard/mouse pass-through, and NAT bridged internet networking.
* **Direct Official Download Access:** Built-in 1-click links to download official Microsoft Windows 11 ARM64 ISOs (via UUP dump with zero login required or Microsoft Software Download Center).

### 🐧 2. Genuine Ubuntu Linux 24.04 LTS VM
* **Native Linux Kernel Execution:** Direct kernel boot with hardware virtualization, live GUI framebuffer, and interactive terminal.
* **Development & Docker Ready:** Full `apt` package repository access for compiling, testing Linux binaries, and running containerized server environments.

### ⚡ 3. Instant 1-Click Windows `.exe` App Runner
* **Zero Boot Time:** Launch and test Windows `.exe` and `.msi` application binaries natively on macOS without waiting 30 minutes for a full operating system to boot.

### 💽 4. Custom Storage Target (External SSD / HDD Support)
* **Install on External SSDs or HDDs:** Install and store large virtual hard disks (`.img` / `.raw`) and ISOs on external storage (Samsung T7, SanDisk, Crucial, external HDDs) to keep your internal Mac drive free.
* **APFS Sparse Allocation:** Creates 32GB or 20GB virtual hard disks in seconds that only consume ~10MB initially and grow dynamically as you install apps.

### 🔄 5. Smart Path Persistence & Live Reconnection Watcher
* **Persistent Configuration:** Automatically saves and restores all your custom installation paths, disk images, ISO paths, vCPUs, and RAM configurations across app reboots.
* **Automatic Disconnect / Reconnect Detection:** Background telemetry monitors drive mount status every 4 seconds. If an external SSD is disconnected, quickOS protects the VM and displays a warning (`⚠️ External Drive Disconnected`); as soon as you plug it back in, quickOS detects it and re-enables controls without losing your settings.

### 📊 6. Integrated System & Hardware Diagnostics Suite
* **Real-time Telemetry:** Live CPU multi-core load, RAM usage, swap space, and battery charge status.
* **Wi-Fi & Airwaves Scanner:** Discovers surrounding 2.4GHz & 5GHz Wi-Fi access points with RSSI signal meters, BSSID, and security protocols.
* **Bluetooth Accessories:** Inventory of connected/paired Bluetooth devices (keyboards, mice, AirPods, headsets).
* **Hardware Benchmarks:** Safe in-memory CPU floating-point benchmarking, RAM bus throughput, and storage sector I/O validation.
* **ICMP Ping Tester:** Live DNS resolution and low-latency round-trip response timing.

---

## 📖 How to Use quickOS

### How to Run Real Windows 11 on Mac:
1. Open **quickOS** and navigate to the **Virtual OS Lab** tab.
2. Under **Windows 11 Native VM**, select your **Storage Target Drive** (Internal or External SSD/HDD).
3. Click **Create 32GB Disk** to instantly generate an APFS sparse disk image.
4. Select your **Windows 11 ARM64 ISO** (or click the *UUP dump* download link to fetch the genuine Microsoft build).
5. Choose your desired **Virtual CPUs** (e.g. 4 vCPUs) and **Dedicated RAM** (e.g. 4096 MB).
6. Click **Boot Real Native Windows 11 VM** — Windows boots up immediately in a native display window with full keyboard, mouse, audio, and network support!

### How to Run Windows `.exe` Apps Directly:
1. Go to the **Run Windows .exe Directly** sub-tab in **Virtual OS Lab**.
2. Click **Browse .exe...** or enter the path to any `.exe` or `.msi` file.
3. Click **Run .exe Natively on Mac** to launch the software instantly.

---

## 💻 Zero-Hardware Cross-Platform Matrix

Test all target operating systems without buying extra machines:

| Target Platform | Virtualization & Execution Strategy | Performance |
| :--- | :--- | :--- |
| **Windows 11 (ARM64)** | Apple `Virtualization.framework` + Metal 3 GPU | Hardware-Accelerated Bare-Metal |
| **Ubuntu Linux (ARM64)** | Native Linux Kernel VM + VirtIO Console | Native Multi-Core Compute |
| **Windows .exe / .msi** | Direct Binary Compatibility Layer | Instant 1-Click Launch (<1s) |
| **macOS (Darwin)** | Host Native Execution (`npm run tauri dev`) | Bare Metal |
| **iOS / iPadOS** | Xcode Simulator (`tauri ios dev`) | Simulated Native Engine |
| **Android** | Android Studio Virtual Device (`tauri android dev`) | QEMU Accelerated |

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

## 🏛️ Project Architecture

```
quickOS/
├── src/                                  # High-efficiency Webview UI (TypeScript + HTML5)
│   ├── index.html                        # Dashboard & Virtual OS Lab UI
│   ├── styles.css                        # #C5453E Glassmorphic design tokens
│   └── main.ts                           # VM settings persistence & hardware IPC dispatchers
├── src-tauri/                            # Rust & Swift Hypervisor Core
│   ├── Cargo.toml                        # Rust dependencies (tauri 2.0, sysinfo)
│   ├── build.rs                          # Automated Swift hypervisor compilation
│   ├── native/
│   │   └── quickos_vm_engine.swift       # Apple Silicon Virtualization.framework engine
│   ├── bin/
│   │   └── quickos-vm                    # Compiled native hypervisor binary
│   └── src/
│       ├── main.rs                       # App bootstrap
│       └── lib.rs                        # Hypervisor commands, disk creation & storage watcher
├── docs/                                 # Documentation & Guides
│   ├── ARCHITECTURE.md                   # Technical design & hypervisor pipeline
│   └── CROSS_PLATFORM_TESTING.md         # Multi-OS testing guide
├── .github/workflows/                    # Automated CI/CD
│   └── build-and-release.yml             # macOS, Windows & Ubuntu automated builds
├── LICENSE.md                            # Proprietary / Safe Commercial License
├── TERMS.md                              # Terms of Service
├── PRIVACY.md                            # Local-First Privacy Policy
└── SECURITY.md                           # Vulnerability Disclosure Policy
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
