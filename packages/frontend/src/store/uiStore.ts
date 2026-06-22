import { create } from 'zustand';

interface UiState {
  isAuthModalOpen: boolean;
  isMyProjectsOpen: boolean;
  isSaveProjectModalOpen: boolean;
  isSaveOptionsModalOpen: boolean;
  setAuthModalOpen: (isOpen: boolean) => void;
  setMyProjectsOpen: (isOpen: boolean) => void;
  setSaveProjectModalOpen: (isOpen: boolean) => void;
  setSaveOptionsModalOpen: (isOpen: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  isAuthModalOpen: false,
  isMyProjectsOpen: false,
  isSaveProjectModalOpen: false,
  isSaveOptionsModalOpen: false,
  setAuthModalOpen: (isOpen) => set({ isAuthModalOpen: isOpen }),
  setMyProjectsOpen: (isOpen) => set({ isMyProjectsOpen: isOpen }),
  setSaveProjectModalOpen: (isOpen) => set({ isSaveProjectModalOpen: isOpen }),
  setSaveOptionsModalOpen: (isOpen) => set({ isSaveOptionsModalOpen: isOpen }),
}));
