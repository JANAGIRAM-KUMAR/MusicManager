import { UserMenu } from "@/components/UserMenu";
import { Link } from "react-router-dom";

const Header = () => {
	return (
		<div className='flex items-center justify-between'>
			<div className='flex items-center gap-3 mb-8'>
				<Link to='/' className='flex items-center gap-3 rounded-lg'>
					<img src='/logo.svg' alt='Soundwave' className='size-10' />
					<div>
						<h1 className='text-2xl font-bold sm:text-3xl'>Soundwave Admin</h1>
						<p className='text-sm text-zinc-400'>Complete control center</p>
					</div>
				</Link>
			</div>
			<UserMenu />
		</div>
	);
};
export default Header;