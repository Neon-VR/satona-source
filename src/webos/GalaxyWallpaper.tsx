import { useEffect, useRef } from "react";

export default function GalaxyWallpaper() {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const draw = () => {
      const el = canvas.current;
      if (!el) return;
      const w = Math.min(window.innerWidth * 1.25, 2200),
        h = Math.min(window.innerHeight * 1.25, 1400);
      el.width = w;
      el.height = h;
      const ctx = el.getContext("2d");
      if (!ctx) return;
      let seed = 47191;
      const random = () =>
        ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
      const gaussian = () =>
        Math.sqrt(-2 * Math.log(Math.max(0.0001, random()))) *
        Math.cos(6.283 * random());
      ctx.fillStyle = "#050713";
      ctx.fillRect(0, 0, w, h);
      // Paint a diagonal dust lane, diffuse nebulae, and dense stellar populations.
      ctx.save();
      ctx.translate(w * 0.52, h * 0.5);
      ctx.rotate(-0.44);
      for (let i = 0; i < 950; i++) {
        const x = gaussian() * w * 0.4,
          y = gaussian() * h * 0.095,
          radius = 25 + random() * h * 0.18;
        const glow = ctx.createRadialGradient(x, y, 0, x, y, radius);
        const tint =
          i % 4 === 0
            ? "217,163,208"
            : i % 3 === 0
              ? "94,99,197"
              : "153,104,194";
        glow.addColorStop(0, `rgba(${tint},.019)`);
        glow.addColorStop(1, `rgba(${tint},0)`);
        ctx.fillStyle = glow;
        ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
      }
      for (let i = 0; i < 21000; i++) {
        const x = (random() - 0.5) * w * 1.7,
          y = gaussian() * h * 0.085;
        ctx.fillStyle = `rgba(225,214,255,${0.04 + random() * 0.29})`;
        ctx.fillRect(x, y, 0.3 + random() * 1.1, 0.3 + random() * 1.1);
      }
      for (let i = 0; i < 280; i++) {
        const x = (random() - 0.5) * w * 1.3,
          y = Math.sin(x / 140) * 22 + gaussian() * 22,
          r = 20 + random() * 65;
        const dust = ctx.createRadialGradient(x, y, 0, x, y, r);
        dust.addColorStop(0, "rgba(6,4,17,.14)");
        dust.addColorStop(1, "rgba(6,4,17,0)");
        ctx.fillStyle = dust;
        ctx.fillRect(x - r, y - r, r * 2, r * 2);
      }
      ctx.restore();
      for (let i = 0; i < 2300; i++) {
        const x = random() * w,
          y = random() * h,
          r = random() > 0.99 ? 1.5 : random() * 0.8;
        ctx.fillStyle = `rgba(224,232,255,${0.2 + random() * 0.65})`;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
        if (r > 1.4) {
          const star = ctx.createRadialGradient(x, y, 0, x, y, 9);
          star.addColorStop(0, "#d9caff99");
          star.addColorStop(1, "#d9caff00");
          ctx.fillStyle = star;
          ctx.fillRect(x - 9, y - 9, 18, 18);
        }
      }
    };
    draw();
    let timer: ReturnType<typeof setTimeout>;
    const resize = () => {
      clearTimeout(timer);
      timer = setTimeout(draw, 250);
    };
    window.addEventListener("resize", resize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", resize);
    };
  }, []);
  return (
    <div className="os-wallpaper" aria-hidden="true">
      <canvas ref={canvas} />
      <div className="os-nebula" />
      <div className="os-wallpaper-brand">
        <span>YOUR OWN LITTLE UNIVERSE</span>
        <strong>SATONA</strong>
        <p>Go somewhere extraordinary.</p>
      </div>
      <i className="os-shooting-star" />
    </div>
  );
}
