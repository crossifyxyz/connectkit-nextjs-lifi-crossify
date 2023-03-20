import { WagmiConfig, createClient } from "wagmi";
import { mainnet, polygon, optimism, arbitrum, avalanche } from "wagmi/chains";
import {
  ConnectKitProvider,
  getDefaultClient,
  SIWEConfig,
  SIWEProvider,
} from "connectkit";
import { ChakraProvider } from "@chakra-ui/react";
import { SiweMessage } from "siwe";
import { getNonce, postVerify, getSession, signOut } from "../fetch";

const baseUrl = "http://localhost:5000/";

const siweConfig: SIWEConfig = {
  getNonce: async () =>
    getNonce(baseUrl)
      .then((res) => res.data.nonce)
      .catch(() => null),
  createMessage: ({ nonce, address, chainId }) =>
    new SiweMessage({
      version: "1",
      domain: window.location.host,
      uri: window.location.origin,
      address,
      chainId,
      nonce,
      statement: "Sign in With UniPOS Web3",
    }).prepareMessage(),
  verifyMessage: async ({ message, signature }) =>
    postVerify({ baseUrl, message, signature })
      .then(() => true)
      .catch(() => false),
  getSession: async () =>
    getSession(baseUrl)
      .then((res) => res.data.result)
      .catch(() => null),
  signOut: async () =>
    signOut(baseUrl)
      .then(() => true)
      .catch(() => false),
};

const client = createClient(
  getDefaultClient({
    appName: "ConnectKit Next.js demo",
    alchemyId: "02919779fdae4e458d9bfecbff626312",
    //infuraId: process.env.INFURA_ID,
    chains: [mainnet, polygon, optimism, arbitrum, avalanche],
  })
);

const App = ({ Component, pageProps }) => {
  return (
    <ChakraProvider>
      <WagmiConfig client={client}>
        <SIWEProvider {...siweConfig}>
          <ConnectKitProvider>
            <Component {...pageProps} />
          </ConnectKitProvider>
        </SIWEProvider>
      </WagmiConfig>
    </ChakraProvider>
  );
};

export default App;
