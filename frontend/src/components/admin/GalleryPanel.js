import { useEffect, useRef, useState } from "react";
import { ImagePlus, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { api, formatApiError, resolveMediaUrl } from "@/lib/api";

export default function GalleryPanel() {
  const inputRef = useRef(null);
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [captionEs, setCaptionEs] = useState("");
  const [captionEn, setCaptionEn] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const response = await api.get("/media");
      setItems(response.data);
    } catch (error) {
      toast.error(formatApiError(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  const chooseFile = (event) => {
    const file = event.target.files?.[0];
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelected(file || null);
    setPreviewUrl(file ? URL.createObjectURL(file) : "");
  };

  const clearSelection = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelected(null);
    setPreviewUrl("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const upload = async (event) => {
    event.preventDefault();
    if (!selected) return toast.error("Elige una foto o vídeo");
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", selected);
      body.append("caption_es", captionEs);
      body.append("caption_en", captionEn);
      const response = await api.post("/admin/media", body, { headers: { "Content-Type": "multipart/form-data" } });
      setItems((current) => [response.data, ...current]);
      toast.success("Foto subida correctamente");
      setCaptionEs("");
      setCaptionEn("");
      clearSelection();
    } catch (error) {
      toast.error(formatApiError(error));
    } finally {
      setUploading(false);
    }
  };

  const remove = async (item) => {
    if (!window.confirm("¿Eliminar este archivo de la galería?")) return;
    setDeleting(item.id);
    try {
      await api.delete(`/admin/media/${encodeURIComponent(item.id)}`);
      setItems((current) => current.filter((entry) => entry.id !== item.id));
      toast.success("Foto eliminada");
    } catch (error) {
      toast.error(formatApiError(error));
    } finally {
      setDeleting("");
    }
  };

  return (
    <section data-testid="admin-gallery-panel" className="space-y-6">
      <div className="rounded-2xl border border-[var(--border-soft)] bg-white p-5 sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-3"><div><h2 className="font-display text-xl font-bold">Galería</h2><p className="text-sm text-[var(--muted-text)]">Fotos y vídeos que aparecen en la galería pública.</p></div><ImagePlus className="h-6 w-6 text-gold" /></div>
        <form onSubmit={upload} className="space-y-4">
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/webm" onChange={chooseFile} className="block w-full text-sm" />
          {previewUrl && <div className="relative max-w-sm overflow-hidden rounded-xl border"><button type="button" onClick={clearSelection} aria-label="Quitar selección" className="absolute right-2 top-2 z-10 rounded-full bg-black/60 p-1 text-white"><X className="h-4 w-4" /></button>{selected?.type.startsWith("video/") ? <video src={previewUrl} controls className="max-h-64 w-full object-contain" /> : <img src={previewUrl} alt="Vista previa" className="max-h-64 w-full object-contain" />}</div>}
          <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold">Caption ES<input value={captionEs} onChange={(e) => setCaptionEs(e.target.value)} className="mt-2 w-full rounded-xl border border-[var(--border-soft)] px-3 py-2 font-normal" /></label><label className="text-sm font-semibold">Caption EN<input value={captionEn} onChange={(e) => setCaptionEn(e.target.value)} className="mt-2 w-full rounded-xl border border-[var(--border-soft)] px-3 py-2 font-normal" /></label></div>
          <button type="submit" disabled={!selected || uploading} className="inline-flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"><Upload className="h-4 w-4" />{uploading ? "Subiendo…" : "Subir archivo"}</button>
        </form>
      </div>
      {loading ? <p className="py-6 text-sm text-[var(--muted-text)]">Cargando galería…</p> : items.length === 0 ? <p className="py-6 text-sm text-[var(--muted-text)]">No hay archivos en la galería.</p> : <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">{items.map((item) => <article key={item.id} className="overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-white"><div className="aspect-square bg-[var(--surface-soft)]">{item.type === "video" ? <video src={resolveMediaUrl(item.url)} controls className="h-full w-full object-cover" /> : <img src={resolveMediaUrl(item.url)} alt={item.caption_es || "Galería"} className="h-full w-full object-cover" />}</div><div className="space-y-2 p-3"><p className="truncate text-sm font-semibold">{item.caption_es || item.caption_en || "Sin caption"}</p><p className="text-xs text-[var(--muted-text)]">{item.type} · {new Date(item.created_at).toLocaleDateString("es-ES")}</p><button type="button" disabled={deleting === item.id} onClick={() => remove(item)} className="inline-flex items-center gap-1 rounded-full border border-red-300 px-3 py-1 text-xs text-red-600 disabled:opacity-50"><Trash2 className="h-3 w-3" />{deleting === item.id ? "Eliminando…" : "Eliminar"}</button></div></article>)}</div>}
    </section>
  );
}
