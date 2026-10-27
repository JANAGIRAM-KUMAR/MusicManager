import { Button } from "@/components/ui/button";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { type Song } from "@/types";
import { Pause, Play } from "lucide-react";

const PlayButton = ({ song }: { song: Song }) => {
	const currentSong = usePlayerStore((state) => state.currentSong);
	const isPlaying = usePlayerStore((state) => state.isPlaying);
	const togglePlay = usePlayerStore((state) => state.togglePlay);
	const playSong = usePlayerStore((state) => state.playSong);
	const isCurrentSong = currentSong?._id === song._id;

	const handlePlay = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		if (isCurrentSong) {
			togglePlay();
		} else {
			playSong(song);
		}
	};

	return (
		<Button
			size={"icon"}
			onClick={handlePlay}
			className={`absolute bottom-7 right-3 bg-emerald-500 hover:bg-emerald-400 transition-all rounded-full
				opacity-0 translate-y-2 ${
					isCurrentSong ? "opacity-100 translate-y-0" : "opacity-0 group-hover:opacity-100 group-hover:translate-y-0"
				}`}
		>
			{isCurrentSong && isPlaying ? (
				<Pause className='size-5 text-black fill-current' />
			) : (
				<Play className='size-5 text-black fill-current translate-x-px' />
			)}
		</Button>
	);
};
export default PlayButton;