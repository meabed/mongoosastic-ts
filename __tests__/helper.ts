import { Client } from 'elasticsearch';

const esClient = new Client({
  host: 'localhost:9200',
});

export async function deleteIndexIfExists(indexes: string[]) {
  for (const index of indexes) {
    try {
      await esClient.indices.delete({ index });
    } catch (e) {}
  }
}

export function getEsClient() {
  return esClient;
}

export async function closeEsClient() {
  return esClient.close();
}

export function sleep(time: number) {
  return new Promise((resolve) => setTimeout(resolve, time));
}
