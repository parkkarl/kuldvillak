# Deploy

## Repositoorium

- **GitHub:** https://github.com/parkkarl/kuldvillak
- **Branch:** `main` (pole eraldi staging/prod harusid)

## Live keskkond

- **URL:** https://juuksur.kalaradar.ee
- **Server:** `hetzner` (SSH alias, vt `~/.ssh/config`)
- **Tee serveris:** `/opt/kuldvillak/`
- **Konteiner:** `kuldvillak-app` (image: `kuldvillak-app`)
- **Port mapping:** `127.0.0.1:3100 -> 3000` (reverse proxy ees)

## Serveri struktuur

Server EI ole git clone — failid on käsitsi paigaldatud `/opt/kuldvillak/` alla:

```
/opt/kuldvillak/
  docker-compose.yml
  Dockerfile
  package.json
  package-lock.json
  server.js
  src/
  public/
  docs/
  input/          ← :ro mount konteinerisse /app/input
    001/ 002/ 003/ 004/
```

`docker-compose.yml` mountib `./input` konteinerisse **read-only** kujul, mis tähendab:

- Konteiner loeb `input/*/questions.json` ja `input/*/assignment.md` faile **live'is** iga API päringu juures.
- Failide uuendamiseks konteinerit **EI OLE vaja taaskäivitada**.
- Image rebuild on vajalik AINULT kui muutuvad `server.js`, `package.json`, `Dockerfile`, `public/` või `src/`.

## Deploy stsenaariumid

### 1. Ainult küsimuste/ülesannete uuendamine (`input/`)

Kõige sagedasem stsenaarium — uued küsimused või uus ülesanne:

```bash
# Lokaalselt, pärast commit + push
scp input/004/questions.json hetzner:/opt/kuldvillak/input/004/questions.json

# Tervet ülesannet (uus 005 vms)
scp -r input/005 hetzner:/opt/kuldvillak/input/
```

Kontroll:

```bash
curl -s -X POST -H "Content-Type: application/json" -d '{}' \
  https://juuksur.kalaradar.ee/api/tasks/004/questions \
  | python3 -c "import json,sys; print(len(json.load(sys.stdin).get('questions',[])))"
```

### 2. Koodi-muudatuste deploy (server.js, public/, package.json jne)

Server pole git repo, nii et `git pull` ei tööta. Variandid:

**A. Rsync (soovitatav):**

```bash
# Lokaalselt
rsync -av --delete \
  --exclude node_modules --exclude .git --exclude input \
  ./ hetzner:/opt/kuldvillak/

# Serveris: rebuild + restart
ssh hetzner "cd /opt/kuldvillak && docker compose up -d --build"
```

**B. Konkreetne fail:**

```bash
scp server.js hetzner:/opt/kuldvillak/server.js
ssh hetzner "cd /opt/kuldvillak && docker compose up -d --build"
```

> **NB:** `input/` jätta välja, et serveris olevaid kohalikke ülesandeid (kui neid on) mitte üle kirjutada.

### 3. Konteineri restart (kui server hangub)

```bash
ssh hetzner "docker compose -f /opt/kuldvillak/docker-compose.yml restart"
```

## Kontroll pärast deployd

```bash
# HTTP elamine
curl -s -o /dev/null -w "%{http_code}\n" https://juuksur.kalaradar.ee/

# Ülesannete loend
curl -s https://juuksur.kalaradar.ee/api/tasks | python3 -m json.tool

# Konteiner töötab
ssh hetzner "docker ps --filter name=kuldvillak-app --format '{{.Status}}'"

# Logid
ssh hetzner "docker logs --tail 50 kuldvillak-app"
```

## Tavaline workflow

```bash
# 1. Lokaalsed muudatused
git add ...
git commit -m "..."
git push

# 2. Live (vali stsenaarium ülevalt)
scp input/004/questions.json hetzner:/opt/kuldvillak/input/004/

# 3. Kontroll
curl -s -X POST -H "Content-Type: application/json" -d '{}' \
  https://juuksur.kalaradar.ee/api/tasks/004/questions | head -c 200
```

## Tulevikus

Praegu on deploy käsitsi. Võimalikud parandused:

- Teha `/opt/kuldvillak` git clone'iks → `ssh hetzner "cd /opt/kuldvillak && git pull"`
- GitHub Actions webhook → autodeploy main-branchi push'i peale
- Webhook + `git pull` shell-skript serveris

Esialgu pole kriitiline — küsimuste uuendamine on harv ja `scp` toimib.
