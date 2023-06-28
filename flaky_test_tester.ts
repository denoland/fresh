async function main() {
  const runs = 100;
  let failures = 0;

  for (let i = 0; i < runs; i++) {
    console.log(`Run #${i + 1}`);

    const command = new Deno.Command("deno", {
      args: ["task", "test"],
    });

    const result = await command.output();

    const textDecoder = new TextDecoder();
    const stdout = textDecoder.decode(result.stdout);
    const stderr = textDecoder.decode(result.stderr);

    await Deno.writeTextFile(`run${i + 1}.log`, stdout);

    if (!result.success) {
      console.log("Test failed with error:", stderr);
      failures++;
    }
  }

  console.log(`Test run completed. ${runs} runs, ${failures} failures.`);
}

main();
