CREATE TABLE `album_tracks` (
	`album_id` text NOT NULL,
	`track_id` text NOT NULL,
	`position` integer DEFAULT 0,
	PRIMARY KEY(`album_id`, `track_id`),
	FOREIGN KEY (`album_id`) REFERENCES `albums`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`track_id`) REFERENCES `tracks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `albums` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`cover_url` text,
	`type` text DEFAULT 'music' NOT NULL,
	`is_public` integer DEFAULT true,
	`created_at` text DEFAULT (datetime('now')),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `albums_user_idx` ON `albums` (`user_id`);--> statement-breakpoint
CREATE TABLE `comments` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`target_type` text NOT NULL,
	`target_id` text NOT NULL,
	`content` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `comments_target_idx` ON `comments` (`target_type`,`target_id`);--> statement-breakpoint
CREATE TABLE `follows` (
	`follower_id` text NOT NULL,
	`following_id` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')),
	PRIMARY KEY(`follower_id`, `following_id`),
	FOREIGN KEY (`follower_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`following_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `follows_follower_idx` ON `follows` (`follower_id`);--> statement-breakpoint
CREATE INDEX `follows_following_idx` ON `follows` (`following_id`);--> statement-breakpoint
CREATE TABLE `likes` (
	`user_id` text NOT NULL,
	`target_type` text NOT NULL,
	`target_id` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')),
	PRIMARY KEY(`user_id`, `target_type`, `target_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `likes_target_idx` ON `likes` (`target_type`,`target_id`);--> statement-breakpoint
CREATE TABLE `photos` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`album_id` text,
	`url` text NOT NULL,
	`caption` text,
	`location` text,
	`width` integer,
	`height` integer,
	`file_size` integer,
	`likes_count` integer DEFAULT 0,
	`is_public` integer DEFAULT true,
	`created_at` text DEFAULT (datetime('now')),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`album_id`) REFERENCES `albums`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `photos_user_idx` ON `photos` (`user_id`);--> statement-breakpoint
CREATE INDEX `photos_album_idx` ON `photos` (`album_id`);--> statement-breakpoint
CREATE TABLE `playlist_tracks` (
	`playlist_id` text NOT NULL,
	`track_id` text NOT NULL,
	`position` integer DEFAULT 0,
	`added_at` text DEFAULT (datetime('now')),
	PRIMARY KEY(`playlist_id`, `track_id`),
	FOREIGN KEY (`playlist_id`) REFERENCES `playlists`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`track_id`) REFERENCES `tracks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `playlists` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`cover_url` text,
	`is_public` integer DEFAULT true,
	`created_at` text DEFAULT (datetime('now')),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `playlists_user_idx` ON `playlists` (`user_id`);--> statement-breakpoint
CREATE TABLE `refresh_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token` text NOT NULL,
	`expires_at` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `refresh_tokens_token_unique` ON `refresh_tokens` (`token`);--> statement-breakpoint
CREATE INDEX `refresh_tokens_token_idx` ON `refresh_tokens` (`token`);--> statement-breakpoint
CREATE INDEX `refresh_tokens_user_idx` ON `refresh_tokens` (`user_id`);--> statement-breakpoint
CREATE TABLE `tracks` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`album_id` text,
	`title` text NOT NULL,
	`artist` text,
	`genre` text,
	`file_url` text NOT NULL,
	`cover_url` text,
	`duration` integer,
	`file_size` integer,
	`mime_type` text,
	`plays` integer DEFAULT 0,
	`likes_count` integer DEFAULT 0,
	`is_public` integer DEFAULT true,
	`created_at` text DEFAULT (datetime('now')),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`album_id`) REFERENCES `albums`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `tracks_user_idx` ON `tracks` (`user_id`);--> statement-breakpoint
CREATE INDEX `tracks_album_idx` ON `tracks` (`album_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`display_name` text,
	`bio` text,
	`avatar_url` text,
	`is_admin` integer DEFAULT false,
	`created_at` text DEFAULT (datetime('now'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `users_username_idx` ON `users` (`username`);--> statement-breakpoint
CREATE INDEX `users_email_idx` ON `users` (`email`);