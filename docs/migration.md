# Происхождение репозитория

`dsh-trading-transaq` создан 2026-11-06 выносом DSH-плагина `dsh-ai-terminal` из
[`kmlebedev/txmlconnector`](https://github.com/kmlebedev/txmlconnector) (commit `dd38d93`,
ветка `main`).

## Что перенесено

- каталог `dsh-ai-terminal/` целиком: Host- и Client-половины плагина, тесты, ночной workflow,
  локали, иконка;
- история пути `dsh-ai-terminal` — **16 коммитов** (2026-11-05 … 2026-11-06) с сохранением
  автора, дат и сообщений; merge-коммиты PR #60/#62/#63/#64 в линейную историю не входят, их
  содержимое есть в коммитах файлов;
- два скриншота из `docs/ai-terminal/` (их использует README плагина).

Поверх истории добавлены собственные коммиты: scaffolding, split-support (поиск checkout'а
бэкенда, `repoDir`/`DSH_AI_TERMINAL_REPO_DIR`, валидация явных путей, тесты), `fix(ci)` (тесты
запускаются по явному glob `dsh-ai-terminal/test/*.test.mjs` — Node 24 не разворачивает каталог в
`node --test`) и правки по независимому ревью (P1/P2). Копия плана миграции —
[docs/plans/2026-11-06-dsh-ai-terminal-repo-migration.md](plans/2026-11-06-dsh-ai-terminal-repo-migration.md).

## Что осталось в txmlconnector

Go-бэкенд (`cmd/terminal`, `terminal/`, `native/`), переносимые навыки `skills/trading-*` и
документация `docs/ai-terminal/*`, `docs/protocol/*`. Плагин находит checkout бэкенда по
`repoDir` → `DSH_AI_TERMINAL_REPO_DIR` → walk-up от пакета → соседнему `../txmlconnector`.

## Решения

- Раскладка — monorepo-стиль: пакет сохраняет путь `dsh-ai-terminal/`, чтобы рядом могли жить
  будущие пакеты (например, `dshtrading-connector-transaq`).
- Имя пакета `@local/dsh-ai-terminal` и row id `ai-terminal` не менялись — профили DSH и
  пользовательские конфиги остаются совместимыми.
- Cutover профиля `~/.dsh` на новый checkout — отдельный шаг владельца (нужен рестарт DSH).
- LICENSE не добавлен — решение владельца репозитория.
- Cutover профиля DSH и откат описаны в [docs/cutover.md](cutover.md).

## Проверки

- до переноса на `dd38d93`: `node --test dsh-ai-terminal/test/` — 54/54 pass (Node v26.12.0);
- после переноса: `node --test dsh-ai-terminal/test/*.test.mjs` — 62/62 зелёные (54 исходных
  + 8 тестов `test/repo-dir.test.mjs`), Go/Wine не нужны;
- история: `git log --oneline` — 16 исторических коммитов, каждый содержит только пути
  `dsh-ai-terminal/`.
