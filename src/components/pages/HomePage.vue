<script setup lang="ts">
import {onMounted, ref} from "vue";
import type { Ref } from "vue";
import { generateOpenAIResponse, moderate } from "@/api/open-ai";
import autoAnimate from "@formkit/auto-animate";
import { InputDestination, InputOrigin } from "@/enums/input";
import { ConversationLength } from "@/enums/form";
import type { FormSubmissionFields } from "@/types/form";
import type { MessageObjectOpenAI } from "@/types/message";

const form = ref()
onMounted(() => {
  form.value.querySelectorAll(".formkit-outer").forEach(autoAnimate)
})

const bot1Responses = ref([] as Array<string>)
const bot2Responses = ref([] as Array<string>)
const userInput = ref("")
const previousUserInput = ref("")
const chatHistoryMessageIsVisible = ref(false)
const flagged:  Ref<boolean | undefined> = ref(false)
const bot1Destination = ref("")
const bot2Destination = ref("")
const disableDropdowns = ref(false)

const modelDestinationOptions = [
  { label: 'OpenAI: GPT 3.5 Turbo', value: InputDestination.OPENAI },
]

const conversationTurnOptions = [
  { label: 'S: 2 bot responses per turn', value: ConversationLength.SHORT },
  { label: 'M: 4 bot responses per turn', value: ConversationLength.MEDIUM },
  { label: 'L: 6 bot responses per turn', value: ConversationLength.LONG },
]

let chatHistoryOpenAI: MessageObjectOpenAI[] = []
let chatHistoryWithInstructionsOpenAI: MessageObjectOpenAI[] = []

const instructionsOpenAI = 'You are a friendly, helpful assistant. '
  + 'You are having a conversation with another chat bot, discussing what the user has requested. '
  + 'There are only two bots in the conversation. '
  + 'Never identify yourself as "User:" in your response. '
  + 'Never repeat a response from you or the other bot. '
  + 'You will expand upon things the other chat bot says to help the user with their question. '
  + 'You can disagree, agree, and/or add alternatives if you wish. '
  + 'Say things like "I agree" or "I disagree" so it appears as if you are having a conversation. '
  + 'Think of other ways to make it appear like you are having a conversation.'

function addToChatHistory(origin: InputOrigin, input: string) {
    switch (origin) {
      case InputOrigin.USER:
        chatHistoryOpenAI.push({ role: "user", content: input })
        break
      case InputOrigin.BOT_1:
        chatHistoryOpenAI.push({ role: "assistant", content: input })
        break
      case InputOrigin.BOT_2:
        chatHistoryOpenAI.push({ role: "assistant", content: input })
        break
    }
}

function clearChatHistory() {
  chatHistoryOpenAI = []
  chatHistoryMessageIsVisible.value = true
  previousUserInput.value = ""
  bot1Responses.value = []
  bot2Responses.value = []
  disableDropdowns.value = false
}

