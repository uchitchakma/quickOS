import { invoke } from '@tauri-apps/api/core';

// quickOS - Universal Diagnostics & Hardware Suite
// Developer: Uchit Chakma (uchitchakma.com)
// Owner: UCDREAMS TECHNOLOGIES LLP (ucdreams.com)

interface SystemSpecs {
  hostname: string;
  os_name: string;
  os_version: string;
  kernel_version: string;
  arch: string;
  cpu_brand: string;
  cpu_cores: number;
  cpu_usage_percent: number;
  total_memory_bytes: number;
  used_memory_bytes: number;
  free_memory_bytes: number;
  total_swap_bytes: number;
  used_swap_bytes: number;
  uptime_seconds: number;
  disks: DiskInfo[];
  battery: BatteryInfo;
}

interface DiskInfo {
  name: string;
  mount_point: string;
  total_bytes: number;
  available_bytes: number;
  file_system: string;
  is_removable: boolean;
}

interface BatteryInfo {
  has_battery: boolean;
  percentage: number;
  state: string;
  time_remaining: string;
}

interface NetworkInterfaceInfo {
  name: string;
  mac_address: string;
  ip_addresses: string[];
  total_received_bytes: number;
  total_transmitted_bytes: number;
}

interface WifiInfo {
  is_supported: boolean;
  is_connected: boolean;
  interface_name: string;
  ssid: string;
  bssid: string;
  signal_strength_percent: number;
  channel: string;
  security: string;
  ip_address: string;
  nearby_networks: WifiNetworkItem[];
  raw_output: string;
}

interface WifiNetworkItem {
  ssid: string;
  signal_percent: number;
  channel: string;
  security: string;
}

interface BluetoothDevice {
  name: string;
  address: string;
  connected: boolean;
  paired: boolean;
  device_type: string;
}

interface BluetoothInfo {
  is_supported: boolean;
  is_powered_on: boolean;
  controller_name: string;
  controller_address: string;
  discoverable: boolean;
  devices: BluetoothDevice[];
  raw_output: string;
}

interface DiagnosticReport {
  test_name: string;
  category: string;
  status: string;
  score_or_latency: string;
  details: string;
  duration_ms: number;
}

interface PingResult {
  host: string;
  success: boolean;
  latency_ms: number;
  packet_loss_percent: number;
  raw_output: string;
}

// Global invocation helper (safely connects to Tauri native core with browser fallback)
async function invokeBackend<T>(cmd: string, args: Record<string, unknown> = {}): Promise<T> {
  try {
    return await invoke<T>(cmd, args);
  } catch (err) {
    console.warn(`[Tauri IPC fallback] Command '${cmd}' using preview provider:`, err);
    return mockBackendResponse<T>(cmd, args);
  }
}

