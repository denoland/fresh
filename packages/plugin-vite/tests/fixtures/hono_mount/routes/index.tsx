export default function IndexPage() {
  return (
    <html>
      <head>
        <title>Fresh UI in Hono</title>
        <style>{`body { font-family: Arial, sans-serif; }`}</style>
      </head>
      <body>
        <h1>Fresh UI Home</h1>
        <p>This Fresh app is mounted in Hono at /ui</p>
        <a href="/ui/dashboard">Go to Dashboard</a>
      </body>
    </html>
  );
}
