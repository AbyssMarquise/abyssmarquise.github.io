# Passerelle OAuth Decap CMS

1. Crée une application OAuth GitHub : https://github.com/settings/developers
   - Homepage URL : `https://abyssmarquise.github.io`
   - Authorization callback URL : `https://TON-WORKER.workers.dev/callback`
2. Installe Wrangler, connecte-toi à Cloudflare et déploie depuis ce dossier :
   `npx wrangler deploy`
3. Dans Cloudflare, ajoute les secrets (ne jamais les inscrire dans Git) :
   `npx wrangler secret put GITHUB_CLIENT_ID`
   `npx wrangler secret put GITHUB_CLIENT_SECRET`
4. Remplace `REPLACE_WITH_YOUR_WORKER` dans `admin/config.yml` par le sous-domaine du Worker, puis publie le dépôt.

Le Worker ne stocke aucun jeton : il sert seulement à l’autorisation ponctuelle entre Decap et GitHub.
