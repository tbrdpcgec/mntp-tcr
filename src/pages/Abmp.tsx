import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

type AbmpRow = {
  id: number;
  ac_reg: string;
  rts: string;
};

export default function Abmp() {
  const [pdfId, setPdfId] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [tableData, setTableData] = useState<AbmpRow[]>([]);
  const [loadingTable, setLoadingTable] = useState<boolean>(true);
  const [showModal, setShowModal] = useState(false);
  const [rows, setRows] = useState<{ ac_reg: string; rts: string | null }[]>([
    { ac_reg: '', rts: null },
  ]);
  const [activeRow, setActiveRow] = useState<number | null>(null);
  const [editingCell, setEditingCell] = useState<{
    id: string;
    field: string;
  } | null>(null);
  const [tempValue, setTempValue] = useState('');

  ////sortir rts
  const sortedTableData = [...tableData].sort((a, b) => {
    const today = new Date();

    const aDate = a.rts ? new Date(a.rts) : null;
    const bDate = b.rts ? new Date(b.rts) : null;

    // 1️⃣ Jika a kosong / RTS < today, taruh di bawah
    if (!aDate || aDate < today) return 1;
    if (!bDate || bDate < today) return -1;

    // 2️⃣ Jika keduanya valid, urut dari yang paling dekat
    return aDate.getTime() - bDate.getTime();
  });

  const sheetUrl =
    'https://docs.google.com/spreadsheets/d/e/2PACX-1vR87GYwPPCTGhIYZy-7p5SkOYqTaGpBUbbkvZTDRUMqDBOZvnhra6l4_N3O1PwKr2EL2qD9ReOb5Jac/pub?output=csv';

  // ===== FORMAT DATE =====
  const formatDate = (raw: string) => {
    if (!raw) return raw;

    if (!isNaN(Number(raw))) {
      const serial = Number(raw);
      const baseDate = new Date(1899, 11, 30);
      baseDate.setDate(baseDate.getDate() + serial - 1);
      return baseDate
        .toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
        .replace(/ /g, '-');
    }

    const dmMatch = raw.trim().match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (dmMatch) {
      const d = new Date(
        Number(dmMatch[3]),
        Number(dmMatch[2]) - 1,
        Number(dmMatch[1])
      );
      if (!isNaN(d.getTime())) {
        return d
          .toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })
          .replace(/ /g, '-');
      }
    }

    const date = new Date(raw);
    if (!isNaN(date.getTime())) {
      return date
        .toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
        .replace(/ /g, '-');
    }

    return raw;
  };

  // ===== UPDATE PDF FROM GOOGLE SHEET =====
  const handleUpdate = async () => {
    try {
      const res = await fetch(sheetUrl);
      const text = await res.text();
      const rows = text.split('\n').map((r) => r.split(','));
      const lastRow = rows[rows.length - 1];

      if (lastRow && lastRow[2] && lastRow[3]) {
        const dateCol = lastRow[2].trim();
        const pdfCol = lastRow[3].trim();

        setPdfId(pdfCol);
        localStorage.setItem('abmpPdfId', pdfCol);
        setLastUpdate(formatDate(dateCol));

        setMessage('✅ ABMP updated!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('⚠️ Data tidak lengkap di baris terakhir.');
      }
    } catch (err) {
      console.error(err);
      setMessage('❌ Gagal mengambil data dari Google Sheet.');
    }
  };

  // ===== FETCH TABLE FROM SUPABASE =====
  const fetchTable = async () => {
    setLoadingTable(true);
    const { data, error } = await supabase
      .from('abmp')
      .select('id, ac_reg, rts')
      .order('ac_reg', { ascending: true });

    if (!error && data) {
      setTableData(data);
    }
    setLoadingTable(false);
  };

  // ===== INIT =====
  useEffect(() => {
    handleUpdate();
    fetchTable();
  }, []);

  const googleFormUrl = 'https://forms.gle/3KxHarsbBNLpeNE29';
  const pdfUrl = pdfId
    ? `https://drive.google.com/file/d/${pdfId}/preview`
    : null;

  return (
    <div className="p-1 space-y-2">
      {/* ACTION BAR */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowModal(true)}
          className="px-3 py-1 text-sm font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 shadow"
        >
          + Add RTS
        </button>

        <a
          href={googleFormUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-2 py-1 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow"
        >
          Upload ABMP
        </a>

        <button
          onClick={handleUpdate}
          className="px-3 py-1 text-sm font-semibold bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 shadow"
        >
          Update
        </button>

        {lastUpdate && (
          <span className="text-sm text-gray-700">
            Last Update: <strong>{lastUpdate}</strong>
          </span>
        )}

        {message && (
          <span className="text-sm font-medium text-green-700 bg-green-100 px-3 py-1 rounded border border-green-300 shadow-sm">
            {message}
          </span>
        )}
        {showModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-[500px] p-4 space-y-3 shadow-lg">
              <h2 className="text-sm font-bold">Add ABMP Data</h2>

              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-2 py-1">AC REG</th>
                    <th className="border px-2 py-1">RTS</th>
                    <th className="border px-2 py-1 w-10">❌</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <tr key={idx}>
                      <td className="border px-1 py-1">
                        <input
                          value={row.ac_reg}
                          onChange={(e) => {
                            const copy = [...rows];
                            copy[idx].ac_reg = e.target.value.toUpperCase();
                            setRows(copy);
                          }}
                          className="
                          w-full border border-transparent
                          hover:border-teal-500 rounded px-1 py-0.5 text-[11px]
                          text-black bg-white
                        "
                        />
                      </td>

                      <td className="border px-1 py-1">
                        {/* RTS DATE PICKER */}
                        <input
                          type="date"
                          value={row.rts ?? ''}
                          onChange={(e) => {
                            const copy = [...rows];
                            copy[idx].rts = e.target.value || null;
                            setRows(copy);
                          }}
                          className={`
                          border border-transparent rounded-md px-0.5 py-0.5 text-[11px]
                          bg-white hover:border-teal-500
                          ${row.rts ? 'text-black' : 'text-transparent'}
                          [&::-webkit-calendar-picker-indicator]:invert
                        `}
                        />
                      </td>

                      <td className="border text-center">
                        <button
                          onClick={() =>
                            setRows(rows.filter((_, i) => i !== idx))
                          }
                          className="text-red-400 hover:text-red-600"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-between">
                <button
                  onClick={() => setRows([...rows, { ac_reg: '', rts: '' }])}
                  className="text-xs px-2 py-1 bg-blue-500 text-white rounded"
                >
                  + Add Row
                </button>

                <div className="space-x-2">
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-xs px-3 py-1 border rounded"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      const payload = rows.filter((r) => r.ac_reg && r.rts);

                      if (!payload.length) return;

                      await supabase.from('abmp').insert(payload);

                      setShowModal(false);
                      setRows([{ ac_reg: '', rts: '' }]);
                      fetchTable(); // refresh tabel kiri
                    }}
                    className="text-xs px-3 py-1 bg-green-600 text-white rounded"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MAIN CONTENT */}
      <div className="grid grid-cols-12 gap-2 h-[80vh]">
        {/* KIRI - TABLE */}
        <div className="col-span-3 border rounded-lg overflow-auto">
          {loadingTable ? (
            <div className="p-2 text-sm text-gray-500">Loading...</div>
          ) : (
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-[#00919f] text-white text-xs font-semibold text-center">
                  <th className="border px-2 py-1">No</th>
                  <th className="border px-2 py-1">AC REG</th>
                  <th className="border px-2 py-1">RTS</th>
                </tr>
              </thead>

              <tbody>
  {sortedTableData.map((row, rowIndex) => {
    const today = new Date();
    const rtsDate = row.rts ? new Date(row.rts) : null;
    const isPast = rtsDate && rtsDate < today;

    return (
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
        <td className="border px-2 py-1 bg-inherit text-center">{rowIndex + 1}</td>
        <td className="border px-2 py-1 bg-inherit">{row.ac_reg}</td>

        {/* RTS editable */}
        <td
          className={`border px-2 py-1 bg-inherit text-center ${
            isPast ? 'text-red-600 font-semibold' : ''
          }`}
          onClick={() => {
            setEditingCell({ id: row.id, field: 'rts' });
            setTempValue(row.rts || '');
          }}
        >
          {editingCell?.id === row.id && editingCell?.field === 'rts' ? (
            <input
              type="date"
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              onBlur={() => {
                // 🔹 Update tableData langsung supaya warna & sorting ikut berubah
                setTableData((prev) =>
                  prev.map((r) =>
                    r.id === row.id ? { ...r, rts: tempValue } : r
                  )
                );

                // 🔹 Update backend / Supabase
                handleUpdate(row.id, 'rts', tempValue);

                setEditingCell(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setTableData((prev) =>
                    prev.map((r) =>
                      r.id === row.id ? { ...r, rts: tempValue } : r
                    )
                  );
                  handleUpdate(row.id, 'rts', tempValue);
                  setEditingCell(null);
                }
                if (e.key === 'Escape') {
                  setEditingCell(null);
                }
              }}
              autoFocus
              className="w-full bg-transparent px-1 py-0.5 text-[11px] rounded-md border border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 text-center"
            />
          ) : rtsDate ? (
            rtsDate
              .toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })
              .replace(/ /g, '-')
          ) : (
            ''
          )}
        </td>
      </tr>
    );
  })}
</tbody>

            </table>
          )}
        </div>

        {/* KANAN - PDF */}
        <div className="col-span-9 border rounded-lg overflow-hidden">
          {pdfUrl && (
            <iframe
              src={pdfUrl}
              width="100%"
              height="100%"
              allow="autoplay"
              title="ABMP PDF"
            />
          )}
        </div>
      </div>
    </div>
  );
}
