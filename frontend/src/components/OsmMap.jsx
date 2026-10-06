import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { CATEGORY_META } from "@/lib/api";

const UNIB_CENTER = { lat: -3.7588, lng: 102.2716 };

function pinIcon(color, selected) {
  const size = selected ? 38 : 30;
  return L.divIcon({
    className: "",
    iconSize: [size, size + 8],
    iconAnchor: [size / 2, size + 8],
    html: `<div style="display:flex;flex-direction:column;align-items:center;filter:drop-shadow(0 2px 4px rgba(0,0,0,.35))">
      <div style="width:${size}px;height:${size}px;border-radius:9999px;background:${color};border:2px solid #fff;display:flex;align-items:center;justify-content:center">
        <div style="width:${size / 3}px;height:${size / 3}px;border-radius:9999px;background:#fff"></div>
      </div>
      <div style="width:10px;height:10px;background:${color};transform:rotate(45deg);margin-top:-6px"></div>
    </div>`,
  });
}

/**
 * Peta OpenStreetMap (tanpa API key). Dipakai otomatis bila Google Maps API key belum diatur.
 * Props sama dengan FacilityMap: facilities, onSelect, center, zoom, height, selectedId.
 */
export function OsmMap({ facilities = [], onSelect, center, zoom = 15, height = "100%", selectedId }) {
  const elRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    const c = center || UNIB_CENTER;
    const map = L.map(elRef.current, { center: [c.lat, c.lng], zoom, scrollWheelZoom: !!onSelect });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    const t = setTimeout(() => map.invalidateSize(), 100);
    return () => { clearTimeout(t); map.remove(); mapRef.current = null; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Marker per fasilitas (warna sesuai kategori).
  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    layer.clearLayers();
    facilities.forEach((f) => {
      if (typeof f.latitude !== "number" || typeof f.longitude !== "number") return;
      const meta = CATEGORY_META[f.category] || CATEGORY_META.Lainnya;
      L.marker([f.latitude, f.longitude], { icon: pinIcon(meta.color, f.id === selectedId), title: f.name, zIndexOffset: f.id === selectedId ? 1000 : 0 })
        .on("click", () => onSelectRef.current && onSelectRef.current(f))
        .bindTooltip(f.name, { direction: "top", offset: [0, -40] })
        .addTo(layer);
    });
  }, [facilities, selectedId]);

  // Sesuaikan tampilan agar semua marker terlihat (halaman peta).
  useEffect(() => {
    const map = mapRef.current;
    if (!map || center || facilities.length < 2) return;
    const pts = facilities.filter((f) => typeof f.latitude === "number").map((f) => [f.latitude, f.longitude]);
    if (pts.length > 1) map.fitBounds(pts, { padding: [40, 40], maxZoom: 17 });
  }, [facilities, center]);

  // Fokus ke fasilitas yang dipilih.
  useEffect(() => {
    const f = facilities.find((x) => x.id === selectedId);
    if (f && mapRef.current) mapRef.current.panTo([f.latitude, f.longitude]);
  }, [selectedId]); // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={elRef} className="isolate w-full h-full min-h-[300px]" style={{ height }} data-testid="osm-map" />;
}
