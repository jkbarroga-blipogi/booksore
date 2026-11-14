export function formatPrice(priceCents) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format((priceCents ?? 0) / 100);
}

const COVER_PALETTES = [
  { bg: "#1b4332", spine: "#112a1f", text: "#f7f3eb", accent: "#d9b977" },
  { bg: "#5c2d1f", spine: "#3f1d13", text: "#fdf6ec", accent: "#e8b474" },
  { bg: "#27374d", spine: "#192534", text: "#f4f6f8", accent: "#c5d1eb" },
  { bg: "#4a3f35", spine: "#2f2720", text: "#f9f5ef", accent: "#d4a373" },
  { bg: "#2d4a53", spine: "#1d3238", text: "#f2f7f7", accent: "#b8d8d8" },
];

export function getCoverPalette(seedText = "") {
  let hash = 0;
  for (let i = 0; i < seedText.length; i += 1) {
    hash = (hash * 31 + seedText.charCodeAt(i)) >>> 0;
  }
  return COVER_PALETTES[hash % COVER_PALETTES.length];
}
