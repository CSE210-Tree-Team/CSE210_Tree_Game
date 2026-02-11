import { useAuth0 } from '@auth0/auth0-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../../css/account-settings.module.css';

type AccountPrefs = {
    emailUpdates: boolean;
    publicProfile: boolean;
    gameReminders: boolean;
};

const STORAGE_KEY = 'treegame.account.settings';

const defaultPrefs: AccountPrefs = {
    emailUpdates: true,
    publicProfile: true,
    gameReminders: false,
};

const formatDate = (value?: string) => {
    if (!value) return 'Not available';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return 'Not available';
    return parsed.toLocaleString();
};

export const AccountSettings = () => {
    const { user, logout } = useAuth0();
    const navigate = useNavigate();
    const [prefs, setPrefs] = useState<AccountPrefs>(defaultPrefs);

    useEffect(() => {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        try {
            const parsed = JSON.parse(raw) as Partial<AccountPrefs>;
            setPrefs({ ...defaultPrefs, ...parsed });
        } catch {
            setPrefs(defaultPrefs);
        }
    }, []);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    }, [prefs]);

    const displayName = useMemo(() => {
        if (!user) return 'Player';
        return user.name || user.nickname || user.email || 'Player';
    }, [user]);

    return (
        <div className={styles.page}>
            <div className={styles.content}>
                <header className={styles.header}>
                    <div className={styles.headerActions}>
                        <button className={styles.backButton} onClick={() => navigate('/')}>Back to Home</button>
                        <button
                            className={styles.logoutButton}
                            onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
                        >
                            Log out
                        </button>
                    </div>
                    <div className={styles.titleBlock}>
                        <p className={styles.kicker}>Account Settings</p>
                        <h1 className={styles.title}>Welcome back, {displayName}</h1>
                        <p className={styles.subtitle}>Review your profile details and tune how your account behaves.</p>
                    </div>
                </header>

                <main className={styles.grid}>
                    <section className={styles.card}>
                        <div className={styles.cardHeader}>
                            <h2 className={styles.cardTitle}>Profile Details</h2>
                            <p className={styles.cardHint}>Synced from Auth0.</p>
                        </div>
                        <div className={styles.profileRow}>
                            <div className={styles.avatar}>
                                {user?.picture ? (
                                    <img src={user.picture} alt="Profile" />
                                ) : (
                                    <span>{displayName.slice(0, 1).toUpperCase()}</span>
                                )}
                            </div>
                            <div className={styles.profileMeta}>
                                <p className={styles.profileName}>{displayName}</p>
                                <p className={styles.profileEmail}>{user?.email || 'Email not provided'}</p>
                                <p className={styles.profileUpdated}>Last updated: {formatDate(user?.updated_at)}</p>
                            </div>
                        </div>
                        <div className={styles.profileList}>
                            <div>
                                <span>Username</span>
                                <strong>{user?.nickname || 'Not set'}</strong>
                            </div>
                            <div>
                                <span>Auth Provider</span>
                                <strong>{user?.sub?.split('|')[0] || 'Auth0'}</strong>
                            </div>
                        </div>
                    </section>

                    <section className={styles.card}>
                        <div className={styles.cardHeader}>
                            <h2 className={styles.cardTitle}>Preferences</h2>
                            <p className={styles.cardHint}>Stored locally for now.</p>
                        </div>
                        <div className={styles.toggleList}>
                            <label className={styles.toggleRow}>
                                <div>
                                    <p>Email updates</p>
                                    <span>Hear about seasonal events and tips.</span>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={prefs.emailUpdates}
                                    onChange={(event) => setPrefs({ ...prefs, emailUpdates: event.target.checked })}
                                />
                            </label>
                            <label className={styles.toggleRow}>
                                <div>
                                    <p>Public profile</p>
                                    <span>Show your tree progress to classmates.</span>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={prefs.publicProfile}
                                    onChange={(event) => setPrefs({ ...prefs, publicProfile: event.target.checked })}
                                />
                            </label>
                            <label className={styles.toggleRow}>
                                <div>
                                    <p>Game reminders</p>
                                    <span>Get nudges when your tree needs attention.</span>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={prefs.gameReminders}
                                    onChange={(event) => setPrefs({ ...prefs, gameReminders: event.target.checked })}
                                />
                            </label>
                        </div>
                    </section>

                    <section className={styles.card}>
                        <div className={styles.cardHeader}>
                            <h2 className={styles.cardTitle}>Security</h2>
                            <p className={styles.cardHint}>Keep your account protected.</p>
                        </div>
                        <div className={styles.securityActions}>
                            <button
                                className={styles.primaryButton}
                                onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
                            >
                                Log out
                            </button>
                            <button className={styles.secondaryButton} disabled>
                                Reset password (coming soon)
                            </button>
                            <button className={styles.dangerButton} disabled>
                                Delete account (coming soon)
                            </button>
                        </div>
                    </section>
                </main>
            </div>
        </div>
    );
};
