import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

export default function GsapEffects() {
  useEffect(() => {
    let lenis = null;
    let ctx;
    const mm = gsap.matchMedia();

    try {
      const isCoarse = window.matchMedia("(pointer: coarse)").matches;

      if (!isCoarse) {
        lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
        lenis.on("scroll", ScrollTrigger.update);
        gsap.ticker.add((time) => lenis.raf(time * 1000));
        gsap.ticker.lagSmoothing(0);
      }

      const onAnchorClick = (e) => {
        const a = e.target.closest('a[href^="#"]');
        if (!a) return;
        const target = document.querySelector(a.getAttribute("href"));
        if (!target) return;
        e.preventDefault();
        if (lenis) {
          lenis.scrollTo(target, { offset: -70, duration: 1.4 });
        } else {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      };
      document.addEventListener("click", onAnchorClick);

      ctx = gsap.context(() => {
        gsap.utils.toArray("section h2").forEach((el) => {
          gsap.fromTo(
            el,
            { y: 44, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.9,
              ease: "power3.out",
              scrollTrigger: { trigger: el, start: "top 88%", toggleActions: "play none none reverse" },
            }
          );
        });

        const track = document.querySelector(".marquee-track");
        if (track) {
          const tween = gsap.to(track, { xPercent: -50, repeat: -1, duration: 55, ease: "none" });
          ScrollTrigger.create({
            onUpdate: (self) => {
              const boost = Math.min(Math.abs(self.getVelocity()) / 400, 3);
              gsap.to(tween, { timeScale: 1 + boost, duration: 0.3, overwrite: true });
            },
          });
        }

        gsap.to("[data-progress-bar]", {
          scaleX: 1,
          ease: "none",
          scrollTrigger: { trigger: document.body, start: "top top", end: "bottom bottom", scrub: 0.4 },
        });
      });

      mm.add("(min-width: 1024px) and (pointer: fine)", () => {
        const tweens = gsap.utils.toArray("[data-parallax]").map((el) => {
          const speed = parseFloat(el.getAttribute("data-parallax") || "0.15");
          return gsap.to(el, {
            yPercent: -speed * 100,
            ease: "none",
            scrollTrigger: {
              trigger: el.closest("section") || el,
              start: "top bottom",
              end: "bottom top",
              scrub: 1.2,
            },
          });
        });
        return () => tweens.forEach((tw) => tw.scrollTrigger && tw.scrollTrigger.kill());
      });

      var anchorHandler = onAnchorClick;
    } catch (err) {
      console.error("GsapEffects init failed, native scroll remains active", err);
    }

    const onLoad = () => ScrollTrigger.refresh();
    window.addEventListener("load", onLoad);
    return () => {
      window.removeEventListener("load", onLoad);
      if (typeof anchorHandler !== "undefined") {
        document.removeEventListener("click", anchorHandler);
      }
      mm.revert();
      if (ctx) ctx.revert();
      if (lenis) lenis.destroy();
    };
  }, []);

  return (
    <div data-testid="scroll-progress" className="fixed top-0 inset-x-0 z-[60] h-[3px] pointer-events-none">
      <div data-progress-bar className="h-full w-full origin-left scale-x-0 bg-gradient-to-r from-gold via-[var(--border-soft)] to-copper" />
    </div>
  );
}
