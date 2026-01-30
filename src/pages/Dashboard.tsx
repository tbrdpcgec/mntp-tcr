import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import * as XLSX from 'xlsx';
import CustomSelect from '../components/CustomSelect';

import { PieChart, Pie, Cell, Tooltip, Legend, Label } from 'recharts';

const LOCATIONS = ['AWAITING', 'INCOMING', 'WIP', 'FSB', 'RELEASE'];
const DOC_TYPES = ['DN', 'JC', 'MDR', 'PDS'];
const PLNTWKCNTR = ['CGK', 'GAH1', 'GAH2', 'GAH3', 'GAH4', 'WSSR', 'WSST'];

type Row = {
  id: string;
  [key: string]: any;
};

const DOC_STATUS_OPTIONS = [
  '🔴NEED WO',
  '🟡WAITING INSP',
  '🟡EVALUATED',
  '🟡CONTACT OEM',
  '🟡DEPLOYED',
  '🟡COMPLETING DOC',
  '🟢COMPLETED',
  '🟢SCANNED',
];

// Array status doc_status
const docStatusList = [
  '🔴NEED WO',
  '🟡WAITING INSP',
  '🟡EVALUATED',
  '🟡CONTACT OEM',
  '🟡DEPLOYED',
  '🟡COMPLETING DOC',
  '🟢COMPLETED',
  '🟢SCANNED',
];
// Warna berbeda untuk setiap status (sesuai emoji)
const docStatusColors = [
  '#ef4444', // 🔴
  '#dc2626',
  '#22c55e', // 🟢
  '#16a34a',
  '#facc15', // 🟡
  '#eab308',
  '#fbbf24',
  '#fde047',
  '#fcd34d',
  '#fbbf24',
  '#f59e0b',
  '#3b82f6', // 🔘
  '#2563eb',
  '#60a5fa',
  '#93c5fd',
  '#6366f1',
  '#818cf8',
];

const columnWidths: Record<string, string> = {
  ac_reg: 'min-w-[200px]',
  description: 'min-w-[350px]',
  order: 'min-w-[70px]',
  location: 'min-w-[00px]',
  doc_type: 'min-w-[50px]',
  plntwkcntr: 'min-w-[0px]',
  date_in: 'min-w-[80px]',
  doc_status: 'min-w-[30px]',
  pn: 'min-w-[80px]',
  sn: 'min-w-[80px]',
  type_ac: 'min-w-[80px]',
  category: 'min-w-[100px]',
  priority: 'min-w-[00px]',
  status_pe: 'min-w-[0px]',
  cek_sm4: 'min-w-[50px]',
  cek_cs4: 'min-w-[50px]',
  cek_sm1: 'min-w-[50px]',
  cek_cs1: 'min-w-[50px]',
  cek_mw: 'min-w-[50px]',
  remark_pro: 'min-w-[200px]',
  nd: 'min-w-[0px]',
  tjo: 'min-w-[0px]',
  other: 'min-w-[0px]',
  status_job: 'min-w-[00px]',
  remark: 'min-w-[200px]',
  sp: 'min-w-[120px]',
  loc_doc: 'min-w-[0px]',
  date_out: 'min-w-[0px]',

  tracking_sp: 'min-w-[300px]',
  link_scan: 'max-w-[300px]',
};

const COLUMN_ORDER: { key: string; label: string }[] = [
  { key: 'no', label: 'No' },
  { key: 'doc_type', label: 'Doc' },
  { key: 'order', label: 'Order' },
  { key: 'description', label: 'Description' },
  { key: 'ac_reg', label: 'A/C Reg' },
  { key: 'type_ac', label: 'Type A/C' },
  { key: 'pn', label: 'P/N' },
  { key: 'sn', label: 'S/N' },
  { key: 'category', label: 'Category' },
  { key: 'shop', label: 'Shop' },
  { key: 'location', label: 'Location' },
  { key: 'date_in', label: 'Date In' },
  { key: 'priority', label: 'Priority' },
  { key: 'doc_status', label: 'Doc Status' },
  { key: 'remark_mat', label: 'Material' },

  { key: 'status_job', label: 'Status Job' },
  { key: 'remark', label: 'Remark' },
  { key: 'remark_pro', label: 'Remark from Shop' },

  { key: 'est_date', label: 'Est Finish' },
  { key: 'remark_bdp', label: 'Remark BDP' },

  { key: 'tracking_sp', label: 'Tracking SP' },
  { key: 'link_scan', label: 'Link Scanned' },
];

type ToggleProps = {
  value: boolean; // true jika ON (diklik ke kanan)
  onClick: () => void;
  color: string; // 'gray', 'red', 'yellow', 'green'
};

const ToggleSwitch: React.FC<ToggleProps> = ({ value, onClick, color }) => {
  const bgClass = value
    ? color === 'green'
      ? 'bg-green-500'
      : color === 'yellow'
      ? 'bg-yellow-400'
      : color === 'red'
      ? 'bg-red-500'
      : color === 'blue'
      ? 'bg-blue-500'
      : 'bg-gray-300'
    : 'bg-gray-300'; // ❗ OFF = selalu abu-abu

  return (
    <div
      onClick={onClick}
      className={`w-8 h-4 flex items-center rounded-full cursor-pointer p-0.5 transition-colors mx-auto ${bgClass}`}
    >
      <div
        className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform ${
          value ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </div>
  );
};

// Daftar kolom yang pakai badge warna
const STATUS_COLUMNS = [
  'status_job',
  'status_sm1',
  'status_cs1',
  'status_mw',
  'status_sm4',
  'status_cs4',
  'nd',
  'tjo',
  'other',
];

const formatDateToDDMMMYYYY = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, '0');
  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

const FILTERED_PLNTWKCNTR = [
  'CGK',
  'GAH1',
  'GAH2',
  'GAH3',
  'GAH4',
  'WSSR',
  'WSST',
];

const sortOptions = [
  { value: 'ac_reg', label: 'A/C Reg' },
  { value: 'order', label: 'Order' },
  { value: 'description', label: 'Description' },
  { value: 'location', label: 'Location' },
  { value: 'doc_type', label: 'Doc' },
  { value: 'date_in', label: 'Date In' },
  { value: 'doc_status', label: 'Doc Status' },
  { value: 'plntwkcntr', label: 'Plntwkcntr' },
];

type OrderFilter = {
  value: string;
  valid: boolean;
};

