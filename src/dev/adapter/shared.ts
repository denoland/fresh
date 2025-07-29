import * as path from "node:path";

export interface AdapterBuilderConfig {
  outDir: string;
  buildId: string;
}

export class AdapterBuilder {
  constructor(public config: AdapterBuilderConfig) {}

  getBuildDirectory(name: string) {
    return path.join(this.config.outDir, name);
  }

  getClientDirectory() {
    return path.join(this.config.outDir, "client");
  }

  getServerDirectory() {
    return path.join(this.config.outDir, "server");
  }

  async writeClient(dest: string) {
    const source = path.join(this.config.outDir, "client");
    return await copy(source, dest, {
      filter: (basename) => basename !== ".vite",
    });
  }

  async writeServer(dest: string) {
    const source = path.join(this.config.outDir, "server");
    return await copy(source, dest);
  }
}

export interface Adapter {
  name: string;
  adapt(builder: AdapterBuilder): void | Promise<void>;
}

async function copy(
  source: string,
  dest: string,
  options: { filter?: (basename: string) => boolean } = {},
) {
  // FIXME
}
