const GITHUB_AUTHORIZE = "https://github.com/login/oauth/authorize";
const GITHUB_TOKEN = "https://github.com/login/oauth/access_token";

function html(body) {
  return new Response(body, {
    headers: { "content-type": "text/html; charset=UTF-8" },
  });
}

function getCookie(request, name) {
  const cookies = request.headers.get("cookie") || "";

  return cookies
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Decap CMS ouvre cette adresse :
    // /auth?provider=github&site_id=...&scope=repo
    if (url.pathname === "/auth") {
      const state = crypto.randomUUID();

      const githubUrl = new URL(GITHUB_AUTHORIZE);
      githubUrl.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
      githubUrl.searchParams.set("redirect_uri", `${url.origin}/callback`);
      githubUrl.searchParams.set("scope", "repo");
      githubUrl.searchParams.set("state", state);

      return new Response(null, {
        status: 302,
        headers: {
          location: githubUrl.toString(),
          "set-cookie": [
            `decap_oauth_state=${state}`,
            "HttpOnly",
            "Secure",
            "SameSite=Lax",
            "Path=/",
            "Max-Age=600",
          ].join("; "),
        },
      });
    }

    // GitHub redirige ici après l'autorisation.
    if (url.pathname === "/callback") {
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state");
      const savedState = getCookie(request, "decap_oauth_state");

      if (!code) {
        return html("Autorisation GitHub annulée.");
      }

      if (!state || state !== savedState) {
        return html("La vérification de sécurité a échoué. Réessaie.");
      }

      const tokenResponse = await fetch(GITHUB_TOKEN, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify({
          client_id: env.GITHUB_CLIENT_ID,
          client_secret: env.GITHUB_CLIENT_SECRET,
          code,
        }),
      });

      const token = await tokenResponse.json();

      if (!token.access_token) {
        return html("GitHub n’a pas retourné de jeton d’accès.");
      }

      const message = `authorization:github:success:${JSON.stringify({
        token: token.access_token,
        provider: "github",
      })}`;

      return html(`<!doctype html>
<html>
  <body>
    <script>
      window.opener.postMessage(${JSON.stringify(message)}, "*");
      window.close();
    </script>
  </body>
</html>`);
    }

    return new Response("Not found", { status: 404 });
  },
};
