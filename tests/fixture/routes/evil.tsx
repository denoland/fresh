import Test from "../islands/Test.tsx";

export default function EvilPage() {
  return (
    <div>
      <Test message={`</script><script>alert('test')</script>`} />
    </div>
  );
}
