1. index.css - Global Tailwind styles with dark theme variables
// =============================================================================

/*
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --color-background: #0f0f1a;
  --color-surface: #1a1a2e;
  --color-surface-elevated: #222240;
  --color-primary: #7c3aed;
  --color-primary-light: #a78bfa;
  --color-accent: #06b6d4;
  --color-text: #e2e8f0;
  --color-text-muted: #94a3b8;
  --color-border: #334155;
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-danger: #ef4444;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  background-color: var(--color-background);
  color: var(--color-text);
  line-height: 1.6;
}

::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: var(--color-surface);
}

::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--color-text-muted);
}

@layer components {
  .btn-primary {
    @apply px-4 py-2 rounded-lg font-medium transition-all duration-200;
    background-color: var(--color-primary);
    color: white;
  }

  .btn-primary:hover {
    background-color: var(--color-primary-light);
    transform: translateY(-1px);
  }

  .card {
    @apply rounded-xl border p-6;
    background-color: var(--color-surface);
    border-color: var(--color-border);
  }

  .input-field {
    @apply w-full px-3 py-2 rounded-lg border outline-none transition-colors;
    background-color: var(--color-background);
    border-color: var(--color-border);
    color: var(--color-text);
  }

  .input-field:focus {
    border-color: var(--color-primary);
  }
}
*/

// =============================================================================
// 2. package.json - All dependencies configured
// =============================================================================

const packageJson = {
  name: "heapvortex",
  version: "1.0.0",
  description: "Heap memory profiling and visualization tool",
  type: "module",
  scripts: {
    dev: "vite",
    build: "tsc && vite build",
    preview: "vite preview",
    lint: "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
  },
  dependencies: {
    "@tanstack/react-query": "^5.17.0",
    "@trpc/client": "^10.45.0",
    "@trpc/react-query": "^10.45.0",
    "@trpc/server": "^10.45.0",
    drizzle: "^0.29.0",
    "drizzle-orm": "^0.29.0",
    better-sqlite3: "^9.4.0",
    d3: "^7.8.5",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.21.0",
    zustand: "^4.4.7",
    tailwindcss: "^3.4.0",
    clsx: "^2.0.0",
    framer-motion: "^10.16.0",
  },
  devDependencies: {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@types/d3": "^7.4.3",
    "@vitejs/plugin-react": "^4.2.0",
    typescript: "^5.3.0",
    vite: "^5.0.0",
    "esbuild": "^0.19.0",
  },
};

// =============================================================================
// 3. tsconfig.json - TypeScript configuration with path aliases
// =============================================================================

const tsconfigJson = {
  compilerOptions: {
    target: "ES2020",
    useDefineForClassFields: true,
    lib: ["ES2020", "DOM", "DOM.Iterable"],
    module: "ESNext",
    skipLibCheck: true,
    moduleResolution: "bundler",
    allowImportingTsExtensions: true,
    resolveJsonModule: true,
    isolatedModules: true,
    noEmit: true,
    jsx: "react-jsx",
    strict: true,
    noUnusedLocals: true,
    noUnusedParameters: true,
    noFallthroughCasesInSwitch: true,
    baseUrl: ".",
    paths: {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/hooks/*": ["./src/hooks/*"],
      "@/store/*": ["./src/store/*"],
      "@/db/*": ["./src/db/*"],
    },
  },
  include: ["src"],
  references: [{ path: "./tsconfig.node.json" }],
};

// =============================================================================
// 4. vite.config.ts - Vite build configuration with React plugin
// =============================================================================

/*
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api/trpc': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          d3: ['d3'],
          trpc: ['@trpc/client', '@trpc/react-query', '@trpc/server'],
        },
      },
    },
  },
});
*/

// =============================================================================
// 5. schema.ts - Drizzle database schema
// =============================================================================

import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

// Users table - stores user accounts
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  avatarUrl: text("avatar_url"),
  createdAt: text("created_at").default(new Date().toISOString()),
  updatedAt: text("updated_at")
    .default(new Date().toISOString())
    .$onUpdate(() => new Date().toISOString()),
});

// Heap snapshots - stores captured heap state at a point in time
export const heapSnapshots = sqliteTable("heap_snapshots", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").references(() => users.id),
  timestamp: text("timestamp").notNull().default(new Date().toISOString()),
  totalMemory: real("total_memory").notNull(), // in bytes
  usedMemory: real("used_memory").notNull(), // in bytes
  objectCount: integer("object_count").notNull(),
  stringCount: integer("string_count").notNull().default(0),
  arrayCount: integer("array_count").notNull().default(0),
  functionCount: integer("function_count").notNull().default(0),
  source: text("source").notNull().default("manual"), // manual, auto, upload
  label: text("label"),
  createdAt: text("created_at").default(new Date().toISOString()),
});

