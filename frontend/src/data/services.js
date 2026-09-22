export const SERVICE_CATEGORIES = ["mujer", "hombre", "extras"];

export const SIZES = ["Pequeño", "S.Mediano", "Mediano", "Grande"];

export const EXTRAS = [
  { id: "extra-pequeno", nameEs: "Extra pequeño", nameEn: "Extra small", price: 20 },
  { id: "extra-largura", nameEs: "Extra largura", nameEn: "Extra length", price: 20 },
  { id: "rizos-puntas", nameEs: "Rizos en las puntas", nameEn: "Curled ends", price: 5 },
  { id: "kanekalon-lisa", nameEs: "Kanekalon lisa", nameEn: "Straight kanekalon", price: 6, qty: true },
  { id: "kanekalon-rizada", nameEs: "Kanekalon rizada", nameEn: "Curly kanekalon", price: 15, qty: true },
  { id: "kanekalon-afro", nameEs: "Kanekalon afro", nameEn: "Afro kanekalon", price: 15, qty: true },
  { id: "diseno", nameEs: "Diseño personalizado (zig-zag, corazones...)", nameEn: "Custom design (zig-zag, hearts...)", price: 5 },
  { id: "estilizar", nameEs: "Estilizado", nameEn: "Styling", price: 10 },
];

const BRAID_EXTRAS = ["extra-pequeno", "extra-largura", "rizos-puntas", "kanekalon-lisa", "kanekalon-rizada", "kanekalon-afro"];
const FULL_EXTRAS = ["kanekalon-lisa", "kanekalon-rizada", "kanekalon-afro", "rizos-puntas", "diseno"];
const MEN_BRAID_EXTRAS = ["diseno", "kanekalon-lisa", "kanekalon-rizada"];
const LOCS_EXTRAS = ["estilizar"];

