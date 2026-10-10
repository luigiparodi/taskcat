import { useBoard } from "@/features/projects/hooks/useBoard";
import { BoardView } from "@/features/projects/components/BoardView";

export function BoardPage() {
  const h = useBoard();
  return <BoardView {...h} />;
}