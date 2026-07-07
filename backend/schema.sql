-- Phase 1 MVP schema. Run against your ssap_aman database.

CREATE TABLE IF NOT EXISTS rag_documents (
  id CHAR(36) PRIMARY KEY,
  original_filename VARCHAR(500) NOT NULL,
  storage_path VARCHAR(1000) NOT NULL,
  mime_type VARCHAR(100),
  file_size_bytes BIGINT,
  status ENUM('pending','parsing','indexing','indexed','failed') DEFAULT 'pending',
  chunk_count INT DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  indexed_at TIMESTAMP NULL,
  INDEX idx_status (status),
  INDEX idx_created (created_at DESC)
);
