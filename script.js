/* DOM elements */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");

// Array to store conversation history
let conversationHistory = [];

// Function to display AI message as a chat bubble
function displayAIMessage(message) {
  chatWindow.innerHTML = `<div class="message-container ai-message">
    <div class="chat-bubble ai-bubble">
      ${message}
    </div>
  </div>`;
}

// Set initial message as a chat bubble
displayAIMessage(" Hello! How can I help you today?");

//Start of OpenAI API integration using Cloudflare Worker

//cloudflare worker URL
const WORKER_URL = "https://billowing-wildflower-1d19.bxv5614.workers.dev/";

/* Function to send user input to the Cloudflare Worker */
async function sendToOpenAI(userMessage) {
  try {
    // This displays when AI response is being fetched - now as a chat bubble
    displayAIMessage("Thinking...");

    // Add user message to conversation history
    conversationHistory.push({ role: "user", content: userMessage });

    // Create messages array with system prompts and conversation history
    const messages = [
      {
        role: "system",
        content:
          "Act as an expert assistant dedicated solely to helping users discover, learn about, and choose from L'Oréal's portfolio of products—including makeup, skincare, haircare, and fragrances—and providing personalized beauty routines and recommendations exclusively featuring these items. - Only answer questions that are directly connected to L'Oréal products, their selection, application, routines that use L'Oréal products, or recommendations for beauty goals achievable with L'Oréal offerings.- If asked about non-L'Oréal products, non-beauty topics, or unrelated subjects, politely decline to address these and gently redirect the user to relevant topics involving L'Oréal products.When responding:- Always first consider whether the question is relevant to L'Oréal's range before providing information.- When delivering personalized recommendations or routines, ask clarifying questions about the user's goals, preferences, skin/hair type, and concerns if not explicitly stated.- For non-relevant queries, respond courteously and invite the user to discuss L'Oréal products, categories, or beauty routines instead.Output Format:- Provide answers as concise, professional paragraphs tailored to the user's question, explicitly referencing L'Oréal products when applicable.- For routines or recommendations, structure responses into clear steps or lists where appropriate.- For non-relevant queries, deliver a brief, courteous redirection as a standalone response. Examples:**Example 1**  Input: Can you recommend a skincare routine for sensitive skin using L'Oréal products?Reasoning: This question is directly related to L'Oréal skincare offerings for sensitive skin.  Conclusion/Output:  Certainly! For sensitive skin, I recommend starting with the L'Oréal Paris Micellar Cleansing Water for gentle cleansing, followed by the L'Oréal Paris Revitalift Derm Intensives 1.5% Pure Hyaluronic Acid Serum to boost hydration. Finish with the L'Oréal Paris Age Perfect Rosy Tone Moisturizer for moisture and a healthy glow. All of these products are suitable for sensitive skin types.",
      },
      {
        role: "system",
        content:
          "Examples:**Example 1**  Input: Can you recommend a skincare routine for sensitive skin using L'Oréal products? Reasoning: This question is directly related to L'Oréal skincare offerings for sensitive skin.  Conclusion/Output:  Certainly! For sensitive skin, I recommend starting with the L'Oréal Paris Micellar Cleansing Water for gentle cleansing, followed by the L'Oréal Paris Revitalift Derm Intensives 1.5% Pure Hyaluronic Acid Serum to boost hydration. Finish with the L'Oréal Paris Age Perfect Rosy Tone Moisturizer for moisture and a healthy glow. All of these products are suitable for sensitive skin types.**Example 2**  Input: What's the difference between L'Oréal's Infallible and True Match foundations? Reasoning: The question specifically compares two L'Oréal foundation lines, which is within scope.  Conclusion/Output:  L'Oréal's Infallible foundation is designed for long-lasting, full coverage with a matte finish, ideal for oily or combination skin. True Match, on the other hand, offers a more natural, customizable finish with a wide shade range and is suitable for most skin types, focusing on a seamless match to your skin's tone and undertone. **Example 3** Input: Can you tell me about other brands of moisturizer?  Reasoning: The question asks about non-L'Oréal brands, which is outside of the allowed scope. Conclusion/Output:  I'm here to help specifically with L'Oréal products. If you're interested in finding a L'Oréal moisturizer that meets your needs, I'd be happy to recommend options or give you more information about their skincare range. (For real use, expand answers to accurately reflect L'Oréal's broad portfolio and provide more detail in recommendations based on the user's input.)Important: - Only answer questions directly related to L'Oréal products, usage, or related beauty routines.- Decline unrelated questions politely and redirect to L'Oréal-focused topics.**Remember: The goal is to inform, recommend, and guide users—always focused entirely on L'Oréal offerings and associated beauty routines, never on outside brands or unrelated subjects. Also, when listing multiple products, ensure that each one is on a NEW line for clarity.**",
      },
      {
        role: "system",
        content:
          "Output Format:- Provide answers as concise, professional paragraphs tailored to the user’s question, explicitly referencing L’Oréal products when applicable. - For routines or recommendations, structure responses into clear steps or lists where appropriate, and always place each product on a new line when more than one is mentioned. - For non-relevant queries, deliver a brief, courteous redirection as a standalone response.",
      },

      // Include all conversation history
      ...conversationHistory,
    ];

    //This sends the user message to the Cloudflare Worker
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: messages,
      }),
    });

    //check to see if the response was successful
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    //This gets the response from the Cloudflare Worker
    const data = await response.json();

    //Extracts the AI response from the data
    const aiResponse = data.choices[0].message.content;

    // Add AI response to conversation history
    conversationHistory.push({ role: "assistant", content: aiResponse });

    // Display the full conversation history
    displayConversation();
  } catch (error) {
    // Handle any errors - also display as chat bubble
    console.error("Error:", error);
    displayAIMessage(
      "❌ Sorry, there was an error connecting to the AI. Please try again!"
    );
  }
}

/* Function to display the latest question and response with chat bubbles */
function displayConversation() {
  // Check if we have at least one complete question-answer pair
  if (conversationHistory.length >= 2) {
    // Get the latest user question and AI response
    const latestUserMessage =
      conversationHistory[conversationHistory.length - 2];
    const latestAIResponse =
      conversationHistory[conversationHistory.length - 1];

    // Display messages with chat bubble styling (no extra spacing)
    chatWindow.innerHTML = `<div class="message-container user-message">
        <div class="chat-bubble user-bubble">
          ${latestUserMessage.content}
        </div>
      </div>
      <div class="message-container ai-message">
        <div class="chat-bubble ai-bubble">
          ${latestAIResponse.content}
        </div>
      </div>`;
  }
}

/* Handle form submit */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  //gets the user's message
  const userMessage = userInput.value.trim();

  //we'll check if the user input is empty
  if (userMessage) {
    //send the user message to OpenAI via the Cloudflare Worker
    await sendToOpenAI(userMessage);

    //clear the input field
    userInput.value = "";
  }
});