async function generate(fields: FormSubmissionFields) {
  disableDropdowns.value = true
  chatHistoryMessageIsVisible.value = false
  flagged.value = false
  userInput.value = fields.userInput
  bot1Destination.value = fields.bot1Destination
  bot2Destination.value = fields.bot2Destination
  flagged.value = await moderate(userInput.value)
  previousUserInput.value = ""
  bot1Responses.value = []
  bot2Responses.value = []
  previousUserInput.value = userInput.value
  if (flagged.value === true) {
    userInput.value = ""
    return
  }
  addToChatHistory(InputOrigin.USER, userInput.value)
  userInput.value = ""
  chatHistoryWithInstructionsOpenAI = [
    { role: 'system', content: instructionsOpenAI },
    ...chatHistoryOpenAI,
  ]
  // Bot 1; response 1
  if (bot1Destination.value === InputDestination.OPENAI) {
    const response = await generateOpenAIResponse(chatHistoryWithInstructionsOpenAI)
    bot1Responses.value.push(response)
    addToChatHistory(InputOrigin.BOT_1, response)
  }
  chatHistoryWithInstructionsOpenAI = [
    { role: 'system', content: instructionsOpenAI },
    ...chatHistoryOpenAI,
  ]
  // Bot 2; response 1
  if (bot2Destination.value === InputDestination.OPENAI) {
    const response = await generateOpenAIResponse(chatHistoryWithInstructionsOpenAI)
    bot2Responses.value.push(response)
    addToChatHistory(InputOrigin.BOT_2, response)
  }
  if (fields.conversationLength === ConversationLength.SHORT) {
    return
  }
  chatHistoryWithInstructionsOpenAI = [
    { role: 'system', content: instructionsOpenAI },
    ...chatHistoryOpenAI,
  ]
  // Bot 1; response 2
  if (bot1Destination.value === InputDestination.OPENAI) {
    const response = await generateOpenAIResponse(chatHistoryWithInstructionsOpenAI)
    bot1Responses.value.push(response)
    addToChatHistory(InputOrigin.BOT_1, response)
  }
  chatHistoryWithInstructionsOpenAI = [
    { role: 'system', content: instructionsOpenAI },
    ...chatHistoryOpenAI,
  ]
  // Bot 2; response 2
  if (bot2Destination.value === InputDestination.OPENAI) {
    const response = await generateOpenAIResponse(chatHistoryWithInstructionsOpenAI)
    bot2Responses.value.push(response)
    addToChatHistory(InputOrigin.BOT_2, response)
  }
  if (fields.conversationLength === ConversationLength.MEDIUM) {
    return
  }
  chatHistoryWithInstructionsOpenAI = [
    { role: 'system', content: instructionsOpenAI },
    ...chatHistoryOpenAI,
  ]
  // Bot 1; response 3
  if (bot1Destination.value === InputDestination.OPENAI) {
    const response = await generateOpenAIResponse(chatHistoryWithInstructionsOpenAI)
    bot1Responses.value.push(response)
    addToChatHistory(InputOrigin.BOT_1, response)
  }
  chatHistoryWithInstructionsOpenAI = [
    { role: 'system', content: instructionsOpenAI },
    ...chatHistoryOpenAI,
  ]
  // Bot 2; response 3
  if (bot2Destination.value === InputDestination.OPENAI) {
    const response = await generateOpenAIResponse(chatHistoryWithInstructionsOpenAI)
    bot2Responses.value.push(response)
    addToChatHistory(InputOrigin.BOT_2, response)
  }
}
</script>

