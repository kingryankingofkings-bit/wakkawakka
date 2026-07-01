const { POST } = require("./src/app/api/forum/subforums/route.ts");
const { NextRequest } = require("next/server");

async function run() {
  try {
    const req = new NextRequest("http://localhost:3000/api/forum/subforums", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": "current"
      },
      body: JSON.stringify({
        name: "Test Community 2",
        description: "Test",
        rules: ["Rule 1"],
        isNSFW: false,
        isSpoiler: false
      })
    });
    
    const res = await POST(req);
    console.log(res.status);
    const text = await res.text();
    console.log(text);
  } catch (err) {
    console.error(err);
  }
}
run();
