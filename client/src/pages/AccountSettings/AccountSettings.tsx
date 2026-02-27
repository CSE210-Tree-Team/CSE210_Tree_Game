import { useAuth0 } from '@auth0/auth0-react';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import buttonStyles from '../../components/Button.module.css';
import styles from '../../components/account-settings.module.css';

type Profile = {
    name: string;
    email: string;
    parentEmail: string;
    educationLevel: string;
};

type AccountProfileResponse = {
    success: boolean;
    profile?: Partial<Profile>;
};

const isValidOptionalEmail = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
};

const useProfileDefaults = (user: ReturnType<typeof useAuth0>['user']) => {
    const defaultName = useMemo(() => {
        if (!user) return 'Player';
        return user.name || user.nickname || user.email || 'Player';
    }, [user]);

    const defaultEducationLevel = useMemo(() => {
        const appEducationLevel = user?.app_metadata?.educationLevel;
        const userEducationLevel = user?.user_metadata?.educationLevel;
        return appEducationLevel || userEducationLevel || '3-6';
    }, [user]);

    const defaultEmail = user?.email || 'Email not provided';

    return { defaultName, defaultEducationLevel, defaultEmail };
};

export const AccountSettings = () => {
    const { user, logout, getAccessTokenSilently } = useAuth0();
    const navigate = useNavigate();
    const [profile, setProfile] = useState<Partial<Profile>>({});

    const { defaultName, defaultEducationLevel, defaultEmail } = useProfileDefaults(user);

    useEffect(() => {
        const load = async () => {
            if (!user) return;

            try {
                const token = await getAccessTokenSilently();
                await fetch('/api/auth/verify', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    credentials: 'include',
                    body: JSON.stringify({ user }),
                });
            } catch {
                // If session establishment fails, the profile request may still succeed (e.g., existing session).
            }

            try {
                const response = await fetch('/api/account/profile', { credentials: 'include' });
                if (!response.ok) return;
                const data = (await response.json()) as AccountProfileResponse;
                if (data?.profile) setProfile(data.profile);
            } catch {
                // Ignore profile load errors and fall back to Auth0-derived defaults.
            }
        };

        load();
    }, [user]);

    const displayName = profile.name || defaultName;
    const parentEmail = profile.parentEmail || '';
    const educationLevel = profile.educationLevel || defaultEducationLevel;
    const email = profile.email || defaultEmail;

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
                        <p className={styles.label}>Parent Email:</p>
                        <div className={styles.value}>{parentEmail || '(not set)'}</div>
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
                    <button
                        className={`${buttonStyles.button} ${buttonStyles.grass} ${styles.actionButton}`}
                        onClick={() => navigate('/account/edit')}
                    >
                        EDIT
                    </button>
                    <button
                        className={`${buttonStyles.button} ${buttonStyles.grass} ${styles.actionButton}`}
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
    const { user, getAccessTokenSilently } = useAuth0();
    const navigate = useNavigate();
    const { defaultName, defaultEducationLevel, defaultEmail } = useProfileDefaults(user);
    const isDirtyRef = useRef(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [isParentEmailTouched, setIsParentEmailTouched] = useState(false);

    const [formData, setFormData] = useState<Profile>({
        name: defaultName,
        email: defaultEmail,
        parentEmail: '',
        educationLevel: defaultEducationLevel,
    });

    useEffect(() => {
        const load = async () => {
            if (!user) return;

            try {
                const token = await getAccessTokenSilently();
                await fetch('/api/auth/verify', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    credentials: 'include',
                    body: JSON.stringify({ user }),
                });
            } catch {
                // Ignore session establishment failures.
            }

            try {
                const response = await fetch('/api/account/profile', { credentials: 'include' });
                if (!response.ok) return;
                const data = (await response.json()) as AccountProfileResponse;
                if (!data?.profile) return;
                if (isDirtyRef.current) return;
                setFormData((prev) => ({
                    ...prev,
                    ...data.profile,
                }));
            } catch {
                // Ignore profile load errors and keep defaults.
            }
        };

        load();
    }, [user]);

    const parentEmailIsValid = isValidOptionalEmail(formData.parentEmail);
    const parentEmailError =
        isParentEmailTouched && !parentEmailIsValid
            ? 'Please enter a valid parent email address (example: name@example.com).'
            : null;

    const handleSave = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSaveError(null);

        if (!parentEmailIsValid) {
            setIsParentEmailTouched(true);
            setSaveError('Please enter a valid parent email address.');
            return;
        }

        setIsSaving(true);
        try {
            const response = await fetch('/api/account/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                setSaveError('Save failed. Please log in again and try again.');
                return;
            }

            navigate('/account');
        } catch {
            setSaveError('Save failed. Please try again.');
        } finally {
            setIsSaving(false);
        }
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
                    {saveError ? (
                        <p role="alert" style={{ color: 'darkred', marginTop: 0 }}>
                            {saveError}
                        </p>
                    ) : null}
                    <div className={styles.row}>
                        <label htmlFor="name" className={styles.label}>Name:</label>
                        <input
                            id="name"
                            className={styles.input}
                            value={formData.name}
                            onChange={(event) => {
                                isDirtyRef.current = true;
                                setFormData({ ...formData, name: event.target.value });
                            }}
                        />
                    </div>

                    <div className={styles.row}>
                        <label htmlFor="parentEmail" className={styles.label}>Parent Email:</label>
                        <input
                            id="parentEmail"
                            className={styles.input}
                            type="email"
                            inputMode="email"
                            autoComplete="email"
                            value={formData.parentEmail}
                            aria-invalid={Boolean(formData.parentEmail.trim()) && !parentEmailIsValid}
                            aria-describedby={parentEmailError ? 'parentEmailError' : undefined}
                            onChange={(event) => {
                                isDirtyRef.current = true;
                                if (!isParentEmailTouched) setIsParentEmailTouched(true);
                                setFormData({ ...formData, parentEmail: event.target.value });
                            }}
                            onBlur={() => setIsParentEmailTouched(true)}
                        />
                    </div>
                    {parentEmailError ? (
                        <p
                            id="parentEmailError"
                            role="alert"
                            style={{ color: 'darkred', margin: '-10px 0 0', textAlign: 'center' }}
                        >
                            {parentEmailError}
                        </p>
                    ) : null}

                    <div className={styles.row}>
                        <label htmlFor="email" className={styles.label}>Email:</label>
                        <input
                            id="email"
                            className={styles.input}
                            value={formData.email}
                            onChange={(event) => {
                                isDirtyRef.current = true;
                                setFormData({ ...formData, email: event.target.value });
                            }}
                        />
                    </div>

                    <div className={styles.row}>
                        <label htmlFor="educationLevel" className={styles.label}>Education Level:</label>
                        <div className={styles.selectWrap}>
                            <select
                                id="educationLevel"
                                className={styles.select}
                                value={formData.educationLevel}
                                onChange={(event) => {
                                    isDirtyRef.current = true;
                                    setFormData({ ...formData, educationLevel: event.target.value });
                                }}
                            >
                                <option>3-6</option>
                                <option>6-8</option>
                                <option>9-12</option>
                            </select>
                            <span className={styles.arrow}>▼</span>
                        </div>
                    </div>

                    <div className={styles.actions}>
                        <button
                            className={`${buttonStyles.button} ${buttonStyles.grass} ${styles.actionButton}`}
                            type="submit"
                            disabled={isSaving || !parentEmailIsValid}
                        >
                            SAVE
                        </button>
                        <button
                            className={`${buttonStyles.button} ${buttonStyles.grass} ${styles.actionButton}`}
                            type="button"
                            onClick={() => navigate('/account')}
                        >
                            CANCEL
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
