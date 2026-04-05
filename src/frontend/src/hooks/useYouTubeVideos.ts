import { useQuery } from "@tanstack/react-query";

export type YouTubeVideo = {
  id: string;
  title: string;
  thumbnail: string;
  url: string;
};

// TaskTurtle channel handle
const CHANNEL_HANDLE = "taskturtle";
// Use env variable if set, otherwise use the provided key directly
const YT_API_KEY =
  (import.meta.env.VITE_YOUTUBE_API_KEY as string | undefined) ??
  "AIzaSyAZIDVP-08VUxVzNIYALm7JKzAHuW_M0SU";

/**
 * Returns the best available thumbnail URL for a given videoId.
 * Priority: maxresdefault → sddefault → hqdefault
 * We always construct from videoId so it matches the actual uploaded thumbnail.
 */
function getBestThumbnail(
  videoId: string,
  snippetThumbnails?: {
    maxres?: { url: string };
    standard?: { url: string };
    high?: { url: string };
    medium?: { url: string };
    default?: { url: string };
  },
): string {
  // Prefer snippet thumbnails (already returned by API) in quality order
  if (snippetThumbnails?.maxres?.url) return snippetThumbnails.maxres.url;
  if (snippetThumbnails?.standard?.url) return snippetThumbnails.standard.url;
  if (snippetThumbnails?.high?.url) return snippetThumbnails.high.url;
  if (snippetThumbnails?.medium?.url) return snippetThumbnails.medium.url;
  // Fallback: construct from videoId — maxresdefault is the custom thumbnail YT creators set
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}

async function fetchYouTubeVideos(): Promise<YouTubeVideo[]> {
  try {
    // Step 1: Resolve @taskturtle handle → channel ID
    const channelRes = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=${CHANNEL_HANDLE}&key=${YT_API_KEY}`,
    );

    if (!channelRes.ok) {
      const err = await channelRes.text();
      console.warn("[YouTubeSlider] Channel lookup failed:", err);
      throw new Error("channel_lookup_failed");
    }

    const channelData = await channelRes.json();
    const channelId: string | undefined = channelData?.items?.[0]?.id;

    if (!channelId) {
      console.warn(
        "[YouTubeSlider] Channel ID not found in response:",
        channelData,
      );
      throw new Error("channel_id_not_found");
    }

    console.log("[YouTubeSlider] Resolved channel ID:", channelId);

    // Step 2: Fetch latest videos — request maxres thumbnails via snippet
    const videosRes = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=8&order=date&type=video&key=${YT_API_KEY}`,
    );

    if (!videosRes.ok) {
      const err = await videosRes.text();
      console.warn("[YouTubeSlider] Videos fetch failed:", err);
      throw new Error("videos_fetch_failed");
    }

    const videosData = await videosRes.json();
    const items: unknown[] = videosData?.items ?? [];

    if (!items.length) {
      console.warn("[YouTubeSlider] No videos returned from API");
      throw new Error("no_videos");
    }

    const videos: YouTubeVideo[] = items
      .filter((item) => {
        const i = item as { id?: { videoId?: string } };
        return !!i.id?.videoId;
      })
      .map((item) => {
        const typedItem = item as {
          id: { videoId: string };
          snippet: {
            title: string;
            thumbnails: {
              maxres?: { url: string };
              standard?: { url: string };
              high?: { url: string };
              medium?: { url: string };
              default?: { url: string };
            };
          };
        };
        const videoId = typedItem.id.videoId;
        const snippet = typedItem.snippet;
        // Use the actual thumbnail from the channel (custom thumbnail set by creator)
        const thumbnail = getBestThumbnail(videoId, snippet.thumbnails);

        return {
          id: videoId,
          title: snippet.title,
          thumbnail,
          url: `https://www.youtube.com/watch?v=${videoId}`,
        };
      });

    console.log(`[YouTubeSlider] Loaded ${videos.length} videos from channel`);
    return videos;
  } catch (err) {
    console.warn("[YouTubeSlider] Error fetching videos:", err);
    // Re-throw so React Query shows error state (no fake fallback videos)
    throw err;
  }
}

export function useYouTubeVideos() {
  const { data, isLoading, isError } = useQuery<YouTubeVideo[]>({
    queryKey: ["youtube-videos", "taskturtle"],
    queryFn: fetchYouTubeVideos,
    staleTime: 5 * 60 * 1000, // 5 min cache
    refetchInterval: 5 * 60 * 1000, // auto-refresh every 5 min
    refetchOnWindowFocus: true, // refresh when user comes back to tab
    retry: 2,
  });

  return {
    videos: data ?? [],
    isLoading,
    isError,
  };
}
