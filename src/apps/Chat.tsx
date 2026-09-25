import { useEffect, useRef, useState, type FormEvent } from "react";
import { createClient, type RealtimeChannel } from "@supabase/supabase-js";
import Icon from "../components/Icon";

type ChatMessage = {
  id: number;
  username: string;
  sender_id: string;
  content: string;
  created_at: string;
};

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

const NAME_KEY = "satona-chat-name";
const SENDER_KEY = "satona-chat-sender";
const MAX_MESSAGES = 100;

function getSenderId() {
  const stored = localStorage.getItem(SENDER_KEY);
  if (stored) return stored;
  const id = crypto.randomUUID();
  localStorage.setItem(SENDER_KEY, id);
  return id;
}

function getDefaultName() {
  const stored = localStorage.getItem(NAME_KEY);
  if (stored) return stored;
  const name = `Guest ${Math.floor(1000 + Math.random() * 9000)}`;
  localStorage.setItem(NAME_KEY, name);
  return name;
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [name, setName] = useState(getDefaultName);
  const [senderId] = useState(getSenderId);
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState("connecting");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!supabase) {
      setStatus("setup");
      return;
    }

    let active = true;
    let channel: RealtimeChannel;

    supabase
      .from("chat_messages")
      .select("id, username, sender_id, content, created_at")
      .order("created_at", { ascending: false })
      .limit(MAX_MESSAGES)
      .then(({ data, error: loadError }) => {
        if (!active) return;
        if (loadError) {
          setError("Could not load messages. Check the chat table and access policies.");
          setStatus("error");
          return;
        }
        setMessages((current) => {
          const merged = new Map<number, ChatMessage>();
          for (const message of [...(data ?? [])].reverse()) {
            merged.set(message.id, message as ChatMessage);
          }
          for (const message of current) merged.set(message.id, message);
          return Array.from(merged.values())
            .sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at))
            .slice(-MAX_MESSAGES);
        });
      }, () => {
        if (active) {
          setError("Could not connect to the chat database.");
          setStatus("error");
        }
      });

    channel = supabase
      .channel("satona-public-chat")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        ({ new: row }) => {
          const message = row as ChatMessage;
          if (!active) return;
          setMessages((current) => {
            if (current.some((item) => item.id === message.id)) return current;
            return [...current, message].slice(-MAX_MESSAGES);
          });
        },
      )
      .subscribe((nextStatus) => {
        if (!active) return;
        setStatus(nextStatus === "SUBSCRIBED" ? "connected" : nextStatus.toLowerCase());
      });

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  function saveName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = new FormData(event.currentTarget).get("display-name");
    if (typeof input !== "string") return;
    const trimmed = input.trim().slice(0, 24);
    if (!trimmed) return;
    localStorage.setItem(NAME_KEY, trimmed);
    setName(trimmed);
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = draft.trim();
    if (!content || !supabase || sending || status !== "connected") return;

    setSending(true);
    setError("");
    try {
      const { data, error: sendError } = await supabase
        .from("chat_messages")
        .insert({ username: name, sender_id: senderId, content })
        .select("id, username, sender_id, content, created_at")
        .single();

      if (sendError) {
        setError("Message could not be sent. Check the chat table and insert policy.");
      } else if (data) {
        setMessages((current) => current.some((item) => item.id === data.id)
          ? current
          : [...current, data as ChatMessage].slice(-MAX_MESSAGES));
        setDraft("");
      }
    } catch {
      setError("Message could not be sent. Check your network connection.");
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="section-page chat-page">
      <header className="chat-heading">
        <div>
          <span className="section-kicker">COMMUNITY</span>
          <h1>Chat</h1>
          <p>Talk with other people on Satona.</p>
        </div>
        <form className="chat-name-form" onSubmit={saveName}>
          <label htmlFor="chat-display-name">Your name</label>
          <input
            id="chat-display-name"
            name="display-name"
            key={name}
            defaultValue={name}
            maxLength={24}
            aria-label="Your chat display name"
          />
          <button type="submit">Save</button>
        </form>
      </header>

      <div className="chat-room">
        <div className="chat-room-heading">
          <div>
            <strong>Public room</strong>
            <span>Messages are visible to everyone.</span>
          </div>
          <span className={`chat-status ${status}`}>
            <i />
            {status === "connected" ? "Live" : status === "setup" ? "Setup needed" : status === "error" ? "Connection error" : "Connecting"}
          </span>
        </div>

        {!supabase ? (
          <div className="chat-not-configured">
            <Icon name="chat" size={30} />
            <h2>Connect Supabase to start chatting</h2>
            <p>Set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>, then create the chat table using <code>CHAT_SETUP.sql</code>.</p>
          </div>
        ) : (
          <>
            <div className="chat-messages" ref={listRef} aria-live="polite">
              {messages.length === 0 ? (
                <div className="chat-empty">No messages yet. Say hello!</div>
              ) : messages.map((message) => (
                <article
                  className={`chat-message ${message.sender_id === senderId ? "mine" : ""}`}
                  key={message.id}
                >
                  <div className="chat-message-meta">
                    <strong>{message.username}</strong>
                    <time dateTime={message.created_at}>{formatTime(message.created_at)}</time>
                  </div>
                  <p>{message.content}</p>
                </article>
              ))}
            </div>
            {error && <p className="chat-error" role="alert">{error}</p>}
            <form className="chat-compose" onSubmit={sendMessage}>
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder={status === "connected" ? "Write a message…" : "Connecting to chat…"}
                maxLength={1000}
                rows={1}
                disabled={status !== "connected" || sending}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    event.currentTarget.form?.requestSubmit();
                  }
                }}
              />
              <button type="submit" disabled={!draft.trim() || status !== "connected" || sending}>
                <Icon name="chat" size={18} />
                Send
              </button>
            </form>
            <div className="chat-compose-hint">Enter to send · Shift+Enter for a new line</div>
          </>
        )}
      </div>
    </section>
  );
}
