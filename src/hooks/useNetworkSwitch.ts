import { useSwitchChain, useAccount } from 'wagmi';
import { taikoHekla } from '@/lib/rainbowkit';
import { useState, useRef } from 'react';

export interface NetworkSwitchResult {
  success: boolean;
  error?: string;
  isCorrectNetwork: boolean;
}

export const useNetworkSwitch = () => {
  const { chainId } = useAccount();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const [isWaitingForSwitch, setIsWaitingForSwitch] = useState(false);
  const switchPromiseRef = useRef<Promise<void> | null>(null);

  const isCorrectNetwork = chainId === taikoHekla.id;

  const switchToCorrectNetwork = async (): Promise<NetworkSwitchResult> => {
    try {
      if (isCorrectNetwork) {
        return {
          success: true,
          isCorrectNetwork: true,
        };
      }

      // If we're already switching, wait for the existing switch to complete
      if (switchPromiseRef.current) {
        await switchPromiseRef.current;
        return {
          success: true,
          isCorrectNetwork: true,
        };
      }

      setIsWaitingForSwitch(true);
      
      // Switch the chain
      await switchChain({ chainId: taikoHekla.id });
      
      // Wait a reasonable amount of time for the switch to complete
      // Most wallets complete the switch within 2-3 seconds
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      setIsWaitingForSwitch(false);
      
      return {
        success: true,
        isCorrectNetwork: true,
      };
    } catch (error) {
      switchPromiseRef.current = null;
      setIsWaitingForSwitch(false);
      const errorMessage = error instanceof Error ? error.message : 'Failed to switch network';
      return {
        success: false,
        error: errorMessage,
        isCorrectNetwork: false,
      };
    }
  };

  return {
    switchToCorrectNetwork,
    isCorrectNetwork,
    isSwitching: isSwitching || isWaitingForSwitch,
    currentChainId: chainId,
    targetChainId: taikoHekla.id,
    targetChainName: taikoHekla.name,
  };
};
