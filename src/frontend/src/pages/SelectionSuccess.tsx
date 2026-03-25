import { motion } from "motion/react";

export default function SelectionSuccess() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{
        background: "#0b0b0b",
        color: "#fff",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
        className="text-center px-6"
        data-ocid="success.panel"
      >
        <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
        <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 8 }}>
          Dhanyavaad!
        </h1>
        <p style={{ fontSize: 16, color: "#aaa", marginBottom: 4 }}>
          Aapki selection submit ho gayi.
        </p>
        <p style={{ fontSize: 14, color: "#666" }}>
          Photographer jald hi aapse contact karenge.
        </p>
      </motion.div>
    </div>
  );
}
