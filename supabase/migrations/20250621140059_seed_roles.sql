INSERT INTO "public"."roles" ("name")
SELECT * FROM (VALUES
    ('Admin'),
    ('Editor'),
    ('Viewer'),
    ('Manager'),
    ('Pending')
) AS data(name)
WHERE NOT EXISTS (
    SELECT 1 FROM "public"."roles" r WHERE r.name = data.name
);
