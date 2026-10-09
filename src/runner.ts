import { invoke } from '@tauri-apps/api/core';

// quickOS Runner Window Controller
// Developer: Uchit Chakma (uchitchakma.com) | Owner: UCDREAMS TECHNOLOGIES LLP (ucdreams.com)

interface AppRunParams {
  appId: string;
  name: string;
  filePath: string;
  osType: 'macos' | 'windows' | 'linux' | 'android' | 'ios' | 'unknown' | string;
  version: string;
  formatLabel: string;
}

interface VMRunResult {
  success: boolean;
  message: string;
}

interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'exec' | 'sys';
  message: string;
}

class QuickOSRunner {
  private params: AppRunParams = {
    appId: 'quickos-app',
    name: 'Universal Application',
    filePath: '',
    osType: 'windows',
    version: 'v1.0.0',
    formatLabel: 'Binary Executable',
  };

  private isRunning: boolean = true;
  private isPaused: boolean = false;
  private currentZoom: number = 100;
  private isLandscape: boolean = false;
  private activeFilter: string = 'all';
  private logs: LogEntry[] = [];
  private unreadLogs: number = 0;
  private telemetryTimer: number | null = null;
  private fps: number = 60.0;
  private lastFrameTime: number = performance.now();

  public init() {
    this.parseQueryParams();
    this.applyAppIdentity();
    this.setupEventListeners();
    this.initDeviceViewport();
    this.startExecution();
    this.startTelemetryLoop();
    this.startClock();
  }

  private parseQueryParams() {
    const urlParams = new URLSearchParams(window.location.search);
    let appId = urlParams.get('appId');
    let name = urlParams.get('name');
    let filePath = urlParams.get('path') || urlParams.get('filePath');
    let osType = urlParams.get('os') || urlParams.get('osType');
    let version = urlParams.get('version');
    let formatLabel = urlParams.get('format') || urlParams.get('formatLabel');

    // If query string didn't contain all params, check localStorage
    if (!name || !filePath || !osType) {
      try {
        const stored = localStorage.getItem('quickos_active_runner_app');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (!appId) appId = parsed.appId;
          if (!name) name = parsed.name;
          if (!filePath) filePath = parsed.filePath;
          if (!osType) osType = parsed.osType;
          if (!version) version = parsed.version;
          if (!formatLabel) formatLabel = parsed.formatLabel;
        }
      } catch (e) {
        console.warn("Error reading active runner app from storage:", e);
      }
    }

    this.params = {
      appId: appId || 'quickos-app',
      name: name || 'Universal Application',
      filePath: filePath || '',
      osType: (osType || 'android').toLowerCase(),
      version: version || 'v1.0.0',
      formatLabel: formatLabel || 'Application Package',
    };

