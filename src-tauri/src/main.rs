// StudentOS 桌面殼：WebView2 獨立視窗，不受 Edge 瀏覽器視窗路由影響
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
