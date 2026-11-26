import "dotenv/config";

const env = (key: string, fallback?: string) => {
  const value = process.env[key] ?? fallback;

  if (!value) throw new Error(`Missing environment variable: ${key}`);

  return value;
};

export default env;
