import { useAuth0 } from '@auth0/auth0-react';
import { Login } from './pages/Login/Login';
import { Homepage } from './pages/Home/homepage';
import { SoilGame } from './pages/SoilGame/SoilGame';
import { WaterGame } from './pages/WaterGame/WaterGame';
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
                <Route path="*" element={<Login />} />
                ) : (
                <>
                    <Route path="/" element={<Homepage />} />
                    <Route path="/soil" element={<SoilGame />} />
                    <Route path="/water" element={<WaterGame />} />
                </>
                )}
            </Routes>
        </BrowserRouter>
    );
}

export default App;