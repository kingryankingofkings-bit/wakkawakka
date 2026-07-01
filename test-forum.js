async function test() {
  try {
    const res = await fetch("http://localhost:3000/api/forum/subforums", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": "current"
      },
      body: JSON.stringify({
        name: "Test Community",
        description: "A test community",
        rules: ["Rule 1"],
        isNSFW: false,
        isSpoiler: false
      })
    });
    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Response:", text.substring(0, 500));
  } catch (err) {
    console.error(err);
  }
}
test();
