import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const SECTIONS = [
  "inicio",
  "servicios",
  "galeria",
  "sobre-joana",
  "faq",
  "reservar",
];

export default function ScrollToSection() {
  const { hash } = useLocation();

  useEffect(() => {
    if (!hash) return;
    const id = hash.replace("#", "");
    if (!SECTIONS.includes(id)) return;
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      // Como el header es fixed, offset 80px
      window.scrollBy(0, -80);
    }
  }, [hash]);

  return null;
}
