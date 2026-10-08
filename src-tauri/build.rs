use std::process::Command;

fn main() {
    #[cfg(target_os = "macos")]
    {
        let manifest_dir = std::env::var("CARGO_MANIFEST_DIR").unwrap_or_default();
        let swift_src = format!("{}/native/quickos_vm_engine.swift", manifest_dir);
        let out_bin = format!("{}/bin/quickos-vm", manifest_dir);
        let _ = std::fs::create_dir_all(format!("{}/bin", manifest_dir));

        if std::path::Path::new(&swift_src).exists() {
            println!("cargo:rerun-if-changed={}", swift_src);
            let status = Command::new("swiftc")
                .args(&[
                    "-O",
                    &swift_src,
                    "-o",
                    &out_bin,
                    "-framework",
                    "Virtualization",
                    "-framework",
                    "Cocoa",
                ])
                .status();
            if let Ok(st) = status {
                if st.success() {
                    println!("cargo:warning=Compiled native Apple Virtualization helper: {}", out_bin);
                }
            }
        }
    }

    tauri_build::build();
}
