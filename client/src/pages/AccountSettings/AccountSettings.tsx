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
    type AccountProfile,
    establishAuthSession,
    fetchAccountProfile,
    updateAccountProfile,
} from '../ServerCalls/ServerCalls';

const EDUCATION_LEVELS = ['3-6', '6-8', '9-12'] as const;
const DEFAULT_EDUCATION_LEVEL = EDUCATION_LEVELS[0];

const isValidOptionalEmail = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
};

const isValidRequiredEmail = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
};

const useProfileDefaults = (user: ReturnType<typeof useAuth0>['user']) => {
    const defaultName = user?.name || user?.nickname || user?.email || 'Player';

    const defaultEmail = user?.email || 'Email not provided';

    return { defaultName, defaultEmail };
};

export const AccountSettings = () => {
    const { user, logout, getAccessTokenSilently } = useAuth0();
    const navigate = useNavigate();
    const [profile, setProfile] = useState<Partial<AccountProfile>>({});

    const { defaultName, defaultEmail } = useProfileDefaults(user);

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
                const data = await fetchAccountProfile();
                if (data?.profile) setProfile(data.profile);
            } catch {
                // Ignore profile load errors and fall back to defaults.
            }
        };

        load();
    }, [user]);

    const displayName = profile.name || defaultName;
    const parentEmail = profile.parentEmail || '';
    const educationLevel = profile.educationLevel || DEFAULT_EDUCATION_LEVEL;
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
    const { defaultName, defaultEmail } = useProfileDefaults(user);
    const isDirtyRef = useRef(false);
    const formRef = useRef<HTMLFormElement>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [isParentEmailTouched, setIsParentEmailTouched] = useState(false);
    const [isEmailTouched, setIsEmailTouched] = useState(false);

    const [formData, setFormData] = useState<AccountProfile>({
        name: defaultName,
        email: defaultEmail,
        parentEmail: '',
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
                const data = await fetchAccountProfile();
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

    const emailIsValid = isValidRequiredEmail(formData.email);
    const emailError =
        isEmailTouched && !emailIsValid
            ? 'Please enter a valid email address (example: name@example.com).'
            : null;

    const handleSave = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSaveError(null);

        if (!emailIsValid) {
            setIsEmailTouched(true);
            setSaveError('Please enter a valid email address.');
            return;
        }

        if (!parentEmailIsValid) {
            setIsParentEmailTouched(true);
            setSaveError('Please enter a valid parent email address.');
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

                <form ref={formRef} className={styles.formArea} onSubmit={handleSave}>
                    {saveError ? (
                        <p role="alert" className={styles.errorMessage}>
                            {saveError}
                        </p>
                    ) : null}
                    <div className={styles.fieldGroup}>
                        <div className={styles.row}>
                            <label htmlFor="name" className={styles.label}>
                                Name:
                            </label>
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
                    </div>

                    <div className={styles.fieldGroup}>
                        <div className={styles.row}>
                            <label htmlFor="parentEmail" className={styles.label}>
                                Parent Email:
                            </label>
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
                            <p id="parentEmailError" role="alert" className={styles.fieldError}>
                                {parentEmailError}
                            </p>
                        ) : null}
                    </div>

                    <div className={styles.fieldGroup}>
                        <div className={styles.row}>
                            <label htmlFor="email" className={styles.label}>
                                Email:
                            </label>
                            <input
                                id="email"
                                className={styles.input}
                                type="email"
                                inputMode="email"
                                autoComplete="email"
                                value={formData.email}
                                aria-invalid={!emailIsValid}
                                aria-describedby={emailError ? 'emailError' : undefined}
                                onChange={(event) => {
                                    isDirtyRef.current = true;
                                    if (!isEmailTouched) setIsEmailTouched(true);
                                    setFormData({ ...formData, email: event.target.value });
                                }}
                                onBlur={() => setIsEmailTouched(true)}
                            />
                        </div>
                        {emailError ? (
                            <p id="emailError" role="alert" className={styles.fieldError}>
                                {emailError}
                            </p>
                        ) : null}
                    </div>

                    <div className={styles.fieldGroup}>
                        <div className={styles.row}>
                            <label htmlFor="educationLevel" className={styles.label}>
                                Education Level:
                            </label>
                            <div className={styles.selectWrap}>
                                <select
                                    id="educationLevel"
                                    className={styles.select}
                                    value={formData.educationLevel}
                                    onChange={(event) => {
                                        isDirtyRef.current = true;
                                        setFormData({
                                            ...formData,
                                            educationLevel: event.target.value,
                                        });
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
                    </div>

                </form>

                <div className={styles.actions}>
                    <Button
                        variant="grass"
                        label="SAVE"
                        className={styles.actionButton}
                        type="button"
                        onClick={() => formRef.current?.requestSubmit()}
                        disabled={isSaving || !parentEmailIsValid || !emailIsValid}
                    />
                    <Button
                        variant="grass"
                        label="CANCEL"
                        className={styles.actionButton}
                        type="button"
                        onClick={() => navigate('/account')}
                    />
                </div>
            </div>
        </div>
    );
};
