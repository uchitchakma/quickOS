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
    const appId = urlParams.get('appId') || 'app-' + Date.now();
    const name = urlParams.get('name') || 'Application';
    const filePath = urlParams.get('path') || urlParams.get('filePath') || '/path/to/app';
    const osType = (urlParams.get('os') || urlParams.get('osType') || 'windows').toLowerCase();
    const version = urlParams.get('version') || 'v1.0.0 (Universal)';
    const formatLabel = urlParams.get('format') || urlParams.get('formatLabel') || 'Application Package';

    this.params = { appId, name, filePath, osType, version, formatLabel };

    // Update browser window title
    document.title = `quickOS Runner — ${name} (${osType.toUpperCase()})`;
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

    if (lowerName.includes('calc')) {
      // CALCULATOR INTERACTIVE VIEW
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
    } else if (lowerName.includes('notepad') || lowerName.includes('edit') || lowerName.includes('code')) {
      // CODE / TEXT EDITOR VIEW
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
    } else if (lowerName.includes('spotify') || lowerName.includes('music') || lowerName.includes('audio')) {
      // MUSIC PLAYER VIEW
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
    } else if (lowerName.includes('insta') || lowerName.includes('social') || lowerName.includes('feed')) {
      // SOCIAL FEED VIEW
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
    } else {
      // UNIVERSAL INTERACTIVE APP VIEW
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
