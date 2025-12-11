/**
 * GLOBE COMPONENT WITH CLUSTERED CIRCLE MARKERS + HOVER LIST
 *
 * OPTION A VERSION — NO CODE CHANGES EXCEPT:
 *  - Added Playfair Display font import
 *  - Added Top Title ("Places & Perspectives")
 *  - Added Sub-text
 *  - Added GSAP fade-in animation for the title
 */

"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useEffect, useState } from "react";
import { gsap } from "gsap";
import * as THREE from "three";
import { supabase } from "../lib/supabase";

// UI Components
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Label } from "./ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Toggle } from "./ui/toggle";
import { Toaster } from "./ui/sonner";
import { toast } from "sonner";

// ⭐ NEW — Playfair font added
import { Playfair_Display } from "next/font/google";
const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

// Dynamic Globe
const GlobeGL = dynamic(() => import("react-globe.gl"), { ssr: false });

/* ------------------------------------------------------
   HAVERSINE DISTANCE
------------------------------------------------------ */
function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* ------------------------------------------------------
   CLUSTER POINTS BY DISTANCE
------------------------------------------------------ */
function clusterLocations(locations, thresholdKm = 200) {
  const clusters = [];

  locations.forEach((loc) => {
    let foundCluster = null;

    for (const cluster of clusters) {
      const dist = getDistance(cluster.lat, cluster.lng, loc.lat, loc.lng);
      if (dist < thresholdKm) {
        foundCluster = cluster;
        break;
      }
    }

    if (foundCluster) {
      foundCluster.items.push(loc);
      foundCluster.lat =
        (foundCluster.lat * (foundCluster.items.length - 1) + loc.lat) /
        foundCluster.items.length;
      foundCluster.lng =
        (foundCluster.lng * (foundCluster.items.length - 1) + loc.lng) /
        foundCluster.items.length;
    } else {
      clusters.push({ lat: loc.lat, lng: loc.lng, items: [loc] });
    }
  });

  return clusters;
}

