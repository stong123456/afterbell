# User-provided model keys

AfterBell supports Qwen Beijing/Singapore, OpenAI and DeepSeek through a fixed server-side endpoint registry. Users can edit the model name; the chosen model must support Chat Completions JSON output. Provider/model availability remains account-specific and was not verified with real credentials.

Open Model setup, select provider/region, enter model name and API Key, then use the configuration. The key lives only in React page memory, is cleared on reload/provider change or explicit clear, and is sent only with an explicitly submitted BYOK analysis. The server forwards it to the selected provider in the Authorization header, never in the prompt. Redirects are rejected. No arbitrary endpoint URL is accepted. The application does not persist or log request bodies or credentials. Public deployment must use HTTPS and preserve that logging policy.

Reports and local journal entries retain only provider/model and research output, never the input model configuration. Server-provided Qwen remains an optional distinct engine. Invalid keys, unsupported models and provider failures return errors, without rule fallback. Only actual analysis invokes the provider and may incur provider charges; selecting a configuration is not a connection test.

Verification: 17 automated tests and build passed. Mock provider responses covered all four routes, credential exclusion, journal save and no redirects. Browser verified provider-change key clearing, selection of My model, clear-key action and bilingual settings. No real key was used or model success claimed.

Official protocol references:
- https://developers.openai.com/api/reference/resources/chat
- https://help.aliyun.com/en/model-studio/qwen-api-via-openai-chat-completions
- https://api-docs.deepseek.com/guides/json_mode
