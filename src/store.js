/* eslint-disable camelcase */
import groupBy from 'lodash/groupBy';
import { addActions, ValueMapStream } from '@wonderlandlabs/looking-glass-engine';
import first from 'lodash/first';
import last from 'lodash/last';
import getDeathData from './getDeathData';
import StateData from './StateData';
import CaseStateData from './CaseStateData';
import DateRep from './DateRep';
import { db } from './db';
import getCaseData from './getCaseData';

const currentPage = 'home';
const store = addActions(new ValueMapStream({
  page: currentPage,
  rawDataLoadStatus: 'not loaded',
  rawCaseDataLoadStatus: 'not loaded',
  loadError: null,
  states: [],
  caseStates: [],
}),
{
  dataTable(ss) {
    const dates = ss.do.firstOfMonths();

    return {
      dates,
      rows: ss.my.states,
    };
  },

  dataIsLoading(ss) {
    switch (ss.my.page) {
      case 'home':
        return ss.my.rawDataLoadStatus !== 'loaded';
        break;

      case 'cases':
        return ss.my.rawCaseDataLoadStatus !== 'loaded';
        break;
    }
    return false;
  },

  firstOfMonths(ss) {
    if (!ss.my.states.length) {
      return [];
    }
    const firstState = first(ss.my.states);
    return [...firstState.deathMap.keys()]
      .reduce((firsts, t) => {
        if (!firsts.length) return [DateRep.from(t)];
        if (last(firsts).getMonth() !== new Date(t).getMonth()) {
          return [...firsts, DateRep.from(t)];
        }
        return firsts;
      }, []);
  },
  async loadData(ss) {
    if (!(ss.my.rawDataLoadStatus === 'not loaded')) {
      return;
    }
    ss.do.setRawDataLoadStatus('loading');
    const rows = await getDeathData();
    const byState = groupBy(rows, (row) => `${row.Province_State},${row.Country_Region}`);
    ss.do.setStates([...Object.values(byState)].map((stateRows) => new StateData(stateRows)));
    ss.do.loadNextState();
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

  async loadCaseData(ss) {
    if (!(ss.my.rawCaseDataLoadStatus === 'not loaded')) {
      return;
    }
    ss.do.setRawCaseDataLoadStatus('loading');
    const rows = await getCaseData();
    const byState = groupBy(rows, (row) => `${row.Province_State},${row.Country_Region}`);
    ss.do.setCaseStates([...Object.values(byState)].map((stateRows) => new CaseStateData(stateRows)));
    ss.do.loadNextCaseState();
  },
  loadNextCaseState(ss) {
    const nextUnloadedState = ss.my.caseStates.find((state) => state.loadStatus === 'unloaded');
    if (nextUnloadedState) {
      nextUnloadedState.write()
        .then((results) => {
          ss.do.loadNextCaseState();
        });
    } else {
      ss.do.setRawCaseDataLoadStatus('loaded');
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

      const summary = [...Object.keys(byMonth)]
        .map((monthYear) => {
          const deaths = byMonth[monthYear];
          return {
            deaths: deaths.pop().deaths,
            monthYear,
          };
        });
      console.log('summary:', summary);
      return summary;
    } catch (err) {
      console.log('summary error: ', err);
      return [];
    }
  },
});

export default store;
