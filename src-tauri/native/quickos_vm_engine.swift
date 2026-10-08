import Foundation
import Cocoa
import Virtualization

// quickOS Native Virtualization & Windows/Linux Runner
// Developed by Uchit Chakma (uchitchakma.com)
// Owner: UCDREAMS TECHNOLOGIES LLP (ucdreams.com)

struct HypervisorStatus: Codable {
    let supported: Bool
    let minCpus: Int
    let maxCpus: Int
    let hostCpus: Int
    let minMemoryMb: UInt64
    let maxMemoryMb: UInt64
    let hostMemoryMb: UInt64
    let vmsDirectory: String
    let wineAvailable: Bool
    let winePath: String?
    let qemuAvailable: Bool
    let osVersion: String
}

class VMAppDelegate: NSObject, NSApplicationDelegate, VZVirtualMachineDelegate {
    var window: NSWindow!
    var vmView: VZVirtualMachineView!
    var virtualMachine: VZVirtualMachine?
    var vmName: String = "quickOS Virtual Machine"

    func applicationDidFinishLaunching(_ notification: Notification) {
        NSApp.setActivationPolicy(.regular)
        NSApp.activate(ignoringOtherApps: true)
    }

    func guestDidStop(_ virtualMachine: VZVirtualMachine) {
        print("[quickOS-VM] Guest operating system powered off.")
        DispatchQueue.main.async {
            self.window.close()
            NSApp.terminate(nil)
        }
    }

    func virtualMachine(_ virtualMachine: VZVirtualMachine, didStopWithError error: Error) {
        print("[quickOS-VM] Virtual machine encountered error: \(error.localizedDescription)")
        DispatchQueue.main.async {
            let alert = NSAlert()
            alert.messageText = "Virtual Machine Error"
            alert.informativeText = error.localizedDescription
            alert.alertStyle = .critical
            alert.runModal()
            self.window.close()
            NSApp.terminate(nil)
        }
    }
}

func getHomeDirectory() -> URL {
    return FileManager.default.homeDirectoryForCurrentUser
}

func getVMsDirectory() -> URL {
    let vmsDir = getHomeDirectory().appendingPathComponent("quickOS-VMs")
    if !FileManager.default.fileExists(atPath: vmsDir.path) {
        try? FileManager.default.createDirectory(at: vmsDir, withIntermediateDirectories: true, attributes: nil)
    }
    return vmsDir
}

func checkWineAvailable() -> (Bool, String?) {
    let possiblePaths = [
        "/opt/homebrew/bin/wine",
        "/usr/local/bin/wine",
        "/Applications/Whisky.app/Contents/Resources/wine/bin/wine",
        "/Applications/CrossOver.app/Contents/SharedSupport/CrossOver/bin/wine"
    ]
    for path in possiblePaths {
        if FileManager.default.fileExists(atPath: path) {
            return (true, path)
        }
    }
    return (false, nil)
}

func checkQemuAvailable() -> Bool {
    return FileManager.default.fileExists(atPath: "/opt/homebrew/bin/qemu-system-aarch64") ||
           FileManager.default.fileExists(atPath: "/usr/local/bin/qemu-system-aarch64")
}

func cmdStatus() {
    let supported = VZVirtualMachine.isSupported
    let hostCpus = ProcessInfo.processInfo.processorCount
    let hostMemMb = ProcessInfo.processInfo.physicalMemory / (1024 * 1024)
    let minCpus = VZVirtualMachineConfiguration.minimumAllowedCPUCount
    let maxCpus = VZVirtualMachineConfiguration.maximumAllowedCPUCount
    let minMem = VZVirtualMachineConfiguration.minimumAllowedMemorySize / (1024 * 1024)
    let maxMem = VZVirtualMachineConfiguration.maximumAllowedMemorySize / (1024 * 1024)
    let (wineAvail, winePath) = checkWineAvailable()
    let qemuAvail = checkQemuAvailable()
    let osVer = ProcessInfo.processInfo.operatingSystemVersionString

    let status = HypervisorStatus(
        supported: supported,
        minCpus: minCpus,
        maxCpus: maxCpus,
        hostCpus: hostCpus,
        minMemoryMb: minMem,
        maxMemoryMb: maxMem,
        hostMemoryMb: hostMemMb,
        vmsDirectory: getVMsDirectory().path,
        wineAvailable: wineAvail,
        winePath: winePath,
        qemuAvailable: qemuAvail,
        osVersion: osVer
    )

    let encoder = JSONEncoder()
    encoder.outputFormatting = .prettyPrinted
    if let data = try? encoder.encode(status), let jsonStr = String(data: data, encoding: .utf8) {
        print(jsonStr)
    }
}

