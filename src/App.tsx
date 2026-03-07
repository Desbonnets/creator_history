import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { StoreProvider } from './store/StoreContext'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import UniversePage from './pages/UniversePage'
import UniverseSettingsPage from './pages/UniverseSettingsPage'
import StoriesPage from './pages/StoriesPage'
import StoryFormPage from './pages/StoryFormPage'
import ElementListPage from './pages/ElementListPage'
import ElementFormPage from './pages/ElementFormPage'

function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="universe/:id" element={<UniversePage />} />
            <Route path="universe/:id/settings" element={<UniverseSettingsPage />} />
            <Route path="universe/:id/stories" element={<StoriesPage />} />
            <Route path="universe/:id/story/new" element={<StoryFormPage />} />
            <Route path="universe/:id/story/:storyId" element={<StoryFormPage />} />
            <Route path="universe/:id/:type" element={<ElementListPage />} />
            <Route path="universe/:id/:type/new" element={<ElementFormPage />} />
            <Route path="universe/:id/:type/:elementId" element={<ElementFormPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </StoreProvider>
  )
}

export default App
