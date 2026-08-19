/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useState } from "react";
import { Formik, Form, Field, ErrorMessage, useField } from "formik";
import * as Yup from "yup";
import axios from "axios";
import Select from "react-select";

interface Teacher {
  name: string;
  email: string;
}

interface Contributor {
  name: string;
  email: string;
}

interface TeacherMap {
  name: string;
  email: string;
}

const MultiSelectByName = ({
  name,
  label,
  options,
}: {
  name: string;
  label: string;
  options: Teacher[];
}) => {
  const [field, meta, helpers] = useField<Contributor[]>({ name });
  const selected = field.value || [];

  const toggle = (teacher: Teacher) => {
    const exists = selected.some((t) => t.email === teacher.email);
    if (exists) {
      helpers.setValue(selected.filter((t) => t.email !== teacher.email));
    } else {
      helpers.setValue([
        ...selected,
        { name: teacher.name, email: teacher.email },
      ]);
    }
  };

  return (
    <div className="mt-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="border border-orange-500 rounded-md p-2 bg-white shadow-sm max-h-48 overflow-y-auto">
        {options.map((teacher) => {
          const selectedItem = selected.some((t) => t.email === teacher.email);
          return (
            <div
              key={teacher.email}
              onClick={() => toggle(teacher)}
              className={`cursor-pointer px-3 py-1 rounded-md ${
                selectedItem
                  ? "bg-orange-100 text-orange-600 font-semibold"
                  : "hover:bg-gray-100 text-black"
              }`}
            >
              {teacher.name}
            </div>
          );
        })}
      </div>
      {meta.touched && meta.error && (
        <div className="text-red-500 text-sm mt-1">{meta.error as string}</div>
      )}
    </div>
  );
};

