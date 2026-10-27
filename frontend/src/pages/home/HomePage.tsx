import { useEffect } from "react";
import { SignInButton } from "@/components/SignInButton";
import { Link } from "react-router-dom";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CoverImage } from "@/components/CoverImage";
import { MediaCard } from "@/components/MediaCard";
import { SectionRow } from "@/components/SectionRow";
import { useMusicStore } from "@/stores/useMusicStore";
import { useBrowseStore } from "@/stores/useBrowseStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useLibraryStore } from "@/stores/useLibraryStore";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { greeting } from "@/lib/format";
import type { Song } from "@/types";

const HomePage = () => {
  const isSignedIn = Boolean(useAuthStore((state) => state.user));
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
  const playSongs = usePlayerStore((state) => state.playSongs);
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
    songs.map((song, index) => (
      <MediaCard
        key={song._id}
        title={song.title}
        subtitle={song.artist}
        imageUrl={song.imageUrl}
        onPlay={() => playSong(song)}
        className="w-[160px] shrink-0 sm:w-[180px]"
      />
    ));

  return (
    <div className="min-h-full bg-gradient-to-b from-emerald-500/20 via-zinc-900 to-zinc-900 pb-10">
      <div className="px-4 pt-4 sm:px-6 sm:pt-6">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{greeting()}</h1>
            {!isSignedIn && (
              <p className="mt-1 max-w-xl text-sm text-zinc-400">
                Browse the demo catalog and start listening. Sign in to build playlists and
                save your favorite tracks.
              </p>
            )}
          </div>
          {!isSignedIn && (
            <SignInButton>
              <Button className="rounded-full bg-white text-black hover:bg-zinc-200">
                Sign in to save your library
              </Button>
            </SignInButton>
          )}
        </div>

        {quickPicks.length > 0 && (
          <div className="mb-8 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {quickPicks.map((pick) => (
              <div
                key={pick.id}
                className="group relative flex items-center gap-3 overflow-hidden rounded-md bg-white/10 pr-3 transition hover:bg-white/20"
              >
                <Link to={pick.href} className="flex min-w-0 flex-1 items-center gap-3">
                  <CoverImage
                    src={pick.imageUrl}
                    alt={pick.title}
                    fallbackLabel={pick.title}
                    className="size-16 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{pick.title}</p>
                    <p className="truncate text-xs text-zinc-400">{pick.subtitle}</p>
                  </div>
                </Link>
                <button
                  type="button"
                  aria-label={`Play ${pick.title}`}
                  disabled={!(pick.songs?.filter((s: any) => s && s.songUrl) || []).length}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const songs = pick.songs?.filter((s: any) => s && s.songUrl) || [];
                    if (songs.length > 0) playSongs(songs);
                  }}
                  className="grid size-10 translate-y-1 place-items-center rounded-full bg-emerald-500 text-black opacity-0 shadow-lg transition group-hover:translate-y-0 group-hover:opacity-100 hover:bg-emerald-400 disabled:pointer-events-none disabled:opacity-0"
                >
                  <Play className="size-4 fill-current" />
                </button>
              </div>
            ))}
          </div>
        )}

        {isLoading && featuredSongs.length === 0 && (
          <div className="mb-6 flex gap-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-[220px] w-[160px] shrink-0 animate-pulse rounded-lg bg-white/5 sm:w-[180px]"
              />
            ))}
          </div>
        )}

        {featuredSongs.length > 0 && (
          <SectionRow title="Featured today" className="mb-8">
            {renderSongCards(featuredSongs)}
          </SectionRow>
        )}

        {recentlyPlayed.length > 0 && (
          <SectionRow title="Jump back in" className="mb-8">
            {recentlyPlayed.slice(0, 10).map((song) => (
              <MediaCard
                key={`recent-${song._id}`}
                title={song.title}
                subtitle={song.artist}
                imageUrl={song.imageUrl}
                onPlay={() => playSong(song)}
                className="w-[160px] shrink-0 sm:w-[180px]"
              />
            ))}
          </SectionRow>
        )}

        {madeForYouSongs.length > 0 && (
          <SectionRow title="Made for you" className="mb-8">
            {renderSongCards(madeForYouSongs)}
          </SectionRow>
        )}

        {albums.length > 0 && (
          <SectionRow title="Popular albums" className="mb-8">
            {albums.slice(0, 12).map((album) => (
          <MediaCard
            key={album._id}
            title={album.title}
            subtitle={album.artist}
            imageUrl={album.imageUrl}
            href={`/albums/${album._id}`}
            onPlay={
              (album.songs?.filter((s: any) => s && s.songUrl) || []).length > 0
                ? () => {
                    const songs = album.songs?.filter((s: any) => s && s.songUrl) || [];
                    if (songs.length > 0) playSongs(songs);
                  }
                : undefined
            }
            className="w-[160px] shrink-0 sm:w-[180px]"
          />
            ))}
          </SectionRow>
        )}

        {trendingSongs.length > 0 && (
          <SectionRow title="Trending now" className="mb-8">
            {renderSongCards(trendingSongs)}
          </SectionRow>
        )}

        {artists.length > 0 && (
          <SectionRow title="Popular artists" className="mb-8">
            {artists.map((artist) => (
              <MediaCard
                key={artist.name}
                title={artist.name}
                subtitle={`${artist.songCount} songs`}
                imageUrl={artist.imageUrl}
                href={`/artist/${encodeURIComponent(artist.name)}`}
                round
                className="w-[150px] shrink-0 sm:w-[170px]"
              />
            ))}
          </SectionRow>
        )}
      </div>
    </div>
  );
};

export default HomePage;
