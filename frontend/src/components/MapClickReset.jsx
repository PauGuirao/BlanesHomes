import { useMapEvent } from "react-leaflet";
import L from "leaflet";
import { zonas } from "../data/zonas";

function MapClickReset({ zonaSeleccionada, onOutsideClick }) {
  useMapEvent("click", (e) => {
    if (!zonaSeleccionada) return;

    const clickedPoint = L.latLng(e.latlng.lat, e.latlng.lng);

    const isInsideZona = Object.values(zonas).some((coords) => {
      const latlngs = coords.map(([lat, lng]) => L.latLng(lat, lng));
      return L.polygon(latlngs).getBounds().contains(clickedPoint);
    });

    if (!isInsideZona) {
      onOutsideClick();
    }
  });

  return null;
}

export default MapClickReset;