export default function BUSH4() {
  const [rows, setRows] = useState<Row[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAcRegs, setFilterAcRegs] = useState<string[]>([]);
  const [filterAcInput, setFilterAcInput] = useState('');

  const [filterOrder, setFilterOrder] = useState('');
  const [filterDocStatus, setFilterDocStatus] = useState('');
  const [filterStatusJob, setFilterStatusJob] = useState('');
  const [filterBase, setFilterBase] = useState('');
  const [filterPriority, setFilterPriority] = useState('All');
  const [filterLocation, setFilterLocation] = useState('');

  const [priorityData, setPriorityData] = useState<any[]>([]);
  const [filterW, setFilterW] = useState('');

  const [sortKey, setSortKey] = useState('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [showCheckboxColumn, setShowCheckboxColumn] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [activePn, setActivePn] = useState<string[]>([]);

  const [projectRows, setProjectRows] = useState<any[]>([]);
  const [abmpRows, setAbmpRows] = useState<any[]>([]);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<null | (() => void)>(null);
  const today = new Date();
  const [showOnlyChecked, setShowOnlyChecked] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 30;

  // filter ac reg
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filterOrders, setFilterOrders] = useState<
    { value: string; valid: boolean }[]
  >([]);
  const [orderInput, setOrderInput] = useState('');
  const [orderSuggestions, setOrderSuggestions] = useState<string[]>([]);
  const [activeRow, setActiveRow] = useState(null);

  const [showOrderSuggestions, setShowOrderSuggestions] = useState(false);
  const [expandedPn, setExpandedPn] = useState<string[]>([]);
  const [isScreenshot, setIsScreenshot] = useState(false);

  useEffect(() => {
    if (orderInput.trim() === '') {
      setOrderSuggestions([]);
      return;
    }

    const uniqueOrders = Array.from(new Set(rows.map((r) => String(r.order))));

    const filtered = uniqueOrders.filter((ord) =>
      ord.toLowerCase().includes(orderInput.toLowerCase())
    );

    setOrderSuggestions(filtered.slice(0, 10)); // batasi max 10
  }, [orderInput, rows]);

  // 🔹 🔥 RESET PAGE SAAT FILTER BERUBAH (INI WAJIB)
  useEffect(() => {
    setCurrentPage(1);
  }, [
    filterAcRegs,
    filterOrders,
    filterPriority,
    filterDocStatus,
    filterStatusJob,
    filterW,
    searchTerm,
  ]);

  useEffect(() => {
    setSearchTerm('');
  }, [filterAcRegs]);

  const handleAddOrder = (order: string) => {
    const normalized = String(order).trim();
    if (normalized === '') return;

    const alreadyExist = filterOrders.some((o) => o.value === normalized);
    if (alreadyExist) return;

    // ✅ cek valid atau tidak
    const isValid = rows.some((r) => String(r.order) === normalized);

    setFilterOrders((prev) => [...prev, { value: normalized, valid: isValid }]);
    setOrderInput('');
    setShowOrderSuggestions(false);
  };

  const handleRemoveOrder = (order: string) => {
    setFilterOrders(filterOrders.filter((o) => o.value !== order));
  };

  // Ambil unique A/C Reg dari rows
  const uniqueAcRegs = [
    ...new Set(rows.map((r) => r.ac_reg).filter(Boolean)),
  ].sort((a, b) => a.localeCompare(b));

  // Filter opsi berdasarkan input
  const filteredOptions = uniqueAcRegs.filter((reg) =>
    reg.toLowerCase().includes(filterAcInput.toLowerCase())
  );

  //////

  const confirmAction = (action: () => void) => {
    setPendingAction(() => action);
    setShowConfirmModal(true);
  };

  const handleAction = async (action: 'copy' | 'save') => {
    if (selectedRows.length === 0) {
      setNotification('❗ No rows selected.');
      setShowMenu(false);
      return;
    }

    switch (action) {
      case 'copy':
        const selectedData = rows
          .filter((row) => selectedRows.includes(row.id))
          .map((row) => [
            row.ac_reg,
            row.order,
            row.description,
            row.doc_status,
            row.status_job,
            row.remark,
            row.loc_doc,
          ])
          .map((fields) => fields.join('\t'))
          .join('\n');

        navigator.clipboard
          .writeText(selectedData)
          .then(() => setNotification('✅ Data copied to clipboard!'))
          .catch(() => setNotification('❌ Failed to copy to clipboard.'));
        break;

      case 'save':
        const selectedForExport = rows
          .filter((row) => selectedRows.includes(row.id))
          .map((row, index) => ({
            No: index + 1,
            'A/C Reg': row.ac_reg,
            Order: row.order,
            Description: row.description,
            'Doc Status': row.doc_status,
            'Status Job': row.status_job,
            Remark: row.remark,
            SP: row.sp,
            'Loc Doc/Part': row.loc_doc,
          }));

        if (selectedForExport.length === 0) {
          setNotification('❗ No data to export.');
          break;
        }

        const worksheet = XLSX.utils.json_to_sheet(selectedForExport);
        const workbook = XLSX.utils.book_new();
        const today = new Date();
        const formattedDate = today.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });

        const sheetName = `Dashboard MNTP ${formattedDate}`;
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
        XLSX.writeFile(workbook, `Dashboard_MNTP_${formattedDate}.xlsx`);
        setNotification('✅ Data exported as Excel file!');
        break;
    }

    setShowMenu(false);
    setSelectedRows([]);
    setTimeout(() => setNotification(null), 2500);
  };

  const handleActionWithConfirmation = (action: 'copy' | 'save') => {
    if (selectedRows.length === 0) {
      setNotification('❗ No rows selected.');
      setShowMenu(false);
      return;
    }

    const confirmMessages: Record<typeof action, string> = {
      copy: 'Are you sure you want to copy the selected rows?',
      save: 'Are you sure you want to export the selected rows?',
    };

    setPendingAction(() => () => handleAction(action));
    setConfirmMessage(confirmMessages[action]); // ← inject message
    setShowConfirmModal(true); // show modal
    setShowMenu(false); // close dropdown
  };

  useEffect(() => {
    if (notification) {
      const handleClickOutside = () => {
        setNotification(null);
      };

      // Tambahkan listener saat notifikasi muncul
      window.addEventListener('mousedown', handleClickOutside);

      // Bersihkan listener saat notifikasi hilang
      return () => {
        window.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [notification]);

  const [editingCell, setEditingCell] = useState<{
    id: string;
    field: string;
  } | null>(null);

  const STATUS_JOB_ORDER: Record<string, number> = {
    open: 1,
    progress: 2,
    closed: 3,
  };

  //ini use
  useEffect(() => {
    const fetchData = async () => {
      let allRows: any[] = [];
      let from = 0;
      const limit = 1000;
      let moreData = true;

      while (moreData) {
        const { data, error } = await supabase
          .from('v_project_with_rts_unique')
          .select('*')
          .eq('archived', false)
          .order('date_in', { ascending: false })
          .range(from, from + limit - 1); // ambil per 1000

        if (error) {
          console.error('Error fetching data:', error);
          break;
        }

        if (data && data.length > 0) {
          allRows = [...allRows, ...data];
          from += limit;
          if (data.length < limit) {
            moreData = false; // sudah habis
          }
        } else {
          moreData = false;
        }
      }

      setRows(allRows);

      // 🔽 Tambahan: filter hanya priority "High"
      const highPriority = allRows
        .filter((row) => row.priority === 'High')
        .sort((a, b) => {
          const today = new Date().setHours(0, 0, 0, 0);
          const aRts = a.rts ? new Date(a.rts).setHours(0, 0, 0, 0) : null;
          const bRts = b.rts ? new Date(b.rts).setHours(0, 0, 0, 0) : null;

          // 1️⃣ RTS kosong → paling bawah
          if (!aRts && !bRts) {
            /* lanjut ke status_job */
          } else if (!aRts) return 1;
          else if (!bRts) return -1;
          else {
            const diffA = aRts - today;
            const diffB = bRts - today;

            const aExpired = diffA < 0;
            const bExpired = diffB < 0;

            // 2️⃣ RTS expired → paling bawah
            if (aExpired !== bExpired) return aExpired ? 1 : -1;

            // 3️⃣ RTS valid → urut terdekat
            if (diffA !== diffB) return diffA - diffB;
          }

          // 4️⃣ Status job fallback → Open → Progress → Closed
          const statusA = STATUS_JOB_ORDER[a.status_job.toLowerCase()] ?? 99;
          const statusB = STATUS_JOB_ORDER[b.status_job.toLowerCase()] ?? 99;
          return statusA - statusB;
        });

      setPriorityData(highPriority);
    };

    fetchData();
  }, []);

  ///rev2 rts urut

  const getRtsDistance = (rts?: string) => {
    if (!rts) return Number.MAX_SAFE_INTEGER;
    const today = new Date();
    return Math.abs(new Date(rts).getTime() - today.getTime());
  };

  console.log('filterAcRegs:', filterAcRegs);

  /////row raw
  const rawRows = rows;

  const filteredRows = rows
    .filter((row) => {
      if (showOnlyChecked && !selectedRows.includes(row.id)) return false;

      // khusus filter order multiple
      const matchesOrder =
        filterOrders.length === 0 ||
        filterOrders.some((o) => o.value === String(row.order));

      // ❌ filter PN yang TIDAK boleh tampil
      const blockedPnPrefixes = ['141A4810-', 'D53132010000'];

      const matchesPn = !blockedPnPrefixes.some((pn) =>
        (row.pn || '').includes(pn)
      );

      const matchesSearch = Object.values(row)
        .join(' ')
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      const matchesAcReg =
        filterAcRegs.length === 0 || filterAcRegs.includes(row.ac_reg);

      const matchesPriority =
        filterPriority === 'All' ? true : row.priority === filterPriority;
      const matchesDocStatus =
        filterDocStatus === '' || row.doc_status === filterDocStatus;
      const matchesStatusJob =
        filterStatusJob === ''
          ? true
          : filterStatusJob === 'OPEN_PROGRESS'
          ? ['OPEN', 'PROGRESS'].includes((row.status_job || '').toUpperCase())
          : (row.status_job || '').toUpperCase() === filterStatusJob;
      const matchesLocation =
        filterLocation === ''
          ? true
          : filterLocation === 'wip_fsb'
          ? ['wip', 'fsb'].includes((row.location || '').toLowerCase())
          : (row.location || '').toLowerCase() === filterLocation;

      // ✅ tambahan filter untuk W301–W305
      const matchesW =
        filterW === ''
          ? true
          : filterW === 'W301'
          ? !!row.cek_sm1
          : filterW === 'W302'
          ? !!row.cek_cs1
          : filterW === 'W303'
          ? !!row.cek_mw
          : filterW === 'W304'
          ? !!row.cek_sm4
          : filterW === 'W305'
          ? !!row.cek_cs4
          : true;

      // ✅ Tambahan filter Base

      return (
        matchesOrder &&
        matchesSearch &&
        matchesAcReg &&
        matchesDocStatus &&
        matchesStatusJob &&
        matchesW &&
        matchesPriority &&
        matchesPn &&
        matchesLocation
      );
    })

    .sort((a, b) => {
      if (!sortKey) {
        const today = new Date().setHours(0, 0, 0, 0);
        const aRts = a.rts ? new Date(a.rts).setHours(0, 0, 0, 0) : null;
        const bRts = b.rts ? new Date(b.rts).setHours(0, 0, 0, 0) : null;

        // 1️⃣ RTS kosong → paling bawah
        if (!aRts && !bRts) {
          // lanjut ke status_job
        } else if (!aRts) {
          return 1;
        } else if (!bRts) {
          return -1;
        } else {
          const diffA = aRts - today;
          const diffB = bRts - today;

          const aExpired = diffA < 0;
          const bExpired = diffB < 0;

          // 2️⃣ RTS expired → paling bawah
          if (aExpired !== bExpired) return aExpired ? 1 : -1;

          // 3️⃣ RTS valid → urut terdekat
          if (diffA !== diffB) return diffA - diffB;
        }

        // 4️⃣ STATUS_JOB selalu sebagai fallback
        const statusA = STATUS_JOB_ORDER[a.status_job.toLowerCase()] ?? 99;
        const statusB = STATUS_JOB_ORDER[b.status_job.toLowerCase()] ?? 99;

        return statusA - statusB;
      }

      // USER SORT
      const aVal = a[sortKey] ?? '';
      const bVal = b[sortKey] ?? '';

      if (sortKey.includes('date')) {
        return sortDirection === 'asc'
          ? new Date(aVal).getTime() - new Date(bVal).getTime()
          : new Date(bVal).getTime() - new Date(aVal).getTime();
      }

      if (!isNaN(Number(aVal)) && !isNaN(Number(bVal))) {
        return sortDirection === 'asc'
          ? Number(aVal) - Number(bVal)
          : Number(bVal) - Number(aVal);
      }

      return sortDirection === 'asc'
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });

  // helper kecil (opsional) untuk memastikan cek_sm1 benar-benar terdeteksi
  const isChecked = (v: any) => {
    // sesuaikan kalau cek_sm1 bisa jadi '1'/'0' atau 'Y'/'N'
    return (
      v === true ||
      v === 1 ||
      v === '1' ||
      String(v).toLowerCase() === 'true' ||
      !!v
    );
  };

  // helper untuk normalisasi status
  const getStatus = (s: any) =>
    String(s ?? '')
      .trim()
      .toUpperCase();

  ///togle
  const toggleSelectRow = (id: string) => {
    setSelectedRows((prevSelected) =>
      prevSelected.includes(id)
        ? prevSelected.filter((rowId) => rowId !== id)
        : [...prevSelected, id]
    );
  };

  const totalPages = Math.ceil(filteredRows.length / rowsPerPage);
  const paginatedRows = filteredRows.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // Hitung jumlah masing-masing doc_status dari filteredRows
  const docStatusCounts = docStatusList.map((status) => ({
    name: status,
    value: filteredRows.filter((r) => r.doc_status === status).length,
    color: docStatusColors[docStatusList.indexOf(status)] || '#9ca3af',
  }));

  // Total dari filteredRows
  const totalDocStatus = docStatusCounts.reduce(
    (acc, item) => acc + item.value,
    0
  );

  ///////////////

  ///////////////////
  const ALLOWED_REMARKS = [
    'WAITING REMOVE',
    'WAITING MATERIAL',
    'EVALUATED',
    'NOT PRINTED YET',
    'CONTACT OEM',
    'HOLD',
    'RESTAMP',
    'REVISION',
    'DONE BY SOA',
    'REPLACE',
    'COVER BY',
    'ROBBING',
  ];

  const remarkCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    // pastikan semua remark muncul walau 0
    ALLOWED_REMARKS.forEach((r) => {
      counts[r] = 0;
    });

    // ⚠️ PENTING: pakai rows, BUKAN displayedRows / filteredRowsUI
    rows.forEach((row) => {
      const rawRemark = (row.remark || '').toUpperCase();

      ALLOWED_REMARKS.forEach((allowed) => {
        if (rawRemark.includes(allowed)) {
          counts[allowed] += 1;
        }
      });
    });

    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
    }));
  }, [rows]);

  const totalRemark = remarkCounts.reduce((acc, d) => acc + d.value, 0);

  ///////

  /////////////

  const pnList = [
    {
      label: '141A4810-*',
      match: '141A4810-',
      typeAc: 'A320',
      category: 'WINDOW',
      description: 'WINDSHIELD ASSY',
      shop: 'SHEETMETAL',
      safetyStock: 2,
      nextFsb: 'FSB-01234', // optional, bisa '-'
    },
    {
      label: 'D53132010000',
      match: 'D53132010000',
      typeAc: 'A320',
      category: 'RADOME',
      description: 'NOSE RADOME',
      shop: 'COMPOSITE',
      safetyStock: 2,
      nextFsb: '-',
    },
  ];

  //plan fsb
  const getNextFsb = (rows, pnMatch) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // ambil data yg valid
    const futureRows = rows
      .filter(
        (r) =>
          r.doc_type === 'PDS' &&
          r.pn?.includes(pnMatch) &&
          r.est_date &&
          !r.archived
      )
      .map((r) => ({
        ...r,
        est: new Date(r.est_date),
      }))
      .filter((r) => r.est >= today);

    if (futureRows.length === 0) return null;

    // cari tanggal terdekat
    const nearestDate = futureRows
      .map((r) => r.est.getTime())
      .sort((a, b) => a - b)[0];

    // hitung qty di tanggal tsb
    const qty = futureRows.filter(
      (r) => r.est.getTime() === nearestDate
    ).length;

    return {
      qty,
      date: new Date(nearestDate).toISOString().split('T')[0],
    };
  };
  /////////////
  const rotableSummary = pnList.map((pn) => {
    const rows = rawRows.filter(
      (r) =>
        r.doc_type === 'PDS' && r.archived === false && r.pn?.includes(pn.match)
    );

    const remain = rows.filter((r) => r.location === 'OUTGOING').length;
    const wip = rows.filter((r) =>
      ['DEPLOYED', 'INCOMING'].includes(r.location)
    ).length;
    const incoming = rows.filter((r) => r.location === 'INCOMING').length;

    // =========================
    // NEXT FSB LOGIC
    // =========================
    const fsbRows = rows
      .filter((r) => r.est_date) // pastikan ada tanggal
      .map((r) => ({
        ...r,
        estDateObj: new Date(r.est_date),
      }))
      .filter((r) => r.estDateObj >= today) // hanya yang >= hari ini
      .sort((a, b) => a.estDateObj.getTime() - b.estDateObj.getTime());

    let nextFsbQty = 0;
    let nextFsbDate: string | null = null;

    if (fsbRows.length > 0) {
      const nearestDate = fsbRows[0].estDateObj.getTime();

      const sameDateRows = fsbRows.filter(
        (r) => r.estDateObj.getTime() === nearestDate
      );

      nextFsbQty = sameDateRows.length;
      nextFsbDate = formatDateToDDMMMYYYY(sameDateRows[0].estDateObj);
    }

    return {
      ...pn, // typeAc, category, description, shop, safetyStock
      rows,
      remain,
      wip,
      incoming,

      // ⬇️ NEXT FSB RESULT
      nextFsbQty,
      nextFsbDate,
    };
  });

  //toglepn rotable
  const togglePn = (pn: string) => {
    setExpandedPn(
      (prev) =>
        prev.includes(pn)
          ? prev.filter((p) => p !== pn) // collapse
          : [...prev, pn] // expand
    );
  };

  //status stoc
  // status stock
  const getStockStatus = (remain: number, safety: number) => {
    // 1️⃣ jika benar-benar habis
    if (remain === 0) {
      return { label: 'NIL', color: 'text-red-600 bg-red-200' };
    }

    // 2️⃣ stok ada tapi di bawah safety
    if (remain < safety) {
      return { label: 'CRITICAL', color: 'text-yellow-600 bg-yellow-100' };
    }

    // 3️⃣ stok aman
    return { label: 'SAFE', color: 'text-green-700 bg-green-100' };
  };

  ////blok pn
  const projectSummary = useMemo(() => {
    if (!rawRows?.length) return [];

    const uniqAcReg = Array.from(
      new Set(rawRows.map((r) => r.ac_reg).filter(Boolean))
    );

    return uniqAcReg.map((acReg, index) => {
      const rowsByAc = rawRows.filter((r) => r.ac_reg === acReg);

      const open = rowsByAc.filter((r) => r.status_job === 'OPEN').length;
      const progress = rowsByAc.filter(
        (r) => r.status_job === 'PROGRESS'
      ).length;
      const closed = rowsByAc.filter((r) => r.status_job === 'CLOSED').length;

      const totalOrder = open + progress + closed;

      // ✅ RTS langsung dari VIEW (mntp_tcr_view)
      const rts = rowsByAc[0]?.rts ?? '-';

      return {
        no: index + 1,
        acReg,
        open,
        progress,
        closed,
        totalOrder,
        rts,
      };
    });
  }, [rawRows]);

  ////remaindays
  const getRemainDays = (dateStr: string) => {
    if (!dateStr) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const rtsDate = new Date(dateStr);
    if (isNaN(rtsDate.getTime())) return null;

    rtsDate.setHours(0, 0, 0, 0);

    const diffTime = rtsDate.getTime() - today.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  ////filter ac

  const acRegSuggestions = useMemo(() => {
    return Array.from(new Set(rows.map((r) => r.ac_reg).filter(Boolean)));
  }, [rows]);

  ////  sortir ac reg
  const sortedProjectSummary = [...projectSummary].sort((a, b) => {
    const ra = getRemainDays(a.rts);
    const rb = getRemainDays(b.rts);

    // null → paling bawah
    if (ra === null && rb === null) return 0;
    if (ra === null) return 1;
    if (rb === null) return -1;

    // overdue (<= -1) → paling bawah
    if (ra <= -1 && rb <= -1) return 0;
    if (ra <= -1) return 1;
    if (rb <= -1) return -1;

    // sisanya (0,1,2,...) urut naik
    return ra - rb;
  });

  /////ini return
  return (
    <div className="bg-[#141414] w-full h-full">
      <div className="bg-[#292929] px-3 pt-3 pb-6 max-h-[350vh] overflow-hidden w-full rounded-lg ">
        {/* ROTABLE COMPONENT SUMMARY */}
        <div className="rounded-[10px] shadow w-full overflow-x-auto mb-2">
          <div className="bg-[#00838f] sticky top-0 z-20  text-white text-sm font-bold text-center py-2">
            ROTABLE COMPONENT SUMMARY
          </div>

          <div className="min-w-[1200px] flex flex-col">
            {/* HEADER TABLE */}
            <div className="grid grid-cols-11 min-w-[1200px]  whitespace-normal break-words text-center text-xs font-bold text-white border-t border-gray-400 bg-[#607d8b]">
              <div className="border-r border-gray-400 py-2 border-r border-gray-300">
                TYPE A/C
              </div>
              <div className="border-r border-gray-400  py-2 border-r border-gray-300">
                P/N
              </div>
              <div className="border-r border-gray-400  py-2 border-r border-gray-300">
                CATEGORY
              </div>
              <div className="border-r border-gray-400  py-2 border-r border-gray-300">
                DESCRIPTION
              </div>
              <div className="border-r border-gray-400  py-2 border-r border-gray-300">
                SHOP
              </div>

              <div className="border-r border-gray-400  py-2 border-r border-gray-300">
                REMAIN STOCK
              </div>
              <div className="border-r border-gray-400  py-2 border-r border-gray-300">
                SAFETY STOCK
              </div>
              <div className="border-r border-gray-400  py-2 border-r border-gray-300">
                STATUS STOCK
              </div>
              <div className="border-r border-gray-400  py-2 border-r border-gray-300">
                WIP
              </div>
              <div className="border-r border-gray-400  py-2 border-r border-gray-300">
                INCOMING
              </div>
              <div className="py-2">NEXT FSB</div>
            </div>

            {/* ROWS */}
            {rotableSummary.map((row) => (
              <div key={row.label}>
                {/* SUMMARY ROW */}
                <div
                  onClick={() => togglePn(row.label)}
                  className="grid grid-cols-11 min-w-[1200px]  text-xs border-t bg-white cursor-pointer hover:bg-slate-200"
                >
                  {/* TYPE A/C */}
                  <div className="border-r px-2 py-2 text-center whitespace-normal break-words">
                    {row.typeAc}
                  </div>

                  {/* PN */}
                  <div className="border-r px-2 py-2 font-bold text-blue-600 text-center whitespace-normal break-words">
                    {row.label}
                  </div>

                  {/* CATEGORY */}
                  <div className="border-r px-2 py-2 text-center whitespace-normal break-words">
                    {row.category}
                  </div>

                  {/* DESCRIPTION */}
                  <div className="border-r px-2 py-2 text-center whitespace-normal break-words">
                    {row.description}
                  </div>

                  {/* SHOP */}
                  <div className="border-r px-2 py-2 text-center whitespace-normal break-words">
                    {row.shop}
                  </div>

                  {/* REMAIN */}
                  <div
                    className={`border-r px-2 py-2 font-bold text-center ${
                      row.remain < row.safetyStock
                        ? 'text-red-600'
                        : 'text-blue-600'
                    }`}
                  >
                    {row.remain} EA
                  </div>

                  {/* SAFETY */}
                  <div className="border-r px-2 py-2 font-bold text-center">
                    {row.safetyStock} EA
                  </div>

                  {/* STATUS */}
                  {(() => {
                    const status = getStockStatus(row.remain, row.safetyStock);
                    return (
                      <div
                        className={`"border-r px-2 py-2 text-center font-bold whitespace-normal break-words ${status.color}`}
                      >
                        {status.label}
                      </div>
                    );
                  })()}

                  {/* WIP */}
                  <div className="border-r px-2 py-2 font-bold text-center">
                    {row.wip} EA
                  </div>

                  {/* INCOMING */}
                  <div className="border-r px-2 py-2 font-bold text-center">
                    {row.incoming} EA
                  </div>

                  {/* NEXT FSB */}
                  <div className="flex flex-col items-center justify-center font-bold ">
                    {row.nextFsbQty > 0 ? (
                      <>
                        <span>{row.nextFsbQty} EA</span>
                        <span className="text-xs text-gray-700 ">
                          {row.nextFsbDate}
                        </span>
                      </>
                    ) : (
                      <span className="text-gray-400 text-center">-</span>
                    )}
                  </div>
                </div>
                {/* COLLAPSE DETAIL */}
                {expandedPn.includes(row.label) && (
                  <div className="bg-gray-50 border-b px-2 py-2">
                    <div className="bg-white border border-gray-500 rounded-md text-xs overflow-hidden">
                      {/* HEADER */}
                      <div className="grid grid-cols-12 bg-[#607d8b] font-bold text-white text-center px-2 whitespace-normal break-words">
                        <div className="col-span-3 py-2">DETAIL ALL ITEM</div>
                        <div className="col-span-1  py-2">STATUS ITEM</div>
                        <div className="col-span-1 py-2">STATUS DOC</div>
                        <div className="col-span-1  py-2">STATUS BDP</div>
                        <div className="col-span-1  py-2">STATUS JOB</div>
                        <div className="col-span-1  py-2">PLAN FSB</div>
                        <div className="col-span-3 py-2">REMARK</div>
                      </div>

                      {/* ROWS */}
                      {(() => {
                        // 1️⃣ SORT: FSB (OUTGOING) dulu, lalu WIP
                        const sortedRows = [...row.rows].sort((a, b) => {
                          const getPriority = (loc) => {
                            if (loc === 'FSB') return 0; // FSB
                            if (loc === 'WIP' || loc === 'INCOMING') return 1; // WIP
                            return 2;
                          };
                          return (
                            getPriority(a.location) - getPriority(b.location)
                          );
                        });

                        return (
                          <ul className="divide-y divide-gray-300 bg-slate-50">
                            {sortedRows.map((r) => {
                              // 2️⃣ STATUS COMP
                              const statusComp =
                                r.location === 'FSB'
                                  ? 'FSB'
                                  : r.location === 'INCOMING' ||
                                    r.location === 'WIP'
                                  ? 'WIP'
                                  : '-';

                              return (
                                <li
                                  key={r.id}
                                  className="
              grid grid-cols-12
              px-2 py-2
              text-[11px]
              items-start
              bg-slate-100
              hover:bg-slate-200
              transition-colors
            "
                                >
                                  {/* IDENTIFICATION */}
                                  <div className="col-span-3 flex flex-col gap-0.5">
                                    <span className="font-bold text-blue-600 flex flex-wrap gap-1">
                                      {r.ac_reg || '-'} • {r.order || '-'} •{' '}
                                      {r.pn || '-'} • {r.sn || '-'}
                                    </span>
                                    <span className="text-gray-700 whitespace-normal break-words">
                                      {r.description || '-'}
                                    </span>
                                  </div>

                                  {/* LOCATION */}
                                  <div className="col-span-1 flex items-center justify-center font-bold">
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-white
                  ${
                    r.location === 'FSB'
                      ? 'bg-green-600'
                      : r.location === 'WIP'
                      ? 'bg-yellow-500'
                      : 'bg-gray-400'
                  }`}
                                    >
                                      {r.location || '-'}
                                    </span>
                                  </div>

                                  {/* DOC STATUS */}
                                  <div className="col-span-1 flex items-center justify-center font-bold">
                                    <span
                                      className={`${
                                        r.doc_status === 'OPEN'
                                          ? 'text-red-600'
                                          : r.doc_status === 'PROGRESS'
                                          ? 'text-yellow-600'
                                          : r.doc_status === 'CLOSED'
                                          ? 'text-green-600'
                                          : 'text-gray-600'
                                      }`}
                                    >
                                      {r.doc_status || '-'}
                                    </span>
                                  </div>

                                  {/* STATUS MAT */}
                                  <div className="col-span-1 flex items-center justify-center whitespace-normal break-words text-center">
                                    {r.remark_mat || '-'}
                                  </div>

                                  {/* STATUS JOB */}
                                  <div className="col-span-1 flex items-center justify-center whitespace-normal break-words text-center">
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-white
                  ${
                    r.status_job === 'CLOSED'
                      ? 'bg-green-600'
                      : r.status_job === 'PROGRESS'
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                                    >
                                      {r.status_job || '-'}
                                    </span>
                                  </div>

                                  {/* EST FINISH */}
                                  <div className="col-span-1 flex items-center justify-center whitespace-normal break-words">
                                    {r.est_date
                                      ? formatDateToDDMMMYYYY(
                                          new Date(r.est_date)
                                        )
                                      : '-'}
                                  </div>

                                  {/* REMARK */}
                                  <div className="col-span-3 whitespace-normal break-words text-center">
                                    {r.remark || '-'}
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mb-2 flex items-start gap-2 overflow-hidden">
          {/* Kotak input + chips */}
          <div className="flex flex-wrap gap-1 border border-gray-500 rounded-md px-1 py-1 relative flex-1">
            {filterOrders.map((order) => (
              <span
                key={order.value}
                className={`flex items-center px-2 py-1 rounded-full text-xs ${
                  order.valid
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {order.value}
                <button
                  onClick={() => handleRemoveOrder(order.value)}
                  className="ml-1 text-red-500 hover:text-red-700"
                >
                  ✕
                </button>
              </span>
            ))}

            <input
              type="text"
              value={orderInput}
              onChange={(e) => {
                setOrderInput(e.target.value);
                setShowOrderSuggestions(true);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && orderInput.trim() !== '') {
                  handleAddOrder(orderInput.trim());
                  e.preventDefault();
                }
              }}
              onPaste={(e) => {
                e.preventDefault();
                const pasted = e.clipboardData.getData('text');
                const items = pasted
                  .split(/\s|,|\n/)
                  .map((s) => s.trim())
                  .filter((s) => s !== '');
                items.forEach((item) => handleAddOrder(item));
              }}
              placeholder="Type or paste order no..."
              className="bg-[#292929] text-white text-[11px] rounded-md outline-none px-1 w-full"
            />

            {showOrderSuggestions && orderSuggestions.length > 0 && (
              <ul className="absolute left-0 top-full mt-1 w-full border rounded bg-white shadow max-h-40 overflow-y-auto text-xs z-20">
                {orderSuggestions.map((sug) => (
                  <li
                    key={sug}
                    onClick={() => handleAddOrder(sug)}
                    className="px-2 py-1 hover:bg-blue-100 cursor-pointer"
                  >
                    {sug}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="mb-2 flex flex-wrap gap-1 items-center ">
          <div className="flex items-center ml-0">
            <span className="text-xs font-medium"></span>
            <label className="relative inline-flex items-center cursor-pointer select-none w-11 h-5">
              <input
                type="checkbox"
                checked={showCheckboxColumn}
                onChange={() => setShowCheckboxColumn(!showCheckboxColumn)}
                className="sr-only peer"
              />
              <div className="w-full h-full bg-gray-600 rounded-full peer-checked:bg-blue-600 transition-colors duration-200" />
              <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white border border-gray-300 rounded-full transition-transform duration-200 peer-checked:translate-x-[24px]" />
              <span className="absolute left-1 top-1/2 -translate-y-1/2 text-[10px] text-white font-semibold opacity-0 peer-checked:opacity-100 transition-opacity duration-200">
                ON
              </span>
              <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-white font-semibold opacity-100 peer-checked:opacity-0 transition-opacity duration-200">
                OFF
              </span>
            </label>
          </div>

          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-gray-500 bg-[#292929] text-white rounded-md px-1 py-1 text-[11px] hover:bg-gray-500 shadow flex-1"
          />

          <div className="relative w-[120px] ">
            <input
              type="text"
              value={filterAcInput}
              onChange={(e) => {
                setFilterAcInput(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              placeholder="Filter A/C Reg"
              className="border border-gray-500 bg-[#292929] text-white rounded-md px-1 py-1 text-[11px] w-full shadow hover:bg-gray-500"
            />

            {showSuggestions && (
              <ul className="absolute z-50 bg-white border w-full max-h-40 overflow-y-auto text-[11px] shadow-md rounded">
                <li
                  className="px-2 py-1 hover:bg-gray-100 cursor-pointer"
                  onMouseDown={() => {
                    setFilterAcRegs([]);
                    setFilterAcInput('');
                    setSearchTerm(''); // 🔥 WAJIB
                    setShowSuggestions(false);
                  }}
                >
                  All A/C Reg
                </li>

                {filteredOptions.length === 0 && (
                  <li className="px-2 py-1 text-gray-400">No match</li>
                )}

                {filteredOptions.map((reg) => (
                  <li
                    key={reg}
                    className={`
          px-2 py-1 cursor-pointer hover:bg-blue-100
          ${filterAcRegs.includes(reg) ? 'bg-blue-200 font-bold' : ''}
        `}
                    onMouseDown={() => {
                      setFilterAcRegs((prev) =>
                        prev.includes(reg) ? prev : [...prev, reg]
                      );
                      setFilterAcInput('');
                      setSearchTerm(''); // 🔥 WAJIB
                      setShowSuggestions(false);
                    }}
                  >
                    {reg}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button
            onClick={() => setShowOnlyChecked((prev) => !prev)}
            className="inline-flex justify-center rounded-md border border-gray-500 shadow-sm px-1.5 py-1 bg-[#292929] text-white text-[11px] font-normal  hover:bg-gray-500 "
          >
            {showOnlyChecked ? 'Checked Row' : 'All Row'}
          </button>

          <div className="flex items-center gap-1 ">
            {/* Dropdown Menu */}
            <div className="relative inline-block text-left ml-0 w-[65px]">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="inline-flex justify-center w-full rounded-md border border-gray-500 shadow-sm px-1.5 py-1 bg-[#292929] text-white text-[11px] font-normal hover:bg-gray-500"
              >
                Actions
              </button>

              {showMenu && (
                <div className="absolute z-50 mt-2 w-28 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                  <div className="py-0 text-[11px]">
                    <button
                      onClick={() => handleAction('copy')}
                      className="block w-full text-left px-2 py-1 hover:bg-gray-100"
                    >
                      📋 Copy
                    </button>
                    <button
                      onClick={() => handleActionWithConfirmation('save')}
                      className="block w-full text-left px-2 py-1 hover:bg-gray-100"
                    >
                      💾 Export
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <CustomSelect
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            options={[
              { label: 'All Priority', value: 'All' },
              { label: 'Med', value: 'Med' },
              { label: 'High', value: 'High' },
            ]}
            className="border border-gray-500 rounded-md px-1 py-1 text-[11px] hover:bg-gray-500 shadow w-[100px]"
          />

          <CustomSelect
            value={filterDocStatus}
            onChange={(e) => setFilterDocStatus(e.target.value)}
            options={[
              { label: 'All Doc Status', value: '' },
              ...DOC_STATUS_OPTIONS.map((status) => ({
                label: status,
                value: status,
              })),
            ]}
            className="border border-gray-500 rounded-md px-1 py-1 text-[11px] hover:bg-gray-500 shadow w-[100px]"
          />

          <CustomSelect
            value={filterW}
            onChange={(e) => setFilterW(e.target.value)}
            options={[
              { label: 'All Shop', value: '' },
              { label: 'Sheetmetal', value: 'W301' },
              { label: 'Composite', value: 'W302' },
              { label: 'Seat', value: 'W304' },
              { label: 'Cabin', value: 'W305' },
              { label: 'Machining', value: 'W303' },
            ]}
            className="border border-gray-500 rounded-md px-1 py-1 text-[11px] hover:bg-gray-500 shadow w-[100px]"
          />

          <CustomSelect
            value={filterLocation}
            onChange={(e) => setFilterLocation(e.target.value)}
            options={[
              { label: 'All Item', value: '' },
              { label: 'Awaiting', value: 'awaiting' },
              { label: 'Incoming', value: 'incoming' },
              { label: 'WIP', value: 'wip' },
              { label: 'FSB', value: 'fsb' },
              { label: 'WIP + FSB', value: 'wip_fsb' }, // 👈 tambahan
              { label: 'Release', value: 'release' },
            ]}
            className="border border-gray-500 rounded-md px-1 py-1 text-[11px] hover:bg-gray-500 shadow w-[120px]"
          />

          <CustomSelect
            value={filterStatusJob}
            onChange={(e) => setFilterStatusJob(e.target.value)}
            options={[
              { label: 'All Status Job', value: '' },
              { label: 'OPEN', value: 'OPEN' },
              { label: 'PROGRESS', value: 'PROGRESS' },
              { label: 'OPEN + PROGRESS', value: 'OPEN_PROGRESS' }, // ✅ tambahan
              { label: 'CLOSED', value: 'CLOSED' },
            ]}
            className="border border-gray-500 rounded-md px-1 py-1 text-[11px] hover:bg-gray-500 shadow w-[120px]"
          />

          {/* Sort By */}
          <CustomSelect
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value)}
            options={[
              { label: 'Sort by...', value: '' },
              ...sortOptions.map((option) => ({
                label: option.label,
                value: option.value,
              })),
            ]}
            className="border border-gray-500 rounded-md px-1 py-1 text-[11px] hover:bg-gray-500 shadow w-[100px]"
          />

          {/* Sort Direction */}
          <CustomSelect
            value={sortDirection}
            onChange={(e) => setSortDirection(e.target.value as 'asc' | 'desc')}
            options={[
              { label: 'A-Z', value: 'asc' },
              { label: 'Z-A', value: 'desc' },
            ]}
            className="border border-gray-500 rounded-md px-1 py-1 text-[11px] hover:bg-gray-500 shadow w-[100px]"
          />

          <button
            onClick={() => setIsScreenshot((v) => !v)}
            className="px-3 py-1 text-xs bg-slate-700 text-white rounded hover:bg-slate-600"
          >
            {isScreenshot ? 'Expand' : 'Collapse'}
          </button>
        </div>

        {/* 📊 Status Summary dan Donut Chart */}
        <div className="flex gap-2 w-full items-start mb-3 overflow-hidden">
          {/* ================= PROSUM (KIRI) ================= */}
          <div className="w-[450px] overflow-auto max-h-[80vh]  rounded-lg shadow-inner dark-scroll ">
            <div className="rounded-lg  shadow ">
              <div className="bg-[#00838f] sticky top-0 z-20  text-white text-sm font-bold text-center py-2">
                PROJECT COMPONENT SUMMARY
              </div>

              {/* HEADER */}
              <div className="sticky top-[35px] z-10 h-6 flex items-center justify-center grid grid-cols-[90px_1fr_1fr_1fr_2fr_90px_2fr] text-xs font-bold text-white bg-[#607d8b] text-center">
                <div>A/C</div>
                <div>O</div>
                <div>P</div>
                <div>C</div>
                <div>Total</div>
                <div>RTS</div>
                <div>TAT</div>
              </div>

              {/* ROWS */}
              {sortedProjectSummary.map((row, index) => {
                const remain = getRemainDays(row.rts);

                return (
                  <div
                    key={row.acReg}
                    onClick={() =>
                      setFilterAcRegs((prev) =>
                        prev.includes(row.acReg)
                          ? prev.filter((ac) => ac !== row.acReg)
                          : [...prev, row.acReg]
                      )
                    }
                    className={`
                    grid grid-cols-[90px_1fr_1fr_1fr_2fr_90px_2fr]
                    place-items-center text-xs text-center border-t
                    cursor-pointer transition-colors  h-8 flex items-center justify-center
                  
                    ${
                      filterAcRegs.includes(row.acReg)
                        ? 'bg-teal-200 dark:bg-teal-700'
                        : index % 2 === 0
                        ? 'bg-white dark:bg-slate-800'
                        : 'bg-gray-100 dark:bg-slate-700'
                    }
                  
                    hover:bg-slate-200 dark:hover:bg-slate-600
                  `}
                  >
                    <div className="text-gray-600 font-bold ">{row.acReg}</div>
                    <div className="text-red-600 font-bold ">{row.open}</div>
                    <div className="text-yellow-600 font-bold ">
                      {row.progress}
                    </div>
                    <div className="text-green-600 font-bold ">
                      {row.closed}
                    </div>
                    <div className="text-purple-600 font-bold">
                      {row.totalOrder}
                    </div>
                    <div className="text-gray-600 font-bold ">
                      {row.rts && !isNaN(new Date(row.rts).getTime())
                        ? formatDateToDDMMMYYYY(new Date(row.rts))
                        : '-'}
                    </div>

                    {/* REMAIN */}
                    <div
                      className={
                        remain !== null
                          ? remain < 0
                            ? 'text-red-600 font-bold'
                            : remain <= 3
                            ? 'text-orange-500 font-bold'
                            : 'text-green-600 font-bold '
                          : 'text-gray-400'
                      }
                    >
                      {remain !== null ? remain : '-'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 🧊 Ini pembungkus baru untuk freeze header */}
          <div
            className={`print-area w-full rounded-lg shadow-inner dark-scroll
    ${
      isScreenshot
        ? 'overflow-visible max-h-none'
        : 'overflow-auto max-h-[80vh]'
    }
  `}
          >
            <div className="bg-[#00838f] sticky top-0 z-20  text-white text-sm font-bold text-center py-2">
              PROJECT COMPONENT DETAIL
            </div>

            <table className="w-full table-auto text-[12px] leading-tight">
              <thead
                className={`bg-teal-700 shadow
        ${isScreenshot ? 'static' : 'sticky top-0 z-0'}
      `}
              >
                <tr className="sticky top-[35px] z-10 h-6 bg-[#607d8b] text-white text-xs font-semibold text-center">
                  {/* NO */}
                  <th className=" px-2 py-1 text-center w-[40px]">No</th>

                  {showCheckboxColumn && (
                    <th className="px-1 py-1">
                      <input
                        type="checkbox"
                        checked={
                          selectedRows.length === filteredRows.length &&
                          filteredRows.length > 0
                        }
                        onChange={(e) => {
                          setSelectedRows(
                            e.target.checked
                              ? filteredRows.map((r) => r.id)
                              : []
                          );
                        }}
                      />
                    </th>
                  )}

                  {/* DOC TYPE */}
                  <th className=" px-2 py-1 text-center">Doc</th>
                  <th className=" px-2 py-1 text-center">A/C Reg</th>
                  {/* IDENTIFICATION */}
                  <th className="px-2 py-1 text-left min-w-[440px]">
                    IDENTIFICATION
                  </th>

                  {/* KOLOM LAIN */}
                  <th className="px-1 py-1 ">ITEM</th>
                  <th className="px-1 py-1 min-w-[90px]">SHOP</th>
                  <th className="px-1 py-1  min-w-[100px]">STATUS DOC</th>
                  <th className="px-1 py-1 ">MATERIAL</th>
                  <th className="px-1 py-1  min-w-[90px]">STATUS JOB</th>
                  <th className="px-1 py-1">PLAN FSB</th>
                  <th className="px-1 py-1   min-w-[250px]">REMARK SHOP</th>
                  <th className="px-1 py-1  min-w-[120px]">REMARK PE/PPC</th>
                  <th className="px-1 py-1 min-w-[400px]">TRACKING SHIPMENT</th>
                  <th className="px-1 py-1 min-w-[90px]">LINK SCAN </th>
                  {/* lanjutkan sesuai kebutuhan */}
                </tr>
              </thead>

              <tbody>
                {paginatedRows.map((row, rowIndex) => (
                  <tr
                    key={row.id}
                    onClick={() => setActiveRow(row.id)}
                    className={`
        cursor-pointer
        ${rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-100'}
        hover:bg-slate-200
        ${activeRow === row.id ? 'bg-teal-200' : ''}
        transition-colors
      `}
                  >
                    {/* NO */}
                    <td className="border px-2 py-1 text-center text-xs text-gray-600">
                      {(currentPage - 1) * rowsPerPage + rowIndex + 1}
                    </td>

                    {/* CHECKBOX */}
                    {showCheckboxColumn && (
                      <td className="border px-2 py-1 text-center">
                        <input
                          type="checkbox"
                          checked={selectedRows.includes(row.id)}
                          onChange={() => toggleSelectRow(row.id)}
                        />
                      </td>
                    )}
                    {/* DOC TYPE */}
                    <td className="border px-2 py-1 text-center text-[11px] font-semibold">
                      {row.doc_type || ''}
                    </td>

                    <td className="border px-2 py-1 text-center text-[11px] font-semibold min-w-[70px]">
                      {row.ac_reg || ''}
                    </td>

                    {/* 🔷 IDENTIFICATION (GABUNGAN) */}
                    {/* IDENTIFICATION */}
                    <td className="border px-2 py-1 text-left align-top">
                      <div className="flex flex-col gap-0.5">
                        {/* BARIS 1 */}
                        {(() => {
                          const idLine = [row.order, row.pn, row.sn].filter(
                            Boolean
                          );

                          return (
                            idLine.length > 0 && (
                              <span className="font-bold text-blue-600">
                                {idLine.join(' || ')}
                              </span>
                            )
                          );
                        })()}

                        {/* BARIS 2 */}
                        {row.description && (
                          <span className="text-gray-700 break-words">
                            {row.description}
                          </span>
                        )}

                        {/* BARIS 3 */}
                        {(() => {
                          const metaLine = [row.type_ac, row.category].filter(
                            Boolean
                          );

                          return (
                            metaLine.length > 0 && (
                              <span className="text-[10px] text-gray-500 italic">
                                {metaLine.join(' || ')}
                              </span>
                            )
                          );
                        })()}
                      </div>
                    </td>

                    {/* LOCATION */}
                    <td className="border px-1 py-1 text-center">
                      {row.location || ''}
                    </td>

                    {/* LOCATION */}
                    <td className="border px-1 py-1 text-center">
                      {row.shop || ''}
                    </td>

                    {/* DOC STATUS */}
                    <td className="border px-1 py-1 text-center ">
                      <span
                        className={`px-1 py-0.5 rounded 
            ${
              row.doc_status === 'OPEN'
                ? 'bg-red-500'
                : row.doc_status === 'PROGRESS'
                ? 'bg-yellow-500'
                : row.doc_status === 'CLOSED'
                ? 'bg-green-500'
                : 'bg-transparent'
            }`}
                      >
                        {row.doc_status || ''}
                      </span>
                    </td>

                    {/* MATERIAL */}
                    <td className="border px-1 py-1 text-center">
                      {row.remark_mat || ''}
                    </td>

                    {/* STATUS JOB */}
                    <td className="border px-1 py-1 text-center">
                      <span
                        className={`px-1 py-0.5 rounded text-white
            ${
              row.status_job === 'OPEN'
                ? 'bg-red-500'
                : row.status_job === 'PROGRESS'
                ? 'bg-yellow-500'
                : row.status_job === 'CLOSED'
                ? 'bg-green-500'
                : 'bg-transparent'
            }`}
                      >
                        {row.status_job || ''}
                      </span>
                    </td>

                    <td className="border px-1 py-1 text-center whitespace-nowrap">
                      {row.est_date &&
                        `${formatDateToDDMMMYYYY(new Date(row.est_date))}`}
                    </td>

                    <td className="border px-1 py-1 text-left break-words">
                      {row.remark_pro && `${row.remark_pro}`}
                    </td>

                    <td className="border px-1 py-1 text-left break-words">
                      {row.remark && `${row.remark}`}
                    </td>

                    <td className="border px-1 py-1 text-center break-words">
                      {row.tracking_sp && `${row.tracking_sp}`}
                    </td>
                    <td className="border px-1 py-1 text-center">
                      {row.link_scan && (
                        <a
                          href={row.link_scan}
                          target="blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 underline hover:text-blue-800"
                        >
                          SCAN
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {notification && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
                <div className="bg-white px-6 py-4 rounded shadow-lg text-center text-gray-800 text-sm">
                  {notification}
                </div>
              </div>
            )}

            {showConfirmModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                <div className="bg-white p-6 rounded shadow-md w-[90%] max-w-md">
                  <h2 className="text-lg font-semibold mb-4">Confirmation</h2>
                  <p className="mb-4">{confirmMessage}</p>{' '}
                  {/* ← tampilkan pesan dinamis */}
                  <div className="flex justify-end">
                    <button
                      onClick={() => setShowConfirmModal(false)}
                      className="px-4 py-2 mr-2 text-gray-600 hover:text-gray-800"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={async () => {
                        setShowConfirmModal(false);
                        if (pendingAction) {
                          await pendingAction(); // jalankan aksi
                          setPendingAction(null);
                          setSelectedRows([]); // kosongkan ceklis
                        }
                      }}
                      className="px-4 py-2 bg-red-600 text-white hover:bg-red-700"
                    >
                      Confirm
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-start mt-2 text-white text-[11px] items-center space-x-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-2 py-0.5 rounded border border-gray-500 bg-[#212121] text-white hover:bg-gray-500 shadow"
          >
            ◁ Prev
          </button>

          <span>
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
            className="px-2 py-0.5 rounded border border-gray-500 bg-[#212121] text-white hover:bg-gray-500 shadow"
          >
            Next ▷
          </button>
        </div>
      </div>
    </div>
  );
}
