import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Library } from "lucide-react";
import AddAlbumDialog from "./AddAlbumDialog";
import AlbumsTable from "./AlbumsTable";

const AlbumsTabContent = () => {
	return (
		<Card className='bg-zinc-900/60 border-zinc-800 rounded-xl shadow-sm overflow-hidden'>
			<CardHeader className="border-b border-zinc-800/80 pb-4">
				<div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
					<div>
						<CardTitle className='flex items-center gap-2 text-lg text-white'>
							<Library className='size-5 text-violet-400' />
							Albums & Collections
						</CardTitle>
						<CardDescription className="text-zinc-400 text-xs">
							Manage album discography, add songs to albums, and edit release details
						</CardDescription>
					</div>
					<AddAlbumDialog />
				</div>
			</CardHeader>
			<CardContent className="p-0 sm:p-4">
				<AlbumsTable />
			</CardContent>
		</Card>
	);
};

export default AlbumsTabContent;
