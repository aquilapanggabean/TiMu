import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { WorkspaceProvider } from './context/WorkspaceContext';
import { AppShell } from './components/AppShell';
import { GatewayPage } from './pages/GatewayPage';
import { AuthPage } from './pages/AuthPage';
import { VerifyCertificatePage } from './pages/VerifyCertificatePage';
import { LegalPage } from './pages/LegalPage';
import { TalentFirstQuestPage } from './pages/TalentFirstQuestPage';
import { TalentDashboardPage } from './pages/TalentDashboardPage';
import { TalentOpportunitiesPage } from './pages/TalentOpportunitiesPage';
import { TalentProfilePage } from './pages/TalentProfilePage';
import { EmployerDiscoverPage } from './pages/EmployerDiscoverPage';
import { EmployerProjectsPage } from './pages/EmployerProjectsPage';
import { EmployerBillingPage } from './pages/EmployerBillingPage';
import { ChatPage } from './pages/ChatPage';

export default function App() {
  return (
    <ErrorBoundary>
      <WorkspaceProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Entry, Verification & Legal */}
            <Route path="/" element={<GatewayPage />} />
            <Route path="/login" element={<AuthPage mode="login" />} />
            <Route path="/signup" element={<AuthPage mode="signup" />} />
            <Route path="/verify/:code" element={<VerifyCertificatePage />} />
            <Route path="/legal/terms" element={<LegalPage section="terms" />} />
            <Route path="/legal/privacy" element={<LegalPage section="privacy" />} />
            <Route path="/legal/escrow-policy" element={<LegalPage section="escrow" />} />

            {/* Talent Mode Routes */}
            <Route
              path="/talent/first-quest"
              element={
                <AppShell>
                  <TalentFirstQuestPage />
                </AppShell>
              }
            />
            <Route
              path="/talent/dashboard"
              element={
                <AppShell>
                  <TalentDashboardPage />
                </AppShell>
              }
            />
            <Route
              path="/talent/projects"
              element={
                <AppShell>
                  <TalentOpportunitiesPage />
                </AppShell>
              }
            />
            <Route
              path="/talent/opportunities"
              element={
                <AppShell>
                  <TalentOpportunitiesPage />
                </AppShell>
              }
            />
            <Route
              path="/talent/chat"
              element={
                <AppShell>
                  <ChatPage role="talent" />
                </AppShell>
              }
            />
            <Route
              path="/talent/profile"
              element={
                <AppShell>
                  <TalentProfilePage />
                </AppShell>
              }
            />

            {/* Employer / SME Mode Routes */}
            <Route
              path="/employer/discover"
              element={
                <AppShell>
                  <EmployerDiscoverPage />
                </AppShell>
              }
            />
            <Route
              path="/employer/projects"
              element={
                <AppShell>
                  <EmployerProjectsPage />
                </AppShell>
              }
            />
            <Route
              path="/employer/chat"
              element={
                <AppShell>
                  <ChatPage role="employer" />
                </AppShell>
              }
            />
            <Route
              path="/employer/profile"
              element={
                <AppShell>
                  <EmployerBillingPage />
                </AppShell>
              }
            />
            <Route
              path="/employer/billing"
              element={
                <AppShell>
                  <EmployerBillingPage />
                </AppShell>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </WorkspaceProvider>
    </ErrorBoundary>
  );
}
