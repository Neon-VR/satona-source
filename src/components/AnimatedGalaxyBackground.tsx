import { useEffect, useState } from "react";

export default function AnimatedGalaxyBackground() {
  const [stars] = useState(() =>
    Array.from({ length: 90 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: `${1 + Math.random() * 2}px`,
      delay: `${Math.random() * 5}s`,
      duration: `${2 + Math.random() * 5}s`,
    }))
  );

  return (
    <div className="galaxy-background" aria-hidden="true">
      <div className="galaxy-nebula galaxy-nebula-one" />
      <div className="galaxy-nebula galaxy-nebula-two" />
      <div className="galaxy-nebula galaxy-nebula-three" />

      <div className="galaxy-planet galaxy-planet-one">
        <div />
      </div>

      <div className="galaxy-planet galaxy-planet-two">
        <div />
      </div>

      <div className="galaxy-ring-planet">
        <div />
      </div>

      <div className="galaxy-stars">
        {stars.map((star) => (
          <span
            key={star.id}
            style={{
              left: star.left,
              top: star.top,
              width: star.size,
              height: star.size,
              animationDelay: star.delay,
              animationDuration: star.duration,
            }}
          />
        ))}
      </div>
    </div>
  );
}
