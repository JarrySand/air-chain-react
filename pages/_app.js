import '../styles/global.css';
import { ThirdwebProvider } from "@thirdweb-dev/react";
import { Sepoila } from "@thirdweb-dev/chains"; // replace 'Sepoila' with the correct chain name if different

// This default export is required in a new `pages/_app.js` file.
export default function MyApp({ Component, pageProps }) {
    return (
        <ThirdwebProvider activeChain={Sepoila}>
            <Component {...pageProps} />
        </ThirdwebProvider>
    );
}
