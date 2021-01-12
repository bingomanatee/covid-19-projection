/* eslint-disable no-param-reassign */
import debounce from 'lodash/debounce';
import throttle from 'lodash/throttle';
import { ValueMapStream, addActions } from '@wonderlandlabs/looking-glass-engine';
import sortBy from 'lodash/sortBy';
import clamp from 'lodash/clamp';
import humNum from 'humanize-number';
import dayjs from 'dayjs';
import max from 'lodash/max';
import min from 'lodash/min';
import store from './store';

import { deathsAtTime, getTimes, maxDeaths } from './db';

const formatDate = (date, long) => {
  if (!date) return '';
  if (typeof date === 'number') date = new Date(date);
  if (date instanceof Date) {
    if (long) return dayjs(date).format('D, MMM YYYY');
    return dayjs(date).format('MMM D YY');
  }
  if (date.date) return formatDate(date.date, long);
  return '---';
};
const DEATH_COLOR = '#f06';

const A_MONTH_AGO_MS = 1000 * 60 * 60 * 24 * 30;

export default function makeGraphStore(width, height) {
  return addActions(new ValueMapStream({
    data: [],
    lineDrawn: false,
    polyline: null,
    svg: null,
    svgDiv: null,
    cursor: null,
    dateLabel: null,
    deadLabel: null,
    drawing: false,
    firstTime: 0,
    lastTime: 0,
    height,
    width,
    timeSensors: [],
  }), {
    orderedDates(gs, useExt) {
      return store.do.orderedDates(useExt);
    },
    deathSlope(gs) {
      const { date, time } = store.do.maxDate();
      const aMonthAgo = time - A_MONTH_AGO_MS;
      const d2 = store.do.deathsAtTime(time);
      const d1 = store.do.deathsAtTime(aMonthAgo);
      return (d2 - d1) / A_MONTH_AGO_MS;
    },
    extDeathAtTime(gs, t) {
      if (t instanceof Date) {
        t = t.getTime();
      }

      if ((typeof t === 'object') && ('time' in t)) {
        t = t.time;
      }

      const max = store.do.maxDate();
      const milliseconds = t - max.time;
      const base = store.do.deathsAtTime(max.time);

      return Math.round(base + (milliseconds * gs.do.deathSlope()));
    },
    maxX(gs) {
      const t = store.do.maxDate().time;

      return gs.do.timeToX(t, true);
    },
    timeToX(gs, time) {
      if (typeof time === 'string') {
        const date = [...store.my.dates.values()].find((storedDate) => storedDate.key === time);
        if (date) {
          return gs.do.timeToX(gs, date.time);
        }
        return 0;
      }

      if (!(typeof time === 'number')) {
        return 0;
      }

      const minTime = store.do.minDate().time;
      const maxTime = store.do.maxExtDate().time;

      if (maxTime <= minTime) return -1;
      return (time - minTime) * (gs.my.width / (maxTime - minTime));
    },
    xToExtDate(gs, x) {
      const orderedDates = gs.do.orderedDates(true);
      let range = [...orderedDates];
      let midDate = null;

      while (range.length > 2) {
        const midIndex = clamp(Math.floor(range.length / 2), 1, range.length - 1);
        midDate = range[midIndex];
        const { time } = midDate;
        const tX = gs.do.timeToX(time, orderedDates);
        if (tX === x) { return midDate; }
        if (tX < x) {
          range = range.slice(midIndex + 1);
        } else if (tX > x) { // always true
          range = range.slice(0, midIndex);
        }
      }

      return range.pop() || midDate;
    },

    xToDate(gs, x, compute) {
      return 0;
      if (compute) {
        const maxTime = store.do.maxExtDate().time;
        const minTime = store.do.minDate().time;
        const elapsed = maxTime - minTime;
        return new Date(minTime + (x / gs.my.width) * elapsed);
      }

      const { time } = store.do.maxDate();
      const lastX = gs.do.timeToX(time);

      if (lastX < x) {
        return gs.do.xToExtDate(x);
      }

      const orderedDates = gs.do.orderedDates();
      let range = [...orderedDates];
      let midDate = null;
      while (range.length > 2) {
        const midIndex = clamp(Math.floor(range.length / 2), 1, range.length - 1);
        midDate = range[midIndex];
        const tX = gs.do.timeToX(midDate.time, orderedDates);
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
      gs.do.drawGraph();
    },
    drawDates(gs) {
      const oDates = gs.do.orderedDates().concat(gs.do.orderedDates(true));
      const { series } = store.my.summary;

      let nextX = 0;
      let done = false;
      oDates.forEach((date, index) => {
        if (done) return;
        const x = gs.do.timeToX(date.time);
        if (x < nextX) {
          return;
        }
        const y = gs.my.height - 20;

        const text = gs.my.svg.text((a) => a.tspan(formatDate(date))).x(x).cy(y)
          .font({
            family: 'Helvetica',
            size: 16,
            anchor: 'center',
          });

        if (series.has(date.key)) {
          const amount = series.get(date.key);
          gs.my.svg.text((a) => a.tspan(`${humNum(amount)}`)).x(x).cy(20)
            .font({
              fill: DEATH_COLOR,
              family: 'Helvetica',
              size: 16,
              anchor: 'center',
            });
        }
        nextX = x + text.node.getBBox().width + 10;

        if (nextX >= gs.my.width) {
          done = true;
        }
      });
    },
    maxSummaryValue() {
      const values = Array.from(store.my.summary.series.values());
      return sortBy(values).pop();
    },
    endCompute(gs) {
      const lastDate = store.do.maxDate();
      const lastExtDate = store.do.maxExtDate();
      const millisecondsExt = lastExtDate.time - lastDate.time;
      const lastDeaths = store.do.deathsAtTime(lastDate.time);
      const maxDeaths = lastDeaths + gs.do.deathSlope() * millisecondsExt;
      return {
        lastDate, lastExtDate, millisecondsExt, lastDeaths, maxDeaths,
      };
    },

    async drawLine(gs) {
      const times = await getTimes();
      const firstTime = min(times);
      const lastTime = max(times);
      gs.do.setFirstTime(firstTime);
      gs.do.setLastTime(lastTime);
      const timeRange = lastTime - firstTime;
      const xScale = gs.my.width / timeRange;
      const mDeaths = await maxDeaths();
      const yScale = gs.my.height / mDeaths;
      const timeDeaths = await Promise.all(times.map(deathsAtTime));

      const coordinates = [];
      times.forEach((t, i) => {
        const dTime = t - firstTime;
        const d = timeDeaths[i];

        const x = dTime * xScale;
        const y = gs.my.height - (timeDeaths[i] * yScale);
        coordinates.push({
          y, x, d, t,
        });
      });

      console.log('coordinates:', coordinates);

      const xys = sortBy(coordinates, 't').map((p) => ([p.x, p.y]));

      const polyLine = gs.my.svg.polyline(xys)
        .fill('none')
        .stroke({
          color: DEATH_COLOR, width: 2, linecap: 'round', linejoin: 'round',
        });

      gs.do.setPolyLine(polyLine);

      gs.do.drawCursor();

      const onMove = throttle(gs.do.onMouseMove, 50);

      gs.my.svg.on('mousemove', (event) => {
        const { offsetX, offsetY } = event;
        onMove(offsetX, offsetY);
      });

      if (!store.my.drawn) store.do.setDrawn(true);
    },

    drawCursor(gs) {
      const cursor = gs.my.svg.group();
      cursor.line(-2 * gs.my.width, 0, 2 * gs.my.width, 0)
        .stroke({
          color: 'grey',
          width: 1,
        });
      cursor.line(0, -2 * gs.my.height, 0, 2 * gs.my.height)
        .stroke({
          color: DEATH_COLOR,
          width: 1,
        });
      // (a) => a.tspan(`${formatDate(coord.date, true)}`))
      const date = cursor.text('')
        .x(4).y(-4)
        .font({
          family: 'Helvetica',
          size: 14,
          anchor: 'left',
        });

      const dead = cursor.text('')
        .x(-50).y(-4)
        .font({
          family: 'Helvetica',
          size: 14,
          fill: DEATH_COLOR,
          weight: 'bold',
          anchor: 'right',
        });
      gs.do.setCursor(cursor);
      gs.do.setDateLabel(date);
      gs.do.setDeadLabel(dead);
    },

    onMouseMove(gs, x, y) {
      return;
      if (!gs.my.cursor) return;
      gs.my.cursor.x(x).y(y);

      let dead = 0;

      let date = gs.do.xToDate(x);
      if (x >= gs.do.maxX()) {
        date = gs.do.xToDate(x, true);
        dead = gs.do.extDeathAtTime(date.getTime());
      } else {
        dead = store.do.deathsAtTime(date.time);
      }

      if (Number.isNaN(dead)) return;
      if (gs.my.dateLabel) {
        gs.my.dateLabel.tspan(formatDate(date, true));
      }
      gs.my.deadLabel.tspan(humNum(dead)).font({ anchor: 'right' });
    },

    drawGraph(gs) {
      if (gs.my.drawing) {
        return;
      }
      gs.do.setDrawing(true);
      gs.my.svg.clear();
      gs.my.svg.size(gs.my.width, gs.my.height);
      if (gs.my.width < 200 || gs.my.height < 200) return;

      if (store.my.rawDataLoadStatus === 'loaded') {
        gs.do.drawLine();
      }
      gs.do.setDrawing(false);
    },
  });
}
