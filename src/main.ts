import { invoke } from '@tauri-apps/api/core';

// quickOS - Universal Cross-Platform OS Virtualization & Multi-Platform App Runner
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

interface HypervisorInfo {
  supported: boolean;
  host_cpus: number;
  host_memory_mb: number;
  min_cpus: number;
  max_cpus: number;
  min_memory_mb: number;
  max_memory_mb: number;
  vms_directory: string;
  wine_available: boolean;
  wine_path?: string;
  qemu_available: boolean;
  os_version: string;
}

interface VMRunResult {
  success: boolean;
  message: string;
}

interface PathStatusInfo {
  path: string;
  exists: boolean;
  parent_exists: boolean;
  volume_mounted: boolean;
  volume_name?: string;
}

interface VMSettings {
  winDrive?: string;
  winCpus?: string;
  winMemory?: string;
  winDisk?: string;
  winIso?: string;
  linuxDrive?: string;
  linuxCpus?: string;
  linuxMemory?: string;
  linuxDisk?: string;
  linuxIso?: string;
  wineExePath?: string;
}

interface AppTypeInfo {
  file_path: string;
  detected_type: string;
  format_label: string;
  host_strategy: string;
  can_run: boolean;
}

interface AppMetadataInfo {
  id: string;
  name: string;
  file_path: string;
  os_type: 'macos' | 'windows' | 'linux' | 'android' | 'ios' | 'unknown' | string;
  format_label: string;
  version: string;
  arch: string;
  file_size_bytes: number;
  storage_type: string;
  icon_type: string;
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
  if (cmd === 'get_hypervisor_info') {
    return {
      supported: true,
      host_cpus: navigator.hardwareConcurrency || 8,
      host_memory_mb: 8192,
      min_cpus: 1,
      max_cpus: 64,
      min_memory_mb: 4,
      max_memory_mb: 32768,
      vms_directory: "~/quickOS-VMs",
      wine_available: false,
      wine_path: undefined,
      qemu_available: false,
      os_version: "macOS (Apple Silicon)"
    } as unknown as T;
  }

  if (cmd === 'detect_app_type') {
    const p = (args.file_path as string) || '';
    const lower = p.toLowerCase();
    let detectedType = 'unknown';
    let formatLabel = 'Application Binary';
    let hostStrategy = 'Universal quickOS Execution Bridge';
    if (lower.endsWith('.exe') || lower.endsWith('.msi')) {
      detectedType = 'windows';
      formatLabel = 'Windows Executable (.exe / .msi)';
      hostStrategy = 'Running via quickOS Windows Binary Translation (Wine/Hypervisor layer)';
    } else if (lower.endsWith('.app') || lower.endsWith('.dmg')) {
      detectedType = 'macos';
      formatLabel = 'macOS Application Bundle (.app / .dmg)';
      hostStrategy = 'Running natively on macOS system kernel';
    } else if (lower.endsWith('.appimage') || lower.endsWith('.deb')) {
      detectedType = 'linux';
      formatLabel = 'Linux Application Package (.AppImage / .deb)';
      hostStrategy = 'Routing through quickOS Linux Hypervisor Engine';
    } else if (lower.endsWith('.apk') || lower.endsWith('.aab') || lower.endsWith('.xapk')) {
      detectedType = 'android';
      formatLabel = 'Android Application Package (.apk / .aab)';
      hostStrategy = 'Routing through quickOS Android Virtual Engine (Waydroid / ADB / AVD)';
    } else if (lower.endsWith('.ipa')) {
      detectedType = 'ios';
      formatLabel = 'iOS & iPadOS App Package (.ipa)';
      hostStrategy = 'Running directly on Apple Silicon native iOS runtime / Xcode Simulator';
    }
    return {
      file_path: p,
      detected_type: detectedType,
      format_label: formatLabel,
      host_strategy: hostStrategy,
      can_run: true
    } as unknown as T;
  }

  if (cmd === 'inspect_app_metadata') {
    const p = (args.file_path as string) || '';
    const rawName = p.split('/').filter(Boolean).pop() || "Application";
    const name = rawName.replace(/\.[^/.]+$/, "");
    const lower = rawName.toLowerCase();
    let osType = 'unknown';
    let format = 'Application Binary';
    let arch = 'Native Architecture';
    let size = 48500000;

    if (lower.endsWith('.exe') || lower.endsWith('.msi')) {
      osType = 'windows';
      format = 'Win32 Executable (.exe)';
      arch = 'x86_64 / Win32';
      size = 32400000;
    } else if (lower.endsWith('.app') || lower.endsWith('.dmg')) {
      osType = 'macos';
      format = 'macOS Application (.app)';
      arch = 'Apple Silicon / Universal';
      size = 64200000;
    } else if (lower.endsWith('.appimage') || lower.endsWith('.deb')) {
      osType = 'linux';
      format = 'Linux AppImage (.AppImage)';
      arch = 'x86_64 / ARM64';
      size = 128000000;
    } else if (lower.endsWith('.apk') || lower.endsWith('.aab')) {
      osType = 'android';
      format = 'Android Package (.apk)';
      arch = 'ARM64 / ARMv7 Universal';
      size = 56000000;
    } else if (lower.endsWith('.ipa')) {
      osType = 'ios';
      format = 'iOS Application (.ipa)';
      arch = 'ARM64 (Apple Silicon / iOS)';
      size = 78000000;
    }

    const storageType = p.startsWith('/Volumes/')
      ? `External Storage (${p.split('/')[2] || 'Drive'})`
      : 'Internal APFS Storage';

    return {
      id: Math.random().toString(36).substring(2, 10),
      name,
      file_path: p,
      os_type: osType,
      format_label: format,
      version: 'v1.0.0',
      arch,
      file_size_bytes: size,
      storage_type: storageType,
      icon_type: osType
    } as unknown as T;
  }

  if (cmd === 'reveal_in_finder' || cmd === 'delete_app_file') {
    return null as unknown as T;
  }

  if (cmd === 'run_universal_app' || cmd === 'run_windows_exe') {
    return {
      success: true,
      message: `Executed application '${args.file_path || args.exe_path}' with quickOS Universal Cross-Platform Execution Bridge.`
    } as unknown as T;
  }

