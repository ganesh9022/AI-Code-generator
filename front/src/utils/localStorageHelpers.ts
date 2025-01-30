export const setLocalStorageItem = (key: string, value: any) => {
  localStorage.setItem(key, JSON.stringify(value));
};

export const removeLocalStorageItem = (key: string) => {
  localStorage.removeItem(key);
};