export const SERVICES = {
  mujer: [
    {
      id: "knotless",
      name: "Knotless",
      type: "matrix",
      lengths: { Hombro: [65, 55, 50, 45], Espalda: [75, 65, 60, 55], Cintura: [85, 75, 70, 65], Glúteos: [95, 85, 80, 75] },
      base: 45,
      duration: "3 – 5h",
      extras: BRAID_EXTRAS,
      descEs: "Trenzas sin nudo ultraligeras. Precio según largura y grosor.",
      descEn: "Ultra-light knotless braids. Price by length and thickness.",
    },
    {
      id: "boho",
      name: "Box Braids",
      key: "Box Braids Mujer",
      type: "matrix",
      lengths: { Hombro: [55, 50, 45, 40], Espalda: [65, 60, 55, 50], Cintura: [75, 70, 65, 60], Glúteos: [85, 80, 75, 70] },
      base: 40,
      duration: "3 – 5h",
      extras: BRAID_EXTRAS,
      descEs: "Estilo atemporal con divisiones perfectas y acabados duraderos.",
      descEn: "Timeless style with perfect parting and long-lasting finishes.",
    },
    {
      id: "boho-style",
      name: "Boho",
      type: "matrix",
      lengths: { Hombro: [75, 65, 60, 55], Espalda: [85, 75, 70, 65], Cintura: [95, 85, 80, 75], Glúteos: [105, 95, 90, 85] },
      base: 55,
      duration: "3 – 5h",
      extras: BRAID_EXTRAS,
      descEs: "Knotless con mechones sueltos ondulados, efecto boho.",
      descEn: "Knotless with wavy loose strands, boho effect.",
    },
    {
      id: "boho-twist",
      name: "Boho Twist",
      type: "matrix",
      lengths: { Hombro: [65, 60, 55, 50], Espalda: [75, 70, 65, 60], Cintura: [85, 80, 75, 70], Glúteos: [95, 90, 85, 80] },
      base: 50,
      duration: "3 – 5h",
      extras: BRAID_EXTRAS,
      descEs: "Twist con acabado boho, textura suave y con movimiento.",
      descEn: "Twists with a boho finish, soft texture and movement.",
    },
    {
      id: "twist",
      name: "Twist",
      type: "matrix",
      lengths: { Hombro: [55, 50, 45, 40], Espalda: [65, 60, 55, 50], Cintura: [75, 70, 65, 60], Glúteos: [85, 80, 75, 70] },
      base: 40,
      duration: "3 – 4.5h",
      extras: BRAID_EXTRAS,
      descEs: "Torcidos definidos con textura suave y movimiento natural.",
      descEn: "Defined twists with soft texture and natural movement.",
    },
    {
      id: "miracle-k",
      name: "Miracle K",
      type: "sizes",
      sizePrices: [120, 110, 100, 90],
      base: 90,
      duration: "4 – 6h",
      extras: FULL_EXTRAS,
      descEs: "El acabado premium de la casa: máxima densidad y definición.",
      descEn: "Our premium finish: maximum density and definition.",
    },
    {
      id: "b-locs",
      name: "B.Locs",
      type: "sizes",
      sizePrices: [150, 120, 100, 80],
      base: 80,
      duration: "4 – 6h",
      extras: FULL_EXTRAS,
      descEs: "Locs estilo bohemio con acabado deshecho super chic.",
      descEn: "Boho-style locs with a super chic distressed finish.",
    },
    {
      id: "cornrows-mujer",
      name: "Cornrows",
      type: "options",
      options: [
        { label: "Trenzas boxeadoras", price: 30 },
        { label: "4-6 cornrows", price: 45 },
        { label: "8-10 cornrows", price: 50 },
        { label: "+10 cornrows", price: 65 },
        { label: "Trenzas para peluca", price: 15 },
      ],
      base: 30,
      duration: "1 – 3h",
      extras: ["diseno", "kanekalon-lisa", "kanekalon-rizada"],
      descEs: "Cornrows pegados con particiones limpias y diseños a tu gusto.",
      descEn: "Sleek cornrows with clean parting and custom designs.",
    },
    {
      id: "wig-inst",
      name: "Wig Inst",
      type: "options",
      options: [
        { label: "Instalación completa", price: 50 },
        { label: "Instalación + estilo", price: 35 },
      ],
      base: 35,
      duration: "1.5 – 2h",
      extras: [],
      descEs: "Base trenzada y acabado profesional para tu peluca.",
      descEn: "Braided base and professional finish for your wig.",
    },
    {
      id: "fulani",
      name: "Fulani",
      type: "simple",
      base: 85,
      fromPrice: true,
      duration: "4 – 5.5h",
      extras: FULL_EXTRAS,
      descEs: "Cornrows frontales con trenzas sueltas, abalorios y diseños.",
      descEn: "Front cornrows with loose braids, beads and designs.",
    },
    {
      id: "coletas",
      name: "Coletas",
      type: "simple",
      base: 25,
      fromPrice: true,
      duration: "1 – 2h",
      extras: FULL_EXTRAS,
      descEs: "Coletas pulidas y con estilo para el día a día o eventos.",
      descEn: "Sleek, stylish ponytails for everyday or events.",
    },
    {
      id: "coleta-trenzada",
      name: "Coleta Trenzada",
      type: "simple",
      base: 70,
      fromPrice: true,
      duration: "2 – 3h",
      extras: FULL_EXTRAS,
      descEs: "Coleta alta trenzada con acabado impecable.",
      descEn: "High braided ponytail with a flawless finish.",
    },
    {
      id: "crochet",
      name: "Crochet",
      type: "simple",
      base: 85,
      fromPrice: true,
      duration: "2 – 3.5h",
      extras: FULL_EXTRAS,
      descEs: "Instalación crochet rápida con resultado natural.",
      descEn: "Quick crochet install with a natural result.",
    },
    {
      id: "half-up",
      name: "Half Up",
      type: "simple",
      base: 45,
      fromPrice: true,
      duration: "1.5 – 2.5h",
      extras: FULL_EXTRAS,
      descEs: "Media melena recogida con trenzas, look favorecedor.",
      descEn: "Half-up braided style, flattering look.",
    },
  ],
  hombre: [
    {
      id: "box-braids-h",
      name: "Box Braids",
      type: "options",
      options: [
        { label: "Pequeño", price: 40 },
        { label: "Mediano", price: 35 },
        { label: "Grande", price: 30 },
      ],
      base: 30,
      duration: "1.5 – 2.5h",
      extras: MEN_BRAID_EXTRAS,
      descEs: "Trenzas con particiones limpias y urbanas.",
      descEn: "Braids with clean, urban parting.",
    },
    {
      id: "twist-h",
      name: "Twist",
      key: "Twist Hombre",
      type: "options",
      options: [
        { label: "Pequeño", price: 35 },
        { label: "Mediano", price: 30 },
        { label: "Grande", price: 25 },
      ],
      base: 25,
      duration: "1.5 – 2.5h",
      extras: MEN_BRAID_EXTRAS,
      descEs: "Torcidos definidos con movimiento natural.",
      descEn: "Defined twists with natural movement.",
    },
    {
      id: "barrel",
      name: "Barrel",
      type: "options",
      options: [
        { label: "4 barrel", price: 35 },
        { label: "6 barrel", price: 40 },
        { label: "+8 barrel", price: 45 },
      ],
      base: 35,
      duration: "1 – 2h",
      extras: MEN_BRAID_EXTRAS,
      descEs: "Diseños urbanos en relieve con forma.",
      descEn: "Raised urban designs with shape.",
    },
    {
      id: "cornrows-h",
      name: "Cornrows",
      key: "Cornrows Hombre",
      type: "options",
      options: [
        { label: "4 cornrows", price: 30 },
        { label: "6 cornrows", price: 35 },
        { label: "+8 cornrows", price: 40 },
      ],
      base: 30,
      duration: "1 – 2h",
      extras: MEN_BRAID_EXTRAS,
      descEs: "Líneas limpias pegadas al cuero cabelludo.",
      descEn: "Clean lines close to the scalp.",
    },
    {
      id: "2strand",
      name: "2 Strand Tw",
      key: "2 Strand Twist",
      type: "options",
      options: [
        { label: "Pequeño", price: 45 },
        { label: "Mediano", price: 40 },
        { label: "Grande", price: 35 },
      ],
      base: 35,
      duration: "1.5 – 2.5h",
      extras: MEN_BRAID_EXTRAS,
      descEs: "Twist de dos cabos, textura definida.",
      descEn: "Two-strand twists, defined texture.",
    },
    {
      id: "fulani-h",
      name: "Fulani",
      key: "Fulani Hombre",
      type: "simple",
      base: 45,
      duration: "1.5 – 2.5h",
      extras: ["diseno", "kanekalon-lisa"],
      descEs: "Fulani braids con estilo urbano.",
      descEn: "Fulani braids with urban style.",
    },
    {
      id: "retwist-peine",
      name: "Retwist (Peine)",
      type: "options",
      options: [
        { label: "40-60 locs", price: 30 },
        { label: "60-80 locs", price: 40 },
        { label: "80-100 locs", price: 50 },
        { label: "+100 locs", price: 60 },
      ],
      base: 30,
      duration: "1.5 – 2.5h",
      extras: LOCS_EXTRAS,
      descEs: "Mantenimiento de raíces limpio y definido con peine.",
      descEn: "Clean, defined root maintenance with comb.",
    },
    {
      id: "retwist-crochet",
      name: "Retwist (Crochet)",
      type: "options",
      options: [
        { label: "40-60 locs", price: 50 },
        { label: "60-80 locs", price: 60 },
        { label: "80-100 locs", price: 70 },
        { label: "+100 locs", price: 80 },
      ],
      base: 50,
      duration: "2 – 3h",
      extras: LOCS_EXTRAS,
      descEs: "Retwist con aguja de crochet, acabado duradero.",
      descEn: "Retwist with crochet needle, long-lasting finish.",
    },
    {
      id: "st-locks",
      name: "St Locks",
      type: "options",
      options: [
        { label: "40-60 locs", price: 50 },
        { label: "60-80 locs", price: 60 },
        { label: "80-100 locs", price: 70 },
        { label: "+100 locs", price: 80 },
      ],
      base: 50,
      duration: "2 – 4h",
      extras: LOCS_EXTRAS,
      descEs: "Starter locs firmes y bien definidos.",
      descEn: "Firm, well-defined starter locs.",
    },
    {
      id: "instant-locs",
      name: "Instant Locs",
      type: "options",
      options: [
        { label: "40-60 locs", price: 60 },
        { label: "60-80 locs", price: 80 },
        { label: "80-100 locs", price: 100 },
        { label: "+100 locs", price: 120 },
      ],
      base: 60,
      duration: "2 – 4h",
      extras: LOCS_EXTRAS,
      descEs: "Creación instantánea de locs con aguja de crochet.",
      descEn: "Instant loc creation with a crochet needle.",
    },
    {
      id: "inst-extension",
      name: "Inst. Extension",
      type: "options",
      options: [
        { label: "40-60 locs", price: 70 },
        { label: "60-80 locs", price: 90 },
        { label: "80-100 locs", price: 110 },
        { label: "+100 locs", price: 130 },
      ],
      base: 70,
      duration: "3 – 5h",
      extras: LOCS_EXTRAS,
      descEs: "Locs instantáneos con extensión para largo inmediato.",
      descEn: "Instant locs with extension for immediate length.",
    },
  ],
  extras: [
    {
      id: "kanekalon-x",
      name: "Kanekalon / Extensión",
      type: "options",
      options: [
        { label: "Lisa", price: 6 },
        { label: "Rizada", price: 15 },
        { label: "Afro", price: 15 },
      ],
      base: 6,
      duration: "",
      extras: [],
      descEs: "Venta directa en el estudio, varios tonos disponibles.",
      descEn: "Sold directly at the studio, several shades available.",
    },
    {
      id: "rizos-puntas-x",
      name: "Rizos en las puntas",
      type: "simple",
      base: 5,
      plusPrice: true,
      duration: "",
      extras: [],
      descEs: "Acabado con rizos en las puntas para tus trenzas.",
      descEn: "Curled ends finish for your braids.",
    },
    {
      id: "extra-size-x",
      name: "Extra pequeño / Extra largura",
      type: "simple",
      base: 20,
      plusPrice: true,
      duration: "",
      extras: [],
      descEs: "Suplemento por grosor extra pequeño o largura extra.",
      descEn: "Surcharge for extra small thickness or extra length.",
    },
    {
      id: "diseno-x",
      name: "Diseño personalizado",
      type: "simple",
      base: 5,
      duration: "",
      extras: [],
      descEs: "Zig-zag, corazones y formas personalizadas.",
      descEn: "Zig-zag, hearts and custom shapes.",
    },
    {
      id: "arreglo-rastas",
      name: "Arreglo de rastas",
      type: "simple",
      base: 3,
      unitPrice: "ud",
      duration: "",
      extras: [],
      descEs: "Reparación de locs dañados o rotos, por unidad.",
      descEn: "Repair of damaged or broken locs, per unit.",
    },
    {
      id: "detox",
      name: "Detox de Locs",
      type: "simple",
      base: 35,
      duration: "45 min",
      extras: [],
      descEs: "Baño purificante profundo para eliminar residuos.",
      descEn: "Deep purifying soak to remove buildup.",
    },
    {
      id: "corte",
      name: "Corte de pelo",
      type: "simple",
      base: 8,
      duration: "15 min",
      extras: [],
      descEs: "Corte y perfilado para un acabado impecable.",
      descEn: "Haircut and line-up for a flawless finish.",
    },
    {
      id: "cerquillo",
      name: "Cerquillo",
      type: "simple",
      base: 5,
      duration: "10 min",
      extras: [],
      descEs: "Limpieza de contornos y cerquillo.",
      descEn: "Edge and hairline clean-up.",
    },
  ],
};

