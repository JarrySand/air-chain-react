import { ConnectWallet, useAddress, useSigner } from "@thirdweb-dev/react";
import React, { useEffect } from 'react';

function WalletConnector({ onConnect }) {
  const address = useAddress();
  const signer = useSigner();

  useEffect(() => {
    if (address && signer) {
      console.log('Address and signer updated in WalletConnector');
      onConnect({ address, signer });
    }
  }, [address, signer]);

  return (
      <ConnectWallet
        auth={{
          loginOptional: false,
        }}
        theme="dark"
        btnTitle="Connect Wallet"
      />
  );
}

export default WalletConnector;
