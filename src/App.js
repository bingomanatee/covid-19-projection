import React, { useState, useEffect } from 'react';
import './styles.css';
import {
  Grommet,
  Button,
  Box,
  Main,
  Heading,
  Header,
  Paragraph, Grid, Layer,
} from 'grommet';
import Loader from 'react-loader-spinner';
import getRawData from './get-raw-data';
import theme from './theme';
import store from './store';
import Content from './Content';

export default function App() {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    store.do.loadData();
    const sub = store.subscribe((map) => {

    });

    return () => sub.unsubscribe();
  }, []);

  return (
    <Grommet theme={theme}>
      <Grid rows={['auto', '1fr']} fill="true">
        <Header background="neutral-3">
          <Box
            direction="row"
            justify="between"
            fill="horizontal"
          >
            <Button
              label="COVID-19 Projection"
              onClick={() => store.do.setPage('home')}
            />
            <Button
              label="Source Data (table)"
              onClick={() => {
                store.do.setPage('data');
              }}
            />
            {' '}
            <Button
              label="About This Page"
              onClick={() => {
                store.do.setPage('about');
              }}
            />
          </Box>

        </Header>
        <Main id="main-item" align="center" background="neutral-3" align="stretch" overflow="hidden">
          <Content />
        </Main>
        {isLoading && (
        <Layer plain modal>
          <Paragraph textAlign="center">
            <Loader type="Oval" color="#0066E1" height={200} width={200} />
            Drawing COVID-19 Graph -- please wait.
            <br />
            Data Loading from latest sources.
          </Paragraph>
        </Layer>
        )}
      </Grid>
    </Grommet>
  );
}
