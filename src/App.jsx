import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import Layout from './components/Layout';
import Landing from './pages/Landing';

const HomeMap = lazy(() => import('./pages/HomeMap'));
const PoiDetail = lazy(() => import('./pages/PoiDetail'));
const AiAssistant = lazy(() => import('./pages/AiAssistant'));
const TripPrograms = lazy(() => import('./pages/TripPrograms'));
const TripDetail = lazy(() => import('./pages/TripDetail'));
const BookingConfirmation = lazy(() => import('./pages/BookingConfirmation'));
const MyBookings = lazy(() => import('./pages/MyBookings'));
const GuideDashboard = lazy(() => import('./pages/GuideDashboard'));
const ArtisanDirectory = lazy(() => import('./pages/ArtisanDirectory'));
const ArtisanStore = lazy(() => import('./pages/ArtisanStore'));
const ArtisanDashboard = lazy(() => import('./pages/ArtisanDashboard'));
const PartnerApply = lazy(() => import('./pages/PartnerApply'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Auth = lazy(() => import('./pages/Auth'));
const AskPage = lazy(() => import('./pages/AskPage'));
const EssentialsPage = lazy(() => import('./pages/EssentialsPage'));
const HeritagePage = lazy(() => import('./pages/HeritagePage'));
const TouristBadges = lazy(() => import('./pages/TouristBadges'));
const PromoStudio = lazy(() => import('./pages/PromoStudio'));

function RouteFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-on-surface-variant">
      <span className="material-symbols-outlined animate-pulse text-3xl text-primary">
        progress_activity
      </span>
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="promo" element={<PromoStudio />} />
              <Route element={<Layout />}>
                <Route index element={<Landing />} />
                <Route path="discover" element={<HomeMap />} />
                <Route path="poi/:poiId" element={<PoiDetail />} />
                <Route path="assistant" element={<AiAssistant />} />
                <Route path="ask" element={<AskPage />} />
                <Route path="essentials" element={<EssentialsPage />} />
                <Route path="heritage" element={<HeritagePage />} />
                <Route path="badges" element={<TouristBadges />} />
                <Route path="trips" element={<TripPrograms />} />
                <Route path="trips/:tripId" element={<TripDetail />} />
                <Route path="bookings" element={<MyBookings />} />
                <Route path="bookings/:bookingId" element={<BookingConfirmation />} />
                <Route path="guide" element={<GuideDashboard />} />
                <Route path="artisan" element={<ArtisanDashboard />} />
                <Route path="artisans" element={<ArtisanDirectory />} />
                <Route path="artisans/:listingId" element={<ArtisanStore />} />
                <Route path="partner" element={<PartnerApply />} />
                <Route path="admin" element={<AdminDashboard />} />
                <Route path="auth" element={<Auth />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
}
