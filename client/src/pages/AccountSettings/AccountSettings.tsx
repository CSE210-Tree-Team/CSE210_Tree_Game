import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';
import styles from "../../css/homepage.module.css"

export const AccountSettings = () => {
    const { user, logout } = useAuth0();
    const navigate = useNavigate();

    const handleLogout = () =>
        logout({ logoutParams: { returnTo: window.location.origin } });

    const handleBackToHome = () => {
        navigate('/');
    };

    return (
        <div className={styles.homepageWrapper}>
            <div className={styles.gameContainer}>
                <h1 className={styles.helloTitle}>Account Settings</h1>
                
                <div style={{ marginTop: '20px', padding: '20px' }}>
                    <h2>Profile Information</h2>
                    <p><strong>Email:</strong> {user?.email}</p>
                    <p><strong>Name:</strong> {user?.name}</p>
                </div>

                <div style={{ marginTop: '20px' }}>
                    <button className={styles.buttonSingle} onClick={handleBackToHome}>
                        Back to Home
                    </button>
                    <button className={styles.buttonLogout} onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            </div>
        </div>
    );
};
