-- =====================================================================
-- NEXLEAF - RELATIONAL DATABASE SCHEMA (MySQL 8.0+)
-- AI-Powered Career Navigation Platform
-- Designed for BCA Final Year Project & Production Deployment
-- =====================================================================

CREATE DATABASE IF NOT EXISTS `nexleaf_db` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `nexleaf_db`;

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(36) PRIMARY KEY,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(150) NOT NULL,
  `education` VARCHAR(150) DEFAULT 'BCA - Bachelor of Computer Applications',
  `current_role` VARCHAR(100) DEFAULT 'Student',
  `avatar_url` VARCHAR(500) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_users_email` (`email`)
) ENGINE=InnoDB;

-- 2. USER PROFILES TABLE
CREATE TABLE IF NOT EXISTS `profiles` (
  `id` VARCHAR(36) PRIMARY KEY,
  `user_id` VARCHAR(36) NOT NULL UNIQUE,
  `bio` TEXT NULL,
  `target_career` VARCHAR(100) DEFAULT 'Frontend Developer',
  `experience_level` ENUM('beginner', 'intermediate', 'advanced') DEFAULT 'beginner',
  `learning_hours_per_day` VARCHAR(50) DEFAULT '2-4 hours/day',
  `learning_streak_days` INT DEFAULT 7,
  `last_active_date` DATE DEFAULT (CURRENT_DATE),
  `linkedin_url` VARCHAR(255) NULL,
  `github_url` VARCHAR(255) NULL,
  `portfolio_url` VARCHAR(255) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_profiles_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 3. SKILLS MASTER CATALOG
CREATE TABLE IF NOT EXISTS `skills` (
  `id` VARCHAR(36) PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL UNIQUE,
  `category` ENUM('frontend', 'backend', 'database', 'ai_ml', 'devops_cloud', 'cybersecurity', 'mobile', 'soft_skills') NOT NULL,
  `description` VARCHAR(255) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 4. USER SKILLS JUNCTION TABLE
CREATE TABLE IF NOT EXISTS `user_skills` (
  `id` VARCHAR(36) PRIMARY KEY,
  `user_id` VARCHAR(36) NOT NULL,
  `skill_name` VARCHAR(100) NOT NULL,
  `proficiency` ENUM('beginner', 'intermediate', 'advanced') DEFAULT 'intermediate',
  `source` ENUM('manual', 'resume_detected', 'assessment') DEFAULT 'manual',
  `verified` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_user_skills_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  UNIQUE KEY `uk_user_skill` (`user_id`, `skill_name`)
) ENGINE=InnoDB;

-- 5. CAREERS MASTER CATALOG
CREATE TABLE IF NOT EXISTS `careers` (
  `id` VARCHAR(36) PRIMARY KEY,
  `slug` VARCHAR(100) NOT NULL UNIQUE,
  `title` VARCHAR(150) NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `description` TEXT NOT NULL,
  `average_salary` VARCHAR(100) NOT NULL,
  `growth_outlook` VARCHAR(100) NOT NULL,
  `difficulty_level` ENUM('Entry', 'Moderate', 'Challenging') DEFAULT 'Moderate',
  `typical_responsibilities` JSON NULL,
  `tools_and_technologies` JSON NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 6. CAREER REQUIRED SKILLS
CREATE TABLE IF NOT EXISTS `career_skills` (
  `id` VARCHAR(36) PRIMARY KEY,
  `career_id` VARCHAR(36) NOT NULL,
  `skill_name` VARCHAR(100) NOT NULL,
  `is_required` BOOLEAN DEFAULT TRUE,
  `importance_weight` INT DEFAULT 1,
  CONSTRAINT `fk_career_skills_career` FOREIGN KEY (`career_id`) REFERENCES `careers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 7. RESUMES TABLE
