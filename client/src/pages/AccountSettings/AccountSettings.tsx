import { useAuth0 } from '@auth0/auth0-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../../components/account-settings.module.css';

type SavedProfile = {
    name: string;
    identity: string;
    email: string;
    educationLevel: string;
};

const STORAGE_KEY = 'treegame.account.profile';

export const AccountSettings = () => {
    const { user, logout } = useAuth0();
    const navigate = useNavigate();
    const [savedProfile, setSavedProfile] = useState<Partial<SavedProfile>>({});

    const defaultName = useMemo(() => {
        if (!user) return 'Player';
        return user.name || user.nickname || user.email || 'Player';
    }, [user]);

    const defaultIdentity = useMemo(() => {
        const appIdentity = user?.app_metadata?.identity;
        const roleIdentity = Array.isArray(user?.app_metadata?.roles) ? user.app_metadata.roles[0] : undefined;
        const userMetaIdentity = user?.user_metadata?.identity;
        return appIdentity || roleIdentity || userMetaIdentity || 'Student';
    }, [user]);

    const defaultEducationLevel = useMemo(() => {
        const appEducationLevel = user?.app_metadata?.educationLevel;
        const userEducationLevel = user?.user_metadata?.educationLevel;
        return appEducationLevel || userEducationLevel || '3-6';
    }, [user]);

    const defaultEmail = user?.email || 'Email not provided';

    useEffect(() => {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        try {
            const parsed = JSON.parse(raw) as Partial<SavedProfile>;
            setSavedProfile(parsed);
        } catch {
            setSavedProfile({});
        }
    }, []);

    const displayName = savedProfile.name || defaultName;
    const identity = savedProfile.identity || defaultIdentity;
    const educationLevel = savedProfile.educationLevel || defaultEducationLevel;
    const email = savedProfile.email || defaultEmail;

    return (
        <div className={styles.page}>
            <button className={styles.homeButton} onClick={() => navigate('/')} aria-label="Home">
                <span className={styles.homeArrow}>↩</span>
                <span className={styles.homeText}>HOME</span>
            </button>
            <div className={styles.content}>
                <h1 className={styles.title}>ACCOUNT SETTINGS</h1>

                <div className={styles.formArea}>
                    <div className={styles.row}>
                        <p className={styles.label}>Name:</p>
                        <div className={styles.value}>{displayName}</div>
                    </div>
                    <div className={styles.row}>
                        <p className={styles.label}>Identity:</p>
                        <div className={styles.value}>{identity}</div>
                    </div>
                    <div className={styles.row}>
                        <p className={styles.label}>Email:</p>
                        <div className={styles.value}>{email}</div>
                    </div>
                    <div className={styles.row}>
                        <p className={styles.label}>Education Level:</p>
                        <div className={styles.value}>{educationLevel}</div>
                    </div>
                </div>

                <div className={styles.actions}>
                    <button className={styles.actionButton} onClick={() => navigate('/account/edit')}>EDIT</button>
                    <button
                        className={styles.actionButton}
                        onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
                    >
                        LOG OUT
                    </button>
                </div>
            </div>
        </div>
    );
};
