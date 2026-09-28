-- Migration: Add LegalTech and Training categories if they do not exist,
-- and link relevant posts to Bare Acts, LegalTech, and Training.

INSERT INTO categories (wp_term_id, slug, name, description, color)
VALUES
  (
    (SELECT COALESCE(MAX(wp_term_id), 1000) + 1 FROM categories),
    'training',
    'Training',
    'Judiciary exam coaching, drafting practice, and legal internship guidance.',
    '#7C3AED'
  )
ON CONFLICT (slug) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description, color = EXCLUDED.color;

INSERT INTO categories (wp_term_id, slug, name, description, color)
VALUES
  (
    (SELECT COALESCE(MAX(wp_term_id), 1000) + 2 FROM categories),
    'legaltech',
    'LegalTech',
    'Legal research tools, workflow automation, AI in legal practice, and digital resources.',
    '#0284C7'
  )
ON CONFLICT (slug) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description, color = EXCLUDED.color;

-- Map relevant posts to legaltech
INSERT INTO post_categories (post_id, category_id)
SELECT p.id, c.id
FROM posts p, categories c
WHERE c.slug = 'legaltech'
  AND (p.title ILIKE '%legaltech%' OR p.title ILIKE '%AI in Law%' OR p.title ILIKE '%artificial intelligence%')
ON CONFLICT DO NOTHING;

-- Map relevant posts to training
INSERT INTO post_categories (post_id, category_id)
SELECT p.id, c.id
FROM posts p, categories c
WHERE c.slug = 'training'
  AND (p.title ILIKE '%judiciary%' OR p.title ILIKE '%exam preparation%' OR p.title ILIKE '%answer writing%' OR p.title ILIKE '%internship%')
ON CONFLICT DO NOTHING;

-- Map relevant bare acts / statutory articles to bare-acts
INSERT INTO post_categories (post_id, category_id)
SELECT p.id, c.id
FROM posts p, categories c
WHERE c.slug = 'bare-acts'
  AND (
    p.title ILIKE '%bare act%'
    OR p.title ILIKE 'THE % ACT%'
    OR p.title ILIKE 'THE CODE OF CRIMINAL PROCEDURE%'
  )
ON CONFLICT DO NOTHING;
