import React from 'react';

import {
  Paragraph as P, Heading as H, markdown, Grid, Box,
} from 'grommet';
import Graph from './Graph';
import DexieReport from './DexieReport';

export default () => (
  <Grid rows={['auto', '1fr', 'auto']} fill="true" height="100%">
    <Box pad="small">
      <H textAlign="center" weight={800} level={1}>Mortality Rates</H>
      <P pad="medium" align="center">
        This is a summary of the statistical data used to build the mortality graph.
      </P>
    </Box>
    <Box pad="small">
      <DexieReport />
    </Box>
    <Box pad="small">
      <P>
        The source code used to build this projection is at
        {' '}
        <a
          target="github"
          href="https://github.com/bingomanatee/covid-19-projection"
        >
          https://github.com/bingomanatee/covid-19-projection
        </a>
      </P>
    </Box>
  </Grid>
);