function AddTicket() {
  const email = localStorage.getItem("email");
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isStudent, setIsStudent] = useState(true);

  useEffect(() => {
    if (!email) return;
    axios
      .get(`https://api-rim6ljimuq-uc.a.run.app/teachers/${email}`)
      .then((res) => {
        const teacherList = (res.data.teachers || [])
          .filter((t: any) => t.Name && t.email)
          .map((t: any) => ({
            name: t.Name,
            email: t.email,
          }));
        setTeachers(teacherList);
      })
      .catch((err) => console.error("Error fetching teachers:", err));
  }, [email]);

  const validationSchema = Yup.object({
    ticketText: Yup.string()
      .required("Ticket description is required")
      .min(10, "Minimum 10 characters"),
    contributors: Yup.array().of(
      Yup.object().shape({
        name: Yup.string().required(),
        email: Yup.string().email().required(),
      })
    ),
    category: Yup.string().required("Please select a category"),
    selectedTeacher: isStudent
      ? Yup.object().optional()
      : Yup.object()
          .shape({
            name: Yup.string().required(),
            email: Yup.string().email().required(),
          })
          .required("Please select a teacher"),
  });

  const handleSubmit = async (
    values: {
      ticketText: string;
      contributors: Contributor[];
      selectedTeacher: TeacherMap | null;
      category: string;
      isDraft?: boolean;
    },
    { resetForm, setSubmitting }: any
  ) => {
    console.log("Form Submitted With:", values);
  try {
    const payload: any = {
      ticketText: values.ticketText,
      contributors: values.contributors,
      category: values.category,
      status: values.isDraft ? "Draft" : "Ticket Raised",
    };

    // If category is Teacher, send teacher as a map with name and email
    if (values.category === "Teacher" && values.selectedTeacher) {
      payload.teacher = {
        name: values.selectedTeacher.name,
        email: values.selectedTeacher.email,
      };
      console.log("Sending teacher data:", payload.teacher);
    }

    console.log("Final payload:", payload);

    await axios.post(
      `https://api-rim6ljimuq-uc.a.run.app/raiseticket/${email}`,
      payload
    );

    alert(values.isDraft ? "✅ Ticket saved as draft!" : "✅ Ticket submitted successfully!");
    resetForm();
  } catch (err) {
    console.error("Submission Error:", err);
    alert("❌ Error submitting ticket");
  } finally {
    setSubmitting(false);
  }
  };

  const teacherOptions = teachers.map((t) => ({
    label: t.name,
    value: t.email,
    name: t.name, // Keep name for easy access
  }));

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white shadow-md rounded-lg">
      <h1 className="text-3xl font-semibold text-center mb-6 text-orange-600">
        Add Ticket
      </h1>
      <Formik
        initialValues={{
          ticketText: "",
          contributors: [],
          selectedTeacher: null as TeacherMap | null,
          category: "",
          isDraft: false,
        }}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting, setFieldValue, setFieldTouched, values, submitForm }) => (
          <Form>
            {/* Ticket Text */}
            <Field
              as="textarea"
              name="ticketText"
              placeholder="Describe your issue here..."
              className="w-full h-32 p-4 text-sm rounded-lg border-2 border-orange-500 focus:outline-none text-black"
            />
            <ErrorMessage
              name="ticketText"
              component="div"
              className="text-red-500 text-sm mt-1"
            />

            {/* Category Select */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <Select
                options={[
                  { label: "Student", value: "Student" },
                  { label: "Teacher", value: "Teacher" },
                  { label: "Early Adopter", value: "Early Adopter" },
                ]}
                placeholder="-- Select category --"
                onChange={(option: any) => {
                  setFieldValue("category", option?.value);
                  setFieldValue("selectedTeacher", null); // Reset teacher selection
                  setIsStudent(option?.value === "Student");
                }}
                onBlur={() => setFieldTouched("category", true)}
                styles={{
                  control: (base, state) => ({
                    ...base,
                    borderColor: state.isFocused ? "#f97316" : "#f97316",
                    boxShadow: "none",
                    "&:hover": {
                      borderColor: "#f97316",
                    },
                  }),
                  placeholder: (base) => ({
                    ...base,
                    color: "#6b7280",
                  }),
                  singleValue: (base) => ({
                    ...base,
                    color: "#000000",
                  }),
                }}
              />
              <ErrorMessage
                name="category"
                component="div"
                className="text-red-500 text-sm mt-1"
              />
            </div>

            {/* Select Teacher - Only show for Teacher and Early Adopter categories */}
            {(values.category === "Teacher" ||
              values.category === "Early Adopter") && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Teacher
                </label>
                <Select
                  options={teacherOptions}
                  placeholder="-- Select a teacher --"
                  onChange={(option: any) => {
                    if (option) {
                      // Set teacher as an object with name and email
                      setFieldValue("selectedTeacher", {
                        name: option.name,
                        email: option.value,
                      });
                    } else {
                      setFieldValue("selectedTeacher", null);
                    }
                  }}
                  onBlur={() => setFieldTouched("selectedTeacher", true)}
                  value={
                    values.selectedTeacher
                      ? {
                          label: values.selectedTeacher.name,
                          value: values.selectedTeacher.email,
                          name: values.selectedTeacher.name,
                        }
                      : null
                  }
                  isClearable
                  styles={{
                    control: (base, state) => ({
                      ...base,
                      borderColor: state.isFocused ? "#f97316" : "#f97316",
                      boxShadow: "none",
                      "&:hover": {
                        borderColor: "#f97316",
                      },
                    }),
                    placeholder: (base) => ({
                      ...base,
                      color: "#6b7280",
                    }),
                    singleValue: (base) => ({
                      ...base,
                      color: "#000000",
                    }),
                  }}
                />
                <ErrorMessage
                  name="selectedTeacher"
                  component="div"
                  className="text-red-500 text-sm mt-1"
                />
              </div>
            )}

            {/* Contributor Multiselect */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Contributors
              </label>
              <Select
                isMulti
                options={teacherOptions.filter(
                  (t) => t.value !== values.selectedTeacher?.email
                )}
                placeholder="Search & select contributors"
                onChange={(selectedOptions: any) => {
                  const contributors = selectedOptions.map((opt: any) => ({
                    name: opt.name || opt.label,
                    email: opt.value,
                  }));
                  setFieldValue("contributors", contributors);
                }}
                onBlur={() => setFieldTouched("contributors", true)}
                styles={{
                  control: (base, state) => ({
                    ...base,
                    borderColor: state.isFocused ? "#f97316" : "#f97316",
                    boxShadow: "none",
                    "&:hover": {
                      borderColor: "#f97316",
                    },
                  }),
                  multiValue: (base) => ({
                    ...base,
                    backgroundColor: "#fef3c7",
                  }),
                  multiValueLabel: (base) => ({
                    ...base,
                    color: "#c2410c",
                  }),
                  placeholder: (base) => ({
                    ...base,
                    color: "#6b7280",
                  }),
                }}
              />

              <ErrorMessage
                name="contributors"
                component="div"
                className="text-red-500 text-sm mt-1"
              />
            </div>

            {/* Submit & Save as Draft Buttons */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                onClick={() => setFieldValue("isDraft", false)}
                disabled={isSubmitting}
                className="flex-1 bg-orange-500 text-white py-2 px-4 rounded-lg shadow hover:bg-orange-600 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isSubmitting ? "Submitting..." : "Submit Ticket"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setFieldValue("isDraft", true);
                  submitForm();
                }}
                disabled={isSubmitting}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 py-2 px-4 rounded-lg shadow-sm transition duration-200 font-medium disabled:opacity-50"
              >
                Save as Draft
              </button>
            </div>

            {/* Debug Info (remove in production) */}
          </Form>
        )}
      </Formik>
    </div>
  );
}

export default AddTicket;
