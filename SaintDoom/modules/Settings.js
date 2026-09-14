const STORAGE_KEY = "saintdoom_settings";
export const DEFAULT_SETTINGS = Object.freeze({
  sensitivity: 4,
  volume: 50,
  fov: 80,
  motion: true,
});

export function normalizeSettings(value = {}) {
  /** @type {Record<string, any>} */
  const source = value && typeof value === "object" ? value : {};
  const number = (key, min, max) =>
    typeof source[key] === "number" && Number.isFinite(source[key])
      ? Math.min(max, Math.max(min, source[key]))
      : DEFAULT_SETTINGS[key];
  return {
    sensitivity: number("sensitivity", 1, 20),
    volume: number("volume", 0, 100),
    fov: number("fov", 65, 110),
    motion:
      typeof source.motion === "boolean"
        ? source.motion
        : DEFAULT_SETTINGS.motion,
  };
}

export function readSettings() {
  try {
    return normalizeSettings(JSON.parse(localStorage.getItem(STORAGE_KEY)));
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function writeSettings(value) {
  const settings = normalizeSettings(value);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    /* Session settings still work. */
  }
  return settings;
}
