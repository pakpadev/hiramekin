use tauri::{
    menu::{CheckMenuItem, Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager, WebviewUrl, WebviewWindowBuilder,
};
use tauri_plugin_autostart::{MacosLauncher, ManagerExt as AutostartExt};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            Some(vec![]),
        ))
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            show_overlay,
            hide_overlay,
            memo_submitted
        ])
        .setup(|app| {
            setup_tray(app)?;
            setup_shortcuts(app)?;
            setup_overlay(app)?;
            Ok(())
        })
        .on_window_event(|window, event| {
            if window.label() == "main" {
                if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                    api.prevent_close();
                    let _ = window.hide();
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn show_overlay(app: tauri::AppHandle) {
    if let Some(overlay) = app.get_webview_window("overlay") {
        let _ = overlay.show();
        let _ = overlay.set_focus();
    }
}

#[tauri::command]
fn hide_overlay(app: tauri::AppHandle) {
    if let Some(overlay) = app.get_webview_window("overlay") {
        let _ = overlay.hide();
    }
}

#[tauri::command]
fn memo_submitted(app: tauri::AppHandle) {
    if let Some(overlay) = app.get_webview_window("overlay") {
        let _ = overlay.hide();
    }
}

fn setup_tray(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let show_main = MenuItem::with_id(app, "show_main", "Hiramekinを開く", true, None::<&str>)?;
    let toggle_overlay = MenuItem::with_id(
        app,
        "toggle_overlay",
        "オーバーレイを表示/非表示",
        true,
        None::<&str>,
    )?;
    let autostart_enabled = app.autolaunch().is_enabled().unwrap_or(false);
    let autostart = CheckMenuItem::with_id(
        app,
        "toggle_autostart",
        "ログイン時に自動起動",
        true,
        autostart_enabled,
        None::<&str>,
    )?;
    let sep1 = PredefinedMenuItem::separator(app)?;
    let sep2 = PredefinedMenuItem::separator(app)?;
    let quit = MenuItem::with_id(app, "quit", "終了", true, None::<&str>)?;

    let menu = Menu::with_items(
        app,
        &[&show_main, &toggle_overlay, &sep1, &autostart, &sep2, &quit],
    )?;
    let autostart_item = autostart.clone();

    TrayIconBuilder::new()
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&menu)
        .on_menu_event(move |app, event| match event.id.as_ref() {
            "show_main" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
            "toggle_overlay" => toggle_overlay_window(app),
            "toggle_autostart" => {
                let manager = app.autolaunch();
                let next_enabled = !manager.is_enabled().unwrap_or(false);
                let result = if next_enabled {
                    manager.enable()
                } else {
                    manager.disable()
                };

                if result.is_ok() {
                    let _ = autostart_item.set_checked(next_enabled);
                }
            }
            "quit" => app.exit(0),
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                let app = tray.app_handle();
                if let Some(window) = app.get_webview_window("main") {
                    if window.is_visible().unwrap_or(false) {
                        let _ = window.hide();
                    } else {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
            }
        })
        .build(app)?;

    Ok(())
}

fn setup_shortcuts(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let shortcut_main = Shortcut::new(Some(shortcut_modifiers()), Code::KeyH);
    let shortcut_overlay = Shortcut::new(Some(shortcut_modifiers()), Code::KeyO);
    let app_handle = app.handle().clone();

    app.global_shortcut().on_shortcuts(
        [shortcut_main, shortcut_overlay],
        move |_app, shortcut, event| {
            if event.state != ShortcutState::Pressed {
                return;
            }

            match shortcut.key {
                Code::KeyH => {
                    if let Some(window) = app_handle.get_webview_window("main") {
                        if window.is_visible().unwrap_or(false) {
                            let _ = window.hide();
                        } else {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                }
                Code::KeyO => toggle_overlay_window(&app_handle),
                _ => {}
            }
        },
    )?;

    Ok(())
}

#[cfg(target_os = "macos")]
fn shortcut_modifiers() -> Modifiers {
    Modifiers::SUPER | Modifiers::SHIFT
}

#[cfg(not(target_os = "macos"))]
fn shortcut_modifiers() -> Modifiers {
    Modifiers::CONTROL | Modifiers::SHIFT
}

fn setup_overlay(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let main_window = app.get_webview_window("main").ok_or("main window not found")?;
    let monitor = main_window.current_monitor()?.ok_or("monitor not found")?;
    let monitor_size = monitor.size();
    let scale = monitor.scale_factor();

    let overlay_width = 320.0;
    let overlay_height = 200.0;
    let x = (monitor_size.width as f64 / scale) - overlay_width - 20.0;
    let y = (monitor_size.height as f64 / scale) - overlay_height - 60.0;

    let mut builder =
        WebviewWindowBuilder::new(app, "overlay", WebviewUrl::App("index.html?mode=overlay".into()))
        .title("")
        .inner_size(overlay_width, overlay_height)
        .position(x, y)
        .always_on_top(true)
        .decorations(false)
        .skip_taskbar(true)
        .visible(false)
        .resizable(true);

    #[cfg(not(target_os = "macos"))]
    {
        builder = builder.transparent(true);
    }

    builder.build()?;

    Ok(())
}

fn toggle_overlay_window<R: tauri::Runtime>(app: &tauri::AppHandle<R>) {
    if let Some(overlay) = app.get_webview_window("overlay") {
        if overlay.is_visible().unwrap_or(false) {
            let _ = overlay.hide();
        } else {
            let _ = overlay.show();
            let _ = overlay.set_focus();
        }
    }
}
