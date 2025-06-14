// const blogPostIdeasPrompt = (topic) => `
//     Generate a list of 5 blog post ideas related to ${topic}.

// For each blog post idea, return:
// - a title
// - a 2-line description about the post
// - 3 releant tags
// - the tone (e.g., technical, casual, beginner-friendyl, etc.)

// Return the result as an array of JSON objects in the format:
// [
//   {
//     "title": "",
//     "description": "",
//     "tags": ["","",""],
//     "tone": "
//   }
// ]
// Important: Do NOT add any extra text outside the JSON format. Only return valid JSON.
//     `;

// function generateReplyPrompt(comment) {
//   const authorName = comment.author?.name || "User";
//   const content = comment.content;

//   return `You're replying to a blog comment by ${authorName}. The comment says:

//     "${content}"

//     Write a thoughtful, concise, and relevant reply to this comment.`;
// }

// const blogSummaryPrompt = (blogContent) => `
//     You are an AI assistant that summarizes blog posts.

//     Instructions:
//     - Read the blog post content below.
//     - Generate a short, catchy, SEO-friendly title (max 12 words).
//     - Write a clear, engaging summary of about 300 words.
//     - At the end of the summary, add a markdown section titled **## What You'll Learn##**.
//     - Under that heading, list 3-5 key takeaways or skills the reader will learn in **bullet points** using markdown (\`-\`).

//     Return the results in **valid JSON** with the following structure:

//     {
//       "title": "Short SEO-friendly title",
//       "summary": "300-words summary with a markdown section for What You'll Learn"
//     }

//     Only return valid JSON. Do not include markdown or code blocks around the JSON.

//     Blog Post Content:
//     ${blogContent}
//     `;

// module.exports = {
//   blogPostIdeasPrompt,
//   generateReplyPrompt,
//   blogSummaryPrompt,
// };

//---------------

// const blogPostIdeasPrompt = (topic) => `
//     Generate a list of 5 creative and engaging blog post ideas related to "${topic}".
//     **Please provide all output in Turkish.**

//     Requirements for each blog post idea:
//     - Create an attention-grabbing title (8-15 words)
//     - Write a compelling 2-line description that explains the value to readers
//     - Suggest 3 relevant, searchable tags (no spaces, use camelCase if needed)
//     - Choose an appropriate tone from: "teknik", "günlük", "başlangıç", "profesyonel", "eğlenceli"

//     Return ONLY a valid JSON array in this exact format:
//     [
//       {
//         "title": "Engaging blog post title",
//         "description": "First line of description.\nSecond line explaining the benefit.",
//         "tags": ["tag1", "tag2", "tag3"],
//         "tone": "günlük"
//       }
//     ]

//     CRITICAL: Return ONLY the JSON array. No additional text, explanations, or markdown formatting.
//     `;

// function generateReplyPrompt(comment) {
//   const authorName = comment.author?.name || "User";
//   const content = comment.content;

//   return `Sen bir blog yazarısın ve ${authorName} adlı okuyucunun yorumuna yanıt veriyorsun.

//     Yorumu: "${content}"

//     Lütfen bu yoruma:
//     - Samimi ve profesyonel bir ton kullanarak
//     - Kısa ve öz (maksimum 2-3 cümle)
//     - Değer katacak şekilde
//     - Türkçe olarak yanıt ver.

//     Sadece yanıt metnini döndür, başka açıklama ekleme.`;
// }

// const blogSummaryPrompt = (blogContent) => `
//     Sen bir blog editörüsün ve aşağıdaki blog yazısını özetliyorsun.

//     Görevlerin:
//     1. SEO dostu, dikkat çekici bir başlık oluştur (maksimum 12 kelime, Türkçe)
//     2. Yaklaşık 300 kelimelik açık ve ilgi çekici bir özet yaz (Türkçe)
//     3. Özetin sonunda "## Neler Öğreneceksiniz" başlıklı bir markdown bölümü ekle
//     4. Bu başlık altında okuyucunun öğreneceği 3-5 ana konuyu madde işareti (-) ile listele (Türkçe)

//     SADECE aşağıdaki JSON formatında yanıt ver:

//     {
//       "title": "SEO dostu kısa başlık",
//       "summary": "300 kelimelik özet ve Neler Öğreneceksiniz markdown bölümü"
//     }

//     ÖNEMLİ: Sadece geçerli JSON döndür. JSON'un dışında hiçbir metin, açıklama veya markdown blok ekleme.

//     Blog İçeriği:
//     ${blogContent}
//     `;
// module.exports = {
//   blogPostIdeasPrompt,
//   generateReplyPrompt,
//   blogSummaryPrompt,
// };

const blogPostIdeasPrompt = (topic) => `
    Generate a list of 5 blog post ideas related to ${topic}.
    **Please provide all output in Turkish.**

For each blog post idea, return:
- a title
- a 2-line description about the post
- 3 releant tags
- the tone (e.g., technical, casual, beginner-friendyl, etc.)

Return the result as an array of JSON objects in the format:
[
  {
    "title": "",
    "description": "",
    "tags": ["","",""],
    "tone": "
  }
]
Important: Do NOT add any extra text outside the JSON format. Only return valid JSON.
    `;

function generateReplyPrompt(comment) {
  const authorName = comment.author?.name || "User";
  const content = comment.content;

  return `You're replying to a blog comment by ${authorName}. The comment says:

    "${content}"

    Write a thoughtful, concise, and relevant reply to this comment. **Please write the reply in Turkish.**`;
}

const blogSummaryPrompt = (blogContent) => `
    You are an AI assistant that summarizes blog posts.

    Instructions:
    - Read the blog post content below.
    - Generate a short, catchy, SEO-friendly title (max 12 words) **in Turkish**.
    - Write a clear, engaging summary of about 300 words **in Turkish**.
    - At the end of the summary, add a markdown section titled **## What You'll Learn##**.
    - Under that heading, list 3-5 key takeaways or skills the reader will learn in **bullet points** using markdown (\`-\`) **in Turkish**.

    Return the results in **valid JSON** with the following structure:

    {
      "title": "Short SEO-friendly title",
      "summary": "300-words summary with a markdown section for What You'll Learn"
    }

    Only return valid JSON. Do not include markdown or code blocks around the JSON.

    Blog Post Content:
    ${blogContent}
    `;
module.exports = {
  blogPostIdeasPrompt,
  generateReplyPrompt,
  blogSummaryPrompt,
};
