const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");

let mainWindow;

function getDataFilePath() {
  const userDataPath = app.getPath("userData");
  return path.join(userDataPath, "tasks.json");
}

function loadDataFromDisk() {
  try {
    const filePath = getDataFilePath();
    if (!fs.existsSync(filePath)) {
      return { projects: [] };
    }
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
  } catch (e) {
    return { projects: [] };
  }
}

function saveDataToDisk(data) {
  const filePath = getDataFilePath();
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 700,
    minWidth: 900,
    minHeight: 600,
    title: "Local Task Tracker",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, "renderer", "index.html"));

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  ipcMain.handle("tasks:load", () => {
    return loadDataFromDisk();
  });

  ipcMain.handle("tasks:save", (_event, data) => {
    saveDataToDisk(data);
    return { ok: true };
  });

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

