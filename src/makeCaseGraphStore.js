/* eslint-disable no-param-reassign */
import debounce from 'lodash/debounce';
import throttle from 'lodash/throttle';
import { ValueMapStream, addActions } from '@wonderlandlabs/looking-glass-engine';
import sortBy from 'lodash/sortBy';
import clamp from 'lodash/clamp';
import humNum from 'humanize-number';
import dayjs from 'dayjs';
import lerp from 'lerp';
import chunk from 'lodash/chunk';
import store from './store';

import { casesAtTime, getTimes } from './caseDb';
import DateRep from './DateRep';

const DEATH_INC = 10000000;

const nextYear = new Date();
nextYear.setMonth(nextYear.getMonth() + 12);
const A_YEAR_IN_MS = nextYear.getTime() - Date.now();

const aMonthAgo = new Date();
for (let i = 0; i <= 31; ++i) {
  aMonthAgo.setDate(aMonthAgo.getDate() - 1);
}

const A_MONTH_MS = Date.now() - aMonthAgo.getTime();

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
const DEATH_COLOR = '#38c600';

const A_MONTH_AGO_MS = 1000 * 60 * 60 * 24 * 30;

function divide(list) {
  return chunk(list, Math.max(1, Math.round((list.length) / 2)));
}

function within1(a, b) {
  return Math.abs(a - b) <= 1;
}

