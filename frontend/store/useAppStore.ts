import { create } from 'zustand';

export const useAppStore = create((set) => ({
  // User state
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  logout: () => set({ user: null, isAuthenticated: false }),
  
  // Permissions
  permissions: {
    location: null,
    calendar: null,
    camera: null,
  },
  setPermission: (type, status) => set((state) => ({
    permissions: { ...state.permissions, [type]: status },
  })),
  
  // Current disposal request
  currentItem: null,
  currentItemImage: null,
  disposalResult: null,
  setCurrentItem: (item, image = null) => set({ 
    currentItem: item, 
    currentItemImage: image,
    disposalResult: null,
  }),
  setDisposalResult: (result) => set({ disposalResult: result }),
  clearCurrentRequest: () => set({ 
    currentItem: null, 
    currentItemImage: null, 
    disposalResult: null,
  }),
  
  // Loading states
  isProcessing: false,
  processingStep: null,
  setProcessing: (isProcessing, step = null) => set({ 
    isProcessing, 
    processingStep: step,
  }),
  
  // User location
  userLocation: null,
  setUserLocation: (location) => set({ userLocation: location }),
  
  // History
  disposalHistory: [],
  addToHistory: (item) => set((state) => ({
    disposalHistory: [item, ...state.disposalHistory].slice(0, 50),
  })),
  
  // Scheduled drop-offs
  scheduledDropoffs: [],
  addScheduledDropoff: (dropoff) => set((state) => ({
    scheduledDropoffs: [...state.scheduledDropoffs, dropoff],
  })),
  removeScheduledDropoff: (id) => set((state) => ({
    scheduledDropoffs: state.scheduledDropoffs.filter(d => d.id !== id),
  })),
}));
