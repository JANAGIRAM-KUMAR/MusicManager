import Topbar from '@/components/Topbar'
import { useMusicStore } from '@/stores/useMusicStore'
import { useEffect } from 'react'
import FeaturedSongs from './components/FeaturedSongs';
import { ScrollArea } from '@/components/ui/scroll-area';
import SectionGrid from './components/SectionGrid';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { useAuth } from '@clerk/clerk-react';
import { HeadphonesIcon } from 'lucide-react';

const HomePage = () => {
  const {fetchFeaturedSongs, fetchMadeForYouSongs, fetchTrendingSongs, 
    isLoading, madeForYouSongs, featuredSongs,trendingSongs}= useMusicStore();

  const {initializeQueue} = usePlayerStore();

  const {isSignedIn} = useAuth();

  useEffect(() => {
    fetchFeaturedSongs();
    fetchMadeForYouSongs();
    fetchTrendingSongs();
  },[fetchFeaturedSongs, fetchMadeForYouSongs, fetchTrendingSongs]);

  useEffect(() => {
    if(madeForYouSongs.length > 0 && trendingSongs.length > 0 && featuredSongs.length > 0) {
      const allSongs = [...featuredSongs,...madeForYouSongs, ...trendingSongs];
      initializeQueue(allSongs);
    }
  },[initializeQueue])

  return (
    <div className='rounded-md overflow-hidden h-full bg-gradient-to-b from-zinc-800 via-zinc-900 '>
      <Topbar />
      {!isSignedIn && (
        //please sign in
        <div className='h-full flex flex-col items-center justify-center p-6 text-center space-y-4'>
          <div className='relative'>
            <div
              className='absolute -inset-1 bg-gradient-to-r from-emerald-500 to-sky-500 rounded-full blur-lg 
             opacity-75 animate-pulse'
              aria-hidden='true'
            />
            <div className='relative bg-zinc-900 rounded-full p-4'>
              <HeadphonesIcon className='size-8 text-emerald-400' />
            </div>
          </div>

          <div className='space-y-2 max-w-[250px]'>
            <p className='text-sm text-zinc-400'>Login to discover music</p>
          </div>
        </div>
      )}
      <ScrollArea className='h-[calc(100vh-180px)]'>
        <div className='p-4 sm:p-6 '>
          <h1 className='text-2xl sm: text-3xl font-bold mb-6'>
            Good Morning
          </h1>
          <FeaturedSongs />
        
        <div className='space-y-8'>
          <SectionGrid title='Made for you' songs={madeForYouSongs} isLoading={isLoading} />
          <SectionGrid title='Trending' songs={trendingSongs} isLoading={isLoading} />
        </div>
        </div>
      </ScrollArea>
      
      
    </div>
  )
}

export default HomePage

