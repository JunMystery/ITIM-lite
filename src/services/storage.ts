/**
 * Dual Storage Engine for ITIM-lite
 * Supports Windows Scripting.FileSystemObject (MSHTA) with localStorage fallback.
 */

declare global {
  interface Window {
    ActiveXObject?: new (progId: string) => any;
  }
}

export class StorageEngine {
  private static isHta(): boolean {
    return typeof window !== "undefined" && "ActiveXObject" in window;
  }

  private static getFso(): any {
    try {
      if (this.isHta() && window.ActiveXObject) {
        return new window.ActiveXObject("Scripting.FileSystemObject");
      }
    } catch (e) {
      // Ignore if not permitted
    }
    return null;
  }

  private static getBaseDir(fso: any): string {
    try {
      if (typeof window !== "undefined" && window.location && window.location.pathname) {
        let p = decodeURIComponent(window.location.pathname);
        p = p.replace(/^\/+/, "").replace(/\//g, "\\");
        if (fso.FileExists(p)) {
          return fso.GetParentFolderName(p);
        }
      }
    } catch (e) {
      // Fallback
    }
    return ".";
  }

  private static getDataFilePath(key: string, fso: any): string {
    const base = this.getBaseDir(fso);
    const dataDir = fso.BuildPath(base, "data");
    if (!fso.FolderExists(dataDir)) {
      try {
        fso.CreateFolder(dataDir);
      } catch (e) {
        // Ignore error if folder already exists
      }
    }
    return fso.BuildPath(dataDir, `${key}.json`);
  }

  public static loadJson<T>(key: string, defaultVal: T): T {
    const fso = this.getFso();
    if (fso) {
      try {
        const filePath = this.getDataFilePath(key, fso);
        if (fso.FileExists(filePath)) {
          const file = fso.OpenTextFile(filePath, 1, false, -1);
          const content = file.ReadAll();
          file.Close();
          return JSON.parse(content) as T;
        }
      } catch (e) {
        console.warn(`FSO read failed for ${key}, falling back to localStorage.`);
      }
    }

    if (typeof localStorage !== "undefined") {
      try {
        const raw = localStorage.getItem(`itim_${key}`);
        if (raw) return JSON.parse(raw) as T;
      } catch (e) {
        console.warn(`localStorage read failed for ${key}`);
      }
    }

    return defaultVal;
  }

  public static saveJson<T>(key: string, data: T): boolean {
    const jsonStr = JSON.stringify(data, null, 2);
    let success = false;

    const fso = this.getFso();
    if (fso) {
      try {
        const filePath = this.getDataFilePath(key, fso);
        const file = fso.CreateTextFile(filePath, true, true);
        file.Write(jsonStr);
        file.Close();
        success = true;
      } catch (e) {
        console.warn(`FSO write failed for ${key}`);
      }
    }

    if (typeof localStorage !== "undefined") {
      try {
        localStorage.setItem(`itim_${key}`, jsonStr);
        success = true;
      } catch (e) {
        console.warn(`localStorage write failed for ${key}`);
      }
    }

    return success;
  }
}
