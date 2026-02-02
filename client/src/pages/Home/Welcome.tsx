import { useNavigate } from 'react-router-dom';

export const Welcome = () => {
    const navigate = useNavigate();

    return (
        <div>
            <h1>Welcome to Tree Game</h1>
            <p>Introduction (To be added)</p>
            <div>
                <button onClick={() => navigate("/signup")}>Sign Up</button>
                <button onClick={() => navigate("/login")}>Log In</button>
            </div>
        </div>
    );
};