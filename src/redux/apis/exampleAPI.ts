export const fetchExampleData = async (): Promise<string[]> => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(["Item 1", "Item 2", "Item 3"]), 1000);
    });
  };
  
// src/redux/apis/formAPI.ts

export const fakeFormSubmit = async (data: { name: string; email: string }) => {
    return new Promise<{ name: string; email: string }>((resolve) => {
      setTimeout(() => {
        resolve(data);
      }, 1000); // simulate network delay
    });
  };
  