func createSparseDisk(path: String, sizeGb: Int) -> Bool {
    let fileURL = URL(fileURLWithPath: path)
    let parentDir = fileURL.deletingLastPathComponent()
    try? FileManager.default.createDirectory(at: parentDir, withIntermediateDirectories: true, attributes: nil)

    let sizeBytes = Int64(sizeGb) * 1024 * 1024 * 1024
    if !FileManager.default.createFile(atPath: path, contents: nil, attributes: nil) {
        print("[quickOS-VM] Failed to create file at: \(path)")
        return false
    }

    guard let fileHandle = try? FileHandle(forWritingTo: fileURL) else {
        print("[quickOS-VM] Failed to open file handle for: \(path)")
        return false
    }

    do {
        try fileHandle.truncate(atOffset: UInt64(sizeBytes))
        try fileHandle.close()
        print("[quickOS-VM] Successfully created \(sizeGb) GB sparse virtual disk at: \(path)")
        return true
    } catch {
        print("[quickOS-VM] Error truncating file: \(error.localizedDescription)")
        return false
    }
}

func startNativeVM(name: String, osType: String, cpus: Int, memoryMb: UInt64, diskPath: String, isoPath: String?) {
    guard VZVirtualMachine.isSupported else {
        print("[quickOS-VM] Error: Apple Virtualization.framework is not supported on this Mac hardware.")
        exit(1)
    }

    let config = VZVirtualMachineConfiguration()

    // 1. CPU & Memory
    let safeCpus = max(VZVirtualMachineConfiguration.minimumAllowedCPUCount, min(cpus, VZVirtualMachineConfiguration.maximumAllowedCPUCount))
    config.cpuCount = safeCpus
    let safeMemBytes = max(VZVirtualMachineConfiguration.minimumAllowedMemorySize, min(memoryMb * 1024 * 1024, VZVirtualMachineConfiguration.maximumAllowedMemorySize))
    config.memorySize = safeMemBytes

    // 2. Platform & Bootloader
    let efiBootLoader = VZEFIBootLoader()
    let vmDir = URL(fileURLWithPath: diskPath).deletingLastPathComponent()
    let nvramURL = vmDir.appendingPathComponent("nvram.bin")

    if !FileManager.default.fileExists(atPath: nvramURL.path) {
        if let varStore = try? VZEFIVariableStore(creatingVariableStoreAt: nvramURL) {
            efiBootLoader.variableStore = varStore
        }
    } else {
        efiBootLoader.variableStore = VZEFIVariableStore(url: nvramURL)
    }

    config.bootLoader = efiBootLoader
    config.platform = VZGenericPlatformConfiguration()

    // 3. Storage Devices
    var storageDevices: [VZStorageDeviceConfiguration] = []

    // Primary Virtual NVMe Hard Disk
    let diskURL = URL(fileURLWithPath: diskPath)
    if !FileManager.default.fileExists(atPath: diskPath) {
        print("[quickOS-VM] Disk file does not exist. Creating 32 GB sparse disk at: \(diskPath)")
        _ = createSparseDisk(path: diskPath, sizeGb: 32)
    }

    if let diskAttachment = try? VZDiskImageStorageDeviceAttachment(url: diskURL, readOnly: false) {
        let blockDevice = VZVirtioBlockDeviceConfiguration(attachment: diskAttachment)
        storageDevices.append(blockDevice)
    }

    // Optional CD-ROM / Installer ISO
    if let iso = isoPath, !iso.isEmpty, FileManager.default.fileExists(atPath: iso) {
        let isoURL = URL(fileURLWithPath: iso)
        if let isoAttachment = try? VZDiskImageStorageDeviceAttachment(url: isoURL, readOnly: true) {
            let cdrom = VZVirtioBlockDeviceConfiguration(attachment: isoAttachment)
            storageDevices.append(cdrom)
            print("[quickOS-VM] Attached installation media ISO: \(iso)")
        }
    }

    config.storageDevices = storageDevices

    // 4. Network Device (NAT with Internet access)
    let networkDevice = VZVirtioNetworkDeviceConfiguration()
    networkDevice.attachment = VZNATNetworkDeviceAttachment()
    config.networkDevices = [networkDevice]

    // 5. High-Performance Hardware-Accelerated Graphics Display
    let graphicsDevice = VZVirtioGraphicsDeviceConfiguration()
    let scanout = VZVirtioGraphicsScanoutConfiguration(widthInPixels: 1920, heightInPixels: 1080)
    graphicsDevice.scanouts = [scanout]
    config.graphicsDevices = [graphicsDevice]

    // 6. Keyboard & Mouse Input
    config.keyboards = [VZUSBKeyboardConfiguration()]
    config.pointingDevices = [VZUSBScreenCoordinatePointingDeviceConfiguration()]

    // 7. Audio Output & Input
    let soundDevice = VZVirtioSoundDeviceConfiguration()
    let soundOutput = VZVirtioSoundDeviceOutputStreamConfiguration()
    soundOutput.sink = VZHostAudioOutputStreamSink()
    soundDevice.streams = [soundOutput]
    config.audioDevices = [soundDevice]

    // Validate configuration
    do {
        try config.validate()
        print("[quickOS-VM] Configuration validated successfully.")
    } catch {
        print("[quickOS-VM] Configuration validation failed: \(error.localizedDescription)")
        exit(1)
    }

    // Initialize Virtual Machine
    let vm = VZVirtualMachine(configuration: config)

    let app = NSApplication.shared
    let delegate = VMAppDelegate()
    app.delegate = delegate
    delegate.virtualMachine = vm
    delegate.vmName = name
    vm.delegate = delegate

    // Setup Native Display Window
    let windowRect = NSRect(x: 100, y: 100, width: 1280, height: 720)
    let window = NSWindow(
        contentRect: windowRect,
        styleMask: [.titled, .closable, .miniaturizable, .resizable],
        backing: .buffered,
        defer: false
    )
    window.title = "quickOS — \(name) (Live Native VM)"
    window.center()
    window.minSize = NSSize(width: 800, height: 500)

    let vmView = VZVirtualMachineView(frame: window.contentView!.bounds)
    vmView.autoresizingMask = [.width, .height]
    vmView.virtualMachine = vm
    vmView.capturesSystemKeys = true

    window.contentView?.addSubview(vmView)
    window.makeKeyAndOrderFront(nil)
    delegate.window = window
    delegate.vmView = vmView

    print("[quickOS-VM] Starting virtual machine: \(name)...")
    vm.start { result in
        switch result {
        case .success:
            print("[quickOS-VM] Virtual machine booted successfully!")
        case .failure(let error):
            print("[quickOS-VM] Failed to start virtual machine: \(error.localizedDescription)")
            DispatchQueue.main.async {
                let alert = NSAlert()
                alert.messageText = "Failed to Boot VM"
                alert.informativeText = error.localizedDescription
                alert.alertStyle = .critical
                alert.runModal()
                window.close()
                NSApp.terminate(nil)
            }
        }
    }

    app.run()
}

