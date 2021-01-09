import React from 'react';

import { Paragraph as P, Heading as H, markdown, Grid, Box } from 'grommet';
import Graph from './Graph';

export default () => (
  <Grid rows={['auto', '1fr']} fill="true">
    <Box pad={"medium"}>
      <H textAlign="center" weight={800} level={1}>Mortality Rates</H>
      <P>
        This page is an up-do-date graph on COVID-19 Mortality rates in the United States of America.
        Deaths past current date are based on a linear extrapolation of deaths over time
        based on the progress of deaths since a month ago.
      </P>
    </Box>
      <Graph />
  </Grid>
);
