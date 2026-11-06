# Cutover профиля DSH на новый репозиторий

Порядок важен: **сначала** новый checkout и перелинковка профиля, **только потом** merge ветки
`migration/dsh-trading-transaq` в txmlconnector (она удаляет старый каталог
`txmlconnector/dsh-ai-terminal`). До merge старая копия в `main` жива — это и есть точка отката.

## 1. Checkout'ы

```bash
git clone https://github.com/kmlebedev/dsh-trading-transaq.git ~/GolandProjects/dsh-trading-transaq
git clone https://github.com/kmlebedev/txmlconnector.git ~/GolandProjects/txmlconnector   # если ещё нет
make -C ~/GolandProjects/txmlconnector terminal                                          # bin/terminal
```

## 2. Профиль DSH (`~/.dsh/profiles/desktop`)

В `package.json`:

```json
"dependencies": {
  "@local/dsh-ai-terminal": "link:/Users/<user>/GolandProjects/dsh-trading-transaq/dsh-ai-terminal"
}
```

В `cordis.patch.yml` (строка `- id: ai-terminal`, внутри `config:`):

```yaml
repoDir: /Users/<user>/GolandProjects/txmlconnector   # только абсолютный путь: YAML не раскрывает ~ и $HOME
```

Если оба checkout'а лежат рядом (`<parent>/dsh-trading-transaq` и `<parent>/txmlconnector`),
`repoDir` можно не задавать: плагин найдёт соседний checkout. Альтернатива — env
`DSH_AI_TERMINAL_REPO_DIR` в окружении запуска Harness.

Затем:

```bash
/usr/local/bin/dsh plugin --profile desktop install   # pnpm link + install
# или: tools/dsh-plugin-enable.sh из checkout'а txmlconnector (проверяет каталог и падает, если его нет)
```

## 3. Рестарт и smoke

```bash
open -a "DeepSeek Harness"
```

Проверить: иконка «AI-терминал» в левой панели; статус бэкенда `running`, `/api/health`
отвечает; график/стакан/портфель открываются; в логах нет `did not activate @local/dsh-ai-terminal`.
Полная проверка — `node dsh-ai-terminal/test/proxy-smoke.mjs` (нужен `bin/terminal`).

## 4. Merge миграции (после успешного smoke)

```bash
# PR: https://github.com/kmlebedev/txmlconnector/compare/main...migration/dsh-trading-transaq
git -C ~/GolandProjects/txmlconnector pull --ff-only
```

## Откат

- **До merge** (старый каталог ещё в `main`): вернуть link на
  `<txmlconnector>/dsh-ai-terminal` и перезапустить DSH.
- **После merge**: восстановить плагин из истории txmlconnector и слинковать его:

  ```bash
  git -C ~/GolandProjects/txmlconnector archive dd38d93 -- dsh-ai-terminal | tar -x -C /tmp/ai-terminal-rollback
  # link: "link:/tmp/ai-terminal-rollback/dsh-ai-terminal", затем dsh plugin --profile desktop install
  ```

  Либо оставить link на новый checkout и починить `repoDir`/env.
