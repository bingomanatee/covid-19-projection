import React, { useContext } from 'react';

import {
  Paragraph as P, Heading as H, Box, ResponsiveContext,
} from 'grommet';
import GraphFooter from './GraphFooter';

export default () => {
  const pageSize = useContext(ResponsiveContext);
  const textSize = (pageSize === 'small' || pageSize === 'xsmall') ? 'small' : 'medium';
  return (
    <Box margin="medium">
      <H level={1}>About This Page</H>
      <P size={textSize}>
        This page is an up-do-date graph on COVID-19 Mortality within the United States of America.
      </P>

      <P size={textSize}>
        The extrapolation into the future is taken from a two-point linear projection from a month ago.
        No computation of curves or the effect of vaccines is considered.
      </P>

      <imr src="/projection.png" />

      <GraphFooter full />
      <H level={1}>Technical Notes</H>
      <P size={textSize}>This graph is produced using the following open source software packages:</P>
      <ul>
        <li>
          <a href="https://www.npmjs.com/package/@wonderlandlabs/looking-glass-engine" target="lge">
            Wonderland Labs' Looking Glass Engine
          </a>
          a state engine for React and web apps
        </li>
        <li>
          <a href="https://dexie.org/" target="dexie">Dexie</a>
          an indexDB wrapper for local storage
        </li>
        <li>
          <a href="https://svgjs.com/docs/3.1/" target="svg">SVG.js</a>
          a JavaScript SVG rendering engine
        </li>
        <li>
          <a href="https://v2.grommet.io/" target="grommet">Grommet</a>
          a layout framework
        </li>
        <li>
          and of course,
          <a href="https://reactjs.org/" target="react">React</a>
        </li>
      </ul>
    </Box>
  );
};
