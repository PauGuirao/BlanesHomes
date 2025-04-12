import chroma from "chroma-js";

export const getColorScale = (min, max) =>
  chroma.scale(["green", "yellow", "orange", "red"]).domain([min, max]);

export const getColor = (precio, colorScale) => colorScale(precio).hex();

export const getValoracionScale = (min, max) =>
  chroma
    .scale(["#ffffe0", "#ffc96e", "#ff913a", "#ff4880", "#d10658", "#8b0000"])
    // azul → rojo
    .domain([min, 0, max]); // ajusta según distribución

export const getValoracionColor = (score, min, max) =>
  getValoracionScale(min, max)(score).hex();