// Heap objects - individual objects tracked in a heap snapshot
export const heapObjects = sqliteTable("heap_objects", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  snapshotId: integer("snapshot_id")
    .notNull()
    .references(() => heapSnapshots.id, { onDelete: "cascade" }),
  objectId: text("object_id").notNull(), // unique ID within snapshot
  type: text("type").notNull(), // string, number, object, array, function, etc.
  name: text("name"),
  size: real("size").notNull().default(0), // in bytes
  retention: real("retention").notNull().default(0), // retained size in bytes
  depth: integer("depth").notNull().default(0),
  constructor: text("constructor"),
  native: integer("native").default(0), // 0 or 1
  properties: integer("properties").notNull().default(0),
  code: text("code"), // source code for functions
});

// Heap edges - references between heap objects (object graph)
export const heapEdges = sqliteTable("heap_edges", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  snapshotId: integer("snapshot_id")
    .notNull()
    .references(() => heapSnapshots.id, { onDelete: "cascade" }),
  fromId: integer("from_id")
    .notNull()
    .references(() => heapObjects.id, { onDelete: "cascade" }),
  toId: integer("to_id")
    .notNull()
    .references(() => heapObjects.id, { onDelete: "cascade" }),
  edgeType: text("edge_type").notNull(), // property, element, hidden, internal
  name: text("name"), // property name for property edges
});

// Type exports for use throughout the application
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type HeapSnapshot = typeof heapSnapshots.$inferSelect;
export type NewHeapSnapshot = typeof heapSnapshots.$inferInsert;
export type HeapObject = typeof heapObjects.$inferSelect;
export type NewHeapObject = typeof heapObjects.$inferInsert;
export type HeapEdge = typeof heapEdges.$inferSelect;
export type NewHeapEdge = typeof heapEdges.$inferInsert;

// =============================================================================
// 6. db.ts - Database query helpers
// =============================================================================

import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq, desc, and, gt, lt, inArray, sql } from "drizzle-orm";

// Initialize database connection
const sqlite = new Database("heapvortex.db");
const db = drizzle(sqlite);

// User queries
export const getUserByEmail = (email: string) => {
  return db.select().from(users).where(eq(users.email, email)).get();
};

export const getUserById = (id: number) => {
  return db.select().from(users).where(eq(users.id, id)).get();
};

export const createUser = (data: NewUser) => {
  return db.insert(users).values(data).returning().get();
};

// Heap snapshot queries
export const getSnapshotsByUser = (userId: number, limit = 50) => {
  return db
    .select()
    .from(heapSnapshots)
    .where(eq(heapSnapshots.userId, userId))
    .orderBy(desc(heapSnapshots.createdAt))
    .limit(limit)
    .all();
};

export const getSnapshotById = (id: number) => {
  return db
    .select()
    .from(heapSnapshots)
    .where(eq(heapSnapshots.id, id))
    .get();
};

export const createSnapshot = (data: NewHeapSnapshot) => {
  return db.insert(heapSnapshots).values(data).returning().get();
};

export const getSnapshotsByTimeRange = (
  userId: number,
  start: string,
  end: string
) => {
  return db
    .select()
    .from(heapSnapshots)
    .where(
      and(
        eq(heapSnapshots.userId, userId),
        gt(heapSnapshots.timestamp, start),
        lt(heapSnapshots.timestamp, end)
      )
    )
    .orderBy(heapSnapshots.timestamp)
    .all();
};

// Heap object queries
export const getObjectsBySnapshot = (snapshotId: number, limit = 1000) => {
  return db
    .select()
    .from(heapObjects)
    .where(eq(heapObjects.snapshotId, snapshotId))
    .orderBy(desc(heapObjects.retention))
    .limit(limit)
    .all();
};

