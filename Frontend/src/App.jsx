import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Styles
import './App.css';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Timeline from './pages/Timeline';
import Groups from './pages/Groups';
import Topics from './pages/Topics';
import Events from './pages/Events';
import Messages from './pages/Messages';
import Jobs from './pages/Jobs';
import JobDetails from './pages/JobDetails';
import Mentorship from './pages/Mentorship';
import FindMentor from './pages/FindMentor';
import MentorshipDetails from './pages/MentorshipDetails';
import Resources from './pages/Resources';
import ResourceDetails from './pages/ResourceDetails';
import SearchResults from './pages/SearchResults';
import Analytics from './pages/Analytics';

// Components
import Navbar from './components/Navbar';
import LoadingSpinner from './components/LoadingSpinner';

// Create Material-UI theme with enhanced styling
const theme = createTheme({
  palette: {
    primary: {
      main: '#00C851',
      light: '#4CAF50',
      dark: '#388E3C',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#2196F3',
      light: '#64B5F6',
      dark: '#1976D2',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f8f9fa',
      paper: '#ffffff',
    },
    text: {
      primary: '#1a1a1a',
      secondary: '#666666',
      disabled: '#999999',
    },
    divider: '#e0e0e0',
    success: {
      main: '#4caf50',
      light: '#81c784',
      dark: '#388e3c',
    },
    error: {
      main: '#f44336',
      light: '#e57373',
      dark: '#d32f2f',
    },
    warning: {
      main: '#ff9800',
      light: '#ffb74d',
      dark: '#f57c00',
    },
    info: {
      main: '#2196f3',
      light: '#64b5f6',
      dark: '#1976d2',
    },
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 960,
      lg: 1280,
      xl: 1920,
    },
  },
});

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Public Route Component (redirect if authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return !isAuthenticated ? children : <Navigate to="/" replace />;
};

// Main App Layout
const AppLayout = ({ children }) => {
  const { user } = useAuth();
  
  return (
    <div className="app-container">
      {user && <Navbar />}
      <main className="main-content fade-in">
        {children}
      </main>
    </div>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <div className="app-root" style={{
            minHeight: '100vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'stretch',
            background: 'linear-gradient(90deg, #e0f7e9 0%, #ffffff 50%, #e0f7e9 100%)'
          }}>
            <div style={{
              flex: 1,
              maxWidth: 1440,
              background: 'rgba(255,255,255,0.95)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
              borderRadius: 16,
              margin: '32px 0',
              padding: '0 24px',
            }}>
              <Routes>
                {/* Public Routes */}
                <Route 
                  path="/login" 
                  element={
                    <PublicRoute>
                      <div className="app-container">
                        <Login />
                      </div>
                    </PublicRoute>
                  }
                />
                <Route 
                  path="/register" 
                  element={
                    <PublicRoute>
                      <div className="app-container">
                        <Register />
                      </div>
                    </PublicRoute>
                  }
                />

                {/* Protected Routes */}
                <Route 
                  path="/" 
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Timeline />
                      </AppLayout>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/groups" 
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Groups />
                      </AppLayout>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/topics" 
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Topics />
                      </AppLayout>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/events" 
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Events />
                      </AppLayout>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/messages" 
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Messages />
                      </AppLayout>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/jobs" 
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Jobs />
                      </AppLayout>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/jobs/:id" 
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <JobDetails />
                      </AppLayout>
                    </ProtectedRoute>
                  } 
                />

                {/* Mentorship Routes */}
                <Route 
                  path="/mentorship"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Mentorship />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route 
                  path="/mentorship/find"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <FindMentor />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route 
                  path="/mentorship/:id"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <MentorshipDetails />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />

                {/* Search Results Route */}
                <Route
                  path="/search"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <SearchResults />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />

                {/* Analytics Route */}
                <Route
                  path="/analytics"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Analytics />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />

                {/* Resource Library Route */}
                <Route 
                  path="/resources"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Resources />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route 
                  path="/resources/:id"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <ResourceDetails />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />

                {/* Catch all route */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
