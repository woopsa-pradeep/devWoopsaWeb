// component/atoms/OTPInputBoxes.tsx
import React from "react";
import { Box, InputBase } from "@mui/material";

interface OTPInputBoxesProps {
  length?: number;
  onChange: (value: string) => void;
}

const OTPInputBoxes: React.FC<OTPInputBoxesProps> = ({
  length = 4,
  onChange,
}) => {
  const [otp, setOtp] = React.useState<string[]>(Array(length).fill(""));

  const handleChange = (index: number, value: string) => {
    if (/^[0-9]?$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      onChange(newOtp.join(""));
      if (value && index < length - 1) {
        const nextInput = document.getElementById(`otp-input-${index + 1}`);
        nextInput?.focus();
      }
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
    index: number
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(
        `otp-input-${index - 1}`
      ) as HTMLInputElement;
      prevInput?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasteData = e.clipboardData.getData("Text").trim();
    if (/^\d+$/.test(pasteData)) {
      const digits = pasteData.slice(0, length).split("");
      const newOtp = Array(length).fill("");
      digits.forEach((digit, idx) => {
        newOtp[idx] = digit;
        const input = document.getElementById(
          `otp-input-${idx}`
        ) as HTMLInputElement;
        if (input) input.value = digit;
      });
      setOtp(newOtp);
      onChange(newOtp.join(""));

      // ✅ Focus last filled input
      const lastIndex = digits.length - 1;
      const lastInput = document.getElementById(
        `otp-input-${lastIndex}`
      ) as HTMLInputElement;
      lastInput?.focus();
    }
    e.preventDefault();
  };

  return (
    <Box
      display="flex"
      gap={{ xs: 1, md: 3 }}
      justifyContent="start"
      mt={3}
    >
      {otp.map((digit, idx) => (
        <InputBase
          key={idx}
          id={`otp-input-${idx}`}
          value={digit}
          onChange={(e) => handleChange(idx, e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, idx)}
          onPaste={handlePaste}
          inputProps={{
            maxLength: 1,
            style: {
              width: "48px",
              height: "48px",
              borderRadius: "5px",
              background: "#F0F5F5",
              fontSize: "24px",
              lineHeight: "24px",
              color: "#7C7C7C",
              textAlign: "center",
              padding: 0,
            },
          }}
        />
      ))}
    </Box>
  );
};

export default OTPInputBoxes;
