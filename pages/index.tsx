import { Stack } from "@chakra-ui/react";
import { ConnectKitButton, useSIWE } from "connectkit";
import dynamic from "next/dynamic";
import { ReactJsonViewProps } from "react-json-view";

// REACT JSON SETUP
const DynamicReactJson = dynamic(import("react-json-view"), { ssr: false });
const ReactJsonStyle = {
  maxHeight: "350px",
  maxWidth: "700px",
  overflow: "scroll",
};
const ReactJson = ({ src }: { src: ReactJsonViewProps["src"] }) => {
  return (
    <DynamicReactJson
      src={src}
      collapsed
      theme="monokai"
      style={ReactJsonStyle}
    />
  );
};

// PAGE FUNCTION
export default function Siwe() {
  const test = useSIWE();
  // RETURN UI
  return (
    <Stack
      w={"100vw"}
      h={"100vh"}
      justify={"center"}
      align={"center"}
      spacing={10}
    >
      <ConnectKitButton />
      <ReactJson src={test.data} />
    </Stack>
  );
}
