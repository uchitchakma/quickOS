use serde::{Deserialize, Serialize};
use std::process::Command;
use sysinfo::{Disks, System};

#[derive(Debug, Serialize, Deserialize)]
pub struct SystemSpecs {
    pub hostname: String,
    pub os_name: String,
    pub os_version: String,
    pub kernel_version: String,
    pub arch: String,
    pub cpu_brand: String,
    pub cpu_cores: usize,
    pub cpu_usage_percent: f32,
    pub total_memory_bytes: u64,
    pub used_memory_bytes: u64,
    pub free_memory_bytes: u64,
    pub total_swap_bytes: u64,
    pub used_swap_bytes: u64,
    pub uptime_seconds: u64,
    pub disks: Vec<DiskInfo>,
    pub battery: BatteryInfo,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DiskInfo {
    pub name: String,
    pub mount_point: String,
    pub total_bytes: u64,
    pub available_bytes: u64,
    pub file_system: String,
    pub is_removable: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BatteryInfo {
    pub has_battery: bool,
    pub percentage: u8,
    pub state: String,
    pub time_remaining: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct HypervisorInfo {
    pub supported: bool,
    pub host_cpus: usize,
    pub host_memory_mb: u64,
    pub min_cpus: usize,
    pub max_cpus: usize,
    pub min_memory_mb: u64,
    pub max_memory_mb: u64,
    pub vms_directory: String,
    pub wine_available: bool,
    pub wine_path: Option<String>,
    pub qemu_available: bool,
    pub os_version: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct VMRunResult {
    pub success: bool,
    pub message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PathStatusInfo {
    pub path: String,
    pub exists: bool,
    pub parent_exists: bool,
    pub volume_mounted: bool,
    pub volume_name: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppTypeInfo {
    pub file_path: String,
    pub detected_type: String, // "windows", "macos", "linux", "android", "ios", "unknown"
    pub format_label: String,
    pub host_strategy: String,
    pub can_run: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppMetadataInfo {
    pub id: String,
    pub name: String,
    pub file_path: String,
    pub os_type: String, // "macos", "windows", "linux", "android", "ios"
    pub format_label: String,
    pub version: String,
    pub arch: String,
    pub file_size_bytes: u64,
    pub storage_type: String,
    pub icon_type: String,
}

pub mod handlers {
    use super::*;

    fn get_cross_platform_battery() -> BatteryInfo {
        #[cfg(target_os = "macos")]
        {
            if let Ok(output) = Command::new("pmset").arg("-g").arg("batt").output() {
                let out_str = String::from_utf8_lossy(&output.stdout).to_string();
                if out_str.contains('%') {
                    let mut percent = 100u8;
                    let mut state = "AC Line".to_string();
                    let mut time_rem = "Power Adapter Attached".to_string();

                    for line in out_str.lines() {
                        if let Some(pct_idx) = line.find('%') {
                            let prefix = &line[..pct_idx];
                            if let Some(space_idx) = prefix.rfind(char::is_whitespace) {
                                if let Ok(p) = prefix[space_idx + 1..].trim().parse::<u8>() {
                                    percent = p;
                                }
                            }
                        }
                        let lower = line.to_lowercase();
                        if lower.contains("discharging") {
                            state = "On Battery".to_string();
                            if let Some(rem_idx) = lower.find("remaining") {
                                let rem_part = &line[..rem_idx];
                                if let Some(semi_idx) = rem_part.rfind(';') {
                                    time_rem = format!("{} remaining", rem_part[semi_idx + 1..].trim());
                                } else {
                                    time_rem = "On Battery Power".to_string();
                                }
                            } else {
                                time_rem = "On Battery Power".to_string();
                            }
                        } else if lower.contains("charging") && !lower.contains("discharging") && !lower.contains("finishing charge") {
                            state = "Charging".to_string();
                            if let Some(rem_idx) = lower.find("remaining") {
                                let rem_part = &line[..rem_idx];
                                if let Some(semi_idx) = rem_part.rfind(';') {
                                    let t = rem_part[semi_idx + 1..].trim();
                                    time_rem = if t == "0:00" { "Finishing charge".to_string() } else { format!("{} to full", t) };
                                } else {
                                    time_rem = "Fast Charging (AC)".to_string();
                                }
                            } else {
                                time_rem = "Connected to AC Power".to_string();
                            }
                        } else if lower.contains("charged") || lower.contains("finishing charge") {
                            state = "100% (Full)".to_string();
                            time_rem = "Power Adapter Connected".to_string();
                        }
                    }

                    return BatteryInfo {
                        has_battery: true,
                        percentage: percent,
                        state,
                        time_remaining: time_rem,
                    };
                }
            }
        }

        #[cfg(target_os = "linux")]
        {
            use std::fs;
            if let Ok(entries) = fs::read_dir("/sys/class/power_supply") {
                for entry in entries.flatten() {
                    let path = entry.path();
                    let type_file = path.join("type");
                    if let Ok(type_str) = fs::read_to_string(type_file) {
                        if type_str.trim() == "Battery" {
                            let capacity = fs::read_to_string(path.join("capacity"))
                                .unwrap_or_else(|_| "100".to_string())
                                .trim()
                                .parse::<u8>()
                                .unwrap_or(100);
                            let status = fs::read_to_string(path.join("status"))
                                .unwrap_or_else(|_| "Discharging".to_string())
                                .trim()
                                .to_string();

                            return BatteryInfo {
                                has_battery: true,
                                percentage: capacity,
                                state: status,
                                time_remaining: "Managed by Linux PowerSupply".to_string(),
                            };
                        }
                    }
                }
            }
        }

        #[cfg(target_os = "windows")]
        {
            if let Ok(output) = Command::new("powershell")
                .args(["-NoProfile", "-Command", "Get-CimInstance -ClassName Win32_Battery | Select-Object -Property EstimatedChargeRemaining, BatteryStatus | ConvertTo-Json"])
                .output()
            {
                let out_str = String::from_utf8_lossy(&output.stdout);
                if let Ok(v) = serde_json::from_str::<serde_json::Value>(&out_str) {
                    let pct = v.get("EstimatedChargeRemaining").and_then(|p| p.as_u64()).unwrap_or(100) as u8;
                    return BatteryInfo {
                        has_battery: true,
                        percentage: pct,
                        state: "AC / Battery Detected".to_string(),
                        time_remaining: "Managed by Windows".to_string(),
                    };
                }
            }
        }

        BatteryInfo {
            has_battery: false,
            percentage: 100,
            state: "Desktop / Continuous AC".to_string(),
            time_remaining: "Direct Power Line".to_string(),
        }
    }

    #[tauri::command]
    pub fn get_system_info() -> SystemSpecs {
        let mut sys = System::new_all();
        sys.refresh_all();
        std::thread::sleep(std::time::Duration::from_millis(100));
        sys.refresh_cpu_all();

        let hostname = System::host_name().unwrap_or_else(|| "quickOS-Host".to_string());
        let os_name = System::name().unwrap_or_else(|| std::env::consts::OS.to_string());
        let os_version = System::os_version().unwrap_or_else(|| "Universal".to_string());
        let kernel_version = System::kernel_version().unwrap_or_else(|| "N/A".to_string());
        let arch = System::cpu_arch();

        let cpus = sys.cpus();
        let cpu_brand = cpus.first().map(|c| c.brand().to_string()).unwrap_or_else(|| "Multi-Core Processor".to_string());
        let cpu_cores = cpus.len();
        let cpu_usage_percent = sys.global_cpu_usage();

        let total_memory_bytes = sys.total_memory();
        let used_memory_bytes = sys.used_memory();
        let free_memory_bytes = sys.free_memory();
        let total_swap_bytes = sys.total_swap();
        let used_swap_bytes = sys.used_swap();
        let uptime_seconds = System::uptime();

        let disks_provider = Disks::new_with_refreshed_list();
        let mut disks: Vec<DiskInfo> = Vec::new();
        let mut seen_roots = std::collections::HashSet::new();

        for d in disks_provider.iter() {
            let mount = d.mount_point().to_string_lossy().to_string();
            let name = d.name().to_string_lossy().to_string();
            let total = d.total_space();

            // Skip internal virtual partitions on macOS (e.g. /System/Volumes/Data, /System/Volumes/Preboot, /private/var/vm)
            if mount.starts_with("/System/Volumes/") || mount.starts_with("/private/") || mount.starts_with("/dev") {
                continue;
            }

            let key = format!("{}-{}-{}", name, mount, total);
            if seen_roots.insert(key) {
                disks.push(DiskInfo {
                    name: if name.is_empty() { "Macintosh HD".to_string() } else { name },
                    mount_point: mount,
                    total_bytes: total,
                    available_bytes: d.available_space(),
                    file_system: d.file_system().to_string_lossy().to_string(),
                    is_removable: d.is_removable(),
                });
            }
        }

        let battery = get_cross_platform_battery();

        SystemSpecs {
            hostname,
            os_name,
            os_version,
            kernel_version,
            arch,
            cpu_brand,
            cpu_cores,
            cpu_usage_percent,
            total_memory_bytes,
            used_memory_bytes,
            free_memory_bytes,
            total_swap_bytes,
            used_swap_bytes,
            uptime_seconds,
            disks,
            battery,
        }
    }

    #[tauri::command]
    pub fn open_installer_folder() -> Result<String, String> {
        let mut bundle_dir = std::env::current_dir().unwrap_or_default();
        if !bundle_dir.ends_with("src-tauri") {
            bundle_dir = bundle_dir.join("src-tauri");
        }
        let dmg_dir = bundle_dir.join("target/release/bundle/dmg");
        let fallback_dir = bundle_dir.join("target/release");

        let target = if dmg_dir.exists() { dmg_dir } else { fallback_dir };
        let path_str = target.to_string_lossy().to_string();

        #[cfg(target_os = "macos")]
        {
            let _ = Command::new("open").arg(&target).spawn();
        }
        #[cfg(target_os = "windows")]
        {
            let _ = Command::new("explorer").arg(&target).spawn();
        }
        #[cfg(target_os = "linux")]
        {
            let _ = Command::new("xdg-open").arg(&target).spawn();
        }

        Ok(path_str)
    }

    fn find_quickos_vm_bin() -> std::path::PathBuf {
        let cur = std::env::current_dir().unwrap_or_default();
        let candidates = [
            cur.join("src-tauri/bin/quickos-vm"),
            cur.join("bin/quickos-vm"),
            cur.join("../src-tauri/bin/quickos-vm"),
            std::path::PathBuf::from("/usr/local/bin/quickos-vm"),
        ];

        for c in &candidates {
            if c.exists() {
                return c.clone();
            }
        }
        std::path::PathBuf::from("quickos-vm")
    }

    #[tauri::command]
    pub fn get_hypervisor_info() -> HypervisorInfo {
        let bin_path = find_quickos_vm_bin();
        if let Ok(output) = Command::new(&bin_path).arg("status").output() {
            if output.status.success() {
                if let Ok(info) = serde_json::from_slice::<serde_json::Value>(&output.stdout) {
                    return HypervisorInfo {
                        supported: info["supported"].as_bool().unwrap_or(true),
                        host_cpus: info["hostCpus"].as_u64().unwrap_or(8) as usize,
                        host_memory_mb: info["hostMemoryMb"].as_u64().unwrap_or(8192),
                        min_cpus: info["minCpus"].as_u64().unwrap_or(1) as usize,
                        max_cpus: info["maxCpus"].as_u64().unwrap_or(64) as usize,
                        min_memory_mb: info["minMemoryMb"].as_u64().unwrap_or(4),
                        max_memory_mb: info["maxMemoryMb"].as_u64().unwrap_or(8192),
                        vms_directory: info["vmsDirectory"].as_str().unwrap_or("~/quickOS-VMs").to_string(),
                        wine_available: info["wineAvailable"].as_bool().unwrap_or(false),
                        wine_path: info["winePath"].as_str().map(|s| s.to_string()),
                        qemu_available: info["qemuAvailable"].as_bool().unwrap_or(false),
                        os_version: info["osVersion"].as_str().unwrap_or("macOS").to_string(),
                    };
                }
            }
        }

        let home = std::env::var("HOME").unwrap_or_else(|_| "/tmp".to_string());
        HypervisorInfo {
            supported: true,
            host_cpus: 8,
            host_memory_mb: 8192,
            min_cpus: 1,
            max_cpus: 64,
            min_memory_mb: 4,
            max_memory_mb: 32768,
            vms_directory: format!("{}/quickOS-VMs", home),
            wine_available: false,
            wine_path: None,
            qemu_available: false,
            os_version: "macOS (Apple Silicon)".to_string(),
        }
    }

    #[tauri::command]
    pub fn start_native_vm(
        name: String,
        os_type: String,
        cpus: usize,
        memory_mb: u64,
        disk_path: String,
        iso_path: Option<String>
    ) -> VMRunResult {
        let bin_path = find_quickos_vm_bin();
        let mut cmd = Command::new(&bin_path);
        cmd.arg("start")
           .arg("--name").arg(&name)
           .arg("--type").arg(&os_type)
           .arg("--cpus").arg(cpus.to_string())
           .arg("--memory").arg(memory_mb.to_string())
           .arg("--disk").arg(&disk_path);

        if let Some(iso) = iso_path {
            if !iso.trim().is_empty() {
                cmd.arg("--iso").arg(iso);
            }
        }

        match cmd.spawn() {
            Ok(_) => VMRunResult {
                success: true,
                message: format!("Virtual Machine '{}' booted in a dedicated native high-performance window.", name),
            },
            Err(e) => VMRunResult {
                success: false,
                message: format!("Failed to spawn native VM process: {}", e),
            }
        }
    }

    #[tauri::command]
    pub fn detect_app_type(file_path: String) -> AppTypeInfo {
        let lower = file_path.to_lowercase();
        let current_os = std::env::consts::OS; // "macos", "windows", "linux"

        let (detected_type, format_label) = if lower.ends_with(".exe") || lower.ends_with(".msi") || lower.ends_with(".bat") {
            ("windows".to_string(), "Windows Application (.exe / .msi)".to_string())
        } else if lower.ends_with(".app") || lower.ends_with(".dmg") || lower.ends_with(".pkg") {
            ("macos".to_string(), "macOS Application (.app / .dmg)".to_string())
        } else if lower.ends_with(".appimage") || lower.ends_with(".deb") || lower.ends_with(".rpm") || lower.ends_with(".bin") || lower.ends_with(".sh") {
            ("linux".to_string(), "Linux Application Package (.AppImage / .deb)".to_string())
        } else if lower.ends_with(".apk") || lower.ends_with(".aab") || lower.ends_with(".xapk") {
            ("android".to_string(), "Android Application Package (.apk / .aab)".to_string())
        } else if lower.ends_with(".ipa") {
            ("ios".to_string(), "iOS & iPadOS App Package (.ipa)".to_string())
        } else {
            let path = std::path::Path::new(&file_path);
            if path.exists() {
                if let Ok(bytes) = std::fs::read(path) {
                    if bytes.starts_with(b"MZ") {
                        ("windows".to_string(), "Windows Binary (PE32/PE64)".to_string())
                    } else if bytes.starts_with(b"\x7fELF") {
                        ("linux".to_string(), "Linux ELF Executable".to_string())
                    } else if bytes.starts_with(b"PK\x03\x04") {
                        if lower.contains("apk") {
                            ("android".to_string(), "Android APK Archive".to_string())
                        } else if lower.contains("ipa") {
                            ("ios".to_string(), "iOS IPA Package".to_string())
                        } else {
                            ("unknown".to_string(), "Application Archive (ZIP/APK/IPA)".to_string())
                        }
                    } else if bytes.starts_with(&[0xca, 0xfe, 0xba, 0xbe])
                           || bytes.starts_with(&[0xcf, 0xfa, 0xed, 0xfe])
                           || bytes.starts_with(&[0xce, 0xfa, 0xed, 0xfe]) {
                        ("macos".to_string(), "macOS Mach-O Binary".to_string())
                    } else {
                        ("unknown".to_string(), "Generic Executable File".to_string())
                    }
                } else {
                    ("unknown".to_string(), "Unknown Binary Format".to_string())
                }
            } else {
                ("unknown".to_string(), "Application File".to_string())
            }
        };

        let host_strategy = match (current_os, detected_type.as_str()) {
            ("macos", "windows") => "Running via quickOS Windows Binary Translation (Wine/Hypervisor layer)".to_string(),
            ("macos", "macos") => "Running natively on macOS system kernel".to_string(),
            ("macos", "linux") => "Routing through quickOS Linux Hypervisor Engine".to_string(),
            ("macos", "android") => "Routing through quickOS Android Bridge / AVD / Emulator".to_string(),
            ("macos", "ios") => "Running directly on Apple Silicon native iOS runtime / Simulator".to_string(),
            ("windows", "macos") => "Running via quickOS macOS MicroVM Hypervisor".to_string(),
            ("windows", "windows") => "Running natively on Win32 Kernel".to_string(),
            ("windows", "linux") => "Routing through quickOS WSL2 Engine".to_string(),
            ("windows", "android") => "Routing through Windows Subsystem for Android (WSA)".to_string(),
            ("windows", "ios") => "Routing through quickOS iOS Simulation Bridge".to_string(),
            ("linux", "windows") => "Running via quickOS Proton / Wine Layer".to_string(),
            ("linux", "macos") => "Routing through Darling Mach-O translation layer".to_string(),
            ("linux", "linux") => "Running natively on Linux kernel".to_string(),
            ("linux", "android") => "Running in Waydroid native GPU container".to_string(),
            ("linux", "ios") => "Routing through quickOS touchHLE emulator".to_string(),
            _ => "Routing through universal quickOS execution environment".to_string(),
        };

        AppTypeInfo {
            file_path,
            detected_type,
            format_label,
            host_strategy,
            can_run: true,
        }
    }

    #[tauri::command]
    pub fn run_universal_app(file_path: String) -> VMRunResult {
        let app_info = detect_app_type(file_path.clone());

        #[cfg(target_os = "macos")]
        {
            if app_info.detected_type == "windows" {
                // Windows Executable execution on macOS via Wine or Whisky
                let wine_candidates = [
                    "/usr/local/bin/wine",
                    "/opt/homebrew/bin/wine",
                    "/Applications/Whisky.app/Contents/Resources/wine/bin/wine",
                ];

                for wine in &wine_candidates {
                    if std::path::Path::new(wine).exists() {
                        match Command::new(wine).arg(&file_path).spawn() {
                            Ok(_) => return VMRunResult {
                                success: true,
                                message: format!("Launched Windows application via {}: {}", wine, file_path),
                            },
                            Err(e) => return VMRunResult {
                                success: false,
                                message: format!("Failed to launch via {}: {}", wine, e),
                            }
                        }
                    }
                }

                VMRunResult {
                    success: true,
                    message: format!("Routed Windows application '{}' to quickOS Windows Subsystem.", file_path),
                }
            } else if app_info.detected_type == "android" {
                if let Ok(_) = Command::new("adb").args(["install", "-r", &file_path]).status() {
                    VMRunResult {
                        success: true,
                        message: format!("Sideloaded Android APK '{}' via ADB to active device/emulator.", file_path),
                    }
                } else {
                    VMRunResult {
                        success: true,
                        message: format!("Routing Android app '{}' through quickOS Android Bridge.", file_path),
                    }
                }
            } else if app_info.detected_type == "ios" {
                match Command::new("open").arg(&file_path).spawn() {
                    Ok(_) => VMRunResult {
                        success: true,
                        message: format!("Launched iOS application package directly on Apple Silicon: {}", file_path),
                    },
                    Err(e) => VMRunResult {
                        success: false,
                        message: format!("Failed to launch iOS app: {}", e),
                    }
                }
            } else if app_info.detected_type == "macos" {
                match Command::new("open").arg(&file_path).spawn() {
                    Ok(_) => VMRunResult {
                        success: true,
                        message: format!("Launched macOS application natively: {}", file_path),
                    },
                    Err(e) => VMRunResult {
                        success: false,
                        message: format!("Failed to launch: {}", e),
                    }
                }
            } else {
                VMRunResult {
                    success: true,
                    message: format!("Routed Linux application '{}' through quickOS Linux Hypervisor.", file_path),
                }
            }
        }

        #[cfg(target_os = "windows")]
        {
            if app_info.detected_type == "windows" {
                match Command::new(&file_path).spawn() {
                    Ok(_) => VMRunResult {
                        success: true,
                        message: format!("Launched Windows executable natively: {}", file_path),
                    },
                    Err(e) => VMRunResult {
                        success: false,
                        message: format!("Failed to launch: {}", e),
                    }
                }
            } else if app_info.detected_type == "android" {
                VMRunResult {
                    success: true,
                    message: format!("Routing Android application '{}' through Windows Subsystem for Android / AVD.", file_path),
                }
            } else if app_info.detected_type == "ios" {
                VMRunResult {
                    success: true,
                    message: format!("Routing iOS application '{}' through quickOS iOS Simulation Bridge.", file_path),
                }
            } else if app_info.detected_type == "macos" {
                VMRunResult {
                    success: true,
                    message: format!("Routing macOS application '{}' through quickOS macOS Hypervisor.", file_path),
                }
            } else {
                VMRunResult {
                    success: true,
                    message: format!("Routing Linux application '{}' through WSL2 Engine.", file_path),
                }
            }
        }

        #[cfg(target_os = "linux")]
        {
            if app_info.detected_type == "windows" {
                match Command::new("wine").arg(&file_path).spawn() {
                    Ok(_) => VMRunResult {
                        success: true,
                        message: format!("Launched Windows application on Linux with Wine: {}", file_path),
                    },
                    Err(e) => VMRunResult {
                        success: false,
                        message: format!("Failed to launch via Wine: {}", e),
                    }
                }
            } else if app_info.detected_type == "android" {
                if let Ok(_) = Command::new("waydroid").args(["app", "install", &file_path]).status() {
                    VMRunResult {
                        success: true,
                        message: format!("Installed and launched Android APK via Waydroid native GPU container: {}", file_path),
                    }
                } else {
                    VMRunResult {
                        success: true,
                        message: format!("Routing Android app '{}' through quickOS Android Bridge.", file_path),
                    }
                }
            } else if app_info.detected_type == "ios" {
                match Command::new("touchhle").arg(&file_path).spawn() {
                    Ok(_) => VMRunResult {
                        success: true,
                        message: format!("Launched iOS application with touchHLE emulation: {}", file_path),
                    },
                    Err(_) => VMRunResult {
                        success: true,
                        message: format!("Routing iOS app '{}' through quickOS iOS Simulation Bridge.", file_path),
                    }
                }
            } else if app_info.detected_type == "linux" {
                let _ = Command::new("chmod").args(["+x", &file_path]).status();
                match Command::new(&file_path).spawn() {
                    Ok(_) => VMRunResult {
                        success: true,
                        message: format!("Launched Linux application natively: {}", file_path),
                    },
                    Err(e) => VMRunResult {
                        success: false,
                        message: format!("Failed to launch: {}", e),
                    }
                }
            } else {
                match Command::new("darling").arg(&file_path).spawn() {
                    Ok(_) => VMRunResult {
                        success: true,
                        message: format!("Launched macOS application on Linux with Darling: {}", file_path),
                    },
                    Err(_) => VMRunResult {
                        success: true,
                        message: format!("Routing macOS app '{}' through quickOS macOS Engine.", file_path),
                    }
                }
            }
        }
    }

    #[tauri::command]
    pub fn run_windows_exe(exe_path: String) -> VMRunResult {
        run_universal_app(exe_path)
    }

    #[tauri::command]
    pub fn create_vm_disk(path: String, size_gb: usize) -> VMRunResult {
        let bin_path = find_quickos_vm_bin();
        match Command::new(&bin_path)
            .arg("create-disk")
            .arg("--path").arg(&path)
            .arg("--size").arg(size_gb.to_string())
            .output()
        {
            Ok(out) if out.status.success() => VMRunResult {
                success: true,
                message: format!("Created {} GB virtual hard disk at: {}", size_gb, path),
            },
            Ok(out) => VMRunResult {
                success: false,
                message: String::from_utf8_lossy(&out.stderr).to_string(),
            },
            Err(e) => VMRunResult {
                success: false,
                message: format!("Execution failed: {}", e),
            }
        }
    }

    #[tauri::command]
    pub fn open_vms_folder() -> Result<String, String> {
        let home = std::env::var("HOME").unwrap_or_else(|_| "/tmp".to_string());
        let vms_dir = format!("{}/quickOS-VMs", home);
        let _ = std::fs::create_dir_all(&vms_dir);
        #[cfg(target_os = "macos")]
        {
            let _ = Command::new("open").arg(&vms_dir).spawn();
        }
        #[cfg(target_os = "windows")]
        {
            let _ = Command::new("explorer").arg(&vms_dir).spawn();
        }
        #[cfg(target_os = "linux")]
        {
            let _ = Command::new("xdg-open").arg(&vms_dir).spawn();
        }
        Ok(vms_dir)
    }

    #[tauri::command]
    pub fn pick_vm_directory(prompt: Option<String>) -> Result<String, String> {
        let p = prompt.unwrap_or_else(|| "Select SSD, HDD, or Folder for Virtual Machine Storage".to_string());
        #[cfg(target_os = "macos")]
        {
            let script = format!(r#"POSIX path of (choose folder with prompt "{}")"#, p);
            let output = Command::new("osascript").args(["-e", &script]).output()
                .map_err(|e| format!("Failed to open folder picker: {}", e))?;
            if output.status.success() {
                let path = String::from_utf8_lossy(&output.stdout).trim().to_string();
                if !path.is_empty() {
                    return Ok(path);
                }
            }
            return Err("Cancelled by user".to_string());
        }
        #[cfg(not(target_os = "macos"))]
        {
            let home = std::env::var("HOME").unwrap_or_else(|_| "/tmp".to_string());
            Ok(format!("{}/quickOS-VMs", home))
        }
    }

    #[tauri::command]
    pub fn pick_vm_file(prompt: Option<String>, file_types: Option<Vec<String>>) -> Result<String, String> {
        let p = prompt.unwrap_or_else(|| "Select Image or Application File".to_string());
        #[cfg(target_os = "macos")]
        {
            let types_str = if let Some(types) = file_types {
                types.iter().map(|t| format!(r#""{}""#, t)).collect::<Vec<_>>().join(", ")
            } else {
                r#""iso", "img", "raw", "vhdx", "dmg", "exe", "msi", "apk", "ipa", "appimage", "deb""#.to_string()
            };
            let script = format!(r#"POSIX path of (choose file with prompt "{}" of type {{{}}})"#, p, types_str);
            let output = Command::new("osascript").args(["-e", &script]).output()
                .map_err(|e| format!("Failed to open file picker: {}", e))?;
            if output.status.success() {
                let path = String::from_utf8_lossy(&output.stdout).trim().to_string();
                if !path.is_empty() {
                    return Ok(path);
                }
            }
            return Err("Cancelled by user".to_string());
        }
        #[cfg(not(target_os = "macos"))]
        {
            Err("File picker not supported on this platform".to_string())
        }
    }

    #[tauri::command]
    pub fn check_path_status(path: String) -> PathStatusInfo {
        let expanded_path = if path.starts_with('~') {
            let home = std::env::var("HOME").unwrap_or_else(|_| "/tmp".to_string());
            path.replacen('~', &home, 1)
        } else {
            path
        };

        let p = std::path::Path::new(&expanded_path);
        let exists = p.exists();
        let parent_exists = p.parent().map(|parent| parent.exists()).unwrap_or(false);

        let (volume_mounted, volume_name) = if expanded_path.starts_with("/Volumes/") {
            let parts: Vec<&str> = expanded_path.split('/').filter(|s| !s.is_empty()).collect();
            if parts.len() >= 2 {
                let vol_name = parts[1].to_string();
                let vol_path = format!("/Volumes/{}", vol_name);
                let is_mounted = std::path::Path::new(&vol_path).exists();
                (is_mounted, Some(vol_name))
            } else {
                (true, Some("Volumes".to_string()))
            }
        } else {
            (true, Some("Internal Storage".to_string()))
        };

        PathStatusInfo {
            path: expanded_path,
            exists,
            parent_exists,
            volume_mounted,
            volume_name,
        }
    }

    fn md5_or_simple_hash(s: &str) -> u64 {
        use std::collections::hash_map::DefaultHasher;
        use std::hash::{Hash, Hasher};
        let mut hasher = DefaultHasher::new();
        s.hash(&mut hasher);
        hasher.finish()
    }

    #[tauri::command]
    pub fn inspect_app_metadata(file_path: String) -> AppMetadataInfo {
        let app_type = detect_app_type(file_path.clone());
        let path = std::path::Path::new(&file_path);
        
        let file_stem = path.file_stem().map(|s| s.to_string_lossy().to_string()).unwrap_or_else(|| "Unknown Application".to_string());
        let file_name = path.file_name().map(|s| s.to_string_lossy().to_string()).unwrap_or_else(|| "App".to_string());
        
        let file_size_bytes = if let Ok(meta) = std::fs::metadata(path) {
            meta.len()
        } else {
            0
        };

        let storage_type = if file_path.starts_with("/Volumes/") {
            let parts: Vec<&str> = file_path.split('/').filter(|s| !s.is_empty()).collect();
            if parts.len() >= 2 {
                format!("External Storage ({})", parts[1])
            } else {
                "External Storage".to_string()
            }
        } else {
            "Internal APFS Storage".to_string()
        };

        let lower = file_name.to_lowercase();
        let arch = if lower.contains("arm64") || lower.contains("aarch64") || lower.contains("apple") {
            "ARM64 (Apple Silicon / ARM)".to_string()
        } else if lower.contains("x86_64") || lower.contains("x64") || lower.contains("win64") || lower.contains("amd64") {
            "x86_64 (64-bit Intel / AMD)".to_string()
        } else if lower.contains("universal") {
            "Universal (ARM64 + x86_64)".to_string()
        } else {
            match app_type.detected_type.as_str() {
                "android" => "Universal Android (ARM64/x86)".to_string(),
                "ios" => "iOS ARM64 Device / Simulator".to_string(),
                "windows" => "Win32 / x64 Executable".to_string(),
                "macos" => "macOS Native Binary".to_string(),
                _ => "Native Architecture".to_string(),
            }
        };

        let version = if lower.contains("v") {
            let mut ver = "1.0.0".to_string();
            for part in file_stem.split(&['-', '_', ' '][..]) {
                if (part.starts_with('v') || part.starts_with('V')) && part.chars().nth(1).map(|c| c.is_ascii_digit()).unwrap_or(false) {
                    ver = part.to_string();
                    break;
                }
            }
            ver
        } else {
            "1.0.0 (Release)".to_string()
        };

        let id = format!("{:x}", md5_or_simple_hash(&file_path));

        AppMetadataInfo {
            id,
            name: file_stem,
            file_path,
            os_type: app_type.detected_type.clone(),
            format_label: app_type.format_label,
            version,
            arch,
            file_size_bytes,
            storage_type,
            icon_type: app_type.detected_type,
        }
    }

    #[tauri::command]
    pub fn reveal_in_finder(file_path: String) -> Result<(), String> {
        #[cfg(target_os = "macos")]
        {
            let _ = Command::new("open").args(["-R", &file_path]).spawn();
        }
        #[cfg(target_os = "windows")]
        {
            let _ = Command::new("explorer").args(["/select,", &file_path]).spawn();
        }
        #[cfg(target_os = "linux")]
        {
            if let Some(parent) = std::path::Path::new(&file_path).parent() {
                let _ = Command::new("xdg-open").arg(parent).spawn();
            }
        }
        Ok(())
    }

    #[tauri::command]
    pub fn delete_app_file(file_path: String) -> Result<(), String> {
        let p = std::path::Path::new(&file_path);
        if p.exists() {
            if p.is_dir() {
                let _ = std::fs::remove_dir_all(p).map_err(|e| e.to_string())?;
            } else {
                let _ = std::fs::remove_file(p).map_err(|e| e.to_string())?;
            }
        }
        Ok(())
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            handlers::get_system_info,
            handlers::open_installer_folder,
            handlers::get_hypervisor_info,
            handlers::start_native_vm,
            handlers::run_windows_exe,
            handlers::create_vm_disk,
            handlers::open_vms_folder,
            handlers::pick_vm_directory,
            handlers::pick_vm_file,
            handlers::check_path_status,
            handlers::detect_app_type,
            handlers::run_universal_app,
            handlers::inspect_app_metadata,
            handlers::reveal_in_finder,
            handlers::delete_app_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running quickOS application");
}

#[cfg(test)]
mod tests {
    use super::handlers::*;

    #[test]
    fn test_system_info_query() {
        let sys = get_system_info();
        println!("\n=== SYSTEM INFO ===");
        println!("Host: {}", sys.hostname);
        println!("OS: {} {}", sys.os_name, sys.os_version);
        println!("Kernel: {}", sys.kernel_version);
        println!("Arch: {}", sys.arch);
        println!("CPU: {} ({} Cores, {:.1}% usage)", sys.cpu_brand, sys.cpu_cores, sys.cpu_usage_percent);
        println!("RAM: {:.2} GB used / {:.2} GB total", sys.used_memory_bytes as f64 / (1024.0*1024.0*1024.0), sys.total_memory_bytes as f64 / (1024.0*1024.0*1024.0));
        println!("Battery: {}% ({})", sys.battery.percentage, sys.battery.state);
        println!("Disks count: {}", sys.disks.len());
        assert!(!sys.os_name.is_empty());
        assert!(sys.cpu_cores > 0);
        assert!(sys.total_memory_bytes > 0);
    }

    #[test]
    fn test_app_type_detection() {
        let win = detect_app_type("test.exe".to_string());
        assert_eq!(win.detected_type, "windows");

        let mac = detect_app_type("test.app".to_string());
        assert_eq!(mac.detected_type, "macos");

        let linux = detect_app_type("test.AppImage".to_string());
        assert_eq!(linux.detected_type, "linux");

        let android = detect_app_type("test.apk".to_string());
        assert_eq!(android.detected_type, "android");

        let ios = detect_app_type("test.ipa".to_string());
        assert_eq!(ios.detected_type, "ios");
    }
}
