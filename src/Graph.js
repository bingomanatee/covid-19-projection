/* eslint-disable no-param-reassign */
import React, { useState, useRef, useEffect } from 'react';
import { Box, Header, Paragraph as P } from 'grommet';
import sizeMe from 'react-sizeme';
import dayjs from 'dayjs';
import SVG from 'svg.js';
import debounce from 'lodash/debounce';
import { ValueMapStream, addActions } from '@wonderlandlabs/looking-glass-engine';
import sortBy from 'lodash/sortBy';
import clamp from 'lodash/clamp';
import humNum from 'humanize-number';
import store from './store';
import makeGraphStore from './makeGraphStore';

const formatDate = (date, long) => {
  if (!date) return '';
  if ((!(date instanceof Date)) && date.date) return formatDate(date.date, long);

  if (long) return dayjs(date).format('D, MMM YYYY');
  return dayjs(date).format('MMM D YY');
};

const DEATH_COLOR = '#f06';

const Graph = ({ size }) => {
  const [value, setValue] = useState(new Map());
  const [graphStore, setGS] = useState(null);
  const [dates, setDates] = useState(new Map());
  const [readyToDraw, setRTD] = useState(false);

  const boxRef = useRef();
  const { width, height } = size;

  useEffect(() => {
    const sub = store.subscribe((map) => {
      setValue(map);
      const rawDataLoadStatus = map.get('rawDataLoadStatus');
      const regionLoadStatus = map.get('regionLoadStatus');
      const datesParsedStatus = map.get('datesParsedStatus');
      const summarizeStatus = map.get('summarizeStatus');

      if (rawDataLoadStatus === 'loaded') {
        if (datesParsedStatus === 'parsed') {
          if (regionLoadStatus === 'loaded') {
            if (summarizeStatus === 'done') {
              if (!readyToDraw) setRTD(true);
            }
          }
        }
      }
    });
    const newGraphStore = makeGraphStore(width, height, boxRef);
    setGS(newGraphStore);

    return () => {
      sub.unsubscribe();
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
      if (boxRef.current !== graphStore.my.svgDiv) graphStore.do.setSvgDiv(boxRef.current);
      if (!graphStore.my.svg) graphStore.do.setSvg(SVG(boxRef.current));
      console.log('drawGraph!!!!');
      graphStore.do.drawGraph();
    } else {
      console.log('readyToDraw: ', readyToDraw);
    }
  }, [graphStore, boxRef.current, readyToDraw]);

  return (
    <Box border={{ width: '1px', color: 'black' }} background="white" ref={boxRef} fill />
  );
};

export default sizeMe({ monitorHeight: true })(Graph);
