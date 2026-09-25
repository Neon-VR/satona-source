import { useEffect, useState } from "react";
import type { SearchEngine } from "../lib/search";

const WALLPAPER_KEY = "satona_wallpaper";
const ENGINE_KEY = "satona_search_engine";

export function useSettings() {
  const [wallpaper, setWallpaper] = useState<string>(() => {
    return localStorage.getItem(WALLPAPER_KEY) || "";
  });

  const [searchEngine, setSearchEngine] = useState<SearchEngine>(() => {
    const value = localStorage.getItem(ENGINE_KEY);
    if (
      value === "google" ||
      value === "duckduckgo" ||
      value === "bing" ||
      value === "yahoo" ||
      value === "brave"
    ) {
      return value;
    }
    return "google";
  });

  useEffect(() => {
    if (wallpaper) {
      localStorage.setItem(WALLPAPER_KEY, wallpaper);
    } else {
      localStorage.removeItem(WALLPAPER_KEY);
    }
  }, [wallpaper]);

  useEffect(() => {
    localStorage.setItem(ENGINE_KEY, searchEngine);
  }, [searchEngine]);

  return {
    wallpaper,
    setWallpaper,
    searchEngine,
    setSearchEngine,
  };
}
