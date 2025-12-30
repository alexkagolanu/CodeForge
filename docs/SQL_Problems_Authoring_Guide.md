# SQL Problems Authoring Guide

This guide explains how to create, run, and validate SQL problems in the app. It covers:
- Problem types and engine
- Global SQL setup
- Per-test setup and query
- Expected output and checking modes
- CSV import to seed data
- Tips for performance, constraints, and reproducibility

## 1) Problem Type and Engine
- Problem Type: `SQL` (as opposed to `Algorithm`).
- Engine: SQLite (in-browser) using `sql.js`.
- Each test runs in a fresh in-memory database for isolation.

## 2) Global SQL Setup (Problem-level)
Add a SQL script that runs for every test before any test-level setup:
- Create tables with constraints and relations (PRIMARY KEY, FOREIGN KEY, UNIQUE).
- Create indexes, triggers, and views if needed.
- Seed initial data shared by all tests.
- You can use transactions; if any statement fails, the test fails with the error.

Example:
```sql
-- Global SQL Setup
CREATE TABLE employees(
  emp_id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  dept_id INTEGER NOT NULL
);
CREATE TABLE departments(
  dept_id INTEGER PRIMARY KEY,
  dept_name TEXT NOT NULL
);
CREATE INDEX idx_emp_dept ON employees(dept_id);
INSERT INTO departments VALUES (1,'Engineering'),(2,'Sales');
INSERT INTO employees VALUES (101,'Alice',1),(102,'Bob',2);
```

## 3) Test Cases (Per-test Setup and Query)
For each test case, you can optionally provide:
- Per-test Setup: DDL/DML that runs after the global setup and before the query. Useful to tweak or inject data for a particular test.
- Test Query: The SQL query under test. Its result is compared against the expected output for this test.

Example (per test):
```sql
-- Per-test Setup (optional)
INSERT INTO employees VALUES (103,'Carol',1);

-- Test Query
SELECT e.name, d.dept_name
FROM employees e
JOIN departments d ON d.dept_id = e.dept_id
ORDER BY e.name;
```

## 4) Expected Output and Checker Modes
The query result is serialized deterministically for comparison:
- Columns are separated by a single space.
- Rows are separated by newlines.
- NULL is rendered as `NULL`.

Example expected output for the query above:
```
Alice Engineering
Bob Sales
Carol Engineering
```

Author verification query (optional):
- For any test case, you may enable "Derive expected from author SQL" and provide an author SQL query.
- During judging, the app executes your author SQL (after global and per-test setup) to compute the expected output dynamically.
- If disabled, the expected output is taken from the test case's Expected Output field.

Checker modes (select in the problem’s Judging section):
- exact: strict string match.
- trim: compares after trimming whitespace.
- token: compares tokens split by whitespace (robust to spacing/newlines differences).
- float_tolerance: numeric tokens are compared with a tolerance; non-numeric tokens are exact.
- Optional: Case-insensitive toggle applies normalizing to lower-case before comparison.

Tip: Prefer `token` or `float_tolerance` for SQL due to formatting variations.

## 5) CSV Import
You can upload a CSV file and generate SQL `INSERT` statements into a target table.
- Choose a table name and whether to include a header row.
- The tool generates chunked `INSERT` batches in a transaction.
- You can paste the generated SQL into the Global Setup or a specific test’s Setup block.

CSV tips:
- Keep files ≤ ~10MB for performance in the browser.
- Use consistent column order and types.
- Clean embedded newlines/quotes or ensure proper CSV escaping.

## 6) Performance and Indexes
- Create indexes on columns used in joins/filters/sorts to demonstrate performance impact.
- Although SQLite in-browser doesn’t expose real execution plans reliably, indexes still affect runtime and are useful educationally.
- Keep datasets moderate in size to maintain fast, deterministic tests.

## 7) Reproducibility and Best Practices
- Use deterministic ordering (e.g., `ORDER BY`) in final queries to ensure stable output.
- Use explicit column lists in `INSERT` statements.
- Validate that each test’s expected output matches the actual result locally before publishing.
- Avoid engine-specific features not supported by SQLite.

## 8) Example Outline (Putting it Together)
1. Set Problem Type to SQL (Create Problem > Problem Type).
2. Add Global SQL Setup with tables, constraints, indexes, and seed data.
3. For each test case:
   - (Optional) Provide Per-test Setup.
   - Provide the Test Query (the user's query under test).
   - Choose whether to derive Expected Output from an Author SQL (optional), or enter Expected Output directly.
4. Select a checker mode and options.
5. Save and run tests.

## 9) Lists and SQL Problems
- SQL problems can be added to lists just like algorithm problems.
- Lists support mixing problem types (e.g., SQL + Algorithm).

## 10) Troubleshooting
- If a test fails with a SQL error, check for typos or missing objects in Global Setup vs Per-test Setup.
- If ordering differs, add an `ORDER BY` clause.
- For numeric drift/formatting, use `float_tolerance` and set a reasonable tolerance (e.g., 1e-6).

## 11) Security Notes
- All SQL runs in an in-browser, in-memory SQLite database isolated per test.
- No external network or server database calls occur during SQL evaluation.
