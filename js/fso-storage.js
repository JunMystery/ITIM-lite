/* ==========================================================================
   ITIM-lite - Native Windows FileSystemObject & ADODB.Stream Storage Adapter
   Supports Local Drives (C:\...) and Network / SMB Shares (\\server\share or Z:\)
   ========================================================================== */

var FsoStorage = (function () {
  var isHta = false;
  var fso = null;

  try {
    if ((typeof window !== "undefined" && "ActiveXObject" in window) || typeof ActiveXObject !== "undefined") {
      fso = new ActiveXObject("Scripting.FileSystemObject");
      isHta = !!fso;
    }
  } catch (e) {
    isHta = false;
    fso = null;
  }

  function getBaseDir() {
    if (!isHta || !fso) return ".";
    try {
      var loc = window.location.pathname;
      if (loc.charAt(0) === "/" || loc.charAt(0) === "\\") {
        loc = loc.substring(1);
      }
      return fso.GetParentFolderName(loc);
    } catch (e) {
      return ".";
    }
  }

  function resolvePath(targetPath) {
    if (!targetPath) targetPath = ITIM_CONFIG.DEFAULT_STORAGE_PATH;
    if (!isHta || !fso) return targetPath;

    // Check if absolute Windows path (e.g. C:\... or UNC \\server\share)
    if (/^[a-zA-Z]:\\/.test(targetPath) || /^\\[\\]/.test(targetPath)) {
      return targetPath;
    }
    // Relative path resolution
    var base = getBaseDir();
    var cleanTarget = targetPath.replace(/^\.\\/, "");
    return fso.BuildPath(base, cleanTarget);
  }

  function ensureDirectoryExists(dirPath) {
    if (!isHta || !fso) return true;
    try {
      if (fso.FolderExists(dirPath)) return true;
      var parent = fso.GetParentFolderName(dirPath);
      if (parent && !fso.FolderExists(parent)) {
        ensureDirectoryExists(parent);
      }
      fso.CreateFolder(dirPath);
      return true;
    } catch (e) {
      return false;
    }
  }

  function readUtf8(filePath) {
    if (!isHta || !fso) {
      if (typeof localStorage !== "undefined" && localStorage) {
        return localStorage.getItem("ITIM_DB_CACHE");
      }
      return null;
    }
    try {
      if (!fso.FileExists(filePath)) return null;
      var stream = new ActiveXObject("ADODB.Stream");
      stream.Type = 2; // adTypeText
      stream.Charset = "utf-8";
      stream.Open();
      stream.LoadFromFile(filePath);
      var text = stream.ReadText(-1);
      stream.Close();
      return text;
    } catch (e) {
      return null;
    }
  }

  function writeUtf8(filePath, content) {
    if (!isHta || !fso) {
      if (typeof localStorage !== "undefined" && localStorage) {
        localStorage.setItem("ITIM_DB_CACHE", content);
      }
      return true;
    }
    try {
      var parentDir = fso.GetParentFolderName(filePath);
      ensureDirectoryExists(parentDir);

      var stream = new ActiveXObject("ADODB.Stream");
      stream.Type = 2; // adTypeText
      stream.Charset = "utf-8";
      stream.Open();
      stream.WriteText(content);
      stream.SaveToFile(filePath, 2); // adSaveCreateOverWrite
      stream.Close();
      return true;
    } catch (e) {
      return false;
    }
  }

  function testStoragePath(pathStr) {
    var absPath = resolvePath(pathStr);
    var isSmb = /^\\[\\]/.test(absPath) || (!/^[a-zA-Z]:\\/.test(absPath) && absPath.indexOf(":") === -1);

    if (!isHta || !fso) {
      return {
        success: true,
        type: "browser-emulated",
        resolvedPath: absPath,
        message: "Browser mode (ActiveX unavailable) - using LocalStorage fallback."
      };
    }

    try {
      var ok = ensureDirectoryExists(absPath);
      if (!ok && !fso.FolderExists(absPath)) {
        return { success: false, type: isSmb ? "smb" : "local", resolvedPath: absPath, message: "Folder does not exist and cannot be created." };
      }
      // Test write permission with a temp marker
      var testFile = fso.BuildPath(absPath, ".itim_test.tmp");
      var wrote = writeUtf8(testFile, "test");
      if (wrote && fso.FileExists(testFile)) {
        fso.DeleteFile(testFile, true);
        return {
          success: true,
          type: isSmb ? "smb" : "local",
          resolvedPath: absPath,
          message: "Ready: Read/Write verified on " + (isSmb ? "SMB/Network Share" : "Local Drive")
        };
      } else {
        return { success: false, type: isSmb ? "smb" : "local", resolvedPath: absPath, message: "Folder accessible but write permission denied." };
      }
    } catch (err) {
      return { success: false, type: isSmb ? "smb" : "local", resolvedPath: absPath, message: "Storage error: " + err.message };
    }
  }

  function loadDb(storagePath) {
    var absDir = resolvePath(storagePath);
    var dbFilePath = isHta && fso ? fso.BuildPath(absDir, ITIM_CONFIG.DB_FILENAME) : "inventory_db.json";

    var jsonStr = readUtf8(dbFilePath);
    if (jsonStr) {
      try {
        return JSON.parse(jsonStr);
      } catch (e) {
        // Corrupted JSON fallback
      }
    }

    // Seed if file not found
    var seed = JSON.parse(JSON.stringify(ITIM_CONFIG.DEFAULT_SEED_DATA));
    seed.settings.storagePath = storagePath || ITIM_CONFIG.DEFAULT_STORAGE_PATH;
    saveDb(storagePath, seed);
    return seed;
  }

  function saveDb(storagePath, dataObj) {
    var absDir = resolvePath(storagePath);
    var dbFilePath = isHta && fso ? fso.BuildPath(absDir, ITIM_CONFIG.DB_FILENAME) : "inventory_db.json";
    var jsonStr = JSON.stringify(dataObj, null, 2);
    return writeUtf8(dbFilePath, jsonStr);
  }

  return {
    isHta: isHta,
    getBaseDir: getBaseDir,
    resolvePath: resolvePath,
    ensureDirectoryExists: ensureDirectoryExists,
    readUtf8: readUtf8,
    writeUtf8: writeUtf8,
    testStoragePath: testStoragePath,
    loadDb: loadDb,
    saveDb: saveDb
  };
})();
