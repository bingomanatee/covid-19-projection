import React from "react";
import "./styles.css";
import getRawData from "./get-raw-data";
import {
  Grommet,
  Button,
  Box,
  Main,
  Heading,
  Header,
  Paragraph
} from "grommet";
import theme from "./theme.json";
getRawData().then((branch) => {
  console.log("branch", branch);
});
export default function App() {
  return (
    <Grommet theme={theme}>
      <Header background="neutral-3">
        <Button
          label="hello world"
          primary
          onClick={() => alert("hello, world")}
        />
      </Header>
      <Main id="main-item" align="center" background="neutral-3">
        <Heading id="header-item"> The Header</Heading>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
          <Paragraph>{n}</Paragraph>
        ))}
      </Main>
    </Grommet>
  );
}
