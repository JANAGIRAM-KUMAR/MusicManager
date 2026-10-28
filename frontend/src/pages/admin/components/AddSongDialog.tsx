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
import { Loader2, Plus, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import toast from "react-hot-toast";


interface NewSong {
	title: string;
	artist: string;
	duration: string;
}

const AddSongDialog = () => {
	const { albums, fetchSongs, fetchAlbums, fetchStats } = useMusicStore();
	const [songDialogOpen, setSongDialogOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [isExtracting, setIsExtracting] = useState(false);

	const [newSong, setNewSong] = useState<NewSong>({
		title: "",
		artist: "",
		duration: "0",
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
			// Try to extract duration using Audio API
			const objectUrl = URL.createObjectURL(audioFile);
			const audio = new Audio(objectUrl);
			
			const durationPromise = new Promise<number>((resolve) => {
				audio.addEventListener('loadedmetadata', () => {
					resolve(Math.round(audio.duration || 0));
				});
				audio.addEventListener('error', () => {
					resolve(0);
				});
			});
			
			const duration = await durationPromise;
			URL.revokeObjectURL(objectUrl);
			
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
				duration: duration > 0 ? duration.toString() : prev.duration,
			}));
			
			if (duration > 0) {
				toast.success(`Auto-detected duration: ${duration}s`);
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
			formData.append("duration", newSong.duration);
			formData.append("albumIds", JSON.stringify(selectedAlbumIds));

			formData.append("audioFile", files.audio);
			formData.append("imageFile", files.image);

			await axiosInstance.post("/admin/songs", formData);

			// Reset form
			setNewSong({
				title: "",
				artist: "",
				duration: "0",
			});
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
		} catch (error: any) {
			toast.error("Failed to add song: " + (error.response?.data?.message || error.message));
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

					<div className='space-y-2'>
						<label className='text-sm font-medium'>Duration (seconds) *</label>
						<Input
							type='number'
							min='0'
							value={newSong.duration}
							onChange={(e) => setNewSong({ ...newSong, duration: e.target.value || "0" })}
							className='bg-zinc-800 border-zinc-700'
							placeholder='Auto-detected from audio file'
						/>
						<p className='text-xs text-zinc-500'>You can edit this value if needed</p>
					</div>

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
								duration: "0",
							});
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