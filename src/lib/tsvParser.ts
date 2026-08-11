export const TSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSdKN4erdH4gZw4QT6q3AjYKZDPdyrXeI0JMQ3zCDafd1M837zHUu31BsmOJNovrsk7PpZ55AmU1NdB/pub?gid=0&single=true&output=tsv";

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

export interface SearchResponse {
  status: "empty" | "invalid_length" | "not_found" | "multiple_matches" | "success" | "error";
  query: string;
  groups: GroupSummary[];
  stats: {
    totalGroupsFound: number;
    totalMembersFound: number;
    totalAmount: number;
    distances: { [key: string]: number };
    genders: { [key: string]: number };
  } | null;
  message?: string;
}

export interface MetaResponse {
  status: string;
  totalRunners: number;
  totalGroups: number;
  racesList: string[];
  lastUpdated: string;
}

let cachedClientData: {
  rows: RunnerMember[];
  lastFetched: number;
} | null = null;

const CACHE_TTL_MS = 60 * 1000; // 1 min

export async function parseTSVData(): Promise<RunnerMember[]> {
  const now = Date.now();
  if (cachedClientData && (now - cachedClientData.lastFetched) < CACHE_TTL_MS) {
    return cachedClientData.rows;
  }

  const res = await fetch(TSV_URL, {
    headers: {
      'Cache-Control': 'no-cache'
    }
  });

  if (!res.ok) {
    throw new Error(`Không thể tải dữ liệu TSV (Mã phản hồi: ${res.status})`);
  }

  const tsvText = await res.text();
  const lines = tsvText.split(/\r?\n/).filter(line => line.trim().length > 0);

  if (lines.length < 2) {
    return [];
  }

  const rawHeaders = lines[0].split('\t').map(h => h.trim());

  const findHeaderIdx = (patterns: string[], excludePatterns: string[] = []): number => {
    for (let i = 0; i < rawHeaders.length; i++) {
      const h = rawHeaders[i].toUpperCase();
      for (const p of patterns) {
        if (h === p.toUpperCase()) {
          return i;
        }
      }
    }
    for (let i = 0; i < rawHeaders.length; i++) {
      const h = rawHeaders[i].toUpperCase();
      const isExcluded = excludePatterns.some(ex => h.includes(ex.toUpperCase()));
      if (isExcluded) continue;
      for (const p of patterns) {
        if (h.includes(p.toUpperCase())) {
          return i;
        }
      }
    }
    return -1;
  };

  const idGroupIdx = findHeaderIdx(['ID_GROUP', 'ID GROUP', 'IDNHOM', 'ID NHÓM', 'MÃ NHÓM', 'GROUP ID']);
  const nameGroupIdx = findHeaderIdx(['NAME_GROUP', 'NAME GROUP', 'TENNHOM', 'TÊN NHÓM', 'GROUP NAME']);
  const nameLeadIdx = findHeaderIdx(['NAME_LEAD', 'NAME LEAD', 'TENLEAD', 'TRƯỞNG NHÓM', 'LEAD']);
  const raceIdx = findHeaderIdx(['RACE', 'GIẢI CHẠY', 'GIẢI', 'EVENT']);
  const nameIdx = findHeaderIdx(['NAME', 'HỌ TÊN', 'HỌ VÀ TÊN', 'TÊN THÀNH VIÊN', 'FULL NAME', 'THÀNH VIÊN', 'TÊN VĐV', 'TÊN'], ['GROUP', 'LEAD', 'NHÓM', 'TRƯỞNG']);
  const userIdIdx = findHeaderIdx(['USER_ID', 'USER ID', 'USERID', 'MÃ VĐV', 'ID VĐV', 'MÃ THÀNH VIÊN', 'USER'], ['GROUP']);
  const idPassportIdx = findHeaderIdx(['ID_PASSPORT', 'PASSPORT', 'CCCD', 'CMND', 'HỘ CHIẾU', 'CĂN CƯỚC']);
  const phNoIdx = findHeaderIdx(['PH_NO', 'PHONE', 'SĐT', 'SỐ ĐIỆN THOẠI', 'TEL', 'SDT']);
  const distanceIdx = findHeaderIdx(['DISTANCE', 'CỰ LY', 'KHOẢNG CÁCH', 'KM']);
  const genderIdx = findHeaderIdx(['GENDER', 'GIỚI TÍNH', 'SEX']);
  const txnAmountIdx = findHeaderIdx(['TXNAMOUNT', 'AMOUNT', 'TIỀN', 'LỆ PHÍ', 'SỐ TIỀN', 'FEE']);
  const dateCreateIdx = findHeaderIdx(['DATE_CREATE', 'DATE', 'THỜI GIAN', 'NGÀY TẠO', 'CREATED']);

  const rows: RunnerMember[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split('\t').map(c => c.trim());
    
    const getVal = (idx: number, fallbackCol: number) => {
      if (idx !== -1 && idx < cols.length) return cols[idx];
      if (fallbackCol >= 0 && fallbackCol < cols.length) return cols[fallbackCol];
      return '';
    };

    const parseMoney = (val: string): number => {
      if (!val) return 0;
      const cleaned = val.replace(/[^0-9.-]+/g, '');
      const num = parseFloat(cleaned);
      return isNaN(num) ? 0 : num;
    };

    const row: RunnerMember = {
      idGroup: getVal(idGroupIdx, 0),
      nameGroup: getVal(nameGroupIdx, 1),
      nameLead: getVal(nameLeadIdx, 2),
      race: getVal(raceIdx, 3),
      name: getVal(nameIdx, 4),
      userId: getVal(userIdIdx, -1),
      idPassport: getVal(idPassportIdx, 5),
      phNo: getVal(phNoIdx, 6),
      distance: getVal(distanceIdx, 7),
      gender: getVal(genderIdx, 8),
      txnAmount: parseMoney(getVal(txnAmountIdx, 9)),
      dateCreate: getVal(dateCreateIdx, 10),
      rawRowIndex: i
    };

    if (row.idGroup || row.nameGroup || row.name) {
      rows.push(row);
    }
  }

  cachedClientData = {
    rows,
    lastFetched: Date.now()
  };

  return rows;
}