/* ------------------------------------------------------
   MAIN COMPONENT
------------------------------------------------------ */
export default function Globe() {
  const router = useRouter();

  const globeRef = useRef();
  const containerRef = useRef();

  // ⭐ NEW — Title ref for GSAP animation
  const headerRef = useRef(null);

  const cardRef = useRef();
  const [showForm, setShowForm] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState("");
  const [aboutLocation, setAboutLocation] = useState("");
  const [timeOfDay, setTimeOfDay] = useState("");
  const [weather, setWeather] = useState("");
  const [coverImage, setCoverImage] = useState(null);
  const [sketches, setSketches] = useState([]);
  const [observations, setObservations] = useState([""]);
  const [thoughts, setThoughts] = useState("");

  const [fetchedLocations, setFetchedLocations] = useState([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(true);
  const [locationsError, setLocationsError] = useState(null);
  const [perspectivePins, setPerspectivePins] = useState([]);
  const [isLoadingPins, setIsLoadingPins] = useState(true);
  const [pinsError, setPinsError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const [showOverlayMap, setShowOverlayMap] = useState(false);
  const [overlayPins, setOverlayPins] = useState([]);
  const [zoomLevel, setZoomLevel] = useState(2.5);

  const LeafletOverlay = useMemo(
    () =>
      dynamic(() => import("./LeafletOverlay").then((mod) => mod.LeafletOverlay), {
        ssr: false,
      }),
    []
  );

  /* ------------------------------------------------------
     NEW — GSAP ANIMATION FOR TITLE
  ------------------------------------------------------ */
  useEffect(() => {
    if (!headerRef.current) return;

    gsap.from(headerRef.current, {
      opacity: 0,
      y: -20,
      duration: 1.2,
      ease: "power3.out",
    });
  }, []);

  /* ------------------------------------------------------
     CARD ANIMATION (unchanged)
  ------------------------------------------------------ */
  useEffect(() => {
    if (!cardRef.current) return;

    const ctx = gsap.context(() => {
      gsap.from(cardRef.current, {
        y: 100,
        opacity: 0,
        duration: 1.1,
        ease: "power4.out",
      });

      gsap.fromTo(
        cardRef.current,
        { boxShadow: "0 0 0px rgba(0, 212, 255, 0.0)" },
        {
          boxShadow: "0 0 30px rgba(0, 212, 255, 0.35)",
          duration: 2.2,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        }
      );
    }, cardRef);

    return () => ctx.revert();
  }, []);

  /* ------------------------------------------------------
     FETCH LOCATIONS (unchanged)
  ------------------------------------------------------ */
  useEffect(() => {
    const fetchLocations = async () => {
      setIsLoadingLocations(true);
      setLocationsError(null);

      try {
        const { data, error } = await supabase
          .from("locations")
          .select("name, slug, lat, lng, description, image");

        if (error) {
          setLocationsError(error.message);
          setFetchedLocations([]);
        } else {
          setFetchedLocations(data || []);
        }
      } catch (err) {
        setLocationsError(err.message);
      }

      setIsLoadingLocations(false);
    };

    fetchLocations();
  }, []);

  /* ------------------------------------------------------
     FETCH PERSPECTIVE PINS (unchanged)
  ------------------------------------------------------ */
  useEffect(() => {
    const fetchPins = async () => {
      setIsLoadingPins(true);

      try {
        const { data, error } = await supabase
          .from("perspectives")
          .select(
            "id, place_name, place_lat, place_lng, time_of_day, weather, images, cover_image, sketches, created_at"
          )
          .order("created_at", { ascending: false });

        if (error) {
          setPinsError(error.message);
          setPerspectivePins([]);
        } else {
          const mapped = data.map((p) => ({
            id: p.id,
            name: p.place_name,
            slug: p.id,
            lat: p.place_lat,
            lng: p.place_lng,
            time: p.time_of_day,
            weather: p.weather,
            images: p.images || [],
            cover_image: p.cover_image,
            sketches: p.sketches || [],
            created_at: p.created_at,
          }));

          setPerspectivePins(mapped);
        }
      } catch (err) {
        setPinsError(err.message);
      }

      setIsLoadingPins(false);
    };

    fetchPins();
  }, []);

    /* ------------------------------------------------------
     IMAGE HELPERS (unchanged)
  ------------------------------------------------------ */
  const addImages = (fileList) => {
    if (!fileList?.length) return;
    const file = fileList[0];

    setCoverImage({
      file,
      url: URL.createObjectURL(file),
      id: `${file.name}-${file.size}-${file.lastModified}-${Math.random()
        .toString(36)
        .slice(2)}`,
      name: file.name,
      size: file.size,
    });
  };

  const removeImage = (id) => {
    if (coverImage?.id === id) {
      URL.revokeObjectURL(coverImage.url);
      setCoverImage(null);
    }
  };

  const addSketchImages = (fileList) => {
    if (!fileList?.length) return;

    const newItems = Array.from(fileList).map((file) => ({
      file,
      url: URL.createObjectURL(file),
      id: `${file.name}-${file.size}-${file.lastModified}-${Math.random()
        .toString(36)
        .slice(2)}`,
      name: file.name,
      size: file.size,
    }));

    setSketches((prev) => [...prev, ...newItems]);
  };

  const removeSketch = (id) => {
    setSketches((prev) => {
      const next = prev.filter((img) => img.id !== id);
      const removed = prev.find((img) => img.id === id);
      if (removed) URL.revokeObjectURL(removed.url);
      return next;
    });
  };

  const updateObservation = (idx, value) => {
    setObservations((prev) => {
      const next = [...prev];
      next[idx] = value;
      return next;
    });
  };

  const addObservation = () => {
    setObservations((prev) => [...prev, ""]);
  };

  const removeObservation = (idx) => {
    if (observations.length === 1) return;
    setObservations((prev) => prev.filter((_, i) => i !== idx));
  };

  // Clean URLs on unmount
  useEffect(() => {
    return () => {
      if (coverImage) URL.revokeObjectURL(coverImage.url);
      sketches.forEach((img) => URL.revokeObjectURL(img.url));
    };
  }, [coverImage, sketches]);

  /* ------------------------------------------------------
     CLICK HANDLER FOR MARKERS (unchanged)
  ------------------------------------------------------ */
  const handleMarkerClick = (clusterPoint) => {
    if (clusterPoint.items.length === 1) {
      const place = clusterPoint.items[0];
      if (place.slug) {
        router.push(`/perspective/${place.slug}`);
      } else {
        const details = [
          place.name,
          place.time ? `Time: ${place.time}` : null,
          place.weather ? `Weather: ${place.weather}` : null,
        ]
          .filter(Boolean)
          .join(" • ");

        toast.info(details || place.name);
      }
    } else {
      setOverlayPins(clusterPoint.items);
      setShowOverlayMap(true);
    }
  };

  /* ------------------------------------------------------
     SAVE HANDLER (unchanged)
  ------------------------------------------------------ */
  const handleSave = async () => {
    if (!selectedPlace || !aboutLocation || !timeOfDay || !weather) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSaving(true);

    try {
      const [placeName, lat, lng] = selectedPlace.split("|");

      if (!placeName || !lat || !lng) {
        toast.error("Invalid place selected");
        return;
      }

      // Upload COVER IMAGE
      let coverImageUrl = null;
      if (coverImage?.file) {
        try {
          const ext = coverImage.file.name.split(".").pop();
          const filename = `${Date.now()}_${Math.random()
            .toString(36)
            .substring(7)}.${ext}`;
          const path = `cover-images/${filename}`;

          const { error: uploadError } = await supabase.storage
            .from("perspectives")
            .upload(path, coverImage.file);

          if (!uploadError) {
            const { data } = supabase.storage
              .from("perspectives")
              .getPublicUrl(path);
            coverImageUrl = data.publicUrl;
          }
        } catch (e) {
          console.warn("Cover upload error:", e);
        }
      }

      // Upload SKETCHES
      const sketchUrls = [];
      for (const img of sketches) {
        try {
          const ext = img.file.name.split(".").pop();
          const filename = `${Date.now()}_${Math.random()
            .toString(36)
            .substring(7)}.${ext}`;
          const path = `sketches/${filename}`;

          const { error: uploadError } = await supabase.storage
            .from("perspectives")
            .upload(path, img.file);

          if (!uploadError) {
            const { data } = supabase.storage
              .from("perspectives")
              .getPublicUrl(path);
            sketchUrls.push(data.publicUrl);
          }
        } catch (e) {
          console.warn("Sketch upload error:", e);
        }
      }

      // Insert DB row
      const { data, error } = await supabase
        .from("perspectives")
        .insert({
          place_name: placeName,
          place_lat: parseFloat(lat),
          place_lng: parseFloat(lng),
          about_location: aboutLocation,
          writeup: aboutLocation,
          time_of_day: timeOfDay.toLowerCase(),
          weather: weather.toLowerCase(),
          observations: observations.filter((o) => o.trim() !== ""),
          thoughts,
          cover_image: coverImageUrl,
          sketches: sketchUrls,
        })
        .select();

      if (error) {
        toast.error("Error saving perspective: " + error.message);
        return;
      }

      toast.success("Perspective saved!");

      // Reset
      setSelectedPlace("");
      setAboutLocation("");
      setTimeOfDay("");
      setWeather("");
      setCoverImage(null);
      setSketches([]);
      setObservations([""]);
      setThoughts("");
      setShowForm(false);

      // Add optimistically to pins
      if (data?.length) {
        const p = data[0];
        setPerspectivePins((prev) => [
          {
            id: p.id,
            name: p.place_name,
            slug: p.id,
            lat: p.place_lat,
            lng: p.place_lng,
            time: p.time_of_day,
            weather: p.weather,
            images: p.images || [],
            cover_image: p.cover_image,
            sketches: p.sketches || [],
            created_at: p.created_at,
          },
          ...prev,
        ]);
      }
    } catch (e) {
      toast.error("Unexpected error: " + e.message);
    }

    setIsSaving(false);
  };

  /* ------------------------------------------------------
     CUSTOM CIRCLE MARKER (unchanged)
  ------------------------------------------------------ */
  const createCircleMarker = (clusterPoint) => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 256;

    const ctx = canvas.getContext("2d");
    const count = clusterPoint.items.length;
    const radius = count > 1 ? 80 : 55;
    const color = count > 1 ? "#ff66aa" : "#ff005e";

    ctx.beginPath();
    ctx.arc(128, 128, radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    if (count > 1) {
      ctx.fillStyle = "white";
      ctx.font = "bold 90px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(count), 128, 135);
    }

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
    });

    const sprite = new THREE.Sprite(material);
    sprite.scale.set(10, 10, 1);
    return sprite;
  };

  /* ------------------------------------------------------
     CLUSTER THRESHOLD (unchanged)
  ------------------------------------------------------ */
  const clusterThreshold = useMemo(() => {
    if (zoomLevel > 2) return 200;
    if (zoomLevel > 1.5) return 100;
    if (zoomLevel > 1) return 50;
    if (zoomLevel > 0.5) return 20;
    return 0;
  }, [zoomLevel]);

  const clustered = useMemo(
    () => clusterLocations(perspectivePins, clusterThreshold),
    [perspectivePins, clusterThreshold]
  );

  /* ------------------------------------------------------
     AUTO ROTATION (unchanged)
  ------------------------------------------------------ */
  useEffect(() => {
    let animationFrameId;
    let rotation = 0;
    const speed = 0.1;
    let paused = false;
    let pauseTimeout;
    let cleanup = null;

    const init = () => {
      if (!globeRef.current) return setTimeout(init, 100);

      try {
        rotation = globeRef.current.pointOfView()?.lng || 0;
      } catch {
        rotation = 0;
      }

      const tick = () => {
        if (globeRef.current && !paused) {
          rotation = (rotation + speed) % 360;

          try {
            const pov = globeRef.current.pointOfView();
            globeRef.current.pointOfView(
              {
                lat: pov?.lat || 0,
                lng: rotation,
                altitude: pov?.altitude || 2.5,
              },
              0
            );
          } catch {}
        }

        animationFrameId = requestAnimationFrame(tick);
      };

      tick();

      const pause = () => {
        paused = true;
        clearTimeout(pauseTimeout);
      };

      const resume = () => {
        clearTimeout(pauseTimeout);
        pauseTimeout = setTimeout(() => {
          paused = false;
          try {
            const pov = globeRef.current.pointOfView();
            rotation = pov?.lng || rotation;
          } catch {}
        }, 200);
      };

      const interact = () => {
        pause();
        pauseTimeout = setTimeout(resume, 2000);
      };

      const el = containerRef.current;
      if (el) {
        el.addEventListener("mousedown", interact);
        el.addEventListener("touchstart", interact);
        el.addEventListener("mouseenter", pause);
        el.addEventListener("mouseleave", resume);
      }

      cleanup = () => {
        cancelAnimationFrame(animationFrameId);
        clearTimeout(pauseTimeout);
        if (el) {
          el.removeEventListener("mousedown", interact);
          el.removeEventListener("touchstart", interact);
          el.removeEventListener("mouseenter", pause);
          el.removeEventListener("mouseleave", resume);
        }
      };
    };

    init();

    return () => cleanup && cleanup();
  }, []);

    /* ------------------------------------------------------
     RENDER
  ------------------------------------------------------ */
  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">

      {/* ⭐ NEW — TOP CENTER TITLE + SUBTEXT */}
      <div
        ref={headerRef}
        className="absolute top-8 left-0 z-[2000] text-left px-6"
      >
        <h1
          className={`${playfair.className} text-lg md:text-2xl font-semibold text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.4)]`}
        >
          Places & Perspectives
        </h1>

        {/* <p className="mt-3 text-slate-300 text-base md:text-lg max-w-lg mx-auto opacity-80">
          Discover moments shared across the world.
        </p> */}
      </div>

      {/* 🌍 GLOBE CONTAINER */}
      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
        }}
      >
        <GlobeGL
          ref={globeRef}
          customLayerData={clustered}
          customThreeObject={createCircleMarker}
          customThreeObjectUpdate={(obj, d) => {
            if (!globeRef.current) return;
            const pos = globeRef.current.getCoords(d.lat, d.lng, 0.02);
            obj.position.copy(pos);
          }}
          onCustomLayerClick={handleMarkerClick}
          customLayerLabel={(d) => {
            // Same tooltip function from your original code
            const formatDate = (str) => {
              if (!str) return "";
              const date = new Date(str);
              return date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              });
            };

            if (d.items.length > 1) {
              const previews = d.items.slice(0, 4);
              const remaining = d.items.length - previews.length;

              return `
                <div style="
                  background: rgba(15, 23, 42, 0.95);
                  border-radius: 12px;
                  padding: 10px;
                  min-width: 220px;
                  max-width: 280px;
                  backdrop-filter: blur(12px);
                  border: 1px solid rgba(0, 212, 255, 0.3);
                  box-shadow: 0 0 20px rgba(0,212,255,0.15);
                ">
                  <div style="display:flex; gap:8px; flex-wrap:wrap;">
                    ${previews
                      .map((loc) => {
                        const img =
                          loc.cover_image || loc.sketches?.[0] || null;
                        return `
                          <div style="
                            width: 48%;
                            height: 60px;
                            border-radius: 8px;
                            overflow: hidden;
                            background: rgba(30,41,59,0.6);
                          ">
                            ${
                              img
                                ? `<img src="${img}" style="object-fit:cover;width:100%;height:100%;" />`
                                : `<div style="display:flex;align-items:center;justify-content:center;color:#64748b;font-size:22px;height:100%;">📍</div>`
                            }
                          </div>
                        `;
                      })
                      .join("")}
                  </div>

                  ${
                    remaining > 0
                      ? `<div style="margin-top:6px;text-align:center;color:#94a3b8;font-size:12px;">+${remaining} more</div>`
                      : ""
                  }
                </div>
              `;
            }

            const loc = d.items[0];
            const img =
              loc.cover_image ||
              loc.sketches?.[0] ||
              loc.images?.[0] ||
              null;

            return `
              <div style="
                background: rgba(15,23,42,0.95);
                border-radius: 12px;
                padding: 10px;
                backdrop-filter: blur(12px);
                border: 1px solid rgba(0,212,255,0.3);
                box-shadow: 0 0 20px rgba(0,212,255,0.15);
                width: 200px;
              ">
                ${
                  img
                    ? `<div style="
                        height:96px;
                        border-radius:8px;
                        overflow:hidden;
                        margin-bottom:8px;
                      ">
                        <img src="${img}" style="width:100%;height:100%;object-fit:cover;" />
                      </div>`
                    : ""
                }

                <div style="font-size:14px;font-weight:600;color:white;margin-bottom:4px;">
                  ${loc.name}
                </div>

                <div style="font-size:12px;color:#94a3b8;">
                  ${formatDate(loc.created_at)}
                </div>
              </div>
            `;
          }}
          globeImageUrl="/world.200411.3x5400x2700.jpg"
          backgroundColor="#000"
          showAtmosphere={true}
          atmosphereColor="#00d4ff"
          atmosphereAltitude={0.15}
          onZoom={(pov) => {
            if (pov?.altitude !== undefined) setZoomLevel(pov.altitude);
          }}
        />
      </div>

      {/* 📌 ADD PLACE FORM CARD (unchanged) */}
      <Card
        ref={cardRef}
        className="absolute bottom-6 right-6 z-[1000] w-[320px] border-cyan-400/40 bg-[rgba(12,18,36,0.72)] text-slate-50 shadow-[0_0_24px_rgba(0,212,255,0.15)] backdrop-blur-lg"
      >
        {!showForm && (
          <>
            <CardHeader className="pb-2">
              <CardTitle className="text-cyan-200 text-base font-semibold text-2xl">
                Add your place
              </CardTitle>
              <CardDescription className="text-slate-200/80">
                Drop a pin on the globe and share your perspective or story.
              </CardDescription>
            </CardHeader>
            <CardFooter className="pt-0 px-6 pb-1">
              <Button
                className="w-full bg-gradient-to-r from-[#ff005e] to-[#ff66aa] text-white font-semibold shadow-lg"
                onClick={() => setShowForm(true)}
              >
                Add place and perspective
              </Button>
            </CardFooter>
          </>
        )}

        {showForm && (
          <CardContent className="flex flex-col gap-0 p-0">
            <div className="flex flex-col gap-4 no-scrollbar px-3 pt-4 pb-2" style={{ maxHeight: "calc(70vh - 60px)", overflowY: "auto", scrollbarWidth: "none", msOverflowStyle: "none" }}>
              {locationsError && (
                <div className="rounded-md border border-pink-400/60 bg-pink-500/10 px-3 py-2 text-xs text-pink-100">
                  Failed to load locations: {locationsError}
                </div>
              )}

            {/* 1. Name of the place */}
            <p className="text-cyan-200 text-sm font-semibold">
                We are excited to see your perspective 😁 Drop a pin 📍 and share your story 📝.               
            </p>
            <div className="flex flex-col gap-2">
              <Label className="text-cyan-200 text-sm font-semibold">
                Name of the place
              </Label>
              <Select
                value={selectedPlace}
                onValueChange={(val) => setSelectedPlace(val)}
                disabled={isLoadingLocations || fetchedLocations.length === 0}
              >
                <SelectTrigger className="w-full bg-slate-900 border-cyan-400/40 text-slate-100">
                  <SelectValue
                    placeholder={
                      isLoadingLocations ? "Loading locations..." : "Select a place"
                    }
                  />
                </SelectTrigger>
                <SelectContent className="z-[2000] bg-slate-900 border-cyan-400/40">
                  {fetchedLocations.map((loc) => (
                    <SelectItem
                      key={loc.slug || `${loc.name}-${loc.lat}-${loc.lng}`}
                      value={`${loc.name}|${loc.lat}|${loc.lng}`}
                      className="text-slate-100 focus:bg-slate-800 focus:text-white"
                    >
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 2. Image of your view */}
            <div className="flex flex-col gap-2">
              <Label className="text-cyan-200 text-sm font-semibold">
                Image of your view
              </Label>
              <div className="flex flex-col gap-2 rounded-lg border border-dashed border-cyan-400/40 bg-slate-900/40 p-3 text-sm text-slate-200">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => addImages(e.target.files)}
                  className="border-cyan-400/40 file:text-slate-100"
                />
                {coverImage && (
                  <div className="flex items-center gap-3">
                    <div className="relative h-16 w-16 overflow-hidden rounded-md border border-cyan-400/40 bg-slate-800">
                      <img
                        src={coverImage.url}
                        alt={coverImage.name}
                        className="h-full w-full object-cover"
                      />
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-black/70 text-white hover:bg-black/80"
                        onClick={() => removeImage(coverImage.id)}
                        type="button"
                      >
                        ✕
                      </Button>
                    </div>
                    <div className="text-xs text-cyan-100">{coverImage.name}</div>
                  </div>
                )}
              </div>
            </div>

            {/* 3. Brief Description */}
            <div className="flex flex-col gap-2">
              <Label className="text-cyan-200 text-sm font-semibold">
                Brief Description
              </Label>
              <Textarea
                value={aboutLocation}
                onChange={(e) => setAboutLocation(e.target.value)}
                rows={3}
                placeholder="Describe the place..."
                className="min-h-24 bg-transparent border-cyan-400/40 text-slate-100"
              />
            </div>

            {/* 4. Time of the day */}
            <div className="flex flex-col gap-2">
              <Label className="text-cyan-200 text-sm font-semibold">
                Time of the day
              </Label>
              <div className="flex flex-wrap gap-2">
                {["Morning", "Afternoon", "Evening", "Night"].map((t) => (
                  <Toggle
                    key={t}
                    pressed={timeOfDay === t}
                    onPressedChange={() => setTimeOfDay(t)}
                    variant="outline"
                    size="sm"
                    className={`border-cyan-400/40 text-white ${
                      timeOfDay === t
                        ? "bg-gradient-to-r from-[#ff005e] to-[#ff66aa] text-white border-none"
                        : ""
                    }`}
                  >
                    {t}
                  </Toggle>
                ))}
              </div>
            </div>

            {/* 5. Weather */}
            <div className="flex flex-col gap-2">
              <Label className="text-cyan-200 text-sm font-semibold">Weather</Label>
              <div className="flex flex-wrap gap-2">
                {["Clear", "Cloudy", "Rainy", "Snowy", "Windy"].map((w) => (
                  <Toggle
                    key={w}
                    pressed={weather === w}
                    onPressedChange={() => setWeather(w)}
                    variant="outline"
                    size="sm"
                    className={`border-cyan-400/40 text-white ${
                      weather === w
                        ? "bg-gradient-to-r from-[#ff005e] to-[#ff66aa] text-white border-none"
                        : ""
                    }`}
                  >
                    {w}
                  </Toggle>
                ))}
              </div>
            </div>

            {/* 6. Observations */}
            <div className="flex flex-col gap-2">
              <Label className="text-cyan-200 text-sm font-semibold">
                Observations
              </Label>
              <div className="flex flex-col gap-2">
                {observations.map((obs, idx) => (
                  <div key={`obs-${idx}`} className="flex gap-2">
                    <Input
                      value={obs}
                      onChange={(e) => updateObservation(idx, e.target.value)}
                      placeholder="Add an observation"
                      className="flex-1 bg-transparent border-cyan-400/40 text-slate-100"
                    />
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      className="border border-cyan-400/40 text-white"
                      onClick={() => removeObservation(idx)}
                      type="button"
                    >
                      ✕
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  className="border-cyan-400/40 bg-slate-900 text-white hover:bg-slate-800 hover:text-white"
                  onClick={addObservation}
                  type="button"
                >
                  Add observation
                </Button>
              </div>
            </div>

            {/* 7. Reflections */}
            <div className="flex flex-col gap-2">
              <Label className="text-cyan-200 text-sm font-semibold">Reflections</Label>
              <Input
                value={thoughts}
                onChange={(e) => setThoughts(e.target.value)}
                placeholder="What stood out most?"
                className="bg-transparent border-cyan-400/40 text-slate-100"
              />
            </div>

            {/* 8. Sketch/memory */}
            <div className="flex flex-col gap-2">
              <Label className="text-cyan-200 text-sm font-semibold">Sketch/memory</Label>
              <div className="flex flex-col gap-2 rounded-lg border border-dashed border-cyan-400/40 bg-slate-900/40 p-3 text-sm text-slate-200">
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => addSketchImages(e.target.files)}
                  className="border-cyan-400/40 file:text-slate-100"
                />
                {sketches.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <div className="text-xs text-cyan-100">
                      {sketches.length} file{sketches.length > 1 ? "s" : ""} selected
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {sketches.map((img, idx) => (
                        <div
                          key={img.id || `${img.name || "img"}-${img.size || "0"}-${idx}`}
                          className="relative h-16 w-16 overflow-hidden rounded-md border border-cyan-400/40 bg-slate-800"
                        >
                          <img
                            src={img.url}
                            alt={img.name}
                            className="h-full w-full object-cover"
                          />
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-black/70 text-white hover:bg-black/80"
                            onClick={() => removeSketch(img.id)}
                            type="button"
                          >
                            ✕
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            </div>

            {/* Sticky buttons */}
            <div className="sticky bottom-0 flex gap-2 px-3 py-3 bg-[rgba(12,18,36,0.95)] border-t border-cyan-400/20">
              <Button
                variant="outline"
                className="flex-1 border border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
                onClick={() => setShowForm(false)}
                type="button"
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-[#ff005e] to-[#ff66aa] text-white font-semibold shadow-lg"
                onClick={handleSave}
                disabled={isSaving}
                type="button"
              >
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </div>
          </CardContent>
        )}
      </Card>
      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      {/* 🌍 Overlay Map (unchanged) */}
      {showOverlayMap && LeafletOverlay ? (
        <LeafletOverlay
          pins={overlayPins}
          onClose={() => setShowOverlayMap(false)}
        />
      ) : null}

      <Toaster position="top-center" richColors closeButton />
    </div>
  );
}