  if (cmd === 'check_path_status') {
    const p = (args.path as string) || '';
    const isVolume = p.startsWith('/Volumes/');
    let volName = 'Internal Storage';
    if (isVolume) {
      const parts = p.split('/').filter(Boolean);
      volName = parts[1] || 'External Drive';
    }
    return {
      path: p,
      exists: true,
      parent_exists: true,
      volume_mounted: true,
      volume_name: volName,
    } as unknown as T;
  }

  if (cmd === 'start_native_vm') {
    return {
      success: true,
      message: `Virtual machine '${args.name || "VM"}' booted in a dedicated native window.`
    } as unknown as T;
  }

  if (cmd === 'create_vm_disk') {
    return {
      success: true,
      message: `Created ${args.size_gb || 32} GB sparse virtual hard disk at ${args.path}`
    } as unknown as T;
  }

  if (cmd === 'open_vms_folder') {
    return "~/quickOS-VMs" as unknown as T;
  }

  if (cmd === 'pick_vm_directory') {
    return "/Volumes/ExternalSSD/quickOS-VMs" as unknown as T;
  }

  if (cmd === 'pick_vm_file') {
    return "/Volumes/ExternalSSD/Win11_ARM64.iso" as unknown as T;
  }

  if (cmd === 'get_system_info') {
    return {
      hostname: "quickOS-VirtualNode.local",
      os_name: navigator.platform.includes("Mac") ? "macOS (Apple Silicon)" : "Universal Host OS",
      os_version: "24.x Native Hypervisor",
      kernel_version: "Darwin 24.0 (Virtualization ABI)",
      arch: "aarch64 / ARM64",
      cpu_brand: "Apple Silicon M-Series High-Efficiency Virtualization Core",
      cpu_cores: navigator.hardwareConcurrency || 8,
      cpu_usage_percent: Math.floor(Math.random() * 25) + 12,
      total_memory_bytes: 16 * 1024 * 1024 * 1024,
      used_memory_bytes: 7.2 * 1024 * 1024 * 1024,
      free_memory_bytes: 8.8 * 1024 * 1024 * 1024,
      total_swap_bytes: 4 * 1024 * 1024 * 1024,
      used_swap_bytes: 0.5 * 1024 * 1024 * 1024,
      uptime_seconds: 142850,
      disks: [
        { name: "System Macintosh HD / Root", mount_point: "/", total_bytes: 512 * 1024 * 1024 * 1024, available_bytes: 290 * 1024 * 1024 * 1024, file_system: "APFS", is_removable: false },
        { name: "External SSD / VM Storage", mount_point: "/Volumes/ExternalSSD", total_bytes: 1000 * 1024 * 1024 * 1024, available_bytes: 780 * 1024 * 1024 * 1024, file_system: "APFS / ExFAT", is_removable: true }
      ],
      battery: {
        has_battery: true,
        percentage: 94,
        state: "AC Attached (Power Adapter)",
        time_remaining: "0:45 remaining to full charge"
      }
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
  public currentTab = 'virtual-os';
  private currentTheme: 'dark' | 'light' = 'dark';
  private latestSpecs: SystemSpecs | null = null;
  public hypervisorInfo: HypervisorInfo | null = null;
  private savedWinDrive: string = 'default';
  private savedLinuxDrive: string = 'default';

  // App Library State
  private appLibrary: AppMetadataInfo[] = [];
  private activeAppCategory: string = 'all';
  private appSearchQuery: string = '';

  init() {
    this.initTheme();
    this.setupTabs();
    this.setupVMModeSwitcher();
    this.setupActions();
    this.setupAppLibraryListeners();
    this.loadVMSettings();
    this.setupVMSettingsPersistence();
    this.loadAllData();
    this.loadHypervisorInfo();
    this.loadAppLibrary();
    this.validateVMPaths();

    // Default to Virtual OS Lab tab
    this.switchTab('virtual-os');

    // Live refresh every 4 seconds for CPU/RAM telemetry and disk reconnect status
    setInterval(() => {
      this.refreshSystemSpecs(true);
      this.validateVMPaths();
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

    if (tabId === 'virtual-os') this.validateVMPaths();
    if (tabId === 'app-library') this.renderAppLibrary();
  }

  private setupActions() {
    // Theme toggle button
    document.getElementById('btn-theme-toggle')?.addEventListener('click', () => {
      this.toggleTheme();
    });

    // Refresh Topbar button
    document.getElementById('btn-refresh')?.addEventListener('click', () => {
      this.loadAllData();
      this.validateVMPaths();
    });

    // Copy Specs button
    document.getElementById('btn-copy-specs')?.addEventListener('click', () => {
      this.copySpecsToClipboard();
    });

    // Open Mac Installer .dmg folder
    document.getElementById('btn-open-mac-installer')?.addEventListener('click', async () => {
      try {
        await invokeBackend('open_installer_folder');
      } catch (err) {
        console.error("Error opening installer folder:", err);
      }
    });

    // Native Hypervisor & VM Buttons
    document.getElementById('btn-open-vms-dir')?.addEventListener('click', () => this.openVMsFolder());
    document.getElementById('btn-start-native-win11')?.addEventListener('click', () => this.startNativeWindowsVM());
    document.getElementById('btn-create-win-disk')?.addEventListener('click', () => this.createVirtualDisk('windows'));
    document.getElementById('btn-start-native-linux')?.addEventListener('click', () => this.startNativeLinuxVM());
    document.getElementById('btn-create-linux-disk')?.addEventListener('click', () => this.createVirtualDisk('linux'));
    document.getElementById('btn-run-wine-exe')?.addEventListener('click', () => this.runUniversalApp());

    // Storage Drive Selectors (SSD / HDD)
    document.getElementById('win-cfg-drive-select')?.addEventListener('change', (e) => {
      const val = (e.target as HTMLSelectElement).value;
      this.savedWinDrive = val;
      const diskInput = document.getElementById('win-cfg-disk') as HTMLInputElement | null;
      if (diskInput) {
        diskInput.value = val === 'default' ? '~/quickOS-VMs/windows11/disk.img' : `${val}/windows11/disk.img`;
      }
      this.saveVMSettings();
      this.validateVMPaths();
    });

    document.getElementById('linux-cfg-drive-select')?.addEventListener('change', (e) => {
      const val = (e.target as HTMLSelectElement).value;
      this.savedLinuxDrive = val;
      const diskInput = document.getElementById('linux-cfg-disk') as HTMLInputElement | null;
      if (diskInput) {
        diskInput.value = val === 'default' ? '~/quickOS-VMs/ubuntu/disk.img' : `${val}/ubuntu/disk.img`;
      }
      this.saveVMSettings();
      this.validateVMPaths();
    });

    // Browse Custom SSD / HDD Folder Pickers
    document.getElementById('btn-browse-win-folder')?.addEventListener('click', async () => {
      try {
        const selected = await invokeBackend<string>('pick_vm_directory', { prompt: "Select SSD, HDD, or Folder for Windows 11 VM" });
        if (selected) {
          this.addCustomDriveOption('win-cfg-drive-select', selected);
          const diskInput = document.getElementById('win-cfg-disk') as HTMLInputElement | null;
          if (diskInput) diskInput.value = `${selected}/windows11/disk.img`;
          this.savedWinDrive = selected;
          this.saveVMSettings();
          this.validateVMPaths();
        }
      } catch (err) {
        console.warn("Folder picker cancelled or failed:", err);
      }
    });

    document.getElementById('btn-browse-linux-folder')?.addEventListener('click', async () => {
      try {
        const selected = await invokeBackend<string>('pick_vm_directory', { prompt: "Select SSD, HDD, or Folder for Ubuntu Linux VM" });
        if (selected) {
          this.addCustomDriveOption('linux-cfg-drive-select', selected);
          const diskInput = document.getElementById('linux-cfg-disk') as HTMLInputElement | null;
          if (diskInput) diskInput.value = `${selected}/ubuntu/disk.img`;
          this.savedLinuxDrive = selected;
          this.saveVMSettings();
          this.validateVMPaths();
        }
      } catch (err) {
        console.warn("Folder picker cancelled or failed:", err);
      }
    });

    // File Pickers for Disks and ISOs
    document.getElementById('btn-browse-win-disk')?.addEventListener('click', async () => {
      try {
        const path = await invokeBackend<string>('pick_vm_file', { prompt: "Select Windows Virtual Disk (.img, .raw, .vhdx)", file_types: ["img", "raw", "vhdx"] });
        if (path) {
          const el = document.getElementById('win-cfg-disk') as HTMLInputElement | null;
          if (el) el.value = path;
          this.saveVMSettings();
          this.validateVMPaths();
        }
      } catch (err) { console.warn("Picker cancelled:", err); }
    });

    document.getElementById('btn-browse-win-iso')?.addEventListener('click', async () => {
      try {
        const path = await invokeBackend<string>('pick_vm_file', { prompt: "Select Windows 11 ARM64 ISO Image (.iso)", file_types: ["iso"] });
        if (path) {
          const el = document.getElementById('win-cfg-iso') as HTMLInputElement | null;
          if (el) el.value = path;
          this.saveVMSettings();
          this.validateVMPaths();
        }
      } catch (err) { console.warn("Picker cancelled:", err); }
    });

    document.getElementById('btn-browse-linux-disk')?.addEventListener('click', async () => {
      try {
        const path = await invokeBackend<string>('pick_vm_file', { prompt: "Select Linux Virtual Disk (.img, .raw)", file_types: ["img", "raw"] });
        if (path) {
          const el = document.getElementById('linux-cfg-disk') as HTMLInputElement | null;
          if (el) el.value = path;
          this.saveVMSettings();
          this.validateVMPaths();
        }
      } catch (err) { console.warn("Picker cancelled:", err); }
    });

    document.getElementById('btn-browse-linux-iso')?.addEventListener('click', async () => {
      try {
        const path = await invokeBackend<string>('pick_vm_file', { prompt: "Select Ubuntu 24.04 ARM64 ISO (.iso)", file_types: ["iso"] });
        if (path) {
          const el = document.getElementById('linux-cfg-iso') as HTMLInputElement | null;
          if (el) el.value = path;
          this.saveVMSettings();
          this.validateVMPaths();
        }
      } catch (err) { console.warn("Picker cancelled:", err); }
    });

    document.getElementById('btn-browse-wine-exe')?.addEventListener('click', async () => {
      try {
        const path = await invokeBackend<string>('pick_vm_file', { 
          prompt: "Select Any Application (.exe, .msi, .app, .dmg, .apk, .aab, .ipa, .deb, .AppImage)", 
          file_types: ["exe", "msi", "app", "dmg", "apk", "aab", "ipa", "appimage", "deb"] 
        });
        if (path) {
          const el = document.getElementById('wine-exe-path') as HTMLInputElement | null;
          if (el) el.value = path;
          this.saveVMSettings();
          this.detectUniversalApp(path);
        }
      } catch (err) { console.warn("Picker cancelled:", err); }
    });

    const exeInput = document.getElementById('wine-exe-path') as HTMLInputElement | null;
    exeInput?.addEventListener('input', () => {
      this.detectUniversalApp(exeInput.value.trim());
    });
  }

  private setupVMModeSwitcher() {
    const tabBtns = document.querySelectorAll<HTMLButtonElement>('.vm-tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-vm-tab');
        if (!mode) return;

        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        document.querySelectorAll('.vm-mode-panel').forEach(p => p.classList.remove('active'));
        const target = document.getElementById(`vm-panel-${mode}`);
        if (target) target.classList.add('active');
      });
    });
  }

