/* eslint-disable camelcase */
export default class Region {
  constructor(rowData, dates) {
    const {
      UID, Province_State, Country_Region, Population,
    } = rowData;
    this.UID = UID;
    this.population = Population;
    this.info = {
      state: Province_State,
      region: Country_Region,
    };
    this.summarized = false;
    this.series = new Map();

    if (dates) {
      this.getDateData(rowData, dates);
    }
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
}
