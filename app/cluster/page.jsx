"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import locations from "../../data/locations.json";

// Fix for default marker icons in Next.js
if (typeof window !== "undefined") {
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

function ClusterMapContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const locationsParam = searchParams.get("locations");

  // Parse location slugs and find matching locations
  const clusterLocations = useMemo(() => {
    if (!locationsParam) return [];
    const slugs = locationsParam.split(",");
    return locations.filter((loc) => slugs.includes(loc.slug));
  }, [locationsParam]);

  // Calculate center point for the map
  const center = useMemo(() => {
    if (clusterLocations.length === 0) return [0, 0];
    const avgLat =
      clusterLocations.reduce((sum, loc) => sum + loc.lat, 0) /
      clusterLocations.length;
    const avgLng =
      clusterLocations.reduce((sum, loc) => sum + loc.lng, 0) /
      clusterLocations.length;
    return [avgLat, avgLng];
  }, [clusterLocations]);

  if (!locationsParam || clusterLocations.length === 0) {
    return (
      <div style={{ padding: 40 }}>
        <h1>No locations found</h1>
        <button onClick={() => router.push("/")} style={{ marginTop: 20 }}>
          Back to Globe
        </button>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: "100vh", position: "relative" }}>
      {/* Header */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          background: "rgba(0, 0, 0, 0.8)",
          color: "white",
          padding: "15px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2 style={{ margin: 0 }}>
          {clusterLocations.length} Location
          {clusterLocations.length > 1 ? "s" : ""} in Cluster
        </h2>
        <button
          onClick={() => router.push("/")}
          style={{
            padding: "8px 16px",
            background: "#ff005e",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          Back to Globe
        </button>
      </div>

      {/* Leaflet Map */}
      <MapContainer
        center={center}
        zoom={6}
        style={{ width: "100%", height: "100vh", zIndex: 1 }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {clusterLocations.map((location) => (
          <Marker key={location.slug} position={[location.lat, location.lng]}>
            <Popup>
              <div>
                <h3 style={{ margin: "0 0 10px 0" }}>{location.name}</h3>
                <p style={{ margin: "0 0 10px 0" }}>{location.description}</p>
                <button
                  onClick={() => router.push(`/place/${location.slug}`)}
                  style={{
                    padding: "6px 12px",
                    background: "#ff005e",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "12px",
                  }}
                >
                  View Details
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

export default function ClusterMapPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40 }}>Loading map...</div>}>
      <ClusterMapContent />
    </Suspense>
  );
}

