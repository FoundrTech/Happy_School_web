import React from "react";
import { getAcademicYears } from "../utils/academicYear";

interface AcademicYearFilterProps {
  selectedYear: string;
  onChange: (year: string) => void;
  className?: string;
}

const AcademicYearFilter: React.FC<AcademicYearFilterProps> = ({
  selectedYear,
  onChange,
  className = "",
}) => {
  const years = getAcademicYears();

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <span className="text-sm font-semibold text-gray-600 shrink-0">
        Academic Year:
      </span>
      <div className="flex flex-wrap gap-2">
        {years.map((year) => {
          const isActive = selectedYear === year;
          return (
            <button
              key={year}
              onClick={() => onChange(year)}
              className={`px-3 py-1 rounded-full text-sm font-medium border transition-all duration-150 ${
                isActive
                  ? "bg-orange-500 text-white border-orange-500 shadow-sm"
                  : "bg-white text-gray-600 border-gray-300 hover:border-orange-400 hover:text-orange-500"
              }`}
            >
              {year}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default AcademicYearFilter;
