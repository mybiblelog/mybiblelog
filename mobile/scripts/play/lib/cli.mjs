// Entry-point wrapper for the Play scripts.
//
// Bad input (an unknown locale, a missing key, an over-long title) is an
// everyday outcome for these tools, not a crash: report it as one line and exit
// non-zero instead of printing a stack trace at the operator.

export function run(main) {
  main().catch((error) => {
    console.error(`\n✗ ${error instanceof Error ? error.message : error}`);
    process.exit(1);
  });
}
