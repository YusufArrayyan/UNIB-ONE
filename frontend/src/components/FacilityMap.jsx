import { APIProvider, Map, AdvancedMarker } from "@vis.gl/react-google-maps";
import { CATEGORY_META } from "@/lib/api";
import { MapPin } from "lucide-react";

const UNIB_CENTER = { lat: -3.7588, lng: 102.2716 };
const API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

function Pin({ color }) {
  return (
    <div className="relative -translate-y-1/2" style={{ transform: "translate(-50%,-100%)" }}>
      <div className="w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-2 border-white"
        style={{ background: color }}>
        <MapPin className="w-4 h-4 text-white" />
      </div>
      <div className="w-2 h-2 rotate-45 -mt-1 mx-auto" style={{ background: color }} />
    </div>
  );
}

/**
 * facilities with lat/lng. onSelect(facility) when marker clicked.
 * height full string. single facility -> pass one item.
 */
export function FacilityMap({ facilities = [], onSelect, center, zoom = 15, height = "100%", selectedId }) {
  if (!API_KEY || API_KEY === "YOUR_GOOGLE_MAPS_API_KEY") {
    return (
      <div className="w-full h-full min-h-[300px] flex items-center justify-center bg-slate-100 rounded-2xl text-slate-500 text-sm">
        Google Maps API key belum dikonfigurasi.
      </div>
    );
  }
  return (
    <APIProvider apiKey={API_KEY}>
      <Map
        style={{ width: "100%", height }}
        defaultCenter={center || UNIB_CENTER}
        defaultZoom={zoom}
        mapId="unib-one-map"
        gestureHandling="greedy"
        disableDefaultUI={false}
        mapTypeControl={false}
        streetViewControl={false}
        fullscreenControl={false}
      >
        {facilities.map((f) => {
          const meta = CATEGORY_META[f.category] || CATEGORY_META.Lainnya;
          return (
            <AdvancedMarker key={f.id} position={{ lat: f.latitude, lng: f.longitude }}
              onClick={() => onSelect && onSelect(f)}>
              <div className={selectedId === f.id ? "scale-125 transition-transform" : "transition-transform hover:scale-110"}>
                <Pin color={meta.color} />
              </div>
            </AdvancedMarker>
          );
        })}
      </Map>
    </APIProvider>
  );
}
