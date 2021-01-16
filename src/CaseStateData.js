import Region from './Region';
import DateRep, { DATE_RE } from './DateRep';
import { writeRows, writeState } from './caseDb';
import StateData from './StateData';

export default class CaseStateData extends StateData {
  async write() {
    writeRows(this.rows, this.state);
    return writeState(this);
  }
}
