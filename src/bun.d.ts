/**
 * Type declarations for Bun's built-in SQLite module
 * These allow TypeScript to compile when using bun:sqlite
 */

declare module 'bun:sqlite' {
  export class Database {
    constructor(filename?: string);

    run(sql: string, ...params: unknown[]): { changes: number; lastInsertRowid: number };
    prepare(sql: string): Statement;
    exec(sql: string): void;
    close(): void;
  }

  export interface Statement {
    run(...params: unknown[]): { changes: number; lastInsertRowid: number };
    get(...params: unknown[]): unknown;
    all(...params: unknown[]): unknown[];
    values(...params: unknown[]): unknown[][];
  }
}
