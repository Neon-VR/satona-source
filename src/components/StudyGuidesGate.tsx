import { useState, type FormEvent } from "react";

const ACCESS_KEY = "satona.study-guides-unlocked";
const ACCESS_PASSWORD = "DADDYSATONA";

export function hasStudyGuidesAccess() {
  try {
    return sessionStorage.getItem(ACCESS_KEY) === "true";
  } catch {
    return false;
  }
}

export default function StudyGuidesGate() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  function unlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (username === "SATONA" && password === ACCESS_PASSWORD) {
      try {
        sessionStorage.setItem(ACCESS_KEY, "true");
      } catch {
        return;
      }

      window.location.assign("/");
    }
  }

  return (
    <main className="study-gate">
      <header className="study-gate-header">
        <div className="study-gate-brand">
          <span className="study-gate-mark">S</span>
          <span>Study Guides</span>
        </div>
        <nav aria-label="Main navigation" className="study-gate-nav">
          <a>Subjects</a>
          <a>Study tools</a>
          <a>About</a>
        </nav>
        <button className="study-gate-header-button" type="button">
          Sign in
        </button>
      </header>

      <section className="study-gate-hero">
        <div className="study-gate-copy">
          <span className="study-gate-eyebrow">YOUR LEARNING LIBRARY</span>
          <h1>Make room for<br />what you’re learning.</h1>
          <p>Clear study guides and helpful resources for every subject.</p>
          <form className="study-gate-search" onSubmit={(event) => event.preventDefault()}>
            <span aria-hidden="true">⌕</span>
            <input aria-label="Search study guides" placeholder="Search study guides" />
            <button type="submit">Search</button>
          </form>
          <div className="study-gate-subjects" aria-label="Subjects">
            <button type="button">Mathematics</button>
            <button type="button">Science</button>
            <button type="button">History</button>
            <button type="button">Writing</button>
          </div>
        </div>

        <aside className="study-gate-login-card">
          <span className="study-gate-card-icon" aria-hidden="true">✦</span>
          <span className="study-gate-eyebrow">MEMBER ACCESS</span>
          <h2>Welcome back</h2>
          <p>Sign in to continue to your learning space.</p>
          <form onSubmit={unlock}>
            <label htmlFor="study-username">Username</label>
            <input
              id="study-username"
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="SATONA"
            />
            <label htmlFor="study-password">Password</label>
            <input
              id="study-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="DADDYSATONA"
            />
            <button className="study-gate-submit" type="submit">Sign in</button>
          </form>
          <a className="study-gate-help">Need help signing in?</a>
        </aside>
      </section>

      <section className="study-gate-featured">
        <div className="study-gate-featured-heading">
          <div>
            <span className="study-gate-eyebrow">PICK UP SOMETHING NEW</span>
            <h2>Explore your subjects</h2>
          </div>
          <a>View all subjects <span aria-hidden="true">→</span></a>
        </div>
        <div className="study-gate-cards">
          <article className="study-topic-card topic-math"><span>01</span><h3>Mathematics</h3><p>Build confidence with numbers and ideas.</p><a>Explore subject <b>↗</b></a></article>
          <article className="study-topic-card topic-science"><span>02</span><h3>Science</h3><p>Discover how the world works.</p><a>Explore subject <b>↗</b></a></article>
          <article className="study-topic-card topic-history"><span>03</span><h3>History</h3><p>Connect the stories that shaped us.</p><a>Explore subject <b>↗</b></a></article>
          <article className="study-topic-card topic-writing"><span>04</span><h3>Writing</h3><p>Find the right words for every idea.</p><a>Explore subject <b>↗</b></a></article>
        </div>
      </section>

      <footer className="study-gate-footer">
        <span>Study Guides</span>
        <span>Small steps. Better understanding.</span>
        <div><a>Privacy</a><a>Contact</a></div>
      </footer>
    </main>
  );
}
