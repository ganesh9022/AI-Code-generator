import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import useLazyApi, { BackendEndpoints, FetchOptions } from './useLazyApi';
import { RequestStatus } from '../components/Layout/types';

interface TokenStatus {
    status: RequestStatus;
    expiresAt?: Date;
}

interface TokenResponse {
    status: RequestStatus;
    expires_at: string;
}

interface TokenState {
    status: TokenStatus | null;
    timeLeft: string;
}

export const useGithubToken = (email: string | undefined) => {
    const [state, setState] = useState<TokenState>({
        status: null,
        timeLeft: ""
    });
    const { fetchData, error: tokenError, data: tokenData } = useLazyApi<TokenResponse>(BackendEndpoints.GetGithubToken);
    const animationFrameRef = useRef<number>();
    const lastUpdateRef = useRef<number>(0);

    const formatTimeLeft = (diff: number): string => {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        if (hours > 0) return `${hours}h ${minutes}m`;
        if (minutes > 0) return `${minutes}m ${seconds}s`;
        return `${seconds}s`;
    };

    const updateTokenState = useCallback((expiryDate?: Date | null) => {
        if (!expiryDate) {
            setState({ status: null, timeLeft: "" });
            localStorage.removeItem('githubTokenExpiry');
            return false;
        }

        const now = new Date();
        if (expiryDate <= now) {
            setState({ status: null, timeLeft: "" });
            localStorage.removeItem('githubTokenExpiry');
            return false;
        }

        const diff = expiryDate.getTime() - now.getTime();
        setState({
            status: { status: RequestStatus.SUCCESS, expiresAt: expiryDate },
            timeLeft: formatTimeLeft(diff)
        });
        return true;
    }, []);

    const startTokenTimer = useCallback((expiryDate: Date) => {
        const updateTimer = (timestamp: number) => {
            // Update only once per second
            if (timestamp - lastUpdateRef.current >= 1000) {
                lastUpdateRef.current = timestamp;
                const shouldContinue = updateTokenState(expiryDate);
                if (!shouldContinue) {
                    return;
                }
            }
            animationFrameRef.current = requestAnimationFrame(updateTimer);
        };

        animationFrameRef.current = requestAnimationFrame(updateTimer);
    }, [updateTokenState]);

    // Combined token management effect
    useEffect(() => {
        // Clear existing animation frame
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }

        // Handle new token data
        if (tokenData?.status === RequestStatus.SUCCESS && tokenData.expires_at) {
            const expiryDate = new Date(tokenData.expires_at);
            localStorage.setItem('githubTokenExpiry', tokenData.expires_at);
            updateTokenState(expiryDate);
            startTokenTimer(expiryDate);
            toast.success("Successfully connected to GitHub!");
        } 
        // Handle token error
        else if (tokenError) {
            setState({ status: { status: RequestStatus.FAILED }, timeLeft: "" });
            toast.error("Failed to connect to GitHub: " + tokenError);
        }
        // Load stored token on mount
        else {
            const storedExpiry = localStorage.getItem('githubTokenExpiry');
            if (storedExpiry) {
                const expiryDate = new Date(storedExpiry);
                if (updateTokenState(expiryDate)) {
                    startTokenTimer(expiryDate);
                }
            }
        }

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [tokenData, tokenError, updateTokenState, startTokenTimer]);

    const handleTokenRequest = useCallback((code: string) => {
        if (!email) {
            toast.error("No email address found in user profile");
            return;
        }
        const options: FetchOptions = {
            data: {
                code,
                email
            }
        };
        fetchData(options);
    }, [email, fetchData]);

    return {
        tokenStatus: state.status,
        timeLeft: state.timeLeft,
        handleTokenRequest,
        isLoading: Boolean(tokenData === undefined && !tokenError)
    };
}; 
