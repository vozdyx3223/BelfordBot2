const MENU = {
  inline_keyboard: [
    [{ text: "📊 Прайси", callback_data: "prices" }],
    [{ text: "📚 Інформація", callback_data: "info" }],
    [{ text: "💎 Premium", callback_data: "premium" }],
    [{ text: "📞 Підтримка", callback_data: "support" }]
  ]
};

async function telegram(env, method, data) {
  const response = await fetch(
    `https://api.telegram.org/bot${env.BOT_TOKEN}/${method}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    }
  );

  return response.json();
}

function menuText() {
  return (
    "🤖 BELFORD TEAM\n\n" +
    "Добро пожаловать!\n\n" +
    "Здесь вы можете ознакомиться с обучением " +
    "криптотрейдингу от BELFORD TEAM.\n\n" +
    "Выберите нужный раздел:"
  );
}

function sectionText(type) {
  if (type === "prices") {
    return (
      "📊 ПРАЙСЫ\n\n" +
      "БАЗОВЫЙ КУРС\n" +
      "Цена: УКАЖИ ЦЕНУ\n\n" +
      "💎 PREMIUM\n" +
      "Цена: УКАЖИ ЦЕНУ"
    );
  }

  if (type === "info") {
    return (
      "📚 ИНФОРМАЦИЯ\n\n" +
      "На обучении рассматриваются:\n\n" +
      "• Основы криптотрейдинга\n" +
      "• Анализ рынка\n" +
      "• Работа с графиками\n" +
      "• Торговая стратегия\n" +
      "• Управление рисками"
    );
  }

  if (type === "premium") {
    return (
      "💎 PREMIUM\n\n" +
      "Расширенная программа обучения " +
      "и дополнительные материалы.\n\n" +
      "Цена: УКАЖИ ЦЕНУ"
    );
  }

  if (type === "support") {
    return (
      "📞 ПОДДЕРЖКА\n\n" +
      "По вопросам обращайтесь к администратору:\n\n" +
      "@YOUR_USERNAME"
    );
  }

  return "Неизвестный раздел.";
}

async function handleUpdate(update, env) {
  if (update.message) {
    const chatId = update.message.chat.id;
    const text = update.message.text || "";

    if (text === "/start") {
      await telegram(env, "sendMessage", {
        chat_id: chatId,
        text: menuText(),
        reply_markup: MENU
      });
    }
  }

  if (update.callback_query) {
    const query = update.callback_query;

    await telegram(env, "answerCallbackQuery", {
      callback_query_id: query.id
    });

    if (query.data === "back") {
      await telegram(env, "editMessageText", {
        chat_id: query.message.chat.id,
        message_id: query.message.message_id,
        text: menuText(),
        reply_markup: MENU
      });
      return;
    }

    await telegram(env, "editMessageText", {
      chat_id: query.message.chat.id,
      message_id: query.message.message_id,
      text: sectionText(query.data),
      reply_markup: {
        inline_keyboard: [
          [{ text: "⬅️ Назад", callback_data: "back" }]
        ]
      }
    });
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Первоначальная настройка webhook
    if (url.pathname === "/setup") {
      const key = url.searchParams.get("key");

      if (!env.SETUP_KEY || key !== env.SETUP_KEY) {
        return new Response("Forbidden", { status: 403 });
      }

      const webhookUrl = `${url.origin}/webhook`;

      const result = await telegram(env, "setWebhook", {
        url: webhookUrl
      });

      return Response.json(result);
    }

    // Telegram webhook
    if (url.pathname === "/webhook" && request.method === "POST") {
      const update = await request.json();
      await handleUpdate(update, env);

      return new Response("OK");
    }

    return new Response("Belford Team Bot is running!");
  }
};
