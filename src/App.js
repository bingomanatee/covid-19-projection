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
import theme from './theme';
import store from './store';
import Content from './Content';

export default function App() {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const sub = store.subscribe((map) => {
      let loadStatus = null;

      switch (map.get('page')) {
        case 'home':
          loadStatus = map.get('rawDataLoadStatus');
          if (loadStatus === 'not loaded') store.do.loadData();
          break;

        case 'cases':
          loadStatus = map.get('rawCaseDataLoadStatus');
          if (loadStatus === 'not loaded') store.do.loadCaseData();
          break;
      }

      console.log('load Status:', loadStatus);
      if (loadStatus) {
        const newIsLoading = loadStatus !== 'loaded';
        console.log('newIsLoading', newIsLoading);
        setIsLoading(newIsLoading);
      }
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
              label="COVID-19 Mortality"
              onClick={() => store.do.setPage('mortality')}
            />
            <Button
              label="COVID-19 Cases"
              onClick={() => store.do.setPage('cases')}
            />
            <Box flex="1" />
            <Button
              label="Summary Table"
              onClick={() => {
                store.do.setPage('data');
              }}
            />
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
