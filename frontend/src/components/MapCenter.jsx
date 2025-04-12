// components/MapCenter.jsx
import { useMap } from "react-leaflet";
import { useEffect } from "react";

const MapCenter = ({ center }) => {
  const map = useMap();

  useEffect(() => {
    if (center) {
      map.setView(center, 15, { animate: true });
    }
  }, [center]);

  return null;
};

export default MapCenter;
