-- Migration: merge duplicate / overlapping categories left over from the
-- WordPress import ("BARE ACTS" vs "Bare Acts", "Company Law" vs "company law",
-- three copies of the Hindi "कंपनी कानून", "Constitutional Law 1/2",
-- "Family Law 1/2", "Cyber Law" vs "cyber crime").
--
-- Categories are grouped by a normalised name (lowercased, all whitespace and
-- zero-width chars stripped, plus the explicit 1/2 and cyber folds below). In
-- each group the category with the most posts survives, so the fewest post
-- URLs (/{category}/{post}) change. Every removed slug is recorded in
-- category_redirects so old category and post URLs 301 to the survivor.
--
-- Preview what will be merged BEFORE running (read-only):
--
--   WITH c AS (
--     SELECT c.id, c.name, c.slug,
--       (SELECT count(DISTINCT p.id) FROM posts p
--        LEFT JOIN post_categories pc ON pc.post_id = p.id
--        WHERE p.primary_category_id = c.id OR pc.category_id = c.id) AS posts,
--       regexp_replace(lower(c.name), '[[:space:]​-‍﻿]+', '', 'g') AS norm
--     FROM categories c
--   ), k AS (
--     SELECT *, CASE
--       WHEN norm ~ '^constitutionallaw[0-9]*$' THEN 'constitutionallaw'
--       WHEN norm ~ '^familylaw[0-9]*$' THEN 'familylaw'
--       WHEN norm IN ('cyberlaw', 'cybercrime') THEN 'cybercrime'
--       ELSE norm END AS grp
--     FROM c
--   )
--   SELECT grp, id, name, slug, posts FROM k
--   WHERE grp IN (SELECT grp FROM k GROUP BY grp HAVING count(*) > 1)
--   ORDER BY grp, posts DESC, id;

CREATE TABLE IF NOT EXISTS category_redirects (
  old_slug text PRIMARY KEY,
  category_id bigint NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TEMP TABLE category_merge_map ON COMMIT DROP AS
WITH c AS (
  SELECT c.id,
    (SELECT count(DISTINCT p.id) FROM posts p
     LEFT JOIN post_categories pc ON pc.post_id = p.id
     WHERE p.primary_category_id = c.id OR pc.category_id = c.id) AS posts,
    regexp_replace(lower(c.name), '[[:space:]​-‍﻿]+', '', 'g') AS norm
  FROM categories c
), k AS (
  SELECT id, posts, CASE
    WHEN norm ~ '^constitutionallaw[0-9]*$' THEN 'constitutionallaw'
    WHEN norm ~ '^familylaw[0-9]*$' THEN 'familylaw'
    WHEN norm IN ('cyberlaw', 'cybercrime') THEN 'cybercrime'
    ELSE norm END AS grp
  FROM c
), ranked AS (
  SELECT id, grp, first_value(id) OVER (PARTITION BY grp ORDER BY posts DESC, id) AS keep_id
  FROM k
)
SELECT id AS old_id, keep_id, grp FROM ranked WHERE id <> keep_id;

-- Secondary category links: move to the survivor, skipping posts already linked to it.
INSERT INTO post_categories (post_id, category_id)
SELECT DISTINCT pc.post_id, m.keep_id
FROM post_categories pc
JOIN category_merge_map m ON m.old_id = pc.category_id
WHERE NOT EXISTS (
  SELECT 1 FROM post_categories x WHERE x.post_id = pc.post_id AND x.category_id = m.keep_id
);
DELETE FROM post_categories WHERE category_id IN (SELECT old_id FROM category_merge_map);

UPDATE posts p SET primary_category_id = m.keep_id
FROM category_merge_map m WHERE p.primary_category_id = m.old_id;

-- Re-home child categories; a survivor whose parent was merged into itself becomes top-level.
UPDATE categories c SET parent_id = m.keep_id
FROM category_merge_map m WHERE c.parent_id = m.old_id;
UPDATE categories SET parent_id = NULL WHERE parent_id = id;

-- Repoint any earlier redirects at a merged category, then record the removed slugs.
UPDATE category_redirects r SET category_id = m.keep_id
FROM category_merge_map m WHERE r.category_id = m.old_id;
INSERT INTO category_redirects (old_slug, category_id)
SELECT c.slug, m.keep_id
FROM categories c JOIN category_merge_map m ON m.old_id = c.id
ON CONFLICT (old_slug) DO UPDATE SET category_id = EXCLUDED.category_id;

DELETE FROM categories WHERE id IN (SELECT old_id FROM category_merge_map);

-- Clean display names for the merged English groups (slugs unchanged).
UPDATE categories c SET name = v.name
FROM (VALUES
  ('bareacts', 'Bare Acts'),
  ('companylaw', 'Company Law'),
  ('labourlaw', 'Labour Law'),
  ('constitutionallaw', 'Constitutional Law'),
  ('familylaw', 'Family Law'),
  ('cybercrime', 'Cyber Crime')
) AS v(grp, name)
WHERE c.id IN (SELECT keep_id FROM category_merge_map WHERE grp = v.grp);
