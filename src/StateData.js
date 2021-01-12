import Region from './Region';
import DateRep, { DATE_RE } from './DateRep';
import { writeRows, writeState } from './db';

export default class StateData {
  constructor(rows) {
    this.deathMap = new Map();
    this.regions = new Map();
    this.uids = new Set();
    this.rows = rows;
    this.initRegions(rows);
    this.initDeaths(rows);
    this.loadStatus = 'unloaded';
  }

  total() {
    let death = 0;
    let time = 0;
    this.deathMap.forEach((d, t) => {
      if (t > time) {
        time = t;
        death = d;
      }
    });
    return death;
  }

  toData() {
    return {
      regions: this.regions,
      state: this.state,
      region: this.region,
      id: this.id,
    };
  }

  get id() {
    return `${this.state},${this.region}`;
  }

  initDeaths(rows) {
    const datekeys = new Set();
    rows.forEach((row) => {
      this.uids.add(row.UID);
      Object.keys(row).forEach((key) => {
        let d = null;
        if (DATE_RE.test(key)) {
          d = DateRep.from(key);
        }
        if (d) {
          const existing = this.deathMap.has(d.time) ? this.deathMap.get(d.time) : 0;
          const current = Number.parseInt(row[key], 10);
          this.deathMap.set(d.time, existing + current);
        }
      });
    });
  }

  initRegions(rows) {
    rows.forEach((row) => {
      const region = new Region(row);
      this.state = region.state;
      this.region = region.region;
      this.regions.set(region.uid, region);
    });
  }

  async write() {
    writeRows(this.rows, this.state);
    return writeState(this);
  }
}
