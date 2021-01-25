import React, { useContext, useEffect } from 'react';

import {
  Paragraph as P, Heading as H, markdown, Grid, Box, Footer, ResponsiveContext,
} from 'grommet';
import CaseGraph from './CaseGraph';
import store from './store';
import GraphFooter from './GraphFooter';

export default () => {
  useEffect(() => {
    if (store.my.rawCaseDataLoadStatus === 'not loaded') store.do.loadCaseData();
  }, []);
  const pageSize = useContext(ResponsiveContext);
  const textSize = (pageSize === 'small' || pageSize === 'xsmall') ? 'small' : 'medium';
  return (
    <Grid rows={['auto', '1fr', 'auto']} fill="true" height="100%">
      <Box pad="small">
        <H textAlign="center" weight={800} level={1}>Total COVID-19 Cases</H>
        <P pad="medium" align="center" size={textSize}>
          An up-to-date graph on total COVID-19 Confirmed Cases
          in the United States of America.
          Projected cases are based on a
          {' '}
          <b>linear extrapolation</b>
          {' -- '}
          a straight line from the case total
          a month ago to the current total.
        </P>
      </Box>
      <Box pad="small" overflow="hidden">
        <CaseGraph />
        {' '}
      </Box>
      <GraphFooter />
    </Grid>
  );
};
