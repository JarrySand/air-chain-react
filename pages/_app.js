import '../styles/global.css';
import { magicLink, metamaskWallet, coinbaseWallet, ThirdwebProvider } from "@thirdweb-dev/react";
import { Sepolia } from "@thirdweb-dev/chains"; 

const magicLinkConfig = magicLink({
  apiKey: "pk_live_20E224B958574627",
  type: 'connect' 
});

export default function MyApp({ Component, pageProps }) {
    return (
        <ThirdwebProvider activeChain={Sepolia} 
            supportedWallets={[
                metamaskWallet(),
                coinbaseWallet(),
                magicLinkConfig
            ]}>
            <Component {...pageProps} />
        </ThirdwebProvider>
    );
}
