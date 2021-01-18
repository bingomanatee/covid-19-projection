import React, { useState, useEffect, useContext } from 'react';
import PageHeader from './PageHeader';
import './styles.css';
import {
  Grommet,
  Button,
  Box,
  Main,
  Heading,
  Header,
  Paragraph, Grid, Layer, ResponsiveContext,
} from 'grommet';
import Loader from 'react-loader-spinner';
import theme from './theme';
import store from './store';
import Content from './Content';

export default function App() {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const sub = store.subscribe(() => {
      const loading = store.do.dataIsLoading();
      console.log('---- APP: loading is ', loading);
      setIsLoading(loading);
    });

    return () => sub.unsubscribe();
  }, []);
  return (
    <Grommet theme={theme}>
      <Grid rows={['auto', '1fr']} fill="true">
        <PageHeader />
        <Main id="main-item" background="neutral-3" align="stretch" overflow="hidden">
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
