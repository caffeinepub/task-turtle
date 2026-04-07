import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useYouTubeVideos } from "../hooks/useYouTubeVideos";

function YouTubeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-10 h-10 flex-shrink-0"
      fill="none"
      role="img"
      aria-label="YouTube"
    >
      <title>YouTube</title>
      <path
        d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805z"
        fill="#FF0000"
      />
      <path d="M9.609 15.601V8.408l6.264 3.602z" fill="white" />
    </svg>
  );
}

function useVisibleCount() {
  const [visibleCount, setVisibleCount] = useState(3);

  useEffect(() => {
    function update() {
      const w = window.innerWidth;
      if (w < 640) setVisibleCount(1);
      else if (w < 1024) setVisibleCount(2);
      else setVisibleCount(3);
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return visibleCount;
}

export default function YouTubeSlider() {
  const { videos, isLoading, isError } = useYouTubeVideos();
  const visibleCount = useVisibleCount();

  // Triple-clone for seamless infinite loop
  const displayVideos = [...videos, ...videos, ...videos];

  // Start at the second copy so we can go backward too
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const isHovered = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initialise index to middle copy when videos load
  useEffect(() => {
    if (videos.length > 0) {
      setIsTransitioning(false);
      setCurrentIndex(videos.length);
    }
  }, [videos.length]);

  // Re-enable transitions after the silent jump
  useEffect(() => {
    if (!isTransitioning) {
      const t = setTimeout(() => setIsTransitioning(true), 50);
      return () => clearTimeout(t);
    }
  }, [isTransitioning]);

  // Handle wrap-around
  useEffect(() => {
    if (!videos.length) return;

    // Past the third copy → jump to second copy silently
    if (currentIndex >= videos.length * 2) {
      const t = setTimeout(() => {
        setIsTransitioning(false);
        setCurrentIndex(videos.length);
      }, 520);
      return () => clearTimeout(t);
    }

    // Before the first copy → jump to second-to-last in second copy silently
    if (currentIndex < videos.length) {
      const t = setTimeout(() => {
        setIsTransitioning(false);
        setCurrentIndex(videos.length * 2 - 1);
      }, 520);
      return () => clearTimeout(t);
    }
  }, [currentIndex, videos.length]);

  const goNext = useCallback(() => {
    setIsTransitioning(true);
    setCurrentIndex((prev) => prev + 1);
  }, []);

  const goPrev = useCallback(() => {
    setIsTransitioning(true);
    setCurrentIndex((prev) => prev - 1);
  }, []);

  // Auto-slide every 3 s
  useEffect(() => {
    if (!videos.length) return;
    intervalRef.current = setInterval(() => {
      if (!isHovered.current) goNext();
    }, 3000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [videos.length, goNext]);

  const handleMouseEnter = () => {
    isHovered.current = true;
  };
  const handleMouseLeave = () => {
    isHovered.current = false;
  };

  const translateX = -(currentIndex * (100 / visibleCount));

  const realIndex =
    (((currentIndex - videos.length) % videos.length) + videos.length) %
    videos.length;

  return (
    <motion.section
      className="py-24 border-t border-border"
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* ── Heading ── */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <YouTubeIcon />
            <h2 className="font-display font-black text-3xl sm:text-4xl tracking-tight">
              Know more about TaskTurtle
            </h2>
          </div>
          <p className="text-muted-foreground text-lg pl-[52px]">
            Watch our latest videos
          </p>
        </div>

        {/* ── Loading state ── */}
        {isLoading && (
          <div className="flex gap-4" data-ocid="youtube_slider.loading_state">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex-1">
                <Skeleton className="w-full aspect-video rounded-xl mb-3" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        )}

        {/* ── Error / empty state ── */}
        {!isLoading && (isError || videos.length === 0) && (
          <p
            className="text-muted-foreground text-center py-10"
            data-ocid="youtube_slider.error_state"
          >
            Visit our{" "}
            <a
              href="https://youtube.com/@taskturtle"
              target="_blank"
              rel="noopener noreferrer"
              className="text-red-400 underline hover:text-red-300 transition-colors"
            >
              YouTube channel
            </a>{" "}
            for the latest videos.
          </p>
        )}

        {/* ── Slider ── */}
        {!isLoading && videos.length > 0 && (
          <div className="relative">
            {/* Prev button */}
            <button
              type="button"
              onClick={goPrev}
              data-ocid="youtube_slider.pagination_prev"
              aria-label="Previous videos"
              className="absolute -left-4 sm:-left-5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center hover:bg-secondary hover:border-red-500/40 transition-all duration-200 shadow-card"
            >
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>

            {/* Next button */}
            <button
              type="button"
              onClick={goNext}
              data-ocid="youtube_slider.pagination_next"
              aria-label="Next videos"
              className="absolute -right-4 sm:-right-5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center hover:bg-secondary hover:border-red-500/40 transition-all duration-200 shadow-card"
            >
              <ChevronRight className="w-5 h-5 text-foreground" />
            </button>

            {/* Track */}
            <div
              className="overflow-hidden"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              data-ocid="youtube_slider.panel"
            >
              <div
                className="flex"
                style={{
                  transform: `translateX(${translateX}%)`,
                  transition: isTransitioning
                    ? "transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)"
                    : "none",
                }}
              >
                {displayVideos.map((video, idx) => (
                  <div
                    key={`${video.id}-copy${Math.floor(idx / videos.length)}-${idx % videos.length}`}
                    className="flex-shrink-0 px-2"
                    style={{ width: `${100 / visibleCount}%` }}
                  >
                    <a
                      href={video.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block glass-card rounded-2xl overflow-hidden hover:border-red-500/30 hover:shadow-lg transition-all duration-300 group cursor-pointer"
                      data-ocid={`youtube_slider.item.${(idx % videos.length) + 1}`}
                    >
                      {/* Thumbnail */}
                      <div className="relative overflow-hidden">
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                          onError={(e) => {
                            const img = e.currentTarget;
                            // Fallback: maxresdefault → hqdefault
                            if (!img.dataset.fallback) {
                              img.dataset.fallback = "1";
                              img.src = `https://img.youtube.com/vi/${video.id}/hqdefault.jpg`;
                            }
                          }}
                        />
                        {/* Play overlay */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/30">
                          <div className="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center shadow-lg">
                            <svg
                              viewBox="0 0 24 24"
                              className="w-6 h-6 fill-white ml-1"
                              aria-hidden="true"
                            >
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                        </div>
                      </div>

                      {/* Title */}
                      <div className="p-4">
                        <h3 className="text-sm font-semibold text-foreground line-clamp-2 leading-snug group-hover:text-red-400 transition-colors duration-200">
                          {video.title}
                        </h3>
                      </div>
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* Dots */}
            <div className="flex justify-center gap-1.5 mt-6">
              {videos.map((video, i) => {
                const isActive = realIndex === i;
                return (
                  <button
                    key={video.id}
                    type="button"
                    onClick={() => {
                      setIsTransitioning(true);
                      setCurrentIndex(videos.length + i);
                    }}
                    aria-label={`Go to video ${i + 1}`}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      isActive
                        ? "bg-red-500 w-6"
                        : "bg-border hover:bg-muted-foreground w-1.5"
                    }`}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>
    </motion.section>
  );
}
