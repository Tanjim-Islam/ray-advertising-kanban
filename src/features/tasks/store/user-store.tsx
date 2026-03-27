"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { createStore, useStore } from "zustand";

import type { UserSummary } from "@/features/tasks/types/user";

const STORAGE_KEY = "ray.current-user-id";

export interface UserStoreState {
  currentUserId: string | null;
  onlineUserIds: string[];
  setCurrentUserId: (userId: string) => void;
  setOnlineUserIds: (userIds: string[]) => void;
  setUsers: (users: UserSummary[]) => void;
  users: UserSummary[];
}

type UserStoreApi = ReturnType<typeof createUserStore>;

const UserStoreContext = createContext<UserStoreApi | null>(null);

function createInitialState(users: UserSummary[]) {
  return {
    users,
    currentUserId: users[0]?.id ?? null,
    onlineUserIds: [] as string[],
  };
}

export function createUserStore(users: UserSummary[]) {
  return createStore<UserStoreState>()((set) => ({
    ...createInitialState(users),
    setUsers: (nextUsers) => {
      set((state) => {
        const nextCurrentUserId =
          nextUsers.some((user) => user.id === state.currentUserId)
            ? state.currentUserId
            : nextUsers[0]?.id ?? null;

        return {
          users: nextUsers,
          currentUserId: nextCurrentUserId,
        };
      });
    },
    setCurrentUserId: (userId) => {
      set({
        currentUserId: userId,
      });
    },
    setOnlineUserIds: (userIds) => {
      set({
        onlineUserIds: userIds,
      });
    },
  }));
}

export function UserStoreProvider({
  children,
  users,
}: {
  children: ReactNode;
  users: UserSummary[];
}) {
  const [store] = useState(() => createUserStore(users));

  useEffect(() => {
    const storedUserId = window.localStorage.getItem(STORAGE_KEY);

    if (storedUserId) {
      const state = store?.getState();

      if (state?.users.some((user) => user.id === storedUserId)) {
        state.setCurrentUserId(storedUserId);
      }
    }

    const unsubscribe = store?.subscribe((state, previousState) => {
      if (state.currentUserId && state.currentUserId !== previousState.currentUserId) {
        window.localStorage.setItem(STORAGE_KEY, state.currentUserId);
      }
    });

    return () => {
      unsubscribe?.();
    };
  }, [store]);

  return (
    <UserStoreContext.Provider value={store}>
      {children}
    </UserStoreContext.Provider>
  );
}

export function useUserStore<T>(selector: (state: UserStoreState) => T) {
  const store = useContext(UserStoreContext);

  if (!store) {
    throw new Error("UserStoreProvider is missing from the component tree.");
  }

  return useStore(store, selector);
}

export function useUserStoreApi() {
  const store = useContext(UserStoreContext);

  if (!store) {
    throw new Error("UserStoreProvider is missing from the component tree.");
  }

  return store;
}

export function useCurrentUser() {
  const users = useUserStore((state) => state.users);
  const currentUserId = useUserStore((state) => state.currentUserId);

  return users.find((user) => user.id === currentUserId) ?? null;
}
