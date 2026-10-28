CREATE TABLE `safety_reports` (
	`id` varchar(36) NOT NULL,
	`category` enum('harassment','sexual_content','suspected_minor','threats','spam','hate','impersonation','other') NOT NULL,
	`reporter_session_hash` varchar(64) NOT NULL,
	`reported_session_hash` varchar(64) NOT NULL,
	`description` text,
	`selected_excerpt` text,
	`status` enum('open','reviewed','actioned','closed') NOT NULL DEFAULT 'open',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `safety_reports_id` PRIMARY KEY(`id`)
);
