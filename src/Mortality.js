import React, { useContext } from 'react';

import {
  Paragraph as P, Heading as H, markdown, Grid, Box, Footer, ResponsiveContext,
} from 'grommet';
import Graph from './Graph';
import GraphFooter from './GraphFooter';

export default () => {
  const pageSize = useContext(ResponsiveContext);
  const textSize = (pageSize === 'small' || pageSize === 'xsmall') ? 'small' : 'medium';
  return (
    <Grid rows={['auto', '1fr', 'auto']} fill="true" height="100%">
      <Box pad="small">
        <H textAlign="center" weight={800} level={1}>Total COVID-19 Deaths</H>
        <P pad="medium" align="center" size={textSize}>
          An up-to-date graph on total COVID-19 deaths
          in the United States of America.
          Projected deaths are based on a
          {' '}
          <b>linear extrapolation</b>
          {' -- '}
          a straight line from the death total
          a month ago to the current total.
        </P>
      </Box>
      <Box pad="small">
        <Graph />
        {' '}
      </Box>
      <GraphFooter />
    </Grid>
  );
};
