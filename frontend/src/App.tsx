import { Route, Routes } from "react-router-dom"
import HomePage from "./pages/home/HomePage"
import MainLayout from "./layout/MainLayout"
import AlbumPage from "./album/AlbumPage"
import AdminPage from "./pages/admin/AdminPage"
import SearchPage from "./pages/search/SearchPage"
import LibraryPage from "./pages/library/LibraryPage"
import LikedSongsPage from "./pages/liked/LikedSongsPage"
import PlaylistPage from "./pages/playlist/PlaylistPage"
import ArtistPage from "./pages/artist/ArtistPage"

import { Toaster } from "react-hot-toast"

const App = () => {
  return (
    <>
    <Routes>
      
      <Route path="/admin" element={<AdminPage />} />
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/library" element={<LibraryPage />} />
        <Route path="/liked" element={<LikedSongsPage />} />
        <Route path="/playlist/:playlistId" element={<PlaylistPage />} />
        <Route path="/artist/:artistName" element={<ArtistPage />} />
        <Route path="/albums/:albumId" element={<AlbumPage />} />
      </Route>
    </Routes>
    <Toaster />
    </>
  )
}

export default App
