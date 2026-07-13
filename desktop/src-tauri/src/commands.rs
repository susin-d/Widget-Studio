use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::{
    fs,
    path::PathBuf,
    sync::Mutex,
    time::{Duration, Instant},
};
use sysinfo::System;
use tauri::{
    AppHandle, Manager, PhysicalPosition, PhysicalSize, State, WebviewUrl, WebviewWindowBuilder,
};
use tauri_plugin_autostart::ManagerExt;

const SYSTEM_INFO_CACHE_TTL: Duration = Duration::from_secs(5);

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct SystemInfo {
    cpu_usage: f32,
    ram_used: u64,
    ram_total: u64,
    battery_level: Option<u8>,
}

pub struct TelemetryState {
    cache: Mutex<TelemetryCache>,
}

struct TelemetryCache {
    system: System,
    cached: Option<(Instant, SystemInfo)>,
}

impl TelemetryState {
    pub fn new() -> Self {
        Self {
            cache: Mutex::new(TelemetryCache {
                system: System::new(),
                cached: None,
            }),
        }
    }

    fn snapshot(&self) -> Result<SystemInfo, String> {
        Ok(self
            .cache
            .lock()
            .map_err(|_| "System telemetry cache is unavailable".to_string())?
            .snapshot_at(Instant::now(), battery_level))
    }
}

impl TelemetryCache {
    fn snapshot_at<F>(&mut self, now: Instant, read_battery: F) -> SystemInfo
    where
        F: FnOnce() -> Option<u8>,
    {
        if let Some((sampled_at, info)) = &self.cached {
            if now.saturating_duration_since(*sampled_at) < SYSTEM_INFO_CACHE_TTL {
                return info.clone();
            }
        }

        self.system.refresh_cpu_usage();
        self.system.refresh_memory();
        let info = SystemInfo {
            cpu_usage: self.system.global_cpu_usage(),
            ram_used: self.system.used_memory(),
            ram_total: self.system.total_memory(),
            battery_level: read_battery(),
        };
        self.cached = Some((now, info.clone()));
        info
    }
}

#[tauri::command]
pub fn save_layout(app: AppHandle, state: Value) -> Result<(), String> {
    let path = layout_path(&app)?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|error| error.to_string())?;
    }
    fs::write(
        path,
        serde_json::to_vec_pretty(&state).map_err(|error| error.to_string())?,
    )
    .map_err(|error| error.to_string())
}

