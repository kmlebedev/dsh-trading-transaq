# AGENTS.md — dsh-trading-transaq

Репозиторий DSH-плагина **AI-терминал** для MOEX/TRANSAQ. Документация и отчёты — русский,
код и комментарии — английский (как в исходном `kmlebedev/txmlconnector`). Этот файл —
обязательная инструкция для агентов, работающих в этом репозитории.

## Что здесь

- `dsh-ai-terminal/` — единственный runtime-пакет: ESM `@local/dsh-ai-terminal`
  (Host+Client половины DSH-плагина, тесты `node:test`, ночной workflow, локали).
- `docs/` — скриншоты и [migration.md](docs/migration.md) (происхождение репозитория).
- Go-бэкенд (`cmd/terminal`, `terminal/`, `native/`) живёт в
  [`kmlebedev/txmlconnector`](https://github.com/kmlebedev/txmlconnector) и здесь его нет;
  контракт с бэкендом — loopback HTTP + одноразовый токен `X-Terminal-Token`.

## Проверки перед коммитом

```bash
node --test dsh-ai-terminal/test/                       # обязательно, без Go и сети
git grep -nE 'TC_PASSWORD|TC_LOGIN' -- ':!*.md'         # секретов быть не должно
```

## Жёсткие правила

- `TC_LOGIN`, `TC_PASSWORD`, номера счетов/клиентов не попадают в репозиторий, тесты, логи,
  коммиты и ответы: в коде — только `process.env`/передача явно.
- Живая торговля запрещена: терминал paper-only, live-режим чужого бэкенда — read-only.
- Не добавлять CORS, внешние порты и новые сетевые поверхности: плагин проксирует бэкенд под
  origin Harness (`/ai-terminal/`).
- Новые runtime-модули добавлять в `package.json` `files` — это проверяет
  `test/packaging.test.mjs`.
- Один коммит — одно изменение, Conventional Commits (`feat(plugin): …`, `fix(client): …`).
- Имя пакета `@local/dsh-ai-terminal` и row id `ai-terminal` менять только вместе с
  обновлением профилей DSH и `cordis.patch.yml`.
