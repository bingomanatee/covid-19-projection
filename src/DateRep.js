import dayjs from 'dayjs';

export const DATE_RE = /(.*)\/(.*)\/(.*)/;

const reps = new Map();

export default class DateRep {
  constructor(input) {
    if (typeof input === 'number') {
      this._d = new Date(input);
    }
    if (input instanceof Date) {
      this._d = new Date(input.getTime());
    }
    if (DATE_RE.test(input)) {
      const [_, month, date, year] = DATE_RE.exec(input);
      const data = {
        month: Number.parseInt(month, 10),
        date: Number.parseInt(date, 10),
        year: Number.parseInt(year, 10) + 2000,
      };
      this._d = new Date(data.year, data.month - 1, data.date);
    }

    reps.set(this.time, this);
    reps.set(this.label, this);
  }

  setTime(t) {
    this._d = new Date(t);
  }

  get key() {
    return dayjs(this._d).format('M/D/YY');
  }

  toString() {
    return dayjs(this._d).format('DD-MM-YYYY');
  }

  toMonthString() {
    return dayjs(this._d).format('MMM/YY');
  }

  cursorLabel() {
    return dayjs(this._d).format('MMM D, YYYY');
  }

  get label() {
    return this.key;
  }

  getMonth() {
    return this._d.getMonth();
  }

  get time() {
    return this._d.getTime();
  }
}

/**
 *
 * @param source
 * @returns {DateRep}
 */
DateRep.from = (source) => {
  if (source instanceof Date) {
    if (reps.has(source.getTime())) return reps.get(source.getTime());
    return DateRep.from(source.getTime());
  }
  if (reps.has(source)) return reps.get(source);
  return new DateRep(source);
};
