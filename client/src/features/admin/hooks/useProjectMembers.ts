import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { projectsApi } from "@/lib/api/projects";
import { ApiError } from "@/lib/api/client";
import type { ProjectMember } from "@/lib/api/types";

const USER_PICKER_LIMIT = 100;

function message(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

export type ProjectRef = {
  id: string;
  title: string;
};

export type ProjectMembersDialogProps = {
  project?: ProjectRef;
  projectId?: string;
  projectTitle?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectUpdated?: () => void;
};

export function useProjectMembers({
  project,
  projectId: projectIdProp,
  projectTitle: projectTitleProp,
  open,
  onOpenChange,
  onProjectUpdated,
}: ProjectMembersDialogProps) {
  const queryClient = useQueryClient();
  const [picked, setPicked] = React.useState<string>("");
  const [pendingRemoval, setPendingRemoval] = React.useState<ProjectMember | null>(null);

  const projectId = project?.id ?? projectIdProp ?? "";
  const projectTitle = project?.title ?? projectTitleProp ?? "";

  const membersKey = ["project-members", projectId] as const;

  const members = useQuery({
    queryKey: membersKey,
    queryFn: () => projectsApi.members(projectId),
    enabled: open && Boolean(projectId),
  });

  const allUsers = useQuery({
    queryKey: ["project-available-users", projectId] as const,
    queryFn: () => projectsApi.availableUsers(projectId, { limit: USER_PICKER_LIMIT }),
    enabled: open && Boolean(projectId),
  });

  function invalidate() {
    return queryClient.invalidateQueries({ queryKey: membersKey });
  }

  const addMember = useMutation({
    mutationFn: (userId: string) => projectsApi.addMembers(projectId, [userId]),
    onSuccess: async () => {
      setPicked("");
      onProjectUpdated?.();
      await invalidate();
    },
  });

  const removeMember = useMutation({
    mutationFn: (userId: string) => projectsApi.removeMember(projectId, userId),
    onSuccess: async () => {
      setPendingRemoval(null);
      onProjectUpdated?.();
      await invalidate();
    },
  });

  const currentMembers = members.data?.members ?? [];
  const memberIds = new Set(currentMembers.map((member) => member.id));
  const candidates = (allUsers.data?.users ?? []).filter((user) => !memberIds.has(user.id));

  function handleAdd() {
    if (picked) {
      addMember.mutate(picked);
    }
  }

  function handleRequestRemoval(member: ProjectMember) {
    setPendingRemoval(member);
  }

  function handleRemovalOpenChange(next: boolean) {
    if (!next) {
      setPendingRemoval(null);
    }
  }

  function handleConfirmRemoval() {
    if (pendingRemoval) {
      removeMember.mutate(pendingRemoval.id);
    }
  }

  function handleRetryMembers() {
    void members.refetch();
  }

  function handleDone() {
    onOpenChange(false);
  }

  return {
    open,
    onOpenChange,
    handleDone,
    projectTitle,
    picked,
    setPicked,
    handleAdd,
    isAdding: addMember.isPending,
    addError: addMember.isError ? message(addMember.error, "Unable to add that member") : null,
    candidates,
    isUsersPending: allUsers.isPending,
    usersError: allUsers.isError ? message(allUsers.error, "Unable to load users") : null,
    members: currentMembers,
    isMembersPending: members.isPending,
    membersError: members.isError ? message(members.error, "Unable to load members") : null,
    handleRetryMembers,
    handleRequestRemoval,
    handleRemovalOpenChange,
    handleConfirmRemoval,
    isRemovalOpen: pendingRemoval !== null,
    pendingRemovalName: pendingRemoval?.name,
    isRemoving: removeMember.isPending,
    removeError: removeMember.isError ? message(removeMember.error, "Unable to remove that member") : null,
  };
}

export type UseProjectMembersReturn = ReturnType<typeof useProjectMembers>;
