import { motion } from "framer-motion";
import { Skull, RefreshCw, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardHeaderProps {
  lastUpdated: string;
  onRefresh?: () => void;
  onExportCsv?: () => void;
}

const DashboardHeader = ({ lastUpdated, onRefresh, onExportCsv }: DashboardHeaderProps) => {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="flex items-end justify-between mb-8">

      <div>
        <div className="flex items-center gap-3 mb-2">
          <Skull className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-display font-bold text-gradient-primary">
            Funeral Trends
          </h1>
        </div>
        <p className="text-muted-foreground text-sm">Real-time funeral profession search trends & discussions - last 24 hours

        </p>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground">
          Updated {lastUpdated}
        </span>
        <div className="h-2 w-2 rounded-full bg-trend-up animate-pulse-subtle" />
        {onExportCsv &&
        <Button
          variant="outline"
          size="sm"
          onClick={onExportCsv}
          className="gap-1.5 text-xs">

            <Download className="h-3 w-3" />
            Export CSV
          </Button>
        }
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          className="gap-1.5 text-xs">

          <RefreshCw className="h-3 w-3" />
          Refresh
        </Button>
      </div>
    </motion.header>);

};

export default DashboardHeader;