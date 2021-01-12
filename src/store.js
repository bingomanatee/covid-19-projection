/* eslint-disable camelcase */
import sortBy from 'lodash/sortBy';
import groupBy from 'lodash/groupBy';
import { addActions, ValueMapStream } from '@wonderlandlabs/looking-glass-engine';
import { clamp, sumBy } from 'lodash';
import dayjs from 'dayjs';
import lGet from 'lodash/get';
import max from 'lodash/max';
import getRawData from './get-raw-data';
import Region from './Region';
import {
  load, deathsAtTime, addRow, addRegion, db,
} from './db';
import StateData from './StateData';
import DateRep from './DateRep';

const { path } = window.location;

const DATE_RE = /(.*)\/(.*)\/(.*)/;
const MAX_SESSION = 500;

const currentPage = 'home';
const store = addActions(new ValueMapStream({
  page: currentPage,
  rawDataLoadStatus: 'not loaded',
  loadError: null,
  states: [],
}),
{
  dataTable(ss) {
    const dates = ss.do.firstOfMonths();
    const rows = [];
    ss.my.regions.forEach((region) => {
      rows.push(region.toData(dates));
    });

    rows.push(ss.my.summary.toData(dates));
    return {
      dates, rows,
    };
  },
  async deathsAtTime(ss, time) {
    return deathsAtTime(time);
  },
  async loadData(theStore) {
    if (!(theStore.my.rawDataLoadStatus === 'not loaded')) {
      return;
    }
    theStore.do.setRawDataLoadStatus('loading');
    const rows = await getRawData();
    const byState = groupBy(rows, (row) => `${row.Province_State},${row.Country_Region}`);
    theStore.do.setStates([...Object.values(byState)].map((stateRows) => new StateData(stateRows)));
    theStore.do.loadNextState();
  },
  loadNextState(ss) {
    const nextUnloadedState = ss.my.states.find((state) => state.loadStatus === 'unloaded');

    if (nextUnloadedState) {
      nextUnloadedState.write()
        .then((results) => {
          ss.do.loadNextState();
        });
    } else {
      ss.do.setRawDataLoadStatus('loaded');
    }
  },

  updateRecordedDataValue(ss, index, value) {
    if (ss.my.rawData[index]) {
      if (ss.my.rawData[index].recorded !== value) {
        ss.do.setRawData(ss.my.rawData.map((pair, pi) => {
          if (pi === index) {
            return { ...pair, recorded: value };
          }
          return pair;
        }));
      }
    }
    if (value !== 'recording') {
      const unprocessedIndex = ss.my.rawData.findIndex(
        (pair) => (
          !((pair.recorded === true
              || (typeof (pair.recorded) === 'object')))
        ),
      );
      if (unprocessedIndex === -1) {
        ss.do.setRawDataLoadStatus('loaded');
      }
    }
  },

  async summary() {
    const byTime = new Map();
    try {
      await db.deaths.each((record) => {
        const { t, d } = record;
        if (byTime.has(t)) {
          byTime.set(t, byTime.get(t) + d);
        } else {
          byTime.set(t, d);
        }
      });

      const rows = [];
      byTime.forEach((deaths, time) => {
        rows.push({ deaths, time });
      });

      const byMonth = groupBy(rows, (dt) => {
        const dr = DateRep.from(dt.time);
        return dr.toMonthString();
      });

      return [...Object.keys(byMonth)]
        .map((monthYear) => {
          const deaths = byMonth[monthYear];
          return {
            deaths: deaths.pop().deaths,
            monthYear,
          };
        });
    } catch (err) {
      console.log('summary error: ', err);
      return [];
    }
  },
});

export default store;