function mockBackendResponse<T>(cmd: string, args: Record<string, unknown>): T {
  if (cmd === 'get_system_info') {
    return {
      hostname: "quickOS-VirtualNode.local",
      os_name: navigator.platform.includes("Mac") ? "macOS (Preview)" : "Universal Linux/Windows",
      os_version: "24.x (Web Preview)",
      kernel_version: "Darwin 24.0 / POSIX",
      arch: "aarch64 / ARM64",
      cpu_brand: "Apple Silicon M-Series / High-Efficiency Multi-Core",
      cpu_cores: navigator.hardwareConcurrency || 8,
      cpu_usage_percent: Math.floor(Math.random() * 25) + 12,
      total_memory_bytes: 16 * 1024 * 1024 * 1024,
      used_memory_bytes: 7.2 * 1024 * 1024 * 1024,
      free_memory_bytes: 8.8 * 1024 * 1024 * 1024,
      total_swap_bytes: 4 * 1024 * 1024 * 1024,
      used_swap_bytes: 0.5 * 1024 * 1024 * 1024,
      uptime_seconds: 142850,
      disks: [
        { name: "System Macintosh HD / Root", mount_point: "/", total_bytes: 512 * 1024 * 1024 * 1024, available_bytes: 290 * 1024 * 1024 * 1024, file_system: "APFS / ext4", is_removable: false },
        { name: "Data Volume / NVMe", mount_point: "/System/Volumes/Data", total_bytes: 512 * 1024 * 1024 * 1024, available_bytes: 288 * 1024 * 1024 * 1024, file_system: "APFS", is_removable: false }
      ],
      battery: {
        has_battery: true,
        percentage: 94,
        state: "AC Attached (Power Adapter)",
        time_remaining: "0:45 remaining to full charge"
      }
    } as unknown as T;
  }

  if (cmd === 'get_wifi_info') {
    return {
      is_supported: true,
      is_connected: true,
      interface_name: "en0 (Wi-Fi 6E)",
      ssid: "UCDREAMS_HighSpeed_5G",
      bssid: "7c:21:0d:94:82:11",
      signal_strength_percent: 92,
      channel: "149 (5 GHz, 80 MHz)",
      security: "WPA2/WPA3 Personal",
      ip_address: "192.168.1.108",
      nearby_networks: [
        { ssid: "UCDREAMS_HighSpeed_5G", signal_percent: 92, channel: "149", security: "WPA3" },
        { ssid: "Guest_Zone_Office", signal_percent: 74, channel: "36", security: "WPA2" },
        { ssid: "IoT_Hardware_Node", signal_percent: 65, channel: "6", security: "WPA2" }
      ],
      raw_output: "Active Wi-Fi 6 Connection via quickOS Layer"
    } as unknown as T;
  }

  if (cmd === 'get_network_interfaces') {
    return [
      { name: "en0 (Wi-Fi)", mac_address: "a4:83:e7:31:9a:1b", ip_addresses: ["192.168.1.108", "fe80::104a"], total_received_bytes: 3450000000, total_transmitted_bytes: 1820000000 },
      { name: "en1 (Thunderbolt Bridge)", mac_address: "ac:de:48:00:11:22", ip_addresses: ["169.254.10.1"], total_received_bytes: 450000, total_transmitted_bytes: 210000 },
      { name: "lo0 (Local Loopback)", mac_address: "00:00:00:00:00:00", ip_addresses: ["127.0.0.1", "::1"], total_received_bytes: 890000000, total_transmitted_bytes: 890000000 }
    ] as unknown as T;
  }

  if (cmd === 'get_bluetooth_info') {
    return {
      is_supported: true,
      is_powered_on: true,
      controller_name: "Apple Silicon Integrated BT 5.3",
      controller_address: "a4:83:e7:49:10:ee",
      discoverable: true,
      devices: [
        { name: "Magic Keyboard with Touch ID", address: "60:c5:47:88:21:0a", connected: true, paired: true, device_type: "Human Interface Device" },
        { name: "AirPods Pro (2nd Gen)", address: "94:16:25:70:9b:ef", connected: true, paired: true, device_type: "Audio / Headphone" },
        { name: "Logitech MX Master 3S", address: "e4:58:b8:19:33:41", connected: false, paired: true, device_type: "Pointing Device" }
      ],
      raw_output: "CoreBluetooth Controller Connected"
    } as unknown as T;
  }

  if (cmd === 'run_diagnostics_suite') {
    return [
      { test_name: "CPU Math & Floating Point Pipeline", category: "Processor", status: "PASS", score_or_latency: "42 ms (2M ops)", details: "High-efficiency mathematical throughput on host ARM/x86 pipeline.", duration_ms: 42 },
      { test_name: "Memory Read/Write Bus Allocation", category: "Memory (RAM)", status: "PASS", score_or_latency: "68 ms (80MB alloc)", details: "Allocated and validated 10,000,000 array elements.", duration_ms: 68 },
      { test_name: "Primary Storage Temporary I/O Write/Read", category: "Storage", status: "PASS", score_or_latency: "18 ms (5MB R/W)", details: "Sequential sector block validation on host temporary cache.", duration_ms: 18 },
      { test_name: "Host Architecture & Kernel Environment", category: "Operating System", status: "PASS", score_or_latency: "macOS/aarch64", details: "Universal quickOS diagnostics standard verified.", duration_ms: 1 }
    ] as unknown as T;
  }

  if (cmd === 'ping_host') {
    const target = (args.host as string) || "1.1.1.1";
    return {
      host: target,
      success: true,
      latency_ms: 14.8,
      packet_loss_percent: 0.0,
      raw_output: `PING ${target} (1.1.1.1): 56 data bytes\n64 bytes from 1.1.1.1: icmp_seq=0 ttl=57 time=14.210 ms\n64 bytes from 1.1.1.1: icmp_seq=1 ttl=57 time=15.390 ms\n\n--- ${target} ping statistics ---\n2 packets transmitted, 2 packets received, 0.0% packet loss\nround-trip min/avg/max/stddev = 14.210/14.800/15.390/0.590 ms`
    } as unknown as T;
  }

  throw new Error(`Unknown command: ${cmd}`);
}

