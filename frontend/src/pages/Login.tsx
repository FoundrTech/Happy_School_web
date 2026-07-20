import { useState } from "react";
import { useFormik } from "formik";
import { useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff } from "react-icons/fi";
import appIcon from "../assets/Images/appicon2.png";
import toast, { Toaster } from "react-hot-toast";

const normalizeString = (str: string = "") => str.toLowerCase().replace(/[\s-_]/g, "");

function Login() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    onSubmit: async (values) => {
      try {
        setLoading(true);
        const response = await fetch(
          "https://api-rim6ljimuq-uc.a.run.app/auth/login",
          // "http://localhost:5000/auth/login",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(values),
          }
        );

        const data = await response.json();

        if (response.ok) {
          console.log(data.role);
          const normalizedRole = normalizeString(data.role?.toString());

          if (normalizedRole === "principal") {
            toast.success("Login successful");
            localStorage.setItem("authToken", data.jwtToken);
            localStorage.setItem("firebaseToken", data.firebaseToken);
            localStorage.setItem("UserName", data.name);
            localStorage.setItem("role", data.role);
            localStorage.setItem("email", data.email);
            localStorage.setItem("school", data.school);

            setTimeout(() => {
              nav("/dashboard");
            }, 1200);
          } else if (normalizedRole === "counselor") {
            toast.success("Login successful");
            localStorage.setItem("authToken", data.jwtToken);
            localStorage.setItem("firebaseToken", data.firebaseToken);
            localStorage.setItem("UserName", data.name);
            localStorage.setItem("role", data.role);
            localStorage.setItem("email", data.email);
            localStorage.setItem("schools", data.schools);

            setTimeout(() => {
              nav("/counselordashboard");
            }, 1200);

          } else if (normalizedRole === "coordinator") {
            toast.success("Login successful");
            localStorage.setItem("authToken", data.jwtToken);
            localStorage.setItem("firebaseToken", data.firebaseToken);
            localStorage.setItem("UserName", data.name);
            localStorage.setItem("role", data.role);
            localStorage.setItem("email", data.email);
            localStorage.setItem("school", data.school);
            localStorage.setItem("wingId", data.wingId);
            setTimeout(() => {
              nav("/co-ordinator");
            }, 1200);

          }

          else {
            toast.error("Access denied. Only principals can log in.");
          }
        } else {
          toast.error(data.error || "Invalid credentials ");
        }
      } catch (error) {
        console.error("Login error:", error);
        toast.error("Something went wrong ");
      }
      setLoading(false);
    },
  });

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      {/* Toast container */}
      <Toaster position="top-right" reverseOrder={false} />

      {/* Left Section */}
      <div className="bg-[#345069] flex items-center justify-center p-8">
        <img
          src={appIcon}
          alt="Happy School Culture"
          className="w-2/3 max-w-sm mx-auto"
        />
      </div>

      {/* Right Section */}
      <div className="bg-[#f9f9f9] flex items-center justify-center p-8">
        <div className="bg-white rounded-xl shadow-lg p-10 w-full max-w-md">
          <h2 className="text-2xl font-bold text-center text-[#2D4557] mb-1">
            Welcome to
          </h2>
          <h1 className="text-3xl font-extrabold text-center text-orange-500 mb-8">
            Happy School Culture
          </h1>

          <form onSubmit={formik.handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formik.values.email}
                onChange={formik.handleChange}
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                required
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => nav("/auth/passwordReset")}
                  className="text-sm font-medium text-orange-500 hover:text-orange-600 transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formik.values.password}
                  onChange={formik.handleChange}
                  className="mt-1 block w-full px-4 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  required
                />
                <div
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-gray-500 hover:text-gray-700"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </div>
              </div>
            </div>

            {/* Button */}
            <button
              type="submit"
              className="w-full py-2 px-4 bg-orange-500 text-white font-semibold rounded-md hover:bg-orange-600 transition duration-200"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;