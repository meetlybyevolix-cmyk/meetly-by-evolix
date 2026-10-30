-- Drizzle Migration: 0002_compliance_and_age
-- Creates grievance_tickets, data_subject_requests, and age_verifications tables for Meetly Phase 6

CREATE TABLE IF NOT EXISTS `grievance_tickets` (
	`id` varchar(36) NOT NULL,
	`ticket_code` varchar(24) NOT NULL,
	`complainant_name` varchar(120) NOT NULL,
	`complainant_email` varchar(320) NOT NULL,
	`category` enum('content_removal','privacy_complaint','safety_concern','user_conduct','other') NOT NULL,
	`subject` varchar(256) NOT NULL,
	`details` text NOT NULL,
	`evidence` text,
	`status` enum('received','under_review','actioned','rejected','closed') NOT NULL DEFAULT 'received',
	`resolution_notes` text,
	`acknowledged_at` timestamp NOT NULL DEFAULT (now()),
	`resolved_at` timestamp NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `grievance_tickets_id` PRIMARY KEY(`id`),
	CONSTRAINT `grievance_tickets_ticket_code_unique` UNIQUE(`ticket_code`)
);

CREATE TABLE IF NOT EXISTS `data_subject_requests` (
	`id` varchar(36) NOT NULL,
	`request_code` varchar(24) NOT NULL,
	`request_type` enum('access_summary','erasure','correction','consent_withdrawal','inquiry') NOT NULL,
	`contact_email` varchar(320) NOT NULL,
	`session_identifier_hash` varchar(64) NULL,
	`details` text NOT NULL,
	`status` enum('received','under_review','completed','rejected') NOT NULL DEFAULT 'received',
	`response_notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`resolved_at` timestamp NULL,
	CONSTRAINT `data_subject_requests_id` PRIMARY KEY(`id`),
	CONSTRAINT `data_subject_requests_request_code_unique` UNIQUE(`request_code`)
);

CREATE TABLE IF NOT EXISTS `age_verifications` (
	`id` varchar(36) NOT NULL,
	`session_hash` varchar(64) NOT NULL,
	`provider` varchar(32) NOT NULL,
	`provider_reference` varchar(128) NOT NULL,
	`status` enum('pending','verified','rejected','expired') NOT NULL DEFAULT 'pending',
	`over_18_confirmed` boolean NOT NULL DEFAULT false,
	`verified_at` timestamp NULL,
	`expires_at` timestamp NULL,
	`audit_proof` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `age_verifications_id` PRIMARY KEY(`id`),
	CONSTRAINT `age_verifications_session_hash_unique` UNIQUE(`session_hash`)
);