export const getAllServiceOptions = (services = SERVICES) =>
  SERVICE_CATEGORIES.flatMap((cat) =>
    (services[cat] || []).map((s) => ({ id: s.id, name: s.name, key: s.key || s.name, category: cat, service: s }))
  );

export const ALL_SERVICE_OPTIONS = getAllServiceOptions();

export const getServiceFromOptions = (options, value) =>
  (options || []).find((s) => s.id === value || s.name === value)?.service || null;

export const getService = (value) => getServiceFromOptions(ALL_SERVICE_OPTIONS, value);

export const getExtraById = (id, extras = EXTRAS) => extras.find((e) => e.id === id);

export function computePrice(service, length, size, selectedExtras, extrasList = EXTRAS) {
  if (!service) return 0;
  let base = service.base || 0;
  if (service.type === "matrix" && length && size) {
    const idx = SIZES.indexOf(size);
    const row = service.lengths[length];
    if (row && idx >= 0) base = row[idx];
  } else if (service.type === "sizes" && size) {
    const idx = SIZES.indexOf(size);
    if (idx >= 0) base = service.sizePrices[idx];
  } else if (service.type === "options" && length) {
    const opt = service.options.find((o) => o.label === length);
    if (opt) base = opt.price;
  }
  const extrasTotal = (selectedExtras || []).reduce((sum, ex) => {
    const id = typeof ex === "string" ? ex : ex.id;
    const qty = typeof ex === "string" ? 1 : (ex.qty || 1);
    return sum + (getExtraById(id, extrasList)?.price || 0) * qty;
  }, 0);
  return base + extrasTotal;
}