CREATE TABLE IF NOT EXISTS `resumes` (
  `id` VARCHAR(36) PRIMARY KEY,
  `user_id` VARCHAR(36) NOT NULL,
  `file_name` VARCHAR(255) NOT NULL,
  `file_size_bytes` INT NOT NULL,
  `raw_text` MEDIUMTEXT NOT NULL,
  `upload_status` ENUM('uploaded', 'analyzed', 'failed') DEFAULT 'uploaded',
  `uploaded_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_resumes_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 8. RESUME AI ANALYSIS TABLE
CREATE TABLE IF NOT EXISTS `resume_analysis` (
  `id` VARCHAR(36) PRIMARY KEY,
  `resume_id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `resume_score` INT NOT NULL DEFAULT 70,
  `detected_skills` JSON NOT NULL,
  `missing_skills` JSON NOT NULL,
  `strengths` JSON NOT NULL,
  `education_summary` TEXT NULL,
  `experience_summary` TEXT NULL,
  `projects_detected` JSON NULL,
  `suggested_careers` JSON NOT NULL,
  `improvement_suggestions` JSON NOT NULL,
  `analyzed_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_resume_analysis_resume` FOREIGN KEY (`resume_id`) REFERENCES `resumes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_resume_analysis_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 9. CAREER ASSESSMENTS TABLE
CREATE TABLE IF NOT EXISTS `career_assessments` (
  `id` VARCHAR(36) PRIMARY KEY,
  `user_id` VARCHAR(36) NOT NULL,
  `total_questions` INT DEFAULT 12,
  `status` ENUM('in_progress', 'completed') DEFAULT 'completed',
  `ai_fit_summary` TEXT NULL,
  `top_recommended_track` VARCHAR(100) NULL,
  `fit_score` INT DEFAULT 0,
  `radar_scores` JSON NULL,
  `next_steps` JSON NULL,
  `completed_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_assessments_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 10. ASSESSMENT ANSWERS TABLE
CREATE TABLE IF NOT EXISTS `assessment_answers` (
  `id` VARCHAR(36) PRIMARY KEY,
  `assessment_id` VARCHAR(36) NOT NULL,
  `question_id` VARCHAR(50) NOT NULL,
  `selected_value` VARCHAR(100) NOT NULL,
  `category` VARCHAR(50) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_answers_assessment` FOREIGN KEY (`assessment_id`) REFERENCES `career_assessments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 11. CAREER MATCHES TABLE
CREATE TABLE IF NOT EXISTS `career_matches` (
  `id` VARCHAR(36) PRIMARY KEY,
  `user_id` VARCHAR(36) NOT NULL,
  `career_title` VARCHAR(100) NOT NULL,
  `career_slug` VARCHAR(100) NULL,
  `match_percentage` INT NOT NULL,
  `why_matches` TEXT NOT NULL,
  `matching_skills` JSON NOT NULL,
  `missing_skills` JSON NOT NULL,
  `learning_difficulty` VARCHAR(50) DEFAULT 'Moderate',
  `recommended_next_step` TEXT NOT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_matches_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 12. SKILL GAP ANALYSIS TABLE
CREATE TABLE IF NOT EXISTS `skill_gaps` (
  `id` VARCHAR(36) PRIMARY KEY,
  `user_id` VARCHAR(36) NOT NULL,
  `target_career` VARCHAR(100) NOT NULL,
  `skill_name` VARCHAR(100) NOT NULL,
  `current_proficiency_pct` INT NOT NULL DEFAULT 0,
  `target_proficiency_pct` INT NOT NULL DEFAULT 100,
  `priority` ENUM('high', 'medium', 'low') DEFAULT 'medium',
  `ai_advice` TEXT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_gaps_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 13. CAREER ROADMAPS TABLE
CREATE TABLE IF NOT EXISTS `roadmaps` (
  `id` VARCHAR(36) PRIMARY KEY,
  `user_id` VARCHAR(36) NOT NULL,
  `career_title` VARCHAR(100) NOT NULL,
  `total_phases` INT DEFAULT 5,
  `current_phase` INT DEFAULT 1,
  `overall_progress_pct` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_roadmaps_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 14. ROADMAP TASKS TABLE
CREATE TABLE IF NOT EXISTS `roadmap_tasks` (
  `id` VARCHAR(36) PRIMARY KEY,
  `roadmap_id` VARCHAR(36) NOT NULL,
  `phase_number` INT NOT NULL,
  `phase_name` VARCHAR(100) NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `description` TEXT NOT NULL,
  `skill_focus` VARCHAR(100) NOT NULL,
  `estimated_hours` INT DEFAULT 10,
  `difficulty` ENUM('Beginner', 'Intermediate', 'Advanced') DEFAULT 'Beginner',
  `learning_resources` JSON NULL,
  `recommended_project` VARCHAR(255) NULL,
  `status` ENUM('not_started', 'in_progress', 'completed') DEFAULT 'not_started',
  `completed_at` TIMESTAMP NULL,
  CONSTRAINT `fk_tasks_roadmap` FOREIGN KEY (`roadmap_id`) REFERENCES `roadmaps` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 15. PROJECTS MASTER CATALOG
CREATE TABLE IF NOT EXISTS `projects` (
  `id` VARCHAR(36) PRIMARY KEY,
  `title` VARCHAR(150) NOT NULL,
  `career_category` VARCHAR(100) NOT NULL,
  `difficulty` ENUM('Beginner', 'Intermediate', 'Advanced') NOT NULL,
  `estimated_hours` INT NOT NULL,
  `skills_learned` JSON NOT NULL,
  `technologies` JSON NOT NULL,
  `description` TEXT NOT NULL,
  `deliverables` JSON NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 16. COURSES & LEARNING RESOURCES
CREATE TABLE IF NOT EXISTS `courses` (
  `id` VARCHAR(36) PRIMARY KEY,
  `title` VARCHAR(200) NOT NULL,
  `category` ENUM('frontend', 'backend', 'database', 'ai_ml', 'cloud_devops', 'cybersecurity', 'general_programming', 'tools') NOT NULL,
  `skill_name` VARCHAR(100) NOT NULL,
  `difficulty` ENUM('Beginner', 'Intermediate', 'Advanced') NOT NULL,
  `duration` VARCHAR(50) NOT NULL,
  `resource_type` ENUM('Documentation', 'Interactive Course', 'Video Series', 'Hands-on Lab') NOT NULL,
  `provider` VARCHAR(100) NOT NULL,
  `url` VARCHAR(500) NOT NULL,
  `description` TEXT NOT NULL
) ENGINE=InnoDB;

-- 17. USER PROGRESS SNAPSHOTS
CREATE TABLE IF NOT EXISTS `user_progress` (
  `id` VARCHAR(36) PRIMARY KEY,
  `user_id` VARCHAR(36) NOT NULL,
  `snapshot_date` DATE NOT NULL,
  `career_readiness_pct` INT NOT NULL,
  `roadmap_progress_pct` INT NOT NULL,
  `skills_completed_count` INT NOT NULL,
  `total_skills_count` INT NOT NULL,
  `projects_completed_count` INT NOT NULL,
  `learning_hours_total` DECIMAL(5,1) DEFAULT 0.0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_progress_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  UNIQUE KEY `uk_user_date` (`user_id`, `snapshot_date`)
) ENGINE=InnoDB;

-- 18. AI INTERACTIONS / COACH LOGS
CREATE TABLE IF NOT EXISTS `ai_interactions` (
  `id` VARCHAR(36) PRIMARY KEY,
  `user_id` VARCHAR(36) NOT NULL,
  `interaction_type` ENUM('coach_chat', 'resume_analysis', 'assessment_evaluation', 'roadmap_generation', 'recommendation') NOT NULL,
  `prompt` TEXT NOT NULL,
  `response` MEDIUMTEXT NOT NULL,
  `context_metadata` JSON NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_ai_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;
