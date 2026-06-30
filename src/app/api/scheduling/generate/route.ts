import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { brandName, websiteUrl, audience, tone, platform, prompt } = body;

    if (!brandName || !platform || !prompt) {
      return NextResponse.json(
        { error: "Missing required fields: brandName, platform, prompt" },
        { status: 400 },
      );
    }

    let generatedContent = "";

    const lowerPlatform = platform.toLowerCase();
    const lowerTone = tone ? tone.toLowerCase() : "professional";

    if (lowerPlatform === "x" || lowerPlatform === "twitter") {
      // Return a thread
      generatedContent =
        `1/ We're excited to share our latest update at ${brandName}! ${prompt} 🚀\n\n` +
        `2/ When we set out to build this, our main goal was to address the needs of our target audience (${audience || "everyone"}). We wanted something that is not only powerful but also incredibly intuitive.\n\n` +
        `3/ Check out the details at our website: ${websiteUrl || "our homepage"} and let us know what you think! What features are you most excited about? 👇 #buildinginpublic #${brandName.replace(/\s+/g, "")}`;
    } else if (lowerPlatform === "instagram") {
      generatedContent =
        `✨ Big news from ${brandName}! ✨\n\n` +
        `${prompt}\n\n` +
        `We've designed this especially for our amazing community. Head over to the link in our bio (${websiteUrl || "website"}) to learn more!\n\n` +
        `• • • • •\n` +
        `#${brandName.replace(/\s+/g, "")} #innovation #marketing #growth #${lowerTone}`;
    } else {
      // Default to LinkedIn
      generatedContent =
        `💼 Professional Update from ${brandName} 💼\n\n` +
        `We are thrilled to announce a significant step forward: ${prompt}.\n\n` +
        `At ${brandName}, our mission is to empower our audience (${audience || "professionals"}) with tools that drive efficiency and success. This new initiative is a direct response to the challenges we see in the industry today.\n\n` +
        `Read the full story here: ${websiteUrl || "our website"}\n\n` +
        `#${brandName.replace(/\s+/g, "")} #business #technology #innovation #${lowerTone}`;
    }

    return NextResponse.json({ content: generatedContent });
  } catch (error) {
    console.error("Error in generate AI endpoint:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
