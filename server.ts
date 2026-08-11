import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

const TSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSdKN4erdH4gZw4QT6q3AjYKZDPdyrXeI0JMQ3zCDafd1M837zHUu31BsmOJNovrsk7PpZ55AmU1NdB/pub?gid=0&single=true&output=tsv";

interface RunnerMember {
  idGroup: string;
  nameGroup: string;
  nameLead: string;
  race: string;
  name: string;
  idPassport: string;
  phNo: string;
  distance: string;
  gender: string;
  txnAmount: number;
  dateCreate: string;
  rawRowIndex: number;
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
    // Column E is NAME (Index 4). Must exclude 'GROUP' and 'LEAD' so it doesn't match NAME_GROUP or NAME_LEAD
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

      // Only include if ID_GROUP or NAME_GROUP exists
      if (row.idGroup || row.nameGroup || row.name) {
        rows.push(row);
      }
    }

    cachedData = {
      rows,
      lastFetched: Date.now()
    };

    console.log(`[TSV FETCH SUCCESS] Parsed ${rows.length} rows from Google Sheet.`);
    return rows;
  } catch (err) {
    console.error("[TSV FETCH ERROR]", err);
    if (cachedData) return cachedData.rows;
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
      const rows = await fetchAndParseTSV();
      const uniqueGroupIds = new Set(rows.map(r => r.idGroup).filter(Boolean));
      const races = Array.from(new Set(rows.map(r => r.race).filter(Boolean)));
      
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
          stats: null,
          message: `Mã nhóm (ID_GROUP) cần nhập từ 5 ký tự trở lên. Hiện tại bạn mới nhập ${query.length} ký tự.`
        });
      }

      const allRows = await fetchAndParseTSV();
      const normalizedQuery = query.toLowerCase();

      // Rule 1: Search strictly by ID_GROUP only (ignore group name / member name)
      const matchedRows = allRows.filter(r => {
        const idG = (r.idGroup || '').trim().toLowerCase();
        if (exactMatch) {
          return idG === normalizedQuery;
        } else {
          return idG.includes(normalizedQuery);
        }
      });

      if (matchedRows.length === 0) {
        return res.json({
          status: "not_found",
          query,
          groups: [],
          stats: null,
          message: `Không tìm thấy nhóm nào có ID_GROUP khớp với mã "${query}".`
        });
      }

      // Group matched rows strictly by ID_GROUP
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

        // Distance breakdown
        const distKey = row.distance || 'Khác';
        groupObj.distances[distKey] = (groupObj.distances[distKey] || 0) + 1;

        // Gender breakdown
        const genKey = row.gender || 'Khác';
        groupObj.genders[genKey] = (groupObj.genders[genKey] || 0) + 1;
      }

      const groups = Array.from(groupMap.values());

      // Rule 3: Always display ONLY 1 group. If more than 1 group matches, return an error!
      if (groups.length > 1) {
        return res.json({
          status: "multiple_matches",
          query,
          groups: [],
          stats: null,
          message: `Lỗi: Kết quả tìm kiếm trả về ${groups.length} nhóm khác nhau chứa mã "${query}" (ID: ${groups.map(g => g.idGroup).join(', ')}). Hệ thống yêu cầu chỉ hiển thị duy nhất 1 nhóm. Vui lòng nhập chính xác đầy đủ mã ID_GROUP.`
        });
      }

      // Single matched group calculation
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
