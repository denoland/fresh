import { Client } from "https://raw.githubusercontent.com/denodrivers/postgres/86c9080ff2298272384f202d1f356c72a367c72b/mod.ts";

export interface Todo {
  id: number;
  text: string;
}

class Database {
  #client: Client;

  constructor(client: Client) {
    this.#client = client;
  }

  static async connect() {
    const client = new Client(Deno.env.get("DATABASE_URL"));
    await client.connect();
    await client.queryObject`CREATE TABLE IF NOT EXISTS todos (
      id SERIAL PRIMARY KEY,
      text TEXT NOT NULL
    )`;
    return new Database(client);
  }

  async listTodos(): Promise<Todo[]> {
    const { rows } = await this.#client.queryObject<Todo>`SELECT * FROM todos`;
    return rows;
  }

  async addTodo(text: string): Promise<Todo> {
    const { rows } = await this.#client.queryObject<Todo>`
      INSERT INTO todos (text) VALUES (${text})
      RETURNING *
    `;
    return rows[0];
  }
}

const db: Database | Promise<Database> = Database.connect();

export async function getDatabase(): Promise<Database> {
  return await db;
}
