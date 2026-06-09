export interface RphData {
  id?: number;
  timestamp?: string;
  minggu: number;
  kelas: string;
  tarikh: string;
  hari?: string;
  masa: string;
  sk: string;
  sp: string;
  objektif: string;
  aktiviti: string;
  bbm: string;
  refleksi: string;
  synced?: boolean;
}

export interface SyllabusItem {
  id: string;
  name: string;
  sp: string[];
  defaultObj: string;
}

export interface SyllabusDatabase {
  [key: string]: SyllabusItem;
}
