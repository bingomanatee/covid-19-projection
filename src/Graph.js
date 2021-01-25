/* eslint-disable no-param-reassign */
import React, {
  useState, useRef, useEffect, useContext,
} from 'react';
import {
  Box, Header, Paragraph as P, ResponsiveContext,
} from 'grommet';
import sizeMe from 'react-sizeme';
import SVG from 'svg.js';
import makeGraphStore from './makeGraphStore';
import DateRep from './DateRep';

const Graph = ({ size }) => {
  const [value, setValue] = useState(new Map());
  const [graphStore, setGS] = useState(null);

  const [readyToDraw, setRTD] = useState(false);
  const [firstTime, setFT] = useState(0);
  const [lastTime, setLT] = useState(0);

  const pageSize = useContext(ResponsiveContext);

  const boxRef = useRef();
  const { width, height } = size;

  useEffect(() => {
    if (!graphStore) return;

    if (
      (width !== graphStore.my.width)
      || (height !== graphStore.my.height)
    ) {
      graphStore.do.setWidth(width);
      graphStore.do.setHeight(height);
      graphStore.do.drawGraph();
    }

    if (boxRef.current !== graphStore.my.svgDiv) {
      graphStore.do.setSvgDiv(boxRef.current);
      const svg = SVG(boxRef.current);
      if (!graphStore.my.svg) {
        graphStore.do.setSvg(svg);
        svg.on('mousemove', (event) => {
          const { offsetX, offsetY } = event;
          graphStore.do.onMouseMove(offsetX, offsetY);
        });
      }
    }

    if (graphStore) {
      graphStore.do.drawGraph();
    }
  }, [width, height, graphStore, boxRef.current]);

  useEffect(() => {
    const newGraphStore = makeGraphStore(width, height, pageSize, boxRef);
    const gsSub = newGraphStore.subscribe((map) => {
      if (map.get('firstTime') !== firstTime) setFT(map.get('firstTime'));
      if (map.get('lastTime') !== lastTime) setLT(map.get('lastTime'));
    });
    setGS(newGraphStore);

    return () => {
      gsSub.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!(graphStore && graphStore.my.svg && height && width)) {
      return;
    }
    if (width !== graphStore.my.width) graphStore.do.setWidth(width);
    if (height !== graphStore.my.height) graphStore.do.setHeight(height);
    if (graphStore && (pageSize !== graphStore.my.pageSize)) graphStore.do.setPageSize(pageSize);
  }, [graphStore, width, height, pageSize]);

  return (
    <Box flex="1" border={{ width: '1px', color: 'brand' }} height="100%" background="white">
      <div className="graph-wrapper">
        <div className="graph-min-date">
          {firstTime ? DateRep.from(firstTime).toString() : ''}
        </div>
        <div className="graph-max-date">
          {lastTime ? DateRep.from(lastTime).toString() : ''}
        </div>
        <div className="graph-graphic" ref={boxRef} />
      </div>
    </Box>
  );
};

export default sizeMe({ monitorHeight: true })(Graph);
