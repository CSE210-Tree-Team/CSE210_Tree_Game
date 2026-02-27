import { useAuth0 } from '@auth0/auth0-react';
import { useEffect, useState } from 'react';

export interface UserInfo {
    success: boolean;
    user: {
        username: string;
        displayName: string;
        email: string;
        roles: string[];
    };
    tree: {
        treeID: string;
        health: string;
        growthStage: number;
        resourceLevels: {
            water: number;
            earth: number;
            sun: number;
        };
    };
}

export const useFetchUserInfo = () => {
    const { user, getAccessTokenSilently } = useAuth0();
    const [userInfo, setUserInfo] = useState<UserInfo|null>(null);
    useEffect(() => {
        // Replace with actual user info fetch
        //setUserInfo(userInfoMock);
        // Establish backend session after Auth0 login
        const establishSession = async () => {
            try {
                const token = await getAccessTokenSilently();
                await fetch('/api/auth/verify', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ user })
                });

                // Fetch user info including resource levels
                const response = await fetch('/api/get-user-info');
                if (response.ok) {
                    const data = await response.json();
                    setUserInfo(data);
                }
            } catch (error) {
                console.error('Failed to establish backend session:', error);
            }
        };

        if (user) {
            establishSession();
        }
    }, [user, getAccessTokenSilently]);

    return { userInfo };
}