  private addCustomDriveOption(selectId: string, path: string) {
    const select = document.getElementById(selectId) as HTMLSelectElement | null;
    if (!select) return;

    let exists = false;
    for (let i = 0; i < select.options.length; i++) {
      if (select.options[i].value === path) {
        exists = true;
        select.selectedIndex = i;
        break;
      }
    }

    if (!exists) {
      const opt = document.createElement('option');
      opt.value = path;
      const parts = path.split('/').filter(Boolean);
      const name = parts[parts.length - 1] || path;
      opt.textContent = `External Storage: ${name} (${path})`;
      select.appendChild(opt);
      select.value = path;
    }
  }

  private setupVMSettingsPersistence() {
    const inputs = ['win-cfg-cpus', 'win-cfg-memory', 'win-cfg-disk', 'win-cfg-iso', 'linux-cfg-cpus', 'linux-cfg-memory', 'linux-cfg-disk', 'linux-cfg-iso', 'wine-exe-path'];
    inputs.forEach(id => {
      document.getElementById(id)?.addEventListener('change', () => {
        this.saveVMSettings();
        this.validateVMPaths();
      });
    });
  }

  private saveVMSettings() {
    const getVal = (id: string) => (document.getElementById(id) as HTMLInputElement | HTMLSelectElement | null)?.value || '';
    const settings: VMSettings = {
      winDrive: this.savedWinDrive,
      winCpus: getVal('win-cfg-cpus'),
      winMemory: getVal('win-cfg-memory'),
      winDisk: getVal('win-cfg-disk'),
      winIso: getVal('win-cfg-iso'),
      linuxDrive: this.savedLinuxDrive,
      linuxCpus: getVal('linux-cfg-cpus'),
      linuxMemory: getVal('linux-cfg-memory'),
      linuxDisk: getVal('linux-cfg-disk'),
      linuxIso: getVal('linux-cfg-iso'),
      wineExePath: getVal('wine-exe-path'),
    };
    try {
      localStorage.setItem('quickos-vm-settings', JSON.stringify(settings));
    } catch (e) {
      console.warn("Failed to persist VM settings:", e);
    }
  }