export default function makeCaseGraphStore(width, height) {
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
    lastData: {},
    aYearFromNow: {},
    height,
    width,
    xScale: 1,
    yScale: 1,
    maxDeaths: 100,
    coordinates: [],
  }), {
    orderedDates(gs, useExt) {
      return store.do.orderedDates(useExt);
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
    async projectTime(gs) {
      const times = await getTimes();
      const timeDeaths = await Promise.all(times.map(casesAtTime));
      const coordinates = times.map((time, index) => ({ t: time, d: timeDeaths[index] }));

      const latest = coordinates[coordinates.length - 1];
      const monthAgo = coordinates.reduce((then, c, index) => {
        if (c.t + A_MONTH_AGO_MS > latest.t) return then;
        return c;
      }, [0, 0]);

      const deathsPerMS = (latest.d - monthAgo.d) / (latest.t - monthAgo.t);

      const aYearFromNow = { ...latest };
      aYearFromNow.t += A_YEAR_IN_MS;
      aYearFromNow.d += Math.round(A_YEAR_IN_MS * deathsPerMS);

      coordinates.push(aYearFromNow);
      gs.do.setCoordinates(coordinates);
      gs.do.setlastData(latest);
      gs.do.setAYearFromNow(aYearFromNow);

      const lastC = gs.my.coordinates[gs.my.coordinates.length - 1];
      const firstC = gs.my.coordinates[0];
      gs.do.setFirstTime(firstC.t);
      gs.do.setLastTime(lastC.t);

      const timeRange = gs.my.lastTime - gs.my.firstTime;
      const xScale = gs.my.width / timeRange;
      const yScale = gs.my.height / lastC.d;
      gs.do.setMaxDeaths(lastC.d);

      gs.do.setXScale(xScale);
      gs.do.setYScale(yScale);

      return coordinates;
    },
    async drawLine(gs) {
      gs.my.coordinates.forEach((c) => {
        const dTime = c.t - gs.my.firstTime;
        c.x = dTime * gs.my.xScale;
        c.y = gs.my.height - (c.d * gs.my.yScale);
      });

      const xys = sortBy(gs.my.coordinates, 't').map((p) => ([p.x, p.y]));

      const polyLine = gs.my.svg.polyline(xys)
        .fill('none')
        .stroke({
          color: DEATH_COLOR, width: 2, linecap: 'round', linejoin: 'round',
        });

      gs.do.setPolyLine(polyLine);

      gs.do.drawCursor();

      if (!store.my.drawn) store.do.setDrawn(true);
    },
    drawCursor(gs) {
      if (gs.my.cursor) gs.my.cursor.remove();
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

      const date = cursor.text('')
        .x(4).y(-4)
        .font({
          family: 'Helvetica',
          size: 14,
          anchor: 'left',
        });

      const dead = cursor.text('')
        .x(-80).y(-4)
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
    reflectDataPoint(gs, x, alpha, beta) {
      if (!alpha) {
        return null;
      }
      let coordinate = alpha;
      if (beta) {
        const xDiff = (beta.x - alpha.x);
        const alphaRatio = (x - alpha.x) / xDiff;
        coordinate = {
          t: Math.round(lerp(alpha.t, beta.t, alphaRatio)),
          d: Math.round(lerp(alpha.d, beta.d, alphaRatio)),
          y: Math.round(lerp(alpha.y, beta.y, alphaRatio)),
        };
      }

      const dr = DateRep.from(coordinate.t);

      gs.my.dateLabel.tspan(dr.cursorLabel())
        .font({
          fill: 'black',
          align: 'right',
          size: 12,
        });

      gs.my.deadLabel.tspan(`${humNum(coordinate.d)} dead`)
        .font({
          fill: DEATH_COLOR,
          align: 'right',
          size: 12,
        });

      return coordinate;
    },
    extrapolateFromX(gs, x) {
      if (!gs.my.coordinates.length) return null;
      const closeToX = (c) => within1(c.x, x);

      const thumb = { x };
      const candidates = sortBy([thumb, ...gs.my.coordinates], 'x');
      const index = candidates.indexOf(thumb);
      const before = candidates[index - 1];
      const after = candidates[index + 1];
      if (before && (closeToX(before) || !after)) {
        gs.do.reflectDataPoint(x, before);
      }
      if (after && (closeToX(after) || !before)) {
        return gs.do.reflectDataPoint(x, after);
      }

      return gs.do.reflectDataPoint(x, before, after);
    },
    onMouseMove(gs, x, y) {
      if (!gs.my.cursor) return;
      const coord = gs.do.extrapolateFromX(x);
      if (!coord) return;
      gs.my.cursor.x(x).y(coord.y);
    },
    drawGrid(gs) {
      const grid = gs.my.svg.group();

      function dy(d) {
        return gs.my.height - d * gs.my.yScale;
      }

      const dt = Date.now() - gs.my.firstTime;
      const nowX = dt * gs.my.xScale;

      grid.rect(gs.my.width - nowX + 10, gs.my.height + 20)
        .x(nowX).y(-10).attr('fill', 'orange')
        .opacity(0.2);

      grid.text('(Projection)')
        .x(nowX + 10).y(gs.my.height / 2)
        .font({
          size: 20,
          fill: 'darkorange',
          family: 'Martel, sans-serif',
        });

      for (let deaths = DEATH_INC; deaths < gs.my.maxDeaths; deaths += DEATH_INC) {
        const y = dy(deaths);
        grid.line(-10, y, gs.my.width + 10, y)
          .stroke({
            width: 1,
            color: DEATH_COLOR,
            opacity: 0.25,
          });
        grid.text((a) => a.tspan(humNum(deaths)))
          .x(10).cy(y)
          .font({
            family: 'Helvetica',
            fill: DEATH_COLOR,
            size: 12,
            weight: 'bold',
          });
      }

      const date = new Date(gs.my.firstTime);
      date.setDate(1);

      while (date.getTime() < gs.my.lastTime) {
        const t = date.getTime();

        const dt = t - gs.my.firstTime;
        const x = dt * gs.my.xScale;

        grid.line(x, 12, x, gs.my.height + 10)
          .stroke({
            width: 1,
            color: 'black',
            opacity: 0.25,
          });

        const ref = new DateRep(t);
        grid.text((a) => a.tspan(ref.toMonthString()).font({
          family: 'Martel, sans-serif',
          weight: 'bold',
          align: 'center',
          size: 12,
        }))
          .font({
            anchor: 'center',
          })
          .cx(x)
          .y(5);

        date.setMonth(date.getMonth() + 2);
      }
    },
    async drawGraph(gs) {
      if (gs.my.drawing || (!gs.my.svg)) {
        return;
      }
      gs.do.setDrawing(true);
      gs.my.svg.clear();
      gs.my.svg.size(gs.my.width, gs.my.height);
      if (gs.my.width < 200 || gs.my.height < 200) return;
      if (store.my.rawDataLoadStatus === 'loaded') {
        await gs.do.projectTime();
        gs.do.drawGrid();
        gs.do.drawLine();
        gs.do.drawCursor();
      }
      gs.do.setDrawing(false);
    },
  });
}
