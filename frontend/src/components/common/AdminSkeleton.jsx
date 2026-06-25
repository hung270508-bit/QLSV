import React from 'react';

const shimmer = 'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent';

const Bone = ({ className = '' }) => (
  <div className={`bg-slate-200/80 rounded-xl ${shimmer} ${className}`} />
);

/**
 * Skeleton layout cho trang có Header banner + Search bar + Table
 */
export function TableSkeleton({ columns = 5, rows = 6 }) {
  return (
    <div className="space-y-6 animate-pulse pb-10">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-3xl p-8 h-32 flex flex-col justify-center shadow-sm border border-orange-100/50">
        <Bone className="h-8 w-64 mb-3 !bg-orange-200/50" />
        <Bone className="h-5 w-96 !bg-orange-200/40" />
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-[#FFFFFF] rounded-2xl shadow-sm border border-[#E5E7EB] p-5">
        <div className="flex flex-col md:flex-row gap-4">
          <Bone className="flex-1 h-12" />
          <Bone className="w-full md:w-32 h-12" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#FFFFFF] rounded-2xl shadow-sm border border-[#E5E7EB] overflow-hidden">
        {/* Table Header */}
        <div className="bg-gradient-to-r from-orange-50 to-orange-100/60 px-6 py-5 flex gap-6 border-b border-[#FFF7D6]">
          {[...Array(columns)].map((_, i) => (
            <Bone key={i} className={`h-4 ${i === 0 ? 'w-16 flex-none' : 'flex-1'} !bg-orange-200/60 !rounded-md`} />
          ))}
        </div>
        {/* Table Rows */}
        <div className="divide-y divide-gray-50">
          {[...Array(rows)].map((_, rowIdx) => (
            <div key={rowIdx} className="px-6 py-5 flex gap-6 items-center hover:bg-slate-50/50 transition-colors">
              {[...Array(columns)].map((_, colIdx) => (
                <Bone
                  key={colIdx}
                  className={`h-4 ${colIdx === 0 ? 'w-16 flex-none' : 'flex-1'} !rounded-md`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton layout cho trang GradeManagement (có selector + table)
 */
export function GradeSkeleton() {
  return (
    <div className="space-y-6 animate-pulse pb-10">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-3xl p-8 h-32 flex flex-col justify-center shadow-sm border border-orange-100/50">
        <Bone className="h-8 w-72 mb-3 !bg-orange-200/50" />
        <Bone className="h-5 w-80 !bg-orange-200/40" />
      </div>

      {/* Selector Row */}
      <div className="bg-[#FFFFFF] rounded-2xl shadow-sm border border-[#E5E7EB] p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Bone className="h-14" />
          <Bone className="h-14" />
          <Bone className="h-14" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#FFFFFF] rounded-2xl shadow-sm border border-[#E5E7EB] overflow-hidden">
        <div className="bg-gradient-to-r from-orange-50 to-orange-100/60 px-6 py-5 flex gap-6 border-b border-[#FFF7D6]">
          {[...Array(7)].map((_, i) => (
            <Bone key={i} className="h-4 flex-1 !bg-orange-200/60 !rounded-md" />
          ))}
        </div>
        <div className="divide-y divide-gray-50">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="px-6 py-5 flex gap-6 items-center">
              {[...Array(7)].map((_, j) => (
                <Bone key={j} className="h-4 flex-1 !rounded-md" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton layout cho ScheduleManagement (timeline cards)
 */
export function ScheduleSkeleton() {
  return (
    <div className="space-y-6 animate-pulse max-w-7xl mx-auto pb-12 px-4 md:px-0">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-3xl p-8 h-32 flex flex-col md:flex-row items-center justify-between shadow-sm border border-orange-100/50 gap-4">
        <div className="w-full">
          <Bone className="h-8 w-56 mb-3 !bg-orange-200/50" />
          <Bone className="h-5 w-80 !bg-orange-200/40" />
        </div>
        <Bone className="h-12 w-40 shrink-0 !bg-orange-200/50" />
      </div>

      {/* Search */}
      <div className="bg-[#FFFFFF] rounded-2xl shadow-sm border border-[#E5E7EB] p-4">
        <Bone className="h-12 w-full" />
      </div>

      {/* Timeline cards */}
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl overflow-hidden shadow-sm">
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 flex justify-between items-center border-b border-slate-100">
            <Bone className="h-6 w-48 !bg-slate-200" />
            <Bone className="h-8 w-24 !rounded-full !bg-slate-200" />
          </div>
          <div className="divide-y divide-gray-50">
            {[...Array(3)].map((_, j) => (
              <div key={j} className="p-5 flex flex-col md:flex-row md:items-center gap-6">
                <Bone className="h-8 w-20 !rounded-full shrink-0" />
                <Bone className="h-5 w-24 shrink-0" />
                <Bone className="h-5 flex-1" />
                <Bone className="h-5 w-32 shrink-0" />
                <Bone className="h-5 w-28 shrink-0" />
                <div className="flex gap-3 shrink-0 mt-4 md:mt-0">
                  <Bone className="h-10 w-10 !rounded-xl" />
                  <Bone className="h-10 w-10 !rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton layout cho AdminRequests (bảng yêu cầu hỗ trợ)
 */
export function RequestsSkeleton() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-pulse pb-10">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-3xl p-8 flex items-center gap-6 shadow-sm border border-orange-100/50">
        <Bone className="w-16 h-16 !rounded-2xl !bg-orange-200/50" />
        <div className="flex-1">
          <Bone className="h-8 w-56 mb-3 !bg-orange-200/50" />
          <Bone className="h-5 w-80 !bg-orange-200/40" />
        </div>
        <Bone className="h-12 w-32 shrink-0 !rounded-xl !bg-orange-200/50" />
      </div>

      {/* Filters */}
      <div className="bg-[#FFFFFF] p-5 rounded-2xl shadow-sm border border-[#E5E7EB] flex flex-wrap gap-4">
        <Bone className="h-12 w-48" />
        <Bone className="h-12 w-40" />
        <Bone className="h-12 w-40" />
      </div>

      {/* Table */}
      <div className="bg-[#FFFFFF] rounded-2xl shadow-sm border border-[#E5E7EB] overflow-hidden">
        <div className="bg-gradient-to-r from-orange-50 to-orange-100/60 px-6 py-5 flex gap-6 border-b border-[#FFF7D6]">
          {[...Array(6)].map((_, i) => (
            <Bone key={i} className="h-4 flex-1 !bg-orange-200/60 !rounded-md" />
          ))}
        </div>
        <div className="divide-y divide-gray-50">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="px-6 py-5 flex gap-6 items-center hover:bg-slate-50/50 transition-colors">
              {[...Array(6)].map((_, j) => (
                <Bone key={j} className="h-4 flex-1 !rounded-md" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton cho AdminTrainingPoints (tabs + table)
 */
export function TrainingPointsSkeleton() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-pulse pb-10">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-3xl p-8 flex items-center gap-6 shadow-sm border border-orange-100/50">
        <Bone className="w-16 h-16 !rounded-2xl !bg-orange-200/50" />
        <div>
          <Bone className="h-8 w-56 mb-3 !bg-orange-200/50" />
          <Bone className="h-5 w-72 !bg-orange-200/40" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-[#FFFFFF] rounded-2xl p-1.5 shadow-sm border border-[#E5E7EB] w-fit">
        <Bone className="h-12 w-48 !rounded-xl" />
        <Bone className="h-12 w-48 !rounded-xl ml-2" />
      </div>

      {/* Table */}
      <div className="bg-[#FFFFFF] rounded-2xl shadow-sm border border-[#E5E7EB] overflow-hidden">
        <div className="bg-gradient-to-r from-orange-50 to-orange-100/60 px-6 py-5 flex gap-6 border-b border-[#FFF7D6]">
          {[...Array(5)].map((_, i) => (
            <Bone key={i} className="h-4 flex-1 !bg-orange-200/60 !rounded-md" />
          ))}
        </div>
        <div className="divide-y divide-gray-50">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="px-6 py-5 flex gap-6 items-center">
              {[...Array(5)].map((_, j) => (
                <Bone key={j} className="h-4 flex-1 !rounded-md" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default TableSkeleton;
