export async function onRequest(context) {
  const { request, next, env } = context;
  const url = new URL(request.url);
  const cookie = request.headers.get("Cookie") || "";

  // 1. 環境変数でパスワードが設定されていない場合は、鍵をかけずにスルー
  if (!env.CFP_PASSWORD) {
    return await next();
  }

  // 2. すでにログイン済み（Cookieを持っている）かチェック
  if (cookie.includes(`cfp_auth=${env.CFP_PASSWORD}`)) {
    return await next();
  }

  // 3. パスワード送信（POST）時の処理
  if (request.method === "POST") {
    const formData = await request.formData();
    const password = formData.get("password");

    if (password === env.CFP_PASSWORD) {
      // パスワードが合っていたらCookieをセットしてリロード
      return new Response("Redirecting...", {
        status: 302,
        headers: {
          "Set-Cookie": `cfp_auth=${env.CFP_PASSWORD}; Path=/; HttpOnly; Secure; SameSite=Strict`,
          "Location": url.pathname,
        },
      });
    }
  }

  // 4. ログイン画面を表示
  return new Response(
    `
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Protected</title>
        <style>
            body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f4f4f9; }
            form { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            input { width: 100%; padding: 10px; margin: 10px 0; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; }
            button { width: 100%; padding: 10px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; }
            button:hover { background: #0056b3; }
        </style>
    </head>
    <body>
        <form method="POST">
            <h3>閲覧制限</h3>
            <p>パスワードを入力してください</p>
            <input type="password" name="password" placeholder="Password" autofocus>
            <button type="submit">ログイン</button>
        </form>
    </body>
    </html>
    `,
    {
      headers: { "Content-Type": "text/html; charset=UTF-8" },
    }
  );
}