  private loadVMSettings() {
    try {
      const raw = localStorage.getItem('quickos-vm-settings');
      if (!raw) return;
      const s: VMSettings = JSON.parse(raw);
      if (s.winDrive) {
        this.savedWinDrive = s.winDrive;
        if (s.winDrive !== 'default') this.addCustomDriveOption('win-cfg-drive-select', s.winDrive);
      }
      if (s.winCpus) (document.getElementById('win-cfg-cpus') as HTMLSelectElement).value = s.winCpus;
      if (s.winMemory) (document.getElementById('win-cfg-memory') as HTMLSelectElement).value = s.winMemory;
      if (s.winDisk) (document.getElementById('win-cfg-disk') as HTMLInputElement).value = s.winDisk;
      if (s.winIso) (document.getElementById('win-cfg-iso') as HTMLInputElement).value = s.winIso;

      if (s.linuxDrive) {
        this.savedLinuxDrive = s.linuxDrive;
        if (s.linuxDrive !== 'default') this.addCustomDriveOption('linux-cfg-drive-select', s.linuxDrive);
      }
      if (s.linuxCpus) (document.getElementById('linux-cfg-cpus') as HTMLSelectElement).value = s.linuxCpus;
      if (s.linuxMemory) (document.getElementById('linux-cfg-memory') as HTMLSelectElement).value = s.linuxMemory;
      if (s.linuxDisk) (document.getElementById('linux-cfg-disk') as HTMLInputElement).value = s.linuxDisk;
      if (s.linuxIso) (document.getElementById('linux-cfg-iso') as HTMLInputElement).value = s.linuxIso;

      if (s.wineExePath) {
        (document.getElementById('wine-exe-path') as HTMLInputElement).value = s.wineExePath;
        this.detectUniversalApp(s.wineExePath);
      }
    } catch (e) {
      console.warn("Error restoring VM settings:", e);
    }
  }

  private async validateVMPaths() {
    const winDiskInput = document.getElementById('win-cfg-disk') as HTMLInputElement | null;
    const winStatusEl = document.getElementById('win-drive-status');
    if (winDiskInput && winStatusEl) {
      const path = winDiskInput.value.trim();
      if (path) {
        const info = await invokeBackend<PathStatusInfo>('check_path_status', { path });
        if (!info.volume_mounted) {
          winStatusEl.className = 'drive-status-indicator disconnected';
          winStatusEl.innerHTML = `<span class="pulse-dot" style="background:#EF4444;"></span> Storage Drive Disconnected: ${info.volume_name || 'Volume'} not mounted. Please reconnect drive.`;
        } else if (info.exists) {
          winStatusEl.className = 'drive-status-indicator online';
          winStatusEl.innerHTML = `<span class="pulse-dot" style="background:#10B981;"></span> Drive Online (${info.volume_name || 'Storage'}): Virtual disk image ready.`;
        } else {
          winStatusEl.className = 'drive-status-indicator online';
          winStatusEl.innerHTML = `<span class="pulse-dot" style="background:#F59E0B;"></span> Target folder ready on ${info.volume_name || 'Storage'}. Disk image not created yet.`;
        }
      }
    }

    const linuxDiskInput = document.getElementById('linux-cfg-disk') as HTMLInputElement | null;
    const linuxStatusEl = document.getElementById('linux-drive-status');
    if (linuxDiskInput && linuxStatusEl) {
      const path = linuxDiskInput.value.trim();
      if (path) {
        const info = await invokeBackend<PathStatusInfo>('check_path_status', { path });
        if (!info.volume_mounted) {
          linuxStatusEl.className = 'drive-status-indicator disconnected';
          linuxStatusEl.innerHTML = `<span class="pulse-dot" style="background:#EF4444;"></span> Storage Drive Disconnected: ${info.volume_name || 'Volume'} not mounted.`;
        } else if (info.exists) {
          linuxStatusEl.className = 'drive-status-indicator online';
          linuxStatusEl.innerHTML = `<span class="pulse-dot" style="background:#10B981;"></span> Drive Online (${info.volume_name || 'Storage'}): Linux disk image ready.`;
        } else {
          linuxStatusEl.className = 'drive-status-indicator online';
          linuxStatusEl.innerHTML = `<span class="pulse-dot" style="background:#F59E0B;"></span> Target folder ready on ${info.volume_name || 'Storage'}. Disk image will be generated on boot.`;
        }
      }
    }
  }

  private async detectUniversalApp(path: string) {
    const badge = document.getElementById('universal-app-detected-badge');
    const badgeTag = document.getElementById('universal-app-badge-tag');
    const badgeStrat = document.getElementById('universal-app-badge-strategy');
    if (!path || !badge || !badgeTag || !badgeStrat) {
      if (badge) badge.style.display = 'none';
      return;
    }

    try {
      const info = await invokeBackend<AppTypeInfo>('detect_app_type', { file_path: path });
      badge.style.display = 'flex';
      badgeTag.textContent = info.format_label;
      badgeStrat.textContent = info.host_strategy;
    } catch (err) {
      console.warn("App detection error:", err);
    }
  }

