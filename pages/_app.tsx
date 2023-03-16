import { WagmiConfig, createClient } from "wagmi";
import { mainnet, polygon, optimism, arbitrum, avalanche } from "wagmi/chains";
import { ConnectKitProvider, getDefaultClient } from "connectkit";
import { ChakraProvider } from "@chakra-ui/react";
import SIWEProvider from "../SIWEProvider";

const client = createClient(
  getDefaultClient({
    appName: "ConnectKit Next.js demo",
    //alchemyId: process.env.ALCHEMY_ID,
    //infuraId: process.env.INFURA_ID,
    chains: [mainnet, polygon, optimism, arbitrum, avalanche],
  })
);

const App = ({ Component, pageProps }) => {
  return (
    <ChakraProvider>
      <WagmiConfig client={client}>
        <SIWEProvider>
          <ConnectKitProvider>
            <Component {...pageProps} />
          </ConnectKitProvider>
        </SIWEProvider>
      </WagmiConfig>
    </ChakraProvider>
  );
};

export default App;
