const services = [
  {
    name: "Nvidia Geforce NOW",
    brand: "GEFORCE NOW",
    mark: "N",
    url: "https://play.geforcenow.com/",
    copy: "Your PC games. Streamed to your browser.",
    color: "#b4ed60",
  },
  {
    name: "RacoonGame",
    brand: "RACCOON GAME",
    mark: "R",
    url: "https://www.raccoongame.com/",
    copy: "Explore a different cloud gaming library.",
    color: "#b4b1ff",
  },
  {
    name: "nowgg.fun",
    brand: "NOWGG.FUN",
    mark: "ng",
    url: "https://nowgg.fun/",
    copy: "Mobile favorites, without the install.",
    color: "#ffb797",
  },
];
export default function CloudGaming({
  onOpen,
}: {
  onOpen: (url: string) => void;
}) {
  return (
    <section className="section-page cloud-page">
      <div className="section-heading">
        <div>
          <span className="section-kicker">PLAY BEYOND YOUR DEVICE</span>
          <h1>
            Cloud gaming<span className="title-dot">.</span>
          </h1>
          <p>Your next session starts here. Choose your platform.</p>
        </div>
      </div>
      <div className="cloud-grid">
        {services.map((service) => (
          <article
            className="cloud-card"
            key={service.url}
            style={{ "--card-accent": service.color } as React.CSSProperties}
          >
            <div className="cloud-art">
              <span>{service.mark}</span>
              <i />
              <i />
            </div>
            <small>{service.brand}</small>
            <h2>{service.name}</h2>
            <p>{service.copy}</p>
            <button onClick={() => onOpen(service.url)}>
              Open {service.name} <span>↗</span>
            </button>
          </article>
        ))}
      </div>
      <p className="subtle-note">
        Opens inside Satona through Scramjet. Accounts, subscriptions, and
        streaming availability depend on each provider. The free relay does not
        support UDP and may not support every cloud streaming session.
      </p>
    </section>
  );
}