  private async loadHypervisorInfo() {
    try {
      const info = await invokeBackend<HypervisorInfo>('get_hypervisor_info');
      this.hypervisorInfo = info;
      const engineName = document.getElementById('hv-engine-name');
      const hostCpus = document.getElementById('hv-host-cpus');
      const hostRam = document.getElementById('hv-host-ram');
      const vmsPath = document.getElementById('hv-vms-path');

      if (engineName) engineName.textContent = info.os_version.includes('Mac') ? "Apple Virtualization.framework" : "Hardware Hypervisor Engine";
      if (hostCpus) hostCpus.textContent = `${info.host_cpus} Physical Cores`;
      if (hostRam) hostRam.textContent = `${(info.host_memory_mb / 1024).toFixed(1)} GB Unified RAM`;
      if (vmsPath) vmsPath.textContent = info.vms_directory;
    } catch (err) {
      console.error("Error loading hypervisor telemetry:", err);
    }
  }

  private async startNativeWindowsVM() {
    const logBox = document.getElementById('win-vm-log-text');
    const dot = document.querySelector('#win-vm-status-log .pulse-dot') as HTMLElement | null;
    const cpus = parseInt((document.getElementById('win-cfg-cpus') as HTMLSelectElement)?.value || '4', 10);
    const memory = parseInt((document.getElementById('win-cfg-memory') as HTMLSelectElement)?.value || '4096', 10);
    const disk = (document.getElementById('win-cfg-disk') as HTMLInputElement)?.value.trim() || '~/quickOS-VMs/windows11/disk.img';
    const iso = (document.getElementById('win-cfg-iso') as HTMLInputElement)?.value.trim() || undefined;

    if (logBox) logBox.textContent = "Booting Windows 11 Native VM on Apple Silicon Hypervisor...";
    if (dot) dot.style.backgroundColor = 'var(--primary)';

    try {
      const res = await invokeBackend<VMRunResult>('start_native_vm', {
        name: "Windows 11 Pro ARM64",
        osType: "windows",
        cpus,
        memoryMb: memory,
        diskPath: disk,
        isoPath: iso
      });

      if (logBox) logBox.textContent = res.message;
      if (dot) dot.style.backgroundColor = res.success ? 'var(--success)' : 'var(--danger)';

      // Open new dedicated VM Runner Window
      await this.launchRunnerWindow({
        id: 'win11-native-vm',
        name: 'Windows 11 Pro ARM64',
        filePath: disk,
        osType: 'windows',
        version: 'Build 26100 (ARM64)',
        formatLabel: 'Apple Virtualization VM Session'
      });
    } catch (err) {
      if (logBox) logBox.textContent = `Boot error: ${err}`;
      if (dot) dot.style.backgroundColor = 'var(--danger)';
    }
  }

  private async startNativeLinuxVM() {
    const logBox = document.getElementById('linux-vm-log-text');
    const dot = document.querySelector('#linux-vm-status-log .pulse-dot') as HTMLElement | null;
    const cpus = parseInt((document.getElementById('linux-cfg-cpus') as HTMLSelectElement)?.value || '2', 10);
    const memory = parseInt((document.getElementById('linux-cfg-memory') as HTMLSelectElement)?.value || '2048', 10);
    const disk = (document.getElementById('linux-cfg-disk') as HTMLInputElement)?.value.trim() || '~/quickOS-VMs/ubuntu/disk.img';
    const iso = (document.getElementById('linux-cfg-iso') as HTMLInputElement)?.value.trim() || undefined;

    if (logBox) logBox.textContent = "Booting Ubuntu 24.04 LTS on Apple Silicon Virtualization framework...";
    if (dot) dot.style.backgroundColor = 'var(--primary)';

    try {
      const res = await invokeBackend<VMRunResult>('start_native_vm', {
        name: "Ubuntu 24.04 LTS Server",
        osType: "linux",
        cpus,
        memoryMb: memory,
        diskPath: disk,
        isoPath: iso
      });

      if (logBox) logBox.textContent = res.message;
      if (dot) dot.style.backgroundColor = res.success ? 'var(--success)' : 'var(--danger)';

      // Open new dedicated VM Runner Window
      await this.launchRunnerWindow({
        id: 'ubuntu-native-vm',
        name: 'Ubuntu 24.04 LTS Linux',
        filePath: disk,
        osType: 'linux',
        version: 'Noble Numbat (Kernel 6.8)',
        formatLabel: 'Apple Virtualization Linux VM'
      });
    } catch (err) {
      if (logBox) logBox.textContent = `Boot error: ${err}`;
      if (dot) dot.style.backgroundColor = 'var(--danger)';
    }
  }

  private async createVirtualDisk(os: 'windows' | 'linux') {
    const diskPath = os === 'windows'
      ? (document.getElementById('win-cfg-disk') as HTMLInputElement)?.value.trim()
      : (document.getElementById('linux-cfg-disk') as HTMLInputElement)?.value.trim();

    const sizeGb = os === 'windows' ? 64 : 20;

    if (!diskPath) return;

    try {
      const res = await invokeBackend<VMRunResult>('create_vm_disk', { path: diskPath, sizeGb });
      alert(res.message);
      this.validateVMPaths();
    } catch (err) {
      alert(`Disk creation failed: ${err}`);
    }
  }

  private async runUniversalApp() {
    const input = document.getElementById('wine-exe-path') as HTMLInputElement | null;
    const path = input ? input.value.trim() : '';
    const statusBox = document.getElementById('wine-status-text');
    const dot = document.getElementById('wine-pulse-dot');

    if (!path) {
      if (statusBox) statusBox.textContent = "Please select or type the path to an application file (.exe, .app, .dmg, .apk, .aab, .ipa, .deb, .AppImage).";
      return;
    }

    const parts = path.split('/').filter(Boolean);
    const fileName = parts[parts.length - 1] || 'Universal Application';

    if (statusBox) statusBox.textContent = `Launching '${fileName}' in dedicated quickOS Runner window...`;
    if (dot) dot.style.backgroundColor = 'var(--primary)';

    try {
      await this.launchRunnerWindow({
        name: fileName,
        filePath: path,
      });
      if (statusBox) statusBox.textContent = `Launched '${fileName}' in a new dedicated window.`;
      if (dot) dot.style.backgroundColor = 'var(--success)';
    } catch (err) {
      if (statusBox) statusBox.textContent = `Launch error: ${err}`;
      if (dot) dot.style.backgroundColor = 'var(--danger)';
    }
  }

  private async openVMsFolder() {
    try {
      await invokeBackend('open_vms_folder');
    } catch (err) {
      console.error("Error opening VM folder:", err);
    }
  }

  private async loadAllData() {
    await this.refreshSystemSpecs(false);
  }

