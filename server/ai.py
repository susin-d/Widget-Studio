from openai import AsyncOpenAI

from server.config import settings
from server.schemas import ChatRequest

SYSTEM_PROMPTS = {
    "assistant": "You are a helpful companion for Widget Studio. Help the user manage clocks, weather, notes, and desktop widgets.",
    "motivator": "You are a high-energy motivational assistant. Help the user get things done with practical, encouraging advice.",
    "joker": "You are a developer joker. Respond with concise coding jokes or developer humor.",
    "coder": "You are a coding partner. Help the user write clean, optimized code and resolve bugs.",
}


async def complete_chat(payload: ChatRequest) -> str:
    client_kwargs = {
        "api_key": settings.OPENAI_API_KEY,
        "timeout": settings.AI_TIMEOUT_SECONDS,
    }
    if settings.OPENAI_BASE_URL:
        client_kwargs["base_url"] = settings.OPENAI_BASE_URL

    client = AsyncOpenAI(**client_kwargs)
    messages = [{
        "role": "system",
        "content": SYSTEM_PROMPTS.get(payload.persona, SYSTEM_PROMPTS["assistant"]),
    }]
    messages.extend(
        {"role": "assistant" if message.role == "assistant" else "user", "content": message.text}
        for message in payload.messages[-20:]
    )

    response = await client.chat.completions.create(
        model=settings.AI_MODEL,
        messages=messages,
        reasoning_effort=payload.reasoning_effort,
        max_tokens=settings.AI_MAX_TOKENS,
        temperature=settings.AI_TEMPERATURE,
    )
    reply = response.choices[0].message.content
    if not reply:
        raise RuntimeError("The AI provider returned an empty response")
    return reply.strip()
