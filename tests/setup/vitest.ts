if (!process.env.DATABASE_URL || !process.env.DIRECT_URL) {
  throw new Error(
    "DATABASE_URL and DIRECT_URL must be set before running the test suite.",
  );
}
