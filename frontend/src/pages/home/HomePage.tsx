import Topbar from '@/components/Topbar'
import { useMusicStore } from '@/stores/useMusicStore'
import React, { useEffect } from 'react'
import FeaturedSongs from './components/FeaturedSongs';
import { ScrollArea } from '@/components/ui/scroll-area';
import SectionGrid from './components/SectionGrid';

const HomePage = () => {
  const {fetchFeaturedSongs, fetchMadeForYouSongs, fetchTrendingSongs, 
    isLoading, madeForYouSongs, featuredSongs, trendingSongs}= useMusicStore();

  useEffect(() => {
    fetchFeaturedSongs();
    fetchMadeForYouSongs();
    fetchTrendingSongs();
  },[fetchFeaturedSongs, fetchMadeForYouSongs, fetchTrendingSongs]);
  return (
    <div className='rounded-md overflow-hidden h-full bg-gradient-to-b from-zinc-800 via-zinc-900 '>
      <Topbar />
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