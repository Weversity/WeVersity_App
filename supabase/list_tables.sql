
DO $$
DECLARE
    row record;
BEGIN
    RAISE NOTICE '--- LISTING ALL TABLES IN PUBLIC SCHEMA ---';
    FOR row IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        RAISE NOTICE 'Table: %', row.tablename;
    END LOOP;
END $$;
