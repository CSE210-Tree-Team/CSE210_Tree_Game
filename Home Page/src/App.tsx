import { useAuth0 } from '@auth0/auth0-react';
import { Login } from './pages/Login';
import { Homepage } from './pages/homepage';
import './App.css';

function App() {
    const { isLoading, isAuthenticated } = useAuth0();

    if (isLoading) {
        return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading...</div>;
    }

    return isAuthenticated ? <Homepage /> : <Login />;
}

export default App;