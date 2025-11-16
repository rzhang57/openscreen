import { useItem } from "dnd-timeline";
import type { Span } from "dnd-timeline";
import { cn } from "@/lib/utils";
import glassStyles from "./ItemGlass.module.css";

interface ItemProps {
  id: string;
  span: Span;
  rowId: string;
  children: React.ReactNode;
  isSelected?: boolean;
  onSelect?: () => void;
}

export default function Item({ id, span, rowId, isSelected = false, onSelect }: ItemProps) {
  const { setNodeRef, attributes, listeners, itemStyle, itemContentStyle } = useItem({
    id,
    span,
    data: { rowId },
  });

  return (
    <div
      ref={setNodeRef}
      style={itemStyle}
      {...listeners}
      {...attributes}
      onPointerDownCapture={() => onSelect?.()}
      className={cn(glassStyles.itemDark)}
    >
      <div style={itemContentStyle}>
        <div
          className={cn(
            "w-full overflow-hidden flex items-center justify-center transition-all duration-150 cursor-grab active:cursor-grabbing group relative",
            glassStyles.glassPurple
          )}
          style={{ height: 48 }}
          onClick={(event) => {
            event.stopPropagation();
            onSelect?.();
          }}
        >
          <div className={cn(glassStyles.zoomEndCap, glassStyles.left)} />
          <div className={cn(glassStyles.zoomEndCap, glassStyles.right)} />
        </div>
      </div>
    </div>
  );
}