import React from 'react';
import './styles.css';
import {
  Grommet,
  Button,
  Box,
  Main,
  Heading,
  Header,
  Paragraph,
} from 'grommet';
import getRawData from './get-raw-data';
import theme from './theme';
import store from './store';
import Content from './Content';

export default function App() {
  return (
    <Grommet theme={theme}>
      <Header background="neutral-3">
        <Box
          direction="row"
          justify="between"
          fill="horizontal"
        >
          <Button
            label="COVID-19 Projection"
            onClick={() => store.do.setPath('home')}
          />
          {' '}
          <Button
            label="About This Page"
            onClick={() => store.do.setPath('about')}
          />
        </Box>

      </Header>
      <Main id="main-item" align="center" background="neutral-3" align="stretch">
        <Content />
      </Main>
    </Grommet>
  );
}