<template>
  <div v-auto-animate>

    <h2>Let's Discuss</h2>

    <div v-if="previousUserInput" class="saved-user-input-container">
      <span>You:</span>
      <p class="saved-user-input">
        {{ previousUserInput }}
      </p>
    </div>

    <!-- Bot 1; response 1 -->
    <div v-if="bot1Responses.length >= 1" class="bot-response-container">
      <img alt="Bot 1" class="bot-image" src="@/assets/images/bot-1.svg" width="75" height="75" />
      <span class="bot-response-label">Bot 1:</span>
      <div class="bot-response">
        {{ bot1Responses[0] }}
      </div>
    </div>

    <!-- Bot 2; response 1 -->
    <div v-if="bot2Responses.length >= 1" class="bot-response-container">
      <img alt="Bot 2" class="bot-image" src="@/assets/images/bot-2.svg" width="75" height="75" />
      <span class="bot-response-label">Bot 2:</span>
      <div class="bot-response">
        {{ bot2Responses[0] }}
      </div>
    </div>

    <!-- Bot 1; response 2 -->
    <div v-if="bot1Responses.length >= 2" class="bot-response-container">
      <img alt="Bot 1" class="bot-image" src="@/assets/images/bot-1.svg" width="75" height="75" />
      <span class="bot-response-label">Bot 1:</span>
      <div class="bot-response">
        {{ bot1Responses[1] }}
      </div>
    </div>

    <!-- Bot 2; response 2 -->
    <div v-if="bot2Responses.length >= 2" class="bot-response-container">
      <img alt="Bot 2" class="bot-image" src="@/assets/images/bot-2.svg" width="75" height="75" />
      <span class="bot-response-label">Bot 2:</span>
      <div class="bot-response">
        {{ bot2Responses[1] }}
      </div>
    </div>

    <!-- Bot 1; response 3 -->
    <div v-if="bot1Responses.length === 3" class="bot-response-container">
      <img alt="Bot 1" class="bot-image" src="@/assets/images/bot-1.svg" width="75" height="75" />
      <span class="bot-response-label">Bot 1:</span>
      <div class="bot-response">
        {{ bot1Responses[2] }}
      </div>
    </div>

    <!-- Bot 2; response 3 -->
    <div v-if="bot2Responses.length === 3" class="bot-response-container">
      <img alt="Bot 2" class="bot-image" src="@/assets/images/bot-2.svg" width="75" height="75" />
      <span class="bot-response-label">Bot 2:</span>
      <div class="bot-response">
        {{ bot2Responses[2] }}
      </div>
    </div>

    <hr v-if="bot1Responses.length > 0">

    <div class="form" ref="form">
      <FormKit type="form" @submit="generate" submit-label="Discuss">
        <FormKit
          type="dropdown"
          name="bot1Destination"
          label="Bot 1"
          placeholder="Select"
          :options="modelDestinationOptions"
          :disabled="disableDropdowns"
          validation="required"
          validation-visibility="submit"
          value="openai"
        />

        <FormKit
          type="dropdown"
          name="bot2Destination"
          label="Bot 2"
          placeholder="Select"
          :options="modelDestinationOptions"
          :disabled="disableDropdowns"
          validation="required"
          validation-visibility="submit"
          value="openai"
        />

        <FormKit
          type="dropdown"
          name="conversationLength"
          label="Conversation Length"
          :options="conversationTurnOptions"
          :disabled="disableDropdowns"
          validation="required"
          validation-visibility="submit"
          value="long"
        />

        <FormKit
          type="text"
          name="userInput"
          label="Your input"
          placeholder="Hey bots, help me understand..."
          v-model.trim="userInput"
          validation="required:trim"
          validation-visibility="submit"
        />
      </FormKit>
    </div>

    <div class="clear-container">
      <button v-if="chatHistoryOpenAI.length > 0" @click="clearChatHistory" type="button" class="clear-button">Clear Chat History</button>
      <p v-if="chatHistoryMessageIsVisible">
        Chat history has been cleared.
      </p>
    </div>

    <div v-if="flagged" class="flagged-container">
      <p>
        Your input violated OpenAI's <a href="https://openai.com/policies/usage-policies" target="_blank" rel="noopener">usage policies</a>.
      </p>
    </div>

  </div>
</template>

<style scoped lang="scss">
h2 {
  text-align: center;
}

.form,
.bot-response-container,
.saved-user-input-container,
.clear-container,
.flagged-container {
  margin: 0.5rem auto;
  width: 350px;
}

.bot-response-label {
  margin-bottom: 0.5rem;
  display: block;
}

.bot-response {
  border-radius: 5px;
  background-color: #b9b5b5;
  padding: 0.5rem;
  color: #000;
}

.saved-user-input {
  margin: 0.5rem;
}

hr {
  border: none;
  height: 2px;
  width: 350px;
  margin: 2rem auto;
  background-color: #000;
}

.clear-button {
  border: none;
  border-radius: 5px;
  background-color: transparent;
  color: #ff3131;
  text-decoration: underline;

  &:hover {
    text-decoration: none;
  }
}

.clear-container {
  text-align: center;
}

.bot-image {
  display: block;
  margin: 1rem auto auto;
}

.flagged-container {
  p,
  a {
    color: #ff3131;
  }

  a {
    font-weight: bold;

    &:hover {
      text-decoration: none;
    }
  }
}
</style>
