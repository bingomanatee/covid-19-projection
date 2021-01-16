import { Paragraph as P } from 'grommet/components/Paragraph';
import { Footer } from 'grommet';
import React from 'react';

export default () => (
  <Footer pad="small">
    <P size="small" textAlgin="center">
      The code used to build this projection is at
      <a
        target="github"
        href="https://github.com/bingomanatee/covid-19-projection"
      >
        https://github.com/bingomanatee/covid-19-projection
      </a>
      .
      <br />
      The data is taken in real time from a public set of data published
      by the
      {' '}
      <a href="https://github.com/CSSEGISandData/COVID-19">
        Center for Systems Science and Engineering (CSSE)
      </a>
      {' '}
      at Johns Hopkins University
    </P>
  </Footer>
);
