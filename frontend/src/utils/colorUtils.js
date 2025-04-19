// src/utils/colorUtils.js
import chroma from "chroma-js";

// --- Price scale utils ---
const DEFAULT_PRICE_COLORS = ["green", "yellow", "orange", "red"];

/**
 * Create a chroma-js scale for price coloring based on percentile domain.
 * @param {number[]} prices - Array of numeric prices.
 * @param {object} options
 * @param {[number,number]} options.percentiles - Lower and upper percentile (0-1).
 * @param {string[]} options.colors - Array of color stops.
 * @returns {(value:number) => chroma.Color} chroma scale function.
 */
export function createPriceScale(
  prices,
  { percentiles = [0.05, 0.95], colors = DEFAULT_PRICE_COLORS } = {}
) {
  if (!prices || prices.length === 0) {
    // fallback gray scale
    return () => chroma("#ccc");
  }
  const sorted = [...prices].sort((a, b) => a - b);
  const min = sorted[Math.floor(sorted.length * percentiles[0])];
  const max = sorted[Math.floor(sorted.length * percentiles[1])];
  const scale = chroma.scale(colors).domain([min, max]);
  
  // Create a clamped version of the scale
  return (value) => {
    if (value <= min) return scale(min);
    if (value >= max) return scale(max);
    return scale(value);
  };
}

/**
 * Get hex color for a given price using a prepared scale.
 * @param {number} price
 * @param {(value:number) => chroma.Color} scale
 * @returns {string} hex color
 */
export function getPriceColor(price, scale) {
  return scale(price).hex();
}


// --- Valoración scale utils ---
const DEFAULT_VALOR_COLORS = [
  "#ffffe0", "#ffc96e", "#ff913a", "#ff4880", "#d10658", "#8b0000"
];

/**
 * Create a chroma-js scale for rating scores.
 * @param {number[]} scores - Array of numeric scores (can include negatives).
 * @param {object} options
 * @param {string[]} options.colors - Color stops.
 * @returns {(value:number) => chroma.Color} chroma scale function.
 */
export function createValorScale(
  scores,
  { colors = DEFAULT_VALOR_COLORS } = {}
) {
  if (!scores || scores.length === 0) {
    return () => chroma("#ccc");
  }
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const scale = chroma.scale(colors).domain([min, 0, max]);
  
  // Create a clamped version of the scale
  return (value) => {
    if (value <= min) return scale(min);
    if (value >= max) return scale(max);
    return scale(value);
  };
}

/**
 * Get hex color for a given rating score using a prepared scale.
 * @param {number} score
 * @param {(value:number) => chroma.Color} scale
 * @returns {string}
 */
export function getValorColor(score, scale) {
  return scale(score).hex();
}


// --- Agency color utils ---
const PRIVATE_SELLER_COLOR = '#4ECDC4';
const agencyPalette = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFD93D',
  '#6C5B7B', '#C06C84', '#F67280', '#F8B195', '#355C7D',
  '#2A363B', '#E84A5F', '#99B898', '#FECEA8', '#FF847C'
];

/**
 * Simple string hash to index into palette deterministically.
 */
function _stringHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Get a consistent color for an agency name.
 * Privates use a fixed color; others are hashed into a palette.
 * @param {string} agency
 * @returns {string}
 */
export function getAgencyColor(agency) {
  if (agency.startsWith('particular_')) {
    return PRIVATE_SELLER_COLOR;
  }
  const idx = _stringHash(agency) % agencyPalette.length;
  return agencyPalette[idx];
}
