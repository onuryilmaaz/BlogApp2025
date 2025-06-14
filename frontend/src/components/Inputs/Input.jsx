import React, { useState, useCallback } from "react";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa6";

const Input = React.memo(
  ({
    value,
    onChange,
    label,
    placeholder,
    type,
    error,
    disabled = false,
    required = false,
    ...props
  }) => {
    const [showPassword, setShowPassword] = useState(false);

    const toggleShowPassword = useCallback(() => {
      setShowPassword((prev) => !prev);
    }, []);
    return (
      <div className="mb-4">
        <label className="text-[13px] text-slate-800 block mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div
          className={`input-box ${error ? "border-red-500" : ""} ${
            disabled ? "opacity-50" : ""
          }`}
        >
          <input
            type={
              type === "password" ? (showPassword ? "text" : "password") : type
            }
            placeholder={placeholder}
            className="w-full bg-transparent outline-none"
            value={value}
            onChange={onChange}
            disabled={disabled}
            required={required}
            {...props}
          />

          {type === "password" && (
            <>
              {showPassword ? (
                <FaRegEye
                  size={22}
                  className="text-primary cursor-pointer"
                  onClick={toggleShowPassword}
                />
              ) : (
                <FaRegEyeSlash
                  size={22}
                  className="text-slate-400 cursor-pointer"
                  onClick={toggleShowPassword}
                />
              )}
            </>
          )}
        </div>
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
