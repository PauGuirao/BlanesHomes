// src/components/MapEffect.jsx
import { useMap } from "react-leaflet";
import { useEffect } from "react";

/**
 * Centers the map on `center` at `zoom`, optionally shifted
 * by `offset` pixels [x, y], or fits it to `bounds`.
 */
export default function MapCenter({
  center,        // [lat, lng]
  zoom = 15,     // leafet zoom level
  bounds,        // array of [lat, lng] to fitBounds
  padding = [20, 20],
  animate = true,
  offset = [0, 0]  // [x, y] pixel offset
}) {
  const map = useMap();

  useEffect(() => {
    if (bounds && bounds.length) {
      map.fitBounds(bounds, { paddingTopLeft:[-500, 50], maxZoom:14, animate: true});
    } else if (center) {
      // convert desired center to container pixels
      const point = map.latLngToContainerPoint(center);
      // apply offset (negative x to shift left)
      point.x += offset[0];
      point.y += offset[1];
      // convert back to geo coords
      const adjLatLng = map.containerPointToLatLng(point);
      map.flyTo(adjLatLng, zoom, { animate });
    }
  }, [center, bounds, offset, zoom, padding, animate, map]);

  return null;
}
