# @bpmn-io/refactorings 👷

Refactorings for bpmn-js, powered by AI!

## Setup

```bash
npm install
npm start
```

### OpenAI Setup

To use OpenAI, you need to create an account and get an API key. Set the API key in the `.env` file:

```bash
OPENAI_API_KEY="..."
```

To set the number of reqests sent for each test, set `OPENAI_TEST_REQUESTS` in the `.env` file:

```bash
OPENAI_TEST_REQUESTS=3
```

## Testing

Run the tests:

```bash
# run tests
npm test

# run OpenAI tests
npm run test:openai
```

## License

MIT