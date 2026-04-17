import { BrowserRouter, Routes, Route, Navigate } from 'react-router';

import LoginRoute from './routes/LoginRoute';
import OnboardingRoute from './routes/OnboardingRoute';
import MapRoute from './routes/MapRoute';
import GroupRoute from './routes/GroupRoute';
import { AuthGuard } from './routes/AuthGuard';
import { OnboardedGuard } from './routes/OnboardedGuard';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginRoute />} />
        <Route
          path="/onboarding"
          element={
            <AuthGuard>
              <OnboardingRoute />
            </AuthGuard>
          }
        />
        <Route
          path="/map"
          element={
            <AuthGuard>
              <OnboardedGuard>
                <MapRoute />
              </OnboardedGuard>
            </AuthGuard>
          }
        />
        <Route
          path="/groups/:id"
          element={
            <AuthGuard>
              <OnboardedGuard>
                <GroupRoute />
              </OnboardedGuard>
            </AuthGuard>
          }
        />
        <Route path="/" element={<Navigate to="/map" replace />} />
        <Route path="*" element={<Navigate to="/map" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
