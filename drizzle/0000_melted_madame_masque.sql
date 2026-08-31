CREATE TABLE `lead_rate_limits` (
	`key` text NOT NULL,
	`window_start` integer NOT NULL,
	`count` integer DEFAULT 1 NOT NULL,
	PRIMARY KEY(`key`, `window_start`)
);
--> statement-breakpoint
CREATE TABLE `leads` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`name` text NOT NULL,
	`company` text DEFAULT '' NOT NULL,
	`email` text NOT NULL,
	`phone` text NOT NULL,
	`project_name` text DEFAULT '' NOT NULL,
	`bid_due_date` text DEFAULT '' NOT NULL,
	`project_location` text DEFAULT '' NOT NULL,
	`project_address` text DEFAULT '' NOT NULL,
	`work_type` text DEFAULT '' NOT NULL,
	`details` text NOT NULL,
	`preferred_contact` text DEFAULT 'either' NOT NULL,
	`file_key` text,
	`file_name` text,
	`file_type` text,
	`file_size` integer,
	`status` text DEFAULT 'new' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "leads_kind_check" CHECK("leads"."kind" IN ('quote', 'bid')),
	CONSTRAINT "leads_status_check" CHECK("leads"."status" IN ('new', 'pending_upload'))
);
