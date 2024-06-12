import React, { useCallback } from 'react';
import { useConnect } from 'wagmi';
import { CoinbaseWalletLogo } from './CoinBaseWalletLogo';
 
const buttonStyles = {
  background: 'transparent',
  border: '1px solid transparent',
  boxSizing: 'border-box',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: 154,
  fontFamily: 'Arial, sans-serif',
  fontWeight: 'bold',
  fontSize: 16,
  backgroundColor: '#0e76fd',
  paddingLeft: 10,
  paddingTop : 5,
  paddingBottom : 5,
  paddingRight: 15,
  borderRadius: 10,
  color: '#FFFFFF'
};
 
export function BlueCreateWalletButton() {
  const { connectors, connect, data } = useConnect();
 
  const createWallet = useCallback(() => {
    const coinbaseWalletConnector = connectors.find(
      (connector) => connector.id === 'coinbaseWalletSDK'
    );
    if (coinbaseWalletConnector) {
      connect({ connector: coinbaseWalletConnector });
    }
  }, [connectors, connect]);
  return (
    <button style={buttonStyles as React.CSSProperties} onClick={createWallet}>
      <CoinbaseWalletLogo />
      Smart Wallet
    </button>
  );
}
