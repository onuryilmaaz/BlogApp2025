const { GoogleGenAI } = require("@google/genai");
const logger = require("../config/logger");
const {
  blogPostIdeasPrompt,
  generateReplyPrompt,
  blogSummaryPrompt,
} = require("../utils/prompts");

// Initialize AI client with error handling
let ai;
try {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }
  ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
} catch (error) {
  logger.error("Failed to initialize Google GenAI:", error);
}

// @desc   Generate blog content from title
// @route  POST /api/ai/generate
// @access Private
const generateBlogPost = async (req, res) => {
  try {
    const { title, tone } = req.body;

    if (!title || !tone) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (!ai) {
      return res.status(500).json({ message: "AI service is not available" });
    }

    const prompt = `Write a markdown-formatted blog post titled "${title}". Use a ${tone} tone. Include an introduction, subheadings, code examples if relevant, and a conclusion.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-lite",
      contents: prompt,
    });

    let rawText = response.text;
    res.status(200).json(rawText);
  } catch (error) {
    logger.error("Generate blog post error:", error);
    res
      .status(500)
      .json({ message: "Failed to generate blog post", error: error.message });
  }
};

// @desc   Generate blog post from title
// @route  POST /api/ai/generate-ideas
// @access Private
const generateBlogPostIdeas = async (req, res) => {
  try {
    const { topics } = req.body;

    if (!topics) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (!ai) {
      return res.status(500).json({ message: "AI service is not available" });
    }

    const prompt = blogPostIdeasPrompt(topics);

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-lite",
      contents: prompt,
    });

    let rawText = response.text;
    logger.info(`AI Ideas Response: ${rawText.substring(0, 200)}...`);

    // Clean the response more thoroughly
    const cleanedText = rawText
      .replace(/^```json\s*/i, "")
      .replace(/```\s*$/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    let data;
    try {
      data = JSON.parse(cleanedText);

      // Validate the structure - make validation more flexible
      if (!Array.isArray(data)) {
        // If it's not an array, try to wrap it
        if (typeof data === "object" && data !== null) {
          data = [data];
        } else {
          throw new Error("Invalid response format: expected array or object");
        }
      }

      if (data.length === 0) {
        throw new Error("Invalid response format: empty array");
      }

      // Validate each item with more flexible validation
      data.forEach((item, index) => {
        if (!item.title) {
          throw new Error(`Invalid item at index ${index}: missing title`);
        }
        // Set defaults for missing fields
        if (!item.description) item.description = "Açıklama mevcut değil";
        if (!Array.isArray(item.tags)) item.tags = ["genel"];
        if (!item.tone) item.tone = "günlük";
      });
    } catch (parseError) {
      logger.error("JSON parsing failed:", {
        rawText,
        cleanedText,
        error: parseError.message,
      });

      // Fallback response
      data = [
        {
          title: "Blog Yazısı Fikirleri",
          description:
            "AI yanıtı işlenirken bir hata oluştu.\nLütfen tekrar deneyin.",
          tags: ["genel", "blog", "yazı"],
          tone: "günlük",
        },
      ];
    }

    res.status(200).json(data);
  } catch (error) {
    logger.error("Generate blog ideas error:", error);
    res.status(500).json({
      message: "Failed to generate blog post ideas",
      error: error.message,
    });
  }
};

// @desc   Generate comment reply
// @route  POST /api/ai/generate-reply
// @access Private
const generateCommentReply = async (req, res) => {
  try {
    const { author, content } = req.body;

    if (!content) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (!ai) {
      return res.status(500).json({ message: "AI service is not available" });
    }

    const prompt = generateReplyPrompt({ author, content });

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-lite",
      contents: prompt,
    });

    let rawText = response.text;
    res.status(200).json(rawText);
  } catch (error) {
    logger.error("Generate comment reply error:", error);
    res.status(500).json({
      message: "Failed to generate comment reply",
      error: error.message,
    });
  }
};

// @desc   Generate blog post summary
// @route  POST /api/ai/generate-summary
// @access Private
const generatePostSummary = async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (!ai) {
      return res.status(500).json({ message: "AI service is not available" });
    }

    const prompt = blogSummaryPrompt(content);

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-lite",
      contents: prompt,
    });

    let rawText = response.text;

    // Clean the response more thoroughly
    const cleanedText = rawText
      .replace(/^```json\s*/i, "")
      .replace(/```\s*$/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    let data;
    try {
      data = JSON.parse(cleanedText);

      // Validate the structure with more flexible validation
      if (!data.title && !data.summary) {
        throw new Error(
          "Invalid response format: missing both title and summary"
        );
      }

      // Set defaults for missing fields
      if (!data.title) data.title = "Blog Yazısı Özeti";
      if (!data.summary) data.summary = cleanedText; // Use raw text as summary

      // Ensure title is not too long
      if (data.title.length > 200) {
        data.title = data.title.substring(0, 200) + "...";
      }
    } catch (parseError) {
      logger.error("JSON parsing failed for summary:", {
        rawText,
        cleanedText,
        error: parseError.message,
      });

      // Fallback response
      data = {
        title: "Blog Yazısı Özeti",
        summary:
          cleanedText ||
          "AI yanıtı işlenirken bir hata oluştu. Lütfen tekrar deneyin.",
      };
    }

    res.status(200).json(data);
  } catch (error) {
    logger.error("Generate post summary error:", error);
    res.status(500).json({
      message: "Failed to generate post summary",
      error: error.message,
    });
  }
};

module.exports = {
  generateBlogPost,
  generateBlogPostIdeas,
  generateCommentReply,
  generatePostSummary,
};
