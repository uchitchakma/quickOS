# Privacy Policy & Data Sovereignty Charter

**Product:** quickOS  
**Published by:** UCDREAMS TECHNOLOGIES LLP (<https://ucdreams.com>)  
**Lead Developer:** Uchit Chakma (<https://uchitchakma.com>)  
**Effective Date:** 2026

---

### 1. Zero Telemetry & Local-First Philosophy
At **UCDREAMS TECHNOLOGIES LLP**, we believe diagnostics utilities must respect user privacy and system confidentiality. **quickOS is engineered with a strict 100% Local-First Architecture.**

### 2. Information Handled Locally
When running quickOS on your machine (macOS, Windows, Ubuntu/Linux, Android, or iOS):
- **Hardware Telemetry:** CPU frequency, core counts, RAM utilization, storage disk mounts, and battery stats are queried directly through native OS APIs and stored strictly in RAM during execution.
- **Wi-Fi & Network Data:** SSIDs, BSSIDs, Signal RSSI, IP addresses, MAC addresses, and network interface stats are displayed locally for your diagnostics only.
- **Bluetooth Devices:** Connected/paired peripheral names and MAC identifiers remain strictly within your device's memory.
- **Ping & Latency Tests:** Ping queries are dispatched directly from your device to the destination IP/host you specify (e.g., `1.1.1.1`). No intermediary proxy intercepts this data.

### 3. No Remote Exfiltration
quickOS **DOES NOT**:
- Send hardware fingerprints to cloud servers.
- Collect advertising identifiers, analytics cookies, or behavioral telemetry.
- Upload network scans, Wi-Fi keys, or device lists to any external party.

### 4. Updates & Security
Any future check for application updates will only connect directly to official GitHub releases (`github.com/uchitchakma/quickOS`) without transmitting user metadata.

---
For questions regarding our privacy practices, visit <https://ucdreams.com> or contact <privacy@ucdreams.com>.
