import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import axiosInstance from "@/lib/axios";
import { useMusicStore } from "@/stores/useMusicStore";
import { Clock, Loader2, Plus, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { formatTime } from "@/lib/format";

interface NewSong {
	title: string;
	artist: string;
}

// Multi-strategy audio duration extractor
const getAudioDuration = async (file: File): Promise<number> => {
	// Strategy 1: HTML5 Audio with loadedmetadata & Infinity check
	try {
		const objectUrl = URL.createObjectURL(file);
		const audio = new Audio();
		audio.preload = "metadata";
		audio.src = objectUrl;

		const duration = await new Promise<number>((resolve) => {
			let isResolved = false;
			const cleanup = () => {
				if (isResolved) return;
				isResolved = true;
				audio.removeEventListener("loadedmetadata", onLoaded);
				audio.removeEventListener("error", onError);
				URL.revokeObjectURL(objectUrl);
			};

			const onLoaded = () => {
				const d = audio.duration;
				if (Number.isFinite(d) && d > 0) {
					cleanup();
					resolve(Math.round(d));
				} else if (d === Infinity) {
					// Chromium VBR fallback
					audio.currentTime = 1e101;
					audio.addEventListener(
						"seeked",
						() => {
							const real = audio.duration;
							cleanup();
							resolve(Number.isFinite(real) && real > 0 ? Math.round(real) : 0);
						},
						{ once: true }
					);
				} else {
					cleanup();
					resolve(0);
				}
			};

			const onError = () => {
				cleanup();
				resolve(0);
			};

			audio.addEventListener("loadedmetadata", onLoaded);
			audio.addEventListener("error", onError);

			setTimeout(() => {
				cleanup();
				resolve(0);
			}, 3500);
		});

		if (duration > 0) return duration;
	} catch (err) {
		console.warn("HTML5 audio metadata extraction failed:", err);
	}

	// Strategy 2: Web Audio API decodeAudioData fallback
	try {
		const AudioCtx =
			window.AudioContext ||
			(window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
		if (AudioCtx) {
			const ctx = new AudioCtx();
			const buffer = await file.arrayBuffer();
			const decoded = await ctx.decodeAudioData(buffer);
			const duration = Math.round(decoded.duration || 0);
			void ctx.close().catch(() => {});
			if (duration > 0) return duration;
		}
	} catch (err) {
		console.warn("Web Audio decodeAudioData extraction failed:", err);
	}

	return 0;
};

const AddSongDialog = () => {
	const { albums, fetchSongs, fetchAlbums, fetchStats } = useMusicStore();
	const [songDialogOpen, setSongDialogOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [isExtracting, setIsExtracting] = useState(false);
	const [detectedDuration, setDetectedDuration] = useState<number>(0);

	const [newSong, setNewSong] = useState<NewSong>({
		title: "",
		artist: "",
	});

	const [selectedAlbumIds, setSelectedAlbumIds] = useState<string[]>([]);

	const [files, setFiles] = useState<{ audio: File | null; image: File | null }>({
		audio: null,
		image: null,
	});

	const audioInputRef = useRef<HTMLInputElement>(null);
	const imageInputRef = useRef<HTMLInputElement>(null);

	const extractMetadata = async (audioFile: File) => {
		setIsExtracting(true);
		try {
			// Auto-extract exact duration using HTML5 Audio & Web Audio fallback
			const duration = await getAudioDuration(audioFile);
			setDetectedDuration(duration);

			// Try to extract filename-based metadata
			const fileName = audioFile.name.replace(/\.[^/.]+$/, ""); // Remove extension
			let suggestedTitle = fileName;
			let suggestedArtist = "";

			// Try to parse common patterns like "Artist - Title" or "Title"
			if (fileName.includes(" - ")) {
				const parts = fileName.split(" - ");
				suggestedArtist = parts[0].trim();
				suggestedTitle = parts.slice(1).join(" - ").trim();
			}

			setNewSong((prev) => ({
				...prev,
				title: prev.title || suggestedTitle,
				artist: prev.artist || suggestedArtist,
			}));

			if (duration > 0) {
				toast.success(`Track duration auto-detected: ${formatTime(duration)}`);
			}
		} catch (error) {
			console.error("Error extracting metadata:", error);
		} finally {
			setIsExtracting(false);
		}
	};

	const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			setFiles((prev) => ({ ...prev, audio: file }));
			extractMetadata(file);
		}
	};

	const handleSubmit = async () => {
		setIsLoading(true);

		try {
			if (!files.audio || !files.image) {
				toast.error("Please upload both audio and image files");
				setIsLoading(false);
				return;
			}

			if (!newSong.title.trim() || !newSong.artist.trim()) {
				toast.error("Please provide title and artist");
				setIsLoading(false);
				return;
			}

			const formData = new FormData();

			formData.append("title", newSong.title.trim());
			formData.append("artist", newSong.artist.trim());
			formData.append("duration", detectedDuration > 0 ? detectedDuration.toString() : "0");
			formData.append("albumIds", JSON.stringify(selectedAlbumIds));

			formData.append("audioFile", files.audio);
			formData.append("imageFile", files.image);

			await axiosInstance.post("/admin/songs", formData);

			// Reset form
			setNewSong({
				title: "",
				artist: "",
			});
			setDetectedDuration(0);
			setSelectedAlbumIds([]);

			setFiles({
				audio: null,
				image: null,
			});
			
			if (audioInputRef.current) audioInputRef.current.value = "";
			if (imageInputRef.current) imageInputRef.current.value = "";
			
			toast.success("Song added successfully");
			setSongDialogOpen(false);
			
			// Refresh data
			await Promise.all([fetchSongs(), fetchAlbums(), fetchStats()]);
		} catch (error: unknown) {
			const err = error as { response?: { data?: { message?: string } }; message?: string };
			toast.error("Failed to add song: " + (err.response?.data?.message || err.message || "Failed to add song"));
		} finally {
			setIsLoading(false);
		}
	};

	const toggleAlbumSelection = (albumId: string) => {
		setSelectedAlbumIds(prev => 
			prev.includes(albumId) 
				? prev.filter(id => id !== albumId)
				: [...prev, albumId]
		);
	};

	return (
		<Dialog open={songDialogOpen} onOpenChange={setSongDialogOpen}>
			<DialogTrigger asChild>
				<Button className='bg-emerald-500 hover:bg-emerald-600 text-black'>
					<Plus className='mr-2 h-4 w-4' />
					Add Song
				</Button>
			</DialogTrigger>

			<DialogContent className='bg-zinc-900 border-zinc-700 max-h-[80vh] overflow-auto'>
				<DialogHeader>
					<DialogTitle>Add New Song</DialogTitle>
					<DialogDescription>Add a new song to your music library</DialogDescription>
				</DialogHeader>

				<div className='space-y-4 py-4'>
					<input
						type='file'
						accept='audio/*'
						ref={audioInputRef}
						hidden
						onChange={handleAudioChange}
					/>

					<input
						type='file'
						ref={imageInputRef}
						className='hidden'
						accept='image/*'
						onChange={(e) => setFiles((prev) => ({ ...prev, image: e.target.files![0] }))}
					/>

					{/* image upload area */}
					<div
						className='flex items-center justify-center p-6 border-2 border-dashed border-zinc-700 rounded-lg cursor-pointer'
						onClick={() => imageInputRef.current?.click()}
					>
						<div className='text-center'>
							{files.image ? (
								<div className='space-y-2'>
									<div className='text-sm text-emerald-500'>Image selected:</div>
									<div className='text-xs text-zinc-400'>{files.image.name.slice(0, 20)}</div>
								</div>
							) : (
								<>
									<div className='p-3 bg-zinc-800 rounded-full inline-block mb-2'>
										<Upload className='h-6 w-6 text-zinc-400' />
									</div>
									<div className='text-sm text-zinc-400 mb-2'>Upload artwork</div>
									<Button variant='outline' size='sm' className='text-xs'>
										Choose File
									</Button>
								</>
							)}
						</div>
					</div>

					{/* Audio upload */}
					<div className='space-y-2'>
						<label className='text-sm font-medium'>Audio File</label>
						<div className='flex items-center gap-2'>
							<Button 
								variant='outline' 
								onClick={() => audioInputRef.current?.click()} 
								className='w-full'
								disabled={isExtracting}
							>
								{isExtracting ? (
									<>
										<Loader2 className='mr-2 h-4 w-4 animate-spin' />
										Analyzing...
									</>
								) : files.audio ? (
									files.audio.name.length > 25 ? files.audio.name.slice(0, 25) + "..." : files.audio.name
								) : (
									"Choose Audio File"
								)}
							</Button>
						</div>
						{files.audio && !isExtracting && (
							<p className='text-xs text-emerald-400'>✓ Audio file selected - metadata auto-extracted if possible</p>
						)}
					</div>

					{/* other fields */}
					<div className='space-y-2'>
						<label className='text-sm font-medium'>Title *</label>
						<Input
							value={newSong.title}
							onChange={(e) => setNewSong({ ...newSong, title: e.target.value })}
							className='bg-zinc-800 border-zinc-700'
							placeholder='Song title'
						/>
					</div>

					<div className='space-y-2'>
						<label className='text-sm font-medium'>Artist *</label>
						<Input
							value={newSong.artist}
							onChange={(e) => setNewSong({ ...newSong, artist: e.target.value })}
							className='bg-zinc-800 border-zinc-700'
							placeholder='Artist name'
						/>
					</div>

					{/* Auto-detected Duration Display */}
					{files.audio && (
						<div className='flex items-center justify-between p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/60'>
							<div className='flex items-center gap-2.5'>
								<Clock className='size-4 text-emerald-400' />
								<div>
									<p className='text-xs font-semibold text-white'>Audio Duration</p>
									<p className='text-[11px] text-zinc-400'>
										{isExtracting ? (
											<span className='flex items-center gap-1.5 text-zinc-400'>
												<Loader2 className='size-3 animate-spin text-emerald-400' />
												Auto-detecting track duration...
											</span>
										) : detectedDuration > 0 ? (
											<span className='text-emerald-400 font-mono font-medium'>
												{formatTime(detectedDuration)} ({detectedDuration} seconds)
											</span>
										) : (
											<span className='text-zinc-400'>
												Will be measured automatically on upload
											</span>
										)}
									</p>
								</div>
							</div>
							<Badge variant='outline' className='text-[10px] uppercase font-mono border-zinc-600 text-zinc-300'>
								Auto
							</Badge>
						</div>
					)}

					<div className='space-y-3'>
						<label className='text-sm font-medium'>Albums (Optional - can select multiple)</label>
						<div className='max-h-40 overflow-y-auto border border-zinc-700 rounded-lg p-2 space-y-1 bg-zinc-800/50'>
							{albums.length === 0 ? (
								<p className='text-xs text-zinc-500 text-center py-2'>No albums available</p>
							) : (
								albums.map((album) => (
									<div
										key={album._id}
										onClick={() => toggleAlbumSelection(album._id)}
										className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
											selectedAlbumIds.includes(album._id)
												? 'bg-emerald-500/20 border border-emerald-500/50'
												: 'hover:bg-zinc-700/50'
										}`}
									>
										<img src={album.imageUrl} alt={album.title} className='w-10 h-10 rounded object-cover' />
										<div className='flex-1 min-w-0'>
											<p className='text-sm font-medium truncate'>{album.title}</p>
											<p className='text-xs text-zinc-400 truncate'>{album.artist}</p>
										</div>
										{selectedAlbumIds.includes(album._id) && (
											<span className='text-xs px-2 py-0.5 rounded bg-emerald-500 text-black'>Selected</span>
										)}
									</div>
								))
							)}
						</div>
						{selectedAlbumIds.length > 0 && (
							<div className='flex flex-wrap gap-1'>
								{selectedAlbumIds.map(id => {
									const album = albums.find(a => a._id === id);
									return album ? (
										<Badge key={id} variant='secondary' className='gap-1'>
											{album.title}
											<X 
												className='h-3 w-3 cursor-pointer' 
												onClick={(e) => {
													e.stopPropagation();
													toggleAlbumSelection(id);
												}}
											/>
										</Badge>
									) : null;
								})}
							</div>
						)}
						<p className='text-xs text-zinc-500'>Click albums to add this song to multiple albums</p>
					</div>
				</div>

				<DialogFooter>
					<Button 
						variant='outline' 
						onClick={() => {
							setSongDialogOpen(false);
							// Reset form when closing
							setNewSong({
								title: "",
								artist: "",
							});
							setDetectedDuration(0);
							setSelectedAlbumIds([]);
							setFiles({
								audio: null,
								image: null,
							});
							if (audioInputRef.current) audioInputRef.current.value = "";
							if (imageInputRef.current) imageInputRef.current.value = "";
						}} 
						disabled={isLoading}
					>
						Cancel
					</Button>
					<Button 
						onClick={handleSubmit} 
						disabled={isLoading || !files.audio || !files.image || !newSong.title.trim() || !newSong.artist.trim()}
						className='bg-emerald-500 hover:bg-emerald-600 text-black'
					>
						{isLoading ? (
							<>
								<Loader2 className='mr-2 h-4 w-4 animate-spin' />
								Uploading...
							</>
						) : (
							"Add Song"
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
export default AddSongDialog;