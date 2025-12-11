"use client";

import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, TileLayer, useMap, Tooltip } from "react-leaflet";
import { useRouter } from "next/navigation";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Component to handle map zoom animation
function MapController({ pins }) {
  const map = useMap();
  const [hasZoomed, setHasZoomed] = useState(false);

  useEffect(() => {
    if (!pins.length || hasZoomed) return;

    // Calculate bounds for all pins
    const bounds = L.latLngBounds(
      pins.map((p) => [Number(p.lat) || 0, Number(p.lng) || 0])
    );

    // Start zoomed out, then animate to the cluster
    const timer = setTimeout(() => {
      map.flyToBounds(bounds, {
        padding: [60, 60],
        duration: 1.5,
        easeLinearity: 0.25,
      });
      setHasZoomed(true);
    }, 300);

    return () => clearTimeout(timer);
  }, [pins, map, hasZoomed]);

  return null;
}

// Individual marker component with hover and click functionality
function LocationMarker({ pin, pinkIcon, onNavigate }) {
  const [isHovered, setIsHovered] = useState(false);

  // Format date if available
  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return null;
    }
  };

  // Get first sketch/image for preview
  const previewImage = pin.sketches?.[0] || pin.images?.[0] || pin.cover_image || null;

  return (
    <Marker
      position={[Number(pin.lat) || 0, Number(pin.lng) || 0]}
      icon={pinkIcon}
      eventHandlers={{
        click: () => {
          if (pin.slug || pin.id) {
            onNavigate(pin.slug || pin.id);
          }
        },
        mouseover: () => setIsHovered(true),
        mouseout: () => setIsHovered(false),
      }}
    >
      <Tooltip
        permanent={isHovered}
        direction="top"
        offset={[0, -15]}
        className="custom-tooltip"
      >
        <div className="flex flex-col gap-2 p-1 min-w-[180px] max-w-[220px]">
          {/* Preview Image */}
          {previewImage && (
            <div className="w-full h-24 rounded-lg overflow-hidden bg-slate-200">
              <img
                src={previewImage}
                alt={pin.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Location Name */}
          <div className="font-bold text-slate-900 text-sm leading-tight">
            {pin.name}
          </div>

          {/* Date and metadata */}
          <div className="flex flex-wrap gap-2 text-xs text-slate-500">
            {pin.created_at && (
              <span className="flex items-center gap-1">
                📅 {formatDate(pin.created_at)}
              </span>
            )}
            {pin.time && (
              <span className="flex items-center gap-1 capitalize">
                🕐 {pin.time}
              </span>
            )}
            {pin.weather && (
              <span className="flex items-center gap-1 capitalize">
                🌤️ {pin.weather}
              </span>
            )}
          </div>

        </div>
      </Tooltip>
    </Marker>
  );
}

export function LeafletOverlay({ pins = [], onClose }) {
  const router = useRouter();

  // Fix default icons (required for Next.js + Leaflet)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (L.Icon?.Default) {
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
        iconUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
        shadowUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
      });
    }
  }, []);

  // Calculate initial center (world view or rough cluster center)
  const initialCenter = useMemo(() => {
    if (!pins.length) return [20, 0];
    const sum = pins.reduce(
      (acc, p) => {
        acc.lat += Number(p.lat) || 0;
        acc.lng += Number(p.lng) || 0;
        return acc;
      },
      { lat: 0, lng: 0 }
    );
    return [sum.lat / pins.length, sum.lng / pins.length];
  }, [pins]);

  // Custom pink marker icon to match globe style with hover animation via CSS
  const pinkIcon = useMemo(() => {
    if (typeof window === "undefined") return null;
    return L.divIcon({
      className: "custom-pin-marker",
      html: `
        <div class="pin-container">
          <div class="pin-dot"></div>
          <div class="pin-pulse"></div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16],
    });
  }, []);

  // Navigate to perspective page
  const handleNavigate = (slugOrId) => {
    onClose(); // Close the overlay first
    router.push(`/perspective/${slugOrId}`);
  };

  return (
    <div className="fixed inset-0 z-[3000] bg-black/80 backdrop-blur-md flex flex-col">
      {/* Custom styles for markers and tooltips */}
      <style jsx global>{`
        .custom-pin-marker {
          background: transparent !important;
          border: none !important;
        }

        .pin-container {
          position: relative;
          width: 32px;
          height: 32px;
          cursor: pointer;
        }

        .pin-dot {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 20px;
          height: 20px;
          background: linear-gradient(135deg, #ff005e, #ff66aa);
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(255, 0, 94, 0.5);
          transition: all 0.3s ease;
          z-index: 2;
        }

        .pin-pulse {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 20px;
          height: 20px;
          background: rgba(255, 0, 94, 0.3);
          border-radius: 50%;
          animation: pulse 2s ease-out infinite;
          z-index: 1;
        }

        .pin-container:hover .pin-dot {
          width: 26px;
          height: 26px;
          box-shadow: 0 4px 16px rgba(255, 0, 94, 0.6);
        }

        .pin-container:hover .pin-pulse {
          animation: pulse-fast 1s ease-out infinite;
        }

        @keyframes pulse {
          0% {
            width: 20px;
            height: 20px;
            opacity: 0.6;
          }
          100% {
            width: 50px;
            height: 50px;
            opacity: 0;
          }
        }

        @keyframes pulse-fast {
          0% {
            width: 26px;
            height: 26px;
            opacity: 0.8;
          }
          100% {
            width: 60px;
            height: 60px;
            opacity: 0;
          }
        }

        .custom-tooltip {
          background: white !important;
          border: none !important;
          border-radius: 12px !important;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15) !important;
          padding: 0 !important;
          opacity: 1 !important;
        }

        .custom-tooltip .leaflet-tooltip-content {
          margin: 0;
        }

        .custom-tooltip::before {
          border-top-color: white !important;
        }

        .leaflet-tooltip-top:before {
          border-top-color: white !important;
        }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 text-white bg-slate-900/80">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-[#ff005e] to-[#ff66aa] animate-pulse" />
          <div className="text-sm text-white/90 font-medium">
            {pins.length} location{pins.length !== 1 ? "s" : ""} in this cluster
          </div>
        </div>
        <button
          className="border border-cyan-400/40 bg-slate-800 text-white hover:bg-slate-700 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200"
          onClick={onClose}
          type="button"
        >
          Close
        </button>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <MapContainer
          center={initialCenter}
          zoom={2}
          style={{ width: "100%", height: "100%" }}
          scrollWheelZoom={true}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Controller for zoom animation */}
          <MapController pins={pins} />

          {/* Markers with hover and click */}
          {pins.map((p, idx) => (
            <LocationMarker
              key={p.id || p.slug || `${p.lat}-${p.lng}-${idx}`}
              pin={p}
              pinkIcon={pinkIcon}
              onNavigate={handleNavigate}
            />
          ))}
        </MapContainer>

        {/* Instructions overlay */}
        <div className="absolute bottom-4 left-4 bg-slate-900/90 backdrop-blur-sm text-white/90 text-xs px-4 py-2 rounded-full flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-gradient-to-r from-[#ff005e] to-[#ff66aa]" />
          Hover for preview • Click to open perspective
        </div>
      </div>
    </div>
  );
}