#[tauri::command]
pub fn load_layout(app: AppHandle) -> Result<Option<Value>, String> {
    let path = layout_path(&app)?;
    if !path.exists() {
        return Ok(None);
    }
    let raw = fs::read_to_string(path).map_err(|error| error.to_string())?;
    serde_json::from_str(&raw)
        .map(Some)
        .map_err(|error| error.to_string())
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
pub fn get_system_info(state: State<'_, TelemetryState>) -> Result<SystemInfo, String> {
    state.snapshot()
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
    main_window(&app)?
        .set_always_on_top(enabled)
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub fn set_skip_taskbar(app: AppHandle, enabled: bool) -> Result<(), String> {
    main_window(&app)?
        .set_skip_taskbar(enabled)
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub fn set_desktop_mode(app: AppHandle, enabled: bool) -> Result<(), String> {
    let window = main_window(&app)?;
    window
        .set_always_on_top(false)
        .map_err(|error| error.to_string())?;
    window
        .set_skip_taskbar(enabled)
        .map_err(|error| error.to_string())?;
    window
        .set_decorations(!enabled)
        .map_err(|error| error.to_string())?;
    window
        .set_shadow(!enabled)
        .map_err(|error| error.to_string())?;

    if enabled {
        if let Some(monitor) = window
            .current_monitor()
            .map_err(|error| error.to_string())?
        {
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
            .set_size(PhysicalSize::new(
                width.max(1.0) as u32,
                height.max(1.0) as u32,
            ))
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
        let _ = window.set_minimizable(false);
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
        .set_size(PhysicalSize::new(
            width.max(320.0) as u32,
            height.max(240.0) as u32,
        ))
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub fn set_window_position(app: AppHandle, x: f64, y: f64) -> Result<(), String> {
    main_window(&app)?
        .set_position(PhysicalPosition::new(x as i32, y as i32))
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub fn copy_to_clipboard(text: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        use std::ptr::copy_nonoverlapping;
        use windows_sys::Win32::System::DataExchange::{CloseClipboard, EmptyClipboard, OpenClipboard, SetClipboardData};
        use windows_sys::Win32::System::Memory::{GlobalAlloc, GlobalLock, GlobalUnlock, GMEM_MOVEABLE};
        const CF_UNICODETEXT: u32 = 13;
        let utf16: Vec<u16> = text.encode_utf16().chain(std::iter::once(0)).collect();
        unsafe {
            if OpenClipboard(0) == 0 { return Err("Windows clipboard is unavailable".into()); }
            EmptyClipboard();
            let bytes = utf16.len() * std::mem::size_of::<u16>();
            let handle = GlobalAlloc(GMEM_MOVEABLE, bytes);
            if handle.is_null() { CloseClipboard(); return Err("Could not allocate clipboard memory".into()); }
            let target = GlobalLock(handle) as *mut u16;
            if target.is_null() { CloseClipboard(); return Err("Could not lock clipboard memory".into()); }
            copy_nonoverlapping(utf16.as_ptr(), target, utf16.len());
            GlobalUnlock(handle);
            if SetClipboardData(CF_UNICODETEXT, handle).is_null() { CloseClipboard(); return Err("Could not set Windows clipboard data".into()); }
            CloseClipboard();
            Ok(())
        }
    }
    #[cfg(not(target_os = "windows"))]
    { let _ = text; Err("Native clipboard is only implemented for Windows".into()) }
}

fn main_window(app: &AppHandle) -> Result<tauri::WebviewWindow, String> {
    app.get_webview_window("main")
        .ok_or_else(|| "Main window not found".to_string())
}

fn layout_path(app: &AppHandle) -> Result<PathBuf, String> {
    app.path()
        .app_data_dir()
        .map(|path| path.join("layout.json"))
        .map_err(|error| error.to_string())
}

pub fn start_widget_visibility_monitor(app: AppHandle) {
    std::thread::spawn(move || loop {
        std::thread::sleep(Duration::from_secs(1));

        for (label, window) in app.webview_windows() {
            if !label.starts_with("widget-") {
                continue;
            }

            let minimized = window.is_minimized().unwrap_or(false);
            let visible = window.is_visible().unwrap_or(true);
            if minimized || !visible {
                let _ = window.unminimize();
                let _ = window.show();
            }
        }
    });
}

fn normalize_battery_level(battery_flag: u8, battery_percent: u8) -> Option<u8> {
    const NO_SYSTEM_BATTERY: u8 = 0x80;
    const UNKNOWN_PERCENT: u8 = u8::MAX;

    if battery_flag & NO_SYSTEM_BATTERY != 0 || battery_percent == UNKNOWN_PERCENT {
        None
    } else {
        Some(battery_percent.min(100))
    }
}

#[cfg(target_os = "windows")]
fn battery_level() -> Option<u8> {
    use std::mem::MaybeUninit;
    use windows_sys::Win32::System::Power::{GetSystemPowerStatus, SYSTEM_POWER_STATUS};

    let mut status = MaybeUninit::<SYSTEM_POWER_STATUS>::zeroed();
    if unsafe { GetSystemPowerStatus(status.as_mut_ptr()) } == 0 {
        return None;
    }

    let status = unsafe { status.assume_init() };
    normalize_battery_level(status.BatteryFlag, status.BatteryLifePercent)
}

#[cfg(not(target_os = "windows"))]
fn battery_level() -> Option<u8> {
    None
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::atomic::{AtomicUsize, Ordering};

    #[test]
    fn normalizes_battery_status() {
        assert_eq!(normalize_battery_level(0, 72), Some(72));
        assert_eq!(normalize_battery_level(0, 140), Some(100));
        assert_eq!(normalize_battery_level(0x80, 72), None);
        assert_eq!(normalize_battery_level(0, u8::MAX), None);
    }

    #[test]
    fn reuses_fresh_telemetry_snapshot() {
        let reads = AtomicUsize::new(0);
        let now = Instant::now();
        let mut cache = TelemetryCache {
            system: System::new(),
            cached: None,
        };

        let first = cache.snapshot_at(now, || {
            reads.fetch_add(1, Ordering::SeqCst);
            Some(64)
        });
        let second = cache.snapshot_at(now + Duration::from_secs(1), || {
            reads.fetch_add(1, Ordering::SeqCst);
            Some(10)
        });

        assert_eq!(first, second);
        assert_eq!(reads.load(Ordering::SeqCst), 1);
    }
}