export function applyCatalogConfig(config = {}) {
  const priceBook = config.price_book || {};
  const extrasPrices = config.extras_prices || {};
  const overrides = config.service_overrides || {};

  const services = Object.fromEntries(
    SERVICE_CATEGORIES.map((category) => [
      category,
      (SERVICES[category] || [])
        .map((service, index) => {
          const override = overrides[service.id] || {};
          const key = service.key || service.name;
          const prices = priceBook[key] || {};
          const merged = {
            ...service,
            name: override.name || service.name,
            descEs: override.descEs !== undefined ? override.descEs : service.descEs,
            descEn: override.descEn !== undefined ? override.descEn : service.descEn,
            visible: override.visible !== undefined ? override.visible : true,
            order: override.order !== undefined ? override.order : index,
          };
          if (service.type === "matrix" && prices.lengths) {
            merged.lengths = prices.lengths;
            merged.base = prices.base ?? service.base;
          } else if (service.type === "sizes" && prices.sizes) {
            merged.sizePrices = prices.sizes;
            merged.base = prices.base ?? service.base;
          } else if (service.type === "options" && prices.options) {
            merged.options = service.options.map((option) => ({
              ...option,
              price: prices.options[option.label] ?? option.price,
            }));
            merged.base = prices.base ?? service.base;
          } else if (prices.base !== undefined) {
            merged.base = prices.base;
          }
          return merged;
        })
        .filter((service) => service.visible)
        .sort((a, b) => a.order - b.order),
    ])
  );

  (config.custom_services || []).forEach((custom) => {
    if (!services[custom.category] || custom.visible === false) return;
    const hours = Math.floor((custom.duration_minutes || 60) / 60);
    const minutes = (custom.duration_minutes || 60) % 60;
    services[custom.category].push({
      id: custom.id,
      key: custom.key,
      name: custom.name,
      type: custom.type,
      base: custom.base,
      options: custom.options || [],
      duration: minutes ? `${hours} h ${minutes} min` : `${hours} h`,
      extras: custom.extras || [],
      descEs: custom.descEs || "",
      descEn: custom.descEn || "",
      fromPrice: custom.type === "simple",
      order: custom.order ?? 100,
      custom: true,
    });
    services[custom.category].sort((a, b) => a.order - b.order);
  });

  const extras = EXTRAS.map((extra) => ({
    ...extra,
    price: extrasPrices[extra.id] !== undefined ? extrasPrices[extra.id] : extra.price,
  }));

  return { services, extras };
}
