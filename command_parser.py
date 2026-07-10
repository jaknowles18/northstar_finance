from langchain_ollama import ChatOllama
from langchain_core.messages import SystemMessage, HumanMessage


def main():
    # Create the local LLM object.
    # This connects Python to the Ollama model you downloaded.
    llm = ChatOllama(
        model="gemma4:e4b",
        temperature=0.2
    )

    # This is the system prompt.
    # It tells the model how it should behave for the whole conversation.
    system_prompt = "You are a helpful assistant for a personal finance transaction tool. You can only return JSON's. Never return any text or data that is not in a JSON"

    print("Local bot started. Type 'quit' to exit.\n")

    # Keep the chatbot running until the user chooses to stop it.
    while True:
        # Ask the user for input and remove extra spaces at the start/end.
        user_input = input("You: ").strip()

        # Check if the user wants to exit the program.
        if user_input.lower() in ["quit", "exit"]:
            print("Bot: Goodbye.")
            break

        # Build the message list that gets sent to the model.
        # The system message sets the bot's role.
        # The human message is the user's current input.
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_input)
        ]

        # Send the messages to the model and get the response back.
        response = llm.invoke(messages)

        # Print only the text content of the model's response.
        print(f"Bot: {response.content}\n")


# This makes sure main() only runs when this file is executed directly.
# It will not run automatically if this file is imported into another Python file.
if __name__ == "__main__":
    main()