export const getObjectsByType = (snapshotId: number, type: string) => {
  return db
    .select()
    .from(heapObjects)
    .where(
      and(eq(heapObjects.snapshotId, snapshotId), eq(heapObjects.type, type))
    )
    .all();
};

export const getLargeObjects = (snapshotId: number, minSize: number) => {
  return db
    .select()
    .from(heapObjects)
    .where(
      and(eq(heapObjects.snapshotId, snapshotId), gt(heapObjects.size, minSize))
    )
    .orderBy(desc(heapObjects.retention))
    .all();
};

// Heap edge queries
export const getEdgesBySnapshot = (snapshotId: number) => {
  return db
    .select()
    .from(heapEdges)
    .where(eq(heapEdges.snapshotId, snapshotId))
    .all();
};

export const getRetainingEdges = (
  snapshotId: number,
  objectId: number
) => {
  return db
    .select()
    .from(heapEdges)
    .where(
      and(
        eq(heapEdges.snapshotId, snapshotId),
        eq(heapEdges.toId, objectId)
      )
    )
    .all();
};

export const getOutgoingEdges = (
  snapshotId: number,
  objectId: number
) => {
  return db
    .select()
    .from(heapEdges)
    .where(
      and(
        eq(heapEdges.snapshotId, snapshotId),
        eq(heapEdges.fromId, objectId)
      )
    )
    .all();
};

// Aggregate statistics
export const getSnapshotStats = (snapshotId: number) => {
  return db
    .select({
      totalObjects: sql<number>`COUNT(*)`,
      totalSize: sql<number>`SUM(size)`,
      totalRetention: sql<number>`SUM(retention)`,
      maxDepth: sql<number>`MAX(depth)`,
    })
    .from(heapObjects)
    .where(eq(heapObjects.snapshotId, snapshotId))
    .get();
};

export const getObjectTypeDistribution = (snapshotId: number) => {
  return db
    .select({
      type: heapObjects.type,
      count: sql<number>`COUNT(*)`,
      totalSize: sql<number>`SUM(size)`,
    })
    .from(heapObjects)
    .where(eq(heapObjects.snapshotId, snapshotId))
    .groupBy(heapObjects.type)
    .orderBy(sql`COUNT(*) DESC`)
    .all();
};

// Bulk operations
export const bulkInsertObjects = (objects: NewHeapObject[]) => {
  return db.insert(heapObjects).values(objects).run();
};

export const bulkInsertEdges = (edges: NewHeapEdge[]) => {
  return db.insert(heapEdges).values(edges).run();
};

// Cleanup
export const deleteSnapshotAndRelated = (snapshotId: number) => {
  const tx = db.transaction(() => {
    db.delete(heapEdges).where(eq(heapEdges.snapshotId, snapshotId)).run();
    db.delete(heapObjects).where(eq(heapObjects.snapshotId, snapshotId)).run();
    db.delete(heapSnapshots).where(eq(heapSnapshots.id, snapshotId)).run();
  });
  tx();
};

export { db };

// =============================================================================
// 7. heapVortexMockData.ts - Mock data generator for heap snapshots
// =============================================================================

interface MockHeapObject {
  objectId: string;
  type: string;
  name: string;
  size: number;
  retention: number;
  depth: number;
  constructor: string;
  native: number;
  properties: number;
  code?: string;
}

interface MockHeapEdge {
  fromId: number;
  toId: number;
  edgeType: string;
  name?: string;
}

interface MockHeapSnapshot {
  timestamp: string;
  totalMemory: number;
  usedMemory: number;
  objectCount: number;
  stringCount: number;
  arrayCount: number;
  functionCount: number;
  source: string;
  label: string;
  objects: MockHeapObject[];
  edges: MockHeapEdge[];
}

const OBJECT_TYPES = ["string", "number", "object", "array", "function", "regexp", "date", "promise", "map", "set", "weakmap", "weakset", "arraybuffer", "typedarray"];
const CONSTRUCTORS = ["Object", "Array", "String", "Number", "Function", "RegExp", "Date", "Promise", "Map", "Set", "WeakMap", "Set", "ArrayBuffer", "Uint8Array", "Int32Array", "Float64Array"];
const EDGE_TYPES = ["property", "element", "hidden", "internal", "context"];
const PROPERTY_NAMES = ["data", "state", "props", "children", "config", "cache", "handler", "callback", "instance", "context", "value", "key", "items", "results", "response", "buffer"];

