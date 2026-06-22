import React from 'react';

const shimmer = 'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent';

const Bone = ({ className = '' }) => (
  <div className={`bg-gray-200/80 rounded-xl ${shimmer} ${className}`} />
);

export function StudentCourseRegistrationSkeleton() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-pulse pb-10">
      {/* HEADER TỔNG */}
      <div className="bg-gradient-to-r from-orange-200 to-orange-100 rounded-3xl p-8 flex items-center gap-5 h-36">
        <Bone className="w-16 h-16 !rounded-2xl !bg-white/40" />
        <div>
          <Bone className="h-8 w-64 mb-3 !bg-white/40" />
          <Bone className="h-5 w-80 !bg-white/30" />
        </div>
      </div>

      {/* Danh sách ĐÃ ĐĂNG KÝ */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <Bone className="h-6 w-64 mb-5" />
        <div className="overflow-x-auto">
          <div className="w-full text-left text-sm border-collapse min-w-[700px]">
            <div className="bg-slate-50/80 p-4 flex gap-6 rounded-t-xl">
              <Bone className="h-4 flex-1" />
              <Bone className="h-4 flex-1" />
              <Bone className="h-4 flex-1" />
              <Bone className="h-4 flex-1" />
            </div>
            <div className="divide-y divide-slate-50">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="p-4 flex gap-6 items-center">
                  <Bone className="h-4 flex-1" />
                  <Bone className="h-4 flex-1" />
                  <Bone className="h-4 flex-1" />
                  <Bone className="h-8 w-10 !rounded-lg" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Danh sách LỚP ĐANG MỞ */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <Bone className="h-6 w-80 mb-5" />
        <div className="overflow-x-auto">
          <div className="w-full text-left text-sm border-collapse min-w-[900px]">
            <div className="bg-slate-50/80 p-4 flex gap-6 rounded-t-xl">
              {[...Array(6)].map((_, i) => (
                <Bone key={i} className="h-4 flex-1" />
              ))}
            </div>
            <div className="divide-y divide-slate-50">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="p-4 flex gap-6 items-center">
                  {[...Array(5)].map((_, j) => (
                    <Bone key={j} className="h-4 flex-1" />
                  ))}
                  <Bone className="h-8 w-24 !rounded-xl" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function StudentAttendanceSkeleton() {
  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-pulse pb-12">
      {/* Header Panel */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden">
        <div>
          <Bone className="h-8 w-64 mb-3" />
          <Bone className="h-5 w-80" />
        </div>
        <Bone className="h-24 w-80 !rounded-2xl" />
      </div>

      {/* Main Layout (Split View) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-1 space-y-4">
          <Bone className="h-12 w-full !rounded-xl" />
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-[400px]">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50">
              <Bone className="h-5 w-40" />
            </div>
            <div className="p-3 space-y-3">
              {[...Array(4)].map((_, idx) => (
                <Bone key={idx} className="h-20 w-full !rounded-xl" />
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 h-full min-h-[500px] flex flex-col overflow-hidden">
            <div className="bg-orange-100 p-6 flex items-center justify-between gap-4 h-28">
               <Bone className="h-8 w-64" />
               <Bone className="h-16 w-32 !rounded-xl" />
            </div>
            <div className="p-6 space-y-4">
              {[...Array(3)].map((_, idx) => (
                <Bone key={idx} className="h-24 w-full !rounded-2xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function StudentSupportSkeleton() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-pulse pb-10">
      <div className="bg-gradient-to-r from-blue-200 to-blue-100 rounded-3xl p-8 h-36">
        <Bone className="h-8 w-64 mb-3 !bg-white/50" />
        <Bone className="h-5 w-96 !bg-white/40" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Bone className="h-32 w-full !rounded-2xl" />
        <Bone className="h-32 w-full !rounded-2xl" />
        <Bone className="h-32 w-full !rounded-2xl" />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <Bone className="h-6 w-48 mb-6" />
        <div className="space-y-4">
           {[...Array(4)].map((_, idx) => (
             <Bone key={idx} className="h-20 w-full !rounded-2xl" />
           ))}
        </div>
      </div>
    </div>
  );
}

export function StudentScheduleSkeleton() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-pulse pb-12">
      {/* Header */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <Bone className="h-8 w-64 mb-3" />
          <Bone className="h-5 w-80" />
        </div>
        <Bone className="h-12 w-48 !rounded-xl" />
      </div>
      
      <Bone className="h-14 w-full !rounded-2xl" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, idx) => (
          <div key={idx} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <Bone className="h-6 w-3/4 mb-4" />
            <div className="space-y-3">
              <Bone className="h-4 w-full" />
              <Bone className="h-4 w-5/6" />
              <Bone className="h-4 w-4/6" />
            </div>
            <div className="mt-4 pt-4 border-t border-gray-50 flex gap-2">
               <Bone className="h-8 w-1/2 !rounded-lg" />
               <Bone className="h-8 w-1/2 !rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function StudentOverviewSkeleton() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-pulse pb-10">
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between h-16 items-center">
        <Bone className="h-6 w-64" />
        <Bone className="h-8 w-8 !rounded-full" />
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
          <Bone className="h-64 w-full !rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

export function StudentProfileSkeleton() {
  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-pulse pb-10">
      <div className="bg-orange-200/50 rounded-3xl p-8 sm:p-10 h-64 flex items-center gap-8">
        <Bone className="w-32 h-32 !rounded-full !bg-white/60" />
        <div>
          <Bone className="h-10 w-64 mb-4 !bg-white/50" />
          <Bone className="h-6 w-48 mb-4 !bg-white/40" />
          <div className="flex gap-3">
             <Bone className="h-8 w-24 !rounded-full !bg-white/40" />
             <Bone className="h-8 w-24 !rounded-full !bg-white/40" />
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

export function StudentAnnouncementsSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-pulse pb-10">
      <div className="bg-orange-200/50 rounded-2xl p-6 h-28 flex items-center gap-4">
        <Bone className="w-10 h-10 !rounded-full !bg-white/60" />
        <div>
          <Bone className="h-8 w-48 mb-2 !bg-white/50" />
          <Bone className="h-5 w-80 !bg-white/40" />
        </div>
      </div>
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <Bone className="h-6 w-3/4 mb-4" />
            <div className="flex gap-4 mb-4">
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

export function StudentGradesSkeleton() {
  return (
    <div className="space-y-6 animate-pulse pb-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Bone className="h-8 w-64 mb-3" />
          <Bone className="h-5 w-80" />
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Bone className="h-32 w-full !rounded-2xl" />
        <Bone className="h-32 w-full !rounded-2xl" />
      </div>

      {/* Table Semester Card */}
      {[...Array(2)].map((_, i) => (
        <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <Bone className="h-6 w-48" />
          </div>
          <div className="p-6 space-y-4">
            <div className="flex gap-4">
              {[...Array(5)].map((_, j) => (
                <Bone key={j} className="h-4 flex-1" />
              ))}
            </div>
            {[...Array(3)].map((_, j) => (
              <div key={j} className="flex gap-4 items-center pt-2">
                {[...Array(4)].map((_, k) => (
                  <Bone key={k} className="h-4 flex-1" />
                ))}
                <Bone className="h-8 w-16 !rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default {
  StudentCourseRegistrationSkeleton,
  StudentAttendanceSkeleton,
  StudentSupportSkeleton,
  StudentScheduleSkeleton,
  StudentOverviewSkeleton,
  StudentProfileSkeleton,
  StudentAnnouncementsSkeleton,
  StudentGradesSkeleton
};
