import React from 'react';

const shimmer = 'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent';

const Bone = ({ className = '' }) => (
  <div className={`bg-gray-200/80 rounded-xl ${shimmer} ${className}`} />
);

/**
 * Skeleton layout cho trang có Header banner + Search bar + Table
 * (FacultyManagement, StudentManagement, TeacherManagement, SubjectManagement,
 *  ClassManagement, AnnouncementManagement, UserAccountManagement, TeachingAssignment)
 */
export function TableSkeleton({ columns = 5, rows = 6, accentColor = 'orange' }) {
  const gradientClass = `bg-gradient-to-r from-${accentColor}-200 to-${accentColor}-100`;
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header Banner */}
      <div className={`${gradientClass} rounded-2xl p-8 h-28`}>
        <Bone className="h-7 w-64 mb-3 !bg-white/40" />
        <Bone className="h-4 w-96 !bg-white/30" />
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="flex gap-4">
          <Bone className="flex-1 h-12" />
          <Bone className="w-32 h-12" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Table Header */}
        <div className={`${gradientClass} px-6 py-5 flex gap-6`}>
          {[...Array(columns)].map((_, i) => (
            <Bone key={i} className="h-4 flex-1 !bg-white/40 !rounded-md" />
          ))}
        </div>
        {/* Table Rows */}
        <div className="divide-y divide-gray-100">
          {[...Array(rows)].map((_, rowIdx) => (
            <div key={rowIdx} className="px-6 py-5 flex gap-6 items-center">
              {[...Array(columns)].map((_, colIdx) => (
                <Bone
                  key={colIdx}
                  className={`h-4 flex-1 !rounded-md ${colIdx === 0 ? '!w-40 flex-none' : ''}`}
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
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-200 to-orange-100 rounded-2xl p-8 h-28">
        <Bone className="h-7 w-72 mb-3 !bg-white/40" />
        <Bone className="h-4 w-80 !bg-white/30" />
      </div>

      {/* Selector Row */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Bone className="h-12" />
          <Bone className="h-12" />
          <Bone className="h-12" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-orange-200 to-orange-100 px-6 py-5 flex gap-6">
          {[...Array(7)].map((_, i) => (
            <Bone key={i} className="h-4 flex-1 !bg-white/40 !rounded-md" />
          ))}
        </div>
        <div className="divide-y divide-gray-100">
          {[...Array(5)].map((_, i) => (
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
    <div className="space-y-6 animate-pulse max-w-7xl mx-auto pb-12 px-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-200 to-orange-100 rounded-2xl p-8 h-28 flex items-center justify-between">
        <div>
          <Bone className="h-7 w-56 mb-3 !bg-white/40" />
          <Bone className="h-4 w-80 !bg-white/30" />
        </div>
        <Bone className="h-12 w-40 !bg-white/40" />
      </div>

      {/* Search */}
      <Bone className="h-12 w-full" />

      {/* Timeline cards */}
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="bg-gray-100 px-5 py-3 flex justify-between items-center">
            <Bone className="h-5 w-48" />
            <Bone className="h-6 w-20 !rounded-full" />
          </div>
          <div className="divide-y divide-gray-100">
            {[...Array(3)].map((_, j) => (
              <div key={j} className="p-4 flex items-center gap-6">
                <Bone className="h-6 w-16 !rounded-full" />
                <Bone className="h-4 w-20" />
                <Bone className="h-4 flex-1" />
                <Bone className="h-4 w-32" />
                <Bone className="h-4 w-28" />
                <div className="flex gap-2">
                  <Bone className="h-8 w-16 !rounded-lg" />
                  <Bone className="h-8 w-16 !rounded-lg" />
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
    <div className="max-w-7xl mx-auto space-y-5 animate-pulse">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-200 to-orange-100 rounded-2xl p-6 flex items-center gap-4">
        <Bone className="w-14 h-14 !rounded-xl !bg-white/40" />
        <div className="flex-1">
          <Bone className="h-6 w-56 mb-2 !bg-white/40" />
          <Bone className="h-4 w-80 !bg-white/30" />
        </div>
        <Bone className="h-12 w-28 !rounded-xl !bg-white/30" />
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-3">
        <Bone className="h-10 w-48" />
        <Bone className="h-10 w-40" />
        <Bone className="h-10 w-40" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gray-100 px-4 py-4 flex gap-6">
          {[...Array(6)].map((_, i) => (
            <Bone key={i} className="h-4 flex-1 !rounded-md" />
          ))}
        </div>
        <div className="divide-y divide-gray-50">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="px-4 py-4 flex gap-6 items-center">
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
    <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-200 to-orange-100 rounded-3xl p-8 flex items-center gap-5">
        <Bone className="w-18 h-18 !rounded-2xl !bg-white/40" />
        <div>
          <Bone className="h-8 w-48 mb-2 !bg-white/40" />
          <Bone className="h-5 w-72 !bg-white/30" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white rounded-2xl p-1.5 shadow-sm border border-gray-100 w-fit">
        <Bone className="h-10 w-56 !rounded-xl" />
        <Bone className="h-10 w-48 !rounded-xl ml-1" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gray-100 px-4 py-4 flex gap-6">
          {[...Array(5)].map((_, i) => (
            <Bone key={i} className="h-4 flex-1 !rounded-md" />
          ))}
        </div>
        <div className="divide-y divide-gray-50">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="px-4 py-4 flex gap-6 items-center">
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
