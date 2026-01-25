// __mocks__/firebase.ts
// This file will mock the actual firebase.ts for Jest tests

export const db = {
  collection: jest.fn(() => ({
    // Mock methods that collection() might return, e.g., doc()
    // For now, just return an object that won't throw errors on subsequent calls
    doc: jest.fn(() => ({
      // Mock methods that doc() might return
    })),
  })),
};

export const auth = {}; // Mock Auth instance (if needed)
export const analytics = {}; // Mock Analytics instance (if needed)

// You can add more sophisticated mocks here if your components
// interact with specific Firebase methods (e.g., db.collection, auth.signInWithEmailAndPassword)
// For now, a simple empty object is enough to prevent import.meta.env error.