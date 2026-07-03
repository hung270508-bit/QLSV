import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar as CalendarIcon, Plus, Edit, Trash2, Search, X,
  RefreshCw, CheckCircle2, AlertCircle, Clock, MapPin, Repeat, CalendarDays, BookOpen,
  ChevronDown, ChevronUp, Layers, User, Award, CheckSquare, Square, Sparkles
} from 'lucide-react';
import axios from 'axios';
import { ScheduleSkeleton } from '../common/AdminSkeleton';
import API_URL from '../../api';
import ModalPortal, { Toast, ConfirmDialog } from '../common/ModalPortal';

// ================================================================
// HẰNG SỐ NGHIỆP VỤ DUY NHẤT (Quy định 1 TC = 9 tiết)
// ================================================================
const TC_TO_TIET = 9;

// ================================================================
// CÁC HÀM XỬ LÝ LÔGIC THỜI GIAN VÀ SỐ TIẾT
// ================================================================
const parsePeriods = (caHocStr) => {
  const str = String(caHocStr).trim();
  const matchXY = str.match(/(\d+)\s*-\s*(\d+)/);
  if (matchXY) return { start: parseInt(matchXY[1]), end: parseInt(matchXY[2]) };
  return { start: 0, end: 0 };
};

function tinhTietDaHoc(schedules, maLopHocPhan) {
  return schedules
    .filter(s => String(s.MaLopHocPhan).trim() === String(maLopHocPhan).trim())
    .reduce((sum, s) => {
      if (s.SoTiet) return sum + parseInt(s.SoTiet);
      const p = parsePeriods(s.CaHoc);
      const soTiet = p.start > 0 ? (p.end - p.start + 1) : 0;
      return sum + soTiet;
    }, 0);
}

const getTimeString = (startPeriod, endPeriod, periodsConfig) => {
  if (!periodsConfig || !periodsConfig[startPeriod] || !periodsConfig[endPeriod]) return '';
  return `${periodsConfig[startPeriod].start} - ${periodsConfig[endPeriod].end}`;
};

const isOverlap = (ca1, ca2) => {
  const p1 = parsePeriods(ca1);
  const p2 = parsePeriods(ca2);
  if (p1.start === 0 || p2.start === 0) return false;
  return p1.start <= p2.end && p1.end >= p2.start;
};

const formatCaHocToDisplay = (caHocStr, soTiet, periodsConfig) => {
  if (!caHocStr || String(caHocStr).trim().toLowerCase() === 'null') {
    return soTiet ? `Học ${soTiet} tiết` : 'Chưa phân tiết';
  }
  const p = parsePeriods(caHocStr);
  if (p.start === 0) return `Ca ${caHocStr}`;
  const time = getTimeString(p.start, p.end, periodsConfig);
  return `Tiết ${p.start}-${p.end} ${time ? `(${time})` : ''}`;
};