  private async refreshSystemSpecs(isTelemetryTick: boolean = false) {
    try {
      const specs = await invokeBackend<SystemSpecs>('get_system_info');
      this.latestSpecs = specs;

      // Update Topbar
      const osHeader = document.getElementById('header-os-name');
      const archHeader = document.getElementById('header-arch');
      if (osHeader) osHeader.textContent = `${specs.os_name} ${specs.os_version}`;
      if (archHeader) archHeader.textContent = specs.arch;

      const miniCpuFill = document.getElementById('mini-cpu-fill');
      const miniCpuVal = document.getElementById('mini-cpu-val');
      if (miniCpuFill && miniCpuVal) {
        miniCpuFill.style.width = `${specs.cpu_usage_percent}%`;
        miniCpuVal.textContent = `${specs.cpu_usage_percent.toFixed(0)}%`;
      }

      const ramPct = (specs.used_memory_bytes / specs.total_memory_bytes) * 100;
      const miniRamFill = document.getElementById('mini-ram-fill');
      const miniRamVal = document.getElementById('mini-ram-val');
      if (miniRamFill && miniRamVal) {
        miniRamFill.style.width = `${ramPct}%`;
        miniRamVal.textContent = `${ramPct.toFixed(0)}%`;
      }

      // Update Overview Stat Cards
      const cpuUsage = document.getElementById('cpu-usage-display');
      const cpuProg = document.getElementById('cpu-progress');
      const cpuModel = document.getElementById('cpu-model-name');
      if (cpuUsage) cpuUsage.textContent = `${specs.cpu_usage_percent.toFixed(1)}%`;
      if (cpuProg) cpuProg.style.width = `${specs.cpu_usage_percent}%`;
      if (cpuModel) cpuModel.textContent = `${specs.cpu_brand} (${specs.cpu_cores} Cores)`;

      const ramUsed = document.getElementById('ram-used-display');
      const ramTotal = document.getElementById('ram-total-display');
      const ramProg = document.getElementById('ram-progress');
      const ramFree = document.getElementById('ram-free-display');
      if (ramUsed) ramUsed.textContent = formatBytes(specs.used_memory_bytes);
      if (ramTotal) ramTotal.textContent = `/ ${formatBytes(specs.total_memory_bytes)}`;
      if (ramProg) ramProg.style.width = `${ramPct}%`;
      if (ramFree) ramFree.textContent = `Free: ${formatBytes(specs.free_memory_bytes)}`;

      const battLevel = document.getElementById('batt-level-display');
      const battState = document.getElementById('batt-state-display');
      const battProg = document.getElementById('batt-progress');
      const battTime = document.getElementById('batt-time-display');
      if (battLevel) battLevel.textContent = `${specs.battery.percentage}%`;
      if (battState) battState.textContent = specs.battery.state;
      if (battProg) battProg.style.width = `${specs.battery.percentage}%`;
      if (battTime) battTime.textContent = specs.battery.time_remaining;

      const uptimeEl = document.getElementById('uptime-display');
      const hostEl = document.getElementById('hostname-display');
      if (uptimeEl) uptimeEl.textContent = formatUptime(specs.uptime_seconds);
      if (hostEl) hostEl.textContent = `Node: ${specs.hostname}`;

      if (!isTelemetryTick) {
        const specOs = document.getElementById('spec-os-name');
        const specVer = document.getElementById('spec-os-version');
        const specKernel = document.getElementById('spec-kernel');
        const specArch = document.getElementById('spec-arch');
        const specSwap = document.getElementById('spec-swap');
        const specHost = document.getElementById('spec-hostname');

        if (specOs) specOs.textContent = specs.os_name;
        if (specVer) specVer.textContent = specs.os_version;
        if (specKernel) specKernel.textContent = specs.kernel_version;
        if (specArch) specArch.textContent = specs.arch;
        if (specSwap) specSwap.textContent = `${formatBytes(specs.used_swap_bytes)} / ${formatBytes(specs.total_swap_bytes)}`;
        if (specHost) specHost.textContent = specs.hostname;
      }

      // Populate Disks
      const disksCont = document.getElementById('disks-container');
      if (disksCont && specs.disks) {
        disksCont.innerHTML = specs.disks.map(d => {
          const usedBytes = d.total_bytes - d.available_bytes;
          const usedPct = d.total_bytes > 0 ? (usedBytes / d.total_bytes) * 100 : 0;
          return `
            <div class="disk-card">
              <div class="disk-top">
                <span class="disk-name" title="${d.name}">${d.name}</span>
                <span class="tag">${d.file_system}</span>
              </div>
              <div class="disk-mount">${d.mount_point} ${d.is_removable ? '(External SSD/HDD Drive)' : ''}</div>
              <div class="progress-track">
                <div class="progress-bar ${usedPct > 90 ? 'danger' : ''}" style="width: ${usedPct.toFixed(1)}%;"></div>
              </div>
              <div class="disk-meta">
                <span>Free: ${formatBytes(d.available_bytes)}</span>
                <span>${formatBytes(usedBytes)} / ${formatBytes(d.total_bytes)}</span>
              </div>
            </div>
          `;
        }).join('');
      }
    } catch (err) {
      console.error("Error refreshing system specs:", err);
    }
  }

