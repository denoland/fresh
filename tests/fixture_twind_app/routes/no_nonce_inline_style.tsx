export default function Page() {
  return (
    <div>
      <h1>Nonce inline test</h1>
      <p class="text-green-600">This is green text</p>
      <style
        id="inline-style"
        dangerouslySetInnerHTML={{ __html: "h1 { color: red }" }}
      />
    </div>
  );
}
