SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS polls (
  id VARCHAR(16) NOT NULL,
  title VARCHAR(100) NOT NULL,
  description VARCHAR(500) NULL,
  dates JSON NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  interval_minutes SMALLINT UNSIGNED NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_polls_created_at (created_at),
  CONSTRAINT chk_polls_interval CHECK (interval_minutes IN (15, 30, 60)),
  CONSTRAINT chk_polls_time_range CHECK (start_time < end_time)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS participants (
  id VARCHAR(16) NOT NULL,
  poll_id VARCHAR(16) NOT NULL,
  name VARCHAR(50) NOT NULL,
  name_key VARCHAR(50) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_participants_id_poll (id, poll_id),
  UNIQUE KEY uq_participants_poll_name (poll_id, name_key),
  KEY idx_participants_poll_created (poll_id, created_at),
  CONSTRAINT fk_participants_poll
    FOREIGN KEY (poll_id) REFERENCES polls (id)
    ON DELETE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS availability (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  poll_id VARCHAR(16) NOT NULL,
  participant_id VARCHAR(16) NOT NULL,
  slot_date DATE NOT NULL,
  slot_time TIME NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_availability_participant_slot (participant_id, slot_date, slot_time),
  KEY idx_availability_poll_slot (poll_id, slot_date, slot_time),
  CONSTRAINT fk_availability_poll
    FOREIGN KEY (poll_id) REFERENCES polls (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_availability_participant_poll
    FOREIGN KEY (participant_id, poll_id) REFERENCES participants (id, poll_id)
    ON DELETE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
