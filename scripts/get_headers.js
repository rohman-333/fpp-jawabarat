async function run() {
  const url = 'https://tazbsyjulkmyscohiwgq.supabase.co/rest/v1/';
  try {
    const res = await fetch(url, {
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhemJzeWp1bGtteXNjb2hpd2dxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwNDE4ODcsImV4cCI6MjA5NDYxNzg4N30.7T9YHRPXXXQSor_4OyZpK2N2C8eMYSDjWLSnDrbi0eU'
      }
    });
    console.log("Status:", res.status);
    console.log("Headers:", JSON.stringify(Object.fromEntries(res.headers.entries()), null, 2));
  } catch (err) {
    console.error("Error:", err.message);
  }
}

run();
