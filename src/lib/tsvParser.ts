import { RunnerMember, GroupSummary, GroupSetting, SearchResponse, MetaResponse } from '../types';

export const TSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSan91I-1TtCgd1EmdluNJz1WW8R7wCnCXwKz8BA1SaiOCouWBR4_b6rm5YrywWmAr45nPAMHMs4Bd1/pub?gid=0&single=true&output=tsv";
export const GROUP_SETTINGS_TSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRHymZVxu0vJMxzbqe0SuqGa2yWPZb6yPRNveitDRPbHja4WduOdwK-G0q9WMPxgaeqVtUpcfj5DRYi/pub?gid=0&single=true&output=tsv";

let cachedClientData: {
  rows: RunnerMember[];
  lastFetched: number;
} | null = null;

let cachedGroupSettings: {
  rows: GroupSetting[];
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

export async function parseGroupSettingsData(): Promise<GroupSetting[]> {
  const now = Date.now();
  if (cachedGroupSettings && (now - cachedGroupSettings.lastFetched) < CACHE_TTL_MS) {
    return cachedGroupSettings.rows;
  }

  const res = await fetch(GROUP_SETTINGS_TSV_URL, {
    headers: {
      'Cache-Control': 'no-cache'
    }
  });

  if (!res.ok) {
    throw new Error(`Không thể tải dữ liệu Cài đặt nhóm TSV (Mã phản hồi: ${res.status})`);
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

  const matchIdIdx = findHeaderIdx(['MATCH ID', 'MATCH_ID']);
  const matchNameIdx = findHeaderIdx(['MATCH NAME', 'MATCH_NAME']);
  const sttIdx = findHeaderIdx(['STT', 'NO', '#']);
  const idGroupIdx = findHeaderIdx(['ID NHÓM', 'ID NHOM', 'ID_NHOM', 'ID_GROUP', 'ID GROUP', 'MÃ NHÓM']);
  const nameGroupIdx = findHeaderIdx(['TÊN NHÓM', 'TEN NHOM', 'NAME_GROUP', 'NAME GROUP', 'GROUP NAME']);
  const nameLeadIdx = findHeaderIdx(['TRƯỞNG NHÓM', 'TRUONG NHOM', 'NAME_LEAD', 'LEAD']);
  const phoneIdx = findHeaderIdx(['ĐIỆN THOẠI', 'DIEN THOAI', 'SĐT', 'SDT', 'PHONE', 'PH_NO', 'TEL']);
  const emailIdx = findHeaderIdx(['EMAIL', 'E-MAIL', 'MAIL']);
  const statusIdx = findHeaderIdx(['TRẠNG THÁI', 'TRANG THAI', 'STATUS']);
  const amountSuccessIdx = findHeaderIdx(['SỐ TIỀN THÀNH CÔNG', 'TIỀN THÀNH CÔNG', 'AMOUNT SUCCESS']);
  const amountFailedIdx = findHeaderIdx(['SỐ TIỀN THẤT BẠI', 'TIỀN THẤT BẠI', 'AMOUNT FAILED']);
  const regSuccessIdx = findHeaderIdx(['TỔNG ĐĂNG KÝ THÀNH CÔNG', 'ĐĂNG KÝ THÀNH CÔNG', 'REG SUCCESS']);
  const regFailedIdx = findHeaderIdx(['ĐĂNG KÝ THẤT BẠI', 'REG FAILED']);
  const isBtcGroupIdx = findHeaderIdx(['NHÓM BTC', 'NHOM BTC', 'BTC']);
  const discountIdx = findHeaderIdx(['DISCOUNT', 'GIẢM GIÁ', 'CHIẾT KHẤU']);
  const deadlineIdx = findHeaderIdx(['THỜI HẠN ĐĂNG KÝ', 'THOI HAN DANG KY', 'HẠN ĐĂNG KÝ']);
  const maxRegIdx = findHeaderIdx(['SỐ LƯỢNG ĐƯỢC ĐĂNG KÝ', 'SO LUONG DUOC DANG KY', 'MAX REG', 'QUOTA']);
  const qty5kmIdx = findHeaderIdx(['SỐ LƯỢNG 5KM', 'SO LUONG 5KM', '5KM']);
  const qty10kmIdx = findHeaderIdx(['SỐ LƯỢNG 10KM', 'SO LUONG 10KM', '10KM']);
  const qty21kmIdx = findHeaderIdx(['SỐ LƯỢNG 21KM', 'SO LUONG 21KM', '21KM']);
  const qty42kmIdx = findHeaderIdx(['SỐ LƯỢNG 42KM', 'SO LUONG 42KM', '42KM']);
  const paymentMethodIdx = findHeaderIdx(['PHƯƠNG THỨC THANH TOÁN', 'PHUONG THUC THANH TOAN', 'PAYMENT METHOD']);
  const stageIdx = findHeaderIdx(['STAGE', 'GIAI ĐOẠN']);
  const createdAtIdx = findHeaderIdx(['THOI GIAN TAO', 'THỜI GIAN TẠO', 'CREATED AT', 'DATE_CREATE']);

  const parseMoney = (val: string): number => {
    if (!val) return 0;
    const cleaned = val.replace(/[^0-9.-]+/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  };

  const rows: GroupSetting[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split('\t').map(c => c.trim());
    const getVal = (idx: number, fallbackCol: number = -1) => {
      if (idx !== -1 && idx < cols.length) return cols[idx];
      if (fallbackCol >= 0 && fallbackCol < cols.length) return cols[fallbackCol];
      return '';
    };

    const row: GroupSetting = {
      matchId: getVal(matchIdIdx, 0),
      matchName: getVal(matchNameIdx, 1),
      stt: getVal(sttIdx, 2),
      idGroup: getVal(idGroupIdx, 4),
      nameGroup: getVal(nameGroupIdx, 5),
      nameLead: getVal(nameLeadIdx, 6),
      phone: getVal(phoneIdx, 7),
      email: getVal(emailIdx, 8),
      status: getVal(statusIdx, 9),
      amountSuccess: parseMoney(getVal(amountSuccessIdx, 10)),
      amountFailed: parseMoney(getVal(amountFailedIdx, 11)),
      totalRegSuccess: parseMoney(getVal(regSuccessIdx, 12)),
      totalRegFailed: parseMoney(getVal(regFailedIdx, 13)),
      isBtcGroup: getVal(isBtcGroupIdx, 14),
      discount: getVal(discountIdx, 15),
      regDeadline: getVal(deadlineIdx, 16),
      maxRegCount: getVal(maxRegIdx, 17),
      qty5km: getVal(qty5kmIdx, 18),
      qty10km: getVal(qty10kmIdx, 19),
      qty21km: getVal(qty21kmIdx, 20),
      qty42km: getVal(qty42kmIdx, 21),
      paymentMethod: getVal(paymentMethodIdx, 22),
      stage: getVal(stageIdx, 23),
      createdAt: getVal(createdAtIdx, 24),
    };

    if (row.idGroup || row.nameGroup) {
      rows.push(row);
    }
  }

  cachedGroupSettings = {
    rows,
    lastFetched: Date.now()
  };

  return rows;
}

export async function clientGetMeta(): Promise<MetaResponse> {
  const [memberRows, settingRows] = await Promise.all([
    parseTSVData().catch(() => []),
    parseGroupSettingsData().catch(() => [])
  ]);

  const memberGroupIds = memberRows.map(r => r.idGroup).filter(Boolean);
  const settingGroupIds = settingRows.map(s => s.idGroup).filter(Boolean);
  const uniqueGroupIds = new Set([...memberGroupIds, ...settingGroupIds]);

  const races = Array.from(new Set([
    ...memberRows.map(r => r.race).filter(Boolean),
    ...settingRows.map(s => s.matchName).filter(Boolean)
  ]));

  return {
    status: "ok",
    totalRunners: memberRows.length,
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
      groupSetting: null,
      stats: null,
      message: "Vui lòng nhập mã ID_GROUP (tối thiểu 5 ký tự) để tra cứu."
    };
  }

  if (trimmed.length < 5) {
    return {
      status: "invalid_length",
      query: trimmed,
      groups: [],
      groupSetting: null,
      stats: null,
      message: `Mã nhóm (ID_GROUP) cần nhập từ 5 ký tự trở lên. Hiện tại bạn mới nhập ${trimmed.length} ký tự.`
    };
  }

  const [allRows, allSettings] = await Promise.all([
    parseTSVData(),
    parseGroupSettingsData()
  ]);

  const normalizedQuery = trimmed.toLowerCase();

  // Find matching group IDs from both member rows and group settings
  const matchingGroupIds = new Set<string>();

  for (const r of allRows) {
    const idG = (r.idGroup || '').trim();
    if (exactMatch) {
      if (idG.toLowerCase() === normalizedQuery) {
        matchingGroupIds.add(idG);
      }
    } else {
      if (idG.toLowerCase().includes(normalizedQuery)) {
        matchingGroupIds.add(idG);
      }
    }
  }

  for (const s of allSettings) {
    const idG = (s.idGroup || '').trim();
    if (exactMatch) {
      if (idG.toLowerCase() === normalizedQuery) {
        matchingGroupIds.add(idG);
      }
    } else {
      if (idG.toLowerCase().includes(normalizedQuery)) {
        matchingGroupIds.add(idG);
      }
    }
  }

  if (matchingGroupIds.size === 0) {
    return {
      status: "not_found",
      query: trimmed,
      groups: [],
      groupSetting: null,
      stats: null,
      message: `Không tìm thấy nhóm nào có ID_GROUP khớp với mã "${trimmed}".`
    };
  }

  if (matchingGroupIds.size > 1) {
    const matchedIdsList = Array.from(matchingGroupIds);
    return {
      status: "multiple_matches",
      query: trimmed,
      groups: [],
      groupSetting: null,
      stats: null,
      message: `Lỗi: Kết quả tìm kiếm trả về ${matchedIdsList.length} nhóm khác nhau chứa mã "${trimmed}" (ID: ${matchedIdsList.join(', ')}). Hệ thống yêu cầu chỉ hiển thị duy nhất 1 nhóm. Vui lòng nhập chính xác đầy đủ mã ID_GROUP.`
    };
  }

  const targetGroupId = Array.from(matchingGroupIds)[0];
  const targetIdLower = targetGroupId.toLowerCase();

  const matchedRows = allRows.filter(r => (r.idGroup || '').trim().toLowerCase() === targetIdLower);
  const matchedSetting = allSettings.find(s => (s.idGroup || '').trim().toLowerCase() === targetIdLower) || null;

  // Build GroupSummary
  let groups: GroupSummary[] = [];

  if (matchedRows.length > 0) {
    const groupKey = targetGroupId;
    const groupObj: GroupSummary = {
      idGroup: targetGroupId,
      nameGroup: matchedRows[0].nameGroup || matchedSetting?.nameGroup || targetGroupId,
      nameLead: matchedRows[0].nameLead || matchedSetting?.nameLead || '',
      race: matchedRows[0].race || matchedSetting?.matchName || '',
      memberCount: 0,
      totalTxnAmount: 0,
      distances: {},
      genders: {},
      members: []
    };

    for (const row of matchedRows) {
      groupObj.memberCount += 1;
      groupObj.totalTxnAmount += row.txnAmount || 0;
      groupObj.members.push(row);

      const distKey = row.distance || 'Khác';
      groupObj.distances[distKey] = (groupObj.distances[distKey] || 0) + 1;

      const genKey = row.gender || 'Khác';
      groupObj.genders[genKey] = (groupObj.genders[genKey] || 0) + 1;
    }

    groups = [groupObj];
  } else if (matchedSetting) {
    // Group exists in settings sheet but no individual runner rows yet
    groups = [{
      idGroup: targetGroupId,
      nameGroup: matchedSetting.nameGroup || targetGroupId,
      nameLead: matchedSetting.nameLead || '',
      race: matchedSetting.matchName || '',
      memberCount: matchedSetting.totalRegSuccess || 0,
      totalTxnAmount: matchedSetting.amountSuccess || 0,
      distances: {
        ...(matchedSetting.qty5km ? { '5': Number(matchedSetting.qty5km) || 0 } : {}),
        ...(matchedSetting.qty10km ? { '10': Number(matchedSetting.qty10km) || 0 } : {}),
        ...(matchedSetting.qty21km ? { '21': Number(matchedSetting.qty21km) || 0 } : {}),
        ...(matchedSetting.qty42km ? { '42': Number(matchedSetting.qty42km) || 0 } : {}),
      },
      genders: {},
      members: []
    }];
  }

  const totalMembers = matchedRows.length > 0 ? matchedRows.length : (matchedSetting?.totalRegSuccess || 0);
  const totalAmount = matchedRows.length > 0 
    ? matchedRows.reduce((sum, r) => sum + (r.txnAmount || 0), 0)
    : (matchedSetting?.amountSuccess || 0);

  const overallDistances: { [key: string]: number } = {};
  const overallGenders: { [key: string]: number } = {};

  if (matchedRows.length > 0) {
    for (const r of matchedRows) {
      const d = r.distance || 'Khác';
      overallDistances[d] = (overallDistances[d] || 0) + 1;

      const g = r.gender || 'Khác';
      overallGenders[g] = (overallGenders[g] || 0) + 1;
    }
  } else if (matchedSetting) {
    if (matchedSetting.qty5km) overallDistances['5'] = Number(matchedSetting.qty5km) || 0;
    if (matchedSetting.qty10km) overallDistances['10'] = Number(matchedSetting.qty10km) || 0;
    if (matchedSetting.qty21km) overallDistances['21'] = Number(matchedSetting.qty21km) || 0;
    if (matchedSetting.qty42km) overallDistances['42'] = Number(matchedSetting.qty42km) || 0;
  }

  return {
    status: "success",
    query: trimmed,
    groups,
    groupSetting: matchedSetting,
    stats: {
      totalGroupsFound: 1,
      totalMembersFound: totalMembers,
      totalAmount,
      distances: overallDistances,
      genders: overallGenders
    }
  };
}

