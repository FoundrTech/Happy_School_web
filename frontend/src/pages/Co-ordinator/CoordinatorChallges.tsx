import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentAcademicYear } from "../../utils/academicYear";
import AcademicYearFilter from "../../components/AcademicYearFilter";

type ChallengeMap = {
  [id: string]: string;
};

const CoordinatorChallges = () => {
  const [challenges, setChallenges] = useState<ChallengeMap>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>(getCurrentAcademicYear());
  const navigate = useNavigate();
  const school = localStorage.getItem("school");

  useEffect(() => {
    if (!school) {
      setError("School not found in local storage.");
      setLoading(false);
      return;
    }

    setLoading(true);
    axios
      .get(`https://api-rim6ljimuq-uc.a.run.app/get/challenges/${school}`, {
        params: { academicYear: selectedYear },
      })
      .then((res) => {
        setChallenges(res.data.challenges || {});
        setLoading(false);
      })
      .catch((err) => {
        if (err.response && err.response.status === 404) {
          setError("No challenges found for this school.");
        } else {
          console.error("Error fetching challenges:", err);
          setError("Failed to fetch challenges.");
        }
        setLoading(false);
      });
  }, [school, selectedYear]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-xl font-medium text-gray-700">
        Loading challenges...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen text-red-600 font-semibold text-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-orange-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center text-orange-400 mb-4">
          Challenges for{" "}
          <span className="text-gray-800 underline decoration-orange-400">
            {school}
          </span>
        </h1>

        <AcademicYearFilter
          selectedYear={selectedYear}
          onChange={setSelectedYear}
          className="mb-6 justify-center"
        />

        {Object.keys(challenges).length === 0 ? (
          <div className="text-center text-gray-600 text-lg mt-12">
            No challenges found for this school.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-1 gap-4">
            {Object.entries(challenges).map(([id, name]) => (
              <div
                key={id}
                onClick={() =>
                  navigate(
                    `/co-ordinator/tasks/${encodeURI(name)}/${id}?academicYear=${selectedYear}`
                  )
                }
                className="p-6 bg-white rounded-xl shadow-md border border-gray-200 cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200 ease-in-out"
              >
                <h2 className="text-xl font-semibold text-gray-800 mb-1">{name}</h2>
                <p className="text-sm text-gray-500">Challenge ID: {id}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CoordinatorChallges;
