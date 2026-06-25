import React from 'react';

const shimmer = 'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent';

const Bone = ({ className = '' }) => (
  <div className={`bg-slate-200/80 rounded-xl ${shimmer} ${className}`} />
);

export function StudentCourseRegistrationSkeleton() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-pulse pb-10">
      {/* HEADER TỔNG */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-3xl p-8 flex items-center gap-6 h-36 shadow-sm border border-orange-100/50">
        <Bone className="w-16 h-16 !rounded-2xl !bg-orange-200/50" />
        <div>
          <Bone className="h-8 w-64 mb-3 !bg-orange-200/50" />
          <Bone className="h-5 w-80 !bg-orange-200/40" />
        </div>
      </div>

      {/* Danh sách ĐÃ ĐĂNG KÝ */}
      <div className="bg-[#FFFFFF] p-6 rounded-3xl shadow-sm border border-[#E5E7EB]">
        <Bone className="h-6 w-64 mb-6" />
        <div className="overflow-x-auto rounded-2xl border border-[#E5E7EB]">
          <div className="w-full text-left text-sm border-collapse min-w-[700px]">
            <div className="bg-gradient-to-r from-orange-50 to-orange-100/60 p-5 flex gap-6 border-b border-[#FFF7D6]">
              <Bone className="h-4 flex-1 !bg-orange-200/60" />
              <Bone className="h-4 flex-1 !bg-orange-200/60" />
              <Bone className="h-4 flex-1 !bg-orange-200/60" />
              <Bone className="h-4 flex-1 !bg-orange-200/60" />
            </div>
            <div className="divide-y divide-gray-50">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="p-5 flex gap-6 items-center">
                  <Bone className="h-4 flex-1" />
                  <Bone className="h-4 flex-1" />
                  <Bone className="h-4 flex-1" />
                  <Bone className="h-8 w-12 !rounded-lg" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Danh sách LỚP ĐANG MỞ */}
      <div className="bg-[#FFFFFF] p-6 rounded-3xl shadow-sm border border-[#E5E7EB]">
        <Bone className="h-6 w-80 mb-6" />
        <div className="overflow-x-auto rounded-2xl border border-[#E5E7EB]">
          <div className="w-full text-left text-sm border-collapse min-w-[900px]">
            <div className="bg-gradient-to-r from-orange-50 to-orange-100/60 p-5 flex gap-6 border-b border-[#FFF7D6]">
              {[...Array(6)].map((_, i) => (
                <Bone key={i} className="h-4 flex-1 !bg-orange-200/60" />
              ))}
            </div>
            <div className="divide-y divide-gray-50">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="p-5 flex gap-6 items-center hover:bg-slate-50/50 transition-colors">
                  {[...Array(5)].map((_, j) => (
                    <Bone key={j} className="h-4 flex-1" />
                  ))}
                  <Bone className="h-10 w-28 !rounded-xl" />
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
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-3xl p-8 shadow-sm border border-orange-100/50 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden">
        <div>
          <Bone className="h-8 w-64 mb-3 !bg-orange-200/50" />
          <Bone className="h-5 w-80 !bg-orange-200/40" />
        </div>
        <Bone className="h-24 w-80 !rounded-2xl !bg-orange-200/50" />
      </div>

      {/* Main Layout (Split View) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-1 space-y-5">
          <Bone className="h-14 w-full !rounded-xl" />
          <div className="bg-[#FFFFFF] rounded-2xl shadow-sm border border-[#E5E7EB] overflow-hidden h-[400px]">
            <div className="p-5 border-b border-[#E5E7EB] bg-slate-50/80">
              <Bone className="h-5 w-40" />
            </div>
            <div className="p-4 space-y-4">
              {[...Array(4)].map((_, idx) => (
                <Bone key={idx} className="h-20 w-full !rounded-xl" />
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2">
          <div className="bg-[#FFFFFF] rounded-2xl shadow-sm border border-[#E5E7EB] h-full min-h-[500px] flex flex-col overflow-hidden">
            <div className="bg-gradient-to-r from-orange-50 to-orange-100/60 p-6 flex items-center justify-between gap-4 h-28 border-b border-[#FFF7D6]">
               <Bone className="h-8 w-64 !bg-orange-200/60" />
               <Bone className="h-14 w-32 !rounded-xl !bg-orange-200/60" />
            </div>
            <div className="p-6 space-y-5">
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
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-3xl p-8 h-36 shadow-sm border border-orange-100/50 flex flex-col justify-center">
        <Bone className="h-8 w-64 mb-3 !bg-orange-200/50" />
        <Bone className="h-5 w-96 !bg-orange-200/40" />
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

export function StudentScheduleSkeleton() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-pulse pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-3xl p-8 shadow-sm border border-orange-100/50 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <Bone className="h-8 w-64 mb-3 !bg-orange-200/50" />
          <Bone className="h-5 w-80 !bg-orange-200/40" />
        </div>
        <Bone className="h-12 w-48 !rounded-xl !bg-orange-200/50" />
      </div>
      
      <Bone className="h-16 w-full !rounded-2xl" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, idx) => (
          <div key={idx} className="bg-[#FFFFFF] rounded-2xl shadow-sm border border-[#E5E7EB] p-6 hover:shadow-md transition-shadow">
            <Bone className="h-6 w-3/4 mb-5" />
            <div className="space-y-4">
              <Bone className="h-4 w-full" />
              <Bone className="h-4 w-5/6" />
              <Bone className="h-4 w-4/6" />
            </div>
            <div className="mt-5 pt-5 border-t border-gray-100 flex gap-3">
               <Bone className="h-10 w-1/2 !rounded-lg" />
               <Bone className="h-10 w-1/2 !rounded-lg" />
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
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-5 rounded-2xl shadow-sm border border-orange-100/50 flex justify-between h-16 items-center">
        <Bone className="h-6 w-64 !bg-orange-200/50" />
        <Bone className="h-10 w-10 !rounded-full !bg-orange-200/50" />
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

export function StudentProfileSkeleton() {
  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-pulse pb-10">
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-3xl p-8 sm:p-10 h-64 flex flex-col md:flex-row items-center md:items-start gap-8 shadow-sm border border-orange-100/50">
        <Bone className="w-36 h-36 !rounded-full !bg-orange-200/60 border-4 border-white shadow-sm" />
        <div className="mt-2 text-center md:text-left flex-1">
          <Bone className="h-10 w-64 mb-4 mx-auto md:mx-0 !bg-orange-200/50" />
          <Bone className="h-6 w-48 mb-6 mx-auto md:mx-0 !bg-orange-200/40" />
          <div className="flex gap-3 justify-center md:justify-start">
             <Bone className="h-10 w-28 !rounded-full !bg-orange-200/50" />
             <Bone className="h-10 w-28 !rounded-full !bg-orange-200/50" />
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
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-3xl p-8 h-32 flex items-center gap-5 shadow-sm border border-orange-100/50">
        <Bone className="w-14 h-14 !rounded-xl !bg-orange-200/60" />
        <div>
          <Bone className="h-8 w-56 mb-3 !bg-orange-200/50" />
          <Bone className="h-5 w-80 !bg-orange-200/40" />
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

export function StudentGradesSkeleton() {
  return (
    <div className="space-y-6 animate-pulse pb-10 max-w-7xl mx-auto">
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-3xl p-8 h-32 flex flex-col justify-center shadow-sm border border-orange-100/50 mb-8">
        <Bone className="h-8 w-64 mb-3 !bg-orange-200/50" />
        <Bone className="h-5 w-80 !bg-orange-200/40" />
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Bone className="h-36 w-full !rounded-3xl" />
        <Bone className="h-36 w-full !rounded-3xl" />
        <Bone className="h-36 w-full !rounded-3xl" />
      </div>

      {/* Table Semester Card */}
      {[...Array(2)].map((_, i) => (
        <div key={i} className="bg-[#FFFFFF] rounded-3xl shadow-sm border border-[#E5E7EB] overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-8 py-5 border-b border-[#E5E7EB]">
            <Bone className="h-6 w-56 !bg-slate-200" />
          </div>
          <div className="p-8 space-y-5">
            <div className="flex gap-4 border-b border-gray-100 pb-4">
              {[...Array(5)].map((_, j) => (
                <Bone key={j} className="h-4 flex-1" />
              ))}
            </div>
            {[...Array(3)].map((_, j) => (
              <div key={j} className="flex gap-4 items-center py-2 hover:bg-slate-50 transition-colors rounded-lg px-2">
                {[...Array(4)].map((_, k) => (
                  <Bone key={k} className="h-4 flex-1" />
                ))}
                <Bone className="h-8 w-20 !rounded-lg" />
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
