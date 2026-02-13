import { useAuth0 } from '@auth0/auth0-react';
import { Login } from './pages/Login/Login';
import { Homepage } from './pages/Home/homepage';
import { Welcome } from './pages/Home/Welcome';
import SoilGame from './pages/SoilGame/index';
import { WaterGame } from './pages/WaterGame/WaterGame';
import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

function App() {
    const { isLoading, isAuthenticated } = useAuth0();

    if (isLoading) {
        return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading...</div>;
    }

    //return isAuthenticated ? <Homepage /> : <Login />;
    return (
        <BrowserRouter>
            <Routes>
                {/* If not logged in, always show login */}
                {!isAuthenticated ? (
                    <>
                        { /* Add welcome page*/}
                        <Route path="/" element={<Welcome />} />
                        <Route path="/login" element={<Login isSignup={false} />} />
                        <Route path="/signup" element={<Login isSignup={true} />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </>
                ) : (
                    <>
                        {/* After login, redirect to homepage */}
                        <Route path="/" element={<Homepage />} />
                            <Route path="/soil" element={<SoilGame />} />
                        <Route path="/water" element={<WaterGame />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </>
                )}

            </Routes>
        </BrowserRouter>
    );
}

export default App;