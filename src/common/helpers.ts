export const delay = (ms: number) => new Promise((resolve, _) => setTimeout(resolve, ms));

export const launch = <T>(block: () => Promise<T>) =>
  new Promise<T>((resolve, reject) => {
    try {
      resolve(block());
    } catch (error) {
      reject(error);
    }
  });
