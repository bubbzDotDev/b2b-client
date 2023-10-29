import axios from 'axios'

const CONTROLLER_PATH = `${import.meta.env.VITE_SERVER_LOCATION}/api/open-ai`

export const generateOpenAIResponse = async (messages: object[]) => {
    try {
        const { data } = await axios.post(`${CONTROLLER_PATH}/generate`,
          {
              input: messages,
            },
          {
              headers: {
                  "Content-Type": "application/json",
              },
          })

        return data.choices[0].message.content
    } catch(error) {
        console.error(error)
    }
}

export const moderate = async (input: string) => {
    try {
        const { data } = await axios.post(`${CONTROLLER_PATH}/moderate`,
          {
            input
            },
          {
              headers: {
                  "Content-Type": "application/json",
              },
          })
        let flagged = false
        if (
            data.results[0].flagged
            || data.results[0].categories.harassment
            || data.results[0].categories['harassment/threatening']
            || data.results[0].categories.hate
            || data.results[0].categories['hate/threatening']
            || data.results[0].categories['self-harm']
            || data.results[0].categories['self-harm/instructions']
            || data.results[0].categories['self-harm/intent']
            || data.results[0].categories.sexual
            || data.results[0].categories['sexual/minors']
            || data.results[0].categories.violence
            || data.results[0].categories['violence/graphic']
        ) {
            flagged = true
        }

        return flagged
    } catch(error) {
        console.error(error)
    }
}
