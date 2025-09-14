import {useRef, useState} from 'react';
import {AppState} from '../types';

export const useAppState = (): AppState & {
    setShowNetworkModal: (show: boolean) => void;
    setIsMobileMenuOpen: (open: boolean) => void;
} => {
    const [showNetworkModal, setShowNetworkModal] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const lastAuthAttemptRef = useRef<number>(0);
    const authInProgressRef = useRef<boolean>(false);

    return {
        showNetworkModal,
        isMobileMenuOpen,
        lastAuthAttemptRef,
        authInProgressRef,
        setShowNetworkModal,
        setIsMobileMenuOpen,
    };
};
