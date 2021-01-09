import React from 'react';

import {
  Paragraph as P, Heading as H, markdown, Grid, Box,
} from 'grommet';
import Graph from './Graph';

export default () => (
  <Grid rows={['auto', '1fr', 'auto']} fill="true" height="100%">
    <Box pad="small">
      <H textAlign="center" weight={800} level={1}>Mortality Rates</H>
      <P pad="medium" align="center">
        This page is an up-do-date graph on COVID-19 Mortality rates in the United States of America.
        Deaths past current date are based on a linear extrapolation of deaths over time
        based on the progress of deaths since a month ago.
      </P>
    </Box>
    <Box pad="small">
      <Graph />
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
