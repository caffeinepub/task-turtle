import { useQuery } from "@tanstack/react-query";
import { useActor } from "./useActor";

export type YouTubeVideo = {
  id: string;
  title: string;
  thumbnail: string;
  url: string;
};

// TaskTurtle channel ID (resolved from @taskturtle handle)
const CHANNEL_ID = "UC1lb5d6sb5lw-4SIvAGSVLA";

/**
 * Extract videoId from a YouTube video URL in the RSS feed.
 * RSS entries use yt:videoId element or link href like:
 *   https://www.youtube.com/watch?v=VIDEO_ID
 */
function extractVideoId(link: string): string | null {
  const match = link.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

/**
 * Parse YouTube RSS XML and extract video entries.
 * YouTube RSS feed format (Atom):
 *   <entry>
 *     <yt:videoId>VIDEO_ID</yt:videoId>
 *     <title>VIDEO TITLE</title>
 *     <link rel="alternate" href="https://www.youtube.com/watch?v=VIDEO_ID"/>
 *   </entry>
 */
function parseRssFeed(xml: string): YouTubeVideo[] {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, "application/xml");

    const parseError = doc.querySelector("parsererror");
    if (parseError) {
      console.warn("[YouTubeRSS] XML parse error:", parseError.textContent);
      return [];
    }

    const entries = doc.querySelectorAll("entry");
    const videos: YouTubeVideo[] = [];

    for (const entry of entries) {
      // Try yt:videoId element first
      const ytVideoIdEl = entry.getElementsByTagNameNS(
        "http://www.youtube.com/xml/schemas/2015",
        "videoId",
      )[0];
      const ytVideoId = ytVideoIdEl?.textContent?.trim();

      // Fallback: extract from link href
      const linkEl = entry.querySelector('link[rel="alternate"]');
      const linkHref = linkEl?.getAttribute("href") || "";
      const linkVideoId = extractVideoId(linkHref);

      const videoId = ytVideoId || linkVideoId;
      if (!videoId) continue;

      const titleEl = entry.querySelector("title");
      const title = titleEl?.textContent?.trim() || "Untitled";

      const url = `https://www.youtube.com/watch?v=${videoId}`;
      // Use maxresdefault first — this is the exact thumbnail the creator uploaded
      const thumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

      videos.push({ id: videoId, title, thumbnail, url });
    }

    console.log(`[YouTubeRSS] Parsed ${videos.length} videos from RSS feed`);
    return videos;
  } catch (err) {
    console.warn("[YouTubeRSS] Error parsing RSS feed:", err);
    return [];
  }
}

export function useYouTubeVideos() {
  const { actor } = useActor();

  const { data, isLoading, isError } = useQuery<YouTubeVideo[]>({
    queryKey: ["youtube-rss-videos", CHANNEL_ID],
    queryFn: async () => {
      if (!actor) throw new Error("actor not ready");
      console.log("[YouTubeRSS] Fetching RSS feed via backend outcall...");
      const xml = await actor.fetchYouTubeRss(CHANNEL_ID);
      if (!xml || xml.trim().length === 0) {
        throw new Error("empty RSS response");
      }
      const videos = parseRssFeed(xml);
      if (videos.length === 0) {
        throw new Error("no videos parsed from RSS");
      }
      return videos;
    },
    staleTime: 5 * 60 * 1000, // cache 5 minutes
    refetchInterval: 5 * 60 * 1000, // auto-refresh every 5 min
    refetchOnWindowFocus: true,
    retry: 2,
    enabled: !!actor,
  });

  return {
    videos: data ?? [],
    isLoading,
    isError,
  };
}
