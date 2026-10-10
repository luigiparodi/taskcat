import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usersApi } from "@/lib/api/users";
import { ApiError } from "@/lib/api/client";
import type { PublicUser } from "@/lib/api/types";

const NAME_MIN = 2;
const NAME_MAX = 50;

function message(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

export type EditUserNameDialogProps = {
  user: PublicUser;
  onOpenChange: (open: boolean) => void;
};

export function useEditUserName({ user, onOpenChange }: EditUserNameDialogProps) {
  const queryClient = useQueryClient();
  const [name, setName] = React.useState(user.name);
  const [nameError, setNameError] = React.useState<string | null>(null);

  const update = useMutation({
    mutationFn: (next: string) => usersApi.update(user.id, { name: next }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["users"] });
      onOpenChange(false);
    },
  });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = name.trim();
    setNameError(null);

    if (trimmed.length < NAME_MIN) {
      setNameError(`Name must be at least ${NAME_MIN} characters`);
      return;
    }
    if (trimmed.length > NAME_MAX) {
      setNameError(`Name must be at most ${NAME_MAX} characters`);
      return;
    }

    update.mutate(trimmed);
  }

  const submitError = update.isError ? message(update.error, "Unable to update this user") : null;

  return {
    user,
    onOpenChange,
    name,
    setName,
    nameError,
    handleSubmit,
    submitError,
    isPending: update.isPending,
  };
}

export type UseEditUserNameReturn = ReturnType<typeof useEditUserName>;