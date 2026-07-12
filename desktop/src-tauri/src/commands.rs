use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::{fs, path::PathBuf};
use sysinfo::System;
use tauri::{AppHandle, Manager, PhysicalPosition, PhysicalSize, WebviewUrl, WebviewWindowBuilder};
use tauri_plugin_autostart::ManagerExt;

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

#[derive(Debug, Serialize, Deserialize)]
pub struct SystemInfo {
    cpu_usage: f32,
    ram_used: u64,
    ram_total: u64,
    battery_level: Option<u8>,
}

#[tauri::command]
pub fn save_layout(app: AppHandle, state: Value) -> Result<(), String> {
    let path = layout_path(&app)?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|error| error.to_string())?;
    }
    fs::write(path, serde_json::to_vec_pretty(&state).map_err(|error| error.to_string())?)
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub fn load_layout(app: AppHandle) -> Result<Option<Value>, String> {
    let path = layout_path(&app)?;
    if !path.exists() {
        return Ok(None);
    }
    let raw = fs::read_to_string(path).map_err(|error| error.to_string())?;
    serde_json::from_str(&raw).map(Some).map_err(|error| error.to_string())
}

#[tauri::command]
pub fn set_startup(app: AppHandle, enabled: bool) -> Result<(), String> {
    let manager = app.autolaunch();
    if enabled {
        manager.enable().map_err(|error| error.to_string())
    } else {
        manager.disable().map_err(|error| error.to_string())
    }
}

#[tauri::command]
pub fn get_system_info() -> Result<SystemInfo, String> {
    let mut system = System::new_all();
    system.refresh_all();
    let cpu_usage = system.global_cpu_usage();

    // Query battery on Windows
    let battery_level = if cfg!(target_os = "windows") {
        let mut cmd = std::process::Command::new("powershell");
        cmd.args(&["-Command", "(Get-CimInstance Win32_Battery).EstimatedChargeRemaining"]);
        #[cfg(target_os = "windows")]
        {
            cmd.creation_flags(0x08000000); // CREATE_NO_WINDOW
        }
        cmd.output()
            .ok()
            .and_then(|output| {
                let stdout = String::from_utf8_lossy(&output.stdout);
                stdout.trim().parse::<u8>().ok()
            })
    } else {
        None
    };

    Ok(SystemInfo {
        cpu_usage,
        ram_used: system.used_memory(),
        ram_total: system.total_memory(),
        battery_level,
    })
}

#[tauri::command]
pub fn show_window(app: AppHandle) -> Result<(), String> {
    let window = main_window(&app)?;
    let _ = window.unminimize();
    window.show().map_err(|error| error.to_string())?;
    let _ = window.set_always_on_top(true);
    window.set_focus().map_err(|error| error.to_string())?;

    let restore_window = window.clone();
    std::thread::spawn(move || {
        std::thread::sleep(std::time::Duration::from_millis(700));
        let _ = restore_window.set_always_on_top(false);
    });

    Ok(())
}

#[tauri::command]
pub fn hide_window(app: AppHandle) -> Result<(), String> {
    main_window(&app)?.hide().map_err(|error| error.to_string())
}

#[tauri::command]
pub fn set_always_on_top(app: AppHandle, enabled: bool) -> Result<(), String> {
    main_window(&app)?.set_always_on_top(enabled).map_err(|error| error.to_string())
}

#[tauri::command]
pub fn set_skip_taskbar(app: AppHandle, enabled: bool) -> Result<(), String> {
    main_window(&app)?.set_skip_taskbar(enabled).map_err(|error| error.to_string())
}

#[tauri::command]
pub fn set_desktop_mode(app: AppHandle, enabled: bool) -> Result<(), String> {
    let window = main_window(&app)?;
    window.set_always_on_top(false).map_err(|error| error.to_string())?;
    window.set_skip_taskbar(enabled).map_err(|error| error.to_string())?;
    window.set_decorations(!enabled).map_err(|error| error.to_string())?;
    window.set_shadow(!enabled).map_err(|error| error.to_string())?;

    if enabled {
        if let Some(monitor) = window.current_monitor().map_err(|error| error.to_string())? {
            let position = monitor.position();
            let size = monitor.size();
            window
                .set_position(PhysicalPosition::new(position.x, position.y))
                .map_err(|error| error.to_string())?;
            window
                .set_size(PhysicalSize::new(size.width, size.height))
                .map_err(|error| error.to_string())?;
        }
    }

    Ok(())
}

#[tauri::command]
pub async fn open_widget_window(
    app: AppHandle,
    id: String,
    x: f64,
    y: f64,
    width: f64,
    height: f64,
) -> Result<(), String> {
    let label = format!("widget-{}", id);
    if let Some(window) = app.get_webview_window(&label) {
        let _ = window.set_minimizable(false);
        window
            .set_position(PhysicalPosition::new(x as i32, y as i32))
            .map_err(|error| error.to_string())?;
        window
            .set_size(PhysicalSize::new(width.max(1.0) as u32, height.max(1.0) as u32))
            .map_err(|error| error.to_string())?;
        window.show().map_err(|error| error.to_string())?;
        window.set_focus().map_err(|error| error.to_string())?;
        return Ok(());
    }

    WebviewWindowBuilder::new(
        &app,
        &label,
        WebviewUrl::App(format!("index.html?widget={}", id).into()),
    )
    .title("Desktop Widget")
    .decorations(false)
    .transparent(true)
    .resizable(true)
    .minimizable(false)
    .always_on_top(false)
    .skip_taskbar(true)
    .shadow(false)
    .position(x, y)
    .inner_size(width.max(1.0), height.max(1.0))
    .build()
    .map(|window| {
        keep_widget_visible(window);
    })
    .map_err(|error| error.to_string())
}

#[tauri::command]
pub fn close_widget_window(app: AppHandle, id: String) -> Result<(), String> {
    if let Some(window) = app.get_webview_window(&format!("widget-{}", id)) {
        window.close().map_err(|error| error.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub fn set_window_size(app: AppHandle, width: f64, height: f64) -> Result<(), String> {
    main_window(&app)?
        .set_size(PhysicalSize::new(width.max(320.0) as u32, height.max(240.0) as u32))
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub fn set_window_position(app: AppHandle, x: f64, y: f64) -> Result<(), String> {
    main_window(&app)?
        .set_position(PhysicalPosition::new(x as i32, y as i32))
        .map_err(|error| error.to_string())
}

fn main_window(app: &AppHandle) -> Result<tauri::WebviewWindow, String> {
    app.get_webview_window("main").ok_or_else(|| "Main window not found".to_string())
}

fn layout_path(app: &AppHandle) -> Result<PathBuf, String> {
    app.path()
        .app_data_dir()
        .map(|path| path.join("layout.json"))
        .map_err(|error| error.to_string())
}

fn keep_widget_visible(window: tauri::WebviewWindow) {
    let _ = window.set_minimizable(false);

    std::thread::spawn(move || loop {
        std::thread::sleep(std::time::Duration::from_millis(180));

        let Ok(minimized) = window.is_minimized() else {
            break;
        };

        let Ok(visible) = window.is_visible() else {
            break;
        };

        if minimized || !visible {
            let _ = window.unminimize();
            let _ = window.show();
        }
    });
}
