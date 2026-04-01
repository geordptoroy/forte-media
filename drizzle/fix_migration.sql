-- Migration to fix the users table column name change
-- Renames openId to password_hash if openId exists
SET @dbname = DATABASE();
SET @tablename = 'users';
SET @columnname = 'openId';
SET @newcolumnname = 'password_hash';

SELECT COUNT(*) INTO @exists
FROM information_schema.columns
WHERE table_schema = @dbname
  AND table_name = @tablename
  AND column_name = @columnname;

SET @query = IF(@exists > 0,
    CONCAT('ALTER TABLE ', @tablename, ' CHANGE ', @columnname, ' ', @newcolumnname, ' varchar(255)'),
    'SELECT "Column already renamed or does not exist"'
);

PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
