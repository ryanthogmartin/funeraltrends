import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  detail?: string;
  index: number;
}

const StatCard = ({ label, value, icon: Icon, detail, index }: StatCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className="glass-card p-5 glow-gold"
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-muted-foreground text-sm font-medium">{label}</span>
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <p className="text-2xl font-serif font-semibold text-foreground">{value}</p>
      {detail && (
        <p className="text-xs text-muted-foreground mt-1">{detail}</p>
      )}
    </motion.div>
  );
};

export default StatCard;
