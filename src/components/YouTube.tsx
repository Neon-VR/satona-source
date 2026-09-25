import { useEffect, useRef, useState } from "react";

const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;

type Video = {
  id: string;
  title: string;
  channel: string;
  thumbnail: string;
  views?: string;
};

declare global {
  interface Window {
    YT?: {
      Player: new (
        element: HTMLElement | string,
        options: {
          width?: string | number;
          height?: string | number;
          videoId?: string;
          playerVars?: Record<string, unknown>;
          events?: {
            onReady?: (event: unknown) => void;
            onStateChange?: (event: unknown) => void;
            onError?: (event: unknown) => void;
          };
        }
      ) => YouTubePlayer;
      PlayerState?: {
        UNSTARTED: number;
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
        CUED: number;
      };
    };

    onYouTubeIframeAPIReady?: () => void;
  }
}

type YouTubePlayer = {
  destroy: () => void;
  playVideo?: () => void;
  pauseVideo?: () => void;
  stopVideo?: () => void;
  setVolume?: (volume: number) => void;
  getVolume?: () => number;
};

let youtubeApiPromise: Promise<void> | null = null;

function loadYouTubeIframeAPI() {
  if (window.YT?.Player) {
    return Promise.resolve();
  }

  if (youtubeApiPromise) {
    return youtubeApiPromise;
  }

  youtubeApiPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector(
      'script[src="https://www.youtube.com/iframe_api"]'
    );

    const previousReady = window.onYouTubeIframeAPIReady;

    window.onYouTubeIframeAPIReady = () => {
      previousReady?.();

      if (window.YT?.Player) {
        resolve();
      } else {
        reject(
          new Error("YouTube IFrame Player API loaded without YT.Player.")
        );
      }
    };

    if (existingScript) {
      const check = window.setInterval(() => {
        if (window.YT?.Player) {
          window.clearInterval(check);
          resolve();
        }
      }, 50);

      window.setTimeout(() => {
        window.clearInterval(check);

        if (!window.YT?.Player) {
          reject(
            new Error("Timed out while loading the YouTube IFrame Player API.")
          );
        }
      }, 10000);

      return;
    }

    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;

    script.onerror = () => {
      reject(
        new Error("Could not load the YouTube IFrame Player API.")
      );
    };

    document.head.appendChild(script);
  });

  return youtubeApiPromise;
}

function formatViews(value?: string) {
  if (!value) return "";

  const number = Number(value);

  if (!Number.isFinite(number)) return "";

  if (number >= 1_000_000_000) {
    return `${(number / 1_000_000_000).toFixed(1)}B views`;
  }

  if (number >= 1_000_000) {
    return `${(number / 1_000_000).toFixed(1)}M views`;
  }

  if (number >= 1_000) {
    return `${(number / 1_000).toFixed(1)}K views`;
  }

  return `${number} views`;
}

