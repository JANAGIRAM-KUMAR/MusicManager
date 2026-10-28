import { useMusicStore } from "@/stores/useMusicStore";
import { Library, ListMusic, PlayCircle, Users2, Headphones, Heart, Sparkles, User as UserIcon } from "lucide-react";
import StatsCard from "./StatsCard";
import { Badge } from "@/components/ui/badge";

const DashboardStats = () => {
	const { stats } = useMusicStore();

	const coreCatalog = [
		{
			icon: ListMusic,
			label: "Total Songs",
			value: (stats?.totalSongs ?? 0).toLocaleString(),
			bgColor: "bg-emerald-500/10",
			iconColor: "text-emerald-400",
		},
		{
			icon: Library,
			label: "Total Albums",
			value: (stats?.totalAlbums ?? 0).toLocaleString(),
			bgColor: "bg-violet-500/10",
			iconColor: "text-violet-400",
		},
		{
			icon: Users2,
			label: "Total Artists",
			value: (stats?.totalArtists ?? 0).toLocaleString(),
			bgColor: "bg-orange-500/10",
			iconColor: "text-orange-400",
		},
		{
			icon: PlayCircle,
			label: "Total Users",
			value: (stats?.totalUsers ?? 0).toLocaleString(),
			bgColor: "bg-sky-500/10",
			iconColor: "text-sky-400",
		},
	];

	const engagementMetrics = [
		{
			icon: Headphones,
			label: "Total Streams (Plays)",
			value: (stats?.totalPlays ?? 0).toLocaleString(),
			bgColor: "bg-rose-500/10",
			iconColor: "text-rose-400",
		},
		{
			icon: ListMusic,
			label: "Playlists Created",
			value: (stats?.totalPlaylists ?? 0).toLocaleString(),
			bgColor: "bg-indigo-500/10",
			iconColor: "text-indigo-400",
		},
		{
			icon: Heart,
			label: "Songs Liked",
			value: (stats?.totalLikes ?? 0).toLocaleString(),
			bgColor: "bg-pink-500/10",
			iconColor: "text-pink-400",
		},
	];

	return (
		<div className="space-y-4 mb-8">
			{/* Core Platform Metrics */}
			<div className='grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4'>
				{coreCatalog.map((stat) => (
					<StatsCard
						key={stat.label}
						icon={stat.icon}
						label={stat.label}
						value={stat.value}
						bgColor={stat.bgColor}
						iconColor={stat.iconColor}
					/>
				))}
			</div>

			{/* Secondary Engagement Metrics */}
			<div className='grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4'>
				{engagementMetrics.map((stat) => (
					<StatsCard
						key={stat.label}
						icon={stat.icon}
						label={stat.label}
						value={stat.value}
						bgColor={stat.bgColor}
						iconColor={stat.iconColor}
					/>
				))}
			</div>

			{/* Intelligence Overview Cards */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-1">
				{/* Top Streamed Tracks */}
				<div className="rounded-xl border border-zinc-800/90 bg-zinc-900/60 p-4 sm:p-5 shadow-sm">
					<div className="flex items-center justify-between mb-3.5">
						<div className="flex items-center gap-2">
							<div className="size-7 rounded-lg bg-emerald-500/10 grid place-items-center text-emerald-400">
								<Sparkles className="size-4" />
							</div>
							<h3 className="text-sm font-semibold text-white">Top Streamed Tracks</h3>
						</div>
						<span className="text-xs text-zinc-400 font-medium">All-time plays</span>
					</div>

					{(!stats?.topSongs || stats.topSongs.length === 0) ? (
						<div className="text-center py-8 text-zinc-500 text-xs">
							No stream data recorded yet. Listen to songs to see metrics here.
						</div>
					) : (
						<div className="space-y-2">
							{stats.topSongs.map((song, idx) => (
								<div
									key={song._id}
									className="flex items-center justify-between p-2 rounded-lg bg-zinc-800/40 hover:bg-zinc-800/70 transition group"
								>
									<div className="flex items-center gap-3 min-w-0">
										<span className="font-mono text-xs text-zinc-500 font-bold w-5 text-center">
											#{idx + 1}
										</span>
										<img
											src={song.imageUrl}
											alt={song.title}
											className="size-9 rounded object-cover shadow-sm"
										/>
										<div className="min-w-0">
											<p className="text-sm font-medium text-white truncate">{song.title}</p>
											<p className="text-xs text-zinc-400 truncate">{song.artist}</p>
										</div>
									</div>
									<Badge variant="secondary" className="bg-emerald-500/15 text-emerald-300 border-none font-mono text-xs">
										{song.plays} {song.plays === 1 ? "play" : "plays"}
									</Badge>
								</div>
							))}
						</div>
					)}
				</div>

				{/* Recent User Signups */}
				<div className="rounded-xl border border-zinc-800/90 bg-zinc-900/60 p-4 sm:p-5 shadow-sm">
					<div className="flex items-center justify-between mb-3.5">
						<div className="flex items-center gap-2">
							<div className="size-7 rounded-lg bg-sky-500/10 grid place-items-center text-sky-400">
								<Users2 className="size-4" />
							</div>
							<h3 className="text-sm font-semibold text-white">Recent Listener Registrations</h3>
						</div>
						<span className="text-xs text-zinc-400 font-medium">Latest 5 users</span>
					</div>

					{(!stats?.recentUsers || stats.recentUsers.length === 0) ? (
						<div className="text-center py-8 text-zinc-500 text-xs">
							No registered users found.
						</div>
					) : (
						<div className="space-y-2">
							{stats.recentUsers.map((user) => (
								<div
									key={user._id}
									className="flex items-center justify-between p-2 rounded-lg bg-zinc-800/40 hover:bg-zinc-800/70 transition"
								>
									<div className="flex items-center gap-3 min-w-0">
										<div className="size-9 rounded-full bg-zinc-700/80 border border-zinc-600/50 grid place-items-center overflow-hidden shrink-0">
											{user.imageUrl ? (
												<img src={user.imageUrl} alt={user.fullName} className="size-full object-cover" />
											) : (
												<UserIcon className="size-4 text-zinc-400" />
											)}
										</div>
										<div className="min-w-0">
											<p className="text-sm font-medium text-white truncate">{user.fullName}</p>
											<p className="text-xs text-zinc-400 truncate">{user.email}</p>
										</div>
									</div>
									<div className="flex items-center gap-2 shrink-0">
										<Badge variant="outline" className="text-[10px] uppercase border-zinc-700 text-zinc-400 font-mono">
											{user.authProvider || "local"}
										</Badge>
										<span className="text-[11px] text-zinc-500 hidden sm:inline">
											{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : ""}
										</span>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
};
export default DashboardStats;
