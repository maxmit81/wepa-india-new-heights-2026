CREATE TABLE `feedback` (
	`id` text PRIMARY KEY NOT NULL,
	`learning` integer NOT NULL,
	`speaking` integer NOT NULL,
	`connection` integer NOT NULL,
	`venue` integer NOT NULL,
	`ideas` text NOT NULL,
	`name` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `photos` (
	`id` text PRIMARY KEY NOT NULL,
	`original_name` text NOT NULL,
	`mime_type` text NOT NULL,
	`bytes` integer NOT NULL,
	`image_data` blob,
	`caption` text DEFAULT '' NOT NULL,
	`uploader_name` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`reviewed_at` text
);