export default function YouTube() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [playing, setPlaying] = useState<string | null>(null);

  const playerContainerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YouTubePlayer | null>(null);

  async function loadPopular() {
    if (!API_KEY) {
      setError(
        "YouTube API key is missing. Add VITE_YOUTUBE_API_KEY to your .env file."
      );
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const url =
        "https://www.googleapis.com/youtube/v3/videos?" +
        new URLSearchParams({
          part: "snippet,statistics",
          chart: "mostPopular",
          regionCode: "US",
          maxResults: "24",
          key: API_KEY,
        }).toString();

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`YouTube API returned ${response.status}`);
      }

      const data = await response.json();

      const results: Video[] = (data.items || []).map((item: any) => ({
        id: item.id,
        title: item.snippet?.title || "Untitled video",
        channel: item.snippet?.channelTitle || "Unknown channel",
        thumbnail:
          item.snippet?.thumbnails?.high?.url ||
          item.snippet?.thumbnails?.medium?.url ||
          item.snippet?.thumbnails?.default?.url ||
          "",
        views: item.statistics?.viewCount,
      }));

      setVideos(results);
    } catch (err) {
      console.error(err);

      setError(
        "Unable to load YouTube videos. Check your API key and YouTube Data API settings."
      );
    } finally {
      setLoading(false);
    }
  }

  async function searchYouTube() {
    const value = query.trim();

    if (!value) {
      loadPopular();
      return;
    }

    if (!API_KEY) {
      setError(
        "YouTube API key is missing. Add VITE_YOUTUBE_API_KEY to your .env file."
      );
      return;
    }

    setSearching(true);
    setError("");

    try {
      const searchUrl =
        "https://www.googleapis.com/youtube/v3/search?" +
        new URLSearchParams({
          part: "snippet",
          type: "video",
          videoEmbeddable: "true",
          videoSyndicated: "true",
          maxResults: "24",
          q: value,
          key: API_KEY,
        }).toString();

      const searchResponse = await fetch(searchUrl);

      if (!searchResponse.ok) {
        throw new Error(
          `YouTube search returned ${searchResponse.status}`
        );
      }

      const searchData = await searchResponse.json();

      const ids = (searchData.items || [])
        .map((item: any) => item.id?.videoId)
        .filter(Boolean);

      if (!ids.length) {
        setVideos([]);
        return;
      }

      const statsUrl =
        "https://www.googleapis.com/youtube/v3/videos?" +
        new URLSearchParams({
          part: "snippet,statistics",
          id: ids.join(","),
          key: API_KEY,
        }).toString();

      const statsResponse = await fetch(statsUrl);

      if (!statsResponse.ok) {
        throw new Error(
          `YouTube video lookup returned ${statsResponse.status}`
        );
      }

      const statsData = await statsResponse.json();

      const results: Video[] = (statsData.items || []).map((item: any) => ({
        id: item.id,
        title: item.snippet?.title || "Untitled video",
        channel: item.snippet?.channelTitle || "Unknown channel",
        thumbnail:
          item.snippet?.thumbnails?.high?.url ||
          item.snippet?.thumbnails?.medium?.url ||
          item.snippet?.thumbnails?.default?.url ||
          "",
        views: item.statistics?.viewCount,
      }));

      setVideos(results);
    } catch (err) {
      console.error(err);

      setError(
        "YouTube search failed. Check your API key, quota, and API settings."
      );
    } finally {
      setSearching(false);
    }
  }

  async function openVideo(videoId: string) {
    setPlaying(videoId);

    try {
      await loadYouTubeIframeAPI();
    } catch (err) {
      console.error(err);
      setError("The YouTube Embedded Player API could not be loaded.");
    }
  }

  function closePlayer() {
    if (playerRef.current) {
      try {
        playerRef.current.destroy();
      } catch {
        // Player may already be destroyed.
      }

      playerRef.current = null;
    }

    setPlaying(null);
  }

  useEffect(() => {
    if (!playing) return;

    let cancelled = false;

    async function createPlayer() {
      try {
        await loadYouTubeIframeAPI();

        if (cancelled || !playerContainerRef.current || !window.YT?.Player) {
          return;
        }

        playerRef.current?.destroy();
        playerRef.current = null;

        playerRef.current = new window.YT.Player(
          playerContainerRef.current,
          {
            width: "100%",
            height: "100%",
            videoId: playing,
            playerVars: {
              autoplay: 1,
              playsinline: 1,
              rel: 0,
              origin: window.location.origin,
            },
            events: {
              onReady: () => {
                if (!cancelled) {
                  playerRef.current?.playVideo?.();
                }
              },
              onError: (event: any) => {
                console.error(
                  "YouTube Embedded Player error:",
                  event?.data
                );
              },
            },
          }
        );
      } catch (err) {
        console.error(
          "Failed to create YouTube Embedded Player:",
          err
        );
      }
    }

    createPlayer();

    return () => {
      cancelled = true;

      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {
          // Ignore cleanup errors.
        }

        playerRef.current = null;
      }
    };
  }, [playing]);

  useEffect(() => {
    loadPopular();

    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {
          // Ignore cleanup errors.
        }

        playerRef.current = null;
      }
    };
  }, []);

  return (
    <div className="youtube-page">
      <div className="youtube-header">
        <div>
          <h1>YouTube</h1>
          <p>Watch YouTube directly inside Satona.</p>
        </div>

        <form
          className="youtube-search"
          onSubmit={(event) => {
            event.preventDefault();
            searchYouTube();
          }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-4-4" />
          </svg>

          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search YouTube..."
          />

          <button type="submit" disabled={searching}>
            {searching ? "Searching..." : "Search"}
          </button>
        </form>
      </div>

      {error && (
        <div className="youtube-error">
          {error}
        </div>
      )}

      {loading ? (
        <div className="youtube-loading">
          <div className="youtube-spinner" />
          <span>Loading YouTube...</span>
        </div>
      ) : videos.length === 0 ? (
        <div className="youtube-empty">
          <h2>No videos found</h2>
          <p>Try another search.</p>
        </div>
      ) : (
        <div className="youtube-grid">
          {videos.map((video) => (
            <button
              key={video.id}
              className="youtube-card"
              onClick={() => openVideo(video.id)}
              type="button"
            >
              <div className="youtube-thumbnail">
                <img
                  src={video.thumbnail}
                  alt=""
                  loading="lazy"
                />

                <div className="youtube-play">
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>

              <div className="youtube-card-info">
                <h3>{video.title}</h3>
                <p>{video.channel}</p>

                {video.views && (
                  <span>{formatViews(video.views)}</span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {playing && (
        <div
          className="youtube-player-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closePlayer();
            }
          }}
        >
          <div className="youtube-player-modal">
            <div className="youtube-player-topbar">
              <span>Satona YouTube Player</span>

              <button
                type="button"
                className="youtube-player-close"
                onClick={closePlayer}
                aria-label="Close player"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </div>

            <div
              className="youtube-player-container"
              ref={playerContainerRef}
            />
          </div>
        </div>
      )}
    </div>
  );
}
