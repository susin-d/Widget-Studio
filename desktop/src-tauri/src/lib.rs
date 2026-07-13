mod commands;
mod startup;
mod tray;

use tauri::{Emitter, Manager};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // This must be registered first so a second launch exits before any
        // other plugin can initialize another copy of the application.
        .plugin(tauri_plugin_single_instance::init(|app, args, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.unminimize();
                let _ = window.set_focus();

                let deep_links: Vec<String> = args
                    .into_iter()
                    .filter(|argument| argument.starts_with("widgetapp://"))
                    .collect();
                if !deep_links.is_empty() {
                    let _ = window.emit("single-instance-deep-links", deep_links);
                }
            }
        }))
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(startup::plugin())
        .invoke_handler(tauri::generate_handler![
            commands::save_layout,
            commands::load_layout,
            commands::set_startup,
            commands::get_system_info,
            commands::show_window,
            commands::hide_window,
            commands::set_always_on_top,
            commands::set_skip_taskbar,
            commands::set_desktop_mode,
            commands::open_widget_window,
            commands::close_widget_window,
            commands::set_window_size,
            commands::set_window_position
        ])
        .setup(|app| {
            tray::build_tray(app)?;
            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                if window.label() == "main" {
                    let _ = window.hide();
                    api.prevent_close();
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running desktop widgets");
}
