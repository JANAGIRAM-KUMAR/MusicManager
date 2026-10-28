import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMusicStore } from "@/stores/useMusicStore";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { Calendar, Trash2, Disc, Play, Pause } from "lucide-react";
import { formatTime } from "@/lib/format";
import EditSongDialog from "./EditSongDialog";

const SongsTable = () => {
	const { songs, albums, isLoading, error, deleteSong } = useMusicStore();
	const { currentSong, isPlaying, playSong, togglePlay } = usePlayerStore();

	if (isLoading) {
		return (
			<div className='flex items-center justify-center py-8'>
				<div className='text-zinc-400'>Loading songs...</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className='flex items-center justify-center py-8'>
				<div className='text-red-400'>Error loading songs</div>
			</div>
		);
	}

	const getAlbumNames = (song: any) => {
		const albumIds = song.albumIds && song.albumIds.length > 0 ? song.albumIds : (song.albumId ? [song.albumId] : []);
		if (albumIds.length === 0) return "Single";
		const names = albumIds.map((id: string) => {
			const album = albums.find(a => a._id === id);
			return album ? album.title : null;
		}).filter(Boolean);
		if (names.length === 0) return "Single";
		if (names.length === 1) return names[0];
		return `${names[0]} +${names.length - 1} more`;
	};

	const handlePlayPreview = (song: any) => {
		if (currentSong?._id === song._id) {
			togglePlay();
		} else {
			playSong(song);
		}
	};

	return (
		<Table>
			<TableHeader>
				<TableRow className='hover:bg-zinc-800/50'>
					<TableHead className='w-[48px]'></TableHead>
					<TableHead>Title</TableHead>
					<TableHead>Artist</TableHead>
					<TableHead>Albums</TableHead>
					<TableHead>Duration</TableHead>
					<TableHead>Added</TableHead>
					<TableHead className='text-right'>Actions</TableHead>
				</TableRow>
			</TableHeader>

			<TableBody>
				{songs.map((song) => {
					const albumIds = song.albumIds && song.albumIds.length > 0 ? song.albumIds : (song.albumId ? [song.albumId] : []);
					const isThisSongPlaying = currentSong?._id === song._id && isPlaying;

					return (
						<TableRow key={song._id} className='hover:bg-zinc-800/50 group'>
							<TableCell>
								<div
									onClick={() => handlePlayPreview(song)}
									className="relative size-10 rounded overflow-hidden cursor-pointer shrink-0"
								>
									<img src={song.imageUrl} alt={song.title} className='size-full object-cover' />
									<div
										className={`absolute inset-0 bg-black/50 flex items-center justify-center transition ${
											isThisSongPlaying ? "opacity-100" : "opacity-0 group-hover:opacity-100"
										}`}
									>
										{isThisSongPlaying ? (
											<Pause className="size-4 text-emerald-400 fill-emerald-400" />
										) : (
											<Play className="size-4 text-white fill-white ml-0.5" />
										)}
									</div>
								</div>
							</TableCell>
							<TableCell className='font-medium text-white'>
								<span className={isThisSongPlaying ? "text-emerald-400" : ""}>{song.title}</span>
							</TableCell>
							<TableCell className="text-zinc-300">{song.artist}</TableCell>
							<TableCell>
								<div className='flex items-center gap-1.5 text-zinc-400'>
									<Disc className='h-3.5 w-3.5 text-zinc-500' />
									<span className='text-sm'>{getAlbumNames(song)}</span>
								</div>
								{albumIds.length > 1 && (
									<div className='text-[11px] text-emerald-500/80 font-medium mt-0.5'>
										In {albumIds.length} albums
									</div>
								)}
							</TableCell>
							<TableCell className='text-zinc-400 tabular-nums'>
								{formatTime(song.duration)}
							</TableCell>
							<TableCell>
								<span className='inline-flex items-center gap-1 text-zinc-400 text-xs'>
									<Calendar className='h-3.5 w-3.5' />
									{song.createdAt?.split("T")[0]}
								</span>
							</TableCell>

							<TableCell className='text-right'>
								<div className='flex gap-1.5 justify-end items-center'>
									<EditSongDialog song={song} />
									<Button
										variant={"ghost"}
										size={"sm"}
										className='text-red-400 hover:text-red-300 hover:bg-red-400/10'
										onClick={() => {
											if (confirm(`Are you sure you want to delete song "${song.title}"?`)) {
												deleteSong(song._id);
											}
										}}
										title="Delete Song"
									>
										<Trash2 className='size-4' />
									</Button>
								</div>
							</TableCell>
						</TableRow>
					);
				})}
			</TableBody>
		</Table>
	);
};
export default SongsTable;
