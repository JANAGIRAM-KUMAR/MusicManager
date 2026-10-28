import { Card, CardContent } from "@/components/ui/card";

type StatsCardProps = {
	icon: React.ElementType;
	label: string;
	value: string;
	bgColor: string;
	iconColor: string;
};

const StatsCard = ({ bgColor, icon: Icon, iconColor, label, value }: StatsCardProps) => {
	return (
		<Card className='bg-zinc-900/70 border-zinc-800/80 hover:border-zinc-700/80 transition-all hover:bg-zinc-900/90 shadow-sm'>
			<CardContent className='p-4 sm:p-5'>
				<div className='flex items-center gap-3.5'>
					<div className={`p-2.5 rounded-xl ${bgColor} ring-1 ring-white/5 shrink-0`}>
						<Icon className={`size-5 sm:size-6 ${iconColor}`} />
					</div>
					<div className="min-w-0 flex-1">
						<p className='text-xs font-medium text-zinc-400 truncate'>{label}</p>
						<p className='text-xl sm:text-2xl font-bold tracking-tight text-white mt-0.5'>{value}</p>
					</div>
				</div>
			</CardContent>
		</Card>
	);
};

export default StatsCard;
