import React from 'react';

import {
  Paragraph as P, Heading as H, Grid, Box,
} from 'grommet';
import DataTable from './DataTable';

export default () => (
  <Grid rows={['auto', '1fr', 'auto']} fill="true" height="100%">
    <Box pad="small">
      <H textAlign="center" weight={800} level={1}>Mortality Rates</H>
      <P pad="medium" align="center">
        This is a summary of the mortality data month by month.
      </P>
    </Box>
    <Box pad="small" overflow="scroll">
      <DataTable />
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
