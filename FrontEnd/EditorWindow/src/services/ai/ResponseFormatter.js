export const ResponseFormatter = {
  formatResponse: (rawText) => {
    // Ensure the text is properly formatted for the UI.
    // Replace any markdown artifacts or fix spacing if needed.
    // For now, it just cleans up the spacing.
    let formatted = rawText.trim();
    
    // If the LLM didn't explain anything, add a polite fallback
    if (!formatted || formatted === "") {
       formatted = "I've completed the task. Is there anything else you'd like to adjust?";
    }

    return formatted;
  }
};
