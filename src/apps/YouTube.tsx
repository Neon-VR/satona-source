import {
  useEffect,
  useRef,
  useState,
} from "react";
import Icon from "../components/Icon";

const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;

type Video = {
  id: string;
  title: string;
  channel: string;
  thumbnail: string;
  views?: string;
};

type YouTubePlayer = {
  destroy: () => void;
  playVideo?: () => void;
  pauseVideo?: () => void;
  stopVideo?: () => void;
  setVolume?: (volume: number) => void;
  getVolume?: () => number;
};

let playerApiPromise: Promise<void> | null = null;

function loadPlayerAPI() {
  if (window.YT?.Player) {
    return Promise.resolve();
  }

  if (playerApiPromise) {
    return playerApiPromise;
  }

  playerApiPromise = new Promise<void>((resolve, reject) => {
    const previous = window.onYouTubeIframeAPIReady;

    window.onYouTubeIframeAPIReady = () => {
      previous?.();

      if (window.YT?.Player) {
        resolve();
      } else {
        reject(new Error("YouTube Player API unavailable."));
      }
    };

    const script = document.createElement("script");

    script.src =
      "https://www.youtube.com/iframe_api";
    script.async = true;

    script.onerror = () => {
      reject(
        new Error(
          "Unable to load YouTube's official player API."
        )
      );
    };

    document.head.appendChild(script);
  });

  return playerApiPromise;
}

function formatViews(value?: string) {
  if (!value) return "";

  const n = Number(value);

  if (!Number.isFinite(n)) return "";

  if (n >= 1_000_000_000)
    return `${(n / 1_000_000_000).toFixed(1)}B views`;

  if (n >= 1_000_000)
    return `${(n / 1_000_000).toFixed(1)}M views`;

  if (n >= 1_000)
    return `${(n / 1_000).toFixed(1)}K views`;

  return `${n} views`;
}

