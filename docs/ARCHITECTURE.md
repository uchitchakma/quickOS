# quickOS Architecture Specification

**Product:** quickOS — Universal Local OS Virtualization, Hypervisor & Cross-Platform App Runner  
**Organization:** UCDREAMS TECHNOLOGIES LLP (<https://ucdreams.com>)  
**Lead Developer:** Uchit Chakma (<https://uchitchakma.com>)

---

## 1. High-Level Architecture Overview

quickOS is engineered with a high-performance multi-tier architecture separating the **Native Apple Hypervisor Engine** (Swift + `Virtualization.framework`), the **Hardware Interrogation & IPC Core** (Rust + Tauri 2.0), and the **Zero-Bloat UI** (TypeScript + HTML5).

```mermaid
flowchart TD
    subgraph UI ["Frontend Webview Layer (TypeScript + HTML5)"]
        A["Virtual OS Lab (Win 11 / Ubuntu / .exe)"]
        B["Storage Target Manager (SSD / HDD)"]
        C["Hardware Telemetry & Specs"]
        D["Diagnostics & Ping Suite"]
    end

    subgraph IPC ["Tauri 2.0 IPC Bridge"]
        E["IPC Commands & Path Status Validator"]
    end

    subgraph Core ["Rust Native Core (quickos_lib)"]
        F["Hypervisor Coordinator"]
        G["Sparse Disk Engine (APFS / ext4)"]
        H["Drive Reconnection Monitor"]
        I["Telemetry & sysinfo"]
    end

    subgraph Hypervisor ["Native Hypervisor Engine (quickos-vm / Swift 6.2)"]
        J1["VZVirtualMachine (Apple Silicon Hypervisor)"]
        J2["Metal 3 GPU Framebuffer (60 FPS)"]
        J3["Paravirtualized NVMe VirtIO Block Device"]
        J4["NAT Bridged Networking & Audio Sink"]
        J5["Windows Binary Runner (Compatibility Layer)"]
    end

    UI --> IPC
    IPC --> Core
    Core --> Hypervisor
```

---

## 2. Operating System Virtualization Pipeline

| Target OS / Mode | Engine Core | Acceleration & Hardware Drivers | Storage Strategy |
| :--- | :--- | :--- | :--- |
| **Windows 11 ARM64** | `VZVirtualMachine` | Metal 3 GPU + NVMe VirtIO + USB HID + Audio Sink | APFS Sparse Disk (`.img` / `.raw`) on SSD/HDD |
| **Ubuntu Linux 24.04** | Direct Linux Kernel VM | VirtIO GPU + VirtIO Console + NAT Bridge | APFS Sparse Disk (`.img`) on SSD/HDD |
| **Windows .exe Launcher** | Native Binary Translator | Win32 / POSIX API Layer | Direct execution from Host or External SSD |

---

## 3. Brand Identity & Design Tokens

- **Primary Brand Color:** `#C5453E`
- **Hover / Accent:** `#D8564F`
- **Background Base:** `#0B0D11`
- **Cards Base:** `#151922`
- **Corporate Entity:** UCDREAMS TECHNOLOGIES LLP
- **Lead Developer:** Uchit Chakma
