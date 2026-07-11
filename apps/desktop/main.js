const { app, BrowserWindow, shell, Menu } = require("electron");
const path = require("path");

const APP_URL = "https://yogapratishthan.vercel.app";

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 960,
    minHeight: 640,
    title: "Yogapratishthan",
    icon: path.join(__dirname, "..", "..", "assets", "icon", "icon-1024.png"),
    backgroundColor: "#FFFFFF",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadURL(APP_URL);

  // wa.me and other external links should open in the system browser,
  // not inside the app window.
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  win.webContents.on("did-fail-load", () => {
    setTimeout(() => win.loadURL(APP_URL), 2000);
  });

  return win;
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
