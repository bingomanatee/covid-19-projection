/* eslint-disable camelcase */
export default class Region {
  constructor(rowData) {
    const {
      UID, Province_State, Country_Region, Population, Admin2,
    } = rowData;
    this.uid = UID;
    this.population = Population;
    this.state = Province_State;
    this.region = Country_Region;
    this.city = Admin2;
  }
}
