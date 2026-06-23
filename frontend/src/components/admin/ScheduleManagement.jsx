import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar as CalendarIcon, Plus, Edit, Trash2, Search, X, 
  RefreshCw, CheckCircle2, AlertCircle, Clock, MapPin, Repeat, CalendarDays, BookOpen
} from 'lucide-react';
import axios from 'axios';
import { ScheduleSkeleton } from '../common/AdminSkeleton';
import API_URL from '../../api';

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
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};

const getDayAndDateStr = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return '';
  const names = ['Chủ nhật','Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7'];
  return `${names[d.getDay()]}, ${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
};

// ================================================================
// COMPONENT CHÍNH
// ================================================================
function ScheduleManagement() {
  const [schedules, setSchedules]   = useState([]);
  const [lhpList, setLhpList]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSchedules, setSelectedSchedules] = useState([]);

  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [confirmDialog, setConfirmDialog] = useState({ show: false, title: '', message: '', action: null });

  // STATE NHẬN DỮ LIỆU CẤU HÌNH TỪ API
  const [sysConfig, setSysConfig]   = useState({
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

    const tc         = lhp.TinChi || lhp.SoTinChi || 3;
    const tongTiet   = tc * TC_TO_TIET; 

    let tietDaHoc = tinhTietDaHoc(schedules, formData.MaLopHocPhan);
    
    // Nếu đang Edit, trả lại số tiết của chính lịch đó để giả lập tình trạng ban đầu
    if (editingSchedule && String(editingSchedule.MaLopHocPhan).trim() === String(formData.MaLopHocPhan).trim()) {
      if (editingSchedule.SoTiet) {
        tietDaHoc -= parseInt(editingSchedule.SoTiet); 
      } else {
        const p = parsePeriods(editingSchedule.CaHoc);
        tietDaHoc -= (p.start > 0 ? (p.end - p.start + 1) : 0);
      }
    }

    const tietConLai = tongTiet - tietDaHoc;
    const hoanThanh  = tietConLai <= 0;

    return { tc, tongTiet, tietDaHoc, tietConLai, hoanThanh, lhp };
  }, [formData.MaLopHocPhan, lhpList, schedules, editingSchedule]);

  const previewSchedule = useMemo(() => {
    if (!isRecurring || !formData.NgayBatDau || !formData.MaLopHocPhan || !selectedLHPInfo) return [];
    if (formData.tanSuat === 1 && (!formData.thu1 || !formData.tietBatDau1 || !formData.soTiet1)) return [];
    if (formData.tanSuat === 2 && (!formData.thu2 || !formData.tietBatDau2 || !formData.soTiet2)) return [];

    const s1 = parseInt(formData.soTiet1);
    const s2 = formData.tanSuat === 2 ? parseInt(formData.soTiet2) : s1;
    if (isNaN(s1) || s1 <= 0) return [];

    const startDate = new Date(formData.NgayBatDau + 'T00:00:00');
    if (isNaN(startDate.getTime())) return [];

    let remaining = selectedLHPInfo.tietConLai;
    if (remaining <= 0) return [];

    const thu1   = parseInt(formData.thu1);
    const thu2   = parseInt(formData.thu2);
    const jsDay1 = thu1 === 0 ? 0 : thu1;
    const jsDay2 = thu2 === 0 ? 0 : thu2;

    const findFirst = (fromDate, targetDay) => {
      const d = new Date(fromDate);
      const targetJS = targetDay === 0 ? 0 : targetDay; 
      d.setDate(d.getDate() + ((targetJS - d.getDay() + 7) % 7));
      return d;
    };

    const sessions = [];
    if (formData.tanSuat === 1) {
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
      const dateKey = s.NgayHoc ? getLocalYYYYMMDD(s.NgayHoc) : 'Chưa xác định';
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(s);
    });
    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => parsePeriods(a.CaHoc).start - parsePeriods(b.CaHoc).start);
    });
    return Object.entries(groups).sort((a, b) => new Date(b[0]) - new Date(a[0]));
  }, [schedules, searchTerm]);

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

    setFormData(prev => ({ ...prev, [field]: value }));
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

    if (!editingSchedule && selectedLHPInfo?.hoanThanh) {
      errors.MaLopHocPhan = 'Môn học này đã hoàn thành đủ tiết, không thể tạo thêm lịch!';
    }

    const validateTiet = (startStr, numStr, fieldPrefix) => {
      if (!startStr) { errors[fieldPrefix] = 'Chọn tiết bắt đầu'; return 0; }
      if (!numStr) { errors[fieldPrefix] = 'Nhập số tiết học'; return 0; }
      
      const s = parseInt(startStr);
      const num = parseInt(numStr);
      
      if (num < 2 || num > 5) {
        errors[fieldPrefix] = `Số tiết học mỗi buổi phải từ 2 đến 5 tiết.`;
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

      if (formData.tanSuat === 2) {
        if (!formData.thu2) errors.thu2 = 'Chọn thứ học buổi 2';
        if (formData.thu1 && formData.thu2 && formData.thu1 === formData.thu2)
          errors.thu2 = 'Thứ buổi 2 phải khác thứ buổi 1';
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

      if (selectedLHPInfo && soTiet1 > 0 && !isRecurring) {
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

    if (isRecurring && !editingSchedule) {
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
      title: editingSchedule ? 'Xác nhận cập nhật' : 'Xác nhận xếp lịch',
      message: editingSchedule
        ? `Lưu thay đổi cho lịch học này?`
        : `Hệ thống sẽ tạo ${sessionsPayload.length} buổi học. Lưu vào Database?`,
      action: async () => {
     setConfirmDialog({ show: false, title: '', message: '', action: null });
  try {
    if (editingSchedule) {
      await axios.put(`${API_URL}/api/schedules/${editingSchedule.MaLichHoc}`, {
        MaLopHocPhan: formData.MaLopHocPhan,   // ✅ FIX
        ...sessionsPayload[0]
      });
      showToast('Cập nhật lịch học thành công!', 'success');
    } else {
      for (const session of sessionsPayload) {
        await axios.post(`${API_URL}/api/schedules`, {
          MaLopHocPhan: formData.MaLopHocPhan, // ✅ FIX
          ...session
        });
      }
      showToast('Lưu lịch học thành công!', 'success');
    }
          fetchData();
          handleCloseModal();
        } catch (err) {
          const msg = err.response?.data?.message || 'Có lỗi xảy ra khi lưu lịch học!';
          showToast(msg, 'error');
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
        setConfirmDialog({ show: false, action: null });
        try {
          await axios.delete(`${API_URL}/api/schedules/${id}`);
          showToast('Xóa lịch học thành công!', 'success');
          fetchData();
        } catch { showToast('Lỗi khi xóa lịch!', 'error'); }
      }
    });
  };

  const handleDeleteSelected = () => {
    setConfirmDialog({
      show: true,
      title: 'Xác nhận xóa hàng loạt',
      message: `Bạn có chắc chắn muốn xóa ${selectedSchedules.length} buổi học đã chọn không? Hành động không thể hoàn tác.`,
      action: async () => {
        setConfirmDialog({ show: false, action: null });
        try {
          await Promise.all(selectedSchedules.map(id => axios.delete(`${API_URL}/api/schedules/${id}`)));
          showToast(`Đã xóa thành công ${selectedSchedules.length} buổi học!`, 'success');
          setSelectedSchedules([]);
          fetchData();
        } catch { 
          showToast('Có lỗi khi xóa một số lịch!', 'error'); 
          fetchData();
        }
      }
    });
  };

  const handleEdit = (s) => {
    setEditingSchedule(s);
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
    setShowModal(false); setEditingSchedule(null);
    setFormData({ MaLopHocPhan:'', NgayHoc:'', NgayBatDau:'', PhongHoc:'', tanSuat:1, thu1:'', thu2:'', tietBatDau1:'', soTiet1:'', tietBatDau2:'', soTiet2:'' });
    setFormErrors({}); setIsRecurring(true);
  };

  if (loading) return <ScheduleSkeleton />;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 px-4">
      <AnimatePresence>
        {toast.show && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-5 py-3.5 rounded border-l-4 shadow-xl ${toast.type === 'success' ? 'bg-white border-green-500' : 'bg-white border-red-500'}`}
          >
            {toast.type === 'success' ? <CheckCircle2 className="text-green-500 w-5 h-5" /> : <AlertCircle className="text-red-500 w-5 h-5" />}
            <p className="font-bold text-sm text-gray-800">{toast.message}</p>
          </motion.div>
        )}
      </AnimatePresence>
{/* CONFIRM DIALOG - THÊM VÀO SAU PHẦN TOAST */}
<AnimatePresence>
  {confirmDialog.show && (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/50"
        onClick={() => setConfirmDialog({ show: false, title: '', message: '', action: null })}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm z-10"
      >
        <h4 className="text-base font-bold text-gray-800 mb-2">{confirmDialog.title}</h4>
        <p className="text-sm text-gray-600 mb-5">{confirmDialog.message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={() => setConfirmDialog({ show: false, title: '', message: '', action: null })}
            className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-200"
          >
            Hủy
          </button>
          <button
            onClick={() => confirmDialog.action && confirmDialog.action()}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-bold hover:bg-orange-600"
          >
            Xác nhận
          </button>
        </div>
      </motion.div>
    </div>
  )}
</AnimatePresence>
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-8 shadow-xl text-white flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 p-3 rounded-full shrink-0"><CalendarIcon className="w-6 h-6 text-white" /></div>
          <div>
            <h2 className="text-2xl font-bold">Quản lý lịch học</h2>
            <p className="text-orange-100 text-sm mt-0.5">Xếp lịch giảng dạy linh hoạt theo tiết</p>
          </div>
        </div>
        <button onClick={() => { handleCloseModal(); setShowModal(true); }}
          className="bg-white text-orange-600 px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:scale-105"
        ><Plus className="w-5 h-5"/> Xếp lịch học</button>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input type="text" placeholder="Tìm kiếm mã lớp học phần, tên môn..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl shadow-sm outline-none focus:border-orange-500 text-sm font-medium"
          />
        </div>
        {selectedSchedules.length > 0 && (
          <button onClick={handleDeleteSelected} className="w-full md:w-auto shrink-0 bg-red-50 text-red-600 px-5 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 border border-red-200 hover:bg-red-500 hover:text-white transition-all shadow-sm">
            <Trash2 className="w-5 h-5" /> Xóa {selectedSchedules.length} mục đã chọn
          </button>
        )}
      </div>

      <div className="space-y-6">
        {groupedSchedules.length > 0 ? groupedSchedules.map(([date, items]) => (
          <div key={date} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-gray-50 px-5 py-3 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-bold text-gray-800 text-sm md:text-base">▼ {getDayAndDateStr(date)}</h3>
              <span className="bg-orange-50 text-orange-600 text-xs font-bold px-3 py-1 rounded-full border border-orange-100">
                {items.length} buổi học
              </span>
            </div>
            <div className="divide-y divide-gray-100">
              {items.map(s => {
                const p = parsePeriods(s.CaHoc);
                const soTietHienThi = s.SoTiet || (p.start > 0 ? (p.end - p.start + 1) : '?');
                return (
                <div key={s.MaLichHoc} className="p-4 flex flex-col md:flex-row items-center gap-4 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center justify-center w-full md:w-auto md:pl-2">
                    <input 
                      type="checkbox" 
                      checked={selectedSchedules.includes(s.MaLichHoc)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedSchedules(prev => [...prev, s.MaLichHoc]);
                        else setSelectedSchedules(prev => prev.filter(id => id !== s.MaLichHoc));
                      }}
                      className="w-5 h-5 text-orange-500 rounded border-gray-300 focus:ring-orange-500 cursor-pointer"
                    />
                  </div>
                  <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-4 items-center w-full">
                    <div className="col-span-2 md:col-span-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Thời gian ({soTietHienThi} tiết)</span>
                      <span className="font-black text-orange-700 bg-orange-50 px-3 py-1 rounded-lg text-xs border border-orange-100 inline-block">
                        {formatCaHocToDisplay(s.CaHoc, s.SoTiet, sysConfig.periods)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">Phòng</span>
                      <span className="font-bold text-gray-800 flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-red-500"/> P.{s.PhongHoc}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">Môn học</span>
                      <span className="font-semibold text-gray-800 text-sm line-clamp-1">{s.TenMonHoc}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">Lớp học phần</span>
                      <span className="font-mono text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-100">{s.MaLopHocPhan}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">Giảng viên</span>
                      <span className="font-medium text-gray-600 text-sm line-clamp-1">{s.TenGiangVien}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0 border-gray-100">
                    <button onClick={() => handleEdit(s)} className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-bold text-gray-700 hover:text-orange-600 hover:border-orange-300 transition-colors">
                      <Edit className="w-3.5 h-3.5"/> Sửa
                    </button>
                    <button onClick={() => handleDelete(s.MaLichHoc)} className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-bold text-gray-700 hover:text-red-600 hover:border-red-300 transition-colors">
                      <Trash2 className="w-3.5 h-3.5"/> Xóa
                    </button>
                  </div>
                </div>
              )})}
            </div>
          </div>
        )) : (
          <div className="text-center py-16 bg-white border border-gray-200 rounded-xl shadow-sm">
            <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium text-sm">Chưa có lịch học nào được xếp.</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleCloseModal}/>
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 15 }}
              className="relative bg-white rounded-xl w-full max-w-[700px] shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-orange-500"/>
                  {editingSchedule ? 'Cập nhật lịch học' : 'Xếp lịch học mới'}
                </h3>
                <button onClick={handleCloseModal} className="p-1.5 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
                  <X className="w-5 h-5"/>
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-4">
                <form id="schedule-form" onSubmit={handleSubmit} noValidate className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Lớp học phần <span className="text-red-500">*</span>
                    </label>
                    <select value={formData.MaLopHocPhan}
                      onChange={e => handleFieldChange('MaLopHocPhan', e.target.value)}
                      disabled={!!editingSchedule}
                      className={`w-full p-2.5 border rounded-lg outline-none text-sm transition-all ${
                        editingSchedule
                          ? 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed opacity-90'
                          : `bg-white focus:border-orange-500 ${formErrors.MaLopHocPhan ? 'border-red-500' : 'border-gray-300'}`
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
                        
                        if (!editingSchedule) {
                          if (isRecurring) {
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
                    {formErrors.MaLopHocPhan && <p className="text-red-500 text-xs mt-1">{formErrors.MaLopHocPhan}</p>}

                    {formData.MaLopHocPhan && selectedLHPInfo && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                        className="mt-3 p-4 bg-orange-50 border border-orange-100 rounded-xl shadow-sm overflow-hidden"
                      >
                        <div className="flex items-center text-sm w-full gap-2">
                          <BookOpen className="w-5 h-5 text-orange-500"/>
                          <span className="font-semibold text-gray-700">Tổng số tiết môn học:</span>
                          <span className="text-orange-600 font-black text-lg ml-1">{selectedLHPInfo.tongTiet} tiết ({selectedLHPInfo.tc} tín chỉ)</span>
                        </div>
                        {selectedLHPInfo.hoanThanh && !editingSchedule && (
                          <div className="mt-3 flex items-center gap-2 text-green-700 bg-green-100 border border-green-200 rounded-lg px-3 py-2 text-xs font-bold">
                            <CheckCircle2 className="w-4 h-4"/> Môn học này đã được xếp đủ số tiết quy định.
                          </div>
                        )}
                      </motion.div>
                    )}

                    {editingSchedule && (
                      <p className="text-xs text-orange-600 mt-1.5 font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5"/>
                        Không thể thay đổi lớp học phần khi đang cập nhật lịch đã xếp
                      </p>
                    )}
                  </div>

                  {!editingSchedule && (
                    <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
                      <button type="button" onClick={() => setIsRecurring(true)}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border transition-all ${isRecurring ? 'bg-orange-500 text-white shadow-sm border-orange-600' : 'text-gray-500 border-transparent'}`}
                      ><Repeat className="w-3.5 h-3.5"/> Lặp định kỳ</button>
                      <button type="button" onClick={() => setIsRecurring(false)}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border transition-all ${!isRecurring ? 'bg-orange-500 text-white shadow-sm border-orange-600' : 'text-gray-500 border-transparent'}`}
                      ><Clock className="w-3.5 h-3.5"/> Học bù (1 buổi)</button>
                    </div>
                  )}

                  <div className="p-5 border border-gray-200 rounded-xl bg-gray-50/50 space-y-5">
                    {/* KHỐI LẶP ĐỊNH KỲ */}
                    {isRecurring && !editingSchedule ? (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Tần suất học / Tuần <span className="text-red-500">*</span></label>
                            <select value={formData.tanSuat} onChange={e => setFormData(p => ({ ...p, tanSuat: parseInt(e.target.value), thu2: '', tietBatDau2: '', soTiet2: '' }))} className="w-full p-2.5 bg-white border border-gray-300 rounded-lg outline-none text-sm font-bold text-gray-700">
                              {sysConfig.tanSuat.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Phòng học <span className="text-red-500">*</span></label>
                            <select value={formData.PhongHoc} onChange={e => handleFieldChange('PhongHoc', e.target.value)} className={`w-full p-2.5 bg-white border rounded-lg outline-none text-sm focus:border-orange-500 ${formErrors.PhongHoc ? 'border-red-500' : 'border-gray-300'}`}>
                              <option value="">-- Chọn Phòng --</option>
                              {sysConfig.rooms.map(r => <option key={r} value={r}>Phòng {r}</option>)}
                            </select>
                            {formErrors.PhongHoc && <p className="text-red-500 text-xs mt-1">{formErrors.PhongHoc}</p>}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Ngày bắt đầu học <span className="text-red-500">*</span></label>
                            <input type="date" value={formData.NgayBatDau} onChange={e => handleFieldChange('NgayBatDau', e.target.value)} className={`w-full p-2.5 bg-white border rounded-lg outline-none text-sm focus:border-orange-500 ${formErrors.NgayBatDau ? 'border-red-500 focus:border-red-500' : 'border-gray-300'}`}/>
                            {formErrors.NgayBatDau ? (
                              <p className="text-red-500 text-[11px] mt-1.5 font-bold flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {formErrors.NgayBatDau}</p>
                            ) : (formData.NgayBatDau && formData.thu1 && sysConfig.thuList.length > 0) ? (
                              <p className="text-blue-600 text-[11px] mt-1.5 font-bold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5"/> ✓ Học vào {sysConfig.thuList.find(t=>String(t.value) === String(formData.thu1))?.label} hàng tuần</p>
                            ) : null}
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Dự kiến kết thúc</label>
                            <input type="text" value={previewSchedule.length > 0 ? getDayAndDateStr(getLocalYYYYMMDD(previewSchedule[previewSchedule.length - 1].date)) : ''} disabled placeholder="Hệ thống tự động tính toán..." className="w-full p-2.5 bg-gray-100 border border-gray-200 rounded-lg text-sm font-bold text-gray-500 cursor-not-allowed"/>
                          </div>
                        </div>

                        <div className="p-4 border border-gray-200 rounded-lg bg-white space-y-3">
                          <label className="block text-sm font-bold text-orange-600 uppercase border-b pb-2 mb-3">Buổi 1</label>
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Thứ học <span className="text-red-500">*</span></label>
                              <select value={formData.thu1} onChange={e => handleFieldChange('thu1', e.target.value)} className={`w-full p-2.5 bg-gray-50 border rounded-lg outline-none text-sm focus:border-orange-500 ${formErrors.thu1 ? 'border-red-500' : 'border-gray-300'}`}>
                                <option value="">Chọn</option>
                                {sysConfig.thuList.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Tiết bắt đầu <span className="text-red-500">*</span></label>
                              <select value={formData.tietBatDau1} onChange={e => handleFieldChange('tietBatDau1', e.target.value)} className={`w-full p-2.5 bg-gray-50 border rounded-lg outline-none text-sm focus:border-orange-500 ${formErrors.buoi1 ? 'border-red-500' : 'border-gray-300'}`}>
                                <option value="">Chọn Tiết</option>
                                {Object.keys(sysConfig.periods).map(k => <option key={k} value={k}>Tiết {k} ({sysConfig.periods[k].start})</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Số tiết học <span className="text-red-500">*</span></label>
                              <input type="number" min="2" max="5" placeholder="VD: 3" value={formData.soTiet1} onChange={e => handleFieldChange('soTiet1', e.target.value)} className={`w-full p-2.5 bg-gray-50 border rounded-lg outline-none text-sm focus:border-orange-500 ${formErrors.buoi1 ? 'border-red-500' : 'border-gray-300'}`}/>
                            </div>
                          </div>
                          {formErrors.buoi1 && <p className="text-red-500 text-[11px] font-bold flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {formErrors.buoi1}</p>}
                        </div>

                        {formData.tanSuat === 2 && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="p-4 border border-gray-200 rounded-lg bg-white space-y-3">
                            <label className="block text-sm font-bold text-orange-600 uppercase border-b pb-2 mb-3">Buổi 2</label>
                            <div className="grid grid-cols-3 gap-3">
                              <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Thứ học <span className="text-red-500">*</span></label>
                                <select value={formData.thu2} onChange={e => handleFieldChange('thu2', e.target.value)} className={`w-full p-2.5 bg-gray-50 border rounded-lg outline-none text-sm focus:border-orange-500 ${formErrors.thu2 ? 'border-red-500' : 'border-gray-300'}`}>
                                  <option value="">Chọn</option>
                                  {sysConfig.thuList.map(t => <option key={t.value} value={t.value} disabled={String(t.value) === formData.thu1}>{t.label}</option>)}
                                </select>
                                {formErrors.thu2 && <p className="text-red-500 text-[10px] mt-1">{formErrors.thu2}</p>}
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Tiết bắt đầu <span className="text-red-500">*</span></label>
                                <select value={formData.tietBatDau2} onChange={e => handleFieldChange('tietBatDau2', e.target.value)} className={`w-full p-2.5 bg-gray-50 border rounded-lg outline-none text-sm focus:border-orange-500 ${formErrors.buoi2 ? 'border-red-500' : 'border-gray-300'}`}>
                                  <option value="">Chọn Tiết</option>
                                  {Object.keys(sysConfig.periods).map(k => <option key={k} value={k}>Tiết {k} ({sysConfig.periods[k].start})</option>)}
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Số tiết học <span className="text-red-500">*</span></label>
                                <input type="number" min="2" max="5" placeholder="VD: 3" value={formData.soTiet2} onChange={e => handleFieldChange('soTiet2', e.target.value)} className={`w-full p-2.5 bg-gray-50 border rounded-lg outline-none text-sm focus:border-orange-500 ${formErrors.buoi2 ? 'border-red-500' : 'border-gray-300'}`}/>
                              </div>
                            </div>
                            {formErrors.buoi2 && <p className="text-red-500 text-[11px] font-bold flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {formErrors.buoi2}</p>}
                          </motion.div>
                        )}
                      </>
                    ) : (
                      // KHỐI HỌC BÙ / SỬA (MỘT BUỔI)
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Ngày học <span className="text-red-500">*</span></label>
                            <input type="date" value={formData.NgayHoc} onChange={e => handleFieldChange('NgayHoc', e.target.value)} className={`w-full p-2.5 border rounded-lg text-sm ${formErrors.NgayHoc ? 'border-red-500' : 'border-gray-300'}`}/>
                            {formErrors.NgayHoc && <p className="text-red-500 text-[11px] mt-1"><AlertCircle className="w-3 h-3 inline"/>{formErrors.NgayHoc}</p>}
                            {!formErrors.NgayHoc && formData.NgayHoc && (
                               <p className="text-blue-600 text-[11px] mt-1.5 font-bold flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5"/> Lịch học: {getDayAndDateStr(formData.NgayHoc)}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Phòng học <span className="text-red-500">*</span></label>
                            <select value={formData.PhongHoc} onChange={e => handleFieldChange('PhongHoc', e.target.value)} className={`w-full p-2.5 border rounded-lg text-sm ${formErrors.PhongHoc ? 'border-red-500' : 'border-gray-300'}`}>
                              <option value="">-- Chọn Phòng --</option>
                              {sysConfig.rooms.map(r => <option key={r} value={r}>Phòng {r}</option>)}
                            </select>
                            {formErrors.PhongHoc && <p className="text-red-500 text-[11px] mt-1">{formErrors.PhongHoc}</p>}
                          </div>
                        </div>

                        <div className="p-4 border rounded-lg bg-white grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Tiết bắt đầu <span className="text-red-500">*</span></label>
                            <select value={formData.tietBatDau1} onChange={e => handleFieldChange('tietBatDau1', e.target.value)} className={`w-full p-2.5 border rounded-lg text-sm ${formErrors.buoi1 ? 'border-red-500' : 'border-gray-300'}`}>
                              <option value="">Chọn Tiết</option>
                              {Object.keys(sysConfig.periods).map(k => <option key={k} value={k}>Tiết {k} ({sysConfig.periods[k].start})</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Số tiết học <span className="text-red-500">*</span></label>
                            <input type="number" min="2" max="5" value={formData.soTiet1} onChange={e => handleFieldChange('soTiet1', e.target.value)} className={`w-full p-2.5 border rounded-lg text-sm ${formErrors.buoi1 ? 'border-red-500' : 'border-gray-300'}`}/>
                          </div>
                          {formErrors.buoi1 && <div className="col-span-2 text-red-500 text-[11px] font-bold"><AlertCircle className="w-3 h-3 inline"/> {formErrors.buoi1}</div>}
                        </div>
                      </div>
                    )}
                  </div>
                </form>
              </div>

              <div className="p-4 border-t bg-gray-50 flex gap-3 justify-end">
                <button type="button" onClick={handleCloseModal} className="px-5 py-2 bg-gray-200 rounded-lg text-sm font-semibold hover:bg-gray-300 text-gray-700">Hủy</button>
                <button 
                  type="button" 
                  onClick={handleSubmit} 
                  disabled={!!selectedLHPInfo?.hoanThanh && !editingSchedule} 
                  className="px-5 py-2 bg-orange-500 text-white rounded-lg text-sm font-bold hover:bg-orange-600 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingSchedule ? 'Lưu thay đổi' : 'Xác nhận xếp lịch'}
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