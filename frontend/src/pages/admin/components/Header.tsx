import { UserMenu } from "@/components/UserMenu";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, Shield } from "lucide-react";

const Header = () => {
	return (
		<header className='flex items-center justify-between py-3 mb-6 border-b border-zinc-800/80'>
			{/* Brand identity */}
			<div className='flex items-center gap-3.5'>
				<Link to='/' className='flex items-center gap-3 group transition'>
					<div className="relative size-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 p-0.5 shadow-md shadow-emerald-500/10 group-hover:scale-105 transition-transform">
						<div className="size-full rounded-[10px] bg-black grid place-items-center">
							<img src='/logo.svg' alt='Soundwave' className='size-6' />
						</div>
					</div>
					<div>
						<div className="flex items-center gap-2">
							<h1 className='text-lg font-bold text-white tracking-tight sm:text-xl'>Soundwave</h1>
							<Badge variant="outline" className="bg-emerald-500/10 border-emerald-500/30 text-emerald-400 text-[10px] font-semibold tracking-wider uppercase py-0 gap-1 hidden xs:flex">
								<Shield className="size-2.5" /> Admin
							</Badge>
						</div>
						<p className='text-xs text-zinc-400 hidden sm:block'>Platform Control Center</p>
					</div>
				</Link>
			</div>

			{/* Navigation & User Profile */}
			<div className="flex items-center gap-3">
				<Button
					asChild
					variant="outline"
					size="sm"
					className="h-9 px-3 border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs gap-1.5 hidden md:inline-flex"
				>
					<Link to="/">
						<span>Go to Music Player</span>
						<ArrowUpRight className="size-3.5 text-zinc-400" />
					</Link>
				</Button>

				<UserMenu showDetails={true} />
			</div>
		</header>
	);
};

export default Header;
