const GITHUB_AUTHORIZE = "https://github.com/login/oauth/authorize";
const GITHUB_TOKEN = "https://github.com/login/oauth/access_token";

function html(body) {
  return new Response(body, {
    headers: { "content-type": "text/html; charset=UTF-8" },
  });
}

function cookie(request, name) {
  return request.headers
    .get("cookie")
    ?.split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/auth") {
      const state = crypto.randomUUID();
      const redirect = new URL(GITHUB_AUTHORIZE);
      redirect.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
      redirect.searchParams.set("redirect_uri", `${url.origin}/callback`);
      redirect.searchParams.set("scope", "repo");
      redirect.searchParams.set("state", state);
      return new Response(null, {
        status: 302,
        headers: {
          location: redirect.toString(),
          "set-cookie": `decap_oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`,
        },
      });
    }
    if (url.pathname === "/callback") {
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state");
      if (!code) return html("Autorisation GitHub annulée.");
      if (!state || state !== cookie(request, "decap_oauth_state")) {
        return html(
          "La vérification de sécurité a échoué. Réessaie la connexion.",
        );
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
      if (!token.access_token)
        return html("Impossible d’obtenir l’autorisation GitHub.");
      return html(`<script>
  window.opener.postMessage(
    'authorization:github:success:' + JSON.stringify({
      token: '${token.access_token}',
      provider: 'github'
    }),
    '${env.SITE_ORIGIN}'
  );
  window.close();
</script>`);
    }
    return new Response("Not found", { status: 404 });
  },
};
