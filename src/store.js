/* eslint-disable camelcase */
import sortBy from 'lodash/sortBy';
import groupBy from 'lodash/groupBy';
import { addActions, ValueMapStream } from '@wonderlandlabs/looking-glass-engine';
import { clamp, sumBy } from 'lodash';
import dayjs from 'dayjs';
import getRawData from './get-raw-data';
import Region from './Region';

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
    const byMonth = groupBy(ss.do.orderedDates(), ({ date }) => dayjs(date).format('MMM YY'));
    return sortBy([...Object.values(byMonth)].reduce((list, dates) => {
      const first = sortBy(dates, 'time').shift();
      return [...list, first];
    }, [ss.do.maxDate()]), 'time');
  },
  dateKeys(ss) {
    return Array.from(ss.my.dates.keys());
  },
  regionKeys(ss) {
    return Array.from(ss.my.regions.keys());
  },
  summarizeRegion(ss, rk) {
    const region = ss.my.regions.get(rk);
    ss.my.summary.addRegion(region);
    region.summarized = true;
    ss.do.setLastRegionSummarized(rk);
  },
  sumData(ss) {
    if (ss.my.summarizeStatus === 'done') return;
    if (ss.my.summarizeStatus === 'not summarized') {
      ss.do.setSummarizeStatus('working');
    }
    console.log('summarizing data from ', ss.my.lastRegionSummarized);
    if (!ss.my.dates.size) {
      return;
    }
    if (!ss.my.rawData.length) {
      return;
    }
    const time = Date.now();

    let regionKeys = ss.do.regionKeys();
    if (ss.my.lastRegionSummarized) {
      const i = regionKeys.indexOf(ss.my.lastRegionSummarized);
      if (i >= 0) regionKeys = regionKeys.slice(i + 1);
    }

    while (regionKeys.length) {
      const rk = regionKeys.shift();
      ss.do.summarizeRegion(rk);
      if ((Date.now() - time) > MAX_SESSION) {
        setTimeout(ss.do.sumData);
        return;
      }
    }
    ss.do.setSummarizeStatus('done');
  },
  parseDates(theStore) {
    if (theStore.my.datesParsedStatus !== 'not parsed') return;
    theStore.do.setDatesParsedStatus('parsing');
    const dates = new Map();
    //  console.log('parsing dates from ', theStore.my.rawData);
    let noNewDates = 0;
    theStore.my.rawData.forEach((row) => {
      if (noNewDates > 4) return;
      let foundNew = false;
      Object.keys(row).forEach((key) => {
        if (dates.has(key)) return;
        //  console.log('key:', key);
        if (DATE_RE.test(key)) {
          foundNew = true;
          const [_, month, date, year] = DATE_RE.exec(key);
          const data = {
            label: key,
            key,
            month: Number.parseInt(month, 10),
            date: Number.parseInt(date, 10),
            year: Number.parseInt(year, 10) + 2000,
          };
          data.date = new Date(data.year, data.month, data.date);
          data.time = data.date.getTime();
          dates.set(key, data);
        }
      });
      if (!foundNew) ++noNewDates;
    });
    theStore.do.setDates(dates);
    const { date } = theStore.do.maxDate();
    let year = date.getFullYear();
    let month = date.getUTCMonth();
    const extDateMap = new Map();
    for (let i = 0; i < 12; ++i) {
      if (month === 11) {
        month = 0; ++year;
      } else {
        ++month;
      }
      const newDate = new Date(year, month, 1);
      const key = newDate.toUTCString();
      const time = newDate.getTime();
      extDateMap.set(key, {
        date: newDate,
        key,
        time,
        label: key,
      });
    }
    theStore.do.setExtDates(extDateMap);

    theStore.do.setDatesParsedStatus('parsed');
  },
  createRegionData(ss) {
    if (ss.my.regionLoadStatus !== 'not loaded') return;
    if (ss.my.datesParsedStatus !== 'parsed') return;
    ss.do.setRegionLoadStatus('loading');
    ss.my.rawData.forEach((row) => {
      ss.do.addRegionData(row);
    });
    ss.do.setRegionLoadStatus('loaded');
  },
  orderedDates(ss, useExt) {
    if (useExt) return sortBy([...ss.my.extDates.values()], 'time');
    return sortBy([...ss.my.dates.values()], 'time');
  },
  maxDate(ss, useExt) {
    return ss.do.orderedDates(useExt).pop();
  },
  minDate(ss) {
    return ss.do.orderedDates().shift();
  },
  maxExtDate(ss) {
    return ss.do.maxDate(true);
  },
  deathsAtTime(ss, time) {
    const dates = ss.do.orderedDates();
    const exactDate = dates.find((d) => d.time === time);

    if (exactDate && ss.my.summary.series.has(exactDate.label)) {
      const deaths = ss.my.summary.series.get(exactDate.label);
      console.log('deaths at time ', time, ' -- exact:', exactDate, 'deaths = ', deaths);
      return deaths;
    }

    return ss.my.summary.valueAt(time, ss.my.dates);
  },
  addRegionData(theStore, row) {
    const newRegions = new Map(theStore.my.regions);
    const item = new Region(row, theStore.my.dates);
    newRegions.set(item.UID, item);
    theStore.do.setRegions(newRegions);
  },
  async loadData(theStore) {
    theStore.do.setRawDataLoadStatus('laoding');
    try {
      const rawData = await getRawData();
      theStore.do.setRawData(rawData);
      theStore.do.setRawDataLoadStatus('loaded');
    } catch (err) {
      //  console.log('---- error:', err);
      theStore.do.setRawDataLoadStatus('error');
      theStore.do.setLoadError(err);
    }
  },
});

export default store;
