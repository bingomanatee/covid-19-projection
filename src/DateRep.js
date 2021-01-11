import dayjs from 'dayjs';

export const DATE_RE = /(.*)\/(.*)\/(.*)/;

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
      this._d = new Date(data.year, data.month, data.date);
    }

    reps.set(this.time, this);
    reps.set(this.label, this);
  }

  get key() {
    return dayjs(this._d).format('M/D/YY');
  }

  get label() {
    return this.key;
  }

  get time() {
    return this._d.getTime();
  }
}

const reps = new Map();

DateRep.from = (source) => {
  if (source instanceof Date) {
    if (reps.has(source.getTime())) return reps.get(source.getTime());
    return DateRep.from(source.getTime());
  }
  if (reps.has(source)) return reps.get(source);
  return new DateRep(source);
};
