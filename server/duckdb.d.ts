declare module "duckdb" {
  export class Database {
    constructor(
      path: string,
      accessMode?: string | Record<string, string>,
      callback?: (err: unknown) => void,
    );
    close(callback?: (err: unknown) => void): void;
    connect(): Connection;
  }

  export class Connection {
    exec(sql: string, callback?: (err: unknown) => void): void;
    all(sql: string, ...params: unknown[]): void;
    each(sql: string, ...params: unknown[]): void;
    prepare(sql: string, ...params: unknown[]): Statement;
  }

  export class Statement {
    all(...params: unknown[]): void;
    each(...params: unknown[]): void;
    run(...params: unknown[]): void;
    finalize(callback?: (err: unknown) => void): void;
  }
}
