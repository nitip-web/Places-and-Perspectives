"use client";

import { use, useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { supabase } from "../../../lib/supabase";
import { Playfair_Display } from "next/font/google";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

// Register GSAP
if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

export default function PerspectivePage({ params }) {
  const { slug } = use(params) || {};
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [perspective, setPerspective] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  // Refs
  const containerRef = useRef(null);
  const heroRef = useRef(null);
  const heroImageRef = useRef(null);
  const heroOverlayRef = useRef(null);
  const titleRef = useRef(null);
  const metaRef = useRef(null);

  const aboutRef = useRef(null);
  const observationsRef = useRef(null);
  const thoughtsRef = useRef(null);
  const galleryRef = useRef(null);

  // Fetch DB
  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from("perspectives")
        .select(
          "id, place_name, about_location, time_of_day, weather, observations, thoughts, cover_image, sketches, images, created_at"
        )
        .eq("id", slug)
        .single();

      if (error) setError(error.message);
      else setPerspective(data);

      setLoading(false);
    };

    fetchData();
  }, [slug]);

  // Animations
  useEffect(() => {
    if (!perspective || loading) return;

    const ctx = gsap.context(() => {
      /* HERO PARALLAX */
      gsap.to(heroImageRef.current, {
        yPercent: 30,
        ease: "none",
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });

      /* HERO DARKEN */
      gsap.to(heroOverlayRef.current, {
        opacity: 0.9,
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });

      /* HERO TITLE */
      gsap.from(titleRef.current, {
        y: 40,
        opacity: 0,
        duration: 1.3,
        ease: "power3.out",
      });

      /* HERO CHIPS */
      gsap.from(metaRef.current?.children || [], {
        y: 20,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: "power2.out",
      });

      /* SECTION TITLES */
      const titles = [
        aboutRef.current?.querySelector(".section-title"),
        observationsRef.current?.querySelector(".section-title"),
        thoughtsRef.current?.querySelector(".section-title"),
        galleryRef.current?.querySelector(".section-title"),
      ];

      titles.forEach((t) => {
        if (!t) return;
        gsap.from(t, {
          opacity: 0,
          y: 25,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: t,
            start: "top 85%",
          },
        });
      });

      /* ABOUT TEXT */
      const aboutText = aboutRef.current?.querySelector("p");
      if (aboutText) {
        gsap.from(aboutText, {
          opacity: 0,
          y: 20,
          duration: 1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: aboutText,
            start: "top 85%",
          },
        });
      }

      /* OBSERVATIONS */
      const obsItems =
        observationsRef.current?.querySelectorAll(".obs-item") || [];

      gsap.from(obsItems, {
        opacity: 0,
        y: 18,
        duration: 0.7,
        stagger: 0.12,
        ease: "power2.out",
        scrollTrigger: {
          trigger: observationsRef.current,
          start: "top 85%",
        },
      });

      /* THOUGHTS */
      const thoughtText =
        thoughtsRef.current?.querySelector(".thought-text");

      if (thoughtText) {
        gsap.from(thoughtText, {
          opacity: 0,
          y: 15,
          duration: 1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: thoughtText,
            start: "top 85%",
          },
        });
      }

      /* GALLERY ITEMS */
      const galleryItems =
        galleryRef.current?.querySelectorAll(".gallery-item") || [];

      gsap.from(galleryItems, {
        opacity: 0,
        scale: 0.88,
        duration: 0.6,
        stagger: 0.08,
        ease: "back.out(1.6)",
        scrollTrigger: {
          trigger: galleryRef.current,
          start: "top 85%",
        },
      });
    }, containerRef);

    return () => ctx.revert();
  }, [perspective, loading]);

  if (loading)
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-300">
        Loading…
      </div>
    );

  if (error || !perspective)
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-red-300">
        Error loading perspective.
      </div>
    );

  const {
    place_name,
    about_location,
    time_of_day,
    weather,
    observations = [],
    thoughts,
    cover_image,
    sketches = [],
    images = [],
    created_at,
  } = perspective;

  const formattedDate = new Date(created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const allImages = [...sketches, ...images];

  const getWeatherIcon = (w) =>
    w?.toLowerCase().includes("clear")
      ? "☀️"
      : w?.toLowerCase().includes("cloud")
      ? "☁️"
      : w?.toLowerCase().includes("rain")
      ? "🌧️"
      : w?.toLowerCase().includes("snow")
      ? "❄️"
      : w?.toLowerCase().includes("wind")
      ? "💨"
      : "🌤️";

    const getTimeIcon = (t) =>
      t?.toLowerCase().includes("morning")
        ? "🌅"
        : t?.toLowerCase().includes("afternoon")
        ? "☀️"
        : t?.toLowerCase().includes("evening")
        ? "🌆"
        : t?.toLowerCase().includes("night")
        ? "🌙"
        : "🕒";
      

  return (
    <div ref={containerRef} className="min-h-screen bg-slate-950 text-slate-50">

      {/* BACK BUTTON */}
      <button
        onClick={() => router.back()}
        className="fixed top-6 left-6 z-50 px-4 py-2 bg-slate-900/80 backdrop-blur-md border border-slate-700/40 rounded-full text-slate-200 hover:bg-slate-800 transition-all"
      >
        ← Back
      </button>

      {/* HERO SECTION */}
      <section ref={heroRef} className="relative h-[85vh] overflow-hidden">
        <div ref={heroImageRef} className="absolute inset-0 h-[130%] -top-[15%]">
          <img
            src={cover_image}
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>

        <div
          ref={heroOverlayRef}
          className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent opacity-70"
        />

        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="max-w-5xl mx-auto">

            <h1
              ref={titleRef}
              className={`${playfair.className} text-5xl md:text-7xl font-semibold mb-6`}
            >
              {place_name}
            </h1>

            <div ref={metaRef} className="flex flex-wrap gap-3 text-sm text-slate-200">
              <span className="px-4 py-2 bg-slate-900/50 border border-slate-700/40 rounded-full">
                📅 {formattedDate}
              </span>
              {time_of_day && (
                <span className="px-4 py-2 bg-slate-900/50 border border-slate-700/40 rounded-full">
                  {getTimeIcon(time_of_day)} {time_of_day}
                </span>
              )}
              {weather && (
                <span className="px-4 py-2 bg-slate-900/50 border border-slate-700/40 rounded-full">
                  {getWeatherIcon(weather)} {weather}
                </span>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* MAIN BODY */}
      <div className="max-w-3xl mx-auto px-6 pt-20 pb-32">

        {/* ABOUT */}
        <section ref={aboutRef} className="mt-16">
          <h2 className={`${playfair.className} section-title text-4xl md:text-5xl mb-6`}>
            About This Place 🗺️
          </h2>

          <p className="text-lg md:text-xl text-slate-300 leading-relaxed whitespace-pre-wrap">
            {about_location}
          </p>
        </section>

        {/* OBSERVATIONS */}
        {observations.length > 0 && (
          <section ref={observationsRef} className="mt-20">
            <h2 className={`${playfair.className} section-title text-4xl md:text-5xl mb-8`}>
              Observations 👀
            </h2>

            <div className="space-y-10">
              {observations.map((obs, idx) => (
                <div key={idx} className="obs-item flex items-start gap-3">
                  <div className="w-3 h-3 rounded-full bg-cyan-400 mt-2" />
                  <p className="text-xl text-slate-300 leading-relaxed">
                    {obs}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* THOUGHTS */}
        {thoughts && (
          <section ref={thoughtsRef} className="mt-20">
            <h2 className={`${playfair.className} section-title text-4xl md:text-5xl mb-6`}>
              My Thoughts ✨
            </h2>

            <div className="flex gap-4">
              {/* Accent bar */}
              <div className="w-1 rounded-full bg-gradient-to-b from-purple-400/40 to-cyan-400/40"></div>

              {/* Thought text */}
              <p className="thought-text text-xl text-slate-300 leading-relaxed">
                {thoughts}
              </p>
            </div>
          </section>
        )}

        {/* GALLERY */}
        {allImages.length > 0 && (
          <section ref={galleryRef} className="mt-20">
            <h2 className={`${playfair.className} section-title text-4xl md:text-5xl mb-8`}>
              Sketches & Memories 🎨
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {allImages.map((url, idx) => (
                <div
                  key={idx}
                  className="gallery-item relative aspect-square overflow-hidden rounded-xl cursor-pointer group"
                  onClick={() => setSelectedImage(url)}
                >
                  <img
                    src={url}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

      </div>

      {/* LIGHTBOX */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl flex items-center justify-center z-[100] p-6"
          onClick={() => setSelectedImage(null)}
        >
          <img src={selectedImage} className="w-full h-full object-contain" />
        </div>
      )}

    </div>
  );
}
