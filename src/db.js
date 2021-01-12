/* eslint-disable */
import Dexie from 'dexie';
import DateRep, { DATE_RE } from './DateRep';
import sumBy from 'lodash/sumBy'
import groupBy from 'lodash/groupBy'
import getRawData from './get-raw-data';
import Region from "./Region";

export const db = new Dexie('COVID-19');

db.version(1)
  .stores({
    states: 'id, state',
    datarows: 'uid, state, region',
    deaths: '++id, state, t',
    summaries: 't'
  });
let lastState = '';
export const addRegion = async (row, comm) => {
  const {
    UID, iso2, iso3, code3, FIPS, Admin2, Province_State, Country_Region, Lat, Long_, Combined_Key,
  } = row;
  const existing = await db.regions.where('uid').equals(`${UID}`).first();
  if (!existing) {
    const region = {
      uid: `${UID}`,
      city: Admin2,
      state: Province_State,
      country: Country_Region,
      lat: Lat,
      long: Long_,
    };
    const result = await db.regions.add(region);
  }
}

export const deathsBefore = (time) => {
  return db.deaths.where('t').belowOrEqual(time).orderBy('t').last();
}

export const deathsAfter = (time) => {
  return db.deaths.where('t').aboveOrEqual(time).orderBy('t').first();
}

export const getTimes = async () => {
  const list = new Set();

  await db.deaths.each(({t}) => list.add(t));
  return [...list.values()].sort();
}

export const lastTime = async () => {
  const last = await db.deaths.orderBy('t').last();
  if (last) {
    return last.t;
  }
  return null;
}

export const firstTime = async () => {
  const first = await db.deaths.orderBy('t').first();
  if (first) {
    return first.t;
  }
  return null;
}

export const maxDeaths = async () => {
  const t = await lastTime();
  console.log('max deaths -- at time ', t);
  return deathsAtTime(t);
}

export const deathsAtTime = async (time) => {
  const dr = DateRep.from(time);
  const sum = await db.summaries.get(time);
  if (sum) {
    return sum.d;
  }

  const exactTimes = await db.deaths.where('t').equals(time).toArray();
  if (exactTimes.length) {
    const totalDeaths = sumBy(exactTimes, 'd');
    db.summaries.add({t: time, d: totalDeaths});
    return totalDeaths
  }
  return null;
}

export const times = function () {
  const times = new Set();
  db.deaths.orderBy('t').eachUniqueKey(function (time) {
    times.add(time);
  });
  return Array.from(times.values())
}

export const writeRows = async (rows, state) => {
  const data = rows.map((row) => {
    const region = new Region(row);
    const out = {};
    Object.keys(row).forEach(key => {
      out[key.toLowerCase()] = row[key]
    });
    return {...out, ...region};
  });
  await db.datarows.where('state').equals(state).delete();
  return db.datarows.bulkAdd(data).then((result) => {
  }).catch((err) => {
    console.log('writeRows', data, ' error:', err);
  })
}

export const writeState = async (state) => {
  const template = {state: state.state, region: state.region};
  const data = []
  state.deathMap.forEach((d, t) => {
    data.push({...template, d, t});
  });
  await db.states.where('id').equals(state.id).delete();
  await db.states.add(state.toData());
  await db.deaths.where('state').equals(state.state).delete();
  return db.deaths.bulkAdd(data).then((result) => {
    state.loadStatus = 'loaded';
  }).catch(err => {
    state.loadStatus = 'error';
    state.error = err
  });
}
