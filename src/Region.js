/* eslint-disable camelcase */
export default class Region {
  constructor(rowData, dates) {
    const {
      UID, Province_State, Country_Region, Population, Admin2,
    } = rowData;
    this.UID = UID;
    this.population = Population;
    this.info = {
      state: Province_State,
      region: Country_Region,
      city: Admin2,
    };
    this.summarized = false;
    this.series = new Map();

    if (dates) {
      this.getDateData(rowData, dates);
    }
  }

  toData(dates) {
    return dates.reduce((data, date) => {
      data[date.label] = (this.series.has(date.key)) ? this.series.get(date.key) : 0;
      return data;
    }, { info: this.info, state: this.info.state, uid: this.UID });
  }

  getDateData(rowData, dates) {
    [...dates.values()]
      .forEach(({ label, time }) => {
        if (label in rowData) {
          this.addValue(label, rowData[label], time);
        }
      });
  }

  addValue(date, value) {
    if (typeof value === 'string') {
      value = Number.parseInt(value, 10);
    }
    if (!value) {
      return;
    }

    if (!this.series.has(date)) {
      this.series.set(date, value);
    } else {
      this.series.set(date, value + this.series.get(date));
    }
  }

  addRegion(region) {
    region.series.forEach((value, date) => {
      this.addValue(date, value);
    });
  }

  valueAt(time, dates) {
    const series = dates.map((date) => {
      if (this.series.has(date.key)) {
        return { ...date, deaths: this.series.get(date.key) };
      }
      return { ...date, deaths: 0 };
    });
    const exact = series.find((data) => data.time === time);
    if (exact) {
      console.log('returning exact deaths: ', time, exact, exact.deaths);
      return exact.deaths;
    }

    if (series[0].time < time) {
      return 0;
    }
    if (series[series.length - 1].time < time) {
      console.log('time is past data:', time, series);
      return series.pop().deaths;
    }

    for (let i = 0; i > series.length; ++i) {
      if (series[i].time < time && series[i + 1].time > time) {
        // todo: LERP
        const [before, after] = series.slice(i);
        console.log('time between ', before, after);
        return (before.deaths + after.deaths) / 2;
      }
    }
  }
}