const getLocalYYYYMMDD = (dateInput) => {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const getDayAndDateStr = (dateVal) => {
  if (!dateVal) return 'Chưa xác định ngày';
  const cleanStr = getLocalYYYYMMDD(dateVal) || String(dateVal).split('T')[0];
  const d = new Date(cleanStr + 'T00:00:00');
  if (isNaN(d.getTime())) {
    const d2 = new Date(dateVal);
    if (isNaN(d2.getTime())) return String(dateVal);
    const names = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    return `${names[d2.getDay()]}, ${String(d2.getDate()).padStart(2, '0')}/${String(d2.getMonth() + 1).padStart(2, '0')}/${d2.getFullYear()}`;
  }
  const names = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  return `${names[d.getDay()]}, ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

const formatDateTimeStr = (dtStr) => {
  if (!dtStr) return 'Vừa xếp xong';
  const d = new Date(dtStr);
  if (isNaN(d.getTime())) return String(dtStr);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} - ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

// ================================================================
// COMPONENT CHỌN NGÀY CHUẨN VIỆT NAM (DD/MM/YYYY)
// ================================================================
const VietnameseDatePicker = ({ value, onChange, error }) => {
  const toDisplay = (val) => {
    if (!val) return '';
    const clean = String(val).split('T')[0].replace(/[-.]/g, '/');
    const parts = clean.split('/');
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
      } else if (parts[2].length === 4) {
        return `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[2]}`;
      }
    }
    return val;
  };

  const [textVal, setTextVal] = React.useState(() => toDisplay(value));
  const [showCalendar, setShowCalendar] = React.useState(false);
  const dropdownRef = React.useRef(null);

  const getInitialView = () => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) return { year: d.getFullYear(), month: d.getMonth() };
    }
    const today = new Date();
    return { year: today.getFullYear(), month: today.getMonth() };
  };

  const [view, setView] = React.useState(getInitialView);

  React.useEffect(() => {
    const formatted = toDisplay(value);
    if (!value && textVal && textVal.length > 0 && textVal.length < 10) {
      return;
    }
    if (formatted !== textVal) {
      setTextVal(formatted);
    }
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) setView({ year: d.getFullYear(), month: d.getMonth() });
    }
  }, [value]);

  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowCalendar(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTextChange = (e) => {
    const input = e.target.value;
    setTextVal(input);
    const cleaned = input.replace(/[-.]/g, '/').trim();
    const parts = cleaned.split('/');
    if (parts.length === 3 && parts[2].length === 4) {
      const d = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      const y = parseInt(parts[2], 10);
      if (d >= 1 && d <= 31 && m >= 1 && m <= 12 && y >= 1900 && y <= 2100) {
        const yyyymmdd = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        onChange(yyyymmdd);
        setView({ year: y, month: m - 1 });
      } else {
        onChange('');
      }
    } else {
      onChange('');
    }
  };

  const handleSelectDate = (year, month, day) => {
    const yyyymmdd = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onChange(yyyymmdd);
    setTextVal(`${String(day).padStart(2, '0')}/${String(month + 1).padStart(2, '0')}/${year}`);
    setShowCalendar(false);
  };

  const generateDays = () => {
    const { year, month } = view;
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(d);
    }
    return days;
  };

  const nextMonth = (e) => {
    e.stopPropagation();
    setView(prev => {
      const m = prev.month === 11 ? 0 : prev.month + 1;
      const y = prev.month === 11 ? prev.year + 1 : prev.year;
      return { year: y, month: m };
    });
  };

  const prevMonth = (e) => {
    e.stopPropagation();
    setView(prev => {
      const m = prev.month === 0 ? 11 : prev.month - 1;
      const y = prev.month === 0 ? prev.year - 1 : prev.year;
      return { year: y, month: m };
    });
  };

  const daysOfWeek = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const monthNames = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ];

  const currentSelectedStr = value ? String(value).split('T')[0] : '';

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <input
        type="text"
        placeholder="dd/mm/yyyy"
        value={textVal}
        onChange={handleTextChange}
        className={`w-full p-2.5 pr-10 bg-[#FFFFFF] border rounded-lg outline-none text-sm font-bold text-[#111827] focus:border-[#F4C542] ${error ? 'border-red-500 focus:border-red-500' : 'border-gray-300'}`}
      />
      <button
        type="button"
        onClick={() => setShowCalendar(!showCalendar)}
        className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 text-[#6B7280] hover:text-[#F4C542] transition-colors rounded-lg hover:bg-gray-100"
        title="Bấm vào để mở lịch Việt Nam"
      >
        <CalendarDays className="w-4 h-4 pointer-events-none" />
      </button>

      {showCalendar && (
        <div className="absolute z-50 mt-1.5 p-4 bg-white border border-gray-200 rounded-xl shadow-2xl w-[280px] left-0 select-none animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
            <span className="font-bold text-sm text-[#111827]">
              {monthNames[view.month]}, {view.year}
            </span>
            <div className="flex items-center gap-1">
              <button type="button" onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors">
                <ChevronDown className="w-4 h-4 rotate-90" />
              </button>
              <button type="button" onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors">
                <ChevronDown className="w-4 h-4 -rotate-90" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {daysOfWeek.map((d, idx) => (
              <span key={idx} className={`text-[11px] font-extrabold ${idx === 0 ? 'text-red-500' : 'text-gray-400'}`}>
                {d}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {generateDays().map((day, idx) => {
              if (day === null) {
                return <div key={idx} className="h-8" />;
              }
              const dateStr = `${view.year}-${String(view.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isSelected = dateStr === currentSelectedStr;
              const isToday = dateStr === new Date().toISOString().split('T')[0];

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectDate(view.year, view.month, day)}
                  className={`h-8 w-8 rounded-lg text-xs font-bold flex items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-[#F4C542] text-[#111827] shadow-sm font-extrabold scale-105'
                      : isToday
                      ? 'border border-[#F4C542] text-[#D97706] font-bold'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
          <div className="mt-3 pt-2 border-t border-gray-100 flex justify-between items-center text-xs">
            <button
              type="button"
              onClick={() => {
                const today = new Date();
                handleSelectDate(today.getFullYear(), today.getMonth(), today.getDate());
              }}
              className="text-[#3B82F6] font-bold hover:underline"
            >
              Hôm nay
            </button>
            <button
              type="button"
              onClick={() => setShowCalendar(false)}
              className="text-gray-400 hover:text-gray-600 font-medium"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ================================================================
// COMPONENT CHÍNH
// ================================================================
function ScheduleManagement() {
  const [schedules, setSchedules] = useState([]);
  const [lhpList, setLhpList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [editingLhpSchedule, setEditingLhpSchedule] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [warningPopup, setWarningPopup] = useState({ show: false, title: '', message: '' });
  const [expandedGroups, setExpandedGroups] = useState({});

  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [confirmDialog, setConfirmDialog] = useState({ show: false, title: '', message: '', action: null });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // STATE NHẬN DỮ LIỆU CẤU HÌNH TỪ API
  const [sysConfig, setSysConfig] = useState({
    rooms: [], periods: {}, tanSuat: [], thuList: []
  });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const [isRecurring, setIsRecurring] = useState(true);

  const [formData, setFormData] = useState({
    MaLopHocPhan: '', NgayHoc: '', NgayBatDau: '', PhongHoc: '',
    tanSuat: 1, thu1: '', thu2: '',
    tietBatDau1: '', soTiet1: '',
    tietBatDau2: '', soTiet2: ''
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [schedRes, lhpRes, configRes] = await Promise.all([
        axios.get(`${API_URL}/api/schedules`),
        axios.get(`${API_URL}/api/teaching-assignments`),
        axios.get(`${API_URL}/api/schedule-configs`)
      ]);
      setSchedules(schedRes.data);
      setLhpList(lhpRes.data);
      if (configRes.data && configRes.data.success) {
        setSysConfig({
          rooms: configRes.data.rooms,
          periods: configRes.data.periods,
          tanSuat: configRes.data.tanSuat,
          thuList: configRes.data.thuList
        });
      }
    } catch (e) {
      showToast('Lỗi tải dữ liệu!', 'error');
    } finally {
      setLoading(false);
    }
  };

  const selectedLHPInfo = useMemo(() => {
    if (!formData.MaLopHocPhan) return null;
    const lhp = lhpList.find(l =>
      String(l.MaLopHocPhan).trim().toLowerCase() ===
      String(formData.MaLopHocPhan).trim().toLowerCase()
    );
    if (!lhp) return null;

    const tc = lhp.TinChi || lhp.SoTinChi || 3;
    const tongTiet = tc * TC_TO_TIET;

    let tietDaHoc = tinhTietDaHoc(schedules, formData.MaLopHocPhan);

    if (editingLhpSchedule && String(editingLhpSchedule).trim().toLowerCase() === String(formData.MaLopHocPhan).trim().toLowerCase()) {
      tietDaHoc = 0; // Khi sửa lịch định kỳ của môn, coi như xếp lại từ đầu
    } else if (editingSchedule && String(editingSchedule.MaLopHocPhan).trim() === String(formData.MaLopHocPhan).trim()) {
      if (editingSchedule.SoTiet) {
        tietDaHoc -= parseInt(editingSchedule.SoTiet);
      } else {
        const p = parsePeriods(editingSchedule.CaHoc);
        tietDaHoc -= (p.start > 0 ? (p.end - p.start + 1) : 0);
      }
    }

    const tietConLai = tongTiet - tietDaHoc;
    const hoanThanh = tietConLai <= 0;

    return { tc, tongTiet, tietDaHoc, tietConLai, hoanThanh, lhp };
  }, [formData.MaLopHocPhan, lhpList, schedules, editingSchedule, editingLhpSchedule]);

  const previewSchedule = useMemo(() => {
    if (!isRecurring || !formData.NgayBatDau || !formData.MaLopHocPhan || !selectedLHPInfo) return [];
    if (Number(formData.tanSuat) === 1 && (!formData.thu1 || !formData.tietBatDau1 || !formData.soTiet1)) return [];
    if (Number(formData.tanSuat) === 2 && (!formData.thu2 || !formData.tietBatDau2 || !formData.soTiet2)) return [];

    const s1 = parseInt(formData.soTiet1);
    const s2 = Number(formData.tanSuat) === 2 ? parseInt(formData.soTiet2) : s1;
    if (isNaN(s1) || s1 <= 0) return [];

    const startDate = new Date(formData.NgayBatDau + 'T00:00:00');
    if (isNaN(startDate.getTime())) return [];

    let remaining = selectedLHPInfo.tietConLai;
    if (remaining <= 0) return [];

    const thu1 = parseInt(formData.thu1);
    const thu2 = parseInt(formData.thu2);
    const jsDay1 = thu1 === 0 ? 0 : thu1;
    const jsDay2 = thu2 === 0 ? 0 : thu2;

    const findFirst = (fromDate, targetDay) => {
      const d = new Date(fromDate);
      const targetJS = targetDay === 0 ? 0 : targetDay;
      d.setDate(d.getDate() + ((targetJS - d.getDay() + 7) % 7));
      return d;
    };

    const sessions = [];
    if (Number(formData.tanSuat) === 1) {
      let curr = findFirst(startDate, jsDay1);
      while (remaining > 0) {
        const tietToHoc = Math.min(s1, remaining);
        const endTietThucTe = parseInt(formData.tietBatDau1) + tietToHoc - 1;
        sessions.push({ date: new Date(curr), caHoc: `${formData.tietBatDau1}-${endTietThucTe}`, tietBatDau: parseInt(formData.tietBatDau1), soTiet: tietToHoc });
        curr.setDate(curr.getDate() + 7);
        remaining -= tietToHoc;
      }
    } else {
      let curr1 = findFirst(startDate, jsDay1);
      let curr2 = findFirst(startDate, jsDay2);

      while (remaining > 0) {
        if (curr1 <= curr2) {
          const tietToHoc = Math.min(s1, remaining);
          const endTietThucTe = parseInt(formData.tietBatDau1) + tietToHoc - 1;
          sessions.push({ date: new Date(curr1), caHoc: `${formData.tietBatDau1}-${endTietThucTe}`, tietBatDau: parseInt(formData.tietBatDau1), soTiet: tietToHoc });
          curr1.setDate(curr1.getDate() + 7);
          remaining -= tietToHoc;
        } else {
          if (remaining <= 0) break;
          const tietToHoc = Math.min(s2, remaining);
          const endTietThucTe = parseInt(formData.tietBatDau2) + tietToHoc - 1;
          sessions.push({ date: new Date(curr2), caHoc: `${formData.tietBatDau2}-${endTietThucTe}`, tietBatDau: parseInt(formData.tietBatDau2), soTiet: tietToHoc });
          curr2.setDate(curr2.getDate() + 7);
          remaining -= tietToHoc;
        }
      }
    }

    return sessions;
  }, [isRecurring, formData, selectedLHPInfo]);

  const groupedSchedules = useMemo(() => {
    const filtered = schedules.filter(s =>
      s.TenMonHoc?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.TenGiangVien?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.MaLopHocPhan?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const groups = {};
    filtered.forEach(s => {
      const lhpKey = s.MaLopHocPhan || 'Chưa xác định LHP';
      if (!groups[lhpKey]) groups[lhpKey] = [];
      groups[lhpKey].push(s);
    });
    // Trong mỗi nhóm LHP, sắp xếp các buổi học theo Ngày học (tăng dần) -> rồi Ca học
    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => {
        const dateA = new Date((a.NgayHoc || '').split('T')[0] || 0);
        const dateB = new Date((b.NgayHoc || '').split('T')[0] || 0);
        if (dateA - dateB !== 0) return dateA - dateB;
        return parsePeriods(a.CaHoc).start - parsePeriods(b.CaHoc).start;
      });
    });
    // Sắp xếp các nhóm LHP theo Mã lớp học phần
    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
  }, [schedules, searchTerm]);

  const toggleGroup = (lhpKey) => {
    setExpandedGroups(prev => ({ ...prev, [lhpKey]: !prev[lhpKey] }));
  };

  const isAllExpanded = useMemo(() => {
    if (groupedSchedules.length === 0) return false;
    return groupedSchedules.every(([key]) => expandedGroups[key]);
  }, [groupedSchedules, expandedGroups]);

  const toggleExpandAll = () => {
    if (isAllExpanded) {
      setExpandedGroups({});
    } else {
      const all = {};
      groupedSchedules.forEach(([key]) => { all[key] = true; });
      setExpandedGroups(all);
    }
  };

  const hasInitialized = useRef(false);
  useEffect(() => {
    if (groupedSchedules.length > 0 && !hasInitialized.current) {
      hasInitialized.current = true;
      const initial = {};
      groupedSchedules.slice(0, 3).forEach(([key]) => { initial[key] = true; });
      setExpandedGroups(initial);
    }
  }, [groupedSchedules]);

  // Xóa trắng lỗi Real-time khi User bắt đầu sửa
  const handleFieldChange = (field, value) => {
    if (field === 'MaLopHocPhan') {
      setFormData({
        MaLopHocPhan: value,
        NgayHoc: '', NgayBatDau: '', PhongHoc: '',
        tanSuat: 1, thu1: '', thu2: '',
        tietBatDau1: '', soTiet1: '',
        tietBatDau2: '', soTiet2: ''
      });
      setFormErrors({});
      return;
    }

    setFormData(prev => ({ ...prev, [field]: field === 'tanSuat' ? Number(value) : value }));
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const currentYear = today.getFullYear();
    let errorMsg = '';

    if (value && (field === 'NgayBatDau' || field === 'NgayHoc')) {
      const sel = new Date(value + 'T00:00:00');
      const isSame = editingSchedule && getLocalYYYYMMDD(editingSchedule.NgayHoc) === value;
      if (!isSame) {
        if (sel < today) errorMsg = 'Lỗi: Không được xếp lịch vào ngày ở quá khứ.';
        else if (sel.getFullYear() > currentYear) errorMsg = `Lỗi: Chỉ được xếp lịch trong năm hiện tại (${currentYear}).`;
      }
    }

    setFormErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      if (field.includes('tietBatDau') || field.includes('soTiet')) {
        delete newErrors.buoi1;
        delete newErrors.buoi2;
      }
      if (errorMsg) {
        newErrors[field] = errorMsg;
      }
      return newErrors;
    });
  };

  const validateScheduleForm = () => {
    const errors = {}; // Bắt đầu bằng mảng rỗng để không bị kẹt lỗi cũ
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const currentYear = today.getFullYear();

    if (!formData.MaLopHocPhan) errors.MaLopHocPhan = 'Vui lòng chọn lớp học phần';
    if (!formData.PhongHoc) errors.PhongHoc = 'Vui lòng chọn phòng học';

    if (!editingSchedule && !editingLhpSchedule && selectedLHPInfo?.hoanThanh) {
      errors.MaLopHocPhan = 'Môn học này đã hoàn thành đủ tiết, không thể tạo thêm lịch!';
    }

    const validateTiet = (startStr, numStr, fieldPrefix) => {
      if (!startStr) { errors[fieldPrefix] = 'Chọn tiết bắt đầu'; return 0; }
      if (!numStr) { errors[fieldPrefix] = 'Nhập số tiết học'; return 0; }

      const s = parseInt(startStr);
      const num = parseInt(numStr);

      if (num < 1 || num > 5) {
        errors[fieldPrefix] = `Số tiết học mỗi buổi phải từ 1 đến 5 tiết.`;
        return 0;
      }

      const e = s + num - 1;
      if (e > 12) {
        errors[fieldPrefix] = `Tiết kết thúc (${e}) vượt quá 12 tiết.`;
        return 0;
      }

      if (s <= 6 && e >= 7) {
        errors[fieldPrefix] = 'Lỗi: Lịch học không được vắt ngang giờ nghỉ trưa (Qua tiết 6 và 7).';
        return 0;
      }
      return num;
    };

    let soTiet1 = 0;

    if (isRecurring && !editingSchedule) {
      if (!formData.NgayBatDau) {
        errors.NgayBatDau = 'Chọn ngày bắt đầu';
      } else {
        const d = new Date(formData.NgayBatDau + 'T00:00:00');
        if (d < today) errors.NgayBatDau = 'Không được xếp lịch vào ngày ở quá khứ.';
        else if (d.getFullYear() > currentYear) errors.NgayBatDau = `Chỉ được phép bắt đầu trong năm ${currentYear}.`;
      }
      if (!formData.thu1) errors.thu1 = 'Chọn thứ học';

      soTiet1 = validateTiet(formData.tietBatDau1, formData.soTiet1, 'buoi1');

      if (Number(formData.tanSuat) === 2) {
        if (!formData.thu2) errors.thu2 = 'Chọn thứ học buổi 2';
        if (formData.thu1 && formData.thu2 && formData.thu1 === formData.thu2) {
          // Cho phép chọn cùng 1 thứ, nhưng phải kiểm tra không được trùng tiết
          const start1 = parseInt(formData.tietBatDau1);
          const num1 = parseInt(formData.soTiet1);
          const start2 = parseInt(formData.tietBatDau2);
          const num2 = parseInt(formData.soTiet2);
          if (start1 && num1 && start2 && num2) {
            const end1 = start1 + num1 - 1;
            const end2 = start2 + num2 - 1;
            // Kỹ thuật kiểm tra 2 khoảng thời gian giao nhau
            if (!(end1 < start2 || start1 > end2)) {
              errors.buoi2 = 'Thời gian buổi 2 bị trùng với buổi 1 trong cùng 1 ngày!';
            }
          }
        }
        validateTiet(formData.tietBatDau2, formData.soTiet2, 'buoi2');
      }
    } else {
      if (!formData.NgayHoc) {
        errors.NgayHoc = 'Vui lòng chọn ngày học';
      } else {
        const d = new Date(formData.NgayHoc + 'T00:00:00');
        const isSame = editingSchedule && getLocalYYYYMMDD(editingSchedule.NgayHoc) === formData.NgayHoc;
        if (!isSame) {
          if (d < today) errors.NgayHoc = 'Không được xếp lịch vào ngày ở quá khứ.';
          else if (d.getFullYear() > currentYear) errors.NgayHoc = `Chỉ được phép xếp lịch trong năm ${currentYear}.`;
        }
      }
      soTiet1 = validateTiet(formData.tietBatDau1, formData.soTiet1, 'buoi1');

      if (editingSchedule && editingSchedule.TrangThaiLich === 'DA_CHOT') {
        const pOrig = parsePeriods(editingSchedule.CaHoc);
        const origSoTiet = pOrig.start > 0 ? (pOrig.end - pOrig.start + 1) : (Number(editingSchedule.SoTiet) || 0);
        if (soTiet1 !== origSoTiet) {
          errors.buoi1 = `Lớp học phần đã chốt lịch: Bắt buộc giữ nguyên số tiết của buổi học (${origSoTiet} tiết), không được tăng hay giảm!`;
        }
      } else if (selectedLHPInfo && soTiet1 > 0 && !isRecurring) {
        if (soTiet1 > selectedLHPInfo.tietConLai) {
          errors.buoi1 = `Số tiết của buổi học (${soTiet1} tiết) vượt quá số tiết còn lại của môn (${selectedLHPInfo.tietConLai} tiết).`;
        }
      }
    }

    // In chi tiết lỗi ra F12 để bạn dễ nắm bắt nếu nút Lưu không chạy
    if (Object.keys(errors).length > 0) {
      console.log("CHI TIẾT LỖI FORM:", errors);
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateScheduleForm()) {
      showToast('Vui lòng kiểm tra lại các cảnh báo lỗi màu đỏ!', 'error');
      return;
    }

    const currentFormLHP = String(formData.MaLopHocPhan).trim().toLowerCase();
    const selectedLHP = lhpList.find(l => String(l.MaLopHocPhan).trim().toLowerCase() === currentFormLHP);
    if (!selectedLHP) { showToast('Không tìm thấy lớp học phần hợp lệ!', 'error'); return; }

    if (isRecurring && !editingSchedule && !editingLhpSchedule) {
      const alreadyScheduled = schedules.some(s =>
        String(s.MaLopHocPhan).trim().toLowerCase() === currentFormLHP
      );
      if (alreadyScheduled) {
        showToast('Môn học đã được xếp lịch trước đó, không thể tạo thêm lịch lặp định kỳ.', 'error');
        return;
      }
    }

    let sessionsPayload = [];
    if (editingSchedule) {
      sessionsPayload.push({
        NgayHoc: formData.NgayHoc,
        TietBatDau: parseInt(formData.tietBatDau1),
        SoTiet: parseInt(formData.soTiet1),
        PhongHoc: formData.PhongHoc
      });
    } else if (isRecurring && previewSchedule.length > 0) {
      sessionsPayload = previewSchedule.map(s => ({
        NgayHoc: getLocalYYYYMMDD(s.date),
        TietBatDau: s.tietBatDau,
        SoTiet: s.soTiet,
        PhongHoc: formData.PhongHoc
      }));
    } else if (!isRecurring) {
      sessionsPayload.push({
        NgayHoc: formData.NgayHoc,
        TietBatDau: parseInt(formData.tietBatDau1),
        SoTiet: parseInt(formData.soTiet1),
        PhongHoc: formData.PhongHoc
      });
    } else {
      showToast('Lỗi logic: Không sinh được dữ liệu buổi học!', 'error');
      return;
    }

    // CHECK TRÙNG LỊCH Ở FRONTEND TRƯỚC KHI GỬI
    for (const session of sessionsPayload) {
      const displayDate = session.NgayHoc.split('-').reverse().join('/');
      const eTiet = session.TietBatDau + session.SoTiet - 1;
      const caHocCheck = `${session.TietBatDau}-${eTiet}`;

      const conflictingSchedules = schedules.filter(s => {
        if (editingSchedule && s.MaLichHoc === editingSchedule.MaLichHoc) return false;
        if (editingLhpSchedule && String(s.MaLopHocPhan).trim().toLowerCase() === String(editingLhpSchedule).trim().toLowerCase()) return false;
        return getLocalYYYYMMDD(s.NgayHoc) === session.NgayHoc && isOverlap(s.CaHoc, caHocCheck);
      });

      // 1. KIỂM TRA TRÙNG PHÒNG HỌC (Logic cũ của bạn)
      if (conflictingSchedules.some(s => String(s.PhongHoc) === String(formData.PhongHoc))) {
        showToast(`Trùng lịch: Phòng ${formData.PhongHoc} bận vào ${displayDate}`, 'error');
        return;
      }

      // 2. KIỂM TRA TRÙNG GIẢNG VIÊN (Logic mới được bổ sung)
      // Tìm xem trong các lịch bị trùng thời gian, có lịch nào do cùng 1 GV dạy không
      const conflictTeacher = conflictingSchedules.find(s => {
        // So sánh an toàn cả theo Mã GV (nếu API có trả) và Tên GV
        const isSameMaGV = selectedLHP.MaGiangVien && s.MaGiangVien && String(s.MaGiangVien) === String(selectedLHP.MaGiangVien);
        const isSameTenGV = selectedLHP.TenGiangVien && s.TenGiangVien && String(s.TenGiangVien).trim() === String(selectedLHP.TenGiangVien).trim();

        return isSameMaGV || isSameTenGV;
      });

      if (conflictTeacher) {
        showToast(`Trùng lịch: Giảng viên ${conflictTeacher.TenGiangVien || 'này'} đã có lịch dạy môn ${conflictTeacher.TenMonHoc} (P.${conflictTeacher.PhongHoc}) vào thời gian này!`, 'error');
        return;
      }
    }

    setConfirmDialog({
      show: true,
      title: editingSchedule || editingLhpSchedule ? 'Xác nhận cập nhật' : 'Xác nhận xếp lịch',
      message: editingSchedule || editingLhpSchedule
        ? `Lưu thay đổi cho lịch học này?`
        : `Hệ thống sẽ tạo ${sessionsPayload.length} buổi học. Lưu vào Database?`,
      action: async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        let nguoiTao = 'Admin (Hệ thống)';
        try {
          const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
          if (userStr) {
            const u = JSON.parse(userStr);
            nguoiTao = u.HoTen || u.username || u.name || 'Admin (Hệ thống)';
          }
        } catch (e) { }
        try {
          if (editingSchedule) {
            await axios.put(`${API_URL}/api/schedules/${editingSchedule.MaLichHoc}`, {
              MaLopHocPhan: formData.MaLopHocPhan,   // ✅ FIX
              NguoiTao: nguoiTao,
              ...sessionsPayload[0]
            });
            showToast('Cập nhật lịch học thành công!', 'success');
          } else {
            if (editingLhpSchedule) {
              const payload = sessionsPayload.map(session => ({
                MaLopHocPhan: formData.MaLopHocPhan,
                NguoiTao: nguoiTao,
                ...session
              }));
              await axios.put(`${API_URL}/api/schedules/lophocphan/${editingLhpSchedule}/reschedule`, {
                sessions: payload
              });
              showToast('Cập nhật lại lịch học định kỳ môn thành công!', 'success');
            } else {
              for (const session of sessionsPayload) {
                await axios.post(`${API_URL}/api/schedules`, {
                  MaLopHocPhan: formData.MaLopHocPhan, // ✅ FIX
                  NguoiTao: nguoiTao,
                  ...session
                });
              }
              showToast('Lưu lịch học thành công!', 'success');
            }
          }
          fetchData();
          handleCloseModal();
        } catch (err) {
          let msg = err.response?.data?.message;
          if (!msg) {
            if (err.response?.status === 404) msg = 'Lỗi 404: Không tìm thấy đường dẫn API trên máy chủ (chưa cập nhật/khởi động lại Backend)!';
            else if (err.response?.status === 500) msg = 'Lỗi 500: Lỗi hệ thống nội bộ từ phía máy chủ!';
            else msg = err.message || 'Có lỗi xảy ra khi lưu lịch học!';
          }
          showToast(msg, 'error');
        } finally {
          setIsSubmitting(false);
          setConfirmDialog({ show: false, title: '', message: '', action: null });
        }
      }
    });
  };

  const handleDelete = (id) => {
    setConfirmDialog({
      show: true,
      title: 'Xác nhận xóa',
      message: 'Bạn có chắc chắn muốn xóa buổi học này không? Hành động không thể hoàn tác.',
      action: async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
          await axios.delete(`${API_URL}/api/schedules/${id}`);
          showToast('Xóa lịch học thành công!', 'success');
          fetchData();
        } catch { showToast('Lỗi khi xóa lịch!', 'error'); }
        finally {
          setIsSubmitting(false);
          setConfirmDialog({ show: false, action: null });
        }
      }
    });
  };


  const handleToggleLock = (maLHP, currentStatus, tongTiet = 0, tietQuyDinh = 0) => {
    if (currentStatus === 'DA_CHOT') {
      showToast('Lớp học phần này đã được chốt lịch, không thể thao tác lại!', 'error');
      return;
    }
    if (tietQuyDinh > 0 && tongTiet < tietQuyDinh) {
      const thieu = tietQuyDinh - tongTiet;
      setWarningPopup({
        show: true,
        title: 'Chưa đủ điều kiện chốt lịch!',
        message: `Lớp học phần "${maLHP}" có quy định là ${tietQuyDinh} tiết học (theo số tín chỉ), nhưng hiện tại mới chỉ xếp được ${tongTiet} tiết.\n\n⚠️ Bạn còn thiếu ${thieu} tiết học nữa. Vui lòng xếp bổ sung cho đủ số tiết quy định trước khi chốt lịch!`
      });
      return;
    }
    setConfirmDialog({
      show: true,
      title: 'Xác nhận chốt lịch học (Bước 1/2)',
      message: `Bạn có chắc chắn muốn CHỐT LỊCH HỌC cho lớp học phần "${maLHP}"?\n\nHiện tại lớp đã xếp đủ ${tongTiet}/${tietQuyDinh || tongTiet} tiết học.`,
      action: () => {
        setConfirmDialog({
          show: true,
          title: '⚠️ Xác nhận lần cuối (Bước 2/2)',
          message: `Sau khi chốt lịch cho "${maLHP}", hệ thống sẽ KHÔNG cho phép xóa lịch hay xếp thêm buổi mới (chỉ cho phép sửa để chuyển đổi ngày/giờ dạy khi cần thiết).\n\nBạn có thực sự chắc chắn muốn chốt ngay bây giờ không?`,
          action: async () => {
            if (isSubmitting) return;
            setIsSubmitting(true);
            try {
              setLoading(true);
              const res = await axios.put(`${API_URL}/api/teaching-assignments/${maLHP}/toggle-lock`, { TrangThaiLich: 'DA_CHOT' });
              if (res.data.success) {
                showToast(res.data.message, 'success');
                setLhpList(prev => prev.map(item => item.MaLopHocPhan === maLHP ? { ...item, TrangThaiLich: 'DA_CHOT' } : item));
                setSchedules(prev => prev.map(item => item.MaLopHocPhan === maLHP ? { ...item, TrangThaiLich: 'DA_CHOT' } : item));
                fetchData();
              } else {
                showToast(res.data.message || 'Lỗi cập nhật trạng thái!', 'error');
              }
            } catch (err) {
              showToast(err.response?.data?.message || 'Lỗi kết nối khi cập nhật chốt lịch!', 'error');
            } finally {
              setLoading(false);
              setIsSubmitting(false);
              setConfirmDialog({ show: false, action: null });
            }
          }
        });
      }
    });
  };

  const handleDeleteLhpSchedules = (maLHP, currentStatus, items) => {
    setConfirmDialog({
      show: true,
      title: 'Xác nhận xóa lịch của lớp',
      message: `Bạn có chắc chắn muốn xóa toàn bộ ${items.length} buổi học của lớp học phần "${maLHP}" không?\n\nSau khi xóa, lớp học phần này sẽ tự động được MỞ KHÓA bên Phân công giảng dạy.`,
      action: async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
          setLoading(true);
          const res = await axios.delete(`${API_URL}/api/schedules/lophocphan/${maLHP}`);
          if (res.data.success) {
            setLhpList(prev => prev.map(item => item.MaLopHocPhan === maLHP ? { ...item, TrangThaiLich: 'CHUA_CHOT' } : item));
            setSchedules(prev => prev.filter(s => s.MaLopHocPhan !== maLHP));
            fetchData();
          } else {
            showToast(res.data.message || 'Lỗi khi xóa lịch học của lớp!', 'error');
          }
        } catch (err) {
          showToast(err.response?.data?.message || 'Lỗi khi xóa lịch học của lớp!', 'error');
          fetchData();
        } finally {
          setLoading(false);
          setIsSubmitting(false);
          setConfirmDialog({ show: false, action: null });
        }
      }
    });
  };

  const handleEditLhpSchedule = (first, items) => {
    if (first.TrangThaiLich === 'DA_CHOT') {
      showToast('Lớp học phần này đã chốt lịch, không thể chỉnh sửa!', 'error');
      return;
    }
    setEditingSchedule(null);
    setEditingLhpSchedule(first.MaLopHocPhan);
    setIsRecurring(true);

    const sortedItems = [...items].sort((a, b) => new Date(a.NgayHoc) - new Date(b.NgayHoc));
    const firstSession = sortedItems[0];
    const p1 = firstSession ? parsePeriods(firstSession.CaHoc) : { start: 1, end: 3 };
    const soTiet1Val = p1.start > 0 ? (p1.end - p1.start + 1) : 3;

    let tanSuatVal = 1;
    let thu2Val = '';
    let tietBatDau2Val = '';
    let soTiet2Val = '';

    if (sortedItems.length > 1) {
      const firstDate = new Date(sortedItems[0].NgayHoc);
      const secondSession = sortedItems.find(s => {
        const d = new Date(s.NgayHoc);
        const diffDays = Math.abs(d - firstDate) / (1000 * 60 * 60 * 24);
        return diffDays > 0 && diffDays < 7;
      });
      if (secondSession) {
        tanSuatVal = 2;
        const d2 = new Date(secondSession.NgayHoc);
        const dayIdx2 = d2.getDay();
        thu2Val = String(dayIdx2);
        const p2 = parsePeriods(secondSession.CaHoc);
        tietBatDau2Val = String(p2.start || 1);
        soTiet2Val = String(p2.start > 0 ? (p2.end - p2.start + 1) : 3);
      }
    }

    let thu1Val = '';
    if (firstSession && firstSession.NgayHoc) {
      const d1 = new Date(firstSession.NgayHoc);
      const dayIdx1 = d1.getDay();
      thu1Val = String(dayIdx1);
    }

    setFormData({
      MaLopHocPhan: first.MaLopHocPhan,
      NgayHoc: '',
      NgayBatDau: firstSession ? getLocalYYYYMMDD(firstSession.NgayHoc) : getLocalYYYYMMDD(new Date()),
      tanSuat: tanSuatVal,
      thu1: thu1Val,
      tietBatDau1: String(p1.start || ''),
      soTiet1: String(soTiet1Val),
      thu2: thu2Val,
      tietBatDau2: tietBatDau2Val,
      soTiet2: soTiet2Val,
      PhongHoc: firstSession?.PhongHoc || sysConfig.rooms[0] || ''
    });
    setFormErrors({});
    setShowModal(true);
  };

  const handleEdit = (s) => {
    setEditingSchedule(s);
    setEditingLhpSchedule(null);
    setIsRecurring(false);
    const p = parsePeriods(s.CaHoc);
    const soTiet = p.start > 0 ? (p.end - p.start + 1) : s.SoTiet || 3;
    setFormData({
      MaLopHocPhan: s.MaLopHocPhan,
      NgayHoc: getLocalYYYYMMDD(s.NgayHoc),
      tietBatDau1: String(p.start || ''),
      soTiet1: String(soTiet),
      PhongHoc: s.PhongHoc,
      NgayBatDau: '', tanSuat: 1, thu1: '', thu2: '', tietBatDau2: '', soTiet2: ''
    });
    setFormErrors({});
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false); setEditingSchedule(null); setEditingLhpSchedule(null);
    setFormData({ MaLopHocPhan: '', NgayHoc: '', NgayBatDau: '', PhongHoc: '', tanSuat: 1, thu1: '', thu2: '', tietBatDau1: '', soTiet1: '', tietBatDau2: '', soTiet2: '' });
    setFormErrors({}); setIsRecurring(true);
  };

  if (loading) return <ScheduleSkeleton />;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 px-4">
      {/* Toast Notification */}
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, show: false })}
      />

      <ConfirmDialog
        show={confirmDialog.show}
        title={confirmDialog.title}
        message={confirmDialog.message}
        isSubmitting={isSubmitting}
        onConfirm={() => confirmDialog.action && !isSubmitting && confirmDialog.action()}
        onCancel={() => !isSubmitting && setConfirmDialog({ show: false, title: '', message: '', action: null })}
      />

      {/* Warning Popup Modal khi chưa xếp đủ tiết */}
      <AnimatePresence>
        {warningPopup.show && (
          <ModalPortal>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-[#FFFFFF] rounded-2xl p-6 w-full max-w-md shadow-2xl border-2 border-red-500"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-red-100 rounded-full p-3">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <h3 className="text-xl font-bold text-[#1F2937]">{warningPopup.title}</h3>
                </div>
                <p className="text-[#4B5563] mb-6 whitespace-pre-line leading-relaxed font-medium text-sm">{warningPopup.message}</p>
                <button
                  onClick={() => setWarningPopup({ show: false, title: '', message: '' })}
                  className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-lg transition-all"
                >
                  Đã hiểu / Xếp bổ sung
                </button>
              </motion.div>
            </motion.div>
          </ModalPortal>
        )}
      </AnimatePresence>
      <div className="bg-[#F4C542] rounded-2xl p-8 shadow-xl text-[#152238] flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-white/40 p-3 rounded-full shrink-0"><CalendarIcon className="w-6 h-6 text-white" /></div>
          <div>
            <h2 className="text-2xl font-bold">Quản lý lịch học</h2>
            <p className="text-[#152238]/70 text-sm mt-0.5">Xếp lịch giảng dạy linh hoạt theo tiết</p>
          </div>
        </div>
        <button onClick={() => { handleCloseModal(); setShowModal(true); }}
          className="bg-[#FFFFFF] text-[#F4C542] px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:scale-105"
        ><Plus className="w-5 h-5" /> Xếp lịch học</button>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 w-5 h-5" />
          <input type="text" placeholder="Tìm kiếm mã lớp học phần, tên môn..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-[#FFFFFF] border border-[#E5E7EB] rounded-xl shadow-sm outline-none focus:border-[#F4C542] text-sm font-medium"
          />
        </div>
        <div className="flex items-center gap-3 shrink-0 w-full md:w-auto">
          <button onClick={toggleExpandAll} className="w-full md:w-auto bg-[#F7F8FA] text-[#4B5563] px-4 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 border border-[#E5E7EB] hover:bg-gray-200 transition-all shadow-sm">
            {isAllExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {isAllExpanded ? 'Thu gọn tất cả' : 'Mở rộng tất cả'}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {groupedSchedules.length > 0 ? groupedSchedules.map(([lhpKey, items]) => {
          const first = items[0] || {};
          const isExpanded = !!expandedGroups[lhpKey];
          const tongTiet = items.reduce((sum, s) => sum + (Number(s.SoTiet) || 0), 0);
          const tietQuyDinh = (Number(first.SoTinChi) || 0) * TC_TO_TIET;
          return (
            <div key={lhpKey} className="bg-[#FFFFFF] border-2 border-[#E5E7EB] rounded-2xl overflow-hidden shadow-sm transition-all hover:border-[#F4C542]/50">
              {/* HEADER NÚT BẤM COLLAPSED/EXPANDED */}
              <div
                onClick={() => toggleGroup(lhpKey)}
                className={`px-5 py-4 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer select-none transition-colors ${isExpanded ? 'bg-gradient-to-r from-amber-50/80 to-yellow-50/40 border-b border-[#E5E7EB]' : 'bg-[#F7F8FA] hover:bg-gray-100/80'}`}
              >
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-mono text-xs font-black text-[#B45309] bg-[#FFF7D6] px-3 py-1 rounded-lg border border-[#F4C542]/40 shadow-2xs">
                    {lhpKey}
                  </span>
                  <h3 className="font-bold text-[#1F2937] text-base">
                    {first.TenMonHoc || 'Môn học chưa xác định'}
                  </h3>
                  {first.SoTinChi ? (
                    <span className="bg-blue-50 text-blue-700 font-bold text-xs px-2.5 py-0.5 rounded-md border border-blue-200">
                      {first.SoTinChi} TC
                    </span>
                  ) : null}
                  <span className="text-xs text-[#6B7280] font-medium flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-gray-400" /> {first.TenGiangVien || 'Chưa phân công'}
                  </span>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
                  <div className="flex items-center gap-2 text-xs font-bold flex-wrap">
                    {first.TrangThaiLich === 'DA_CHOT' && (
                      <span className="bg-red-50 text-red-700 px-2.5 py-1 rounded-md border border-red-200 shadow-2xs">
                        Đã chốt
                      </span>
                    )}
                    <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-md border border-gray-200">
                      {first.TenLop || first.MaLop || 'Lớp tự do'} ({first.SiSoThucTe || 0}/{first.SoLuongToiDa || 40} SV)
                    </span>
                    <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-md border border-emerald-200">
                      Đã xếp {tongTiet}{tietQuyDinh > 0 ? `/${tietQuyDinh}` : ''} tiết ({items.length} buổi)
                    </span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm border border-gray-200 text-gray-600">
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-[#F4C542]" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>
              </div>

              {/* NỘI DUNG EXPANDED: TOÀN BỘ THÔNG TIN & LỊCH HỌC */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* BẢNG TỔNG QUAN THÔNG TIN LHP */}
                    <div className="bg-gray-50/60 p-4 border-b border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-2xs">
                        <span className="text-gray-400 font-bold block uppercase text-[10px] mb-1">Khoa & Môn học</span>
                        <span className="font-bold text-[#1F2937] text-sm line-clamp-1 block">{first.TenMonHoc}</span>
                        <span className="text-gray-500 font-medium">{first.MaMonHoc} ({first.SoTinChi || '?'} tín chỉ)</span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-2xs">
                        <span className="text-gray-400 font-bold block uppercase text-[10px] mb-1">Giảng viên giảng dạy</span>
                        <span className="font-bold text-[#1F2937] text-sm line-clamp-1 block">{first.TenGiangVien || '—'}</span>
                        <span className="text-gray-500 font-mono font-medium">{first.MaGiangVien || '—'}</span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-2xs">
                        <span className="text-gray-400 font-bold block uppercase text-[10px] mb-1">Lớp sinh hoạt & Sĩ số</span>
                        <span className="font-bold text-[#1F2937] text-sm line-clamp-1 block">{first.TenLop || first.MaLop || 'Lớp tự do'}</span>
                        <span className="text-gray-500 font-medium">Sĩ số: <strong className="text-[#1F2937] font-bold">{first.SiSoThucTe || 0}/{first.SoLuongToiDa || 40}</strong> sinh viên</span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-2xs">
                        <span className="text-gray-400 font-bold block uppercase text-[10px] mb-1">Học kỳ & Tiến độ</span>
                        <span className="font-bold text-[#B45309] text-sm line-clamp-1 block">{first.HocKy || '—'}</span>
                        <span className="text-emerald-600 font-semibold">Đã xếp {tongTiet} tiết học</span>
                      </div>
                    </div>

                    {/* THANH CÔNG CỤ TRONG LHP */}
                    <div className="bg-[#FFFDF5] px-4 py-2.5 border-b border-amber-100 flex flex-wrap items-center justify-between gap-3 text-xs font-semibold text-gray-700">
                      <span className="text-gray-500 italic font-medium"> Nhấn vào nút "Sửa" ở từng buổi bên dưới để chuyển đổi ngày/giờ dạy khi cần</span>
                      <div className="flex items-center gap-2">
                        {first.TrangThaiLich !== 'DA_CHOT' && (
                          <>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditLhpSchedule(first, items);
                              }}
                              className="px-3.5 py-1.5 rounded-xl font-bold bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 transition-all active:scale-95 shadow-sm text-xs"
                            >
                              Sửa
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteLhpSchedules(first.MaLopHocPhan, first.TrangThaiLich, items);
                              }}
                              className="px-3.5 py-1.5 rounded-xl font-bold bg-white hover:bg-red-50 text-red-600 border border-red-300 transition-all active:scale-95 shadow-sm text-xs"
                            >
                              Xóa lớp
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          disabled={first.TrangThaiLich === 'DA_CHOT'}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (first.TrangThaiLich === 'DA_CHOT') return;
                            handleToggleLock(first.MaLopHocPhan, first.TrangThaiLich, tongTiet, tietQuyDinh);
                          }}
                          className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all ${
                            first.TrangThaiLich === 'DA_CHOT'
                              ? 'bg-gray-200 text-gray-500 border border-gray-300 cursor-not-allowed opacity-80 shadow-none'
                              : 'bg-[#F4C542] hover:bg-[#e0b333] text-[#152238] border border-amber-400 active:scale-95 shadow-sm'
                          }`}
                        >
                          {first.TrangThaiLich === 'DA_CHOT' ? 'Đã chốt lịch' : 'Chốt lịch học'}
                        </button>
                      </div>
                    </div>

                    {/* DANH SÁCH CHI TIẾT LỊCH HỌC */}
                    <div className="divide-y divide-gray-100 bg-white">
                      {items.map((s, idx) => {
                        const p = parsePeriods(s.CaHoc);
                        const soTietHienThi = s.SoTiet || (p.start > 0 ? (p.end - p.start + 1) : '?');
                        return (
                          <div key={s.MaLichHoc} className="p-4 flex flex-col md:flex-row items-center gap-4 hover:bg-[#F7F8FA] transition-colors">
                            <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-4 items-center w-full">
                              <div>
                                <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Buổi & Ngày học</span>
                                <span className="font-bold text-[#1F2937] text-sm flex items-center gap-1.5">
                                  <CalendarDays className="w-4 h-4 text-[#F4C542] shrink-0" />
                                  {getDayAndDateStr(s.NgayHoc)}
                                </span>
                              </div>

                              <div>
                                <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Thời gian ({soTietHienThi} tiết)</span>
                                <span className="font-black text-[#F4C542] bg-[#FFF7D6] px-3 py-1 rounded-lg text-xs border border-[#FFF7D6] inline-block shadow-2xs">
                                  {formatCaHocToDisplay(s.CaHoc, s.SoTiet, sysConfig.periods)}
                                </span>
                              </div>

                              <div>
                                <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Phòng học</span>
                                <span className="font-bold text-[#1F2937] text-sm flex items-center gap-1.5 bg-gray-100 w-fit px-3 py-1 rounded-lg border border-gray-200">
                                  <MapPin className="w-4 h-4 text-[#EF4444] shrink-0" /> P.{s.PhongHoc}
                                </span>
                              </div>

                              <div>
                                <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Thứ tự buổi</span>
                                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                  Buổi {idx + 1}
                                </span>
                              </div>

                              <div>
                                <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Người xếp & Thời gian</span>
                                <div className="flex flex-col gap-0.5">
                                  <span className="font-bold text-[#1F2937] text-xs flex items-center gap-1 line-clamp-1">
                                    <User className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                    {s.NguoiTao || 'Admin (Hệ thống)'}
                                  </span>
                                  <span className="text-[11px] text-gray-500 font-medium flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                    {formatDateTimeStr(s.NgayTao)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0 border-[#E5E7EB]">
                              <button onClick={() => handleEdit(s)} className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#FFFFFF] border border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:text-[#F4C542] hover:border-amber-400 transition-all shadow-2xs hover:shadow-sm">
                                <Edit className="w-3.5 h-3.5" /> Sửa
                              </button>
                              {first.TrangThaiLich !== 'DA_CHOT' && (
                                <button onClick={() => handleDelete(s.MaLichHoc)} className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#FFFFFF] border border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:text-[#EF4444] hover:border-red-400 transition-all shadow-2xs hover:shadow-sm">
                                  <Trash2 className="w-3.5 h-3.5" /> Xóa
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        }) : (
          <div className="text-center py-16 bg-[#FFFFFF] border border-[#E5E7EB] rounded-xl shadow-sm">
            <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-[#6B7280] font-medium text-sm">Chưa có lịch học nào được xếp.</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleCloseModal} />
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 15 }}
              className="relative bg-[#FFFFFF] rounded-xl w-full max-w-[700px] shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="px-6 py-4 border-b border-[#E5E7EB] flex justify-between items-center bg-[#F7F8FA]">
                <h3 className="text-base font-bold text-[#1F2937] flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-[#F4C542]" />
                  {editingSchedule ? 'Cập nhật lịch học' : editingLhpSchedule ? 'Sửa lịch học định kỳ' : 'Xếp lịch học mới'}
                </h3>
                <button onClick={handleCloseModal} className="p-1.5 hover:bg-gray-200 rounded-full text-[#6B7280] transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-4">
                <form id="schedule-form" onSubmit={handleSubmit} noValidate className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Lớp học phần <span className="text-[#EF4444]">*</span>
                    </label>
                    <select value={formData.MaLopHocPhan}
                      onChange={e => handleFieldChange('MaLopHocPhan', e.target.value)}
                      disabled={!!editingSchedule || !!editingLhpSchedule}
                      className={`w-full p-2.5 border rounded-lg outline-none text-sm transition-all ${editingSchedule || editingLhpSchedule
                          ? 'bg-gray-100 border-[#E5E7EB] text-[#6B7280] cursor-not-allowed opacity-90'
                          : `bg-[#FFFFFF] focus:border-[#F4C542] ${formErrors.MaLopHocPhan ? 'border-red-500' : 'border-gray-300'}`
                        }`}
                    >
                      <option value="">-- Chọn lớp học phần --</option>
                      {lhpList.map(lhp => {
                        const tc = lhp.TinChi || lhp.SoTinChi || 3;
                        const tongTiet = tc * TC_TO_TIET;
                        const tietDaHoc = tinhTietDaHoc(schedules, lhp.MaLopHocPhan);
                        const isFullyScheduled = tietDaHoc >= tongTiet;
                        const hasAnySchedule = tietDaHoc > 0;

                        let isDisabled = false;
                        let labelSuffix = '';

                        if (!editingSchedule && !editingLhpSchedule) {
                          if (lhp.TrangThaiLich === 'DA_CHOT') {
                            isDisabled = true;
                            labelSuffix = ' (Đã chốt lịch)';
                          } else if (isRecurring) {
                            isDisabled = hasAnySchedule;
                            if (hasAnySchedule) labelSuffix = ' (Đã đăng ký)';
                          } else {
                            if (!hasAnySchedule) {
                              isDisabled = true;
                              labelSuffix = ' (Chưa có lịch chính thức)';
                            } else if (isFullyScheduled) {
                              isDisabled = true;
                              labelSuffix = ' (Đã đăng ký đủ)';
                            } else {
                              isDisabled = false;
                            }
                          }
                        }

                        return (
                          <option key={lhp.MaLopHocPhan} value={lhp.MaLopHocPhan} disabled={isDisabled}>
                            [{lhp.MaLopHocPhan}] {lhp.TenMonHoc} {labelSuffix}
                          </option>
                        );
                      })}
                    </select>
                    {formErrors.MaLopHocPhan && <p className="text-[#EF4444] text-xs mt-1">{formErrors.MaLopHocPhan}</p>}

                    {formData.MaLopHocPhan && selectedLHPInfo && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                        className="mt-3 p-4 bg-[#FFF7D6] border border-[#FFF7D6] rounded-xl shadow-sm overflow-hidden"
                      >
                        <div className="flex items-center text-sm w-full gap-2">
                          <BookOpen className="w-5 h-5 text-[#F4C542]" />
                          <span className="font-semibold text-gray-700">Tổng số tiết môn học:</span>
                          <span className="text-[#F4C542] font-black text-lg ml-1">{selectedLHPInfo.tongTiet} tiết ({selectedLHPInfo.tc} tín chỉ)</span>
                        </div>
                        {selectedLHPInfo.lhp?.TrangThaiLich === 'DA_CHOT' && !editingSchedule && !editingLhpSchedule && (
                          <div className="mt-3 flex items-center gap-2 text-red-700 bg-red-100 border border-red-200 rounded-lg px-3 py-2 text-xs font-bold">
                            Lớp học phần này đã chốt lịch. Không thể xếp thêm buổi học mới!
                          </div>
                        )}
                        {selectedLHPInfo.hoanThanh && !editingSchedule && !editingLhpSchedule && (
                          <div className="mt-3 flex items-center gap-2 text-green-700 bg-[#22C55E]/20 border border-green-200 rounded-lg px-3 py-2 text-xs font-bold">
                            <CheckCircle2 className="w-4 h-4" /> Môn học này đã được xếp đủ số tiết quy định.
                          </div>
                        )}
                      </motion.div>
                    )}

                    {(editingSchedule || editingLhpSchedule) && (
                      <p className="text-xs text-[#F4C542] mt-1.5 font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Không thể thay đổi lớp học phần khi đang cập nhật lịch
                      </p>
                    )}
                  </div>

                  {!editingSchedule && !editingLhpSchedule && (
                    <div className="flex bg-gray-100 p-1 rounded-lg border border-[#E5E7EB]">
                      <button type="button" onClick={() => setIsRecurring(true)}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border transition-all ${isRecurring ? 'bg-[#F4C542] text-[#152238] shadow-sm border-[#F4C542]' : 'text-[#6B7280] border-transparent'}`}
                      ><Repeat className="w-3.5 h-3.5" /> Lặp định kỳ</button>
                      <button type="button" onClick={() => setIsRecurring(false)}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border transition-all ${!isRecurring ? 'bg-[#F4C542] text-[#152238] shadow-sm border-[#F4C542]' : 'text-[#6B7280] border-transparent'}`}
                      ><Clock className="w-3.5 h-3.5" /> Học bù (1 buổi)</button>
                    </div>
                  )}

                  <div className="p-5 border border-[#E5E7EB] rounded-xl bg-[#F7F8FA]/50 space-y-5">
                    {/* KHỐI LẶP ĐỊNH KỲ */}
                    {isRecurring && !editingSchedule ? (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-[#6B7280] uppercase mb-1">Tần suất học / Tuần <span className="text-[#EF4444]">*</span></label>
                            <select value={formData.tanSuat} onChange={e => handleFieldChange('tanSuat', Number(e.target.value))} className="w-full p-2.5 bg-[#FFFFFF] border border-gray-300 rounded-lg outline-none text-sm font-bold text-gray-700">
                              {sysConfig.tanSuat.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-[#6B7280] uppercase mb-1">Phòng học <span className="text-[#EF4444]">*</span></label>
                            <select value={formData.PhongHoc} onChange={e => handleFieldChange('PhongHoc', e.target.value)} className={`w-full p-2.5 bg-[#FFFFFF] border rounded-lg outline-none text-sm focus:border-[#F4C542] ${formErrors.PhongHoc ? 'border-red-500' : 'border-gray-300'}`}>
                              <option value="">-- Chọn Phòng --</option>
                              {sysConfig.rooms.map(r => <option key={r} value={r}>Phòng {r}</option>)}
                            </select>
                            {formErrors.PhongHoc && <p className="text-[#EF4444] text-xs mt-1">{formErrors.PhongHoc}</p>}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-[#6B7280] uppercase mb-1">Ngày bắt đầu học <span className="text-[#EF4444]">*</span></label>
                            <VietnameseDatePicker value={formData.NgayBatDau} onChange={val => handleFieldChange('NgayBatDau', val)} error={formErrors.NgayBatDau} />
                            {formErrors.NgayBatDau ? (
                              <p className="text-[#EF4444] text-[11px] mt-1.5 font-bold flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {formErrors.NgayBatDau}</p>
                            ) : formData.NgayBatDau ? (
                              <p className="text-[#3B82F6] text-[11px] mt-1.5 font-bold flex items-center gap-1">
                                {(() => {
                                  if (!sysConfig.thuList || sysConfig.thuList.length === 0) return null;
                                  const label1 = sysConfig.thuList.find(t => String(t.value) === String(formData.thu1))?.label;
                                  const label2 = sysConfig.thuList.find(t => String(t.value) === String(formData.thu2))?.label;
                                  if (Number(formData.tanSuat) === 2) {
                                    if (label1 && label2) return ` (Học vào ${label1} và ${label2} hàng tuần)`;
                                    if (label1) return ` (Học vào ${label1} và ... hàng tuần)`;
                                    if (label2) return ` (Học vào ... và ${label2} hàng tuần)`;
                                    return null;
                                  }
                                  return label1 ? ` (Học vào ${label1} hàng tuần)` : null;
                                })()}
                              </p>
                            ) : null}
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-[#6B7280] uppercase mb-1">Dự kiến kết thúc</label>
                            <input type="text" value={previewSchedule.length > 0 ? getDayAndDateStr(getLocalYYYYMMDD(previewSchedule[previewSchedule.length - 1].date)) : ''} disabled placeholder="Hệ thống tự động tính toán..." className="w-full p-2.5 bg-gray-100 border border-[#E5E7EB] rounded-lg text-sm font-bold text-[#6B7280] cursor-not-allowed" />
                          </div>
                        </div>

                        {previewSchedule.length > 0 && (
                          <div className="p-3.5 bg-[#FEF3C7] border border-[#FDE68A] rounded-xl text-xs text-[#92400E] font-medium flex items-start gap-2.5 shadow-sm">
                            <Sparkles className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
                            <div className="space-y-1">
                              <p className="font-bold text-[#78350F]">Tự động phân chia lịch học ({previewSchedule.length} buổi - Tổng {previewSchedule.reduce((sum, s) => sum + s.soTiet, 0)} tiết):</p>
                              <p className="text-[11.5px] leading-relaxed">
                                {previewSchedule[previewSchedule.length - 1].soTiet < parseInt(formData.soTiet1 || 0) ? (
                                  <>✓ Có <b>{previewSchedule.length - 1} buổi chính</b> ({formData.soTiet1} tiết/buổi) và <b>1 buổi cuối cùng tự động xếp lẻ</b> ({previewSchedule[previewSchedule.length - 1].soTiet} tiết) vào buổi kết thúc để vừa đúng đủ chương trình.</>
                                ) : (
                                  <>✓ Đã chia đều <b>{previewSchedule.length} buổi</b> ({formData.soTiet1} tiết/buổi) cho môn học này.</>
                                )}
                              </p>
                            </div>
                          </div>
                        )}

                        <div className="p-4 border border-[#E5E7EB] rounded-lg bg-[#FFFFFF] space-y-3">
                          <label className="block text-sm font-bold text-[#F4C542] uppercase border-b pb-2 mb-3">Buổi 1</label>
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs font-bold text-[#6B7280] uppercase mb-1">Thứ học <span className="text-[#EF4444]">*</span></label>
                              <select value={formData.thu1} onChange={e => handleFieldChange('thu1', e.target.value)} className={`w-full p-2.5 bg-[#F7F8FA] border rounded-lg outline-none text-sm focus:border-[#F4C542] ${formErrors.thu1 ? 'border-red-500' : 'border-gray-300'}`}>
                                <option value="">Chọn</option>
                                {sysConfig.thuList.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-[#6B7280] uppercase mb-1">Tiết bắt đầu <span className="text-[#EF4444]">*</span></label>
                              <select value={formData.tietBatDau1} onChange={e => handleFieldChange('tietBatDau1', e.target.value)} className={`w-full p-2.5 bg-[#F7F8FA] border rounded-lg outline-none text-sm focus:border-[#F4C542] ${formErrors.buoi1 ? 'border-red-500' : 'border-gray-300'}`}>
                                <option value="">Chọn Tiết</option>
                                {Object.keys(sysConfig.periods).map(k => <option key={k} value={k}>Tiết {k} ({sysConfig.periods[k].start})</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-[#6B7280] uppercase mb-1">Số tiết học <span className="text-[#EF4444]">*</span></label>
                              <input type="number" min="1" max="5" placeholder="VD: 3" value={formData.soTiet1} onChange={e => handleFieldChange('soTiet1', e.target.value)} className={`w-full p-2.5 bg-[#F7F8FA] border rounded-lg outline-none text-sm focus:border-[#F4C542] ${formErrors.buoi1 ? 'border-red-500' : 'border-gray-300'}`} />
                            </div>
                          </div>
                          {formErrors.buoi1 && <p className="text-[#EF4444] text-[11px] font-bold flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {formErrors.buoi1}</p>}
                        </div>

                        {Number(formData.tanSuat) === 2 && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="p-4 border border-[#E5E7EB] rounded-lg bg-[#FFFFFF] space-y-3">
                            <label className="block text-sm font-bold text-[#F4C542] uppercase border-b pb-2 mb-3">Buổi 2</label>
                            <div className="grid grid-cols-3 gap-3">
                              <div>
                                <label className="block text-xs font-bold text-[#6B7280] uppercase mb-1">Thứ học <span className="text-[#EF4444]">*</span></label>
                                <select value={formData.thu2} onChange={e => handleFieldChange('thu2', e.target.value)} className={`w-full p-2.5 bg-[#F7F8FA] border rounded-lg outline-none text-sm focus:border-[#F4C542] ${formErrors.thu2 ? 'border-red-500' : 'border-gray-300'}`}>
                                  <option value="">Chọn</option>
                                  {sysConfig.thuList.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                </select>
                                {formErrors.thu2 && <p className="text-[#EF4444] text-[10px] mt-1">{formErrors.thu2}</p>}
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-[#6B7280] uppercase mb-1">Tiết bắt đầu <span className="text-[#EF4444]">*</span></label>
                                <select value={formData.tietBatDau2} onChange={e => handleFieldChange('tietBatDau2', e.target.value)} className={`w-full p-2.5 bg-[#F7F8FA] border rounded-lg outline-none text-sm focus:border-[#F4C542] ${formErrors.buoi2 ? 'border-red-500' : 'border-gray-300'}`}>
                                  <option value="">Chọn Tiết</option>
                                  {Object.keys(sysConfig.periods).map(k => <option key={k} value={k}>Tiết {k} ({sysConfig.periods[k].start})</option>)}
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-[#6B7280] uppercase mb-1">Số tiết học <span className="text-[#EF4444]">*</span></label>
                                <input type="number" min="1" max="5" placeholder="VD: 3" value={formData.soTiet2} onChange={e => handleFieldChange('soTiet2', e.target.value)} className={`w-full p-2.5 bg-[#F7F8FA] border rounded-lg outline-none text-sm focus:border-[#F4C542] ${formErrors.buoi2 ? 'border-red-500' : 'border-gray-300'}`} />
                              </div>
                            </div>
                            {formErrors.buoi2 && <p className="text-[#EF4444] text-[11px] font-bold flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {formErrors.buoi2}</p>}
                          </motion.div>
                        )}
                      </>
                    ) : (
                      // KHỐI HỌC BÙ / SỬA (MỘT BUỔI)
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-[#6B7280] uppercase mb-1">Ngày học <span className="text-[#EF4444]">*</span></label>
                            <VietnameseDatePicker value={formData.NgayHoc} onChange={val => handleFieldChange('NgayHoc', val)} error={formErrors.NgayHoc} />
                            {formErrors.NgayHoc && <p className="text-[#EF4444] text-[11px] mt-1"><AlertCircle className="w-3 h-3 inline" />{formErrors.NgayHoc}</p>}
                            {!formErrors.NgayHoc && formData.NgayHoc && (
                              <p className="text-[#3B82F6] text-[11px] mt-1.5 font-bold flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5" /> Lịch học: {getDayAndDateStr(formData.NgayHoc)}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-[#6B7280] uppercase mb-1">Phòng học <span className="text-[#EF4444]">*</span></label>
                            <select value={formData.PhongHoc} onChange={e => handleFieldChange('PhongHoc', e.target.value)} className={`w-full p-2.5 border rounded-lg text-sm ${formErrors.PhongHoc ? 'border-red-500' : 'border-gray-300'}`}>
                              <option value="">-- Chọn Phòng --</option>
                              {sysConfig.rooms.map(r => <option key={r} value={r}>Phòng {r}</option>)}
                            </select>
                            {formErrors.PhongHoc && <p className="text-[#EF4444] text-[11px] mt-1">{formErrors.PhongHoc}</p>}
                          </div>
                        </div>

                        <div className="p-4 border rounded-lg bg-[#FFFFFF] grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-[#6B7280] uppercase mb-1">Tiết bắt đầu <span className="text-[#EF4444]">*</span></label>
                            <select value={formData.tietBatDau1} onChange={e => handleFieldChange('tietBatDau1', e.target.value)} className={`w-full p-2.5 border rounded-lg text-sm ${formErrors.buoi1 ? 'border-red-500' : 'border-gray-300'}`}>
                              <option value="">Chọn Tiết</option>
                              {Object.keys(sysConfig.periods).map(k => <option key={k} value={k}>Tiết {k} ({sysConfig.periods[k].start})</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-[#6B7280] uppercase mb-1">
                              Số tiết học <span className="text-[#EF4444]">*</span>
                            </label>
                            <input
                              type="number"
                              min="1"
                              max="5"
                              disabled={editingSchedule?.TrangThaiLich === 'DA_CHOT'}
                              value={formData.soTiet1}
                              onChange={e => handleFieldChange('soTiet1', e.target.value)}
                              className={`w-full p-2.5 border rounded-lg text-sm ${
                                editingSchedule?.TrangThaiLich === 'DA_CHOT'
                                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed border-gray-300'
                                  : formErrors.buoi1 ? 'border-red-500 bg-white' : 'border-gray-300 bg-white'
                              }`}
                            />
                            {editingSchedule?.TrangThaiLich === 'DA_CHOT' && (
                              <p className="text-[11px] text-amber-600 font-bold mt-1.5 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3 shrink-0" /> Lịch đã chốt: Bắt buộc giữ nguyên số tiết, chỉ được đổi ngày học/tiết bắt đầu/phòng học.
                              </p>
                            )}
                          </div>
                          {formErrors.buoi1 && <div className="col-span-2 text-[#EF4444] text-[11px] font-bold"><AlertCircle className="w-3 h-3 inline" /> {formErrors.buoi1}</div>}
                        </div>
                      </div>
                    )}
                  </div>
                </form>
              </div>

              <div className="p-4 border-t bg-[#F7F8FA] flex gap-3 justify-end">
                <button type="button" onClick={handleCloseModal} className="px-5 py-2 bg-gray-200 rounded-lg text-sm font-semibold hover:bg-gray-300 text-gray-700">Hủy</button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting || ((!!selectedLHPInfo?.hoanThanh || selectedLHPInfo?.lhp?.TrangThaiLich === 'DA_CHOT') && !editingSchedule && !editingLhpSchedule)}
                  className="px-5 py-2 bg-[#F4C542] text-[#152238] rounded-lg text-sm font-bold hover:bg-[#F4C542]/90 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingSchedule || editingLhpSchedule ? 'Lưu thay đổi' : 'Xác nhận xếp lịch'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
//con meo
export default ScheduleManagement;
