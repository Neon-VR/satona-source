import { useEffect, useRef, useState } from "react";
import Icon from "../components/Icon";
import { youtubeVideoId } from "../lib/video";
import { readPreference, savePreference } from "../lib/preferences";
type Video = { id: string; title: string; channel: string; thumbnail: string };
type ApiItem = {
  id: string | { videoId?: string };
  snippet?: {
    title?: string;
    channelTitle?: string;
    thumbnails?: { medium?: { url: string }; high?: { url: string } };
  };
};
const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
export default function YouTube() {
  const [query, setQuery] = useState("");
  const [videos, setVideos] = useState<Video[]>([]);
  const [playing, setPlaying] = useState<Video | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState(() =>
    readPreference<Video[]>("satona.video-history", []),
  );
  const abort = useRef<AbortController | null>(null);
  function play(video: Video) {
    setPlaying(video);
    setError("");
    const next = [
      video,
      ...recent.filter((item) => item.id !== video.id),
    ].slice(0, 12);
    setRecent(next);
    savePreference("satona.video-history", next);
  }
  async function search(value: string) {
    const id = youtubeVideoId(value);
    if (id) {
      play({
        id,
        title: "YouTube video",
        channel: "Opened from a link",
        thumbnail: `https://i.ytimg.com/vi/${id}/mqdefault.jpg`,
      });
      return;
    }
    if (!API_KEY) {
      setError(
        "Search is not configured yet. Paste a YouTube video link or video ID to watch directly.",
      );
      return;
    }
    abort.current?.abort();
    const controller = new AbortController();
    abort.current = controller;
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        part: "snippet",
        key: API_KEY,
        maxResults: "24",
      });
      if (value.trim()) {
        params.set("q", value.trim());
        params.set("type", "video");
        params.set("videoEmbeddable", "true");
      } else {
        params.set("chart", "mostPopular");
        params.set("regionCode", "US");
      }
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/${value.trim() ? "search" : "videos"}?${params}`,
        { signal: controller.signal },
      );
      if (!response.ok)
        throw new Error(
          `Video search is unavailable (${response.status}). You can still paste a video link.`,
        );
      const data = (await response.json()) as { items?: ApiItem[] };
      if (!controller.signal.aborted)
        setVideos(
          (data.items || [])
            .map((item) => ({
              id: typeof item.id === "string" ? item.id : item.id.videoId || "",
              title: item.snippet?.title || "Untitled video",
              channel: item.snippet?.channelTitle || "YouTube",
              thumbnail:
                item.snippet?.thumbnails?.high?.url ||
                item.snippet?.thumbnails?.medium?.url ||
                "",
            }))
            .filter((item) => item.id),
        );
    } catch (cause) {
      if (!controller.signal.aborted)
        setError(
          cause instanceof Error
            ? cause.message
            : "Video search could not connect.",
        );
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }
  useEffect(() => {
    if (API_KEY) void search("");
    return () => abort.current?.abort();
  }, []);
  return (
    <section className="section-page youtube-page">
      <div className="section-heading">
        <div>
          <span className="section-kicker">ONE MORE VIDEO</span>
          <h1>
            The watch room<span className="title-dot">.</span>
          </h1>
          <p>Find something worth your time.</p>
        </div>
      </div>
      <form
        className="video-link-form"
        onSubmit={(event) => {
          event.preventDefault();
          void search(query);
        }}
      >
        <input
          aria-label="Search or paste a YouTube link"
          placeholder={
            API_KEY
              ? "Search YouTube or paste a video link…"
              : "Paste a YouTube video link or video ID…"
          }
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <button disabled={loading}>
          {loading ? "Searching…" : "Let’s watch ↗"}
        </button>
      </form>
      {error && (
        <p className="source-error" role="alert">
          {error}
        </p>
      )}
      {playing && (
        <div className="video-watch">
          <div className="game-player-toolbar">
            <h2>{playing.title}</h2>
            <button
              className="secondary-button"
              onClick={() => setPlaying(null)}
            >
              Close player ×
            </button>
          </div>
          <iframe
            key={playing.id}
            className="video-player-inline"
            title={playing.title}
            src={`https://www.youtube-nocookie.com/embed/${playing.id}?autoplay=1&rel=0&playsinline=1`}
            referrerPolicy="strict-origin-when-cross-origin"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
          />
          <p className="subtle-note">
            Privacy-enhanced YouTube player. Some videos have age, region, or
            embedding restrictions.{" "}
            <a
              href={`https://www.youtube.com/watch?v=${playing.id}`}
              target="_blank"
              rel="noreferrer"
            >
              Open on YouTube ↗
            </a>
          </p>
        </div>
      )}
      <div className="dashboard-heading">
        <h2>{videos.length ? "Discover" : "Recently watched"}</h2>
        <span>PRESS PLAY</span>
      </div>
      <div className="youtube-grid">
        {(videos.length ? videos : recent).map((video) => (
          <button
            className="youtube-card"
            key={video.id}
            onClick={() => play(video)}
          >
            <div className="youtube-thumb">
              <img src={video.thumbnail} alt="" loading="lazy" />
              <span className="youtube-play">
                <Icon name="play" size={20} />
              </span>
            </div>
            <div className="youtube-info">
              <strong>{video.title}</strong>
              <span>{video.channel}</span>
            </div>
          </button>
        ))}
      </div>
      {!videos.length && !recent.length && !loading && (
        <div className="empty-library">
          <Icon name="youtube" size={40} />
          <h2>Bring a video. Stay a while.</h2>
          <p>Paste a watch link, short link, Shorts link, or video ID above.</p>
        </div>
      )}
    </section>
  );
}
