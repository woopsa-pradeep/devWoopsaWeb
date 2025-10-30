import React from "react";

const ErrorFallback: React.FC = () => {
  return (
    <div style={{ color: "red", padding: "1rem" }}>
      <h2>Something went wrong.</h2>
      <p>Please try again later.</p>
    </div>
  );
};

export default ErrorFallback;
