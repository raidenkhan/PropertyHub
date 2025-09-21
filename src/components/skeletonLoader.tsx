// src/components/SkeletonLoader.tsx
import { motion } from "framer-motion";

export function SkeletonLoader({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-md border overflow-hidden">
      <div className="bg-muted/50 h-12 px-6 flex items-center border-b">
        <div className="h-5 w-1/4 bg-muted rounded animate-pulse"></div>
      </div>
      <div className="divide-y">
        {[...Array(rows)].map((_, rowIndex) => (
          <div key={rowIndex} className="p-6 flex items-center space-x-4 animate-pulse">
            {[...Array(cols)].map((_, colIndex) => (
              <div
                key={colIndex}
                className={`h-5 rounded bg-muted ${
                  colIndex === 0 ? "w-1/4" : colIndex === 1 ? "w-1/6" : "w-1/8"
                }`}
              ></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}