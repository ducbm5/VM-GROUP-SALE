export interface RunnerMember {
  idGroup: string;
  nameGroup: string;
  nameLead: string;
  race: string;
  name: string;
  userId?: string;
  idPassport: string;
  phNo: string;
  distance: string;
  gender: string;
  txnAmount: number;
  dateCreate: string;
  rawRowIndex: number;
}

export interface GroupSummary {
  idGroup: string;
  nameGroup: string;
  nameLead: string;
  race: string;
  memberCount: number;
  totalTxnAmount: number;
  distances: { [key: string]: number };
  genders: { [key: string]: number };
  members: RunnerMember[];
}

export interface SearchStats {
  totalGroupsFound: number;
  totalMembersFound: number;
  totalAmount: number;
  distances: { [key: string]: number };
  genders: { [key: string]: number };
}

export interface SearchResponse {
  status: "success" | "not_found" | "empty" | "error";
  query: string;
  groups: GroupSummary[];
  stats: SearchStats | null;
  message?: string;
}

export interface MetaResponse {
  status: string;
  totalRunners: number;
  totalGroups: number;
  racesList: string[];
  lastUpdated: string;
}
