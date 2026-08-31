import { sql } from 'drizzle-orm';
import {
  check,
  integer,
  primaryKey,
  sqliteTable,
  text,
} from 'drizzle-orm/sqlite-core';

export const leads = sqliteTable(
  'leads',
  {
    id: text('id').primaryKey(),
    kind: text('kind', { enum: ['quote', 'bid'] }).notNull(),
    name: text('name').notNull(),
    company: text('company').notNull().default(''),
    email: text('email').notNull(),
    phone: text('phone').notNull(),
    projectName: text('project_name').notNull().default(''),
    bidDueDate: text('bid_due_date').notNull().default(''),
    projectLocation: text('project_location').notNull().default(''),
    projectAddress: text('project_address').notNull().default(''),
    workType: text('work_type').notNull().default(''),
    details: text('details').notNull(),
    preferredContact: text('preferred_contact').notNull().default('either'),
    fileKey: text('file_key'),
    fileName: text('file_name'),
    fileType: text('file_type'),
    fileSize: integer('file_size'),
    status: text('status', { enum: ['new', 'pending_upload'] })
      .notNull()
      .default('new'),
    createdAt: text('created_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    check('leads_kind_check', sql`${table.kind} IN ('quote', 'bid')`),
    check(
      'leads_status_check',
      sql`${table.status} IN ('new', 'pending_upload')`,
    ),
  ],
);

export const leadRateLimits = sqliteTable(
  'lead_rate_limits',
  {
    key: text('key').notNull(),
    windowStart: integer('window_start').notNull(),
    count: integer('count').notNull().default(1),
  },
  (table) => [primaryKey({ columns: [table.key, table.windowStart] })],
);
