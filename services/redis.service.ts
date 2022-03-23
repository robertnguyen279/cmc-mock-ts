import { createClient } from 'redis';

const redisClient = createClient();

const set = async (key: string, value: any) => {
  redisClient.connect();
  await redisClient.set(key, JSON.stringify(value));
  redisClient.disconnect();
};

const get = async (key: string): Promise<any> => {
  redisClient.connect();
  const result = await redisClient.get(key);
  redisClient.disconnect();
  return JSON.parse(result as string);
};

const del = async (key: string) => {
  redisClient.connect();
  await redisClient.del(key);
  redisClient.disconnect();
  return;
};

export default { get, set, del };
