import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

export function DashboardSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto px-4 py-5 md:py-8"
    >
      <Skeleton className="mb-1 h-3 w-20 rounded-lg" />
      <Skeleton className="mb-6 h-8 w-44 rounded-xl md:mb-8" />

      {/* Quick actions */}
      <div className="mb-5 flex gap-2.5 overflow-hidden sm:grid sm:grid-cols-4 sm:gap-3 md:mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex shrink-0 items-center gap-2.5 rounded-xl border border-border/40 bg-card p-3">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-4 w-16 rounded-md" />
          </div>
        ))}
      </div>

      {/* Stats grid */}
      <div className="mb-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-4 md:mb-8">
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="rounded-xl border border-border/40 bg-card p-3 sm:rounded-2xl sm:p-5"
            style={{ boxShadow: "var(--stem-card-shadow)" }}
          >
            <Skeleton className="mb-2 h-8 w-8 rounded-lg sm:mb-3 sm:h-10 sm:w-10 sm:rounded-xl" />
            <Skeleton className="mb-1 h-7 w-16 rounded-lg" />
            <Skeleton className="h-3 w-12 rounded-md" />
          </motion.div>
        ))}
      </div>

      {/* Content cards */}
      <div className="grid gap-6 lg:grid-cols-2">
        {[...Array(2)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.1 }}
            className="rounded-xl border border-border/40 bg-card p-6"
            style={{ boxShadow: "var(--stem-card-shadow)" }}
          >
            <Skeleton className="mb-4 h-5 w-32 rounded-lg" />
            <div className="space-y-4">
              {[...Array(3)].map((_, j) => (
                <div key={j}>
                  <div className="mb-2 flex items-center justify-between">
                    <Skeleton className="h-4 w-24 rounded-md" />
                    <Skeleton className="h-4 w-10 rounded-md" />
                  </div>
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
