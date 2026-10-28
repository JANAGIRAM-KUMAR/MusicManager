import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Music } from "lucide-react";
import SongsTable from "./SongsTable";
import AddSongDialog from "./AddSongDialog";

const SongsTabContent = () => {
	return (
		<Card className='bg-zinc-900/60 border-zinc-800 rounded-xl shadow-sm overflow-hidden'>
			<CardHeader className="border-b border-zinc-800/80 pb-4">
				<div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
					<div>
						<CardTitle className='flex items-center gap-2 text-lg text-white'>
							<Music className='size-5 text-emerald-400' />
							Music Tracks Library
						</CardTitle>
						<CardDescription className="text-zinc-400 text-xs">
							Manage audio tracks, assign to albums, or preview playback
						</CardDescription>
					</div>
					<AddSongDialog />
				</div>
			</CardHeader>
			<CardContent className="p-0 sm:p-4">
				<SongsTable />
			</CardContent>
		</Card>
	);
};

export default SongsTabContent;
