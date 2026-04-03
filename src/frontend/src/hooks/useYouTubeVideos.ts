import { useQuery } from "@tanstack/react-query";

export type YouTubeVideo = {
  id: string;
  title: string;
  thumbnail: string;
  url: string;
};

const FALLBACK_VIDEOS: YouTubeVideo[] = [
  {
    id: "dQw4w9WgXcQ",
    title: "How TaskTurtle Works — Post a Task in 60 Seconds",
    thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    url: "https://youtube.com/@taskturtle",
  },
  {
    id: "jNQXAC9IVRw",
    title: "TaskTurtle: Hyper-Local Task Marketplace Demo",
    thumbnail: "https://img.youtube.com/vi/jNQXAC9IVRw/hqdefault.jpg",
    url: "https://youtube.com/@taskturtle",
  },
  {
    id: "9bZkp7q19f0",
    title: "Earn Money as a Tasker — Getting Started Guide",
    thumbnail: "https://img.youtube.com/vi/9bZkp7q19f0/hqdefault.jpg",
    url: "https://youtube.com/@taskturtle",
  },
  {
    id: "kJQP7kiw5Fk",
    title: "OTP Verification & Secure Payments Explained",
    thumbnail: "https://img.youtube.com/vi/kJQP7kiw5Fk/hqdefault.jpg",
    url: "https://youtube.com/@taskturtle",
  },
  {
    id: "fJ9rUzIMcZQ",
    title: "TaskTurtle vs Traditional Delivery Apps — What's Different?",
    thumbnail: "https://img.youtube.com/vi/fJ9rUzIMcZQ/hqdefault.jpg",
    url: "https://youtube.com/@taskturtle",
  },
  {
    id: "RgKAFK5djSk",
    title: "Community Stories: Real Taskers, Real Earnings",
    thumbnail: "https://img.youtube.com/vi/RgKAFK5djSk/hqdefault.jpg",
    url: "https://youtube.com/@taskturtle",
  },
];

async function fetchYouTubeVideos(): Promise<YouTubeVideo[]> {
  const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY as string | undefined;

  if (!apiKey) {
    return FALLBACK_VIDEOS;
  }

  try {
    // Step 1: Resolve channel handle to channel ID
    const channelRes = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=taskturtle&key=${apiKey}`,
    );

    if (!channelRes.ok) {
      console.warn("[YouTubeSlider] Channel lookup failed, using fallback");
      return FALLBACK_VIDEOS;
    }

    const channelData = await channelRes.json();
    const channelId: string | undefined = channelData?.items?.[0]?.id;

    if (!channelId) {
      console.warn("[YouTubeSlider] Channel ID not found, using fallback");
      return FALLBACK_VIDEOS;
    }

    // Step 2: Fetch latest videos
    const videosRes = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=8&order=date&type=video&key=${apiKey}`,
    );

    if (!videosRes.ok) {
      console.warn("[YouTubeSlider] Videos fetch failed, using fallback");
      return FALLBACK_VIDEOS;
    }

    const videosData = await videosRes.json();
    const items = videosData?.items ?? [];

    if (!items.length) {
      return FALLBACK_VIDEOS;
    }

    const videos: YouTubeVideo[] = items
      .filter(
        (item: Record<string, unknown>) =>
          !!(item as { id?: { videoId?: string } }).id?.videoId,
      )
      .map((item: Record<string, unknown>) => {
        const typedItem = item as {
          id: { videoId: string };
          snippet: {
            title: string;
            thumbnails: {
              high?: { url: string };
              medium?: { url: string };
              default?: { url: string };
            };
          };
        };
        const videoId = typedItem.id.videoId;
        const snippet = typedItem.snippet;
        const thumbnail =
          snippet.thumbnails.high?.url ??
          snippet.thumbnails.medium?.url ??
          `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

        return {
          id: videoId,
          title: snippet.title,
          thumbnail,
          url: `https://www.youtube.com/watch?v=${videoId}`,
        };
      });

    return videos.length > 0 ? videos : FALLBACK_VIDEOS;
  } catch (err) {
    console.warn("[YouTubeSlider] Error fetching videos:", err);
    return FALLBACK_VIDEOS;
  }
}

export function useYouTubeVideos() {
  const { data, isLoading, isError } = useQuery<YouTubeVideo[]>({
    queryKey: ["youtube-videos", "taskturtle"],
    queryFn: fetchYouTubeVideos,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    retry: 1,
  });

  return {
    videos: data ?? [],
    isLoading,
    isError,
  };
}
