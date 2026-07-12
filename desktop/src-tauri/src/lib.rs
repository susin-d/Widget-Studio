mod commands;
mod startup;
mod tray;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_deep_link::init())
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
