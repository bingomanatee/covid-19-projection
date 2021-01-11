/* eslint-disable camelcase */
import sortBy from 'lodash/sortBy';
import groupBy from 'lodash/groupBy';
import { addActions, ValueMapStream } from '@wonderlandlabs/looking-glass-engine';
import { clamp, sumBy } from 'lodash';
import dayjs from 'dayjs';
import getRawData from './get-raw-data';
import Region from './Region';
import { load, deathsAtTime } from './db';

const { path } = window.location;

const DATE_RE = /(.*)\/(.*)\/(.*)/;
const MAX_SESSION = 500;

const currentPage = 'home';
const store = addActions(new ValueMapStream({
  page: currentPage,
  rawDataLoadStatus: 'not loaded',
  rawData: [],
  dates: new Map(),
  extDates: new Map(),
  datesParsedStatus: 'not parsed',
  loadError: null,
  regions: new Map(),
  regionLoadStatus: 'not loaded',
  lastRegionSummarized: '',
  summary: new Region({ UID: 'Total' }),
  extrapolation: new Region({ UID: 'extrapolation' }),
  summarizeStatus: 'not summarized',
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
  firstOfMonths(ss) {

  },
  deathsAtTime(ss, time) {
    return deathsAtTime(time);
  },
  async loadData(theStore) {
    if (!(theStore.my.rawDataLoadStatus === 'not loaded')) return;
    theStore.do.setRawDataLoadStatus('loading');
    await load();
    theStore.do.setRawDataLoadStatus('loaded');
  },
});

export default store;
