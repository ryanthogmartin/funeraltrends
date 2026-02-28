import { Bookmark, Check, Loader2 } from "lucide-react";

interface SaveIdeaButtonProps {
  onSave: () => void;
  saved: boolean;
  saving: boolean;
  className?: string;
  size?: "sm" | "md";
}

const SaveIdeaButton = ({ onSave, saved, saving, className = "", size = "sm" }: SaveIdeaButtonProps) => {
  if (saved) {
    return (
      <span className={`shrink-0 p-0.5 text-primary ${className}`} title="Saved">
        <Check className={size === "sm" ? "h-3 w-3" : "h-4 w-4"} />
      </span>
    );
  }

  return (
    <button
      onClick={onSave}
      disabled={saving}
      className={`shrink-0 p-0.5 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-primary ${className}`}
      title="Save to account"
    >
      {saving ? (
        <Loader2 className={`${size === "sm" ? "h-3 w-3" : "h-4 w-4"} animate-spin`} />
      ) : (
        <Bookmark className={size === "sm" ? "h-3 w-3" : "h-4 w-4"} />
      )}
    </button>
  );
};

export default SaveIdeaButton;
