import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        status: {
          new: "#3b82f6",
          progress: "#f59e0b",
          done: "#10b981",
          overdue: "#ef4444",
        },
      },
    },
  },
  plugins: [],
};

export default config;