export async function clientGetMeta(): Promise<MetaResponse> {
  const rows = await parseTSVData();
  const uniqueGroupIds = new Set(rows.map(r => r.idGroup).filter(Boolean));
  const races = Array.from(new Set(rows.map(r => r.race).filter(Boolean)));

  return {
    status: "ok",
    totalRunners: rows.length,
    totalGroups: uniqueGroupIds.size,
    racesList: races,
    lastUpdated: new Date().toISOString()
  };
}

export async function clientSearch(query: string, exactMatch: boolean = false): Promise<SearchResponse> {
  const trimmed = query.trim();

  if (!trimmed) {
    return {
      status: "empty",
      query: "",
      groups: [],
      stats: null,
      message: "Vui lòng nhập mã ID_GROUP (tối thiểu 5 ký tự) để tra cứu."
    };
  }

  if (trimmed.length < 5) {
    return {
      status: "invalid_length",
      query: trimmed,
      groups: [],
      stats: null,
      message: `Mã nhóm (ID_GROUP) cần nhập từ 5 ký tự trở lên. Hiện tại bạn mới nhập ${trimmed.length} ký tự.`
    };
  }

  const allRows = await parseTSVData();
  const normalizedQuery = trimmed.toLowerCase();

  const matchedRows = allRows.filter(r => {
    const idG = (r.idGroup || '').trim().toLowerCase();
    if (exactMatch) {
      return idG === normalizedQuery;
    } else {
      return idG.includes(normalizedQuery);
    }
  });

  if (matchedRows.length === 0) {
    return {
      status: "not_found",
      query: trimmed,
      groups: [],
      stats: null,
      message: `Không tìm thấy nhóm nào có ID_GROUP khớp với mã "${trimmed}".`
    };
  }

  const groupMap = new Map<string, GroupSummary>();

  for (const row of matchedRows) {
    const groupKey = (row.idGroup || "UNKNOWN_GROUP").trim();
    
    if (!groupMap.has(groupKey)) {
      groupMap.set(groupKey, {
        idGroup: row.idGroup,
        nameGroup: row.nameGroup,
        nameLead: row.nameLead,
        race: row.race,
        memberCount: 0,
        totalTxnAmount: 0,
        distances: {},
        genders: {},
        members: []
      });
    }

    const groupObj = groupMap.get(groupKey)!;
    groupObj.memberCount += 1;
    groupObj.totalTxnAmount += row.txnAmount || 0;
    groupObj.members.push(row);

    const distKey = row.distance || 'Khác';
    groupObj.distances[distKey] = (groupObj.distances[distKey] || 0) + 1;

    const genKey = row.gender || 'Khác';
    groupObj.genders[genKey] = (groupObj.genders[genKey] || 0) + 1;
  }

  const groups = Array.from(groupMap.values());

  if (groups.length > 1) {
    return {
      status: "multiple_matches",
      query: trimmed,
      groups: [],
      stats: null,
      message: `Lỗi: Kết quả tìm kiếm trả về ${groups.length} nhóm khác nhau chứa mã "${trimmed}" (ID: ${groups.map(g => g.idGroup).join(', ')}). Hệ thống yêu cầu chỉ hiển thị duy nhất 1 nhóm. Vui lòng nhập chính xác đầy đủ mã ID_GROUP.`
    };
  }

  const totalMembers = matchedRows.length;
  const totalAmount = matchedRows.reduce((sum, r) => sum + (r.txnAmount || 0), 0);
  
  const overallDistances: { [key: string]: number } = {};
  const overallGenders: { [key: string]: number } = {};

  for (const r of matchedRows) {
    const d = r.distance || 'Khác';
    overallDistances[d] = (overallDistances[d] || 0) + 1;

    const g = r.gender || 'Khác';
    overallGenders[g] = (overallGenders[g] || 0) + 1;
  }

  return {
    status: "success",
    query: trimmed,
    groups,
    stats: {
      totalGroupsFound: 1,
      totalMembersFound: totalMembers,
      totalAmount,
      distances: overallDistances,
      genders: overallGenders
    }
  };
}
