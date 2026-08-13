const GITHUB_AUTHORIZE = "https://github.com/login/oauth/authorize";

function html(body) {
  return new Response(body, {
    headers: { "content-type": "text/html; charset=UTF-8" },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/auth") {
      const githubUrl = new URL(GITHUB_AUTHORIZE);

      githubUrl.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
      githubUrl.searchParams.set("redirect_uri", `${url.origin}/callback`);
      githubUrl.searchParams.set("scope", "repo");

      return Response.redirect(githubUrl.toString(), 302);
    }

    if (url.pathname === "/callback") {
      const code = url.searchParams.get("code");

      if (!code) {
        return html("Autorisation GitHub annulée.");
      }

      return html(`<!doctype html>
<html>
  <body>
    <script>
      window.opener.postMessage(
        "authorization:github:success:" + ${JSON.stringify(code)},
        "https://abyssmarquise.github.io"
      );
      window.close();
    </script>
  </body>
</html>`);
    }

    return new Response("Not found", { status: 404 });
  },
};