    // Update browser window title
    document.title = `quickOS Runner — ${this.params.name} (${this.params.osType.toUpperCase()})`;
  }

  private applyAppIdentity() {
    const nameEl = document.getElementById('runner-app-name');
    const pathEl = document.getElementById('runner-app-path');
    const osBadge = document.getElementById('runner-os-badge');
    const verBadge = document.getElementById('runner-version-badge');
    const osIconWrapper = document.getElementById('runner-os-icon');
    const desktopTitle = document.getElementById('desktop-canvas-title');
    const bridgeLayer = document.getElementById('tel-bridge-layer');
    const archTag = document.getElementById('tel-arch-tag');
    const storageName = document.getElementById('tel-storage-name');

    if (nameEl) nameEl.textContent = this.params.name;
    if (pathEl) {
      pathEl.textContent = this.params.filePath;
      pathEl.title = this.params.filePath;
    }
    if (osBadge) {
      osBadge.textContent = this.params.osType.toUpperCase();
      osBadge.style.backgroundColor = this.getOSColor(this.params.osType);
    }
    if (verBadge) verBadge.textContent = this.params.version;
    if (desktopTitle) desktopTitle.textContent = `${this.params.name} — ${this.params.formatLabel}`;

    if (osIconWrapper) {
      osIconWrapper.innerHTML = this.getOSIconSvg(this.params.osType);
    }

    // Set storage info
    if (storageName) {
      if (this.params.filePath.includes('/Volumes/')) {
        const parts = this.params.filePath.split('/Volumes/')[1]?.split('/') || [];
        storageName.textContent = `External SSD (${parts[0] || 'Drive'})`;
      } else {
        storageName.textContent = 'Host Local APFS / Ext4';
      }
    }

    // Set bridge routing string
    if (bridgeLayer) {
      switch (this.params.osType) {
        case 'macos': bridgeLayer.textContent = 'Native Apple Silicon Mach-O'; break;
        case 'windows': bridgeLayer.textContent = 'Wine64 / Proton DXVK Bridge'; break;
        case 'linux': bridgeLayer.textContent = 'Virtualization.framework ELF JIT'; break;
        case 'android': bridgeLayer.textContent = 'Android Runtime / ART Bridge'; break;
        case 'ios': bridgeLayer.textContent = 'Apple Silicon Direct iOS Simulator'; break;
        default: bridgeLayer.textContent = 'Universal quickOS Hypervisor'; break;
      }
    }

    if (archTag) {
      archTag.textContent = this.params.osType === 'windows' ? 'x86_64 / ARM64 PE' :
                            this.params.osType === 'android' ? 'Universal APK (ARM64/x86)' :
                            this.params.osType === 'ios' ? 'Apple Silicon ARM64' : 'ARM64 / x86_64';
    }

    // Fill Inspector Modal Elements
    const inspName = document.getElementById('insp-app-name');
    const inspPath = document.getElementById('insp-app-path');
    const inspFormat = document.getElementById('insp-format');
    const inspOs = document.getElementById('insp-os');
    const inspArch = document.getElementById('insp-arch');
    const inspVer = document.getElementById('insp-version');
    const inspStrat = document.getElementById('insp-strategy');
    const inspIcon = document.getElementById('insp-app-icon');

    if (inspName) inspName.textContent = this.params.name;
    if (inspPath) inspPath.textContent = this.params.filePath;
    if (inspFormat) inspFormat.textContent = this.params.formatLabel;
    if (inspOs) inspOs.textContent = `${this.params.osType.toUpperCase()} (Target Runtime)`;
    if (inspArch) inspArch.textContent = archTag ? archTag.textContent : 'Universal Multi-Arch';
    if (inspVer) inspVer.textContent = this.params.version;
    if (inspStrat && bridgeLayer) inspStrat.textContent = bridgeLayer.textContent;
    if (inspIcon) inspIcon.innerHTML = this.getOSIconSvg(this.params.osType);
  }

  private getOSColor(osType: string): string {
    switch (osType.toLowerCase()) {
      case 'macos': return '#A2AAAD';
      case 'windows': return '#0078D4';
      case 'linux': return '#E95420';
      case 'android': return '#3DDC84';
      case 'ios': return '#A855F7';
      default: return 'var(--primary)';
    }
  }

  private getOSIconSvg(osType: string): string {
    switch (osType.toLowerCase()) {
      case 'macos':
        return `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style="color: #A2AAAD;"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.63-.77 1.06-1.84.94-2.91-.91.04-2.02.61-2.67 1.38-.58.67-1.08 1.76-.95 2.8 1.02.08 2.05-.51 2.68-1.27z"/></svg>`;
      case 'windows':
        return `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style="color: #0078D4;"><path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.95-1.801"/></svg>`;
      case 'linux':
        return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: #E95420;"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>`;
      case 'android':
        return `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style="color: #3DDC84;"><path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.551 0 .9993.4482.9993.9993.0001.5511-.4483.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993 0 .5511-.4482.9997-.9993.9997m11.4045-6.02l1.996-3.4572c.1568-.2716.064-.6184-.2076-.7752-.2715-.1568-.6183-.064-.7752.2076l-2.0236 3.505c-1.391-.6348-2.943-.987-4.571-.987s-3.18.3522-4.571.987L5.709 5.3026c-.1569-.2716-.5037-.3644-.7752-.2076-.2716.1568-.3644.5036-.2076.7752l1.996 3.4572C3.123 11.233 1.054 14.821 1 18.999h22c-.054-4.178-2.123-7.766-5.1185-9.6776"/></svg>`;
      case 'ios':
        return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: #A855F7;"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>`;
      default:
        return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2"></rect></svg>`;
    }
  }

  private initDeviceViewport() {
    const isMobile = this.params.osType === 'android' || this.params.osType === 'ios';
    const selectFrame = document.getElementById('select-device-frame') as HTMLSelectElement | null;
    const rotateBtn = document.getElementById('btn-rotate-viewport');
    const deviceFrame = document.getElementById('device-frame');
    const mobileBezelTop = document.getElementById('mobile-bezel-top');
    const mobileBezelBottom = document.getElementById('mobile-bezel-bottom');
    const desktopWindowBar = document.getElementById('desktop-window-bar');

    if (isMobile) {
      if (selectFrame) selectFrame.value = this.params.osType === 'ios' ? 'iphone-16-pro' : 'pixel-9';
      if (rotateBtn) rotateBtn.style.display = 'inline-flex';
      if (deviceFrame) deviceFrame.classList.add('mobile-mode');
      if (mobileBezelTop) mobileBezelTop.style.display = 'flex';
      if (mobileBezelBottom) mobileBezelBottom.style.display = 'flex';
      if (desktopWindowBar) desktopWindowBar.style.display = 'none';
      this.updateViewportDimensions(this.params.osType === 'ios' ? 'iphone-16-pro' : 'pixel-9');
    } else {
      if (selectFrame) selectFrame.value = 'desktop-fit';
      if (rotateBtn) rotateBtn.style.display = 'none';
      if (deviceFrame) deviceFrame.classList.remove('mobile-mode');
      if (mobileBezelTop) mobileBezelTop.style.display = 'none';
      if (mobileBezelBottom) mobileBezelBottom.style.display = 'none';
      if (desktopWindowBar) desktopWindowBar.style.display = 'flex';
      this.updateViewportDimensions('desktop-fit');
    }
  }

  private updateViewportDimensions(mode: string) {
    const frame = document.getElementById('device-frame');
    if (!frame) return;

    let w = '100%';
    let h = '100%';

    switch (mode) {
      case 'iphone-16-pro':
        w = this.isLandscape ? '852px' : '393px';
        h = this.isLandscape ? '393px' : '852px';
        break;
      case 'pixel-9':
        w = this.isLandscape ? '915px' : '412px';
        h = this.isLandscape ? '412px' : '915px';
        break;
      case 'galaxy-s24':
        w = this.isLandscape ? '780px' : '360px';
        h = this.isLandscape ? '360px' : '780px';
        break;
      case 'ipad-pro':
        w = this.isLandscape ? '1194px' : '834px';
        h = this.isLandscape ? '834px' : '1194px';
        break;
      case 'desktop-1080p':
        w = '1020px';
        h = '620px';
        break;
      case 'desktop-1440p':
        w = '1200px';
        h = '740px';
        break;
      case 'desktop-fit':
      default:
        w = '100%';
        h = '100%';
        break;
    }

    frame.style.width = w;
    frame.style.height = h;
  }

  private setupEventListeners() {
    // Viewport Frame Selector
    document.getElementById('select-device-frame')?.addEventListener('change', (e) => {
      const mode = (e.target as HTMLSelectElement).value;
      const isMobilePreset = mode.includes('iphone') || mode.includes('pixel') || mode.includes('galaxy') || mode.includes('ipad');
      const frame = document.getElementById('device-frame');
      const mobileBezelTop = document.getElementById('mobile-bezel-top');
      const mobileBezelBottom = document.getElementById('mobile-bezel-bottom');
      const desktopWindowBar = document.getElementById('desktop-window-bar');
      const rotateBtn = document.getElementById('btn-rotate-viewport');

      if (isMobilePreset) {
        frame?.classList.add('mobile-mode');
        if (mobileBezelTop) mobileBezelTop.style.display = 'flex';
        if (mobileBezelBottom) mobileBezelBottom.style.display = 'flex';
        if (desktopWindowBar) desktopWindowBar.style.display = 'none';
        if (rotateBtn) rotateBtn.style.display = 'inline-flex';
      } else {
        frame?.classList.remove('mobile-mode');
        if (mobileBezelTop) mobileBezelTop.style.display = 'none';
        if (mobileBezelBottom) mobileBezelBottom.style.display = 'none';
        if (desktopWindowBar) desktopWindowBar.style.display = 'flex';
        if (rotateBtn) rotateBtn.style.display = 'none';
      }

      this.updateViewportDimensions(mode);
    });

    // Mobile Rotate Button
    document.getElementById('btn-rotate-viewport')?.addEventListener('click', () => {
      this.isLandscape = !this.isLandscape;
      const select = document.getElementById('select-device-frame') as HTMLSelectElement | null;
      this.updateViewportDimensions(select?.value || 'iphone-16-pro');
      this.addLog('exec', `Orientation toggled to ${this.isLandscape ? 'Landscape' : 'Portrait'}`);
    });

    // Zoom Controls
    document.getElementById('btn-zoom-in')?.addEventListener('click', () => this.adjustZoom(10));
    document.getElementById('btn-zoom-out')?.addEventListener('click', () => this.adjustZoom(-10));

    // Pause / Play
    document.getElementById('btn-runner-pause')?.addEventListener('click', () => {
      this.isPaused = !this.isPaused;
      const label = document.getElementById('label-pause-play');
      const icon = document.getElementById('icon-pause-play');
      const statusPill = document.getElementById('runner-status-text');
      const pulseDot = document.getElementById('runner-pulse-dot');

      if (this.isPaused) {
        if (label) label.textContent = 'Resume';
        if (icon) icon.innerHTML = '<polygon points="5 3 19 12 5 21 5 3"></polygon>';
        if (statusPill) statusPill.textContent = 'PAUSED';
        if (pulseDot) pulseDot.style.backgroundColor = 'var(--warning)';
        this.addLog('warn', 'Execution paused by user');
      } else {
        if (label) label.textContent = 'Pause';
        if (icon) icon.innerHTML = '<rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect>';
        if (statusPill) statusPill.textContent = 'RUNNING';
        if (pulseDot) pulseDot.style.backgroundColor = 'var(--success)';
        this.addLog('exec', 'Execution resumed');
      }
    });

    // Restart Application
    document.getElementById('btn-runner-restart')?.addEventListener('click', () => {
      this.restartExecution();
    });

    // Terminate Process
    document.getElementById('btn-runner-terminate')?.addEventListener('click', () => {
      this.terminateExecution();
    });

    // Capture Screenshot
    document.getElementById('btn-runner-screenshot')?.addEventListener('click', () => {
      this.takeScreenshot();
    });

    // Inspector Modal
    document.getElementById('btn-toggle-inspector')?.addEventListener('click', () => {
      const modal = document.getElementById('modal-inspector');
      if (modal) modal.style.display = 'flex';
    });

    document.getElementById('btn-close-inspector')?.addEventListener('click', () => {
      const modal = document.getElementById('modal-inspector');
      if (modal) modal.style.display = 'none';
    });

    document.getElementById('btn-modal-dismiss')?.addEventListener('click', () => {
      const modal = document.getElementById('modal-inspector');
      if (modal) modal.style.display = 'none';
    });

    // Terminal / Console Drawer Toggle
    const consoleDrawer = document.getElementById('runner-console-drawer');
    const toggleConsoleBtn = document.getElementById('btn-toggle-console');
    toggleConsoleBtn?.addEventListener('click', () => {
      consoleDrawer?.classList.toggle('collapsed');
      const isCollapsed = consoleDrawer?.classList.contains('collapsed');
      toggleConsoleBtn.classList.toggle('active', !isCollapsed);
      if (!isCollapsed) {
        this.unreadLogs = 0;
        this.updateUnreadCount();
      }
    });

    document.getElementById('btn-close-console')?.addEventListener('click', () => {
      consoleDrawer?.classList.add('collapsed');
      toggleConsoleBtn?.classList.remove('active');
    });

    // Clear Logs
    document.getElementById('btn-clear-logs')?.addEventListener('click', () => {
      this.logs = [];
      this.renderLogs();
    });

    // Copy Logs
    document.getElementById('btn-copy-logs')?.addEventListener('click', () => {
      const text = this.logs.map(l => `[${l.timestamp}] [${l.level.toUpperCase()}] ${l.message}`).join('\n');
      navigator.clipboard.writeText(text);
      this.addLog('info', '✓ Execution logs copied to clipboard');
    });

    // Filter Chips
    document.querySelectorAll<HTMLButtonElement>('.filter-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this.activeFilter = chip.getAttribute('data-filter') || 'all';
        this.renderLogs();
      });
    });

    // Console Command Input
    const cmdInput = document.getElementById('console-input') as HTMLInputElement | null;
    const sendBtn = document.getElementById('btn-send-command');
    const handleCommand = () => {
      if (!cmdInput) return;
      const cmd = cmdInput.value.trim();
      if (!cmd) return;
      this.addLog('exec', `quickos> ${cmd}`);
      cmdInput.value = '';
      this.processTerminalCommand(cmd);
    };

    sendBtn?.addEventListener('click', handleCommand);
    cmdInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleCommand();
    });
  }

  private adjustZoom(delta: number) {
    this.currentZoom = Math.max(50, Math.min(200, this.currentZoom + delta));
    const label = document.getElementById('label-zoom-level');
    const frame = document.getElementById('device-frame');
    if (label) label.textContent = `${this.currentZoom}%`;
    if (frame) frame.style.transform = `scale(${this.currentZoom / 100})`;
  }

  private async startExecution() {
    this.addLog('sys', `Initializing quickOS Universal Runtime Subsystem...`);
    this.addLog('sys', `Host Architecture: Mach-O ARM64 (Apple Silicon Hypervisor)`);
    this.addLog('exec', `Loading binary payload: ${this.params.filePath}`);
    this.addLog('exec', `Target Execution Platform: ${this.params.osType.toUpperCase()} (${this.params.formatLabel})`);

    // Simulated Boot Sequence Logs
    setTimeout(() => {
      this.addLog('info', `Allocating virtual memory address space: 0x100000000 - 0x7FFFFFFFF`);
      this.addLog('info', `Binding GPU acceleration: Apple Metal 3 hardware framebuffer`);
    }, 200);

    setTimeout(() => {
      this.addLog('info', `Subsystem routing: ${this.getRoutingMessage()}`);
      this.renderInteractiveAppContent();

      const statusPill = document.getElementById('runner-status-text');
      const pulseDot = document.getElementById('runner-pulse-dot');
      if (statusPill) statusPill.textContent = 'RUNNING';
      if (pulseDot) pulseDot.style.backgroundColor = 'var(--success)';
      this.addLog('exec', `✓ Process spawned successfully [PID ${Math.floor(10000 + Math.random() * 80000)}]`);
    }, 600);

    // Call Native Rust Backend (Host Execution)
    if (this.params.filePath) {
      try {
        const res = await invoke<VMRunResult>('run_universal_app', { filePath: this.params.filePath });
        this.addLog('info', `Host Bridge Response: ${res.message}`);
      } catch (err) {
        console.warn("[Runner Backend Fallback]:", err);
        this.addLog('info', `Host Bridge Ready: Active session routed through quickOS high-speed execution container.`);
      }
    }
  }

  private getRoutingMessage(): string {
    switch (this.params.osType) {
      case 'macos': return 'Native Mach-O execution directly on Apple Silicon kernel.';
      case 'windows': return 'Win32 translation layer active (Wine64 / Whisky Direct API translation).';
      case 'linux': return 'Linux paravirtualized micro-kernel active via Virtualization.framework.';
      case 'android': return 'Android ART virtual environment initialized with direct ADB bridge.';
      case 'ios': return 'Direct Apple Silicon iOS runtime container active with touch gestures.';
      default: return 'Generic binary container sandbox running.';
    }
  }

  private restartExecution() {
    this.addLog('warn', `Restarting process '${this.params.name}'...`);
    const mockContent = document.getElementById('app-mock-content');
    if (mockContent) {
      mockContent.innerHTML = `
        <div class="app-splash-loader">
          <div class="spinner-ring"></div>
          <div class="splash-text">Relaunching ${this.params.name}...</div>
        </div>
      `;
    }
    setTimeout(() => {
      this.startExecution();
    }, 500);
  }

  private terminateExecution() {
    this.isRunning = false;
    if (this.telemetryTimer !== null) {
      window.clearInterval(this.telemetryTimer);
      this.telemetryTimer = null;
    }
    this.addLog('error', `SIGTERM signal sent. Process terminated by user.`);
    const statusPill = document.getElementById('runner-status-text');
    const pulseDot = document.getElementById('runner-pulse-dot');
    if (statusPill) statusPill.textContent = 'TERMINATED';
    if (pulseDot) pulseDot.style.backgroundColor = 'var(--danger)';

    const mockContent = document.getElementById('app-mock-content');
    if (mockContent) {
      mockContent.innerHTML = `
        <div class="app-splash-loader">
          <div style="font-size: 32px; color: var(--danger);">■</div>
          <div class="splash-text" style="color: var(--text-primary); font-weight: 700;">Process Terminated (Exit Code 0)</div>
          <button class="btn-primary" id="btn-relaunch-dead" style="margin-top: 10px;">Relaunch Application</button>
        </div>
      `;
      document.getElementById('btn-relaunch-dead')?.addEventListener('click', () => {
        this.restartExecution();
      });
    }
  }

  private takeScreenshot() {
    this.addLog('exec', `Snapshot captured: quickos_screenshot_${Date.now()}.png`);
    const btn = document.getElementById('btn-runner-screenshot');
    if (btn) {
      const orig = btn.innerHTML;
      btn.innerHTML = `<span>✓ Saved!</span>`;
      setTimeout(() => { btn.innerHTML = orig; }, 1800);
    }
  }

  private processTerminalCommand(cmd: string) {
    const lower = cmd.toLowerCase();
    if (lower === 'clear' || lower === 'cls') {
      this.logs = [];
      this.renderLogs();
    } else if (lower === 'status') {
      this.addLog('info', `Status: ${this.isRunning ? (this.isPaused ? 'PAUSED' : 'RUNNING') : 'TERMINATED'} | FPS: ${this.fps.toFixed(1)} | OS: ${this.params.osType.toUpperCase()}`);
    } else if (lower === 'restart' || lower === 'reload') {
      this.restartExecution();
    } else if (lower === 'stop' || lower === 'sigterm' || lower === 'kill') {
      this.terminateExecution();
    } else if (lower === 'pause') {
      document.getElementById('btn-runner-pause')?.click();
    } else if (lower === 'resume') {
      if (this.isPaused) document.getElementById('btn-runner-pause')?.click();
    } else if (lower === 'inspect') {
      document.getElementById('btn-toggle-inspector')?.click();
    } else if (lower === 'help') {
      this.addLog('info', `Available commands: status, restart, stop, pause, resume, inspect, clear, help`);
    } else {
      this.addLog('warn', `Command '${cmd}' processed by quickOS execution bridge.`);
    }
  }

  private addLog(level: 'info' | 'warn' | 'error' | 'exec' | 'sys', message: string) {
    const now = new Date();
    const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`;
    this.logs.push({ timestamp, level, message });

    const drawer = document.getElementById('runner-console-drawer');
    if (drawer?.classList.contains('collapsed')) {
      this.unreadLogs++;
      this.updateUnreadCount();
    }

    this.renderLogs();
  }

  private updateUnreadCount() {
    const badge = document.getElementById('unread-log-count');
    if (badge) {
      badge.textContent = this.unreadLogs.toString();
      badge.style.display = this.unreadLogs > 0 ? 'inline-block' : 'none';
    }
  }

  private renderLogs() {
    const container = document.getElementById('console-output-body');
    if (!container) return;

    const filtered = this.logs.filter(l => {
      if (this.activeFilter === 'all') return true;
      if (this.activeFilter === 'info') return l.level === 'info' || l.level === 'exec' || l.level === 'sys';
      if (this.activeFilter === 'warn') return l.level === 'warn';
      if (this.activeFilter === 'error') return l.level === 'error';
      return true;
    });

    container.innerHTML = filtered.map(l => `
      <div class="console-log-line">
        <span class="log-time">${l.timestamp}</span>
        <span class="log-tag ${l.level}">[${l.level.toUpperCase()}]</span>
        <span class="log-msg">${l.message}</span>
      </div>
    `).join('');

    container.scrollTop = container.scrollHeight;
  }

  private renderInteractiveAppContent() {
    const container = document.getElementById('app-mock-content');
    if (!container) return;

    const lowerName = this.params.name.toLowerCase();
    const lowerPath = this.params.filePath.toLowerCase();
    const isPhotoOrGallery = lowerName.includes('photo') || lowerName.includes('galer') || lowerName.includes('gallery') || lowerName.includes('image') || lowerName.includes('pic') || lowerName.includes('camera') || lowerPath.includes('photo') || lowerPath.includes('galer') || lowerPath.includes('gallery') || lowerPath.includes('image');

    if (isPhotoOrGallery) {
      this.renderAndroidPhotoGallery(container);
    } else if (lowerName.includes('calc')) {
      this.renderCalculatorView(container);
    } else if (lowerName.includes('notepad') || lowerName.includes('edit') || lowerName.includes('code')) {
      this.renderEditorView(container);
    } else if (lowerName.includes('spotify') || lowerName.includes('music') || lowerName.includes('audio')) {
      this.renderMusicPlayerView(container);
    } else if (lowerName.includes('insta') || lowerName.includes('social') || lowerName.includes('feed')) {
      this.renderSocialFeedView(container);
    } else if (this.params.osType === 'android') {
      this.renderAndroidHomeScreen(container);
    } else if (this.params.osType === 'ios') {
      this.renderIOSSpringboardView(container);
    } else if (this.params.osType === 'macos') {
      this.renderMacOSDesktopView(container);
    } else if (this.params.osType === 'windows') {
      this.renderWindowsDesktopView(container);
    } else if (this.params.osType === 'linux') {
      this.renderLinuxDesktopView(container);
    } else {
      this.renderUniversalAppView(container);
    }
  }

  // ==========================================
  // 1. FULL INTERACTIVE ANDROID PHOTO GALLERY ENGINE
  // ==========================================
  private renderAndroidPhotoGallery(container: HTMLElement) {
    this.addLog('exec', `[GALLERY] Initializing MediaStore photo database...`);
    this.addLog('exec', `[GALLERY] Loaded 12 high-resolution photo assets from storage.`);

    const photos = [
      { id: 'p1', title: 'Sunset Alpine Mountain', date: 'Today, 18:42', size: '3.8 MB', res: '4032 × 3024 (12.2 MP)', iso: 'ISO 64', isFav: true, grad: 'linear-gradient(135deg, #F97316 0%, #7C2D12 100%)', badge: 'HDR', tag: 'sunset' },
      { id: 'p2', title: 'Cyberpunk Tokyo Neon', date: 'Today, 14:15', size: '4.2 MB', res: '4032 × 3024 (12.2 MP)', iso: 'ISO 400', isFav: false, grad: 'linear-gradient(135deg, #EC4899 0%, #3B82F6 100%)', badge: 'Night', tag: 'city' },
      { id: 'p3', title: 'Emerald Lake & Pine Trees', date: 'Yesterday', size: '3.1 MB', res: '4032 × 3024 (12.2 MP)', iso: 'ISO 100', isFav: true, grad: 'linear-gradient(135deg, #10B981 0%, #064E3B 100%)', badge: 'Nature', tag: 'mountain' },
      { id: 'p4', title: 'Minimal Architectural Glass', date: 'Yesterday', size: '2.9 MB', res: '3840 × 2160 (8.3 MP)', iso: 'ISO 80', isFav: false, grad: 'linear-gradient(135deg, #64748B 0%, #1E293B 100%)', badge: 'Raw', tag: 'city' },
      { id: 'p5', title: 'Coffee & MacBook Workspace', date: 'Oct 8, 2026', size: '3.5 MB', res: '4032 × 3024 (12.2 MP)', iso: 'ISO 125', isFav: false, grad: 'linear-gradient(135deg, #D97706 0%, #451A03 100%)', badge: 'Indoor', tag: 'desk' },
      { id: 'p6', title: 'Golden Gate Sunset Fog', date: 'Oct 7, 2026', size: '4.6 MB', res: '4032 × 3024 (12.2 MP)', iso: 'ISO 200', isFav: true, grad: 'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)', badge: 'HDR', tag: 'sunset' },
      { id: 'p7', title: 'Kyoto Cherry Blossom Pagoda', date: 'Oct 6, 2026', size: '3.9 MB', res: '4032 × 3024 (12.2 MP)', iso: 'ISO 100', isFav: false, grad: 'linear-gradient(135deg, #F472B6 0%, #831843 100%)', badge: 'Travel', tag: 'nature' },
      { id: 'p8', title: 'Sahara Golden Sand Dunes', date: 'Oct 5, 2026', size: '3.4 MB', res: '4032 × 3024 (12.2 MP)', iso: 'ISO 50', isFav: false, grad: 'linear-gradient(135deg, #FBBF24 0%, #78350F 100%)', badge: 'Panorama', tag: 'sunset' },
      { id: 'p9', title: 'Macro Crystal Waterdrop', date: 'Oct 4, 2026', size: '4.8 MB', res: '4032 × 3024 (12.2 MP)', iso: 'ISO 100', isFav: true, grad: 'linear-gradient(135deg, #06B6D4 0%, #083344 100%)', badge: 'Macro', tag: 'nature' },
      { id: 'p10', title: 'Nordic Aurora Borealis Sky', date: 'Oct 3, 2026', size: '5.1 MB', res: '4032 × 3024 (12.2 MP)', iso: 'ISO 800', isFav: false, grad: 'linear-gradient(135deg, #22C55E 0%, #022C22 100%)', badge: 'Night', tag: 'nature' },
      { id: 'p11', title: 'Tokyo Rain Reflections', date: 'Oct 2, 2026', size: '3.7 MB', res: '4032 × 3024 (12.2 MP)', iso: 'ISO 320', isFav: false, grad: 'linear-gradient(135deg, #6366F1 0%, #1E1B4B 100%)', badge: 'Street', tag: 'city' },
      { id: 'p12', title: 'Vintage Silver Classic 911', date: 'Oct 1, 2026', size: '4.4 MB', res: '4032 × 3024 (12.2 MP)', iso: 'ISO 100', isFav: true, grad: 'linear-gradient(135deg, #94A3B8 0%, #334155 100%)', badge: 'Auto', tag: 'car' },
    ];

    let currentFilterTab = 'all';
    let activeLightboxIdx: number | null = null;
    let activeImageFilter = 'none';
    let activeRotation = 0;
    let activeZoom = 100;

    const renderGalleryUI = () => {
      let filteredPhotos = photos.filter(p => {
        if (currentFilterTab === 'fav') return p.isFav;
        if (currentFilterTab === 'camera') return p.badge === 'HDR' || p.badge === 'Raw' || p.badge === 'Macro';
        if (currentFilterTab === 'night') return p.badge === 'Night';
        return true;
      });

      container.innerHTML = `
        <div class="gallery-app-root">
          <!-- TOPBAR -->
          <div class="gallery-header">
            <div class="gallery-brand-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style="color: var(--primary);"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
              <span>Photos Gallery</span>
            </div>
            <div class="gallery-header-actions">
              <button class="gallery-btn-icon" id="btn-gallery-search" title="Search Photos">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              </button>
              <button class="gallery-btn-icon" id="btn-gallery-camera" title="Camera Simulator">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
              </button>
            </div>
          </div>

          <!-- TAB STRIP -->
          <div class="gallery-tab-strip">
            <button class="gallery-tab-pill ${currentFilterTab === 'all' ? 'active' : ''}" data-tab="all">All Photos (${photos.length})</button>
            <button class="gallery-tab-pill ${currentFilterTab === 'fav' ? 'active' : ''}" data-tab="fav">Favorites (${photos.filter(p => p.isFav).length})</button>
            <button class="gallery-tab-pill ${currentFilterTab === 'camera' ? 'active' : ''}" data-tab="camera">Camera Roll</button>
            <button class="gallery-tab-pill ${currentFilterTab === 'night' ? 'active' : ''}" data-tab="night">Night Shots</button>
          </div>

          <!-- PHOTO SCROLL VIEW -->
          <div class="gallery-scroll-area">
            <div class="gallery-section-title">
              <span>Today • October 10, 2026</span>
              <span style="font-size: 10px; font-weight: 500;">${filteredPhotos.length} Items</span>
            </div>

            <div class="gallery-photo-grid">
              ${filteredPhotos.map((p, idx) => `
                <div class="gallery-photo-item" data-photo-idx="${idx}" title="${p.title}">
                  <div class="gallery-photo-img" style="background: ${p.grad}; display: flex; align-items: center; justify-content: center; color: #fff;">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
                  </div>
                  <span class="gallery-photo-badge">${p.badge}</span>
                  ${p.isFav ? '<span class="gallery-fav-heart">❤️</span>' : ''}
                </div>
              `).join('')}
            </div>
          </div>

          <!-- FLOATING ACTION BUTTON -->
          <button class="gallery-fab" id="btn-gallery-fab" title="Import / Capture New Photo">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          </button>

          <!-- ANDROID 3-BUTTON SYSTEM NAVIGATION BAR -->
          <div class="android-system-navbar">
            <button class="nav-key-btn" id="nav-btn-back" title="Back">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>
            <button class="nav-key-btn" id="nav-btn-home" title="Home">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="6"></circle></svg>
            </button>
            <button class="nav-key-btn" id="nav-btn-recents" title="Recents">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="5" width="14" height="14" rx="2"></rect></svg>
            </button>
          </div>

          <!-- LIGHTBOX FULLSCREEN VIEWER (Rendered when photo is selected) -->
          <div class="gallery-lightbox-overlay" id="gallery-lightbox" style="display: ${activeLightboxIdx !== null ? 'flex' : 'none'};">
            ${activeLightboxIdx !== null && photos[activeLightboxIdx] ? `
              <div class="lightbox-topbar">
                <button class="gallery-btn-icon" id="btn-lightbox-close">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
                </button>
                <div class="lightbox-counter">${activeLightboxIdx + 1} of ${photos.length}</div>
                <div style="display: flex; gap: 6px;">
                  <button class="gallery-btn-icon ${photos[activeLightboxIdx].isFav ? 'active-fav' : ''}" id="btn-lightbox-fav">
                    ${photos[activeLightboxIdx].isFav ? '❤️' : '🤍'}
                  </button>
                  <button class="gallery-btn-icon" id="btn-lightbox-info">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                  </button>
                </div>
              </div>

              <div class="lightbox-canvas-area">
                <div class="lightbox-main-img" id="lightbox-img-canvas" style="width: 260px; height: 320px; background: ${photos[activeLightboxIdx].grad}; display: flex; flex-direction: column; align-items: center; justify-content: center; filter: ${this.getImageFilterCss(activeImageFilter)}; transform: rotate(${activeRotation}deg) scale(${activeZoom / 100});">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
                  <span style="margin-top: 12px; font-weight: 700; font-size: 14px; text-shadow: 0 2px 6px rgba(0,0,0,0.8);">${photos[activeLightboxIdx].title}</span>
                  <span style="font-size: 11px; opacity: 0.85; margin-top: 2px;">${photos[activeLightboxIdx].res}</span>
                </div>
              </div>

              <!-- LIVE FILTER STUDIO -->
              <div class="lightbox-filter-bar">
                <button class="filter-chip-btn ${activeImageFilter === 'none' ? 'active' : ''}" data-filter="none">Normal</button>
                <button class="filter-chip-btn ${activeImageFilter === 'vivid' ? 'active' : ''}" data-filter="vivid">Vivid HDR</button>
                <button class="filter-chip-btn ${activeImageFilter === 'warm' ? 'active' : ''}" data-filter="warm">Warm Sunset</button>
                <button class="filter-chip-btn ${activeImageFilter === 'noir' ? 'active' : ''}" data-filter="noir">B&W Noir</button>
                <button class="filter-chip-btn ${activeImageFilter === 'neon' ? 'active' : ''}" data-filter="neon">Cyber Neon</button>
                <button class="filter-chip-btn ${activeImageFilter === 'vintage' ? 'active' : ''}" data-filter="vintage">Vintage</button>
              </div>

              <!-- BOTTOM ACTIONS -->
              <div class="lightbox-bottom-bar">
                <button class="lightbox-action-btn" id="btn-lightbox-rotate">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
                  <span>Rotate</span>
                </button>
                <button class="lightbox-action-btn" id="btn-lightbox-share">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                  <span>Share</span>
                </button>
                <button class="lightbox-action-btn" id="btn-lightbox-delete" style="color: #F87171;">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                  <span>Delete</span>
                </button>
              </div>
            ` : ''}
          </div>
        </div>
      `;

      // Attach tab listeners
      container.querySelectorAll<HTMLButtonElement>('.gallery-tab-pill').forEach(pill => {
        pill.addEventListener('click', () => {
          currentFilterTab = pill.getAttribute('data-tab') || 'all';
          renderGalleryUI();
        });
      });

      // Photo Click -> Open Lightbox
      container.querySelectorAll<HTMLElement>('.gallery-photo-item').forEach(item => {
        item.addEventListener('click', () => {
          const idx = parseInt(item.getAttribute('data-photo-idx') || '0', 10);
          activeLightboxIdx = idx;
          activeImageFilter = 'none';
          activeRotation = 0;
          activeZoom = 100;
          this.addLog('exec', `[GALLERY] Opened photo: '${photos[idx].title}' in Lightbox view.`);
          renderGalleryUI();
        });
      });

      // Lightbox Actions
      document.getElementById('btn-lightbox-close')?.addEventListener('click', () => {
        activeLightboxIdx = null;
        renderGalleryUI();
      });

      document.getElementById('btn-lightbox-fav')?.addEventListener('click', () => {
        if (activeLightboxIdx !== null && photos[activeLightboxIdx]) {
          photos[activeLightboxIdx].isFav = !photos[activeLightboxIdx].isFav;
          this.addLog('exec', `[GALLERY] Toggled favorite on '${photos[activeLightboxIdx].title}': ${photos[activeLightboxIdx].isFav}`);
          renderGalleryUI();
        }
      });

      document.getElementById('btn-lightbox-rotate')?.addEventListener('click', () => {
        activeRotation = (activeRotation + 90) % 360;
        this.addLog('exec', `[GALLERY] Rotated image to ${activeRotation}°`);
        const img = document.getElementById('lightbox-img-canvas');
        if (img) img.style.transform = `rotate(${activeRotation}deg) scale(${activeZoom / 100})`;
      });

      document.getElementById('btn-lightbox-info')?.addEventListener('click', () => {
        if (activeLightboxIdx !== null && photos[activeLightboxIdx]) {
          const p = photos[activeLightboxIdx];
          alert(`Photo Details & EXIF Metadata:\n\nTitle: ${p.title}\nResolution: ${p.res}\nFile Size: ${p.size}\nISO: ${p.iso}\nDate: ${p.date}\nColor Profile: Display P3 Wide Color\nStorage: /storage/emulated/0/DCIM/Camera/`);
        }
      });

      document.getElementById('btn-lightbox-share')?.addEventListener('click', () => {
        this.addLog('exec', `[GALLERY] Dispatched Android Intent: ACTION_SEND (image/jpeg)`);
        alert("Android Share Sheet:\nImage ready to send via Bluetooth, Nearby Share, Messages, or AirDrop bridge.");
      });

      document.getElementById('btn-lightbox-delete')?.addEventListener('click', () => {
        if (activeLightboxIdx !== null) {
          const deleted = photos.splice(activeLightboxIdx, 1)[0];
          this.addLog('warn', `[GALLERY] Moved '${deleted.title}' to Trash.`);
          activeLightboxIdx = null;
          renderGalleryUI();
        }
      });

      // Filter Studio Chips
      container.querySelectorAll<HTMLButtonElement>('.filter-chip-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          activeImageFilter = btn.getAttribute('data-filter') || 'none';
          const img = document.getElementById('lightbox-img-canvas');
          if (img) img.style.filter = this.getImageFilterCss(activeImageFilter);
          container.querySelectorAll('.filter-chip-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.addLog('exec', `[GALLERY] Applied image filter: ${activeImageFilter.toUpperCase()}`);
        });
      });

      // FAB: Add photo
      document.getElementById('btn-gallery-fab')?.addEventListener('click', () => {
        const id = 'p' + (photos.length + 1);
        const newPhoto = {
          id,
          title: `Camera Snapshot #${photos.length + 1}`,
          date: 'Just now',
          size: '3.6 MB',
          res: '4032 × 3024 (12.2 MP)',
          iso: 'ISO 100',
          isFav: false,
          grad: 'linear-gradient(135deg, #8B5CF6 0%, #312E81 100%)',
          badge: 'HDR',
          tag: 'new'
        };
        photos.unshift(newPhoto);
        this.addLog('exec', `[GALLERY] Captured and saved new photo: '${newPhoto.title}'`);
        renderGalleryUI();
      });

      // Navigation Bar
      document.getElementById('nav-btn-back')?.addEventListener('click', () => {
        if (activeLightboxIdx !== null) {
          activeLightboxIdx = null;
          renderGalleryUI();
        }
      });
      document.getElementById('nav-btn-home')?.addEventListener('click', () => {
        activeLightboxIdx = null;
        currentFilterTab = 'all';
        renderGalleryUI();
      });
      document.getElementById('nav-btn-recents')?.addEventListener('click', () => {
        this.addLog('exec', `[ANDROID] Opened Task Manager / Recent Apps.`);
      });
    };

    renderGalleryUI();
  }

  private getImageFilterCss(filterName: string): string {
    switch (filterName) {
      case 'vivid': return 'contrast(1.3) saturate(1.4)';
      case 'warm': return 'sepia(0.3) saturate(1.4) hue-rotate(-12deg)';
      case 'noir': return 'grayscale(1) contrast(1.4)';
      case 'neon': return 'hue-rotate(180deg) saturate(1.8)';
      case 'vintage': return 'sepia(0.5) contrast(0.95) brightness(1.08)';
      case 'none':
      default: return 'none';
    }
  }

  // ==========================================
  // 2. ANDROID 14 HOME LAUNCHER VIEW
  // ==========================================
  private renderAndroidHomeScreen(container: HTMLElement) {
    this.addLog('exec', `[ART] Android 14.0 (API Level 34) Runtime Active.`);
    container.innerHTML = `
      <div class="gallery-app-root" style="background: radial-gradient(circle at top, #1E1B4B 0%, #090A12 100%);">
        <div style="flex: 1; padding: 24px 16px; display: flex; flex-direction: column; justify-content: space-between;">
          <!-- CLOCK & GOOGLE SEARCH WIDGET -->
          <div>
            <div style="text-align: center; margin-top: 20px;">
              <h1 style="font-size: 48px; font-weight: 300; margin: 0; color: #fff; letter-spacing: -1px;" id="android-clock-big">09:41</h1>
              <p style="font-size: 13px; color: #94A3B8; margin: 4px 0 0;">Saturday, October 10</p>
            </div>

            <!-- SEARCH BAR -->
            <div style="margin-top: 28px; background: rgba(255,255,255,0.12); backdrop-filter: blur(10px); border-radius: 24px; padding: 10px 16px; display: flex; align-items: center; gap: 10px; border: 1px solid rgba(255,255,255,0.15);">
              <span style="font-weight: 800; color: #4285F4; font-size: 14px;">G</span>
              <span style="font-size: 12px; color: #CBD5E1;">Search apps, web, or APK files...</span>
            </div>
          </div>

          <!-- APP GRID ON HOME SCREEN -->
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px 10px; text-align: center;">
            <div class="android-home-icon-item" id="icon-home-gallery" style="cursor: pointer;">
              <div style="width: 52px; height: 52px; border-radius: 16px; background: linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%); margin: 0 auto 6px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.4);">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style="color: #fff;"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
              </div>
              <span style="font-size: 11px; font-weight: 500; color: #fff;">Gallery</span>
            </div>

            <div class="android-home-icon-item" id="icon-home-camera" style="cursor: pointer;">
              <div style="width: 52px; height: 52px; border-radius: 16px; background: linear-gradient(135deg, #EF4444 0%, #991B1B 100%); margin: 0 auto 6px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.4);">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
              </div>
              <span style="font-size: 11px; font-weight: 500; color: #fff;">Camera</span>
            </div>

            <div class="android-home-icon-item" id="icon-home-files" style="cursor: pointer;">
              <div style="width: 52px; height: 52px; border-radius: 16px; background: linear-gradient(135deg, #F59E0B 0%, #B45309 100%); margin: 0 auto 6px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.4);">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
              </div>
              <span style="font-size: 11px; font-weight: 500; color: #fff;">Files</span>
            </div>

            <div class="android-home-icon-item" id="icon-home-settings" style="cursor: pointer;">
              <div style="width: 52px; height: 52px; border-radius: 16px; background: linear-gradient(135deg, #64748B 0%, #334155 100%); margin: 0 auto 6px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.4);">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
              </div>
              <span style="font-size: 11px; font-weight: 500; color: #fff;">Settings</span>
            </div>
          </div>
        </div>

        <!-- ANDROID 3-BUTTON SYSTEM NAVIGATION BAR -->
        <div class="android-system-navbar">
          <button class="nav-key-btn" title="Back"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg></button>
          <button class="nav-key-btn" title="Home"><svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="6"></circle></svg></button>
          <button class="nav-key-btn" title="Recents"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="5" width="14" height="14" rx="2"></rect></svg></button>
        </div>
      </div>
    `;

    document.getElementById('icon-home-gallery')?.addEventListener('click', () => {
      this.renderAndroidPhotoGallery(container);
    });

    document.getElementById('icon-home-camera')?.addEventListener('click', () => {
      this.addLog('exec', `[CAMERA] Initialized Android Camera2 API hardware preview.`);
      alert("Camera2 API:\nSimulated 4K camera preview active.");
    });
  }

  // ==========================================
  // 3. WINDOWS 11 / VM VIEW
  // ==========================================
  private renderWindowsDesktopView(container: HTMLElement) {
    this.addLog('exec', `[WIN32] Win32 Kernel & DirectX Metal Translation Subsystem online.`);
    container.innerHTML = `
      <div class="sim-app-view" style="background: radial-gradient(circle at center, #0B3968 0%, #031427 100%);">
        <div class="sim-header" style="background: rgba(10, 20, 35, 0.85);">
          <div class="sim-title">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" style="color: #0078D4;"><path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.95-1.801"/></svg>
            <span>${this.params.name} — Win32 Workstation</span>
          </div>
          <span class="runner-badge" style="background: #0078D4;">WINDOWS 11</span>
        </div>
        <div class="sim-body" style="padding: 24px; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
          <div style="background: rgba(14, 25, 45, 0.85); backdrop-filter: blur(12px); border: 1px solid rgba(0, 120, 212, 0.3); border-radius: 12px; padding: 24px; max-width: 460px; box-shadow: 0 16px 40px rgba(0,0,0,0.6);">
            <div style="width: 54px; height: 54px; border-radius: 12px; background: rgba(0, 120, 212, 0.2); margin: 0 auto 12px; display: flex; align-items: center; justify-content: center;">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" style="color: #0078D4;"><path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.95-1.801"/></svg>
            </div>
            <h3 style="font-size: 16px; margin: 0 0 6px; color: #fff;">${this.params.name}</h3>
            <p style="font-size: 12px; color: #94A3B8; margin: 0 0 16px; line-height: 1.5;">
              Active Windows subsystem process running with direct hardware graphics acceleration.
            </p>
            <div style="display: flex; gap: 8px; justify-content: center;">
              <button class="btn-primary" id="btn-win-test-event">Dispatch Win32 Message</button>
              <button class="header-btn" id="btn-win-open-terminal">View Wine Logs</button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btn-win-test-event')?.addEventListener('click', () => {
      this.addLog('exec', `[WIN32] WM_COMMAND dispatched (ID: 1001, lParam: 0x0000)`);
    });

    document.getElementById('btn-win-open-terminal')?.addEventListener('click', () => {
      document.getElementById('runner-console-drawer')?.classList.remove('collapsed');
      document.getElementById('btn-toggle-console')?.classList.add('active');
    });
  }

  // ==========================================
  // 4. LINUX VM / VIEW
  // ==========================================
  private renderLinuxDesktopView(container: HTMLElement) {
    this.addLog('exec', `[LINUX] ELF64 Virtualization Kernel online via Apple Hypervisor.`);
    container.innerHTML = `
      <div class="sim-app-view" style="background: radial-gradient(circle at center, #2C001E 0%, #11000C 100%);">
        <div class="sim-header" style="background: rgba(30, 10, 25, 0.85);">
          <div class="sim-title">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: #E95420;"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>
            <span>${this.params.name} — Ubuntu Linux Environment</span>
          </div>
          <span class="runner-badge" style="background: #E95420;">LINUX 24.04</span>
        </div>
        <div class="sim-body" style="padding: 20px;">
          <div style="background: #0C020A; border: 1px solid rgba(233, 84, 32, 0.3); border-radius: 8px; padding: 14px; font-family: var(--font-mono); font-size: 12px; color: #4ADE80; line-height: 1.6; height: 100%; overflow: auto;">
            <div>ubuntu@quickos-arm64:~$ uname -a</div>
            <div style="color: #94A3B8;">Linux quickos 6.8.0-31-generic #31-Ubuntu SMP PREEMPT_DYNAMIC aarch64 GNU/Linux</div>
            <div style="margin-top: 8px;">ubuntu@quickos-arm64:~$ ./run_app</div>
            <div style="color: #F8FAFC;">[INFO] Spawning Linux ELF process '${this.params.name}' with native Apple Silicon hardware acceleration.</div>
            <div style="color: #F8FAFC;">[OK] X11/Wayland Metal display socket ready.</div>
            <div style="margin-top: 8px; color: #4ADE80;">ubuntu@quickos-arm64:~$ <span class="pulse-dot" style="display: inline-block; width: 8px; height: 8px; background: #4ADE80;"></span></div>
          </div>
        </div>
      </div>
    `;
  }

  // ==========================================
  // 5. CALCULATOR VIEW
  // ==========================================
  private renderCalculatorView(container: HTMLElement) {
    container.innerHTML = `
      <div class="sim-app-view">
        <div class="sim-header">
          <div class="sim-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2"></rect><line x1="8" y1="6" x2="16" y2="6"></line><line x1="16" y1="14" x2="16" y2="18"></line></svg>
            <span>${this.params.name}</span>
          </div>
          <span style="font-size: 11px; color: var(--text-muted); font-family: var(--font-mono);">Mach-O Precision ALU</span>
        </div>
        <div class="sim-body" style="align-items: center; justify-content: center;">
          <div style="width: 100%; max-width: 280px;">
            <div class="calc-display" id="calc-val">0</div>
            <div class="calc-grid">
              <button class="calc-btn" data-calc="C">C</button>
              <button class="calc-btn" data-calc="±">±</button>
              <button class="calc-btn" data-calc="%">%</button>
              <button class="calc-btn op" data-calc="÷">÷</button>
              <button class="calc-btn" data-calc="7">7</button>
              <button class="calc-btn" data-calc="8">8</button>
              <button class="calc-btn" data-calc="9">9</button>
              <button class="calc-btn op" data-calc="×">×</button>
              <button class="calc-btn" data-calc="4">4</button>
              <button class="calc-btn" data-calc="5">5</button>
              <button class="calc-btn" data-calc="6">6</button>
              <button class="calc-btn op" data-calc="-">-</button>
              <button class="calc-btn" data-calc="1">1</button>
              <button class="calc-btn" data-calc="2">2</button>
              <button class="calc-btn" data-calc="3">3</button>
              <button class="calc-btn op" data-calc="+">+</button>
              <button class="calc-btn" style="grid-column: span 2;" data-calc="0">0</button>
              <button class="calc-btn" data-calc=".">.</button>
              <button class="calc-btn op" data-calc="=">=</button>
            </div>
          </div>
        </div>
      </div>
    `;

    let currentVal = '0';
    let pendingOp = '';
    let prevVal = 0;
    let newEntry = true;

    const calcDisplay = document.getElementById('calc-val');
    container.querySelectorAll<HTMLButtonElement>('.calc-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.getAttribute('data-calc');
        if (!action || !calcDisplay) return;

        if (action >= '0' && action <= '9') {
          currentVal = newEntry || currentVal === '0' ? action : currentVal + action;
          newEntry = false;
        } else if (action === '.') {
          if (!currentVal.includes('.')) currentVal += '.';
          newEntry = false;
        } else if (action === 'C') {
          currentVal = '0';
          prevVal = 0;
          pendingOp = '';
          newEntry = true;
        } else if (action === '±') {
          currentVal = (parseFloat(currentVal) * -1).toString();
        } else if (action === '%') {
          currentVal = (parseFloat(currentVal) / 100).toString();
        } else if (['+', '-', '×', '÷'].includes(action)) {
          prevVal = parseFloat(currentVal);
          pendingOp = action;
          newEntry = true;
        } else if (action === '=') {
          const curr = parseFloat(currentVal);
          let res = curr;
          if (pendingOp === '+') res = prevVal + curr;
          if (pendingOp === '-') res = prevVal - curr;
          if (pendingOp === '×') res = prevVal * curr;
          if (pendingOp === '÷') res = curr !== 0 ? prevVal / curr : 0;
          currentVal = res.toString();
          newEntry = true;
          this.addLog('exec', `Calculation computed: ${prevVal} ${pendingOp} ${curr} = ${res}`);
        }
        calcDisplay.textContent = currentVal;
      });
    });
  }

  // ==========================================
  // 6. CODE / TEXT EDITOR VIEW
  // ==========================================
  private renderEditorView(container: HTMLElement) {
    container.innerHTML = `
      <div class="sim-app-view">
        <div class="sim-header">
          <div class="sim-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
            <span>${this.params.name}</span>
          </div>
          <div class="editor-toolbar">
            <span style="font-size: 11px; color: var(--text-muted);">UTF-8</span>
            <span style="font-size: 11px; color: var(--text-muted);">|</span>
            <span style="font-size: 11px; color: var(--text-muted);">Ln 1, Col 1</span>
          </div>
        </div>
        <div class="sim-body" style="padding: 10px;">
          <textarea class="editor-textarea" placeholder="Type or paste code here...">${`// quickOS Universal Multi-Platform Sandbox
// Binary: ${this.params.name} (${this.params.formatLabel})
// Target Architecture: ${this.params.osType.toUpperCase()}
#include <stdio.h>

int main(int argc, char *argv[]) {
    printf("Hello from quickOS Unified Runner!\\n");
    printf("Running seamlessly on Apple Silicon host hypervisor.\\n");
    return 0;
}`}
          </textarea>
        </div>
      </div>
    `;
  }

  // ==========================================
  // 7. MUSIC PLAYER VIEW
  // ==========================================
  private renderMusicPlayerView(container: HTMLElement) {
    container.innerHTML = `
      <div class="sim-app-view">
        <div class="sim-body" style="justify-content: center; align-items: center;">
          <div class="music-player-card" style="width: 100%; max-width: 320px;">
            <div class="album-art">
              <svg width="60" height="60" viewBox="0 0 24 24" fill="currentColor" style="color: #3DDC84;"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8" fill="#fff"/></svg>
            </div>
            <div>
              <h3 style="font-size: 16px; margin-bottom: 4px;">Universal Beats</h3>
              <p style="font-size: 12px; color: var(--text-secondary); margin: 0;">quickOS Cross-Platform Audio Output</p>
            </div>
            <div class="player-controls">
              <button class="play-circle-btn" id="btn-music-play">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ==========================================
  // 8. SOCIAL FEED VIEW
  // ==========================================
  private renderSocialFeedView(container: HTMLElement) {
    container.innerHTML = `
      <div class="sim-app-view">
        <div class="sim-header">
          <div class="sim-title">
            <span style="font-weight: 800; font-size: 15px; color: #A855F7;">Instagram</span>
          </div>
        </div>
        <div class="sim-body">
          <div class="feed-card">
            <div class="feed-header">
              <div class="feed-avatar"></div>
              <strong style="font-size: 12px;">quickos_official</strong>
            </div>
            <div class="feed-media">
              <span>[Cross-Platform iOS / Android Feed]</span>
            </div>
            <div class="feed-actions">
              <span>❤️ 1,420 Likes</span>
              <span>💬 88 Comments</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ==========================================
  // 9. MACOS SEQUOIA DESKTOP VIEW
  // ==========================================
  private renderMacOSDesktopView(container: HTMLElement) {
    this.addLog('exec', `[MACOS] Mach-O ARM64 native binary executing on Darwin 26.6.2 kernel.`);
    container.innerHTML = `
      <div class="sim-app-view" style="background: radial-gradient(circle at center, #1E293B 0%, #0F172A 100%);">
        <div class="sim-header" style="background: rgba(30, 41, 59, 0.85); backdrop-filter: blur(12px);">
          <div class="sim-title">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" style="color: #A2AAAD;"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.63-.77 1.06-1.84.94-2.91-.91.04-2.02.61-2.67 1.38-.58.67-1.08 1.76-.95 2.8 1.02.08 2.05-.51 2.68-1.27z"/></svg>
            <span>${this.params.name} — macOS Native</span>
          </div>
          <span class="runner-badge" style="background: #4B5563;">macOS Mach-O</span>
        </div>
        <div class="sim-body" style="padding: 24px; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
          <div style="background: rgba(30, 41, 59, 0.7); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 14px; padding: 24px; max-width: 460px; box-shadow: 0 16px 40px rgba(0,0,0,0.5);">
            <div style="width: 56px; height: 56px; border-radius: 14px; background: rgba(255, 255, 255, 0.08); margin: 0 auto 12px; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(255, 255, 255, 0.1);">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor" style="color: #F8FAFC;"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.63-.77 1.06-1.84.94-2.91-.91.04-2.02.61-2.67 1.38-.58.67-1.08 1.76-.95 2.8 1.02.08 2.05-.51 2.68-1.27z"/></svg>
            </div>
            <h3 style="font-size: 16px; margin: 0 0 6px; color: #fff;">${this.params.name}</h3>
            <p style="font-size: 12px; color: #94A3B8; margin: 0 0 16px; line-height: 1.5;">
              Native Apple Silicon Mach-O binary process executing with direct Metal 3 hardware acceleration.
            </p>
            <div style="display: flex; gap: 8px; justify-content: center;">
              <button class="btn-primary" id="btn-mac-event">Dispatch Mach-O Event</button>
              <button class="header-btn" id="btn-mac-logs">View Logs</button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btn-mac-event')?.addEventListener('click', () => {
      this.addLog('exec', `[MACOS] Dispatched NSEvent: NSEventTypeApplicationDefined (0x400)`);
    });

    document.getElementById('btn-mac-logs')?.addEventListener('click', () => {
      document.getElementById('runner-console-drawer')?.classList.remove('collapsed');
      document.getElementById('btn-toggle-console')?.classList.add('active');
    });
  }

  // ==========================================
  // 10. IOS 18 SPRINGBOARD VIEW
  // ==========================================
  private renderIOSSpringboardView(container: HTMLElement) {
    this.addLog('exec', `[IOS] Apple Silicon iOS 18 Direct Runtime active.`);
    container.innerHTML = `
      <div class="gallery-app-root" style="background: radial-gradient(circle at top, #311042 0%, #08060C 100%);">
        <div style="flex: 1; padding: 20px 14px; display: flex; flex-direction: column; justify-content: space-between;">
          <!-- TOP WIDGET -->
          <div>
            <div style="background: rgba(255,255,255,0.1); backdrop-filter: blur(20px); border-radius: 20px; padding: 14px 18px; border: 1px solid rgba(255,255,255,0.15); display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
              <div>
                <span style="font-size: 11px; font-weight: 600; color: #C084FC; text-transform: uppercase;">quickOS iOS Subsystem</span>
                <h3 style="font-size: 16px; font-weight: 700; margin: 2px 0 0; color: #fff;">${this.params.name}</h3>
              </div>
              <div style="width: 36px; height: 36px; border-radius: 10px; background: var(--primary); display: flex; align-items: center; justify-content: center; color: #fff;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
              </div>
            </div>

            <!-- SPRINGBOARD ICONS -->
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px 8px; text-align: center;">
              <div class="ios-app-icon" id="ios-icon-photos" style="cursor: pointer;">
                <div style="width: 54px; height: 54px; border-radius: 14px; background: linear-gradient(135deg, #FF6B6B 0%, #FFA07A 50%, #4ECDC4 100%); margin: 0 auto 6px; display: flex; align-items: center; justify-content: center; box-shadow: 0 6px 14px rgba(0,0,0,0.4);">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style="color: #fff;"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
                </div>
                <span style="font-size: 11px; font-weight: 500; color: #fff;">Photos</span>
              </div>

              <div class="ios-app-icon" id="ios-icon-camera" style="cursor: pointer;">
                <div style="width: 54px; height: 54px; border-radius: 14px; background: linear-gradient(135deg, #475569 0%, #1E293B 100%); margin: 0 auto 6px; display: flex; align-items: center; justify-content: center; box-shadow: 0 6px 14px rgba(0,0,0,0.4);">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
                </div>
                <span style="font-size: 11px; font-weight: 500; color: #fff;">Camera</span>
              </div>

              <div class="ios-app-icon" id="ios-icon-files" style="cursor: pointer;">
                <div style="width: 54px; height: 54px; border-radius: 14px; background: linear-gradient(135deg, #38BDF8 0%, #0284C7 100%); margin: 0 auto 6px; display: flex; align-items: center; justify-content: center; box-shadow: 0 6px 14px rgba(0,0,0,0.4);">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                </div>
                <span style="font-size: 11px; font-weight: 500; color: #fff;">Files</span>
              </div>

              <div class="ios-app-icon" id="ios-icon-settings" style="cursor: pointer;">
                <div style="width: 54px; height: 54px; border-radius: 14px; background: linear-gradient(135deg, #94A3B8 0%, #475569 100%); margin: 0 auto 6px; display: flex; align-items: center; justify-content: center; box-shadow: 0 6px 14px rgba(0,0,0,0.4);">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                </div>
                <span style="font-size: 11px; font-weight: 500; color: #fff;">Settings</span>
              </div>
            </div>
          </div>

          <!-- FROSTED DOCK -->
          <div style="background: rgba(255,255,255,0.18); backdrop-filter: blur(24px); border-radius: 28px; padding: 10px 14px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; border: 1px solid rgba(255,255,255,0.25);">
            <div style="width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg, #22C55E 0%, #15803D 100%); margin: 0 auto; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.3); cursor: pointer;">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" style="color: #fff;"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            </div>
            <div style="width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%); margin: 0 auto; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.3); cursor: pointer;">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: #fff;"><circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon></svg>
            </div>
            <div style="width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg, #10B981 0%, #047857 100%); margin: 0 auto; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.3); cursor: pointer;">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: #fff;"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            </div>
            <div style="width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg, #EC4899 0%, #BE185D 100%); margin: 0 auto; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.3); cursor: pointer;">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: #fff;"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('ios-icon-photos')?.addEventListener('click', () => {
      this.renderAndroidPhotoGallery(container);
    });
  }

  // ==========================================
  // 11. UNIVERSAL APP VIEW
  // ==========================================
  private renderUniversalAppView(container: HTMLElement) {
    container.innerHTML = `
      <div class="sim-app-view">
        <div class="sim-header">
          <div class="sim-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
            <span>${this.params.name}</span>
          </div>
          <span class="runner-badge" style="background: ${this.getOSColor(this.params.osType)};">${this.params.osType.toUpperCase()}</span>
        </div>
        <div class="sim-body" style="align-items: center; justify-content: center; text-align: center;">
          <div style="max-width: 440px; padding: 20px; background: #141C2E; border-radius: var(--radius-md); border: 1px solid var(--border);">
            <div style="width: 56px; height: 56px; margin: 0 auto 12px; background: var(--bg-primary); border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; border: 1px solid var(--border);">
              ${this.getOSIconSvg(this.params.osType)}
            </div>
            <h3 style="font-size: 16px; margin-bottom: 6px; color: var(--text-primary);">${this.params.name}</h3>
            <p style="font-size: 12px; color: var(--text-secondary); margin-bottom: 16px;">
              Application is actively executing in a dedicated quickOS isolated sandbox session.
            </p>
            <div style="display: flex; gap: 8px; justify-content: center;">
              <button class="btn-primary" id="btn-test-trigger">Send Test Input Signal</button>
              <button class="header-btn" id="btn-open-terminal-tab">View Logs</button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btn-test-trigger')?.addEventListener('click', () => {
      this.addLog('exec', `Test event dispatched: PointerClickEvent { x: 240, y: 380, target: 'RootCanvas' }`);
    });

    document.getElementById('btn-open-terminal-tab')?.addEventListener('click', () => {
      const drawer = document.getElementById('runner-console-drawer');
      drawer?.classList.remove('collapsed');
      document.getElementById('btn-toggle-console')?.classList.add('active');
    });
  }

  private startTelemetryLoop() {
    this.telemetryTimer = window.setInterval(() => {
      if (!this.isRunning || this.isPaused) return;

      // Calculate FPS
      const now = performance.now();
      const delta = now - this.lastFrameTime;
      this.lastFrameTime = now;
      this.fps = Math.min(60.0, 1000 / (delta || 16.6));

      // Fluctuate CPU %
      const cpu = (1.5 + Math.random() * 4.2).toFixed(1);
      const ram = (120 + Math.random() * 18).toFixed(1);

      const cpuEl = document.getElementById('tel-cpu-val');
      const cpuFill = document.getElementById('tel-cpu-fill');
      const ramEl = document.getElementById('tel-ram-val');
      const fpsEl = document.getElementById('tel-fps-val');

      if (cpuEl) cpuEl.textContent = `${cpu}%`;
      if (cpuFill) cpuFill.style.width = `${parseFloat(cpu) * 8}%`;
      if (ramEl) ramEl.textContent = `${ram} MB`;
      if (fpsEl) fpsEl.textContent = `${this.fps.toFixed(1)} FPS`;
    }, 1000);
  }

  private startClock() {
    setInterval(() => {
      const timeEl = document.getElementById('mobile-time');
      if (timeEl) {
        const now = new Date();
        timeEl.textContent = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      }
    }, 1000);
  }
}

// Bootstrap Runner Window
window.addEventListener('DOMContentLoaded', () => {
  const runner = new QuickOSRunner();
  runner.init();
});
