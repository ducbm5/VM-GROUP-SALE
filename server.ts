import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

const TSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSan91I-1TtCgd1EmdluNJz1WW8R7wCnCXwKz8BA1SaiOCouWBR4_b6rm5YrywWmAr45nPAMHMs4Bd1/pub?gid=0&single=true&output=tsv";
const GROUP_SETTINGS_TSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRHymZVxu0vJMxzbqe0SuqGa2yWPZb6yPRNveitDRPbHja4WduOdwK-G0q9WMPxgaeqVtUpcfj5DRYi/pub?gid=0&single=true&output=tsv";

interface RunnerMember {
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

interface GroupSetting {
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

interface GroupSummary {
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

// In-memory cache for TSV data to ensure super-fast searches and reduce latency
let cachedData: {
  rows: RunnerMember[];
  lastFetched: number;
} | null = null;

let cachedGroupSettings: {
  rows: GroupSetting[];
  lastFetched: number;
} | null = null;

const CACHE_TTL_MS = 60 * 1000; // 1 minute cache

async function fetchAndParseTSV(): Promise<RunnerMember[]> {
  const now = Date.now();
  if (cachedData && (now - cachedData.lastFetched) < CACHE_TTL_MS) {
    return cachedData.rows;
  }

  try {
    const res = await fetch(TSV_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) FinancialTimesData/1.0',
        'Cache-Control': 'no-cache'
      }
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const tsvText = await res.text();
    const lines = tsvText.split(/\r?\n/).filter(line => line.trim().length > 0);

    if (lines.length < 2) {
      return [];
    }

    const rawHeaders = lines[0].split('\t').map(h => h.trim());
    
    // Normalize header index lookup with exact match and exclusion support
    const findHeaderIdx = (patterns: string[], excludePatterns: string[] = []): number => {
      // Pass 1: Exact match first
      for (let i = 0; i < rawHeaders.length; i++) {
        const h = rawHeaders[i].toUpperCase();
        for (const p of patterns) {
          if (h === p.toUpperCase()) {
            return i;
          }
        }
      }
      // Pass 2: Partial match while avoiding excluded words (e.g. GROUP, LEAD)
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

    cachedData = {
      rows,
      lastFetched: Date.now()
    };

    console.log(`[TSV FETCH SUCCESS] Parsed ${rows.length} rows from Member Sheet.`);
    return rows;
  } catch (err) {
    console.error("[TSV FETCH ERROR]", err);
    if (cachedData) return cachedData.rows;
    return [];
  }
}

async function fetchAndParseGroupSettings(): Promise<GroupSetting[]> {
  const now = Date.now();
  if (cachedGroupSettings && (now - cachedGroupSettings.lastFetched) < CACHE_TTL_MS) {
    return cachedGroupSettings.rows;
  }

  try {
    const res = await fetch(GROUP_SETTINGS_TSV_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) FinancialTimesData/1.0',
        'Cache-Control': 'no-cache'
      }
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
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

    console.log(`[GROUP SETTINGS FETCH SUCCESS] Parsed ${rows.length} group settings rows.`);
    return rows;
  } catch (err) {
    console.error("[GROUP SETTINGS FETCH ERROR]", err);
    if (cachedGroupSettings) return cachedGroupSettings.rows;
    return [];
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Endpoint: Verify Page Access Password
  app.post("/api/verify-password", (req, res) => {
    const { password } = req.body || {};
    if (password === "898989") {
      res.json({ success: true, message: "Mật khẩu chính xác." });
    } else {
      res.status(401).json({ success: false, message: "Mật khẩu không chính xác." });
    }
  });

  // API Endpoint: Meta Stats (High level overview without revealing personal data)
  app.get("/api/meta", async (_req, res) => {
    try {
      const [rows, settingRows] = await Promise.all([
        fetchAndParseTSV(),
        fetchAndParseGroupSettings()
      ]);
      const memberGroupIds = rows.map(r => r.idGroup).filter(Boolean);
      const settingGroupIds = settingRows.map(s => s.idGroup).filter(Boolean);
      const uniqueGroupIds = new Set([...memberGroupIds, ...settingGroupIds]);
      const races = Array.from(new Set([
        ...rows.map(r => r.race).filter(Boolean),
        ...settingRows.map(s => s.matchName).filter(Boolean)
      ]));
      
      res.json({
        status: "ok",
        totalRunners: rows.length,
        totalGroups: uniqueGroupIds.size,
        racesList: races,
        lastUpdated: cachedData ? new Date(cachedData.lastFetched).toISOString() : new Date().toISOString()
      });
    } catch (err: any) {
      res.status(500).json({ status: "error", message: err.message });
    }
  });

  // API Endpoint: Search Groups strictly by ID_GROUP
  app.get("/api/search", async (req, res) => {
    try {
      const query = (req.query.q as string || '').trim();
      const exactMatch = req.query.exact === 'true';

      if (!query) {
        return res.json({
          status: "empty",
          query: "",
          groups: [],
          groupSetting: null,
          stats: null,
          message: "Vui lòng nhập mã ID_GROUP (tối thiểu 5 ký tự) để tra cứu."
        });
      }

      // Rule 2: Minimum 5 characters required
      if (query.length < 5) {
        return res.json({
          status: "invalid_length",
          query,
          groups: [],
          groupSetting: null,
          stats: null,
          message: `Mã nhóm (ID_GROUP) cần nhập từ 5 ký tự trở lên. Hiện tại bạn mới nhập ${query.length} ký tự.`
        });
      }

      const [allRows, allSettings] = await Promise.all([
        fetchAndParseTSV(),
        fetchAndParseGroupSettings()
      ]);
      const normalizedQuery = query.toLowerCase();

      // Rule 1: Search strictly by ID_GROUP only (across member rows and group settings)
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
        return res.json({
          status: "not_found",
          query,
          groups: [],
          groupSetting: null,
          stats: null,
          message: `Không tìm thấy nhóm nào có ID_GROUP khớp với mã "${query}".`
        });
      }

      // Rule 3: Always display ONLY 1 group. If more than 1 group matches, return an error!
      if (matchingGroupIds.size > 1) {
        const matchedList = Array.from(matchingGroupIds);
        return res.json({
          status: "multiple_matches",
          query,
          groups: [],
          groupSetting: null,
          stats: null,
          message: `Lỗi: Kết quả tìm kiếm trả về ${matchedList.length} nhóm khác nhau chứa mã "${query}" (ID: ${matchedList.join(', ')}). Hệ thống yêu cầu chỉ hiển thị duy nhất 1 nhóm. Vui lòng nhập chính xác đầy đủ mã ID_GROUP.`
        });
      }

      const targetGroupId = Array.from(matchingGroupIds)[0];
      const targetIdLower = targetGroupId.toLowerCase();

      const matchedRows = allRows.filter(r => (r.idGroup || '').trim().toLowerCase() === targetIdLower);
      const matchedSetting = allSettings.find(s => (s.idGroup || '').trim().toLowerCase() === targetIdLower) || null;

      let groups: GroupSummary[] = [];

      if (matchedRows.length > 0) {
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

      const stats = {
        totalGroupsFound: 1,
        totalMembersFound: totalMembers,
        totalAmount,
        distances: overallDistances,
        genders: overallGenders
      };

      res.json({
        status: "success",
        query,
        groups,
        groupSetting: matchedSetting,
        stats
      });
    } catch (err: any) {
      console.error("[SEARCH ERROR]", err);
      res.status(500).json({ status: "error", message: err.message });
    }
  });

  // Vite middleware for dev or Static serve for prod
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[FT EDITORIAL SERVER] Running on http://localhost:${PORT}`);
  });
}

startServer();
