import React from 'react';

import { Paragraph as P, Heading as H, markdown } from 'grommet';

export default () => (
  <>
    <H level={1}>About This Page</H>
    <P>
      This page is an up-do-date graph on COVID-19 Mortality. The numbers are derived from a public set of data published
      on
      {' '}
      <a href="https://github.com/CSSEGISandData/COVID-19">This Public GitHub Repository</a>
    </P>
    <P>As the home pge of this repository describes:</P>
    <blockquote>
      This is the data repository for the 2019 Novel Coronavirus Visual Dashboard
      operated by the Johns Hopkins University Center for Systems Science and Engineering (JHU CSSE).
      Also, Supported by ESRI Living Atlas Team and the Johns Hopkins University Applied Physics Lab (JHU APL).
    </blockquote>

    <P>
      The source code used to build this projection is at
      <a
        target="github"
        href="https://github.com/bingomanatee/covid-19-projection"
      >
        https://github.com/bingomanatee/covid-19-projection
      </a>
    </P>
  </>
);
