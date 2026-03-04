/*
Account Settings pages
- AccountSettings: read-only profile display and navigation.
- AccountSettingsEdit: editable profile form with client-side email validation.
- API calls are routed through `ServerCalls.ts` to keep fetch logic centralized.
*/

import { useAuth0 } from '@auth0/auth0-react';
import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/Button';
import styles from '../../components/account-settings.module.css';
import {
    type UserInfoResponse,
    establishAuthSession,
    fetchUserInfo,
    updateAccountProfile,
} from '../ServerCalls/ServerCalls';

const EDUCATION_LEVELS = ['3-6', '6-8', '9-12'] as const;
const DEFAULT_EDUCATION_LEVEL = EDUCATION_LEVELS[0];

const isValidOptionalEmail = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
};

const useProfileDefaults = (user: ReturnType<typeof useAuth0>['user']) => {
    const defaultName = user?.name || user?.nickname || user?.email || 'Player';

    return { defaultName };
};

export const AccountSettings = () => {
    const { user, logout, getAccessTokenSilently } = useAuth0();
    const navigate = useNavigate();
    const [profile, setProfile] = useState<UserInfoResponse['user'] | null>(null);

    const { defaultName } = useProfileDefaults(user);

    useEffect(() => {
        const load = async () => {
            if (!user) return;

            try {
                const token = await getAccessTokenSilently();
                await establishAuthSession(token, user);
            } catch {
                // If session establishment fails, the profile request may still succeed (e.g., existing session).
            }

            try {
                const data = await fetchUserInfo();
                if (data?.user) setProfile(data.user);
            } catch {
                // Ignore profile load errors and fall back to defaults.
            }
        };

        load();
    }, [user]);

    const displayName = profile?.displayName || defaultName;
    const contactEmail = profile?.contactEmail || '';
    const educationLevel = profile?.educationLevel || DEFAULT_EDUCATION_LEVEL;

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
                        <p className={styles.label}>Contact Email:</p>
                        <div className={styles.value}>{contactEmail || '(not set)'}</div>
                    </div>
                    <div className={styles.row}>
                        <p className={styles.label}>Education Level:</p>
                        <div className={styles.value}>{educationLevel}</div>
                    </div>
                </div>

                <div className={styles.actions}>
                    <Button
                        variant="grass"
                        label="EDIT"
                        className={styles.actionButton}
                        onClick={() => navigate('/account/edit')}
                    />
                    <Button
                        variant="grass"
                        label="LOG OUT"
                        className={styles.actionButton}
                        onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
                    />
                </div>
            </div>
        </div>
    );
};

export const AccountSettingsEdit = () => {
    const { user, getAccessTokenSilently } = useAuth0();
    const navigate = useNavigate();
    const { defaultName } = useProfileDefaults(user);
    const isDirtyRef = useRef(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [isContactEmailTouched, setIsContactEmailTouched] = useState(false);

    const [formData, setFormData] = useState<Partial<UserInfoResponse['user']>>({
        displayName: defaultName,
        contactEmail: '',
        educationLevel: DEFAULT_EDUCATION_LEVEL,
    });

    useEffect(() => {
        const load = async () => {
            if (!user) return;

            try {
                const token = await getAccessTokenSilently();
                await establishAuthSession(token, user);
            } catch {
                // Ignore session establishment failures.
            }

            try {
                const data = await fetchUserInfo();
                if (!data?.user) return;
                if (isDirtyRef.current) return;
                setFormData((prev) => ({
                    ...prev,
                    username: data.user.username,
                    displayName: data.user.displayName,
                    contactEmail: data.user.contactEmail || '',
                    educationLevel: data.user.educationLevel || DEFAULT_EDUCATION_LEVEL,
                }));
            } catch {
                // Ignore profile load errors and keep defaults.
            }
        };

        load();
    }, [user]);

    const contactEmailIsValid = isValidOptionalEmail(formData.contactEmail || '');
    const contactEmailError =
        isContactEmailTouched && !contactEmailIsValid
            ? 'Please enter a valid contact email address (example: name@example.com).'
            : null;

    const handleSave = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSaveError(null);

        if (!contactEmailIsValid) {
            setIsContactEmailTouched(true);
            setSaveError('Please enter a valid contact email address.');
            return;
        }

        setIsSaving(true);
        try {
            const ok = await updateAccountProfile(formData);
            if (!ok) {
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
                        <p role="alert" className={styles.errorMessage}>
                            {saveError}
                        </p>
                    ) : null}
                    <div className={styles.row}>
                        <label htmlFor="name" className={styles.label}>Name:</label>
                        <input
                            id="name"
                            className={styles.input}
                            value={formData.displayName}
                            onChange={(event) => {
                                isDirtyRef.current = true;
                                setFormData({ ...formData, displayName: event.target.value });
                            }}
                        />
                    </div>

                    <div className={styles.row}>
                        <label htmlFor="contactEmail" className={styles.label}>Contact Email:</label>
                        <input
                            id="contactEmail"
                            className={styles.input}
                            type="email"
                            inputMode="email"
                            autoComplete="email"
                            value={formData.contactEmail}
                            aria-invalid={Boolean((formData.contactEmail || '').trim()) && !contactEmailIsValid}
                            aria-describedby={contactEmailError ? 'contactEmailError' : undefined}
                            onChange={(event) => {
                                isDirtyRef.current = true;
                                if (!isContactEmailTouched) setIsContactEmailTouched(true);
                                setFormData({ ...formData, contactEmail: event.target.value });
                            }}
                            onBlur={() => setIsContactEmailTouched(true)}
                        />
                    </div>
                    {contactEmailError ? (
                        <p
                            id="contactEmailError"
                            role="alert"
                            className={styles.fieldError}
                        >
                            {contactEmailError}
                        </p>
                    ) : null}

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
                                {EDUCATION_LEVELS.map((level) => (
                                    <option key={level} value={level}>
                                        {level}
                                    </option>
                                ))}
                            </select>
                            <span className={styles.arrow}>▼</span>
                        </div>
                    </div>

                    <div className={styles.actions}>
                        <Button
                            variant="grass"
                            label="SAVE"
                            className={styles.actionButton}
                            type="submit"
                            disabled={isSaving || !contactEmailIsValid}
                        />
                        <Button
                            variant="grass"
                            label="CANCEL"
                            className={styles.actionButton}
                            type="button"
                            onClick={() => navigate('/account')}
                        />
                    </div>
                </form>
            </div>
        </div>
    );
};