export default function YouTube() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [playing, setPlaying] = useState<string | null>(null);

  const playerElement = useRef<HTMLDivElement | null>(null);
  const player = useRef<YouTubePlayer | null>(null);

  async function requestVideos(search?: string) {
    if (!API_KEY) {
      setError(
        "YouTube Data API key is missing. Add VITE_YOUTUBE_API_KEY to .env."
      );
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      let ids: string[] = [];

      if (search?.trim()) {
        const searchUrl =
          "https://www.googleapis.com/youtube/v3/search?" +
          new URLSearchParams({
            part: "snippet",
            type: "video",
            videoEmbeddable: "true",
            videoSyndicated: "true",
            maxResults: "24",
            q: search.trim(),
            key: API_KEY,
          });

        const response = await fetch(searchUrl);

        if (!response.ok) {
          throw new Error(
            `YouTube search failed: ${response.status}`
          );
        }

        const data = await response.json();

        ids = (data.items || [])
          .map((item: any) => item.id?.videoId)
          .filter(Boolean);
      } else {
        const popularUrl =
          "https://www.googleapis.com/youtube/v3/videos?" +
          new URLSearchParams({
            part: "snippet,statistics",
            chart: "mostPopular",
            regionCode: "US",
            maxResults: "24",
            key: API_KEY,
          });

        const response = await fetch(popularUrl);

        if (!response.ok) {
          throw new Error(
            `YouTube trending request failed: ${response.status}`
          );
        }

        const data = await response.json();

        setVideos(
          (data.items || []).map((item: any) => ({
            id: item.id,
            title: item.snippet?.title || "Untitled",
            channel:
              item.snippet?.channelTitle || "Unknown channel",
            thumbnail:
              item.snippet?.thumbnails?.high?.url ||
              item.snippet?.thumbnails?.medium?.url ||
              item.snippet?.thumbnails?.default?.url ||
              "",
            views: item.statistics?.viewCount,
          }))
        );

        setLoading(false);
        return;
      }

      if (!ids.length) {
        setVideos([]);
        setLoading(false);
        return;
      }

      const detailsUrl =
        "https://www.googleapis.com/youtube/v3/videos?" +
        new URLSearchParams({
          part: "snippet,statistics",
          id: ids.join(","),
          key: API_KEY,
        });

      const details = await fetch(detailsUrl);

      if (!details.ok) {
        throw new Error(
          `YouTube video lookup failed: ${details.status}`
        );
      }

      const data = await details.json();

      setVideos(
        (data.items || []).map((item: any) => ({
          id: item.id,
          title: item.snippet?.title || "Untitled",
          channel:
            item.snippet?.channelTitle || "Unknown channel",
          thumbnail:
            item.snippet?.thumbnails?.high?.url ||
            item.snippet?.thumbnails?.medium?.url ||
            item.snippet?.thumbnails?.default?.url ||
            "",
          views: item.statistics?.viewCount,
        }))
      );
    } catch (err) {
      console.error(err);

      setError(
        "YouTube could not load. Check the API key and YouTube Data API quota."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    requestVideos();
  }, []);

  async function openVideo(id: string) {
    setPlaying(id);

    try {
      await loadPlayerAPI();
    } catch (err) {
      console.error(err);
      setError(
        "YouTube's official Embedded Player API could not load."
      );
    }
  }

  useEffect(() => {
    if (!playing) return;

    let cancelled = false;

    async function createPlayer() {
      try {
        await loadPlayerAPI();

        if (
          cancelled ||
          !playerElement.current ||
          !window.YT?.Player
        ) {
          return;
        }

        player.current?.destroy();

        player.current = new window.YT.Player(
          playerElement.current,
          {
            width: "100%",
            height: "100%",
            videoId: playing ?? undefined,
            playerVars: {
              autoplay: 1,
              playsinline: 1,
              rel: 0,
              origin: window.location.origin,
            },
            events: {
              onReady: () => {
                player.current?.playVideo?.();
              },
              onError: (event) => {
                console.error(
                  "YouTube Player API error:",
                  event
                );
              },
            },
          }
        );
      } catch (err) {
        console.error(err);
      }
    }

    createPlayer();

    return () => {
      cancelled = true;
      player.current?.destroy();
      player.current = null;
    };
  }, [playing]);

  function closePlayer() {
    player.current?.destroy();
    player.current = null;
    setPlaying(null);
  }

  return (
    <section className="section-page youtube-page">
      <div className="section-heading youtube-heading">
        <div>
          <span className="section-kicker">VIDEO</span>
          <h1>YouTube</h1>
          <p>Search and watch YouTube.</p>
        </div>

        <form
          className="library-search youtube-search"
          onSubmit={(event) => {
            event.preventDefault();
            requestVideos(query);
          }}
        >
          <Icon name="search" size={17} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search YouTube..."
          />
        </form>
      </div>

      {error && (
        <div className="youtube-error">
          {error}
        </div>
      )}

      {loading ? (
        <div className="empty-library">
          <span className="loading-spinner" />
          <p>Loading YouTube...</p>
        </div>
      ) : (
        <div className="youtube-grid">
          {videos.map((video) => (
            <button
              className="youtube-card"
              key={video.id}
              onClick={() => openVideo(video.id)}
            >
              <div className="youtube-thumb">
                <img src={video.thumbnail} alt="" />
                <span className="youtube-play">
                  <Icon name="play" size={19} />
                </span>
              </div>

              <div className="youtube-info">
                <strong>{video.title}</strong>
                <span>{video.channel}</span>
                <small>{formatViews(video.views)}</small>
              </div>
            </button>
          ))}
        </div>
      )}

      {playing && (
        <div
          className="youtube-player-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closePlayer();
            }
          }}
        >
          <div className="youtube-player-modal">
            <div className="youtube-player-header">
              <span>Satona YouTube Player</span>

              <button onClick={closePlayer}>
                <Icon name="x" size={18} />
              </button>
            </div>

            <div
              className="youtube-player"
              ref={playerElement}
            />
          </div>
        </div>
      )}
    </section>
  );
}