// CLI Argument Parser
let args = CommandLine.arguments

if args.count < 2 {
    print("""
    quickOS Native Virtualization Engine v1.0
    Usage:
      quickos-vm status
      quickos-vm create-disk --path <path> --size <gb>
      quickos-vm start --name <name> --type <windows|linux> --cpus <count> --memory <mb> --disk <path> [--iso <iso_path>]
      quickos-vm run-exe --path <exe_path>
    """)
    exit(0)
}

let command = args[1]

switch command {
case "status":
    cmdStatus()

case "create-disk":
    var path = getVMsDirectory().appendingPathComponent("disk.img").path
    var sizeGb = 32
    var i = 2
    while i < args.count {
        if args[i] == "--path" && i + 1 < args.count {
            path = args[i + 1]
            i += 2
        } else if args[i] == "--size" && i + 1 < args.count {
            sizeGb = Int(args[i + 1]) ?? 32
            i += 2
        } else {
            i += 1
        }
    }
    let success = createSparseDisk(path: path, sizeGb: sizeGb)
    exit(success ? 0 : 1)

case "start":
    var name = "Windows 11 Native VM"
    var osType = "windows"
    var cpus = 4
    var memoryMb: UInt64 = 4096
    var diskPath = getVMsDirectory().appendingPathComponent("windows11/disk.img").path
    var isoPath: String? = nil

    var i = 2
    while i < args.count {
        if args[i] == "--name" && i + 1 < args.count {
            name = args[i + 1]
            i += 2
        } else if args[i] == "--type" && i + 1 < args.count {
            osType = args[i + 1]
            i += 2
        } else if args[i] == "--cpus" && i + 1 < args.count {
            cpus = Int(args[i + 1]) ?? 4
            i += 2
        } else if args[i] == "--memory" && i + 1 < args.count {
            memoryMb = UInt64(args[i + 1]) ?? 4096
            i += 2
        } else if args[i] == "--disk" && i + 1 < args.count {
            diskPath = args[i + 1]
            i += 2
        } else if args[i] == "--iso" && i + 1 < args.count {
            isoPath = args[i + 1]
            i += 2
        } else {
            i += 1
        }
    }

    startNativeVM(name: name, osType: osType, cpus: cpus, memoryMb: memoryMb, diskPath: diskPath, isoPath: isoPath)

case "run-exe":
    if args.count < 3 {
        print("[quickOS-VM] Error: Missing .exe file path")
        exit(1)
    }
    let exePath = args[2]
    let (wineAvail, winePath) = checkWineAvailable()

    if wineAvail, let path = winePath {
        print("[quickOS-VM] Launching Windows application with Wine: \(exePath)")
        let proc = Process()
        proc.executableURL = URL(fileURLWithPath: path)
        proc.arguments = [exePath]
        try? proc.run()
        proc.waitUntilExit()
    } else {
        print("[quickOS-VM] Wine compatibility layer not found. Opening with macOS default handler.")
        let proc = Process()
        proc.executableURL = URL(fileURLWithPath: "/usr/bin/open")
        proc.arguments = [exePath]
        try? proc.run()
    }

default:
    print("[quickOS-VM] Unknown command: \(command)")
    exit(1)
}
