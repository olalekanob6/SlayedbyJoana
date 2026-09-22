import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [error, setError] = useState("");
  useEffect(() => {
    const sessionId = new URLSearchParams(window.location.hash.replace(/^#/, "")).get("session_id");
    if (!sessionId) return navigate("/");
    api.post("/auth/google/session", { session_id: sessionId }).then((r) => { setUser(r.data); navigate("/"); }).catch(() => setError("No se pudo validar la sesión."));
  }, [navigate, setUser]);
  return <div className="min-h-screen grid place-items-center p-6">{error || "Validando sesión…"}</div>;
}
