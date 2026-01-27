import { useAuth0 } from '@auth0/auth0-react';

export const Homepage = () => {
    const { user, logout } = useAuth0();

    const handleLogout = () =>
        logout({ logoutParams: { returnTo: window.location.origin } });

    return (
        <div>
            <h1>Homepage</h1>

            <p>User: {user?.email}</p>

            <h2>Profile</h2>
            <pre>
                {JSON.stringify(user, null, 2)}
            </pre>

            <div>
                <button onClick={handleLogout}>
                    Logout
                </button>
            </div>
        </div>
    );
};