function randomId(): string {
  return `obj_${Math.random().toString(36).substring(2, 15)}`;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function generateObjectName(type: string, index: number): string {
  const prefixes: Record<string, string[]> = {
    string: ["str", "text", "label", "name", "path", "url"],
    number: ["num", "count", "index", "id", "value", "score"],
    object: ["obj", "entity", "model", "record", "config", "settings"],
    array: ["arr", "list", "collection", "items", "results", "queue"],
    function: ["fn", "handler", "callback", "listener", "worker", "processor"],
    regexp: ["regex", "pattern", "validator", "matcher"],
    date: ["timestamp", "date", "createdAt", "updatedAt", "expiresAt"],
    promise: ["promise", "async_op", "fetch_req", "pending_task"],
    map: ["map", "dictionary", "registry", "lookup"],
    set: ["set", "uniqueItems", "tags", "flags"],
    weakmap: ["weakMap", "cache"],
    weakset: ["weakSet", "observer_targets"],
    arraybuffer: ["buffer", "raw_data", "binary_stream"],
    typedarray: ["uint8array", "int32array", "float64array", "typed_view"],
  };

  const options = prefixes[type] || ["item"];
  const prefix = options[randomInt(0, options.length - 1)];
  return `${prefix}_${index}`;
}

function generateMockObject(index: number, depth: number): MockHeapObject {
  const type = OBJECT_TYPES[randomInt(0, OBJECT_TYPES.length - 1)];
  const constructor = CONSTRUCTORS[randomInt(0, CONSTRUCTORS.length - 1)];
  const size = type === "string"
    ? randomInt(10, 5000)
    : type === "number"
    ? randomInt(8, 16)
    : type === "function"
    ? randomInt(100, 50000)
    : type === "array" || type === "object"
    ? randomInt(50, 100000)
    : randomInt(32, 10000);

  const isNative = randomInt(0, 10) < 3 ? 1 : 0;
  const propertyCount =
    type === "object" ? randomInt(2, 30) : type === "array" ? randomInt(5, 100) : randomInt(0, 10);

  return {
    objectId: randomId(),
    type,
    name: generateObjectName(type, index),
    size,
    retention: size + randomInt(0, size * 3),
    depth,
    constructor,
    native: isNative,
    properties: propertyCount,
    ...(type === "function" ? { code: `function ${generateObjectName(type, index)}() { /* implementation */ }` } : {}),
  };
}

export function generateMockHeapSnapshot(snapshotIndex: number): MockHeapSnapshot {
  const objectCount = randomInt(500, 5000);
  const totalMemory = randomFloat(50_000_000, 500_000_000);
  const usedMemory = totalMemory * randomFloat(0.3, 0.95);

  const objects: MockHeapObject[] = [];
  const edges: MockHeapEdge[] = [];

  // Generate objects at various depths
  for (let i = 0; i < objectCount; i++) {
    const depth = Math.min(Math.floor(Math.log2(i + 1)), 15);
    objects.push(generateMockObject(i, depth));
  }

  // Count by type
  const stringCount = objects.filter((o) => o.type === "string").length;
  const arrayCount = objects.filter((o) => o.type === "array").length;
  const functionCount = objects.filter((o) => o.type === "function").length;

  // Generate edges (object graph)
  const maxEdges = Math.min(objectCount * 3, 15000);
  for (let i = 0; i < maxEdges; i++) {
    const fromIndex = randomInt(0, objects.length - 1);
    const toIndex = randomInt(0, objects.length - 1);
    if (fromIndex !== toIndex) {
      const edgeType = EDGE_TYPES[randomInt(0, EDGE_TYPES.length - 1)];
      edges.push({
        fromId: fromIndex + 1,
        toId: toIndex + 1,
        edgeType,
        name: edgeType === "property" ? PROPERTY_NAMES[randomInt(0, PROPERTY_NAMES.length - 1)] : undefined,
      });
    }
  }

  const timestamp = new Date(
    Date.now() - randomInt(0, 86400000 * 30)
  ).toISOString();

  return {
    timestamp,
    totalMemory,
    usedMemory,
    objectCount,
    stringCount,
    arrayCount,
    functionCount,
    source: ["manual", "auto", "upload"][randomInt(0, 2)],
    label: `Snapshot #${snapshotIndex} - ${["development", "production", "testing", "benchmark"][randomInt(0, 3)]}`,
    objects,
    edges,
  };
}

export function generateMockSnapshots(count: number): MockHeapSnapshot[] {
  return Array.from({ length: count }, (_, i) => generateMockHeapSnapshot(i + 1));
}

export function generateMockTimeSeries(
  userId: number,
  pointCount: number = 100
): Array<{
  timestamp: string;
  totalMemory: number;
  usedMemory: number;
  objectCount: number;
  leakScore: number;
}> {
  const data = [];
  let baseMemory = randomFloat(100_000_000, 300_000_000);
  let baseObjects = randomInt(1000, 5000);

  for (let i = 0; i < pointCount; i++) {
    const memoryGrowth = randomFloat(-0.02, 0.05); // slight upward trend simulates leak
    baseMemory = baseMemory * (1 + memoryGrowth);
    baseObjects = Math.max(100, baseObjects + randomInt(-50, 100));

    data.push({
      timestamp: new Date(Date.now() - (pointCount - i) * 3600000).toISOString(),
      totalMemory: baseMemory * randomFloat(1.2, 1.5),
      usedMemory: baseMemory,
      objectCount: baseObjects,
      leakScore: Math.min(100, Math.max(0, (memoryGrowth + 0.02) * 2000)),
    });
  }

  return data;
}

// =============================================================================
// 8. routers.ts - tRPC backend procedures for HeapVortex data
// =============================================================================

import { initTRPC, TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  getSnapshotsByUser,
  getSnapshotById,
  createSnapshot,
  getObjectsBySnapshot,
  getEdgesBySnapshot,
  getLargeObjects,
  getObjectTypeDistribution,
  getSnapshotStats,
  getRetainingEdges,
  getOutgoingEdges,
  deleteSnapshotAndRelated,
  getSnapshotsByTimeRange,
  bulkInsertObjects,
  bulkInsertEdges,
  getUserByEmail,
  createUser,
  getUserById,
} from "./db";
import { generateMockSnapshots } from "./heapVortexMockData";

const t = initTRPC.create();
const publicProcedure = t.procedure;

export const appRouter = t.router({
  // User procedures
  user: {
    create: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          name: z.string().min(1),
          avatarUrl: z.string().url().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return createUser(input);
      }),

    getByEmail: publicProcedure
      .input(z.object({ email: z.string().email() }))
      .query(async ({ input }) => {
        return getUserByEmail(input.email);
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getUserById(input.id);
      }),
  },

  // Heap snapshot procedures
  snapshot: {
    list: publicProcedure
      .input(
        z.object({
          userId: z.number(),
          limit: z.number().min(1).max(100).optional().default(50),
        })
      )
      .query(async ({ input }) => {
        return getSnapshotsByUser(input.userId, input.limit);
      }),

    get: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getSnapshotById(input.id);
      }),

    create: publicProcedure
      .input(
        z.object({
          userId: z.number(),
          totalMemory: z.number(),
          usedMemory: z.number(),
          objectCount: z.number(),
          stringCount: z.number().optional().default(0),
          arrayCount: z.number().optional().default(0),
          functionCount: z.number().optional().default(0),
          source: z.string().optional().default("manual"),
          label: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return createSnapshot(input);
      }),

    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        deleteSnapshotAndRelated(input.id);
        return { success: true };
      }),

    timeRange: publicProcedure
      .input(
        z.object({
          userId: z.number(),
          start: z.string(),
          end: z.string(),
        })
      )
      .query(async ({ input }) => {
        return getSnapshotsByTimeRange(input.userId, input.start, input.end);
      }),
  },

  // Heap object procedures
  object: {
    list: publicProcedure
      .input(
        z.object({
          snapshotId: z.number(),
          limit: z.number().min(1).max(10000).optional().default(1000),
        })
      )
      .query(async ({ input }) => {
        return getObjectsBySnapshot(input.snapshotId, input.limit);
      }),

    byType: publicProcedure
      .input(
        z.object({
          snapshotId: z.number(),
          type: z.string(),
        })
      )
      .query(async ({ input }) => {
        return getObjectsByType(input.snapshotId, input.type);
      }),

    large: publicProcedure
      .input(
        z.object({
          snapshotId: z.number(),
          minSize: z.number(),
        })
      )
      .query(async ({ input }) => {
        return getLargeObjects(input.snapshotId, input.minSize);
      }),

    retainingEdges: publicProcedure
      .input(
        z.object({
          snapshotId: z.number(),
          objectId: z.number(),
        })
      )
      .query(async ({ input }) => {
        return getRetainingEdges(input.snapshotId, input.objectId);
      }),

    outgoingEdges: publicProcedure
      .input(
        z.object({
          snapshotId: z.number(),
          objectId: z.number(),
        })
      )
      .query(async ({ input }) => {
        return getOutgoingEdges(input.snapshotId, input.objectId);
      }),
  },

  // Heap edge procedures
  edge: {
    list: publicProcedure
      .input(z.object({ snapshotId: z.number() }))
      .query(async ({ input }) => {
        return getEdgesBySnapshot(input.snapshotId);
      }),
  },

  // Statistics procedures
  stats: {
    snapshot: publicProcedure
      .input(z.object({ snapshotId: z.number() }))
      .query(async ({ input }) => {
        return getSnapshotStats(input.snapshotId);
      }),

    typeDistribution: publicProcedure
      .input(z.object({ snapshotId: z.number() }))
      .query(async ({ input }) => {
        return getObjectTypeDistribution(input.snapshotId);
      }),
  },

  // Bulk import procedures
  bulk: {
    importSnapshot: publicProcedure
      .input(
        z.object({
          snapshot: z.object({
            userId: z.number(),
            totalMemory: z.number(),
            usedMemory: z.number(),
            objectCount: z.number(),
            stringCount: z.number(),
            arrayCount: z.number(),
            functionCount: z.number(),
            source: z.string(),
            label: z.string().optional(),
            objects: z.array(
              z.object({
                snapshotId: z.number().optional(),
                objectId: z.string(),
                type: z.string(),
                name: z.string(),
                size: z.number(),
                retention: z.number(),
                depth: z.number(),
                constructor: z.string().optional(),
                native: z.number(),
                properties: z.number(),
                code: z.string().optional(),
              })
            ),
            edges: z.array(
              z.object({
                snapshotId: z.number().optional(),
                fromId: z.number(),
                toId: z.number(),
                edgeType: z.string(),
                name: z.string().optional(),
              })
            ),
          }),
        })
      )
      .mutation(async ({ input }) => {
        const { snapshot } = input;
        const { objects, edges, ...snapshotData } = snapshot;

        const createdSnapshot = await createSnapshot(snapshotData);
        const snapshotId = createdSnapshot.id;

        if (objects.length > 0) {
          const objectsWithSnapshotId = objects.map((obj) => ({
            ...obj,
            snapshotId,
          }));
          await bulkInsertObjects(objectsWithSnapshotId);
        }

        if (edges.length > 0) {
          const edgesWithSnapshotId = edges.map((edge) => ({
            ...edge,
            snapshotId,
          }));
          await bulkInsertEdges(edgesWithSnapshotId);
        }

        return createdSnapshot;
      }),

    generateMock: publicProcedure
      .input(
        z.object({
          userId: z.number(),
          count: z.number().min(1).max(10).default(1),
        })
      )
      .mutation(async ({ input }) => {
        const snapshots = generateMockSnapshots(input.count);
        const results = [];

        for (const snapshot of snapshots) {
          const { objects, edges, ...snapshotData } = snapshot;
          const created = await createSnapshot({
            ...snapshotData,
            userId: input.userId,
          });

          results.push({
            snapshotId: created.id,
            objectCount: objects.length,
            edgeCount: edges.length,
          });
        }

        return results;
      }),
  },
});

export type AppRouter = typeof appRouter;

// Export all combined file information
export const combinedFiles = {
  "index.css": "Global Tailwind styles with dark theme variables",
  "routers.ts": "tRPC backend procedures for HeapVortex data",
  "db.ts": "Database query helpers",
  "heapVortexMockData.ts": "Mock data generator for heap snapshots",
  "schema.ts": "Drizzle database schema (users, heapSnapshots, heapObjects, heapEdges)",
  "package.json": "All dependencies configured",
  "tsconfig.json": "TypeScript configuration with path aliases",
  "vite.config.ts": "Vite build configuration with React plugin",
};
