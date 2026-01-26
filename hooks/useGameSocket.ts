/**
 * Game Socket Hook - Placeholder
 * This hook will be implemented when game features are added
 */

export function useGameSocket() {
    return {
        isConnected: false,
        connect: () => {},
        disconnect: () => {},
        emit: () => {},
        on: () => {},
        off: () => {},
    };
}

export default useGameSocket;
