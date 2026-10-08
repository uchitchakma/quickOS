# quickOS Architecture Specification

**Product:** quickOS — Universal Diagnostics & Hardware Suite  
**Organization:** UCDREAMS TECHNOLOGIES LLP (<https://ucdreams.com>)  
**Lead Developer:** Uchit Chakma (<https://uchitchakma.com>)

---

## 1. High-Level Architecture Overview

quickOS is designed around a lightweight, multi-layered architecture separating high-performance native OS interrogation (Rust) from zero-bloat user interface rendering (Native OS WebViews).

```mermaid
flowchart TD
    subgraph UI ["Frontend Webview Layer (TypeScript + HTML5)"]
        A["DOM & Theme Engine (#C5453E)"]
        B["Telemetry Dispatcher"]
        C["Diagnostics Runner"]
        D["Ping & ICMP View"]
    end

    subgraph IPC ["Tauri 2.0 IPC Bridge"]
        E["IPC Commands & JSON Serializer"]
    end

    subgraph Rust ["Rust 2.0 Native Core (quickos_lib)"]
        F["System Specs & Sysinfo"]
        G["Wi-Fi & Radio Layer"]
        H["Bluetooth & Peripheral Manager"]
        I["Benchmarking & Stress Matrix"]
        J["ICMP Ping Engine"]
    end

    subgraph OS ["Operating System Kernel & Hardware Interfaces"]
        K1["macOS (CoreWLAN, IOBluetooth, Darwin)"]
        K2["Windows (WLAN Netsh, PnP, Win32 APIs)"]
        K3["Linux / Ubuntu (BlueZ, NetworkManager, sysfs)"]
        K4["Android / iOS (NDK / WebKit Mobile)"]
    end

    UI --> IPC
    IPC --> Rust
    Rust --> OS
```

---

## 2. Platform Interrogation Strategies

| Component | macOS (Darwin) | Linux (Ubuntu/Debian) | Windows (10/11) |
| :--- | :--- | :--- | :--- |
| **System Info & CPU** | `sysinfo` + `sysctl` | `sysinfo` + `/proc/cpuinfo` | `sysinfo` + WMI |
| **Memory & Disks** | `sysinfo` + APFS mounts | `sysinfo` + `statvfs` | `sysinfo` + NTFS/FAT |
| **Wi-Fi Scanner** | `networksetup` + `wdutil` | `nmcli` + `iwconfig` | `netsh wlan` |
| **Bluetooth Scanner** | `system_profiler SPBluetooth` | `bluetoothctl` + `BlueZ` | `PowerShell Get-PnpDevice` |
| **Battery Power** | `pmset -g batt` | `/sys/class/power_supply` | `Win32_Battery` |
| **Network Latency** | POSIX `ping -c 2` | POSIX `ping -c 2` | Win32 `ping -n 2` |

---

## 3. Brand Identity & Theme Tokens

- **Primary Brand Color:** `#C5453E`
- **Hover / Accent:** `#D8564F`
- **Background Base:** `#0B0D11`
- **Cards Base:** `#151922`
- **Corporate Entity:** UCDREAMS TECHNOLOGIES LLP
- **Lead Developer:** Uchit Chakma
