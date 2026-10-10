import { useEditUserName } from "@/features/admin/hooks/useEditUserName";
import type { EditUserNameDialogProps } from "@/features/admin/hooks/useEditUserName";
import { EditUserNameView } from "@/features/admin/components/EditUserNameView";

export function EditUserNameDialog(props: EditUserNameDialogProps) {
  const h = useEditUserName(props);
  return <EditUserNameView {...h} />;
}