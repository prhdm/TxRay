import React from 'react';
import {Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,} from '@/ui';

interface NetworkSwitchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSwitch: () => Promise<void>;
    targetChainName: string;
    isSwitching: boolean;
}

export const NetworkSwitchModal: React.FC<NetworkSwitchModalProps> = ({
                                                                          isOpen,
                                                                          onClose,
                                                                          onSwitch,
                                                                          targetChainName,
                                                                          isSwitching,
                                                                      }) => {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Wrong Network</DialogTitle>
                    <DialogDescription>
                        Please switch to {targetChainName} to continue.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={isSwitching}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={onSwitch}
                        disabled={isSwitching}
                    >
                        {isSwitching ? 'Switching...' : `Switch to ${targetChainName}`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
