import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

const Legend = ({ viewMode, color_por_zona, min, max, colorScale }) => {
  const map = useMap();

  useEffect(() => {
    const legend = L.control({ position: "bottomleft" });

    legend.onAdd = function () {
      const div = L.DomUtil.create("div", "custom-legend");

      if (viewMode === "zona") {
        /*
        div.innerHTML = "<b>Zonas</b><br/>";
        for (const zona in color_por_zona) {
          const color = color_por_zona[zona];
          div.innerHTML += `<i style="background:${color}; width: 18px; height: 18px; display: inline-block; margin-right: 6px;"></i>${zona}<br/>`;
        }
          */
      } else if (viewMode === "precio") {
        div.innerHTML = `
          <canvas id="legend-canvas" width="200" height="10"></canvas>
            <div class="legend-labels">
                <span>${min.toLocaleString()} €</span>
                <span>${max.toLocaleString()} €</span>
            </div>
        `;

        setTimeout(() => {
          const canvas = document.getElementById("legend-canvas");
          if (canvas) {
            const ctx = canvas.getContext("2d");
            const scale = colorScale;
            for (let i = 0; i <= canvas.width; i++) {
              const t = i / canvas.width;
              ctx.fillStyle = scale(t * (max - min) + min).hex();
              ctx.fillRect(i, 0, 1, canvas.height);
            }
          }
        }, 0);
      } else if (viewMode === "valoracion") {
        div.innerHTML = `
            <canvas id="valoracion-legend" width="200" height="10"></canvas>
            <div class="legend-labels">
                <span>Infrava</span>
                <span>Justo</span>
                <span>Sobreva</span>
            </div>
        `;

        setTimeout(() => {
          const canvas = document.getElementById("valoracion-legend");
          if (canvas) {
            const ctx = canvas.getContext("2d");
            const scale = colorScale;
            for (let i = 0; i <= canvas.width; i++) {
              const t = i / canvas.width;
              ctx.fillStyle = scale(t * (max - min) + min).hex();
              ctx.fillRect(i, 0, 1, canvas.height);
            }
          }
        }, 0);
      }

      return div;
    };

    legend.addTo(map);
    return () => map.removeControl(legend);
  }, [map, viewMode, color_por_zona, min, max]);

  return null;
};

export default Legend;
