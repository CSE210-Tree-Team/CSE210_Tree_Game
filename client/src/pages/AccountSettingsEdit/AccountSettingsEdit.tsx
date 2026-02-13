import { useAuth0 } from '@auth0/auth0-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../../components/account-settings-edit.module.css';

type SavedProfile = {
    name: string;
    identity: string;
    email: string;
    educationLevel: string;
};

const STORAGE_KEY = 'treegame.account.profile';

export const AccountSettingsEdit = () => {
    const { user } = useAuth0();
    const navigate = useNavigate();

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
                                onChange={(event) => setFormData({ ...formData, educationLevel: event.target.value })}
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
