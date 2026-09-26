import { useEffect, useRef, useState } from "react";
import { ImagePlus, Trash2, Upload, X, Edit3 } from "lucide-react";
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
  const [editingCaption, setEditingCaption] = useState(null);

  const allowedTypes = new Set([
    "image/jpeg", "image/png", "image/webp", "image/gif",
    "video/mp4", "video/quicktime", "video/webm",
  ]);

  const chooseFile = (file) => {
    if (!file) return;
    if (!allowedTypes.has(file.type)) {
      toast.error("Formato no permitido. Usa JPG, PNG, WEBP, GIF, MP4, MOV o WEBM.");
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelected(file);
    setPreviewUrl(URL.createObjectURL(file));
    setCaptionEs("");
    setCaptionEn("");
  };

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

  const onInputChange = (event) => chooseFile(event.target.files?.[0]);

  const clearSelection = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelected(null);
    setPreviewUrl("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const upload = async (event) => {
    event.preventDefault();
    if (!selected) return toast.error("Elige una foto o vídeo");
    if (!captionEs.trim() && !captionEn.trim()) {
      return toast.error("Añade al menos un caption (español o inglés)");
    }
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", selected);
      body.append("caption_es", captionEs);
      body.append("caption_en", captionEn);
      const response = await api.post("/admin/media", body, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setItems((current) => [response.data, ...current]);
      toast.success("Foto subida correctamente");
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

  const startEditCaption = (item) => setEditingCaption(item.id);
  const saveCaption = async (item, es, en) => {
    try {
      await api.patch(`/admin/media/${encodeURIComponent(item.id)}`, { caption_es: es, caption_en: en });
      setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, caption_es: es, caption_en: en } : i));
      toast.success("Caption actualizado");
      setEditingCaption(null);
    } catch (error) {
      toast.error(formatApiError(error));
    }
  };

  return (
    <section data-testid="admin-gallery-panel" className="space-y-6 max-w-full">
      {/* Upload area */}
      <div className="rounded-2xl border border-[var(--border-soft)] bg-white p-4 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display text-base sm:text-xl font-bold flex items-center gap-2">
              <ImagePlus className="h-5 w-5 text-gold" /> Añadir a la galería
            </h2>
            <p className="text-xs sm:text-sm text-[var(--muted-text)] mt-0.5">
              Sube fotos o vídeos. Los captions aparecen debajo de cada imagen en la web.
            </p>
          </div>
        </div>

        <form onSubmit={upload} className="space-y-4">
          {/* Hidden file input */}
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/quicktime,video/webm"
            onChange={onInputChange}
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
          />

          {/* Drop zone + select button */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); chooseFile(e.dataTransfer.files?.[0]); }}
            className="rounded-2xl border-2 border-dashed border-[var(--border-soft)] p-4 sm:p-6 text-center hover:border-gold/40 transition-colors bg-[var(--surface-soft)]"
          >
            <button
              type="button"
              data-testid="gallery-select-file"
              onClick={() => inputRef.current?.click()}
              className="rounded-full bg-gold px-6 py-3 text-sm font-bold text-white hover:bg-gold/90 transition-colors min-h-[48px] w-full sm:w-auto"
            >
              <Upload className="h-4 w-4 inline mr-2" />
              Seleccionar archivo
            </button>
            <p className="mt-2 text-xs text-[var(--muted-text)]">o arrastra una foto o vídeo aquí</p>
            <p className="mt-1 text-[10px] text-[var(--muted-text)]">JPG, PNG, WEBP, GIF · MP4, MOV, WEBM</p>
            {selected && (
              <p data-testid="gallery-selected-file" className="mt-3 text-sm font-semibold text-[var(--foreground-strong)]">
                ✓ {selected.name}
              </p>
            )}
          </div>

          {/* Preview */}
          {previewUrl && (
            <div className="relative rounded-xl overflow-hidden border border-[var(--border-soft)] bg-[var(--surface-soft)]">
              <button
                type="button"
                onClick={clearSelection}
                aria-label="Cancelar selección"
                className="absolute right-2 top-2 z-10 rounded-full bg-black/50 p-1.5 min-w-[40px] min-h-[40px] text-white hover:bg-black/70 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
              {selected?.type.startsWith("video/") ? (
                <video src={previewUrl} controls playsInline className="max-h-80 w-full object-contain" />
              ) : (
                <img src={previewUrl} alt="Vista previa" className="max-h-80 w-full object-contain" />
              )}
              <div className="px-3 py-2 bg-white text-xs font-semibold">
                Vista previa
              </div>
            </div>
          )}

          {/* Caption inputs */}
          {selected && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="text-xs font-semibold text-[var(--muted-text)] uppercase tracking-wider block mb-1.5">
                  Caption ES
                </label>
                <input
                  value={captionEs}
                  onChange={(e) => setCaptionEs(e.target.value)}
                  placeholder="Descripción en español..."
                  className="w-full min-h-[44px] rounded-xl border border-[var(--border-soft)] bg-[var(--surface-soft)] px-3 py-2 text-sm focus:border-gold focus:ring-1 focus:ring-gold/30 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[var(--muted-text)] uppercase tracking-wider block mb-1.5">
                  Caption EN
                </label>
                <input
                  value={captionEn}
                  onChange={(e) => setCaptionEn(e.target.value)}
                  placeholder="Description in English..."
                  className="w-full min-h-[44px] rounded-xl border border-[var(--border-soft)] bg-[var(--surface-soft)] px-3 py-2 text-sm focus:border-gold focus:ring-1 focus:ring-gold/30 transition-colors"
                />
              </div>
            </div>
          )}

          {/* Upload button */}
          <button
            type="submit"
            disabled={!selected || uploading || (!captionEs.trim() && !captionEn.trim())}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-gold px-6 py-3 text-sm font-bold text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gold/90 transition-colors min-h-[48px]"
          >
            <Upload className="h-4 w-4" />
            {uploading ? "Subiendo…" : "Subir a la galería"}
          </button>
        </form>
      </div>

      {/* Gallery grid */}
      {loading ? (
        <div className="rounded-2xl border border-[var(--border-soft)] bg-white p-8 text-center">
          <p className="text-sm text-[var(--muted-text)]">Cargando galería…</p>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border-soft)] bg-white p-8 text-center">
          <ImagePlus className="h-8 w-8 text-[var(--border-soft)] mx-auto mb-2" />
          <p className="text-sm text-[var(--muted-text)]">No hay archivos en la galería.</p>
          <p className="text-xs text-[var(--muted-text)] mt-0.5">Sube tu primera foto arriba.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {items.map((item) => (
            <article
              key={item.id}
              className="group overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-white hover:border-gold/30 transition-all"
            >
              {/* Image / video */}
              <div className="aspect-square bg-[var(--surface-soft)] relative overflow-hidden">
                {item.type === "video" ? (
                  <video src={resolveMediaUrl(item.url)} controls className="h-full w-full object-cover" />
                ) : (
                  <img
                    src={resolveMediaUrl(item.url)}
                    alt={item.caption_es || "Galería"}
                    className="h-full w-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                  />
                )}
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                {editingCaption === item.id ? (
                  <div className="absolute inset-0 bg-white/95 flex items-center justify-center p-3">
                    <div className="w-full space-y-2">
                      <input
                        autoFocus
                        value={item.caption_es || ""}
                        onChange={(e) => saveCaption(item, e.target.value, item.caption_en)}
                        placeholder="Caption ES"
                        className="w-full min-h-[40px] rounded-lg border border-[var(--border-soft)] px-2 py-2 text-sm bg-white"
                      />
                      <input
                        value={item.caption_en || ""}
                        onChange={(e) => saveCaption(item, item.caption_es, e.target.value)}
                        placeholder="Caption EN"
                        className="w-full min-h-[40px] rounded-lg border border-[var(--border-soft)] px-2 py-2 text-sm bg-white"
                      />
                      <button
                        onClick={() => setEditingCaption(null)}
                        className="text-xs font-semibold text-gold hover:text-gold/80"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Info */}
              <div className="p-3 space-y-1.5">
                <p className="truncate text-sm font-semibold text-[var(--foreground-strong)]">
                  {item.caption_es || item.caption_en || "Sin caption"}
                </p>
                <p className="text-[10px] text-[var(--muted-text)]">
                  {item.type === "video" ? "Vídeo" : "Foto"} · {new Date(item.created_at).toLocaleDateString("es-ES")}
                </p>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => startEditCaption(item)}
                    className="inline-flex items-center gap-1 rounded-full border border-[var(--border-soft)] px-2 py-1 text-[10px] font-semibold text-[var(--muted-text)] hover:border-gold/40 hover:text-gold transition-colors min-h-[32px] min-w-[32px] justify-center"
                    title="Editar caption"
                  >
                    <Edit3 className="h-3 w-3" />
                    Editar
                  </button>
                  <button
                    type="button"
                    disabled={deleting === item.id}
                    onClick={() => remove(item)}
                    className="inline-flex items-center gap-1 rounded-full border border-red-200 px-2 py-1 text-[10px] font-bold text-red-400 hover:bg-red-400 hover:text-white disabled:opacity-50 transition-colors min-h-[32px] min-w-[32px] justify-center"
                    title="Eliminar"
                  >
                    <Trash2 className="h-3 w-3" />
                    {deleting === item.id ? "…" : "Eliminar"}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
