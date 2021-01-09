/* eslint-disable no-param-reassign */
import debounce from 'lodash/debounce';
import throttle from 'lodash/throttle';
import { ValueMapStream, addActions } from '@wonderlandlabs/looking-glass-engine';
import sortBy from 'lodash/sortBy';
import clamp from 'lodash/clamp';
import humNum from 'humanize-number';
import dayjs from 'dayjs';
import store from './store';

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
      if (!store.my.dates.size) return 0;
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

    drawLine(gs) {
      const { maxDeaths } = gs.do.endCompute();
      const scale = gs.my.height / maxDeaths;
      const ordered = gs.do.orderedDates();
      const { series } = store.my.summary;

      let coordinates = [];
      store.my.dates.forEach((date) => {
        const { time, key } = date;
        if (series.has(key)) {
          const deaths = series.get(key);
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

      const xys = coordinates.map((p) => ([p.x, p.y]));
      xys.push([gs.my.width, (gs.my.height - (maxDeaths * scale))]);
      const polyLine = gs.my.svg.polyline(xys)
        .fill('none')
        .stroke({
          color: DEATH_COLOR, width: 2, linecap: 'round', linejoin: 'round',
        });

      gs.do.setPolyLine(polyLine);

      /*    setTimeout(() => {
        gs.do.drawSensors(coordinates);
      }); */

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

      if (store.my.summary.series.size) {
        gs.do.drawLine();
      }

      if (store.my.dates.size) {
        gs.do.drawDates();
      }
      gs.do.setDrawing(false);
    },
  });
}
