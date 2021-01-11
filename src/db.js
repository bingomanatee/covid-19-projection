/* eslint-disable */
import Dexie from 'dexie';
import DateRep, { DATE_RE } from './DateRep';
import sumBy from 'lodash/sumBy'

import getRawData from './get-raw-data';

export const db = new Dexie('COVID-19');

db.version(1)
  .stores({
    deaths: 'deaths, {time+uid}',
    regions: '&uid, city, state, country, lat, long',
  });

export const addRow = (row) => {
  const {
    UID, iso2, iso3, code3, FIPS, Admin2,	Province_State, Country_Region,	Lat, Long_, Combined_Key,
  } = row;
  const existing = db.regions.get(UID);
  if (!existing) {
    db.regions.add({
      uid: UID,
      state: Province_State,
      region: Country_Region,
      lat: Lat,
      long: Long_,
    });
  }

  db.deaths.where('uid').equals(UID).delete();
  const newTimes = [];
  [...Object.keys(row)].forEach((key) => {
    if (DATE_RE.test(key)) {
      const d = DateRep.from(key);
      newTimes.push({
        time: d.time,
        deaths: Number.parseInt(row[key], 10),
      });
    }
  });

  db.deaths.bulkAdd(newTimes);
};

const deathsAtTime = (time) => {
  const dr = DateRep.from(time);
  const sum = db.deaths.where({time, uid: 'summary'}).first();
  if (sum) return sum.deaths;

  const exactTimes = db.deaths.where({time}).toArray();
  if (exactTimes.length) {
    const totalDeaths = sumBy(exactTimes, 'deaths');
    db.deaths.add({
      uid: 'summary',
      time: dr.time,
      deaths: totalDeaths
    });
    return totalDeaths
  }

  const mostRecentBefore = db.deaths.where('time').belowOrEqual(dr.time).orderBy('time').last();
  const mostRecentAfter = db.deaths.where('time').aboveOrEqual(dr.time).orderBy('time').first();
  if (mostRecentBefore) {
    if (mostRecentAfter) {
      return (deathsAtTime(mostRecentBefore.time) + deathsAtTime(mostRecentAfter.time))/2;
    }
    return deathsAtTime(mostRecentBefore.time);
  } else if (mostRecentAfter) {
    return deathsAtTime(mostRecentAfter.time);
  }
}

export const load = async function () {
  const rows = await getRawData();
  rows.forEach(addRow);
}

export const times = function() {
  const times = new Set();
  db.deaths.orderBy('time').eachUniqueKey(function (time) {
times.add(time);
  });
}
