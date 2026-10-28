import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CoverImage } from "@/components/CoverImage";
import { MediaCard } from "@/components/MediaCard";
import { SectionRow } from "@/components/SectionRow";
import { useMusicStore } from "@/stores/useMusicStore";
import { useBrowseStore } from "@/stores/useBrowseStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useLibraryStore } from "@/stores/useLibraryStore";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { greeting } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Song } from "@/types";

type CategoryFilter = "All" | "Music" | "Albums" | "Artists";

const HomePage = () => {
  const isSignedIn = Boolean(useAuthStore((state) => state.user));
  const [activeFilter, setActiveFilter] = useState<CategoryFilter>("All");

  const {
    fetchFeaturedSongs,
    fetchMadeForYouSongs,
    fetchTrendingSongs,
    fetchAlbums,
    featuredSongs,
    madeForYouSongs,
    trendingSongs,
    albums,
    isLoading,
  } = useMusicStore();
  const { fetchArtists, artists } = useBrowseStore();
  const recentlyPlayed = useLibraryStore((state) => state.recentlyPlayed);
  const likedSongs = useLibraryStore((state) => state.likedSongs);
  const playSong = usePlayerStore((state) => state.playSong);

  useEffect(() => {
    void fetchFeaturedSongs();
    void fetchMadeForYouSongs();
    void fetchTrendingSongs();
    void fetchAlbums();
    void fetchArtists();
  }, [fetchAlbums, fetchArtists, fetchFeaturedSongs, fetchMadeForYouSongs, fetchTrendingSongs]);

  const quickPicks = [
    ...albums.slice(0, 6).map((album) => ({
      id: album._id,
      title: album.title,
      subtitle: album.artist,
      imageUrl: album.imageUrl,
      href: `/albums/${album._id}`,
      songs: album.songs,
    })),
    ...(isSignedIn
      ? [
          {
            id: "liked",
            title: "Liked Songs",
            subtitle: `${likedSongs.length} songs`,
            imageUrl: likedSongs[0]?.imageUrl ?? "",
            href: "/liked",
            songs: likedSongs,
          },
        ]
      : []),
  ].slice(0, 8);

  const renderSongCards = (songs: Song[]) =>
    songs.map((song) => (
      <MediaCard
        key={song._id}
        title={song.title}
        subtitle={song.artist}
        imageUrl={song.imageUrl}
        onPlay={() => playSong(song)}
        className="w-[140px] shrink-0 sm:w-[170px]"
      />
    ));

  return (
    <div className="min-h-full bg-gradient-to-b from-emerald-500/15 via-white/[0.01] to-transparent pb-6 sm:pb-0">
      <div className="px-3 pt-4 sm:px-6 sm:pt-6">
        {/* Category Pills (Spotify Mobile & Desktop standard) */}
        <div className="flex items-center gap-2 mb-4 sm:mb-6 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {(["All", "Music", "Albums", "Artists"] as CategoryFilter[]).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={cn(
                "px-4 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 active:scale-95",
                activeFilter === filter
                  ? "bg-white text-black shadow-md font-bold"
                  : "glass-pill text-white/90 hover:text-white"
              )}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Welcome Greeting */}
        <div className="mb-5 sm:mb-6">
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
            {greeting()}
          </h1>
          {!isSignedIn && (
            <p className="mt-1 max-w-xl text-xs sm:text-sm text-zinc-400">
              Browse our music catalog and start streaming. Sign in to save tracks and build your personal playlists.
            </p>
          )}
        </div>

        {/* Quick Picks 2-Column Grid on Mobile, 4-Column on Desktop */}
        {(activeFilter === "All" || activeFilter === "Music") && quickPicks.length > 0 && (
          <div className="mb-8 grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-4">
            {quickPicks.map((pick) => (
              <Link
                key={pick.id}
                to={pick.href}
                className="group relative flex items-center overflow-hidden rounded-xl glass-card transition-all hover:bg-white/10 shadow-sm cursor-pointer"
              >
                <CoverImage
                  src={pick.imageUrl}
                  alt={pick.title}
                  fallbackLabel={pick.title}
                  className="size-12 sm:size-16 shrink-0 object-cover shadow-sm rounded-l-xl"
                />
                <div className="min-w-0 flex-1 px-3">
                  <p className="truncate text-xs sm:text-sm font-bold text-white">{pick.title}</p>
                  <p className="truncate text-[10px] sm:text-xs text-zinc-400 mt-0.5">{pick.subtitle}</p>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Loading Skeletons */}
        {isLoading && featuredSongs.length === 0 && (
          <div className="mb-6 flex gap-3 overflow-x-auto pb-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-[210px] w-[140px] shrink-0 animate-pulse rounded-lg bg-white/5 sm:w-[170px]"
              />
            ))}
          </div>
        )}

        {/* Featured Songs Section */}
        {(activeFilter === "All" || activeFilter === "Music") && featuredSongs.length > 0 && (
          <SectionRow title="Featured today" className="mb-8">
            {renderSongCards(featuredSongs)}
          </SectionRow>
        )}

        {/* Recently Played Section */}
        {(activeFilter === "All" || activeFilter === "Music") && recentlyPlayed.length > 0 && (
          <SectionRow title="Jump back in" className="mb-8">
            {recentlyPlayed.slice(0, 10).map((song) => (
              <MediaCard
                key={`recent-${song._id}`}
                title={song.title}
                subtitle={song.artist}
                imageUrl={song.imageUrl}
                onPlay={() => playSong(song)}
                className="w-[140px] shrink-0 sm:w-[170px]"
              />
            ))}
          </SectionRow>
        )}

        {/* Made For You Section */}
        {(activeFilter === "All" || activeFilter === "Music") && madeForYouSongs.length > 0 && (
          <SectionRow title="Made for you" className="mb-8">
            {renderSongCards(madeForYouSongs)}
          </SectionRow>
        )}

        {/* Popular Albums Section */}
        {(activeFilter === "All" || activeFilter === "Albums") && albums.length > 0 && (
          <SectionRow title="Popular albums" className="mb-8">
            {albums.slice(0, 12).map((album) => (
              <MediaCard
                key={album._id}
                title={album.title}
                subtitle={album.artist}
                imageUrl={album.imageUrl}
                href={`/albums/${album._id}`}
                className="w-[140px] shrink-0 sm:w-[170px]"
              />
            ))}
          </SectionRow>
        )}

        {/* Trending Songs Section */}
        {(activeFilter === "All" || activeFilter === "Music") && trendingSongs.length > 0 && (
          <SectionRow title="Trending now" className="mb-8">
            {renderSongCards(trendingSongs)}
          </SectionRow>
        )}

        {/* Popular Artists Section */}
        {(activeFilter === "All" || activeFilter === "Artists") && artists.length > 0 && (
          <SectionRow title="Popular artists" className="mb-8">
            {artists.map((artist) => (
              <MediaCard
                key={artist.name}
                title={artist.name}
                subtitle={`${artist.songCount} tracks`}
                imageUrl={artist.imageUrl}
                href={`/artist/${encodeURIComponent(artist.name)}`}
                round
                className="w-[135px] shrink-0 sm:w-[165px]"
              />
            ))}
          </SectionRow>
        )}
      </div>
    </div>
  );
};

export default HomePage;
