import React from 'react';

const shimmer = 'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent';

const Bone = ({ className = '' }) => (
  <div className={`bg-slate-200/80 rounded-xl ${shimmer} ${className}`} />
);

export function TeacherOverviewSkeleton() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-pulse pb-10">
      <div className="bg-gradient-to-r from-amber-50 to-amber-100/50 p-5 rounded-2xl shadow-sm border border-amber-100/50 flex justify-between h-16 items-center">
        <Bone className="h-6 w-64 !bg-amber-200/50" />
        <Bone className="h-10 w-10 !rounded-full !bg-amber-200/50" />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Bone className="h-32 w-full !rounded-2xl" />
            <Bone className="h-32 w-full !rounded-2xl" />
            <Bone className="h-32 w-full !rounded-2xl" />
            <Bone className="h-32 w-full !rounded-2xl" />
          </div>
          <Bone className="h-[400px] w-full !rounded-2xl" />
        </div>
        <div className="xl:col-span-1">
          <Bone className="h-[550px] w-full !rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

export function TeacherStudentsSkeleton() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-pulse pb-10">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-50 to-amber-100/50 rounded-3xl p-8 h-32 flex flex-col justify-center shadow-sm border border-amber-100/50">
        <Bone className="h-8 w-64 mb-3 !bg-amber-200/50" />
        <Bone className="h-5 w-96 !bg-amber-200/40" />
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
        <div className="bg-gradient-to-r from-amber-50 to-amber-100/60 px-6 py-5 flex gap-6 border-b border-amber-100">
          {[...Array(5)].map((_, i) => (
            <Bone key={i} className={`h-4 ${i === 0 ? 'w-16 flex-none' : 'flex-1'} !bg-amber-200/60 !rounded-md`} />
          ))}
        </div>
        <div className="divide-y divide-gray-50">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="px-6 py-5 flex gap-6 items-center">
              {[...Array(5)].map((_, j) => (
                <Bone key={j} className={`h-4 ${j === 0 ? 'w-16 flex-none' : 'flex-1'} !rounded-md`} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function TeacherGradesSkeleton() {
  return (
    <div className="space-y-6 animate-pulse pb-10">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-50 to-amber-100/50 rounded-3xl p-8 h-32 flex flex-col justify-center shadow-sm border border-amber-100/50">
        <Bone className="h-8 w-72 mb-3 !bg-amber-200/50" />
        <Bone className="h-5 w-80 !bg-amber-200/40" />
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
        <div className="bg-gradient-to-r from-amber-50 to-amber-100/60 px-6 py-5 flex gap-6 border-b border-amber-100">
          {[...Array(7)].map((_, i) => (
            <Bone key={i} className="h-4 flex-1 !bg-amber-200/60 !rounded-md" />
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

export function TeacherAttendanceSkeleton() {
  return (
    <div className="space-y-6 animate-pulse pb-10">
      <div className="bg-gradient-to-r from-amber-50 to-amber-100/50 rounded-3xl p-8 h-32 flex flex-col justify-center shadow-sm border border-amber-100/50">
        <Bone className="h-8 w-72 mb-3 !bg-amber-200/50" />
        <Bone className="h-5 w-80 !bg-amber-200/40" />
      </div>

      <div className="bg-[#FFFFFF] rounded-2xl shadow-sm border border-[#E5E7EB] p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Bone className="h-14" />
          <Bone className="h-14" />
        </div>
      </div>

      <div className="bg-[#FFFFFF] rounded-2xl shadow-sm border border-[#E5E7EB] overflow-hidden">
        <div className="bg-gradient-to-r from-amber-50 to-amber-100/60 px-6 py-5 flex gap-6 border-b border-amber-100">
          {[...Array(6)].map((_, i) => (
            <Bone key={i} className="h-4 flex-1 !bg-amber-200/60 !rounded-md" />
          ))}
        </div>
        <div className="divide-y divide-gray-50">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="px-6 py-5 flex gap-6 items-center">
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

export function TeacherScheduleSkeleton() {
  return (
    <div className="space-y-6 animate-pulse max-w-7xl mx-auto pb-12 px-4 md:px-0">
      <div className="bg-gradient-to-r from-amber-50 to-amber-100/50 rounded-3xl p-8 h-32 flex flex-col md:flex-row items-center justify-between shadow-sm border border-amber-100/50 gap-4">
        <div className="w-full">
          <Bone className="h-8 w-56 mb-3 !bg-amber-200/50" />
          <Bone className="h-5 w-80 !bg-amber-200/40" />
        </div>
        <Bone className="h-12 w-40 shrink-0 !bg-amber-200/50" />
      </div>

      <div className="bg-[#FFFFFF] rounded-2xl shadow-sm border border-[#E5E7EB] p-4">
        <Bone className="h-12 w-full" />
      </div>

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
                <Bone className="h-5 flex-1" />
                <Bone className="h-5 w-32 shrink-0" />
                <Bone className="h-5 w-28 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function TeacherProfileSkeleton() {
  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-pulse pb-10">
      <div className="bg-gradient-to-r from-amber-50 to-amber-100/50 rounded-3xl p-8 sm:p-10 h-64 flex flex-col md:flex-row items-center md:items-start gap-8 shadow-sm border border-amber-100/50">
        <Bone className="w-36 h-36 !rounded-full !bg-amber-200/60 border-4 border-white shadow-sm" />
        <div className="mt-2 text-center md:text-left flex-1">
          <Bone className="h-10 w-64 mb-4 mx-auto md:mx-0 !bg-amber-200/50" />
          <Bone className="h-6 w-48 mb-6 mx-auto md:mx-0 !bg-amber-200/40" />
          <div className="flex gap-3 justify-center md:justify-start">
             <Bone className="h-10 w-28 !rounded-full !bg-amber-200/50" />
             <Bone className="h-10 w-28 !rounded-full !bg-amber-200/50" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Bone className="h-80 w-full !rounded-2xl" />
        <Bone className="h-80 w-full !rounded-2xl" />
      </div>
    </div>
  );
}

export function TeacherAnnouncementsSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-pulse pb-10">
      <div className="bg-gradient-to-r from-amber-50 to-amber-100/50 rounded-3xl p-8 h-32 flex items-center gap-5 shadow-sm border border-amber-100/50">
        <Bone className="w-14 h-14 !rounded-xl !bg-amber-200/60" />
        <div>
          <Bone className="h-8 w-56 mb-3 !bg-amber-200/50" />
          <Bone className="h-5 w-80 !bg-amber-200/40" />
        </div>
      </div>
      <div className="space-y-5">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-[#FFFFFF] rounded-2xl shadow-sm border border-[#E5E7EB] p-6 hover:shadow-md transition-shadow">
            <Bone className="h-6 w-3/4 mb-5" />
            <div className="flex gap-4 mb-5">
              <Bone className="h-8 w-32 !rounded-lg" />
              <Bone className="h-8 w-40 !rounded-lg" />
            </div>
            <Bone className="h-20 w-full !rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function TeacherSupportSkeleton() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-pulse pb-10">
      <div className="bg-gradient-to-r from-amber-50 to-amber-100/50 rounded-3xl p-8 h-36 shadow-sm border border-amber-100/50 flex flex-col justify-center">
        <Bone className="h-8 w-64 mb-3 !bg-amber-200/50" />
        <Bone className="h-5 w-96 !bg-amber-200/40" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Bone className="h-36 w-full !rounded-2xl" />
        <Bone className="h-36 w-full !rounded-2xl" />
        <Bone className="h-36 w-full !rounded-2xl" />
      </div>

      <div className="bg-[#FFFFFF] rounded-3xl shadow-sm border border-[#E5E7EB] p-8">
        <Bone className="h-6 w-48 mb-6" />
        <div className="space-y-5">
           {[...Array(4)].map((_, idx) => (
             <Bone key={idx} className="h-24 w-full !rounded-2xl" />
           ))}
        </div>
      </div>
    </div>
  );
}

export default {
  TeacherOverviewSkeleton,
  TeacherStudentsSkeleton,
  TeacherGradesSkeleton,
  TeacherAttendanceSkeleton,
  TeacherScheduleSkeleton,
  TeacherProfileSkeleton,
  TeacherAnnouncementsSkeleton,
  TeacherSupportSkeleton
};