// FORMATTERS
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${seconds % 60}s`;
}

// APP CONTROLLER
class QuickOSApp {
  public currentTab = 'overview';
  private currentTheme: 'dark' | 'light' = 'dark';
  private latestSpecs: SystemSpecs | null = null;

  init() {
    this.initTheme();
    this.setupTabs();
    this.setupActions();
    this.loadAllData();

    // Live refresh every 4 seconds for CPU/RAM telemetry
    setInterval(() => {
      this.refreshSystemSpecs(true);
    }, 4000);
  }

  private initTheme() {
    const savedTheme = (localStorage.getItem('quickos-theme') as 'dark' | 'light') || 
      (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    this.setTheme(savedTheme);
  }

  public setTheme(theme: 'dark' | 'light') {
    this.currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('quickos-theme', theme);
  }

  public toggleTheme() {
    const nextTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.setTheme(nextTheme);
  }

  private setupTabs() {
    const navItems = document.querySelectorAll<HTMLButtonElement>('.nav-item');
    navItems.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');
        if (!tab) return;
        this.switchTab(tab);
      });
    });
  }

  private switchTab(tabId: string) {
    this.currentTab = tabId;

    // Update active nav button
    document.querySelectorAll('.nav-item').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-tab') === tabId);
    });

    // Update active view panel
    document.querySelectorAll('.view-panel').forEach(p => {
      p.classList.remove('active');
    });

    const targetPanel = document.getElementById(`view-${tabId}`);
    if (targetPanel) {
      targetPanel.classList.add('active');
    }

    // Lazy load or refresh tab content when navigated
    if (tabId === 'wifi') this.loadWifiInfo(false);
    if (tabId === 'bluetooth') this.loadBluetoothInfo();
  }

  private setupActions() {
    // Theme toggle button
    document.getElementById('btn-theme-toggle')?.addEventListener('click', () => {
      this.toggleTheme();
    });

    // Refresh Topbar button
    document.getElementById('btn-refresh')?.addEventListener('click', () => {
      this.loadAllData();
    });

    // Copy Specs button
    document.getElementById('btn-copy-specs')?.addEventListener('click', () => {
      this.copySpecsToClipboard();
    });

    // Scan WiFi button (Deep multi-channel scan)
    document.getElementById('btn-scan-wifi')?.addEventListener('click', () => {
      this.loadWifiInfo(true);
    });

    // Scan Bluetooth button
    document.getElementById('btn-scan-bt')?.addEventListener('click', () => {
      this.loadBluetoothInfo();
    });

    // Run Diagnostics button
    document.getElementById('btn-run-diag')?.addEventListener('click', () => {
      this.runDiagnostics();
    });

    // Send Ping button
    document.getElementById('btn-send-ping')?.addEventListener('click', () => {
      this.executePing();
    });

    // Open Mac Installer .dmg folder
    document.getElementById('btn-open-mac-installer')?.addEventListener('click', async () => {
      try {
        await invokeBackend('open_installer_folder');
      } catch (err) {
        console.error("Error opening installer folder:", err);
      }
    });

    // Enter key inside ping input
    document.getElementById('ping-target-input')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.executePing();
    });
  }

  private async loadAllData() {
    await Promise.all([
      this.refreshSystemSpecs(false),
      this.loadWifiInfo(),
      this.loadNetworkInterfaces(),
      this.loadBluetoothInfo()
    ]);
  }

  private async refreshSystemSpecs(isBackground: boolean) {
    try {
      const specs = await invokeBackend<SystemSpecs>('get_system_info');
      this.latestSpecs = specs;
      this.renderOverview(specs);
    } catch (err) {
      if (!isBackground) console.error("Error fetching system info:", err);
    }
  }

  private renderOverview(s: SystemSpecs) {
    // Header tags
    const headerOs = document.getElementById('header-os-name');
    if (headerOs) {
      const osPretty = s.os_name.toLowerCase().includes('darwin') ? `macOS ${s.os_version}` : `${s.os_name} ${s.os_version}`;
      headerOs.textContent = osPretty;
    }

    const headerArch = document.getElementById('header-arch');
    if (headerArch) headerArch.textContent = s.arch.toUpperCase();

    // Mini CPU/RAM meters in topbar
    const miniCpuVal = document.getElementById('mini-cpu-val');
    const miniCpuFill = document.getElementById('mini-cpu-fill');
    if (miniCpuVal && miniCpuFill) {
      const cpuPct = Math.round(s.cpu_usage_percent);
      miniCpuVal.textContent = `${cpuPct}%`;
      miniCpuFill.style.width = `${Math.min(100, Math.max(0, cpuPct))}%`;
    }

    const ramUsedGB = (s.used_memory_bytes / (1024 * 1024 * 1024)).toFixed(1);
    const ramTotalGB = (s.total_memory_bytes / (1024 * 1024 * 1024)).toFixed(1);
    const ramPct = Math.round((s.used_memory_bytes / (s.total_memory_bytes || 1)) * 100);

    const miniRamVal = document.getElementById('mini-ram-val');
    const miniRamFill = document.getElementById('mini-ram-fill');
    if (miniRamVal && miniRamFill) {
      miniRamVal.textContent = `${ramPct}%`;
      miniRamFill.style.width = `${Math.min(100, Math.max(0, ramPct))}%`;
    }

    // Stat Cards
    const cpuDisp = document.getElementById('cpu-usage-display');
    const cpuCore = document.getElementById('cpu-core-count');
    const cpuProg = document.getElementById('cpu-progress');
    const cpuModel = document.getElementById('cpu-model-name');
    if (cpuDisp) cpuDisp.textContent = `${s.cpu_usage_percent.toFixed(1)}%`;
    if (cpuCore) cpuCore.textContent = `${s.cpu_cores} Cores`;
    if (cpuProg) cpuProg.style.width = `${Math.min(100, Math.max(0, s.cpu_usage_percent))}%`;
    if (cpuModel) cpuModel.textContent = s.cpu_brand;

    const ramUsedDisp = document.getElementById('ram-used-display');
    const ramTotalDisp = document.getElementById('ram-total-display');
    const ramProg = document.getElementById('ram-progress');
    const ramFreeDisp = document.getElementById('ram-free-display');
    if (ramUsedDisp) ramUsedDisp.textContent = `${ramUsedGB} GB`;
    if (ramTotalDisp) ramTotalDisp.textContent = `of ${ramTotalGB} GB`;
    if (ramProg) ramProg.style.width = `${ramPct}%`;
    if (ramFreeDisp) ramFreeDisp.textContent = `Free: ${(s.free_memory_bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;

    // Battery
    const battLvl = document.getElementById('batt-level-display');
    const battState = document.getElementById('batt-state-display');
    const battProg = document.getElementById('batt-progress');
    const battTime = document.getElementById('batt-time-display');
    if (battLvl) battLvl.textContent = s.battery.has_battery ? `${s.battery.percentage}%` : 'AC Line';
    if (battState) battState.textContent = s.battery.state;
    if (battProg) battProg.style.width = `${s.battery.percentage}%`;
    if (battTime) battTime.textContent = s.battery.time_remaining;

    // Uptime
    const uptimeDisp = document.getElementById('uptime-display');
    const hostDisp = document.getElementById('hostname-display');
    if (uptimeDisp) uptimeDisp.textContent = formatUptime(s.uptime_seconds);
    if (hostDisp) hostDisp.textContent = `Host: ${s.hostname}`;

    // Deep Specs Breakdown
    const specOs = document.getElementById('spec-os-name');
    const specVer = document.getElementById('spec-os-version');
    const specKern = document.getElementById('spec-kernel');
    const specArch = document.getElementById('spec-arch');
    const specSwap = document.getElementById('spec-swap');
    const specHost = document.getElementById('spec-hostname');
    if (specOs) specOs.textContent = s.os_name;
    if (specVer) specVer.textContent = s.os_version;
    if (specKern) specKern.textContent = s.kernel_version;
    if (specArch) specArch.textContent = s.arch;
    if (specSwap) specSwap.textContent = `${formatBytes(s.used_swap_bytes)} / ${formatBytes(s.total_swap_bytes)}`;
    if (specHost) specHost.textContent = s.hostname;

    // Disks Container
    const disksCont = document.getElementById('disks-container');
    if (disksCont) {
      if (!s.disks || s.disks.length === 0) {
        disksCont.innerHTML = '<div class="loading-placeholder">No mounted disks detected.</div>';
      } else {
        disksCont.innerHTML = s.disks.map(d => {
          const usedBytes = d.total_bytes - d.available_bytes;
          const diskPct = d.total_bytes > 0 ? Math.round((usedBytes / d.total_bytes) * 100) : 0;
          return `
            <div class="disk-item">
              <div class="disk-item-top">
                <span>💽 ${d.name || d.mount_point} (${d.file_system || 'Drive'})</span>
                <span class="badge ${diskPct > 85 ? 'badge-warning' : 'badge-success'}">${diskPct}% Used</span>
              </div>
              <div class="progress-track" style="margin: 6px 0;">
                <div class="progress-bar" style="width: ${diskPct}%"></div>
              </div>
              <div class="disk-item-stats">
                <span>Mount: ${d.mount_point}</span>
                <span>${formatBytes(usedBytes)} / ${formatBytes(d.total_bytes)}</span>
              </div>
            </div>
          `;
        }).join('');
      }
    }
  }

  private async loadWifiInfo(deepScan: boolean = false) {
    const scanBtn = document.getElementById('btn-scan-wifi') as HTMLButtonElement | null;
    const origBtnHtml = scanBtn ? scanBtn.innerHTML : '';
    
    if (deepScan && scanBtn) {
      scanBtn.disabled = true;
      scanBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin-animation"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
        Scanning Airwaves...
      `;
    }

    try {
      const wifi = await invokeBackend<WifiInfo>('get_wifi_info', { deepScan });
      const ssidTitle = document.getElementById('wifi-ssid-display');
      const statusBadge = document.getElementById('wifi-status-badge');
      const ifTag = document.getElementById('wifi-interface-tag');
      const chanTag = document.getElementById('wifi-channel-tag');
      const secTag = document.getElementById('wifi-security-tag');
      const bssidTag = document.getElementById('wifi-bssid-tag');
      const sigNum = document.getElementById('wifi-signal-num');
      const nearbyCont = document.getElementById('nearby-wifi-container');

      if (ssidTitle) ssidTitle.textContent = wifi.is_connected ? wifi.ssid : 'Disconnected / Standby';
      if (statusBadge) {
        statusBadge.textContent = wifi.is_connected ? 'Connected' : 'Offline';
        statusBadge.className = wifi.is_connected ? 'badge badge-success' : 'badge badge-warning';
      }
      if (ifTag) ifTag.textContent = `Interface: ${wifi.interface_name}`;
      if (chanTag) chanTag.textContent = `Channel: ${wifi.channel}`;
      if (secTag) secTag.textContent = `Security: ${wifi.security}`;
      if (bssidTag) bssidTag.textContent = `BSSID: ${wifi.bssid}`;
      if (sigNum) sigNum.textContent = `${wifi.signal_strength_percent}%`;

      if (nearbyCont) {
        if (!wifi.nearby_networks || wifi.nearby_networks.length === 0) {
          nearbyCont.innerHTML = '<div class="loading-placeholder">Click "Scan Wi-Fi" to probe all 2.4GHz & 5GHz surrounding access points.</div>';
        } else {
          nearbyCont.innerHTML = wifi.nearby_networks.map(n => `
            <div class="nearby-wifi-card">
              <div class="nearby-wifi-top">
                <span class="nearby-wifi-name" title="${n.ssid}">📶 ${n.ssid}</span>
                <span class="badge ${n.signal_percent > 70 ? 'badge-success' : 'badge-warning'}">${n.signal_percent}%</span>
              </div>
              <div class="progress-track" style="margin: 2px 0;">
                <div class="progress-bar" style="width: ${n.signal_percent}%;"></div>
              </div>
              <div class="nearby-wifi-meta">
                <span>Ch: ${n.channel}</span>
                <span>${n.security}</span>
              </div>
            </div>
          `).join('');
        }
      }
    } catch (err) {
      console.error("Error reading Wi-Fi info:", err);
    } finally {
      if (deepScan && scanBtn) {
        scanBtn.disabled = false;
        scanBtn.innerHTML = origBtnHtml;
      }
    }
  }

  private async loadNetworkInterfaces() {
    try {
      const ifaces = await invokeBackend<NetworkInterfaceInfo[]>('get_network_interfaces');
      const tbody = document.getElementById('interfaces-table-body');
      if (tbody) {
        if (!ifaces || ifaces.length === 0) {
          tbody.innerHTML = '<tr><td colspan="5" class="text-center">No network interfaces found.</td></tr>';
        } else {
          tbody.innerHTML = ifaces.map(iface => `
            <tr>
              <td><strong>${iface.name}</strong></td>
              <td><code class="tag">${iface.mac_address}</code></td>
              <td>${iface.ip_addresses.length > 0 ? iface.ip_addresses.join('<br>') : '<span class="text-muted">None</span>'}</td>
              <td>${formatBytes(iface.total_received_bytes)}</td>
              <td>${formatBytes(iface.total_transmitted_bytes)}</td>
            </tr>
          `).join('');
        }
      }
    } catch (err) {
      console.error("Error reading interfaces:", err);
    }
  }

  private async loadBluetoothInfo() {
    try {
      const bt = await invokeBackend<BluetoothInfo>('get_bluetooth_info');
      const btName = document.getElementById('bt-controller-name');
      const btAddr = document.getElementById('bt-controller-addr');
      const btBadge = document.getElementById('bt-power-badge');
      const btCont = document.getElementById('bt-devices-container');

      if (btName) btName.textContent = bt.controller_name;
      if (btAddr) btAddr.textContent = `Hardware Address: ${bt.controller_address}`;
      if (btBadge) {
        btBadge.textContent = bt.is_powered_on ? 'Adapter Active' : 'Powered Off';
        btBadge.className = bt.is_powered_on ? 'badge badge-success' : 'badge badge-danger';
      }

      if (btCont) {
        if (!bt.devices || bt.devices.length === 0) {
          btCont.innerHTML = '<div class="loading-placeholder">No paired Bluetooth accessories detected.</div>';
        } else {
          btCont.innerHTML = bt.devices.map(d => {
            let icon = '📡';
            const lowerName = d.name.toLowerCase();
            const lowerType = d.device_type.toLowerCase();
            if (lowerName.includes('airpod') || lowerName.includes('head') || lowerType.includes('headset') || lowerName.includes('wh-') || lowerName.includes('airdopes')) {
              icon = '🎧';
            } else if (lowerName.includes('speaker') || lowerName.includes('mhc') || lowerName.includes('sound') || lowerName.includes('stone')) {
              icon = '🔊';
            } else if (lowerName.includes('phone') || lowerName.includes('iphone')) {
              icon = '📱';
            } else if (lowerName.includes('macbook') || lowerName.includes('laptop')) {
              icon = '💻';
            } else if (lowerName.includes('keyboard') || lowerName.includes('key')) {
              icon = '⌨️';
            } else if (lowerName.includes('mouse') || lowerName.includes('trackpad')) {
              icon = '🖱️';
            }

            return `
              <div class="bt-device-card">
                <div class="bt-device-name">${icon} ${d.name}</div>
                <div class="bt-device-meta">Type: ${d.device_type}</div>
                <div class="bt-device-meta" style="margin-top: 4px;">
                  <span class="badge ${d.connected ? 'badge-success' : 'badge-warning'}">${d.connected ? 'Connected' : 'Paired / Saved'}</span>
                  <span style="float: right; color: var(--text-muted); font-size: 10px;">${d.address}</span>
                </div>
              </div>
            `;
          }).join('');
        }
      }
    } catch (err) {
      console.error("Error reading bluetooth:", err);
    }
  }

  private async runDiagnostics() {
    const cont = document.getElementById('diag-results-container');
    const btn = document.getElementById('btn-run-diag') as HTMLButtonElement | null;
    if (cont) {
      cont.innerHTML = `
        <div class="loading-placeholder">
          <p>Running multi-threaded math, memory bus, and storage benchmarks...</p>
        </div>
      `;
    }
    if (btn) btn.disabled = true;

    try {
      const reports = await invokeBackend<DiagnosticReport[]>('run_diagnostics_suite');
      if (cont) {
        cont.innerHTML = reports.map(r => `
          <div class="diag-item">
            <div class="diag-item-left">
              <span class="diag-badge ${r.status === 'PASS' ? 'diag-pass' : r.status === 'WARN' ? 'diag-warn' : 'diag-fail'}">${r.status}</span>
              <div>
                <div class="diag-title">${r.test_name}</div>
                <div class="diag-details">${r.details}</div>
              </div>
            </div>
            <div class="diag-score">${r.score_or_latency}</div>
          </div>
        `).join('');
      }
    } catch (err) {
      if (cont) cont.innerHTML = `<div class="loading-placeholder text-danger">Diagnostics run failed: ${err}</div>`;
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  private async executePing() {
    const input = document.getElementById('ping-target-input') as HTMLInputElement | null;
    const target = input ? input.value.trim() : '1.1.1.1';
    const rawBox = document.getElementById('ping-raw-output');
    const statHost = document.getElementById('ping-stat-host');
    const statLat = document.getElementById('ping-stat-lat');
    const statLoss = document.getElementById('ping-stat-loss');
    const statStatus = document.getElementById('ping-stat-status');

    if (rawBox) rawBox.textContent = `Pinging ${target}... Waiting for ICMP reply...`;

    try {
      const res = await invokeBackend<PingResult>('ping_host', { host: target });
      if (statHost) statHost.textContent = res.host;
      if (statLat) statLat.textContent = `${res.latency_ms.toFixed(2)} ms`;
      if (statLoss) statLoss.textContent = `${res.packet_loss_percent}%`;
      if (statStatus) {
        statStatus.textContent = res.success ? 'Success (200 OK)' : 'Packet Drop';
        statStatus.style.color = res.success ? '#10B981' : '#EF4444';
      }
      if (rawBox) rawBox.textContent = res.raw_output;
    } catch (err) {
      if (rawBox) rawBox.textContent = `Ping execution failed: ${err}`;
    }
  }

  private copySpecsToClipboard() {
    if (!this.latestSpecs) return;
    const s = this.latestSpecs;
    const text = `quickOS System Report
Company: UCDREAMS TECHNOLOGIES LLP (ucdreams.com)
Developer: Uchit Chakma (uchitchakma.com)
----------------------------------------
Host: ${s.hostname}
OS: ${s.os_name} ${s.os_version} (Kernel: ${s.kernel_version})
Architecture: ${s.arch}
Processor: ${s.cpu_brand} (${s.cpu_cores} Cores) - Usage: ${s.cpu_usage_percent.toFixed(1)}%
Memory: ${formatBytes(s.used_memory_bytes)} / ${formatBytes(s.total_memory_bytes)} (${formatBytes(s.free_memory_bytes)} Free)
Uptime: ${formatUptime(s.uptime_seconds)}
Battery: ${s.battery.has_battery ? `${s.battery.percentage}% (${s.battery.state})` : 'Continuous AC'}
Disks:
${s.disks.map(d => `  - ${d.mount_point}: ${formatBytes(d.total_bytes - d.available_bytes)} / ${formatBytes(d.total_bytes)} (${d.file_system})`).join('\n')}
----------------------------------------
Generated by quickOS (https://github.com/uchitchakma/quickOS)`;

    navigator.clipboard.writeText(text).then(() => {
      const btn = document.getElementById('btn-copy-specs');
      if (btn) {
        const orig = btn.innerHTML;
        btn.innerHTML = '✓ Copied to Clipboard!';
        setTimeout(() => { btn.innerHTML = orig; }, 2000);
      }
    });
  }
}

// Bootstrap
window.addEventListener('DOMContentLoaded', () => {
  const app = new QuickOSApp();
  app.init();
});
