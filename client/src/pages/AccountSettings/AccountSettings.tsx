import { useAuth0 } from '@auth0/auth0-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../../components/account-settings.module.css';

type SavedProfile = {
    name: string;
    identity: string;
    email: string;
    educationLevel: string;
};

const STORAGE_KEY = 'treegame.account.profile';

const useProfileDefaults = (user: ReturnType<typeof useAuth0>['user']) => {
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

    return { defaultName, defaultIdentity, defaultEducationLevel, defaultEmail };
};

export const AccountSettings = () => {
    const { user, logout } = useAuth0();
    const navigate = useNavigate();
    const [savedProfile, setSavedProfile] = useState<Partial<SavedProfile>>({});

    const { defaultName, defaultIdentity, defaultEducationLevel, defaultEmail } = useProfileDefaults(user);

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

export const AccountSettingsEdit = () => {
    const { user } = useAuth0();
    const navigate = useNavigate();
    const { defaultName, defaultIdentity, defaultEducationLevel, defaultEmail } = useProfileDefaults(user);

    const [formData, setFormData] = useState<SavedProfile>({
        name: defaultName,
        identity: defaultIdentity,
        email: defaultEmail,
        educationLevel: defaultEducationLevel,
    });

    useEffect(() => {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        try {
            const parsed = JSON.parse(raw) as Partial<SavedProfile>;
            setFormData((prev) => ({
                ...prev,
                ...parsed,
            }));
        } catch {
            // Ignore invalid local profile data and keep defaults.
        }
    }, []);

    useEffect(() => {
        setFormData((prev) => ({
            ...prev,
            name: prev.name || defaultName,
            identity: prev.identity || defaultIdentity,
            email: prev.email || defaultEmail,
            educationLevel: prev.educationLevel || defaultEducationLevel,
        }));
    }, [defaultName, defaultIdentity, defaultEmail, defaultEducationLevel]);

    const handleSave = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
        navigate('/account');
    };

    return (
        <div className={styles.page}>
            <button className={styles.homeButton} onClick={() => navigate('/')} aria-label="Home">
                <span className={styles.homeArrow}>↩</span>
                <span className={styles.homeText}>HOME</span>
            </button>

            <div className={styles.content}>
                <h1 className={styles.title}>ACCOUNT SETTINGS</h1>

                <form className={styles.formArea} onSubmit={handleSave}>
                    <div className={styles.row}>
                        <label htmlFor="name" className={styles.label}>Name:</label>
                        <input
                            id="name"
                            className={styles.input}
                            value={formData.name}
                            onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                        />
                    </div>

                    <div className={styles.row}>
                        <label htmlFor="identity" className={styles.label}>Identity:</label>
                        <div className={styles.selectWrap}>
                            <select
                                id="identity"
                                className={styles.select}
                                value={formData.identity}
                                onChange={(event) => setFormData({ ...formData, identity: event.target.value })}
                            >
                                <option>Student</option>
                                <option>Teacher</option>
                                <option>Parent</option>
                            </select>
                            <span className={styles.arrow}>▼</span>
                        </div>
                    </div>

                    <div className={styles.row}>
                        <label htmlFor="email" className={styles.label}>Email:</label>
                        <input
                            id="email"
                            className={styles.input}
                            value={formData.email}
                            onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                        />
                    </div>

                    <div className={styles.row}>
                        <label htmlFor="educationLevel" className={styles.label}>Education Level:</label>
                        <div className={styles.selectWrap}>
                            <select
                                id="educationLevel"
                                className={styles.select}
                                value={formData.educationLevel}
                                onChange={(event) =>
                                    setFormData({ ...formData, educationLevel: event.target.value })
                                }
                            >
                                <option>3-6</option>
                                <option>6-8</option>
                                <option>9-12</option>
                            </select>
                            <span className={styles.arrow}>▼</span>
                        </div>
                    </div>

                    <div className={styles.actions}>
                        <button className={styles.actionButton} type="submit">SAVE</button>
                        <button className={styles.actionButton} type="button" onClick={() => navigate('/account')}>CANCEL</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
