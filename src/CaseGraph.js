/* eslint-disable no-param-reassign */
import React, { useState, useRef, useEffect } from 'react';
import { Box } from 'grommet';
import sizeMe from 'react-sizeme';
import dayjs from 'dayjs';
import SVG from 'svg.js';
import store from './store';
import makeGraphStore from './makeCaseGraphStore';
import DateRep from './DateRep';

const formatDate = (date, long) => {
  if (!date) return '';
  if ((!(date instanceof Date)) && date.date) return formatDate(date.date, long);

  if (long) return dayjs(date).format('D, MMM YYYY');
  return dayjs(date).format('MMM D YY');
};

const CASE_COLOR = '#27c507';

const CaseGraph = ({ size }) => {
  const [value, setValue] = useState(new Map());
  const [graphStore, setGS] = useState(null);

  const [readyToDraw, setRTD] = useState(false);
  const [firstTime, setFT] = useState(0);
  const [lastTime, setLT] = useState(0);

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
  }, [width, height, graphStore]);

  useEffect(() => {
    const sub = store.subscribe((map) => {
      setValue(store.object);
      const loadStatus = map.get('rawCaseDataLoadStatus');
      console.log('case rawDataCaseLoadStatus', loadStatus);
      const rtd = loadStatus === 'loaded';
      setRTD(rtd);
    });
    console.log('Case graph: ready to draw: ', readyToDraw);
    const newGraphStore = makeGraphStore(width, height, boxRef);
    const gsSub = newGraphStore.subscribe((map) => {
      if (map.get('firstTime') !== firstTime) setFT(map.get('firstTime'));
      if (map.get('lastTime') !== lastTime) setLT(map.get('lastTime'));
    });
    setGS(newGraphStore);

    return () => {
      sub.unsubscribe();
      gsSub.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!(graphStore && graphStore.my.svg && height && width)) {
      return;
    }
    if (width !== graphStore.my.width) graphStore.do.setWidth(width);
    if (height !== graphStore.my.height) graphStore.do.setHeight(height);
    graphStore.do.drawGraph();
  }, [graphStore, width, height]);

  useEffect(() => {
    if (!graphStore) return;
    if (readyToDraw && boxRef.current) {
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
        console.log('drawGraph!!!!');
        graphStore.do.drawGraph();
      }
    } else {
      console.log('readyToDraw: ', readyToDraw);
    }
  }, [graphStore, boxRef.current, readyToDraw]);

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

export default sizeMe({ monitorHeight: true })(CaseGraph);
