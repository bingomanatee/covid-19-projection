/* eslint-disable no-param-reassign */
import React, { useState, useRef, useEffect } from 'react';
import { Box } from 'grommet';
import sizeMe from 'react-sizeme';
import dayjs from 'dayjs';
import SVG from 'svg.js';
import { ValueMapStream, addActions } from '@wonderlandlabs/looking-glass-engine';
import sortBy from 'lodash/sortBy';
import debounce from 'lodash/debounce';
import clamp from 'lodash/clamp';
import humNum from 'humanize-number';

const formatDate = (date, long) => {
  if (!date) return '';
  if ((!(date instanceof Date)) && date.date) return formatDate(date.date, long);

  if (long) return dayjs(date).format('D, MMM YYYY');
  return dayjs(date).format('MMM D YY');
};

const DEATH_COLOR = '#f06';

const Graph = ({ homeStore, size }) => {
  const [value, setValue] = useState(new Map());
  const [graphStore, setGS] = useState(null);
  const [dates, setDates] = useState(new Map());

  const boxRef = useRef();
  useEffect(() => {
    const sub = homeStore.subscribe(setValue);
    const newGraphStore = addActions(new ValueMapStream({
      data: [],
      summary: new Map(),
      lineDrawn: false,
      polyline: null,
      svg: null,
      svgDiv: null,
      height: 0,
      width: 0,
      timeSensors: [],
      summarizing: false,
      dates: new Map(),
    }), {
      draw(thisStore) {
        console.log('drawing store');
      },

      orderedDates(gs) {
        return sortBy([...gs.my.dates.values()], 'time');
      },

      timeToX(gs, time, ordered) {
        if (typeof time === 'string') {
          const date = [...gs.my.dates.values()].find((storedDate) => storedDate.key === time);
          if (date) {
            return gs.do.timeToX(gs, date.time, ordered);
          }
        }

        if (!ordered) {
          ordered = gs.my.orderedDates();
        }

        if (ordered.length < 2) return -1;

        const minTime = ordered[0].time;
        const maxTime = ordered[ordered.length - 1].time;

        if (maxTime <= minTime) return -1;
        return (time - minTime) * (gs.my.width / (maxTime - minTime));
      },
      xToDate(gs, x) {
        const orderedDates = gs.my.orderedDates();
        let range = [...orderedDates];
        let midDate = null;
        while (range.length > 2) {
          const midIndex = clamp(Math.floor(range.length / 2), 1, range.length - 1);
          midDate = range[midIndex];
          const { time } = midDate;
          const tX = gs.my.timeToX(time, orderedDates);
          if (tX === x) { return midDate; }
          if (tX < x) {
            range = range.slice(midIndex + 1);
          } else if (tX > x) { // always true
            range = range.slice(0, midIndex);
          }
        }
        return range.pop() || midDate;
      },
      sumData(gs) {
        if (gs.my.summarizing) return;
        if (!gs.my.dates.size) {
          console.log('-------- sumData: no dates:', gs.my.dates.size, gs.my.dates);
          return;
        }
        if (!gs.my.data.length) {
          console.log('--------- sumData: no data', gs.my.data.length, gs.my.data);
          return;
        }
        console.log('sumData data....', gs.my.dates);
        gs.do.setSummarizing(true);

        const dateKeys = Array.from(gs.my.dates.keys());
        const summary = new Map();

        const updateCount = (key, amount) => {
          if (!amount) return;
          if (typeof amount !== 'number') return;
          if (!summary.has(key)) {
            summary.set(key, amount);
          } else summary.set(key, amount + summary.get(key));
          if (Math.random() < 0.01) {
            console.log('updated summary count to ', key, summary.get(key));
          }
        };

        gs.my.data.forEach((location) => {
          if (Math.random() < 0.01) {
            console.log('summing', location, 'with', dateKeys);
          }
          dateKeys.forEach((key) => {
            if (key in location) {
              const amount = location[key];
              if (amount === '0') return;
              if (Math.random() < 0.01) console.log(location.uuid, 'count on ', key, 'is', amount);
              updateCount(key, Number.parseInt(amount, 10));
            } else {
              console.log('no ', key, 'in', location);
            }
          });
        });

        gs.do.setSummary(summary);
        console.log('.... done sumData');
        gs.do.setSummarizing(false);
        gs.do.drawGraph();
      },
      drawDates(gs) {
        const oDates = gs.do.orderedDates();

        let nextX = 0;
        let done = false;
        oDates.forEach((date, index) => {
          if (done) return;
          const x = (index * (gs.my.width - 5)) / oDates.length;
          if (x < nextX) {
            return;
          }
          const y = gs.my.height - 20;

          const text = gs.my.svg.text(a => a.tspan(formatDate(date))).x(x).cy(y)
            .font({
              family: 'Helvetica',
              size: 16,
              anchor: 'center',
            });

          if (gs.my.summary.has(date.key)) {
            const amount = gs.my.summary.get(date.key);
            console.log('amount  for key', date.key, 'is', amount);
            gs.my.svg.text((a) => a.tspan(`${humNum(amount)}`)).x(x).cy(20)
              .font({
                fill: DEATH_COLOR,
                family: 'Helvetica',
                size: 16,
                anchor: 'center',
              });
          } else {
            console.log('no amount for key', date.key);
          }
          nextX = x + text.node.getBBox().width + 10;

          if (nextX >= gs.my.width) {
            done = true;
          }
        });
      },
      maxSummaryValue(gs) {
        const values = Array.from(gs.my.summary.values());
        return sortBy(values).pop();
      },
      drawLine(gs) {
        const max = gs.do.maxSummaryValue();
        const scale = gs.my.height / max;
        const ordered = gs.do.orderedDates();

        let coordinates = [];
        gs.my.dates.forEach((date) => {
          const { time, key } = date;
          if (gs.my.summary.has(key)) {
            const deaths = gs.my.summary.get(key);
            coordinates.push({
              time,
              deaths,
              date,
              x: gs.do.timeToX(time, ordered),
              y: (gs.my.height - (deaths * scale)),
            });
          }
        });

        coordinates = sortBy(coordinates, 'time');

        const polyLine = gs.my.svg.polyline(coordinates.map((p) => ([p.x, p.y])))
          .fill('none')
          .stroke({
            color: DEATH_COLOR, width: 2, linecap: 'round', linejoin: 'round',
          });

        gs.do.setPolyLine(polyLine);

        setTimeout(() => {
          gs.do.drawSensors(coordinates);
        });

        if (!homeStore.my.drawn) homeStore.do.setDrawn(true);
      },

      drawSensors(gs, coordinates) {
        if (gs.my.timeSensors) {
          gs.my.timeSensors.forEach((ts) => ts.remove());
        }
        const rects = [];
        coordinates.forEach((coord, index) => {
          if (!index || !coord.deaths) return;

          const lastCoord = coordinates[index - 1];
          const height = Math.max(1, gs.my.height - coord.y);
          const width = Math.ceil(coord.x - lastCoord.x);

          const sensor = {
            coord, width, height, lastCoord,
          };
          sensor.__$rect = gs.my.svg.rect(width, height)
            .fill(DEATH_COLOR).opacity(0).x(Math.round(lastCoord.x))
            .y(lastCoord.y)
            .opacity(0);
          sensor.__$deaths = gs.my.svg.text((a) => a.tspan(`${humNum(coord.deaths)} dead`))
            .x(coord.x - 100)
            .cy(coord.y)
            .font({
              fill: DEATH_COLOR,
              family: 'Helvetica',
              size: 14,
              weight: 'bold',
              anchor: 'right',
            })
            .opacity(0);
          sensor.__$date = gs.my.svg.text((a) => a.tspan(`${formatDate(coord.date, true)}`))
            .x(coord.x)
            .cy(coord.y)
            .font({
              family: 'Helvetica',
              size: 14,
              anchor: 'left',
            })
            .opacity(0);

          rects.push(sensor);
        });
        // draw the sensor graphics later to keep them on top
        rects.forEach((sensor) => {
          const {
            coord, width, height, lastCoord,
          } = sensor;
          sensor.__$sensor = gs.my.svg.rect(width + 3, gs.my.height).x(Math.round(lastCoord.x)).y(0).opacity(0)
            .attr('z-index', 10000);

          sensor.__$hide = () => {
            sensor.__$rect.opacity(0);
            sensor.__$deaths.opacity(0);
            sensor.__$date.opacity(0);
          };

          sensor.__$show = () => {
            sensor.__$rect.opacity(1);
            sensor.__$deaths.opacity(1);
            sensor.__$date.opacity(1);
          };

          sensor.__$sensor.on('mouseover', () => {
            rects.forEach((s) => {
              if (s.__$timeout) {
                clearTimeout(s.__$timeout);
                delete s.__$timeout;
              }
              if (s !== sensor) {
                s.__$hide();
              }
            });
            sensor.__$show();
            sensor.__$timeout = setTimeout(sensor.__$hide, 3000);
          });
          sensor.__$sensor.on('mouseout', sensor.__$hide);

          sensor.remove = () => {
            sensor.__$sensor.remove();
            sensor.__$deaths.remove();
            sensor.__$date.remove();
          };
        });

        gs.do.setTimeSensors(rects);
      },

      drawGraph(gs) {
        gs.my.svg.clear();

        if (gs.my.summary.size) {
          gs.do.drawLine();
        }

        if (gs.my.dates.size) {
          gs.do.drawDates();
        }
      },
    });
    setGS(newGraphStore);

    return () => {
      sub.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (homeStore && graphStore) {
      const debounceDoData = debounce(() => {
        graphStore.do.sumData();
      }, 500);
      homeStore.subscribe((map) => {
        if (map.get('dates') && map.get('dates') !== dates) {
          setDates(map.get('dates'));
        }
        if (map.get('rawData') && (map.get('rawData') !== graphStore.my.data)) {
          graphStore.do.setData(map.get('rawData'));
        }
        debounceDoData();
      });
    }
  }, [graphStore, homeStore]);

  const { width, height } = size;
  useEffect(() => {
    if (!(graphStore && graphStore.my.svg && height && width)) {
      return;
    }
    graphStore.do.setWidth(width);
    graphStore.do.setHeight(height);
    graphStore.do.setDates(dates);
    graphStore.do.drawGraph();
  }, [graphStore, width, height, dates]);

  useEffect(() => {
    if (graphStore && boxRef.current) {
      graphStore.do.setSvgDiv(boxRef.current);
      graphStore.do.setSvg(SVG(boxRef.current));
    }
  }, [graphStore, boxRef.current]);

  return (
    <Box border={{ width: '1px', color: 'black' }} background="white" ref={boxRef} height="50vh" />
  );
};

export default sizeMe({ monitorHeight: true })(Graph);
