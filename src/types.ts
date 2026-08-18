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

export interface GroupSetting {
  matchId: string;
  matchName: string;
  stt: string;
  idGroup: string;
  nameGroup: string;
  nameLead: string;
  phone: string;
  email: string;
  status: string;
  amountSuccess: number;
  amountFailed: number;
  totalRegSuccess: number;
  totalRegFailed: number;
  isBtcGroup: string;
  discount: string;
  regDeadline: string;
  maxRegCount: string;
  qty5km: string;
  qty10km: string;
  qty21km: string;
  qty42km: string;
  paymentMethod: string;
  stage: string;
  createdAt: string;
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
  status: "success" | "not_found" | "empty" | "invalid_length" | "multiple_matches" | "error";
  query: string;
  groups: GroupSummary[];
  groupSetting?: GroupSetting | null;
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

