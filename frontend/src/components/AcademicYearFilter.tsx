import React from "react";
import { Select } from "antd";
import { Calendar } from "lucide-react";
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
    <div className={`flex items-center gap-2.5 ${className}`}>
      <span className="text-sm font-semibold text-gray-700 flex items-center gap-1.5 shrink-0">
        <Calendar className="w-4 h-4 text-orange-500" />
        Academic Year:
      </span>
      <Select
        value={selectedYear}
        onChange={onChange}
        className="w-40"
        size="middle"
        options={years.map((year) => ({
          label: year,
          value: year,
        }))}
      />
    </div>
  );
};

export default AcademicYearFilter;
