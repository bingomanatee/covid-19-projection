import React from 'react';

import { Paragraph as P, Heading as H, markdown } from 'grommet';
import Graph from './Graph';

export default ({ homeStore }) => (
  <>
    <H textAlign="center" weight={800} level={1}>Mortality Rates</H>
    <P>
      This page is an up-do-date graph on COVID-19 Mortality rates in the United States of America.
    </P>
    <Graph homeStore={homeStore} />
  </>
);