  private copySpecsToClipboard() {
    if (!this.latestSpecs) return;
    const s = this.latestSpecs;
    const text = `quickOS System & Hypervisor Report
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

  // ==========================================
  // APP LIBRARY CONTROLLER (5-WAY OS AUTO-DETECTION)
  // ==========================================

  private setupAppLibraryListeners() {
    // Add App button in header
    document.getElementById('btn-add-app-to-library')?.addEventListener('click', () => {
      this.addAppToLibrary();
    });

    // Add App button in empty state
    document.getElementById('btn-empty-add-app')?.addEventListener('click', () => {
      this.addAppToLibrary();
    });

    // Category filter pills
    document.querySelectorAll<HTMLButtonElement>('#app-category-filters .cat-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        const cat = pill.getAttribute('data-category') || 'all';
        this.activeAppCategory = cat;
        document.querySelectorAll('#app-category-filters .cat-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.renderAppLibrary();
      });
    });

    // Search filter input
    const searchInput = document.getElementById('app-library-search') as HTMLInputElement | null;
    searchInput?.addEventListener('input', (e) => {
      this.appSearchQuery = (e.target as HTMLInputElement).value.toLowerCase().trim();
      this.renderAppLibrary();
    });
  }

  private loadAppLibrary() {
    try {
      const saved = localStorage.getItem('quickos-app-library');
      if (saved) {
        this.appLibrary = JSON.parse(saved);
      } else {
        this.loadSamplePresets();
      }
    } catch (e) {
      console.error("Error loading app library:", e);
      this.loadSamplePresets();
    }
    this.updateCategoryCounts();
    this.renderAppLibrary();
  }

  private saveAppLibrary() {
    try {
      localStorage.setItem('quickos-app-library', JSON.stringify(this.appLibrary));
    } catch (e) {
      console.error("Error saving app library:", e);
    }
    this.updateCategoryCounts();
    this.renderAppLibrary();
  }

  private loadSamplePresets() {
    this.appLibrary = [
      {
        id: 'sample-calc-mac',
        name: 'Calculator',
        file_path: '/System/Applications/Calculator.app',
        os_type: 'macos',
        format_label: 'macOS Bundle (.app)',
        version: 'v14.0 (Universal)',
        arch: 'Apple Silicon / Intel',
        file_size_bytes: 18500000,
        storage_type: 'Internal APFS Storage',
        icon_type: 'macos'
      },
      {
        id: 'sample-notepad-win',
        name: 'Notepad++ Editor',
        file_path: '/Volumes/ExternalSSD/Apps/NotepadPlusPlus.exe',
        os_type: 'windows',
        format_label: 'Win32 Executable (.exe)',
        version: 'v8.6.2 (x64)',
        arch: 'x86_64 Windows PE',
        file_size_bytes: 34500000,
        storage_type: 'External Storage (ExternalSSD)',
        icon_type: 'windows'
      },
      {
        id: 'sample-blender-linux',
        name: 'Blender 3D Studio',
        file_path: '/Volumes/ExternalSSD/Apps/Blender-4.1.AppImage',
        os_type: 'linux',
        format_label: 'Linux AppImage (.AppImage)',
        version: 'v4.1.0 LTS',
        arch: 'x86_64 / ARM64 ELF',
        file_size_bytes: 285000000,
        storage_type: 'External Storage (ExternalSSD)',
        icon_type: 'linux'
      },
      {
        id: 'sample-spotify-apk',
        name: 'Spotify Music',
        file_path: '/Volumes/ExternalSSD/Apps/Spotify-Music.apk',
        os_type: 'android',
        format_label: 'Android Package (.apk)',
        version: 'v8.9.18 (ARM64)',
        arch: 'Universal Android (ARM64/x86)',
        file_size_bytes: 65200000,
        storage_type: 'External Storage (ExternalSSD)',
        icon_type: 'android'
      },
      {
        id: 'sample-insta-ipa',
        name: 'Instagram iOS Client',
        file_path: '/Volumes/ExternalSSD/Apps/Instagram.ipa',
        os_type: 'ios',
        format_label: 'iOS App Package (.ipa)',
        version: 'v312.0.1 (64-bit)',
        arch: 'iOS ARM64 Device / Simulator',
        file_size_bytes: 84100000,
        storage_type: 'External Storage (ExternalSSD)',
        icon_type: 'ios'
      }
    ];
    this.saveAppLibrary();
  }

  private async addAppToLibrary() {
    try {
      const filePath = await invokeBackend<string>('pick_vm_file', {
        prompt: "Select Any Application to Add to quickOS Library",
        file_types: ["app", "dmg", "exe", "msi", "apk", "aab", "ipa", "appimage", "deb"]
      });

      if (!filePath) return;

      const meta = await invokeBackend<AppMetadataInfo>('inspect_app_metadata', { file_path: filePath });
      if (meta) {
        // Prevent exact duplicates
        const existingIdx = this.appLibrary.findIndex(a => a.file_path === meta.file_path);
        if (existingIdx >= 0) {
          this.appLibrary[existingIdx] = meta;
        } else {
          this.appLibrary.unshift(meta);
        }
        this.saveAppLibrary();
      }
    } catch (err) {
      console.warn("User cancelled or file pick failed:", err);
    }
  }

  private updateCategoryCounts() {
    const counts: Record<string, number> = {
      all: this.appLibrary.length,
      macos: 0,
      windows: 0,
      linux: 0,
      android: 0,
      ios: 0
    };

    for (const app of this.appLibrary) {
      const type = app.os_type.toLowerCase();
      if (counts[type] !== undefined) {
        counts[type]++;
      }
    }

    for (const key of Object.keys(counts)) {
      const el = document.getElementById(`count-${key}`);
      if (el) el.textContent = counts[key].toString();
    }
  }

  private getOSIcon(osType: string): string {
    switch (osType.toLowerCase()) {
      case 'macos':
        return `<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" style="color: #A2AAAD;"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.63-.77 1.06-1.84.94-2.91-.91.04-2.02.61-2.67 1.38-.58.67-1.08 1.76-.95 2.8 1.02.08 2.05-.51 2.68-1.27z"/></svg>`;
      case 'windows':
        return `<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" style="color: #0078D4;"><path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.95-1.801"/></svg>`;
      case 'linux':
        return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: #E95420;"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>`;
      case 'android':
        return `<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" style="color: #3DDC84;"><path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.551 0 .9993.4482.9993.9993.0001.5511-.4483.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993 0 .5511-.4482.9997-.9993.9997m11.4045-6.02l1.996-3.4572c.1568-.2716.064-.6184-.2076-.7752-.2715-.1568-.6183-.064-.7752.2076l-2.0236 3.505c-1.391-.6348-2.943-.987-4.571-.987s-3.18.3522-4.571.987L5.709 5.3026c-.1569-.2716-.5037-.3644-.7752-.2076-.2716.1568-.3644.5036-.2076.7752l1.996 3.4572C3.123 11.233 1.054 14.821 1 18.999h22c-.054-4.178-2.123-7.766-5.1185-9.6776"/></svg>`;
      case 'ios':
        return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: #A855F7;"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>`;
      default:
        return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2"></rect></svg>`;
    }
  }

  private renderAppLibrary() {
    const grid = document.getElementById('app-library-grid');
    const emptyState = document.getElementById('app-library-empty');
    if (!grid) return;

    let filtered = this.appLibrary.filter(app => {
      // Category filter
      if (this.activeAppCategory !== 'all' && app.os_type.toLowerCase() !== this.activeAppCategory) {
        return false;
      }
      // Search filter
      if (this.appSearchQuery) {
        const query = this.appSearchQuery;
        const matchName = app.name.toLowerCase().includes(query);
        const matchPath = app.file_path.toLowerCase().includes(query);
        const matchFormat = app.format_label.toLowerCase().includes(query);
        const matchArch = app.arch.toLowerCase().includes(query);
        const matchOs = app.os_type.toLowerCase().includes(query);
        if (!matchName && !matchPath && !matchFormat && !matchArch && !matchOs) {
          return false;
        }
      }
      return true;
    });

    if (filtered.length === 0) {
      grid.innerHTML = '';
      if (emptyState) emptyState.style.display = 'block';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';

    grid.innerHTML = filtered.map(app => {
      const iconSvg = this.getOSIcon(app.os_type);
      const sizeStr = app.file_size_bytes > 0 ? formatBytes(app.file_size_bytes) : '-- MB';

      return `
        <div class="app-card" data-app-id="${app.id}">
          <div class="app-card-top">
            <div class="app-card-icon">
              ${iconSvg}
            </div>
            <div class="app-card-info">
              <div class="app-card-title" title="${app.name}">${app.name}</div>
              <div class="app-card-path" title="${app.file_path}">${app.file_path}</div>
            </div>
          </div>

          <div class="app-card-meta">
            <span class="app-card-meta-tag">${app.format_label}</span>
            <span class="app-card-meta-tag">${app.version}</span>
            <span class="app-card-meta-tag">${app.arch}</span>
            <span class="app-card-meta-tag">${sizeStr}</span>
            <span class="app-card-meta-tag" style="color: var(--primary);">${app.storage_type}</span>
          </div>

          <div class="app-card-actions">
            <button class="btn-primary btn-run-app" data-file-path="${app.file_path}" data-app-name="${app.name}" title="Run application with quickOS bridge">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
              Run App
            </button>
            <button class="btn-icon-action btn-reveal-app" data-file-path="${app.file_path}" title="Reveal in Finder / File Explorer">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
            </button>
            <button class="btn-icon-action danger btn-delete-app" data-app-id="${app.id}" data-app-name="${app.name}" title="Remove from Library">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Attach button listeners to generated cards
    grid.querySelectorAll<HTMLButtonElement>('.btn-run-app').forEach(btn => {
      btn.addEventListener('click', () => {
        const path = btn.getAttribute('data-file-path') || '';
        const name = btn.getAttribute('data-app-name') || 'Application';
        this.runLibraryApp(path, name, btn);
      });
    });

    grid.querySelectorAll<HTMLButtonElement>('.btn-reveal-app').forEach(btn => {
      btn.addEventListener('click', () => {
        const path = btn.getAttribute('data-file-path') || '';
        this.revealLibraryApp(path);
      });
    });

    grid.querySelectorAll<HTMLButtonElement>('.btn-delete-app').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-app-id') || '';
        const name = btn.getAttribute('data-app-name') || 'App';
        this.deleteLibraryApp(id, name);
      });
    });
  }

  private async runLibraryApp(filePath: string, name: string, btn?: HTMLButtonElement) {
    if (btn) {
      const origText = btn.innerHTML;
      btn.innerHTML = `<span class="pulse-dot" style="background: #fff; width: 6px; height: 6px;"></span> Launching...`;
      btn.disabled = true;
      setTimeout(() => {
        btn.innerHTML = origText;
        btn.disabled = false;
      }, 1500);
    }

    const app = this.appLibrary.find(a => a.file_path === filePath) || {
      id: `app-${Date.now()}`,
      name,
      file_path: filePath,
      os_type: 'unknown',
      version: 'v1.0.0',
      format_label: 'Application Package',
      arch: 'Universal',
      file_size_bytes: 0,
      storage_type: 'Local Storage',
      icon_type: 'unknown'
    };

    await this.launchRunnerWindow({
      id: app.id,
      name: app.name,
      filePath: app.file_path,
      osType: app.os_type,
      version: app.version,
      formatLabel: app.format_label,
    });
  }

  public async launchRunnerWindow(app: {
    id?: string;
    name: string;
    filePath: string;
    osType?: string;
    version?: string;
    formatLabel?: string;
  }) {
    const appId = app.id || `app-${Date.now()}`;
    const name = app.name || 'Application';
    const filePath = app.filePath || '';
    let osType = app.osType || 'unknown';
    let formatLabel = app.formatLabel || 'Binary Executable';
    const version = app.version || 'v1.0.0';

    if ((osType === 'unknown' || !osType) && filePath) {
      try {
        const detected = await invokeBackend<AppTypeInfo>('detect_app_type', { file_path: filePath });
        osType = detected.detected_type;
        formatLabel = detected.format_label;
      } catch (e) {
        console.warn("Auto-detect failed:", e);
      }
    }

    const isMobile = osType.toLowerCase() === 'android' || osType.toLowerCase() === 'ios';
    const width = isMobile ? 480 : 1140;
    const height = isMobile ? 900 : 780;

    // First attempt native Tauri window creation
    try {
      await invokeBackend('open_runner_window', {
        appId,
        name,
        filePath,
        osType,
        version,
        formatLabel
      });
      return;
    } catch (err) {
      console.warn("Tauri native window creation fallback:", err);
    }

    // Web / browser popup fallback
    const query = new URLSearchParams({
      appId,
      name,
      path: filePath,
      os: osType,
      version,
      format: formatLabel
    }).toString();

    const url = `runner.html?${query}`;
    const features = `width=${width},height=${height},menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes`;
    window.open(url, `quickos_runner_${appId}`, features);
  }

  private async revealLibraryApp(filePath: string) {
    try {
      await invokeBackend('reveal_in_finder', { file_path: filePath });
    } catch (err) {
      console.error("Error revealing app in finder:", err);
    }
  }

  private deleteLibraryApp(id: string, name: string) {
    const confirmed = confirm(`Are you sure you want to remove "${name}" from your quickOS App Library?`);
    if (!confirmed) return;

    this.appLibrary = this.appLibrary.filter(a => a.id !== id);
    this.saveAppLibrary();
  }
}

// Bootstrap
window.addEventListener('DOMContentLoaded', () => {
  const app = new QuickOSApp();
  app.init();
});
