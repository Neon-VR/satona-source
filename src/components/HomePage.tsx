import Icon from "./Icon";
import type { Section } from "./Sidebar";

type Props = {
  onSection: (section: Section) => void;
  onSearch: (value: string) => void;
};

const shortcuts: {
  id: Section;
  label: string;
  icon: string;
}[] = [
  { id: "games", label: "Books", icon: "games" },
  { id: "movies", label: "Movies", icon: "movies" },
  { id: "music", label: "Music", icon: "music" },
  { id: "chat", label: "Chat", icon: "chat" },
  { id: "youtube", label: "YouTube", icon: "youtube" },
];

const testimonials = [
  {
    user: "Alex",
    role: "Satona User",
    quote: "Clean, fast, and actually feels like a browser.",
  },
  {
    user: "Jordan",
    role: "Community Member",
    quote: "The browser setup makes everything feel like one place.",
  },
  {
    user: "Mason",
    role: "Beta Tester",
    quote: "The new tab experience is ridiculously clean.",
  },
  {
    user: "Taylor",
    role: "Satona User",
    quote: "Books, music, browsing — all without the clutter.",
  },
];

export default function HomePage({ onSection, onSearch }: Props) {
  return (
    <main className="home-page">
      <div className="home-hero">
        <img className="home-wordmark" src="/satona-browser-logo.png" alt="Satona" />

        <p className="home-tagline">
          Your web. Your way.
        </p>

        <form
          className="home-search"
          onSubmit={(event) => {
            event.preventDefault();

            const input = event.currentTarget.elements.namedItem(
              "query"
            ) as HTMLInputElement;

            onSearch(input.value);
          }}
        >
          <Icon name="search" size={20} />
          <input
            name="query"
            placeholder="Search for anything!"
            autoComplete="off"
          />
          <button type="submit">Search</button>
        </form>

        <div className="shortcut-row">
          {shortcuts.map((shortcut) => (
            <button
              key={shortcut.id}
              className="shortcut"
              onClick={() => onSection(shortcut.id)}
            >
              <span className="shortcut-circle">
                <Icon name={shortcut.icon} size={22} />
              </span>
              <span>{shortcut.label}</span>
            </button>
          ))}
        </div>

        <button className="discord-pill">
          <Icon name="discord" size={17} />
          Join our Discord
        </button>
      </div>

      <section className="testimonials">
        <div className="testimonials-heading">
          <span>What people are saying</span>
        </div>

        <div className="testimonial-scroll">
          {testimonials.map((item) => (
            <article className="testimonial-card" key={item.user}>
              <div className="testimonial-avatar">
                {item.user[0]}
              </div>

              <div>
                <strong>{item.user}</strong>
                <small>{item.role}</small>
                <p>“{item.quote}”</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
